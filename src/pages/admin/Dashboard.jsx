import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        Xush kelibsiz, {user?.name} 👋
      </h1>
      <div className="rounded-xl border flex items-center justify-center min-h-[60vh] text-sm
        bg-white border-[#E2E6F2] text-[#8F95A8]
        dark:bg-[#222323] dark:border-[#292A2A] dark:text-[#C2C8E0]">
        Dashboard tez orada tayyor bo'ladi
      </div>
    </div>
  )
}
