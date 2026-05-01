import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { usePageAction } from '../../../context/PageActionContext'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'
import dayjs from 'dayjs'
import { FaFileLines } from 'react-icons/fa6'
import { CopyIcon } from '../../../components/icons'
import { Alert } from '../Components/Alert'
import { FaCheck } from 'react-icons/fa6'

const ApplicationDetail = () => {
  const { id } = useParams()
  const { registerBreadcrumb, clearBreadcrumb } = usePageAction()
  const [application, setApplication] = useState(null)
  const [copyText, setCopyText] = useState(false)
  const [loading, setLoading] = useState(true)

  const [conclusion, setConclusion] = useState(null)

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true)
        const { data } = await axiosAPI.get(`applications/${id}/`)
        const app = data?.data
        setApplication(app)
        setConclusion(app?.conclusion || '')
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

  const handleSave = async () => {
    try {
      const { data } = await axiosAPI.patch(`applications/${id}/`, { conclusion })
      setConclusion(data?.data?.conclusion)
      toast.success('Xodim hulosasi yangilandi!', 'Xodim hulosasi muvaffaqiyatli yuborildi!')
    } catch (error) {
      const errData = error?.response?.data?.error;

      // Field-level detail xatolarini chiqarish (masalan: password, name ...)
      let errMsg = "Xatolik yuz berdi" || error?.response?.data?.error?.errorMsg;
      if (errData?.details && typeof errData.details === 'object') {
        const detailMsgs = Object.values(errData.details).flat().join(' ');
        if (detailMsgs) errMsg = detailMsgs;
      } else if (errData?.errorMsg) {
        errMsg = errData.errorMsg;
      } else if (typeof error?.response?.data === 'string') {
        errMsg = error.response.data;
      }
      
      toast.error('Yangilanishda xatolik', errMsg);
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

  const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm outline-none border  bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#B6BCCB] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5] disabled:cursor-default`
  const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1'


  return (
    <>
      <div className="flex flex-col gap-2.5">
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
            <div className="relative">
              <input
                disabled
                className={inputCls}
                value={application.full_name || ''}
              />
              <button
                onClick={() => { navigator.clipboard.writeText(application.full_name); setCopyText(true) }}
                className='absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#8E95B5]'
                title="Nusxa olish"
              >
                <CopyIcon />
              </button>
            </div>
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
        <div className="grid grid-cols-2 gap-4">
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
                value={(application?.portfolio?.length < 80 ? application?.portfolio : application?.portfolio?.slice(0, 80) + '...') || 'Portfolio yuklanmagan'}
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>O'qish joyi va kursi</label>
            <textarea
              disabled
              placeholder="O'qish joyi yoki kursi ma'lumotlari"
              className={`${inputCls} h-[80px]`}
              value={application.university || ''}
            />
          </div>
          <div>
            <label className={labelCls}>Qo'shimcha ma'lumotlar yoki savollar</label>
            <textarea
              disabled
              placeholder="Qo'shimcha ma'lumot"
              className={`${inputCls} h-[80px]`}
              value={application.extra_info || ''}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 -mt-3!">
          <span className="text-[20px] font-bold dark:text-white">Xodim hulosasi</span>
          <textarea
            className={`${inputCls} h-25`}
            placeholder='Xodim hulosasini kiriting'
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
          />
          <div className="flex justify-end mt-1">
            <button
              onClick={handleSave}
              style={{ fontSize: 14, color: '#FFFFFF' }}
              className="px-4 py-2.5 rounded-xl bg-[#526ED3] font-semibold  hover:opacity-80 flex items-center gap-2 disabled:bg-gray-200! disabled:text-gray-500!"
              disabled={(conclusion === (application.conclusion || '')) || !conclusion.trim()}
            >
              <FaCheck size={15} />
              Saqlash
            </button>
          </div>
        </div>
      </div>
      <Alert
        show={copyText}
        message={'Nusxa olindi'}
        onClose={() => setCopyText(false)}
        duration={2000}
      />

      <style>{`
        body{
          overflow: hidden !important;
        }
      `}</style>
    </>
  )
}

export default ApplicationDetail