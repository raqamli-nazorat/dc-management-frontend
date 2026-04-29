import { useState, useEffect } from 'react'
import { LuFilter } from "react-icons/lu"
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'
import dayjs from 'dayjs'
import { FilterModal } from './Components/FilterModal'
import { useNavigate } from 'react-router-dom'
import { FaCheck, FaXmark } from 'react-icons/fa6'
import DropDown from "./Components/DropDown"
import { FaArrowLeft, FaPause, FaPlay } from 'react-icons/fa'

const Status = {
  pending: "Kutilmoqda",
  accepted: "Qabul qilish",
  rejected: "Rad etish"
}

const ApplicationsPage = () => {
  const navigate = useNavigate()

  const [applications, setApplications] = useState([])
  const [search, setSearch] = useState('')
  const [applicationsNextURL, setApplicationsNextURL] = useState(null)
  const [filterModal, setFilterModal] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})

  const [confirmModal, setConfirmModal] = useState(false)
  const [confirmApplication, setConfirmApplication] = useState(null)

  const fetchApplications = async (params = {}) => {
    try {
      const { data } = await axiosAPI.get('applications/', { params })
      setApplications(data.data.results)
      setApplicationsNextURL(data.data.next)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error(error.data.error.errorMsg || 'Arizalar yuklanmadi')
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
          <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323] p-7">
            <button onClick={() => setConfirmModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:hover:bg-[#333435] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer transition-colors z-10">
              <FaXmark size={14} />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setConfirmModal(false)}
                className="text-[#1A1D2E] dark:text-[#FFFFFF] hover:opacity-70 cursor-pointer"
              >
                <FaArrowLeft size={16} />
              </button>
              <h2 className="text-lg font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">
                {confirmApplication?.status === "Qabul qilish" ? 'Nomzodni qabul qilasizmi?' : confirmApplication.status === "Rad etish" ? "Nomzodni rad etasizmi?" : "Nomzodni kutishga qo'yasizmi?"}
              </h2>
            </div>
            <p className="text-sm text-[#8F95A8] dark:text-[#C2C8E0] mb-6">
              {confirmApplication?.status === "Qabul qilish" ? 'Nomzod ishga qabul qilish jarayoniga o‘tkaziladi' : confirmApplication.status === "Rad etish" ? "Nomzod ushbu bosqichdan o‘tkazilmaydi" : "Nomzod kutishga qo'yiladi"}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]"
              >
                <FaXmark size={14} /> Bekor qilish
              </button>
              <button
                onClick={handleStatusChange}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${confirmApplication?.status === "Qabul qilish" ? 'bg-[#526ED3] hover:bg-[#4356a0]' : confirmApplication?.status === "Rad etish" ? 'bg-[#ff4433] hover:bg-[#c63626]' : 'bg-[#526ED3] hover:bg-[#4356a0]'} text-white`}
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
            className="text-[#1A1D2E] dark:text-[#FFFFFF]"
            style={{ fontSize: 24, fontWeight: 800 }}
          >
            Arizalar
          </h1>
          <div className="flex items-center gap-5">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#8E95B5]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Ism Sharifi bo'yicha izlash"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 outline-none transition-colors bg-slate-100 border border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8] dark:bg-[#222323] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5]"
                style={{ fontSize: 13, fontWeight: 500, padding: '6px 12px 6px 32px', borderRadius: 12 }}
              />
            </div>
            <button
              onClick={() => setFilterModal(true)}
              className={`flex items-center justify-between gap-2 h-8 px-5 bg-slate-100 dark:bg-[#1E2021] dark:text-slate-400! rounded-xl text-slate-600 text-sm font-semibold cursor-pointer relative border border-slate-200 dark:border-[#292A2A] ${Object.keys(activeFilters).length > 0 ? 'filter-notif' : ''}`}
            >
              <LuFilter size={16} />
              Filtrlash
            </button>
          </div>

          <div
            className="max-h-[80vh] overflow-y-auto rounded-xl"
            onScroll={handleMoreApplications}
          >
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead className="sticky top-0 z-10 bg-[#F6F9FC] dark:bg-[#191a1a] shadow-xs">
                <tr className="border-b border-[#EEF1F7] dark:border-[#292A2A]">
                  <th className="px-4 py-3 text-left w-14" style={{ fontWeight: 500, color: '#5B6078' }}>
                    №
                  </th>
                  <th className="px-4 py-3 text-left" style={{ fontWeight: 500, color: '#5B6078' }}>Ism Sharifi</th>
                  <th className="px-4 py-3 text-left" style={{ fontWeight: 500, color: '#5B6078' }}>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block shrink-0" />
                      Lavozim
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right" style={{ fontWeight: 500, color: '#5B6078' }}>
                    Viloyat
                  </th>
                  <th className="px-4 py-3 text-right" style={{ fontWeight: 500, color: '#5B6078' }}>Holati</th>
                  <th className="px-4 py-3 text-right" style={{ fontWeight: 500, color: '#5B6078' }}>Yaratilgan vaqt</th>
                  <th className="px-4 py-3 text-center" style={{ fontWeight: 500, color: '#5B6078' }}>Ko'rilgan</th>
                </tr>
              </thead>
              <tbody>
                {applications?.map((application, idx) => (
                  <tr
                    key={application.id}
                    onClick={() => navigate(`/admin/applications/detail/${application.id}`)}
                    className="transition-colors cursor-pointer border-b border-[#EEF1F7] dark:border-[#292A2A]"
                  >
                    <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{application?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-[#1A1D2E] dark:text-white font-medium">
                      {application?.position_info.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white font-medium">
                      {application?.region_info.name || '—'}
                    </td>
                    <td
                      className="px-4 py-3 flex justify-end text-[#1A1D2E] dark:text-white font-bold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropDown
                        options={Object.values(Status)}
                        value={statuses(application.status)}
                        onChange={(value) => openConfirmModal(application, value)}
                        width='150px'
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white font-medium">
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
            {applications.length === 0 && (
              <div className="py-16 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">Arizalar topilmadi</div>
            )}
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