import { useState, useEffect } from 'react'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'
import dayjs from 'dayjs'
import { FilterModal } from './Components/FilterModal'
import { useNavigate } from 'react-router-dom'
import { FaCheck, FaXmark } from 'react-icons/fa6'
import DropDown from "./Components/DropDown"
import { FaArrowLeft, FaPause, FaPlay } from 'react-icons/fa'
import { useAuth } from '../../../context/AuthContext'

const Status = {
  pending: "Kutilmoqda",
  accepted: "Qabul qilish",
  rejected: "Rad etish"
}

const ApplicationsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState([])
  const [search, setSearch] = useState('')
  const [applicationsNextURL, setApplicationsNextURL] = useState(null)
  const [filterModal, setFilterModal] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})

  const [confirmModal, setConfirmModal] = useState(false)
  const [confirmApplication, setConfirmApplication] = useState(null)

  const fetchApplications = async (params = {}) => {
    setLoading(true)
    try {
      const { data } = await axiosAPI.get('applications/', { params })
      setApplications(data.data.results)
      setApplicationsNextURL(data.data.next)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error(error.data.error.errorMsg || 'Arizalar yuklanmadi')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterSubmit = (filters) => {
    setActiveFilters(filters)
    fetchApplications({ search, ...filters })
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchApplications({ search, ...activeFilters })
    }, 300);

    return () => clearTimeout(timeout)
  }, [search, activeFilters])

  const loadMoreApplications = () => {
    if (applicationsNextURL) {
      axiosAPI.get(applicationsNextURL)
        .then(({ data }) => {
          setApplications(prev => [...prev, ...data.data.results])
          setApplicationsNextURL(data.data.next)
        })
        .catch(error => {
          console.error('Error fetching more applications:', error)
          toast.error(error.data.error.errorMsg || 'Arizalar yuklanmadi')
        })
    }
  }

  const handleMoreApplications = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - (scrollTop + clientHeight) < 10) {
      loadMoreApplications()
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const openConfirmModal = (application, status) => {
    setConfirmModal(true)
    setConfirmApplication({ application, status })
  }

  const handleStatusChange = async () => {
    try {
      const { application, status } = confirmApplication
      if (statuses(application.status) == status) {
        toast.error("Holat o'zgarishi", 'Holat allaqachon o\'zgartirilgan')
        return
      }
      let new_status = null
      let conclusion = null
      switch (status) {
        case 'Qabul qilish':
          new_status = "accepted"
          conclusion = "Qabul qilindi"
          break
        case 'Kutilmoqda':
          new_status = "pending"
          conclusion = null
          break
        case 'Rad etish':
          new_status = "rejected"
          conclusion = "Rad etildi"
          break
        default:
          return;
      }
      await axiosAPI.patch(`applications/${application.id}/`, { status: new_status, conclusion })
      toast.success("Holat o'zgarishi", 'Holat muvaffaqiyatli o\'zgartirildi')
      setApplications(prev => prev.map(app => app.id === application.id ? { ...app, status: new_status } : app))
      setConfirmModal(false)
    } catch (error) {
      console.error(error)
      const errData = error?.response?.data?.error;

      let errMsg = "Xatolik yuz berdi";
      if (errData?.details && typeof errData.details === 'object') {
        const detailMsgs = Object.values(errData.details).flat().join(' ');
        if (detailMsgs) errMsg = detailMsgs;
      } else if (errData?.errorMsg) {
        errMsg = errData.errorMsg;
      } else if (typeof error?.response?.data === 'string') {
        errMsg = error.response.data;
      }

      toast.error('Holat o\'zgartirilmadi', errMsg);
    }
  }

  const roles = user?.active_role
  const isAuditor = roles === 'auditor'

  const statuses = (status) => {
    switch (status) {
      case 'accepted':
        return 'Qabul qilindi'
      case 'pending':
        return 'Kutilmoqda'
      case 'rejected':
        return 'Rad etildi'
      default:
        return 'Noto\'g\'ri'
    }
  }

  return (
    <>

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/60" />
          <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] p-7">
            <button onClick={() => setConfirmModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)] dark:hover:bg-[var(--bg-elevation-2)] text-[var(--text-sub)] dark:text-[var(--text-sub)] cursor-pointer  z-10">
              <FaXmark size={14} />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setConfirmModal(false)}
                className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-70 cursor-pointer"
              >
                <FaArrowLeft size={16} />
              </button>
              <h2 className="text-lg font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                {confirmApplication?.status === "Qabul qilish" ? 'Nomzodni qabul qilasizmi?' : confirmApplication.status === "Rad etish" ? "Nomzodni rad etasizmi?" : "Nomzodni kutishga qo'yasizmi?"}
              </h2>
            </div>
            <p className="text-sm text-[var(--text-soft)] dark:text-[var(--text-sub)] mb-6">
              {confirmApplication?.status === "Qabul qilish" ? 'Nomzod ishga qabul qilish jarayoniga o‘tkaziladi' : confirmApplication.status === "Rad etish" ? "Nomzod ushbu bosqichdan o‘tkazilmaydi" : "Nomzod kutishga qo'yiladi"}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium  cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]"
              >
                <FaXmark size={14} /> Bekor qilish
              </button>
              <button
                onClick={handleStatusChange}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold  cursor-pointer ${confirmApplication?.status === "Qabul qilish" ? 'bg-[var(--accent-sub)] hover:bg-[#4356a0]' : confirmApplication?.status === "Rad etish" ? 'bg-[#ff4433] hover:bg-[#c63626]' : 'bg-[var(--accent-sub)] hover:bg-[#4356a0]'} text-white`}
              >
                {confirmApplication?.status === "Qabul qilish" ? <FaCheck size={14} /> : confirmApplication?.status === "Rad etish" ? <FaXmark size={12} /> : ""}
                {confirmApplication?.status === "Qabul qilish" ? 'Qabul qilish' : confirmApplication.status === "Rad etish" ? "Rad etish" : "Kutilmoqda"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-start gap-4">
          <h1
            className="text-[var(--text-strong)] dark:text-[var(--text-strong)]"
            style={{ fontSize: 24, fontWeight: 800 }}
          >
            Arizalar
          </h1>
          <div className="flex items-center justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)] dark:text-[var(--text-soft)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Ism Sharifi bo'yicha izlash"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3 outline-none  bg-slate-100 border border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-soft)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)]"
                  style={{ fontSize: 13, fontWeight: 500, padding: '6px 12px 6px 32px', borderRadius: 12 }}
                />
              </div>
              <button
                onClick={() => setFilterModal(true)}
                className={`flex items-center justify-between gap-2 h-8 px-5 bg-slate-100 dark:bg-[var(--bg-elevation-1)] dark:text-slate-400! rounded-xl text-slate-600 text-sm font-semibold cursor-pointer relative border border-slate-200 dark:border-[var(--stroke-soft)] ${Object.keys(activeFilters).length > 0 ? 'filter-notif' : ''}`}
              >
                <img src="/imgs/filterIcon.svg" alt="" className="w-4 h-3.5 [filter:brightness(0)_saturate(100%)_invert(38%)_sepia(10%)_saturate(500%)_hue-rotate(190deg)] dark:[filter:brightness(0)_saturate(100%)_invert(70%)_sepia(10%)_saturate(300%)_hue-rotate(190deg)]" />
                Filtrlash
              </button>
            </div>
            <div className="relative group flex items-center gap-2">
              <div className="absolute right-13 top-1/2 -translate-y-1/2 z-20 w-[220px] px-4 py-3 rounded-2xl shadow-xl text-[12px] text-[var(--text-strong)] dark:text-[var(--text-strong)] bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                Arizalar tashqi platforma orqali yuboriladi va ushbu tizimda yaratilmaydi.
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-strong)] dark:bg-[var(--bg-base)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              <button className="w-7 h-7 flex items-center justify-center cursor-pointer shrink-0">
                <img src="/imgs/LeftIcon.svg" alt="info" className="w-5 h-5 dark:brightness-0 dark:invert" />
              </button>
            </div>
          </div>

          <div
            className="overflow-y-auto h-[calc(100vh-210px)] rounded-xl"
            onScroll={handleMoreApplications}
          >
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead className="sticky top-0 z-10 bg-[#F6F9FC] dark:bg-[var(--bg-elevation-1)] shadow-xs">
                <tr className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
                  <th className="px-4 py-3 text-left w-14" style={{ fontWeight: 500, color: 'var(--text-sub)' }}>
                    №
                  </th>
                  <th className="px-4 py-3 text-left" style={{ fontWeight: 500, color: 'var(--text-sub)' }}>Ism Sharifi</th>
                  <th className="px-4 py-3 text-left" style={{ fontWeight: 500, color: 'var(--text-sub)' }}>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block shrink-0" />
                      Lavozim
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right" style={{ fontWeight: 500, color: 'var(--text-sub)' }}>
                    Viloyat
                  </th>
                  <th className="px-4 py-3 text-right" style={{ fontWeight: 500, color: 'var(--text-sub)' }}>Holati</th>
                  <th className="px-4 py-3 text-right" style={{ fontWeight: 500, color: 'var(--text-sub)' }}>Yaratilgan vaqt</th>
                  <th className="px-4 py-3 text-center" style={{ fontWeight: 500, color: 'var(--text-sub)' }}>Ko'rilgan</th>
                </tr>
              </thead>
              <tbody>
                {applications?.map((application, idx) => (
                  <tr
                    key={application.id}
                    onClick={() => navigate(`/${user.active_role}/applications/detail/${application.id}`)}
                    className=" cursor-pointer border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">{application?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)] font-medium">
                      {application?.position_info.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-strong)] dark:text-[var(--text-strong)] font-medium">
                      {application?.region_info.name || '—'}
                    </td>
                    <td
                      className="px-4 py-3 flex justify-end text-[var(--text-strong)] dark:text-[var(--text-strong)] font-bold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropDown
                        options={Object.values(Status)}
                        value={statuses(application.status)}
                        onChange={(value) => openConfirmModal(application, value)}
                        width='150px'
                        disabled={isAuditor}
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-strong)] dark:text-[var(--text-strong)] font-medium">
                      {dayjs(application?.created_at).format('DD.MM.YYYY HH:mm') || '—'}
                    </td>
                    <td className='px-4 py-3 flex justify-center'>
                      <span className={`${application?.reviewed_by !== null ? 'bg-green-500' : 'bg-slate-200'} w-6 h-6 flex items-center justify-center rounded-md text-center`}>
                        {application.reviewed_by !== null ? (<FaCheck size={15} color='white' />) : ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {applications.length === 0 && !loading ? (
              <div className="py-16 text-center text-sm text-[var(--text-disabled)] dark:text-[var(--text-soft)]">Arizalar topilmadi</div>
            ) : loading ? (
              <div className="py-16 text-center text-sm text-[var(--text-disabled)] dark:text-[var(--text-soft)]">Arizalar yuklanmoqda...</div>
            ) : null}
          </div>
        </div>
      </div>

      <FilterModal
        show={filterModal}
        onClose={() => setFilterModal(false)}
        onSubmit={handleFilterSubmit}
      />

      <style>{`
        .filter-notif::after {
          content: '';
          position: absolute;
          top: 2px;
          right: 2px;
          width: 8px;
          height: 8px;
          background-color: #2196F3;
          border-radius: 50%;
        }
      `}</style>

    </>
  )
}

export default ApplicationsPage