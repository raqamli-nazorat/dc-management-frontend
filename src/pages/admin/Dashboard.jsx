import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6 text-gray-900 dark:text-[var(--text-strong)]">
        Xush kelibsiz, {user?.name} 👋
      </h1>
      <div className="rounded-xl border flex items-center justify-center min-h-[60vh] text-sm
        bg-[var(--bg-elevation-1-alt)] border-[var(--stroke-sub)] text-[var(--text-soft)]
        dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-sub)]">
        Dashboard tez orada tayyor bo'ladi
      </div>
    </div>
  )
}
