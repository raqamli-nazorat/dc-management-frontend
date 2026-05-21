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
    <div className="w-10 h-10 rounded-full bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)] flex items-center justify-center text-xs font-bold text-[var(--text-sub)] dark:text-[var(--text-sub)] shrink-0">
      {initials}
    </div>
  )
}

// Titul raqamini nusxa olish komponenti
function TitulCopy({ uid }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(uid).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 group cursor-pointer w-fit"
      title="Nusxa olish"
    >
      <span className="text-[9px] font-semibold text-[#1A1D2E] dark:text-[var(--text-soft)] group-hover:text-[var(--accent-sub)] transition-colors">
        {uid}
      </span>
      {copied ? (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="text-[#1A1D2E] group-hover:text-[var(--accent-sub)] transition-colors">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
     
    </button>
  )
}

export function MeetingAttendanceModal({ meetingId, onClose, title = "Yig'ilish", date = "", closeMeetingOnSave = false }) {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [originalState, setOriginalState] = useState({})
  const [attendanceMap, setAttendanceMap] = useState({})
  const [dynamicTitle, setDynamicTitle] = useState(title)
  const [dynamicDate, setDynamicDate] = useState(date)
  const [dynamicUid, setDynamicUid] = useState('')
  const [dynamicProjectTitle, setDynamicProjectTitle] = useState('')

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    setLoading(true)

    Promise.all([
      axiosAPI.get(`/meetings/${meetingId}/`),
      axiosAPI.get(`/meeting-attendance/?meeting=${meetingId}`)
    ])
      .then(([meetingRes, attendanceRes]) => {
        const meeting = meetingRes.data?.data || meetingRes.data || {}
        if (meeting.title) setDynamicTitle(meeting.title)
        if (meeting.uid) setDynamicUid(meeting.uid)
        // Loyiha nomi — project_info yoki project_title
        const projTitle = meeting.project_info?.title || meeting.project_title || ''
        if (projTitle) setDynamicProjectTitle(projTitle)

        if (meeting.start_time) {
          const d = new Date(meeting.start_time)
          const day = String(d.getDate()).padStart(2, '0')
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const year = d.getFullYear()
          const hours = String(d.getHours()).padStart(2, '0')
          const mins = String(d.getMinutes()).padStart(2, '0')
          setDynamicDate(`${day}.${month}.${year} ${hours}:${mins}`)
        }

        const raw = attendanceRes.data
        const list =
          raw?.data?.results ??
          raw?.results ??
          (Array.isArray(raw?.data) ? raw.data : null) ??
          (Array.isArray(raw) ? raw : [])

        setParticipants(list)

        const map = {}
        list.forEach(p => { map[p.id] = !!p.is_attended })
        setOriginalState(map)
        setAttendanceMap({ ...map })

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

      // Agar yakunlash rejimida bo'lsa — meetni tugatish
      if (closeMeetingOnSave) {
        try {
          await axiosAPI.post(`/meetings/${meetingId}/close/`)
        } catch (closeErr) {
          // Agar allaqachon yopilgan bo'lsa (400/409) — xatoni e'tiborsiz qoldiramiz
          const status = closeErr?.response?.status
          if (status !== 400 && status !== 409) {
            toast.error("Xatolik", "Yig'ilishni yakunlashda xatolik yuz berdi")
            setSaving(false)
            return
          }
        }
        toast.success("Yig'ilish yakunlandi", `"${dynamicTitle}" yig'ilishi yakunlandi va davomat saqlandi.`)
      } else {
        toast.success("Ishtirokchilar tasdiqlandi.", `"${dynamicTitle}" yig'ilishida qatnashganlar tasdiqlandi.`)
      }

      onClose()
    } catch {
      toast.error("Xatolik", "Davomatni saqlashda xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-[9999999] flex w-full sm:w-[500px] flex-col bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-elevation-1)] shadow-2xl border-l border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-6  shrink-0 bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-elevation-1)]">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-elevation-2)] dark:bg-[var(--bg-elevation-2)] text-[var(--text-strong)] dark:text-[var(--text-strong)] cursor-pointer hover:bg-[var(--stroke-sub)] dark:hover:bg-[var(--bg-elevation-2)]">
          <FaArrowLeft size={14} />
        </button>
        <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Yig'ilish ishtirokchilarini belgilang</h2>
      </div>

      <div className="flex items-center justify-between px-6 mt-4 mb-3 shrink-0">
        {/* titul */}
        <div className="flex flex-col gap-0.5">
          {dynamicUid && (
            <TitulCopy uid={dynamicUid} />
          )}
          <h3 className="text-[13px] font-[500] text-[#1A1D2E] dark:text-[var(--text-strong)]">
            {dynamicTitle}
          </h3>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-[11px] font-medium text-[var(--text-sub)] dark:text-[var(--text-soft)] mt-0.5">{dynamicDate}</p>
        </div>
      </div>

      <div className="px-6 mb-3 shrink-0">
        <p className="text-[13px] font-extrabold text-[#1A1D2E] dark:text-[var(--text-strong)]">Qatnashgan xodimlarni tanlang</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 flex flex-col gap-2">
        {loading ? (
          <p className="text-sm text-[var(--text-soft)] text-center mt-10">Yuklanmoqda...</p>
        ) : participants.length === 0 ? (
          <p className="text-sm text-[var(--text-soft)] text-center mt-10">Ishtirokchilar topilmadi</p>
        ) : (
          participants.map(p => {
            const checked = !!attendanceMap[p.id]
            const u = p.user_info || {}
            return (
              <div
                key={p.id}
                onClick={() => toggle(p.id)}
                className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-elevation-2)] rounded-2xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-sub)] cursor-pointer hover:border-[#d2d5df] dark:hover:border-[#7F95E6] transition-colors"
              >
                {/* Checkbox */}
                <div className={`w-[22px] h-[22px] rounded-md border flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-[var(--accent-strong)] border-[var(--accent-strong)]' : 'bg-[#F1F3F9] dark:bg-[var(--bg-elevation-2)] border-[var(--stroke-strong)] dark:border-[var(--stroke-sub)]'}`}>
                  {checked && <FaCheck size={11} color="white" />}
                </div>

                {/* Avatar */}
                <UserAvatar user={u} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)] truncate">{u.username || "Noma'lum"}</p>
                  <p className="text-[12px] font-medium text-[var(--text-soft)] dark:text-[var(--text-soft)] truncate mt-0.5">{u.position || 'Xodim'}</p>
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
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[var(--accent-strong)] text-white text-[14px] font-bold hover:bg-[var(--accent-sub)] disabled:opacity-50 cursor-pointer transition-colors shadow-sm shadow-[var(--accent-strong)]/30"
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

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

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
    <div className="fixed inset-y-0 right-0 z-[100] flex w-full sm:w-[500px] flex-col bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-elevation-1)] shadow-2xl border-l border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] shrink-0 bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)]">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F1F3F9] dark:bg-[var(--bg-elevation-2)] text-[var(--text-strong)] dark:text-[var(--text-strong)] cursor-pointer hover:bg-[var(--stroke-sub)] dark:hover:bg-[var(--bg-elevation-2)]">
          <FaArrowLeft size={14} />
        </button>
        <h2 className="text-[18px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Yig'ilishga qatnashmadingiz</h2>
      </div>

      <div className="flex items-start justify-between px-6 mt-6 mb-4 shrink-0">
        <h3 className="text-[13px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)] max-w-[200px] leading-tight">Yig'ilishga qatnashmaganligingiz sababini yozing</h3>
        <div className="text-right shrink-0">
           <p className="text-[13px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">{meetingTitle}</p>
           <p className="text-[11px] font-medium text-[var(--text-soft)] dark:text-[var(--text-soft)] mt-0.5">{meetingDate}</p>
        </div>
      </div>

      <div className="px-6 flex-1">
        <textarea 
          value={reason} 
          onChange={e => setReason(e.target.value)} 
          placeholder="Sababni yozing..." 
          className="w-full h-36 px-4 py-3 bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-2)] rounded-2xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-sub)] text-[14px] font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-sub)] resize-none outline-none focus:border-[var(--accent-strong)]"
        />
      </div>

      <div className="absolute bottom-0 left-0 w-full px-6 py-4 bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] border-t border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] flex justify-end">
         <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[var(--accent-strong)] text-white text-[14px] font-bold hover:bg-[var(--accent-sub)] disabled:opacity-50 cursor-pointer transition-colors shadow-sm shadow-[var(--accent-strong)]/30">
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
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

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
    <div className="fixed inset-y-0 right-0 z-[100] flex w-full sm:w-[500px] flex-col bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-elevation-1)] shadow-2xl border-l border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-6 ">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-elevation-2)] dark:bg-[var(--bg-elevation-2)] text-[var(--text-strong)] dark:text-[var(--text-strong)] cursor-pointer hover:bg-[var(--stroke-sub)] dark:hover:bg-[var(--bg-elevation-2)]"
        >
          <FaArrowLeft size={14} />
        </button>
        <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Yig'ilishga qatnashmadingiz</h2>
      </div>

      {/* Subheader */}
      <div className="flex items-start justify-between px-6 mt-6 mb-4 shrink-0">
        <h3 className="text-[13px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)] max-w-[220px] leading-tight">
          Yig'ilishga qatnashmaganligingiz sababini yozing
        </h3>
        <div className="text-right shrink-0">
          <p className="text-[13px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">{meetingTitle}</p>
          <p className="text-[11px] font-medium text-[var(--text-soft)] dark:text-[var(--text-soft)] mt-0.5">{meetingDate}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 flex-1">
        {loading ? (
          <p className="text-sm text-[var(--text-soft)] text-center mt-10">Yuklanmoqda...</p>
        ) : (
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Sababni yozing..."
            className="w-full h-36 px-4 py-3 bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-2)] rounded-2xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-sub)] text-[14px] font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-sub)] resize-none outline-none focus:border-[var(--accent-strong)]"
          />
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 w-full px-6 py-4  flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || loading || !attendanceId}
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[var(--accent-strong)] text-white text-[14px] font-bold hover:bg-[var(--accent-sub)] disabled:opacity-50 cursor-pointer transition-colors shadow-sm shadow-[var(--accent-strong)]/30"
        >
          {saving ? 'Yuborilmoqda...' : <><FaCheck size={14} /> Yuborish</>}
        </button>
      </div>
    </div>
  )
}

// open_attendance action uchun modal — sabab ko'rish va tasdiqlash
export function AttendanceExcuseModal({ attendanceId, onClose }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState(null)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    if (!attendanceId) return
    setLoading(true)
    axiosAPI.get(`/meeting-attendance/${attendanceId}/`)
      .then(res => {
        const d = res.data?.data ?? res.data
        setData(d)
      })
      .catch(() => {
        toast.error("Xatolik", "Ma'lumotlarni yuklashda xatolik")
        onClose()
      })
      .finally(() => setLoading(false))
  }, [attendanceId])

  const fmtDate = (iso) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
    } catch { return '' }
  }

  const handleExcuse = async (isExcused) => {
    setSaving(true)
    try {
      await axiosAPI.patch(`/meeting-attendance/${attendanceId}/`, { is_excused: isExcused })
      if (isExcused) {
        toast.success("Sabab tasdiqlandi", "Xodimning sababi tasdiqlandi.")
      } else {
        toast.error("Sababsiz belgilandi", "Xodim sababsiz qatnashmagan deb belgilandi.")
      }
      onClose()
    } catch {
      toast.error("Xatolik", "Saqlashda xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  // Meeting sana/vaqtini meeting_info dan olish
  const meetingTitle = data?.meeting_title || "Yig'ilish"
  const meetingDate = data?.meeting_start_time ? fmtDate(data.meeting_start_time) : ''
  const absenceReason = data?.absence_reason || ''
  const username = data?.user_info?.username || ''
  const position = data?.user_info?.position || ''

  return (
    <div className="fixed inset-y-0 right-0 z-[100] flex w-full sm:w-[500px] flex-col bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-elevation-1)] shadow-2xl border-l border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-6 shrink-0">
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-elevation-2)] dark:bg-[var(--bg-elevation-2)] text-[var(--text-strong)] dark:text-[var(--text-strong)] cursor-pointer hover:bg-[var(--stroke-sub)] dark:hover:bg-[var(--bg-elevation-2)]">
          <FaArrowLeft size={14} />
        </button>
        <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">
          Yig'ilishga qatnashmaslik sababi
        </h2>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <svg className="animate-spin w-6 h-6 text-[var(--accent-sub)]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      ) : (
        <>
          {/* Meeting info */}
          <div className="flex items-start justify-between px-6 mb-4 shrink-0">
            <div className="flex flex-col gap-0.5">
              {username && (
                <p className="text-[13px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">{username}</p>
              )}
              {position && (
                <p className="text-[11px] text-[var(--text-soft)] dark:text-[var(--text-soft)]">{position}</p>
              )}
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="text-[13px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">{meetingTitle}</p>
              {meetingDate && (
                <p className="text-[11px] font-medium text-[var(--text-sub)] dark:text-[var(--text-soft)] mt-0.5">{meetingDate}</p>
              )}
            </div>
          </div>

          {/* Sabab matni */}
          <div className="px-6 flex-1">
            <textarea
              readOnly
              value={absenceReason || "Sabab ko'rsatilmagan"}
              className="w-full h-36 px-4 py-3 bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-2)] rounded-2xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-sub)] text-[14px] font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)] resize-none outline-none cursor-default"
            />
          </div>

          {/* Footer — Sababsiz / Sababli */}
          <div className="absolute bottom-0 left-0 w-full px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={() => handleExcuse(false)}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--error-sub)] text-white text-[14px] font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Sababsiz
            </button>
            <button
              onClick={() => handleExcuse(true)}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#22c55e] text-white text-[14px] font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer transition-colors"
            >
              <FaCheck size={13} />
              Sababli
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Tizim xabari modali — "Parolingizni yangilang" va shunga o'xshash system notificationlar
export function SystemNotifModal({ title, message, date, onClose, onBack }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-y-0 right-0 z-[100] flex w-full sm:w-[500px] flex-col bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-elevation-1)] shadow-2xl border-l border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-6 shrink-0">
        <button
          onClick={onBack || onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-elevation-2)] dark:bg-[var(--bg-elevation-2)] text-[var(--text-strong)] dark:text-[var(--text-strong)] cursor-pointer hover:bg-[var(--stroke-sub)] dark:hover:bg-[var(--bg-elevation-2)]"
        >
          <FaArrowLeft size={14} />
        </button>
        <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">
          {title}
        </h2>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 flex flex-col gap-4">
        {date && (
          <p className="text-[13px] font-medium text-[var(--text-soft)] dark:text-[var(--text-soft)]">
            {date}
          </p>
        )}
        {message && (
          <p className="text-[15px] font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)] leading-relaxed">
            {message}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 w-full px-6 py-4 flex justify-end">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[var(--bg-elevation-2)] dark:bg-[var(--bg-elevation-2)] text-[var(--text-strong)] dark:text-[var(--text-strong)] text-[14px] font-bold hover:bg-[var(--stroke-sub)] dark:hover:bg-[var(--bg-elevation-2)] cursor-pointer transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          Yopish
        </button>
      </div>
    </div>
  )
}
