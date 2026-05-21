export default function DiscardModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-[400px] rounded-2xl shadow-2xl bg-[var(--bg-base)] p-6">
        <h2 className="text-[16px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)] mb-2">
          O'zgarishlar saqlanmaydi
        </h2>
        <p className="text-sm text-[var(--text-soft)] dark:text-[var(--text-sub)] mb-5">
          Kiritilgan ma'lumotlar saqlanmagan. Haqiqatan ham chiqmoqchimisiz?
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]"
          >
            Davom etish
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer bg-[var(--error-strong)] text-white hover:bg-red-600"
          >
            Chiqish
          </button>
        </div>
      </div>
    </div>
  )
}
