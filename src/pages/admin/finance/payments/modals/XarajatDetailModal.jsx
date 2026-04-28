import { FaXmark, FaArrowLeft } from 'react-icons/fa6'
import { MdCheck } from 'react-icons/md'
import { fmt, labelCls } from '../constants'

export default function XarajatDetailModal({ payment, onClose, onPaid }) {
  const fieldCls = `w-full px-3 py-2.5 rounded-xl text-sm border
    bg-[#F8F9FC] border-[#E2E6F2] text-[#1A1D2E]
    dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-white`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">

        {/* Header */}
        <div className="px-6 pt-7 pb-2">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-70 cursor-pointer shrink-0">
              <FaArrowLeft size={16} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Xarajat so'rovi</h2>
          </div>
          <p className="text-sm text-[#5B6078] dark:text-[#C2C8E0] ml-7">
            Ma'lumotlarni tekshirib, so'rov bo'yicha qaror qabul qiling
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Xarajat turi + Toifa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Xarajat turi</label>
              <div className={fieldCls}>{payment.type || '—'}</div>
            </div>
            <div>
              <label className={labelCls}>Toifa</label>
              <div className={fieldCls}>{payment.toifa || '—'}</div>
            </div>
          </div>

          {/* Miqdor */}
          <div>
            <label className={labelCls}>Miqdori (UZS)</label>
            <div className={fieldCls + ' text-right font-semibold'}>{fmt(payment.amount)}</div>
          </div>

          {/* Sababi */}
          <div>
            <label className={labelCls}>Sababi</label>
            <div className={fieldCls + ' min-h-[72px] whitespace-pre-wrap leading-relaxed'}>
              {payment.sabab || "Uyga ketishga pulim yo'qligi uchun, so'rov yubormoqdaman iltimos tezroq hal qilib beringlar"}
            </div>
          </div>

          {/* To'lov turi + Karta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>To'lov turi</label>
              <div className={fieldCls}>{payment.tolovTuri || 'Karta raqam orqali'}</div>
            </div>
            <div>
              <label className={labelCls}>Karta raqami</label>
              <div className={fieldCls + ' font-mono tracking-wider'}>{payment.karta || '8600 0000 0000 0001'}</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={14} /> Yopish
          </button>
          <button onClick={() => { onPaid(payment.id); onClose() }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
              bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <MdCheck size={16} /> To'lov qildim
          </button>
        </div>
      </div>
    </div>
  )
}
