import { useState, useEffect } from 'react'
import { FaXmark } from 'react-icons/fa6'
import { LuFilter } from 'react-icons/lu'
import { usePageAction } from '../../../context/PageActionContext'
import { axiosAPI } from '../../../service/axiosAPI'
import { fmt, EMPTY_FILTER } from './payments/constants'
import SorovModal from './payments/modals/SorovModal'
import XarajatDetailModal from './payments/modals/XarajatDetailModal'
import FilterModal from './payments/modals/FilterModal'

// ── API functions ──────────────────────────────────────────────
async function fetchPayments(filters = {}) {
  const params = {}
  if (filters.type)    params.type    = filters.type
  if (filters.toifa)   params.toifa   = filters.toifa
  if (filters.loyiha)  params.loyiha  = filters.loyiha
  if (filters.sumFrom) params.sum_from = filters.sumFrom.replace(/\s/g, '')
  if (filters.sumTo)   params.sum_to   = filters.sumTo.replace(/\s/g, '')
  if (filters.dateFromD) params.created_from = filters.dateFromD + (filters.dateFromT ? 'T' + filters.dateFromT : '')
  if (filters.dateToD)   params.created_to   = filters.dateToD   + (filters.dateToT   ? 'T' + filters.dateToT   : '')
  if (filters.approvedFromD) params.approved_from = filters.approvedFromD + (filters.approvedFromT ? 'T' + filters.approvedFromT : '')
  if (filters.approvedToD)   params.approved_to   = filters.approvedToD   + (filters.approvedToT   ? 'T' + filters.approvedToT   : '')
  if (filters.completedFromD) params.completed_from = filters.completedFromD + (filters.completedFromT ? 'T' + filters.completedFromT : '')
  if (filters.completedToD)   params.completed_to   = filters.completedToD   + (filters.completedToT   ? 'T' + filters.completedToT   : '')
  if (filters.myTasks) params.my_tasks = true

  const res = await axiosAPI.get('/payments/', { params })
  return res.data
}

async function createPayment(data) {
  const payload = {
    loyiha:     data.loyiha,
    type:       data.type,
    toifa:      data.toifa,
    amount:     Number(data.amount.replace(/\s/g, '')),
    sabab:      data.sabab,
    tolov_turi: data.tolovTuri,
    karta:      data.karta || null,
  }
  const res = await axiosAPI.post('/payments/', payload)
  return res.data
}

async function deletePayments(ids) {
  await Promise.all([...ids].map(id => axiosAPI.delete(`/payments/${id}/`)))
}

async function markPaid(id) {
  const res = await axiosAPI.patch(`/payments/${id}/`, { active: true })
  return res.data
}

// ── Main Page ──────────────────────────────────────────────────
export default function PaymentsPage() {
  const { registerAction, clearAction } = usePageAction()

  const [payments, setPayments]       = useState([])
  const [loading, setLoading]         = useState(false)
  const [search, setSearch]           = useState('')
  const [showFilter, setShowFilter]   = useState(false)
  const [showSorov, setShowSorov]     = useState(false)
  const [filters, setFilters]         = useState(EMPTY_FILTER)
  const [selecting, setSelecting]     = useState(false)
  const [selected, setSelected]       = useState(new Set())
  const [toast, setToast]             = useState(null)
  const [detailPayment, setDetailPayment] = useState(null)

  const hasFilter = Object.values(filters).some(v => v && v !== false)

  // ── Load data ──
  const loadPayments = async (activeFilters = filters) => {
    setLoading(true)
    try {
      const data = await fetchPayments(activeFilters)
      // API massiv yoki { results: [...] } qaytarishi mumkin
      setPayments(Array.isArray(data) ? data : (data.results ?? []))
    } catch (err) {
      console.error('Payments fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [])

  useEffect(() => {
    registerAction({
      label: "So'rov",
      icon: <img src="/imgs/moneysendflow.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setShowSorov(true),
    })
    return () => clearAction()
  }, [registerAction, clearAction])

  // ── Helpers ──
  const showToast = (title, msg) => {
    setToast({ title, msg })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Client-side search filter ──
  const filtered = payments.filter(p => {
    const q = search.toLowerCase()
    return !q || (p.name ?? '').toLowerCase().includes(q)
  })

  const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id))
  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const s = new Set(prev); filtered.forEach(p => s.delete(p.id)); return s })
    else             setSelected(prev => { const s = new Set(prev); filtered.forEach(p => s.add(p.id));    return s })
  }
  const toggleOne = (id) => setSelected(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s
  })

  // ── Actions ──
  const handleApplyFilter = async (f) => {
    setFilters(f)
    setShowFilter(false)
    await loadPayments(f)
  }

  const handleSubmitSorov = async (data) => {
    try {
      const created = await createPayment(data)
      setPayments(prev => [created, ...prev])
      setShowSorov(false)
      showToast("So'rov yuborildi", "So'rovingiz muvaffaqiyatli yuborildi va ko'rib chiqish uchun qabul qilindi.")
    } catch (err) {
      console.error('Create payment error:', err)
      showToast("Xatolik", "So'rov yuborishda xatolik yuz berdi.")
    }
  }

  const handleDelete = async () => {
    try {
      await deletePayments(selected)
      setPayments(prev => prev.filter(p => !selected.has(p.id)))
      showToast("O'chirildi", "Tanlangan so'rovlar o'chirildi.")
    } catch (err) {
      console.error('Delete error:', err)
      showToast("Xatolik", "O'chirishda xatolik yuz berdi.")
    } finally {
      setSelecting(false)
      setSelected(new Set())
    }
  }

  const handlePaid = async (id) => {
    try {
      const updated = await markPaid(id)
      setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))
      showToast("To'lov qilindi", "Xarajat so'rovi muvaffaqiyatli to'landi.")
    } catch (err) {
      console.error('Mark paid error:', err)
      showToast("Xatolik", "To'lovda xatolik yuz berdi.")
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-start gap-3 p-4 rounded-2xl shadow-xl w-[340px]
          bg-white border border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
          <img src="/imgs/Union.svg" alt="" className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">{toast.title}</p>
            <p className="text-[13px] text-[#8F95A8] dark:text-[#8E95B5] mt-1 leading-snug">{toast.msg}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] cursor-pointer shrink-0">
            <FaXmark size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">Xarajat so'rovlari</h1>
        {selecting ? (
          <button onClick={() => { setSelecting(false); setSelected(new Set()) }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[13px] font-extrabold transition-colors cursor-pointer
              bg-[#DADFF0] text-[#1A1D2E] dark:bg-[#3A3B3B] dark:text-white">
            <FaXmark size={13} />
            Bekor qilish
          </button>
        ) : (
          <button onClick={() => setSelecting(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[13px] font-extrabold transition-colors cursor-pointer
              bg-[#DADFF0] text-[#1A1D2E] dark:bg-[#3A3B3B] dark:text-white">
            <img src="/imgs/checkIcon.svg" alt="" className="w-4 h-4 dark:brightness-0 dark:invert" />
            Tanlash
          </button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#C2C8E0]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Ism Sharifi bo'yicha izlash"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none transition-colors w-[240px]
              bg-[#F1F3F9] border border-[#E2E6F2] text-[#8F95A8] placeholder-[#8F95A8] focus:border-[#526ED3]
              dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#C2C8E0]"
          />
        </div>
        <button onClick={() => setShowFilter(true)}
          className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border transition-colors cursor-pointer
            bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078]
            dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
          <LuFilter size={13} />
          Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]" />}
        </button>
      </div>

      {/* Table */}
      <div className="border-y border-[#E2E6F2] dark:border-[#292A2A] overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">Yuklanmoqda...</div>
        ) : (
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
                {selecting && (
                  <th className="w-10 px-4 py-3 text-left">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="cursor-pointer accent-[#3F57B3]" />
                  </th>
                )}
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] w-10">№</th>
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Ism Sharifi</th>
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Xarajat turi</th>
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Toifa</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Loyiha</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Summa (UZS)</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Yaratilgan vaqt</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">To'langan vaqt</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Tasdiqlangan vaqt</th>
                <th className="px-4 py-3 text-center font-medium text-[#5B6078] sticky right-0
                  bg-[#F8F9FC] border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#474848] dark:text-[#C2C8E0]">
                  Holat
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr
                  key={p.id}
                  onClick={() => selecting ? toggleOne(p.id) : setDetailPayment(p)}
                  className="border-b border-[#EEF1F7] dark:border-[#292A2A] transition-colors last:border-0 cursor-pointer hover:bg-black/3 dark:hover:bg-white/3"
                >
                  {selecting && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} className="cursor-pointer accent-[#3F57B3]" />
                    </td>
                  )}
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-[#FFFFFF]">{p.name}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{p.type}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{p.toifa}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{p.loyiha}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(p.amount)}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{p.created}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{p.approved}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{p.completed}</td>
                  <td className="px-4 py-3 text-center sticky right-0 bg-[#F8F9FC] dark:bg-[#191A1A]">
                    {p.active
                      ? <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                      : <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#E02D2D]">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">Ma'lumot topilmadi</div>
        )}
      </div>

      {/* Selection bar */}
      {selecting && selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl
          bg-white border border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
          <span className="text-sm text-[#5B6078] dark:text-[#C2C8E0] mr-1">{selected.size} ta tanlandi</span>
          <button onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
              bg-[#FFF2F2] text-[#E02D2D] hover:bg-[#F8D7DA]
              dark:bg-[#E02D2D]/10 dark:text-[#FA5252] dark:hover:bg-[#E02D2D]/20">
            O'chirish
          </button>
        </div>
      )}

      {/* Modals */}
      {showFilter && (
        <FilterModal
          initial={filters}
          onClose={() => setShowFilter(false)}
          onApply={handleApplyFilter}
        />
      )}

      {showSorov && (
        <SorovModal
          onClose={() => setShowSorov(false)}
          onSubmit={handleSubmitSorov}
        />
      )}

      {detailPayment && (
        <XarajatDetailModal
          payment={detailPayment}
          onClose={() => setDetailPayment(null)}
          onPaid={handlePaid}
        />
      )}
    </div>
  )
}
