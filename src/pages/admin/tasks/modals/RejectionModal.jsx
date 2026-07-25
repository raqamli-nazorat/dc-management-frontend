import { useState, useRef } from 'react'
import { FaXmark, FaPaperclip } from 'react-icons/fa6'
import { axiosAPI } from '../../../../service/axiosAPI'
import { toast } from '../../../../Toast/ToastProvider'
import { useImagePaste } from '../../../../hooks/useImagePaste'

/* ── RejectionModal ── */
export default function RejectionModal({ task, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [reasonError, setReasonError] = useState(false)
  const [filesError, setFilesError] = useState(false)
  const fileRef = useRef(null)

  useImagePaste((pastedFiles) => {
    if (!pastedFiles || pastedFiles.length === 0) return;
    const added = pastedFiles.map(f => ({
      file: f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
    }))
    setFiles(p => [...p, ...added])
    setFilesError(false)
  })

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setReasonError(true)
      return
    }

    setLoading(true)
    try {
      // 1. Avval status o'zgartirish + sabab
      const res = await axiosAPI.patch(`/tasks/${task.id}/change-status/`, {
        status: 'rejected',
        rejection_reason: reason.trim(),
      })
      // Backenddan kelgan haqiqiy statusni olish
      const actualStatus = res.data?.data?.status ?? res.data?.status ?? 'rejected'

      // 2. Status rejected bo'lgandan keyin fayllarni ketma-ket yuklash
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData()
        fd.append('task', task.id)
        fd.append('file', files[i].file)
        try {
          await axiosAPI.post('/task-rejection-files/', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        } catch (fileErr) {
          const msg = fileErr?.response?.data?.error?.errorMsg
            || fileErr?.response?.data?.detail
            || 'Yuklashda xatolik'
          toast.error(`"${files[i]?.file?.name || 'fayl'}" yuklanmadi`, msg)
        }
      }

      onConfirm(actualStatus)
      toast.success('Rad etildi', 'Vazifa muvaffaqiyatli rad etildi')
    } catch (err) {
      const details = err?.response?.data?.error?.details
      const msg = err?.response?.data?.error?.errorMsg || err?.response?.data?.detail || 'Xatolik yuz berdi'
      if (Array.isArray(details) && details.length > 0) {
        toast.error('Xatolik', details[0])
      } else if (details && typeof details === 'object') {
        const msgs = Object.entries(details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n')
        toast.error('Xatolik', msgs || msg)
      } else {
        toast.error('Xatolik', msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999]  flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[520px] rounded-3xl shadow-2xl bg-[var(--bg-base)] p-7 flex flex-col gap-5">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] dark:bg-[var(--bg-elevation-2)] text-[var(--text-sub)] dark:text-[var(--text-sub)] hover:bg-[var(--stroke-sub)] cursor-pointer">
          <FaXmark size={13} />
        </button>

        <div>
          <h2 className="text-[18px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Vazifani rad etish</h2>
          <p className="text-sm text-[var(--text-soft)] mt-0.5">Rad etish sababini kiriting</p>
        </div>

        {/* Fayllar */}
        <div>
          <div className="flex flex-wrap gap-2 mb-1">
            {files.map((f, i) => (
              <div key={i} className="relative w-16 h-16 rounded-xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] overflow-hidden bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] flex items-center justify-center group">
                {f.preview
                  ? <img src={f.preview} alt="" className="w-full h-full object-cover" />
                  : <div className="flex flex-col items-center gap-0.5 px-1">
                    <FaPaperclip size={14} className="text-[var(--accent-sub)]" />
                    <span className="text-[8px] text-[var(--text-sub)] truncate w-full text-center">{f.file.name}</span>
                  </div>
                }
                <button type="button" onClick={() => { setFiles(p => p.filter((_, j) => j !== i)); setFilesError(false) }}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                  <FaXmark size={8} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors
                border-[#C2C8E0] dark:border-[var(--stroke-sub)] text-[var(--text-soft)] hover:border-[var(--accent-sub)] hover:text-[var(--accent-sub)]">
              <FaPaperclip size={14} />
              <span className="text-[9px]">Rasm</span>
            </button>
            <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden"
              onChange={e => {
                const added = Array.from(e.target.files || []).map(f => ({
                  file: f,
                  preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
                }))
                setFiles(p => [...p, ...added])
                setFilesError(false)
                e.target.value = ''
              }} />
          </div>
          {filesError && <p className="text-xs text-red-500 mt-0.5">*Kamida bitta fayl yuklang</p>}        </div>

        {/* Sabab */}
        <div>
          <textarea
            value={reason}
            onChange={e => { setReason(e.target.value); if (e.target.value.trim()) setReasonError(false) }}
            placeholder="Sababini yozing..."
            rows={4}
            className={`w-full px-3 py-2.5 rounded-xl text-sm outline-none border resize-none
              bg-[var(--bg-base)] text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-disabled)] dark:placeholder-[var(--text-sub)]
              focus:border-[var(--accent-sub)] transition-colors
              ${reasonError ? 'border-red-500 dark:border-red-500' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]'}`}
          />
          {reasonError && <p className="text-xs text-red-500 mt-0.5">*Sabab kiritish majburiy</p>}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]">
            <FaXmark size={12} /> Bekor qilish
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer bg-[#EF4444] text-white hover:bg-red-600 disabled:opacity-60">
            {loading
              ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              : <FaPaperclip size={12} />
            }
            Rad etish
          </button>
        </div>
      </div>
    </div>
  )
}
