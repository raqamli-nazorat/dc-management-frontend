import { useState } from 'react'
import { FaXmark } from 'react-icons/fa6'
import {
  InformationCircleIcon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  PencilEdit02Icon,
  Calendar03Icon,
  LockIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { toast } from '../../../Toast/ToastProvider'
import { getFullMeetingUrl } from '../utils/meetingCode'

export default function MeetingDetailsDrawer({
  isOpen,
  onClose,
  meetingDetails,
  meetingState,
  meetingId,
  projectData,
}) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedUid, setCopiedUid] = useState(false)

  const fullUrl = getFullMeetingUrl(meetingId, meetingDetails?.uid)
  const displayUrl = fullUrl ? fullUrl.replace(/^https?:\/\//, '') : `raqamli-boshqaruv.uz/meetings/${meetingDetails?.uid ? String(meetingDetails.uid).toLowerCase() : meetingId}`

  const uid = meetingDetails?.uid || (meetingId ? `MT-${String(meetingId).padStart(4, '0')}` : 'MT-0005')
  const title = meetingDetails?.title || meetingState?.title || projectData?.title || "Yig'ilish"

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        setCopiedLink(true)
        toast.success('Nusxa olindi', "Yig'ilish havolasi nusxalandi")
        setTimeout(() => setCopiedLink(false), 2000)
      }).catch(() => {
        toast.error('Xatolik', 'Havolani nusxalashda xatolik yuz berdi')
      })
    }
  }

  const handleCopyUid = () => {
    if (uid && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(uid).then(() => {
        setCopiedUid(true)
        toast.success('Nusxa olindi', `UID nusxalandi: ${uid}`)
        setTimeout(() => setCopiedUid(false), 2000)
      }).catch(() => {})
    }
  }

  const formatStartTime = (iso, duration) => {
    let dateStr = 'Rejalashtirilgan'
    if (iso) {
      try {
        const d = new Date(iso)
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0')
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const year = d.getFullYear()
          const hours = String(d.getHours()).padStart(2, '0')
          const mins = String(d.getMinutes()).padStart(2, '0')
          dateStr = `${day}.${month}.${year} ${hours}:${mins}`
        }
      } catch {
        dateStr = iso
      }
    } else {
      const now = new Date()
      const day = String(now.getDate()).padStart(2, '0')
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const year = now.getFullYear()
      const hours = String(now.getHours()).padStart(2, '0')
      const mins = String(now.getMinutes()).padStart(2, '0')
      dateStr = `${day}.${month}.${year} ${hours}:${mins}`
    }

    if (duration) {
      return `${dateStr}, ${duration} daqiqa`
    }
    return dateStr
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 backdrop-blur-xs z-30 sm:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Meeting Details Drawer Panel matching Figma screenshots */}
      <div
        className={`fixed sm:relative top-0 right-0 bottom-0 sm:top-auto sm:right-auto sm:bottom-auto h-full rounded-none sm:rounded-3xl bg-white dark:bg-[#0B0D11] shadow-[0_10px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex flex-col shrink-0 z-40 sm:z-auto overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] ${
          isOpen
            ? 'w-full sm:w-[340px] md:w-[360px] opacity-100 pointer-events-auto sm:ml-3 md:ml-4 p-4 sm:p-5 translate-x-0 border-l sm:border border-slate-200/90 dark:border-white/10'
            : 'w-0 opacity-0 pointer-events-none sm:ml-0 p-0 translate-x-full sm:translate-x-0 border-0'
        }`}
      >
        <div className="w-full sm:w-[308px] md:w-[320px] h-full flex flex-col shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0 pb-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EAF0F8] dark:bg-[#18202D] text-[#3E5CBA] dark:text-[#8E9DB7] flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={InformationCircleIcon} size={22} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight select-none">
                  Yig'ilish tafsilotlari
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 select-none">
                  Havola va rasmiy ma'lumotlar
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1E232D] hover:bg-slate-200 dark:hover:bg-[#282F3D] text-slate-500 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors active:scale-90"
              title="Yopish"
            >
              <FaXmark size={14} />
            </button>
          </div>

          {/* Body */}
          <div
            className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-3.5 mt-3.5"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#94A3B8 transparent' }}
          >
            {/* Card 1: Qo'shilish ma'lumotlari */}
            <div className="p-3.5 sm:p-4 rounded-3xl border border-slate-200/70 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#12161F]">
              {/* Card 1 Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase select-none">
                  QO'SHILISH MA'LUMOTLARI
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EAEFF7] dark:bg-[#1E2634] text-[11px] font-semibold text-slate-700 dark:text-slate-300 select-none">
                  Yig'ilish havolasi
                </span>
              </div>

              {/* URL Box */}
              <div className="mt-3 p-3 rounded-2xl bg-white dark:bg-[#0B0D11] border border-slate-200/80 dark:border-white/5 flex items-center gap-2.5 shadow-xs">
                <HugeiconsIcon icon={copiedLink ? CheckmarkCircle01Icon : Copy01Icon} size={17} onClick={handleCopyLink} strokeWidth={2} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5 cursor-pointer hover:scale-110" />
                <span className="text-xs sm:text-[13px] font-bold text-[#2D56B3] dark:text-[#3E6EC6] break-all leading-snug select-all">
                  {displayUrl}
                </span>
              </div>
            </div>

            {/* Helper Text under Card 1 */}
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed px-1 select-none">
              Havolani boshqa ishtirokchilarga yuborib, ularni yig'ilishga taklif qilishingiz mumkin.
            </p>

            {/* Card 2: Yig'ilish parametrlari */}
            <div className="p-3.5 sm:p-4 rounded-3xl border border-slate-200/70 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#12161F] space-y-2.5">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block px-1 select-none">
                YIG'ILISH PARAMETRLARI
              </span>

              {/* Row 1: Rasmiy UID */}
              <div className="bg-white dark:bg-[#0B0D11] border border-slate-200/60 dark:border-white/5 p-2.5 sm:p-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#EAF0F8] dark:bg-[#18202D] text-[#3E5CBA] dark:text-[#8E9DB7] flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={InformationCircleIcon} size={18} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                      Rasmiy UID
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate font-mono">
                      {uid}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer transition-colors"
                  title="UID nusxalash"
                >
                  <HugeiconsIcon icon={copiedUid ? CheckmarkCircle01Icon : Copy01Icon} size={16} strokeWidth={2} />
                </button>
              </div>

              {/* Row 2: Yig'ilish mavzusi */}
              <div className="bg-white dark:bg-[#0B0D11] border border-slate-200/60 dark:border-white/5 p-2.5 sm:p-3 rounded-2xl flex items-center gap-2.5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[#EAF0F8] dark:bg-[#18202D] text-[#3E5CBA] dark:text-[#8E9DB7] flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={PencilEdit02Icon} size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                    Yig'ilish mavzusi
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {title}
                  </div>
                </div>
              </div>

              {/* Row 3: Boshlanish vaqti */}
              <div className="bg-white dark:bg-[#0B0D11] border border-slate-200/60 dark:border-white/5 p-2.5 sm:p-3 rounded-2xl flex items-center gap-2.5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[#EAF0F8] dark:bg-[#18202D] text-[#3E5CBA] dark:text-[#8E9DB7] flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={Calendar03Icon} size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                    Boshlanish vaqti
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {formatStartTime(meetingDetails?.start_time, meetingDetails?.duration_minutes)}
                  </div>
                </div>
              </div>

              {/* Row 4: Xavfsizlik va kirish */}
              <div className="bg-white dark:bg-[#0B0D11] border border-slate-200/60 dark:border-white/5 p-2.5 sm:p-3 rounded-2xl flex items-center gap-2.5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-[#EAF0F8] dark:bg-[#18202D] text-[#3E5CBA] dark:text-[#8E9DB7] flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={LockIcon} size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                    Xavfsizlik va kirish
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {meetingDetails?.requires_approval
                      ? "Tashkilotchi tasdig'i bilan"
                      : "To'g'ridan-to'g'ri ulanish"}
                  </div>
                </div>
              </div>

              {/* Row 5: Tavsif (agar mavjud bo'lsa) */}
              {meetingDetails?.description && (
                <div className="bg-white dark:bg-[#0B0D11] border border-slate-200/60 dark:border-white/5 p-2.5 sm:p-3 rounded-2xl shadow-xs space-y-1">
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                    Tavsif
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {meetingDetails.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
