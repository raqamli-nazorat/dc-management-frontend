import { useState, useEffect } from 'react'
import { axiosAPI } from '../../../../service/axiosAPI'
import { toast } from '../../../../Toast/ToastProvider'
import dayjs from 'dayjs'
import { usePageAction } from '../../../../context/PageActionContext'
import CreatePosition from './CreatePosition'

const ApplicationsPage = () => {
  const { registerAction, clearAction } = usePageAction()
  const [applications, setApplications] = useState([])
  const [search, setSearch] = useState('')

  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    registerAction({
      label: "Lavozim qo'shish",
      icon: <img src="/imgs/user-square.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setShowAdd(true),
    })
    return () => clearAction()
  }, [])

  const fetchApplications = async (params = {}) => {
    try {
      const { data } = await axiosAPI.get('applications/positions/', { params })
      setApplications(data.data.results)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error(error.data.error.errorMsg || 'Arizalar yuklanmadi')
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchApplications({ search })
    }, 300);

    return () => clearTimeout(timeout)
  }, [search])

  const handleIsApplication = async (id) => {
    try {
      await axiosAPI.patch(`applications/positions/${id}/`, { is_application: !applications.find(item => item.id === id).is_application })
      toast.success('Lavozim yangilandi')
      fetchApplications()
    } catch (error) {
      console.error(error)
      const errData = error?.response?.data?.error;

      // Field-level detail xatolarini chiqarish (masalan: password, name ...)
      let errMsg = "Xatolik yuz berdi";
      if (errData?.details && typeof errData.details === 'object') {
        const detailMsgs = Object.values(errData.details).flat().join(' ');
        if (detailMsgs) errMsg = detailMsgs;
      } else if (errData?.errorMsg) {
        errMsg = errData.errorMsg;
      } else if (typeof error?.response?.data === 'string') {
        errMsg = error.response.data;
      }

      toast.error(errMsg);
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-start gap-4">
          <h1
            className="text-[#1A1D2E] dark:text-[#FFFFFF]"
            style={{ fontSize: 24, fontWeight: 800 }}
          >
            Lavozimlar
          </h1>
          <div className="flex items-center gap-5">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#8E95B5]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Qidirish..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 outline-none transition-colors bg-slate-100 border border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8] dark:bg-[#222323] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5]"
                style={{ fontSize: 13, fontWeight: 500, padding: '6px 12px 6px 32px', borderRadius: 12 }}
              />
            </div>
          </div>

          <div className="max-h-[80vh] overflow-y-auto rounded-xl">
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead className="sticky top-0 z-10 bg-[#F6F9FC] dark:bg-[#191a1a] shadow-xs">
                <tr className="border-b border-[#EEF1F7] dark:border-[#292A2A]">
                  <th className="px-4 py-3 text-left w-14" style={{ fontWeight: 500, color: '#5B6078' }}>
                    №
                  </th>
                  <th className="w-[300px]" style={{ fontWeight: 500, color: '#5B6078' }}>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block shrink-0" />
                      Lavozim
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left" style={{ fontWeight: 500, color: '#5B6078' }}>Yaratilgan vaqt</th>
                  <th className="px-4 py-3 text-right" style={{ fontWeight: 500, color: '#5B6078' }}>Ariza uchun ishlatilsinmi?</th>
                </tr>
              </thead>
              <tbody>
                {applications?.map((application, idx) => (
                  <tr
                    key={application.id}
                    // onClick={() => navigate(`/admin/applications/position/detail/${application.id}`)}
                    className="transition-colors cursor-pointer border-b border-[#EEF1F7] dark:border-[#292A2A]"
                  >
                    <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{idx + 1}</td>
                    <td className="px-4 py-3 text-[#1A1D2E] dark:text-white font-medium">
                      {application?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-left text-[#1A1D2E] dark:text-white font-medium">
                      {dayjs(application?.created_at).format('DD.MM.YYYY HH:mm') || '—'}
                    </td>
                    <td className='flex justify-end pr-6 py-3' onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleIsApplication(application?.id)}
                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${application?.is_application ? 'bg-[#3F57B3]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}
                      >
                        <span
                          className={`absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${application?.is_application ? 'translate-x-5' : 'translate-x-0.5'}`}
                        />
                      </button>
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

      {showAdd &&
        <CreatePosition
          onClose={() => setShowAdd(false)}
          refetch={fetchApplications}
        />
      }
    </>
  )
}

export default ApplicationsPage