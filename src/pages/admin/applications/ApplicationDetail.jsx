import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { usePageAction } from '../../../context/PageActionContext'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'
import dayjs from 'dayjs'
import { FaFileLines } from 'react-icons/fa6'
import { CopyIcon } from '../../../components/icons'
import { Alert } from '../Components/Alert'

const ApplicationDetail = () => {
  const { id } = useParams()
  const user = JSON.parse(localStorage.getItem("user"))
  const { registerBreadcrumb, clearBreadcrumb } = usePageAction()
  const [application, setApplication] = useState(null)
  const [copyText, setCopyText] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true)
        const { data } = await axiosAPI.get(`applications/${id}/`)
        const app = data?.data
        setApplication(app)
        if (app?.full_name) {
          registerBreadcrumb(app.full_name)
        }
      } catch (error) {
        console.error('Error fetching application:', error)
        toast.error(error?.data?.error?.errorMsg || 'Ariza yuklanmadi')
      } finally {
        setLoading(false)
      }
    }

    fetchApplication()

    return () => {
      clearBreadcrumb()
    }
  }, [id])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#3F57B3] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="py-16 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">
        Ariza topilmadi
      </div>
    )
  }

  const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm outline-none border transition-colors bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#B6BCCB] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5] disabled:cursor-default`
  const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1'


  return (
    <>
      <div className="flex flex-col gap-3">
        <h1
          className="text-[#1A1D2E] dark:text-white"
          style={{ fontSize: 24, fontWeight: 800 }}
        >
          Ma'lumotlar
        </h1>

        {/* Detail content will go here */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Ism Sharifi</label>
            <input
              disabled
              className={inputCls}
              value={application.full_name || ''}
            />
          </div>
          <div>
            <label className={labelCls}>Tug'ilgan sana</label>
            <input
              disabled
              className={inputCls}
              value={dayjs(application.birth_date).format("DD.MM.YYYY") || ''}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Telefon raqami</label>
            <div className="relative">
              <input
                disabled
                className={inputCls}
                value={application.phone || ''}
              />
              <button
                onClick={() => { navigator.clipboard.writeText(application.phone); setCopyText(true) }}
                className='absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#8E95B5]'
                title="Nusxa olish"
              >
                <CopyIcon />
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Telegram</label>
            <div className="relative">
              <input
                disabled
                className={inputCls}
                value={application.telegram || ''}
              />
              <button
                onClick={() => { navigator.clipboard.writeText(application.telegram); setCopyText(true) }}
                className='absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#8E95B5]'
                title="Nusxa olish"
              >
                <CopyIcon />
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Lavozim</label>
            <input
              disabled
              className={inputCls}
              value={application.position_info?.name || ''}
            />
          </div>
          <div>
            <label className={labelCls}>Viloyat</label>
            <input
              disabled
              className={inputCls}
              value={application.region_info?.name || ''}
            />
          </div>
          <div>
            <label className={labelCls}>Holati</label>
            <input
              disabled
              className={inputCls}
              value={statuses(application.status) || ''}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Rezyume (CV)</label>
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm bg-white border-[#E2E6F2] text-[#5B6078] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#C2C8E0]"
            >
              <FaFileLines size={14} className="shrink-0" />
              <a
                href={application?.resume} target="_blank" rel="noreferrer" className="border-none font-semibold text-center cursor-pointer">
                {application?.resume?.split('/').pop().split("?")[0] || 'Fayl yuklanmagan'}
              </a>
            </div>
          </div>
          <div>
            <label className={labelCls}>Loyiha manzili</label>
            <div className="relative">
              <input
                disabled
                className={`${inputCls} underline`}
                value={(application?.portfolio.length < 80 ? application?.portfolio : application.portfolio.slice(0, 80) + '...') || 'Portfolio yuklanmagan'}
              />
              <button
                onClick={() => { navigator.clipboard.writeText(application.portfolio); setCopyText(true) }}
                className='absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#8E95B5]'
                title="Nusxa olish"
              >
                <CopyIcon />
              </button>
            </div>
          </div>
        </div>
        <div>
          <label className={labelCls}>O'qish joyi va kursi</label>
          <textarea
            disabled
            className={`${inputCls} h-25`}
            value={application.university || ''}
          />
        </div>

        {user?.roles?.map((role) => (role.includes('admin') || role.includes('manager'))) && (
          <div className="flex flex-col gap-3">
            <span className="text-[20px] font-bold">Xodim hulosasi</span>
            <textarea
              className={`${inputCls} h-[120px]`}
              placeholder='Xodim hulosasini kiriting'
              value={application.conclusion || ''}
            />
          </div>
        )}
      </div>
      <Alert
        show={copyText}
        message={'Nusxa olindi'}
        onClose={() => setCopyText(false)}
        duration={2000}
      />
    </>
  )
}

export default ApplicationDetail