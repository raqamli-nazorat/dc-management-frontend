import { useState } from 'react'
import { FaXmark, FaArrowLeft } from 'react-icons/fa6'
import { MdCheck } from 'react-icons/md'
import { fmt, typeLabel, methodLabel, labelCls, fmtCard } from '../constants'

const fieldCls = `w-full h-[42px] px-3 py-2.5 rounded-xl text-sm border flex items-center
  bg-[#F8F9FC] border-[#E2E6F2] text-[#1A1D2E]
  dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-white`

// ── Rad etish sababi modali ──────────────────────────────────
function CancelReasonModal({ onCancel, onConfirm }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = () => {
    if (!reason.trim()) { setError(true); return }
    onConfirm(reason.trim())
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative w-full max-w-[500px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">
        <div className="px-6 pt-6 pb-3 flex items-center gap-3">
          <button onClick={onCancel} className="text-[#5B6078] dark:text-[#C2C8E0] hover:opacity-70 cursor-pointer shrink-0">
            <FaArrowLeft size={16} />
          </button>
          <h2 className="text-base font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">Rad etish sababini kiriting</h2>
        </div>
        <div className="px-6 py-4">
          <textarea
            rows={4}
            value={reason}
            onChange={e => { setReason(e.target.value); setError(false) }}
            placeholder="Iltimos, sababni yozing. Bu majburiy"
            className={`w-full px-3 py-2.5 rounded-xl text-sm outline-none border resize-none transition-colors
              bg-white text-[#1A1D2E] placeholder-[#8F95A8]
              dark:bg-[#191A1A] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]
              ${error ? 'border-[#E02D2D]' : 'border-[#E2E6F2] dark:border-[#292A2A] focus:border-[#526ED3]'}`}
          />
          {error && <p className="text-xs text-[#E02D2D] mt-1">*Sabab kiritish majburiy</p>}
        </div>
        <div className="px-6 pb-5 flex items-center justify-end gap-3">
          <button onClick={onCancel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={13} /> Bekor qilish
          </button>
          <button onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
              text-white"
            style={{ backgroundColor: '#E02D2D' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#c42424'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E02D2D'}>
            <FaXmark size={13} /> Rad etish
          </button>
        </div>
      </div>
    </div>
  )
}

// ── To'lov tasdiqlash modali ─────────────────────────────────
function PaidConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative w-full max-w-[500px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">
        <div className="px-6 pt-6 pb-3 flex items-center gap-3">
          <button onClick={onCancel} className="text-[#5B6078] dark:text-[#C2C8E0] hover:opacity-70 cursor-pointer shrink-0">
            <FaArrowLeft size={16} />
          </button>
          <h2 className="text-base font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">To'lov amalga oshirilganini tasdiqlaysizmi?</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-[#5B6078] dark:text-[#C2C8E0]">Bu orqali to'lov amalga oshirilgani tizimda qayd etiladi.</p>
        </div>
        <div className="px-6 pb-5 flex items-center justify-end gap-3">
          <button onClick={onCancel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={13} /> Bekor qilish
          </button>
          <button onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
              bg-green-500 text-white hover:bg-green-600">
            <MdCheck size={15} /> Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Asosiy modal ─────────────────────────────────────────────
export default function XarajatDetailModal({ payment, onClose, onPaid, onConfirm, onCancel }) {
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showPaidModal, setShowPaidModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyCard = () => {
    const raw = payment.card_number?.replace(/\s/g, '') ?? ''
    navigator.clipboard.writeText(raw).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null } })()
  const c = payment.expense_category_info ?? {}
  const isCard = payment.payment_method === 'card'

  const isAccountant = user?.roles?.includes('accountant')
  const isOwner = user?.id === payment.user_info?.id

  // To'lov qildim: faqat accountant + pending
  const showPaid = isAccountant && payment.status === 'pending'
  // Tasdiqlash: faqat so'rov egasi + paid
  const showConfirm = isOwner && payment.status === 'paid'
  // Rad etish: so'rov egasi yoki hisobchi + pending
  const showCancel = (isOwner || isAccountant) && payment.status === 'pending'

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center absolute top-5 right-5 rounded-full cursor-pointer transition-colors
          bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white">
          <FaXmark size={14} />
        </button>
        <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">

          {/* Header */}
          <div className="px-6 pt-6 pb-3">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-70 cursor-pointer shrink-0">
                <FaArrowLeft size={16} />
              </button>
              <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Xarajat so'rovi</h2>
            </div>
            <p className="text-sm text-[#5B6078] dark:text-[#C2C8E0]">
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
              <div className={`${fieldCls} h-auto! min-h-[80px] max-h-[120px] overflow-y-auto items-start whitespace-pre-wrap leading-relaxed`}>
                {payment.reason || ''}
              </div>
            </div>

            {/* To'lov turi + Karta */}
            <div className={isCard ? 'grid grid-cols-2 gap-4' : ''}>
              <div>
                <label className={labelCls}>To'lov turi</label>
                <div className={fieldCls}>{methodLabel(payment.payment_method)}</div>
              </div>
              {isCard && payment.card_number && (
                <div>
                  <label className={labelCls}>Karta raqam</label>
                  <div className={`${fieldCls} font-mono tracking-wider justify-between`}>
                    <span>{fmtCard(payment.card_number)}</span>
                    <button
                      type="button"
                      onClick={handleCopyCard}
                      title="Nusxa olish"
                      className="shrink-0 ml-2 cursor-pointer transition-opacity hover:opacity-70">
                      <img
                        src={copied ? '/imgs/checkIcon.svg' : '/imgs/Copy.svg'}
                        alt={copied ? 'copied' : 'copy'}
                        className={`w-4 h-4 ${copied ? 'brightness-0 saturate-100 invert-0' : 'opacity-50'}`}
                        style={copied ? { filter: 'invert(48%) sepia(79%) saturate(476%) hue-rotate(86deg) brightness(95%) contrast(91%)' } : {}}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-end gap-3">
            <button onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer
                text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
              <FaXmark size={13} /> Yopish
            </button>

            {/* Rad etish — so'rov egasi + pending */}
            {showCancel && onCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-white transition-colors"
                style={{ backgroundColor: '#E02D2D' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#c42424'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E02D2D'}>
                <FaXmark size={13} /> Rad etish
              </button>
            )}

            {/* To'lov qildim — accountant + pending */}
            {showPaid && onPaid && (
              <button
                onClick={() => setShowPaidModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-white transition-colors"
                style={{ backgroundColor: '#3F57B3' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#526ED3'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3F57B3'}>
                <MdCheck size={15} /> To'lov qildim
              </button>
            )}

            {/* Tasdiqlash — so'rov egasi + paid */}
            {showConfirm && onConfirm && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-white transition-colors"
                style={{ backgroundColor: '#3F57B3' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#526ED3'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3F57B3'}>
                <MdCheck size={15} /> Tasdiqlash
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rad etish sababi modali */}
      {showCancelModal && (
        <CancelReasonModal
          onCancel={() => setShowCancelModal(false)}
          onConfirm={(reason) => {
            setShowCancelModal(false)
            onCancel(payment.id, reason)
            onClose()
          }}
        />
      )}

      {/* To'lov tasdiqlash modali */}
      {showPaidModal && (
        <PaidConfirmModal
          onCancel={() => setShowPaidModal(false)}
          onConfirm={() => {
            setShowPaidModal(false)
            onPaid(payment.id)
            onClose()
          }}
        />
      )}

      {/* Tasdiqlash modali */}
      {showConfirmModal && (
        <PaidConfirmModal
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={() => {
            setShowConfirmModal(false)
            onConfirm(payment.id)
            onClose()
          }}
        />
      )}
    </>
  )
}
