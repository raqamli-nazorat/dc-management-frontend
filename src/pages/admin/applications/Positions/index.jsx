import { useState, useEffect } from 'react'
import { axiosAPI } from '../../../../service/axiosAPI'
import { toast } from '../../../../Toast/ToastProvider'
import dayjs from 'dayjs'
import { usePageAction } from '../../../../context/PageActionContext'
import { useAuth } from '../../../../context/AuthContext'
import CreatePosition from './CreatePosition'
import { FaCheck } from 'react-icons/fa'
import { ConfirmationModal } from '../../../../components/ConfirmationModal'

const ApplicationsPage = () => {
  const { registerAction, clearAction } = usePageAction()
  const { user } = useAuth()
  const isAuditor = user?.active_role === 'auditor' || (user?.roles?.includes('auditor') && !user?.active_role)
  const [applications, setApplications] = useState([])
  const [search, setSearch] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (isAuditor) return
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
      setShowConfirm(false)
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
            className="text-[var(--text-strong)] dark:text-[var(--text-strong)]"
            style={{ fontSize: 24, fontWeight: 800 }}
          >
            Lavozimlar
          </h1>
          <div className="flex items-center gap-5">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)] dark:text-[var(--text-soft)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Izlash..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 outline-none  bg-slate-100 border border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-soft)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)]"
                style={{ fontSize: 13, fontWeight: 500, padding: '6px 12px 6px 32px', borderRadius: 12 }}
              />
            </div>
          </div>

          <div className="overflow-y-auto h-[80vh] rounded-xl">
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead className="sticky top-0 z-10 bg-[#F6F9FC] dark:bg-[var(--bg-elevation-1)] shadow-xs">
                <tr className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
                  <th className="px-4 py-3 text-left w-14" style={{ fontWeight: 500, color: 'var(--text-sub)' }}>
                    №
                  </th>
                  <th className="w-[300px]" style={{ fontWeight: 500, color: 'var(--text-sub)' }}>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block shrink-0" />
                      Lavozim
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left" style={{ fontWeight: 500, color: 'var(--text-sub)' }}>Yaratilgan vaqt</th>
                  <th className="px-4 py-3 text-right" style={{ fontWeight: 500, color: 'var(--text-sub)' }}>Ariza uchun ishlatilsinmi?</th>
                </tr>
              </thead>
              <tbody>
                {applications?.map((application, idx) => (
                  <tr
                    key={application.id}
                    // onClick={() => navigate(`/admin/applications/position/detail/${application.id}`)}
                    className=" cursor-pointer border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">{idx + 1}</td>
                    <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)] font-medium">
                      {application?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-left text-[var(--text-strong)] dark:text-[var(--text-strong)] font-medium">
                      {dayjs(application?.created_at).format('DD.MM.YYYY HH:mm') || '—'}
                    </td>
                    <td className='flex justify-end pr-6 py-3' onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setShowConfirm(application)}
                        className={`relative w-10 h-5 rounded-full  cursor-pointer ${application?.is_application ? 'bg-[var(--accent-strong)]' : 'bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)]'}`}
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
              <div className="py-16 text-center text-sm text-[var(--text-disabled)] dark:text-[var(--text-soft)]">Arizalar topilmadi</div>
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

      <ConfirmationModal
        title={!showConfirm?.is_application ? "Arizalar uchun qo‘llashni tasdiqlaysizmi?" : "Arizalar uchun qo‘llashni bekor qilishni tasdiqlaysizmi?"}
        description={!showConfirm?.is_application ? "Ushbu sozlama yoqilgandan so‘ng, tanlangan parametrlar arizalarga ham qo‘llaniladi." : "Ushbu sozlama o'chirilgandan so‘ng, tanlangan parametrlar arizalarga qo'shilmaydi."}
        onClose={() => setShowConfirm(false)}
        onAction={() => handleIsApplication(showConfirm?.id)}
        buttonText={!showConfirm?.is_application ? "Qo'shish" : "Bekor qilish"}
        confirmIcon={<FaCheck size={14} />}
        confirmColor="bg-[var(--accent-sub)] hover:bg-[#4356a0]"
        showModal={showConfirm}
      />
    </>
  )
}

export default ApplicationsPage