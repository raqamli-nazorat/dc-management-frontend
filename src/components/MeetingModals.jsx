import { useState, useEffect } from 'react'
import { FaCheck, FaArrowLeft } from 'react-icons/fa6'
import { axiosAPI } from '../service/axiosAPI'
import { toast } from '../Toast/ToastProvider'

// Avatar komponenti — URL bo'lsa rasm, bo'lmasa initials
function UserAvatar({ user }) {
  const [imgError, setImgError] = useState(false)
  const u = user || {}
  const initials = u.username ? u.username.slice(0, 2).toUpperCase() : 'UI'

  if (u.avatar && !imgError) {
    return (
      <img
        src={u.avatar}
        alt={u.username || 'user'}
        onError={() => setImgError(true)}
        className="w-10 h-10 rounded-full object-cover shrink-0"
      />
    )
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[#E2E6F2] dark:bg-[#333435] flex items-center justify-center text-xs font-bold text-[#5B6078] dark:text-[#C2C8E0] shrink-0">
      {initials}
    </div>
  )
}

export function MeetingAttendanceModal({ meetingId, onClose, title = "Yig'ilish", date = "" }) {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // { [attendanceId]: boolean } — original holat
  const [originalState, setOriginalState] = useState({})
  // { [attendanceId]: boolean } — joriy holat (foydalanuvchi o'zgartirgan)
  const [attendanceMap, setAttendanceMap] = useState({})
  const [dynamicTitle, setDynamicTitle] = useState(title)
  const [dynamicDate, setDynamicDate] = useState(date)

  useEffect(() => {
    setLoading(true)

    Promise.all([
      axiosAPI.get(`/meetings/${meetingId}/`),
      axiosAPI.get(`/meeting-attendance/?meeting=${meetingId}`)
    ])
      .then(([meetingRes, attendanceRes]) => {
        // Meeting ma'lumotlari — data wrapper ni hisobga olish
        const meeting = meetingRes.data?.data || meetingRes.data || {}
        if (meeting.title) setDynamicTitle(meeting.title)
        if (meeting.start_time) {
          const d = new Date(meeting.start_time)
          const day = String(d.getDate()).padStart(2, '0')
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const year = d.getFullYear()
          const hours = String(d.getHours()).padStart(2, '0')
          const mins = String(d.getMinutes()).padStart(2, '0')
          setDynamicDate(`${day}.${month}.${year} ${hours}:${mins}`)
        }

        // Attendance ma'lumotlari — data wrapper ni hisobga olish
        const raw = attendanceRes.data
        const list =
          raw?.data?.results ??
          raw?.results ??
          (Array.isArray(raw?.data) ? raw.data : null) ??
          (Array.isArray(raw) ? raw : [])

        setParticipants(list)

        // Har bir attendance uchun is_attended holatini saqlash
        const map = {}
        list.forEach(p => { map[p.id] = !!p.is_attended })
        setOriginalState(map)
        setAttendanceMap({ ...map })

        // Meeting title fallback
        if (!meeting.title && list.length > 0 && list[0].meeting_title) {
          setDynamicTitle(list[0].meeting_title)
        }
      })
      .catch(() => {
        toast.error("Xatolik", "Ma'lumotlarni yuklashda xatolik")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [meetingId])

  const toggle = (id) => {
    setAttendanceMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Faqat o'zgargan xodimlarni yuborish
      const changed = participants.filter(p => attendanceMap[p.id] !== originalState[p.id])
      const promises = changed.map(p =>
        axiosAPI.patch(`/meeting-attendance/${p.id}/`, { is_attended: attendanceMap[p.id] })
      )
      await Promise.all(promises)
      toast.success("Ishtirokchilar tasdiqlandi.", `"${dynamicTitle}" yig'ilishida qatnashganlar tasdiqlandi.`)
      onClose()
    } catch {
      toast.error("Xatolik", "Tasdiqlashda xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-[100] flex w-full sm:w-[500px] flex-col bg-[#F8F9FC] dark:bg-[#1C1D1D] shadow-2xl border-l border-[#E2E6F2] dark:border-[#292A2A] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-6  shrink-0 bg-[#F8F9FC] dark:bg-[#1C1D1D]">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#E9ECF5] dark:bg-[#292A2A] text-[#1A1D2E] dark:text-white cursor-pointer hover:bg-[#E2E6F2] dark:hover:bg-[#333435]">
          <FaArrowLeft size={14} />
        </button>
        <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Yig'ilish ishtirokchilarini belgilang</h2>
      </div>

      <div className="flex items-center justify-between px-6 mt-6 mb-3 shrink-0">
        <h3 className="text-[13px] font-extrabold text-[#1A1D2E] dark:text-white">Qatnashgan xodimlarni tanlang</h3>
        <div className="text-right">
          <p className="text-[13px] font-bold text-[#1A1D2E] dark:text-white">{dynamicTitle}</p>
          <p className="text-[11px] font-medium text-[#5B6078] dark:text-[#8E95B5] mt-0.5">{dynamicDate}</p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 flex flex-col gap-2">
        {loading ? (
          <p className="text-sm text-[#8F95A8] text-center mt-10">Yuklanmoqda...</p>
        ) : participants.length === 0 ? (
          <p className="text-sm text-[#8F95A8] text-center mt-10">Ishtirokchilar topilmadi</p>
        ) : (
          participants.map(p => {
            const checked = !!attendanceMap[p.id]
            const u = p.user_info || {}
            return (
              <div
                key={p.id}
                onClick={() => toggle(p.id)}
                className="flex items-center gap-3 px-4 py-3 bg-[#F8F9FC] dark:bg-[#252626] rounded-2xl border border-[#E2E6F2] dark:border-[#333435] cursor-pointer hover:border-[#d2d5df] dark:hover:border-[#7F95E6] transition-colors"
              >
                {/* Checkbox */}
                <div className={`w-[22px] h-[22px] rounded-md border flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-[#3F57B3] border-[#3F57B3]' : 'bg-[#F1F3F9] dark:bg-[#333435] border-[#D0D5E2] dark:border-[#474848]'}`}>
                  {checked && <FaCheck size={11} color="white" />}
                </div>

                {/* Avatar */}
                <UserAvatar user={u} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[#1A1D2E] dark:text-white truncate">{u.username || "Noma'lum"}</p>
                  <p className="text-[12px] font-medium text-[#8F95A8] dark:text-[#8E95B5] truncate mt-0.5">{u.position || 'Xodim'}</p>
                </div>

                
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 w-full px-6 py-4  flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#3F57B3] text-white text-[14px] font-bold hover:bg-[#526ED3] disabled:opacity-50 cursor-pointer transition-colors shadow-sm shadow-[#3F57B3]/30"
        >
          {saving ? 'Tasdiqlanmoqda...' : <><FaCheck size={14} /> Tasdiqlash</>}
        </button>
      </div>
    </div>
  )
}

export function MeetingAbsenceModal({ attendanceId, meetingTitle = "Yig'ilish", meetingDate = "", onClose }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!reason.trim()) return toast.error("Xatolik", "Iltimos, sababni yozing")
    setSaving(true)
    try {
      await axiosAPI.patch(`/meeting-attendance/${attendanceId}/`, { absence_reason: reason })
      toast.success("Sabab yuborildi.", "Yig'ilishga qatnashmaganligingiz sababi qabul qilindi.")
      onClose()
    } catch (err) {
      toast.error("Xatolik", "Sababni yuborishda xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-[100] flex w-full sm:w-[500px] flex-col bg-[#F8F9FC] dark:bg-[#1C1D1D] shadow-2xl border-l border-[#EEF1F7] dark:border-[#292A2A] animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[#EEF1F7] dark:border-[#292A2A] shrink-0 bg-white dark:bg-[#1C1D1D]">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F1F3F9] dark:bg-[#292A2A] text-[#1A1D2E] dark:text-white cursor-pointer hover:bg-[#E2E6F2] dark:hover:bg-[#333435]">
          <FaArrowLeft size={14} />
        </button>
        <h2 className="text-[18px] font-extrabold text-[#1A1D2E] dark:text-white">Yig'ilishga qatnashmadingiz</h2>
      </div>

      <div className="flex items-start justify-between px-6 mt-6 mb-4 shrink-0">
        <h3 className="text-[13px] font-bold text-[#1A1D2E] dark:text-white max-w-[200px] leading-tight">Yig'ilishga qatnashmaganligingiz sababini yozing</h3>
        <div className="text-right shrink-0">
           <p className="text-[13px] font-bold text-[#1A1D2E] dark:text-white">{meetingTitle}</p>
           <p className="text-[11px] font-medium text-[#8F95A8] dark:text-[#8E95B5] mt-0.5">{meetingDate}</p>
        </div>
      </div>

      <div className="px-6 flex-1">
        <textarea 
          value={reason} 
          onChange={e => setReason(e.target.value)} 
          placeholder="Sababni yozing..." 
          className="w-full h-36 px-4 py-3 bg-white dark:bg-[#252626] rounded-2xl border border-[#E2E6F2] dark:border-[#333435] text-[14px] font-medium text-[#1A1D2E] dark:text-white placeholder-[#8F95A8] resize-none outline-none focus:border-[#3F57B3]"
        />
      </div>

      <div className="absolute bottom-0 left-0 w-full px-6 py-4 bg-white dark:bg-[#1C1D1D] border-t border-[#EEF1F7] dark:border-[#292A2A] flex justify-end">
         <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#3F57B3] text-white text-[14px] font-bold hover:bg-[#526ED3] disabled:opacity-50 cursor-pointer transition-colors shadow-sm shadow-[#3F57B3]/30">
           {saving ? 'Yuborilmoqda...' : <><FaCheck size={14} /> Yuborish</>}
         </button>
      </div>
    </div>
  )
}

// open_meeting action uchun modal — user o'z izohi/sababini yozadi
export function MeetingOpenModal({ meetingId, userId, onClose }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [attendanceId, setAttendanceId] = useState(null)
  const [meetingTitle, setMeetingTitle] = useState("Yig'ilish")
  const [meetingDate, setMeetingDate] = useState('')

  useEffect(() => {
    if (!meetingId || !userId) return
    setLoading(true)

    // Meeting ma'lumotlari va user attendance id ni parallel yuklash
    Promise.all([
      axiosAPI.get(`/meetings/${meetingId}/`),
      axiosAPI.get(`/meeting-attendance/?meeting=${meetingId}&user=${userId}`)
    ])
      .then(([meetingRes, attendanceRes]) => {
        // Meeting nomi va vaqti
        const meeting = meetingRes.data?.data || meetingRes.data || {}
        if (meeting.title) setMeetingTitle(meeting.title)
        if (meeting.start_time) {
          const d = new Date(meeting.start_time)
          const day = String(d.getDate()).padStart(2, '0')
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const year = d.getFullYear()
          const hours = String(d.getHours()).padStart(2, '0')
          const mins = String(d.getMinutes()).padStart(2, '0')
          setMeetingDate(`${day}.${month}.${year} ${hours}:${mins}`)
        }

        // Attendance id ni olish
        const raw = attendanceRes.data
        const list =
          raw?.data?.results ??
          raw?.results ??
          (Array.isArray(raw?.data) ? raw.data : null) ??
          (Array.isArray(raw) ? raw : [])

        if (list.length > 0) {
          setAttendanceId(list[0].id)
          // Agar avval sabab yozilgan bo'lsa
          if (list[0].absence_reason) setReason(list[0].absence_reason)
          // Meeting title fallback
          if (!meeting.title && list[0].meeting_title) setMeetingTitle(list[0].meeting_title)
        }
      })
      .catch(() => {
        toast.error("Xatolik", "Ma'lumotlarni yuklashda xatolik")
      })
      .finally(() => setLoading(false))
  }, [meetingId, userId])

  const handleSave = async () => {
    if (!attendanceId) return toast.error("Xatolik", "Attendance ID topilmadi")
    setSaving(true)
    try {
      await axiosAPI.patch(`/meeting-attendance/${attendanceId}/`, {
        absence_reason: reason.trim() || null,
      })
      toast.success("Sabab yuborildi.", `"${meetingTitle}" yig'ilishi uchun ma'lumot yuborildi.`)
      onClose()
    } catch {
      toast.error("Xatolik", "Yuborishda xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-[100] flex w-full sm:w-[500px] flex-col bg-[#F8F9FC] dark:bg-[#1C1D1D] shadow-2xl border-l border-[#EEF1F7] dark:border-[#292A2A] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-6 ">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#E9ECF5] dark:bg-[#292A2A] text-[#1A1D2E] dark:text-white cursor-pointer hover:bg-[#E2E6F2] dark:hover:bg-[#333435]"
        >
          <FaArrowLeft size={14} />
        </button>
        <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Yig'ilishga qatnashmadingiz</h2>
      </div>

      {/* Subheader */}
      <div className="flex items-start justify-between px-6 mt-6 mb-4 shrink-0">
        <h3 className="text-[13px] font-bold text-[#1A1D2E] dark:text-white max-w-[220px] leading-tight">
          Yig'ilishga qatnashmaganligingiz sababini yozing
        </h3>
        <div className="text-right shrink-0">
          <p className="text-[13px] font-bold text-[#1A1D2E] dark:text-white">{meetingTitle}</p>
          <p className="text-[11px] font-medium text-[#8F95A8] dark:text-[#8E95B5] mt-0.5">{meetingDate}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 flex-1">
        {loading ? (
          <p className="text-sm text-[#8F95A8] text-center mt-10">Yuklanmoqda...</p>
        ) : (
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Sababni yozing..."
            className="w-full h-36 px-4 py-3 bg-white dark:bg-[#252626] rounded-2xl border border-[#E2E6F2] dark:border-[#333435] text-[14px] font-medium text-[#1A1D2E] dark:text-white placeholder-[#8F95A8] resize-none outline-none focus:border-[#3F57B3]"
          />
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 w-full px-6 py-4  flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || loading || !attendanceId}
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#3F57B3] text-white text-[14px] font-bold hover:bg-[#526ED3] disabled:opacity-50 cursor-pointer transition-colors shadow-sm shadow-[#3F57B3]/30"
        >
          {saving ? 'Yuborilmoqda...' : <><FaCheck size={14} /> Yuborish</>}
        </button>
      </div>
    </div>
  )
}
