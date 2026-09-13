import { useAuth } from '../../context/AuthContext'
import { FaHandSparkles } from 'react-icons/fa6'

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6 text-gray-900 dark:text-[var(--text-strong)] flex items-center gap-2">
        <span>Xush kelibsiz, {user?.name}</span>
        <FaHandSparkles size={20} className="text-amber-400 shrink-0" />
      </h1>
      <div className="rounded-xl border flex items-center justify-center min-h-[60vh] text-sm
        bg-[var(--bg-base)] border-[var(--stroke-sub)] text-[var(--text-soft)]
        dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-sub)]">
        Dashboard tez orada tayyor bo'ladi
      </div>
    </div>
  )
}
