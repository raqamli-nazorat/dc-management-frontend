import { MdConstruction } from 'react-icons/md'

export default function MeetingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] rounded-2xl
      bg-white border border-gray-100 shadow-sm
      dark:bg-gray-900 dark:border-gray-800">
      <MdConstruction size={48} className="text-gray-300 dark:text-gray-600" />
      <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-white">Yig'ilishlar</h2>
      <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Bu sahifa tez orada tayyor bo'ladi</p>
    </div>
  )
}
