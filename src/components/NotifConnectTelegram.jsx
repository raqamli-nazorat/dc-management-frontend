import { LuSend, LuX } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import { PiCheckCircle, PiCheckCircleBold } from "react-icons/pi";
import { LiaTelegram } from "react-icons/lia";

export const NotifConnectTelegram = () => {
     const { user } = useAuth()


     const telegramUrl = user?.telegram_url

     return (
          <div className="px-5">
               <div className="rounded-xl bg-[#E2E6F2] dark:bg-[#21262D] shadow-sm border border-[#E5E7EB] dark:border-[#333] p-3 w-full flex justify-between items-center">
                    <div className="flex gap-2">
                         <div className="w-9 h-9 rounded-md bg-[#0090FF] text-white flex items-center justify-center">
                              <LiaTelegram size={18} strokeWidth={1.8} />
                         </div>

                         <div className="flex flex-col">
                              <h2 className="text-[14px] font-extrabold text-[#0A0A0A] dark:text-white">
                                   Telegram bildirishnomalari
                              </h2>

                              <p className="text-[12px] text-[#737373] dark:text-[#A3A3A3]">
                                   Muhim xabarlarni Telegram orqali oling.
                              </p>
                         </div>
                    </div>

                    <a
                         href={telegramUrl || undefined}
                         target="_blank"
                         rel="noopener noreferrer"
                         className={`mt-1.5 h-8 w-[77px] rounded-lg text-[13px] text-[#f5f5f5] bg-[#3F57B3] font-medium flex items-center justify-center gap-1 ${!telegramUrl
                              ? "cursor-pointer"
                              : "cursor-default pointer-events-none"
                              }`}
                    >
                         <PiCheckCircleBold size={16} strokeWidth={2} />
                         {telegramUrl ? "Ulangan" : "Ulash"}
                    </a>
               </div>
          </div>
     )
}