export default function EmptyState({ icon, iconNode, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-[#F1F3F9] dark:bg-[#222323] flex items-center justify-center">
        {iconNode ? (
          <span className="text-[#8F95A8] dark:text-[#5B6078] opacity-60">{iconNode}</span>
        ) : (
          <img src={icon} alt="" className="w-8 h-8 opacity-50 dark:opacity-40 dark:brightness-0 dark:invert" />
        )}
      </div>
      <div className="text-center">
        <p className="text-[15px] font-bold text-[#1A1D2E] dark:text-[#FFFFFF] mb-1">{title}</p>
        {description && (
          <p className="text-sm text-[#8F95A8] dark:text-[#C2C8E0]">{description}</p>
        )}
      </div>
    </div>
  )
}
