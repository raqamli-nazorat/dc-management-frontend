import { LuSend, LuX } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import { PiCheckCircle, PiCheckCircleBold } from "react-icons/pi";
import { LiaTelegram } from "react-icons/lia";

export const ConnectTelegramModal = ({ isOpen, onClose }) => {
     const { user } = useAuth()


     const telegramUrl = user?.telegram_url

     if (!isOpen) return null

     return (
          <div className="mx-3 rounded-xl bg-[#E2E6F2] dark:bg-[#21262D] shadow-sm border border-[#E5E7EB] dark:border-[#333] p-4">
               <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2">
                         <div className="w-7 h-7 rounded-md bg-[#0090FF] text-white flex items-center justify-center flex-shrink-0">
                              <LiaTelegram size={16} strokeWidth={1.8} />
                         </div>

                         <h2 className="text-[13px] font-extrabold text-[#0A0A0A] dark:text-white">
                              Telegram bildirishnomalari
                         </h2>
                    </div>

                    <button
                         type="button"
                         onClick={onClose}
                         className="text-[#737373] dark:text-[#A3A3A3] hover:text-[#0A0A0A] dark:hover:text-white cursor-pointer flex-shrink-0"
                         aria-label="Yopish"
                    >
                         <LuX size={16} strokeWidth={1.8} />
                    </button>
               </div>

               <p className="mt-1 text-[11px] text-[#737373] dark:text-[#A3A3A3]">
                    Muhim xabarlarni Telegram orqali oling.
               </p>

               <a
                    href={telegramUrl || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-1.5 h-7 w-full rounded-full text-xs text-[#f5f5f5] bg-[#3F57B3] font-medium flex items-center justify-center gap-1 ${telegramUrl
                         ? ""
                         : "pointer-events-none"
                         }`}
               >
                    <PiCheckCircleBold size={14} strokeWidth={2} />
                    Ulash
               </a>
          </div>
     )
}