import { useState, useEffect } from 'react'
import { FaXmark } from 'react-icons/fa6'
import { LuFilter } from 'react-icons/lu'
import { usePageAction } from '../../../context/PageActionContext'
import { useAuth } from '../../../context/AuthContext'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'
import { fmt, fmtDate, typeLabel, statusLabel, statusColor, EMPTY_FILTER } from './payments/constants'
import SorovModal from './payments/modals/SorovModal'
import XarajatDetailModal from './payments/modals/XarajatDetailModal'
import FilterModal from './payments/modals/FilterModal'
import EmptyState from '../../../components/EmptyState'
import { getErrorMessage } from '../../../service/getErrorMessage'

// ── API ──────────────────────────────────────────────────────
function buildParams(filters, search, forceMyRequests) {
  const p = {}
  if (search)                          p.search           = search
  if (filters.type)                    p.type             = filters.type
  if (filters.status)                  p.status           = filters.status
  if (filters.expense_category)        p.expense_category = filters.expense_category
  if (filters.project)                 p.project          = filters.project
  if (filters.amount__gte)             p.amount__gte      = filters.amount__gte
  if (filters.amount__lte)             p.amount__lte      = filters.amount__lte

  if (filters.created_at__date__gte) {
    p.created_at__gte = filters.created_at__time__gte
      ? `${filters.created_at__date__gte}T${filters.created_at__time__gte}:00`
      : `${filters.created_at__date__gte}T00:00:00`
  }
  if (filters.created_at__date__lte) {
    p.created_at__lte = filters.created_at__time__lte
      ? `${filters.created_at__date__lte}T${filters.created_at__time__lte}:59`
      : `${filters.created_at__date__lte}T23:59:59`
  }
  if (filters.paid_at__date__gte) {
    p.paid_at__gte = filters.paid_at__time__gte
      ? `${filters.paid_at__date__gte}T${filters.paid_at__time__gte}:00`
      : `${filters.paid_at__date__gte}T00:00:00`
  }
  if (filters.paid_at__date__lte) {
    p.paid_at__lte = filters.paid_at__time__lte
      ? `${filters.paid_at__date__lte}T${filters.paid_at__time__lte}:59`
      : `${filters.paid_at__date__lte}T23:59:59`
  }
  if (filters.confirmed_at__date__gte) {
    p.confirmed_at__gte = filters.confirmed_at__time__gte
      ? `${filters.confirmed_at__date__gte}T${filters.confirmed_at__time__gte}:00`
      : `${filters.confirmed_at__date__gte}T00:00:00`
  }
  if (filters.confirmed_at__date__lte) {
    p.confirmed_at__lte = filters.confirmed_at__time__lte
      ? `${filters.confirmed_at__date__lte}T${filters.confirmed_at__time__lte}:59`
      : `${filters.confirmed_at__date__lte}T23:59:59`
  }

  // forceMyRequests=true → employee: faqat o'ziniki
  // forceMyRequests=false → admin/manager/accountant: hammasi (my_requests parametri yuborilmaydi)
  // filters.my_requests → admin/manager o'zlari qo'lda "faqat o'ziniki" filtri qo'ysa
  if (forceMyRequests) {
    p.my_requests = true
  } else if (filters.my_requests) {
    p.my_requests = true
  }

  return p
}

async function apiGetPayments(filters, search, forceMyRequests) {
  const res = await axiosAPI.get('/expense-request/', { params: buildParams(filters, search, forceMyRequests) })
  const payload = res.data?.data ?? res.data
  return Array.isArray(payload) ? payload : (payload.results ?? [])
}

async function apiCreatePayment(body) {
  const res = await axiosAPI.post('/expense-request/', body)
  return res.data?.data ?? res.data
}

async function apiDeletePayment(id) {
  await axiosAPI.delete(`/expense-request/${id}/`)
}

async function apiMarkPaid(id) {
  const res = await axiosAPI.post(`/expense-request/${id}/pay/`, {})
  return res.data?.data ?? res.data
}

async function apiConfirm(id) {
  const res = await axiosAPI.post(`/expense-request/${id}/confirm/`, {})
  return res.data?.data ?? res.data
}

async function apiCancel(id) {
  const res = await axiosAPI.post(`/expense-request/${id}/cancel/`, {})
  return res.data?.data ?? res.data
}

async function apiGetCategories() {
  const res = await axiosAPI.get('/expense-category/')
  const payload = res.data?.data ?? res.data
  return Array.isArray(payload) ? payload : (payload.results ?? [])
}

async function apiGetProjects() {
  const res = await axiosAPI.get('/projects/')
  const payload = res.data?.data ?? res.data
  return Array.isArray(payload) ? payload : (payload.results ?? [])
}

// ── Main Page ────────────────────────────────────────────────
export default function PaymentsPage() {
  const { registerAction, clearAction } = usePageAction()
  const { user } = useAuth()

  // ── Rol aniqlash ──
  const roles        = user?.roles ?? []
  const isEmployee   = roles.includes('employee')
  const isManager    = roles.includes('manager')
  const isAdmin      = roles.includes('admin') || roles.includes('superadmin')
  const isAccountant = roles.includes('accountant')

  // employee → my_requests=true majburiy; qolganlar → false (hammasi ko'rinadi)
  const forceMyRequests = isEmployee && !isManager && !isAdmin && !isAccountant

  // So'rov yuborish: admin, manager, employee (accountant emas)
  const canSendRequest = isAdmin || isManager || isEmployee

  // Tanlash/o'chirish: faqat o'z so'rovlarini o'chirishi mumkin bo'lganlar
  // (admin ham o'z so'rovlarini o'chira oladi, lekin boshqalarnikini emas — backend hal qiladi)
  const canSelect = isAdmin || isManager || isEmployee

  const [payments, setPayments]           = useState([])
  const [categories, setCategories]       = useState([])
  const [projects, setProjects]           = useState([])
  const [loading, setLoading]             = useState(false)
  const [search, setSearch]               = useState('')
  const [filters, setFilters]             = useState(EMPTY_FILTER)
  const [showFilter, setShowFilter]       = useState(false)
  const [showSorov, setShowSorov]         = useState(false)
  const [selecting, setSelecting]         = useState(false)
  const [selected, setSelected]           = useState(new Set())
  const [detailPayment, setDetailPayment] = useState(null)

  const hasFilter = Object.entries(filters).some(([, v]) => v && v !== false)

  const loadPayments = async (f = filters, q = search) => {
    setLoading(true)
    try {
      const data = await apiGetPayments(f, q, forceMyRequests)
      setPayments(data)
    } catch (err) {
      console.error(err)
      toast.error(getErrorMessage(err, "Ma'lumotlarni yuklashda xatolik yuz berdi."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
    apiGetCategories().then(setCategories).catch(console.error)
    apiGetProjects().then(setProjects).catch(console.error)
  }, [])

  useEffect(() => {
    if (!canSendRequest) return
    registerAction({
      label: "So'rov",
      icon: <img src="/imgs/moneysendflow.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setShowSorov(true),
    })
    return () => clearAction()
  }, [registerAction, clearAction])

  const allSelected = payments.length > 0 && payments.every(p => selected.has(p.id))
  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const s = new Set(prev); payments.forEach(p => s.delete(p.id)); return s })
    else             setSelected(prev => { const s = new Set(prev); payments.forEach(p => s.add(p.id)); return s })
  }
  const toggleOne = (id) => setSelected(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s
  })

  const handleSearch = (e) => {
    const val = e.target.value
    setSearch(val)
    loadPayments(filters, val)
  }

  const handleApplyFilter = async (f) => {
    setFilters(f)
    setShowFilter(false)
    await loadPayments(f, search)
  }

  const handleSubmitSorov = async (body) => {
    try {
      const created = await apiCreatePayment(body)
      setPayments(prev => [created, ...prev])
      setShowSorov(false)
      toast.success("So'rov yuborildi", "So'rovingiz muvaffaqiyatli yuborildi.")
    } catch (err) {
      console.error(err)
      toast.error(getErrorMessage(err, "So'rov yuborishda xatolik yuz berdi."))
    }
  }

  const handleDelete = async () => {
    try {
      await Promise.all([...selected].map(id => apiDeletePayment(id)))
      setPayments(prev => prev.filter(p => !selected.has(p.id)))
      toast.delete(`${selected.size} ta so'rov o'chirildi.`)
    } catch (err) {
      console.error(err)
      toast.error(getErrorMessage(err, "O'chirishda xatolik yuz berdi."))
    } finally {
      setSelecting(false)
      setSelected(new Set())
    }
  }

  const handlePaid = async (id) => {
    try {
      const updated = await apiMarkPaid(id)
      setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updated, status: 'paid' } : p))
      toast.success("To'lov qilindi", "Xarajat so'rovi muvaffaqiyatli to'landi.")
    } catch (err) {
      toast.error(getErrorMessage(err, "To'lovda xatolik yuz berdi."))
    }
  }

  const handleConfirm = async (id) => {
    try {
      const updated = await apiConfirm(id)
      setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updated, status: 'confirmed' } : p))
      toast.success("Tasdiqlandi", "Xarajat so'rovi muvaffaqiyatli tasdiqlandi.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Tasdiqlashda xatolik yuz berdi."))
    }
  }

  const handleCancel = async (id) => {
    try {
      const updated = await apiCancel(id)
      setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updated, status: 'cancelled' } : p))
      toast.success("Bekor qilindi", "Xarajat so'rovi bekor qilindi.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Bekor qilishda xatolik yuz berdi."))
    }
  }

  const thCls = 'px-4 py-3 font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]'

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">

      {/* ── Yuqori qism ── */}
      <div className="shrink-0 bg-[#F8F9FC] dark:bg-[#191A1A]">

        {/* Sarlavha */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">Xarajat so'rovlari</h1>
          {canSelect && (
            selecting ? (
              <button onClick={() => { setSelecting(false); setSelected(new Set()) }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[13px] font-extrabold transition-colors cursor-pointer
                  bg-[#DADFF0] text-[#1A1D2E] dark:bg-[#3A3B3B] dark:text-white">
                <FaXmark size={13} /> Bekor qilish
              </button>
            ) : (
              <button onClick={() => setSelecting(true)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[13px] font-extrabold transition-colors cursor-pointer
                  bg-[#DADFF0] text-[#1A1D2E] dark:bg-[#3A3B3B] dark:text-white">
                <img src="/imgs/checkIcon.svg" alt="" className="w-4 h-4 dark:brightness-0 dark:invert" />
                Tanlash
              </button>
            )
          )}
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#C2C8E0]"
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Qidirish" value={search}
              onChange={handleSearch}
              className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none transition-colors w-[240px]
                bg-[#F1F3F9] border border-[#E2E6F2] text-[#8F95A8] placeholder-[#8F95A8] focus:border-[#526ED3]
                dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#C2C8E0]" />
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
      </div>

      {/* ── Jadval ── */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">Yuklanmoqda...</div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon="/imgs/xarajatlarIcon.svg"
            title="So'rovlar yo'q"
            description="Hozircha hech qanday xarajat so'rovi mavjud emas"
          />
        ) : (
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] dark:bg-[#191A1A]">
              <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
                {canSelect && selecting && (
                  <th className="w-10 px-4 py-3 text-left bg-[#F8F9FC] dark:bg-[#191A1A]">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="cursor-pointer accent-[#3F57B3]" />
                  </th>
                )}
                <th className={`${thCls} text-left w-10 bg-[#F8F9FC] dark:bg-[#191A1A]`}>№</th>
                <th className={`${thCls} text-left bg-[#F8F9FC] dark:bg-[#191A1A]`}>Xodim</th>
                <th className={`${thCls} text-left bg-[#F8F9FC] dark:bg-[#191A1A]`}>Xarajat turi</th>
                <th className={`${thCls} text-left bg-[#F8F9FC] dark:bg-[#191A1A]`}>Toifa</th>
                <th className={`${thCls} text-right bg-[#F8F9FC] dark:bg-[#191A1A]`}>Summa (UZS)</th>
                <th className={`${thCls} text-right bg-[#F8F9FC] dark:bg-[#191A1A]`}>Yaratilgan</th>
                <th className={`${thCls} text-right bg-[#F8F9FC] dark:bg-[#191A1A]`}>To'langan</th>
                <th className={`${thCls} text-right bg-[#F8F9FC] dark:bg-[#191A1A]`}>Tasdiqlangan</th>
                <th className={`${thCls} text-left bg-[#F8F9FC] dark:bg-[#191A1A]`}>Loyiha</th>
                <th className={`${thCls} text-center sticky right-0 bg-[#F8F9FC] dark:bg-[#191A1A]`}>Holat</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, idx) => (
                <tr key={p.id}
                  onClick={() => canSelect && selecting ? toggleOne(p.id) : setDetailPayment(p)}
                  className="border-b border-[#EEF1F7] dark:border-[#292A2A] transition-colors last:border-0 cursor-pointer hover:bg-black/3 dark:hover:bg-white/3">
                  {canSelect && selecting && (
                    <td className="px-4 py-3 w-10" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} className="cursor-pointer accent-[#3F57B3]" />
                    </td>
                  )}
                  <td className="px-4 py-3 w-10 text-[#1A1D2E] dark:text-[#FFFFFF]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-[#FFFFFF]">{p.user_info?.username ?? ''}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{typeLabel(p.type)}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{p.expense_category_info?.title ?? ''}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(p.amount)}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{fmtDate(p.created_at)}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{fmtDate(p.paid_at)}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{fmtDate(p.confirmed_at)}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{p.project_info?.title ?? ''}</td>
                  <td className="px-4 py-3 text-center sticky right-0 bg-[#F8F9FC] dark:bg-[#191A1A]">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Selection bar */}
      {canSelect && selecting && selected.size > 0 && (
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
        <FilterModal initial={filters} categories={categories} projects={projects}
          onClose={() => setShowFilter(false)} onApply={handleApplyFilter} />
      )}
      {canSendRequest && showSorov && (
        <SorovModal categories={categories} projects={projects}
          onClose={() => setShowSorov(false)} onSubmit={handleSubmitSorov} />
      )}
      {detailPayment && (
        <XarajatDetailModal
          payment={detailPayment}
          onClose={() => setDetailPayment(null)}
          onPaid={isAccountant ? handlePaid : null}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
