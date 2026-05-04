import { useState, useEffect, useRef } from 'react'
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

// ── Timezone offset helper ───────────────────────────────────
// ── Datetime helper ──────────────────────────────────────────
// API kutayotgan format: 2026-04-27T22:52:05.977018+05:00
function toIsoWithOffset(date, time, isEnd = false) {
  if (!date) return null
  const t = time || (isEnd ? '23:59' : '00:00')
  const secs = isEnd ? '59' : '00'
  // Mahalliy timezone offset ni olish
  const now = new Date()
  const offsetMin = -now.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const absMin = Math.abs(offsetMin)
  const hh = String(Math.floor(absMin / 60)).padStart(2, '0')
  const mm = String(absMin % 60).padStart(2, '0')
  const offset = `${sign}${hh}:${mm}`
  // microseconds qo'shish (API talab qiladi)
  return `${date}T${t}:${secs}.000000${offset}`
}

// ── API ──────────────────────────────────────────────────────
function buildParams(filters, search, forceMyRequests) {
  const p = {}
  if (search) p.search = search
  if (filters.type)             p.type             = filters.type
  if (filters.status)           p.status           = filters.status
  if (filters.expense_category) p.expense_category = filters.expense_category
  if (filters.project)          p.project          = filters.project
  if (filters.amount__gte)      p.amount__gte      = filters.amount__gte
  if (filters.amount__lte)      p.amount__lte      = filters.amount__lte

  const cGte = toIsoWithOffset(filters.created_at__date__gte, filters.created_at__time__gte, false)
  const cLte = toIsoWithOffset(filters.created_at__date__lte, filters.created_at__time__lte, true)
  if (cGte) p.created_at__gte = cGte
  if (cLte) p.created_at__lte = cLte

  const pGte = toIsoWithOffset(filters.paid_at__date__gte, filters.paid_at__time__gte, false)
  const pLte = toIsoWithOffset(filters.paid_at__date__lte, filters.paid_at__time__lte, true)
  if (pGte) p.paid_at__gte = pGte
  if (pLte) p.paid_at__lte = pLte

  const cfGte = toIsoWithOffset(filters.confirmed_at__date__gte, filters.confirmed_at__time__gte, false)
  const cfLte = toIsoWithOffset(filters.confirmed_at__date__lte, filters.confirmed_at__time__lte, true)
  if (cfGte) p.confirmed_at__gte = cfGte
  if (cfLte) p.confirmed_at__lte = cfLte

  if (forceMyRequests || filters.my_requests) p.my_requests = true

  return p
}

async function apiGetPayments(filters, search, forceMyRequests, page = 1) {
  const res = await axiosAPI.get('/expense-request/', {
    params: { ...buildParams(filters, search, forceMyRequests), page, page_size: 20 }
  })
  const payload = res.data?.data ?? res.data
  if (Array.isArray(payload)) return { results: payload, next: null, count: payload.length }
  return { results: payload.results ?? [], next: payload.next ?? null, count: payload.count ?? 0 }
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

async function apiCancel(id, cancelReason) {
  const res = await axiosAPI.post(`/expense-request/${id}/cancel/`, { cancel_reason: cancelReason })
  return res.data?.data ?? res.data
}

async function apiGetPaymentDetail(id) {
  const res = await axiosAPI.get(`/expense-request/${id}/`)
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
  const roles = user?.roles ?? []
  const activeRole = user?.active_role
  const isEmployee = roles.includes('employee')
  const isManager = roles.includes('manager')
  const isAdmin = roles.includes('admin') || roles.includes('superadmin')
  const isAccountant = roles.includes('accountant')
  const isAuditor = activeRole === 'auditor' || (roles.includes('auditor') && !activeRole)

  // employee → my_requests=true majburiy; qolganlar → false (hammasi ko'rinadi)
  const forceMyRequests = isEmployee && !isManager && !isAdmin && !isAccountant

  // So'rov yuborish: admin, manager, employee (accountant va auditor emas)
  const canSendRequest = !isAuditor && (isAdmin || isManager || isEmployee)

  // Tanlash/o'chirish: faqat o'z so'rovlarini o'chirishi mumkin bo'lganlar
  // (admin ham o'z so'rovlarini o'chira oladi, lekin boshqalarnikini emas — backend hal qiladi)
  const canSelect = !isAuditor && (isAdmin || isManager || isEmployee)

  const [payments, setPayments] = useState([])
  const [categories, setCategories] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTER)
  const [showFilter, setShowFilter] = useState(false)
  const [showSorov, setShowSorov] = useState(false)
  const [detailPayment, setDetailPayment] = useState(null)
  const scrollRef = useRef(null)

  const hasFilter = Object.entries(filters).some(([, v]) => v && v !== false)

  const loadPayments = async (f = filters, q = search, pg = 1) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const { results, next } = await apiGetPayments(f, q, forceMyRequests, pg)
      setPayments(prev => pg === 1 ? results : [...prev, ...results])
      setHasMore(!!next)
      setPage(pg)
    } catch (err) {
      console.error(err)
      toast.error(getErrorMessage(err, "Ma'lumotlarni yuklashda xatolik yuz berdi."))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Scroll listener
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60 && hasMore && !loadingMore) {
        loadPayments(filters, search, page + 1)
      }
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, page, filters, search])

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



  const handleSearch = (e) => {
    const val = e.target.value
    setSearch(val)
    loadPayments(filters, val, 1)
  }

  const handleApplyFilter = async (f) => {
    setFilters(f)
    setShowFilter(false)
    await loadPayments(f, search, 1)
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


  const handlePaid = async (id) => {
    try {
      const updated = await apiMarkPaid(id)
      setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updated, status: 'paid' } : p))
      toast.success("To'lov qayd etildi", "Mablag' berilgani tizimda belgilandi.")
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

  const handleCancel = async (id, cancelReason) => {
    try {
      const updated = await apiCancel(id, cancelReason)
      setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updated, status: 'cancelled' } : p))
      toast.error("So'rov rad etildi", "So'rov bo'yicha rad etish sababi saqlandi.")
    } catch (err) {
      toast.error(getErrorMessage(err, "Rad etishda xatolik yuz berdi."))
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
              className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none  w-[240px]
                bg-[#F1F3F9] border border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8] focus:border-[#526ED3]
                dark:bg-[#222323] dark:border-[#474848] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]" />
          </div>
          <button onClick={() => setShowFilter(true)}
            className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border  cursor-pointer
              bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078]
              dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
            <LuFilter size={13} />
            Filtrlash
            {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]" />}
          </button>
        </div>
      </div>

      {/* ── Jadval ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-auto">
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
                  onClick={() => {
                    apiGetPaymentDetail(p.id)
                      .then(detail => setDetailPayment(detail))
                      .catch(() => setDetailPayment(p))
                  }}
                  className="group border-b border-[#EEF1F7] dark:border-[#292A2A]  last:border-0 cursor-pointer hover:bg-black/3 dark:hover:bg-white/3">
                  <td className="px-4 py-3 w-10 text-[#1A1D2E] dark:text-[#FFFFFF]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-[#FFFFFF]">{p.user_info?.username ?? ''}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{typeLabel(p.type)}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{p.expense_category_info?.title ?? ''}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(p.amount)}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{fmtDate(p.created_at)}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{fmtDate(p.paid_at)}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{fmtDate(p.confirmed_at)}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{p.project_info?.title ?? ''}</td>
                  <td className="px-4 py-3 text-center sticky right-0 bg-[#F8F9FC] dark:bg-[#191A1A] 
                  group-hover:bg-[#F0F1F5] dark:group-hover:bg-[#202221] ">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {loadingMore && (
          <div className="py-4 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">
            <svg className="animate-spin inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Yuklanmoqda...
          </div>
        )}
      </div>

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
