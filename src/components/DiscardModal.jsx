import { useEffect } from 'react'
import { FaArrowLeft, FaXmark, FaCheck } from 'react-icons/fa6'

export default function DiscardModal({ onCancel, onConfirm }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-[var(--bg-base)] p-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onCancel}
            className="text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0"
          >
            <FaArrowLeft size={16} />
          </button>
          <h2 className="text-[16px] font-bold text-[var(--text-strong)]">
            O'zgarishlar saqlanmagan.
          </h2>
        </div>
        <p className="text-sm text-[var(--text-soft)] dark:text-[var(--text-sub)] mb-6 pl-7">
          Kiritilgan ma'lumotlar saqlanmaydi. Chiqishni tasdiqlaysizmi?
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <FaXmark size={13} />
            Chiqish
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer bg-[#1A1D2E] dark:bg-[#2e3354] text-white hover:opacity-90 transition-opacity"
          >
            <FaCheck size={13} />
            Qolish
          </button>
        </div>
      </div>
    </div>
  )
}
