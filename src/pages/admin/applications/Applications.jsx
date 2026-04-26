import { useState, useEffect } from 'react'
import { LuFilter } from "react-icons/lu"
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'
import dayjs from 'dayjs'
import { FilterModal } from './Modals/FilterModal'

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([])
  const [search, setSearch] = useState('')
  const [applicationsNextURL, setApplicationsNextURL] = useState(null)
  const [filterModal, setFilterModal] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})

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


  useEffect(() => {
    fetchApplications()
  }, [])

  const statuses = (status) => {
    switch (status) {
      case 'appected':
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
              className="flex items-center justify-between gap-2 h-8 px-5 bg-slate-100 rounded-xl text-slate-600 text-sm font-semibold cursor-pointer"
            >
              <LuFilter size={16} />
              Filtrlash
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto rounded-xl">
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-xs">
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
                  <th className="px-4 py-3 text-left" style={{ fontWeight: 500, color: '#5B6078' }}>
                    Viloyat
                  </th>
                  <th className="px-4 py-3 text-left" style={{ fontWeight: 500, color: '#5B6078' }}>Holati</th>
                  <th className="px-4 py-3 text-left" style={{ fontWeight: 500, color: '#5B6078' }}>Yaratilgan vaqt</th>
                </tr>
              </thead>
              <tbody>
                {applications?.map((application, idx) => (
                  <tr
                    key={application.id}
                    // onClick={() => navigate(`/admin/users/detail/${application.id}`)}
                    className="transition-colors cursor-pointer border-b border-[#EEF1F7] dark:border-[#292A2A]"
                  >
                    <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{application?.full_name || '—'}</td>
                    <td className="px-4 py-3 text-[#1A1D2E] dark:text-white" style={{ fontWeight: 500 }}>{application?.position_info.name || '—'}</td>
                    <td className="px-4 py-3 text-left text-[#1A1D2E] dark:text-white" style={{ fontWeight: 500 }}>
                      {application?.region_info.name || '—'}
                    </td>
                    <td
                      className="px-4 py-3 text-left text-[#1A1D2E] dark:text-white"
                      style={{ fontWeight: 800 }}
                    >
                      {statuses(application?.status)}
                    </td>
                    <td
                      className="px-4 py-3 text-left text-[#1A1D2E] dark:text-white"
                      style={{ fontWeight: 500 }}
                    >
                      {dayjs(application?.birth_date).format('DD.MM.YYYY')}
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

    </>
  )
}

export default ApplicationsPage
