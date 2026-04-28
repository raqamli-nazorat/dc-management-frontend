import { FaXmark, FaArrowLeft } from 'react-icons/fa6'
import { MdCheck } from 'react-icons/md'
import { fmt, fmtDate, typeLabel, methodLabel, statusLabel, statusColor, labelCls } from '../constants'

const fieldCls = `w-full h-[42px] px-3 py-2.5 rounded-xl text-sm border flex items-center
  bg-[#F8F9FC] border-[#E2E6F2] text-[#1A1D2E]
  dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-white`

export default function XarajatDetailModal({ payment, onClose, onPaid, onConfirm, onCancel }) {
  const c = payment.expense_category_info ?? {}
  const isCard = payment.payment_method === 'card'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center absolute top-5 right-5 rounded-full cursor-pointer transition-colors
              bg-[#F1F3F9] hover:bg-[#E2E6F2] text-[#5B6078] dark:bg-[#292A2A] dark:hover:bg-[#333435] dark:text-[#C2C8E0]">
              <FaXmark size={14} />
            </button>
      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">

        {/* Header */}
        <div className="px-6 pt-6 pb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-70 cursor-pointer shrink-0">
                <FaArrowLeft size={16} />
              </button>
              <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Xarajat so'rovi</h2>
            </div>
          
          </div>
          <p className="text-sm text-[#5B6078] dark:text-[#C2C8E0] ml-7">
            Ma'lumotlarni tekshirib, so'rov bo'yicha qaror qabul qiling
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-4 flex flex-col gap-4">

          {/* Xarajat turi + Toifa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Xarajat turi</label>
              <div className={fieldCls}>{typeLabel(payment.type)}</div>
            </div>
            <div>
              <label className={labelCls}>Toifa</label>
              <div className={fieldCls}>{c.title || ''}</div>
            </div>
          </div>

          {/* Miqdor */}
          <div>
            <label className={labelCls}>Miqdori (UZS)</label>
            <div className={`${fieldCls} text-right font-semibold`}>{fmt(payment.amount)}</div>
          </div>

          {/* Sababi */}
          <div>
            <label className={labelCls}>Sababi</label>
            <div className={`${fieldCls} !h-auto min-h-[80px] items-start whitespace-pre-wrap leading-relaxed`}>
              {payment.reason || ''}
            </div>
          </div>

          {/* To'lov turi + Karta (faqat card bo'lsa) */}
          <div className={isCard ? 'grid grid-cols-2 gap-4' : ''}>
            <div>
              <label className={labelCls}>To'lov turi</label>
              <div className={fieldCls}>{methodLabel(payment.payment_method)}</div>
            </div>
            {isCard && payment.card_number && (
              <div>
                <label className={labelCls}>Karta raqam</label>
                <div className={`${fieldCls} font-mono tracking-wider`}>{payment.card_number}</div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={13} /> Yopish
          </button>
          
          {/* Bekor qilish tugmasi - pending yoki paid holatida */}
          {(payment.status === 'pending' || payment.status === 'paid') && onCancel && (
            <button onClick={() => { onCancel(payment.id); onClose() }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
                bg-red-500 text-white hover:bg-red-600">
              <FaXmark size={13} /> Bekor qilish
            </button>
          )}
          
          {/* To'lov qildim tugmasi - faqat pending holatida */}
          {payment.status === 'pending' && onPaid && (
            <button onClick={() => { onPaid(payment.id); onClose() }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
                bg-blue-500 text-white hover:bg-blue-600">
              <MdCheck size={15} /> To'lov qildim
            </button>
          )}
          
          {/* Tasdiqlash tugmasi - faqat paid holatida */}
          {payment.status === 'paid' && onConfirm && (
            <button onClick={() => { onConfirm(payment.id); onClose() }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
                bg-green-500 text-white hover:bg-green-600">
              <MdCheck size={15} /> Tasdiqlash
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
