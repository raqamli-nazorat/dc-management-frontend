import { useState, useEffect } from 'react'
import { FaXmark, FaArrowLeft } from 'react-icons/fa6'
import { MdCheck } from 'react-icons/md'
import { fmt, typeLabel, methodLabel, labelCls, fmtCard } from '../constants'
import { useAuth } from '../../../../../context/AuthContext'
import { axiosAPI } from '../../../../../service/axiosAPI'

const fieldCls = `w-full h-[42px] px-3 py-2.5 rounded-xl text-sm border flex items-center
  bg-[var(--bg-base)] border-[var(--stroke-sub)] text-[var(--text-strong)]
  dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)]`

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
      <div className="relative w-full max-w-[500px] rounded-2xl shadow-2xl bg-[var(--bg-base)]">
        <div className="px-6 pt-6 pb-3 flex items-center gap-3">
          <button onClick={onCancel} className="text-[var(--text-sub)] dark:text-[var(--text-sub)] hover:opacity-70 cursor-pointer shrink-0">
            <FaArrowLeft size={16} />
          </button>
          <h2 className="text-base font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Rad etish sababini kiriting</h2>
        </div>
        <div className="px-6 py-4">
          <textarea
            rows={4}
            value={reason}
            onChange={e => { setReason(e.target.value); setError(false) }}
            placeholder="Iltimos, sababni yozing. Bu majburiy"
            className={`w-full px-3 py-2.5 rounded-xl text-sm outline-none border resize-none 
              bg-[var(--bg-base)] text-[var(--text-strong)] placeholder-[var(--text-sub)]
              dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)]
              ${error ? 'border-[var(--error-strong)]' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] focus:border-[var(--accent-sub)]'}`}
          />
          {error && <p className="text-xs text-[var(--error-strong)] mt-1">*Sabab kiritish majburiy</p>}
        </div>
        <div className="px-6 pb-5 flex items-center justify-end gap-3">
          <button onClick={onCancel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer
              text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]">
            <FaXmark size={13} /> Bekor qilish
          </button>
          <button onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold  cursor-pointer
              text-white"
            style={{ backgroundColor: 'var(--error-strong)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#c42424'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--error-strong)'}>
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
      <div className="relative w-full max-w-[500px] rounded-2xl shadow-2xl bg-[var(--bg-base)]">
        <div className="px-6 pt-6 pb-3 flex items-center gap-3">
          <button onClick={onCancel} className="text-[var(--text-sub)] dark:text-[var(--text-sub)] hover:opacity-70 cursor-pointer shrink-0">
            <FaArrowLeft size={16} />
          </button>
          <h2 className="text-base font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">To'lov amalga oshirilganini tasdiqlaysizmi?</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-[var(--text-sub)] dark:text-[var(--text-sub)]">Bu orqali to'lov amalga oshirilgani tizimda qayd etiladi.</p>
        </div>
        <div className="px-6 pb-5 flex items-center justify-end gap-3">
          <button onClick={onCancel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer
              text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]">
            <FaXmark size={13} /> Bekor qilish
          </button>
          <button onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold  cursor-pointer
              bg-green-500 text-white hover:bg-green-600">
            <MdCheck size={15} /> Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Asosiy modal ─────────────────────────────────────────────
export default function XarajatDetailModal({ payment, onClose, showCheckModal, onPaid, onConfirm, onCancel }) {
  const { user } = useAuth()

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showPaidModal, setShowPaidModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [receipts, setReceipts] = useState([])
  const [previewImg, setPreviewImg] = useState(null)

  useEffect(() => {
    if (!payment?.id) return
    axiosAPI.get('/expense-receipt/', { params: { expense: payment.id } })
      .then(res => {
        const payload = res.data?.data ?? res.data
        const all = Array.isArray(payload) ? payload : (payload.results ?? [])
        setReceipts(all.filter(r => Number(r.expense) === Number(payment.id)))
      })
      .catch(() => {})
  }, [payment?.id])

  const handleCopyCard = () => {
    const raw = payment.card_number?.replace(/\s/g, '') ?? ''
    navigator.clipboard.writeText(raw).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const c = payment.expense_category_info ?? {}
  const isCard = payment.payment_method === 'card'
  const isCompany = payment.type === 'company'

  const activeRole = user?.active_role
  const isAccountant = activeRole === 'accountant'
  const isOwner = user?.id === payment.user_info?.id && user.active_role === 'employee'

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
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer z-10
              bg-[#F1F3F9] hover:bg-[#E2E6F2] text-[#5B6078] dark:bg-[var(--bg-elevation-2)] dark:hover:bg-[var(--bg-elevation-2)] dark:text-[var(--text-sub)] transition-colors">
          <FaXmark size={14} />
        </button>

        <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-[var(--bg-base)] max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="px-6 pt-6 pb-3 shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-70 cursor-pointer shrink-0">
                <FaArrowLeft size={16} />
              </button>
              <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Xarajat so'rovi</h2>
            </div>
            <p className="text-sm text-[var(--text-sub)] dark:text-[var(--text-sub)]">
              Ma'lumotlarni tekshirib, so'rov bo'yicha qaror qabul qiling
            </p>
          </div>

          {/* Body */}
          <div className="px-6 pb-4 flex flex-col gap-4 overflow-y-auto flex-1">

            {/* Xarajat turi + Toifa/Loyiha */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Xarajat turi</label>
                <div className={fieldCls}>{typeLabel(payment.type)}</div>
              </div>
              <div>
                <label className={labelCls}>{isCompany ? 'Loyiha' : 'Toifa'}</label>
                <div className={fieldCls}>
                  {isCompany
                    ? (payment.project_info?.title || payment.project_info?.name || '')
                    : (c.title || '')}
                </div>
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

            {/* Rad etish sababi — faqat cancelled statusda */}
            {payment.status === 'cancelled' && payment.cancel_reason && (
              <div>
                <label className={labelCls}>Rad etish sababi</label>
                <div className={`${fieldCls} h-auto! min-h-[80px] max-h-[120px] overflow-y-auto items-start whitespace-pre-wrap leading-relaxed`}>
                  {payment.cancel_reason}
                </div>
              </div>
            )}

            {/* To'lov cheklari */}
            {receipts.length > 0 && (
              <div>
                <label className={labelCls}>To'lov cheki</label>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {receipts.map(receipt => (
                    <div
                      key={receipt.id}
                      onClick={() => setPreviewImg(receipt.file)}
                      className="w-[120px] h-[150px] flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden
                        border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]
                        hover:opacity-90 transition-opacity"
                    >
                      <img src={receipt.file} alt="chek" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-end gap-3 shrink-0 ">
            <button onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer
                text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]">
              <FaXmark size={13} /> Yopish
            </button>

            {/* Rad etish — so'rov egasi + pending */}
            {showCancel && onCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-white "
                style={{ backgroundColor: 'var(--error-strong)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#c42424'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--error-strong)'}>
                <FaXmark size={13} /> Rad etish
              </button>
            )}

            {/* To'lov qildim — accountant + pending */}
            {showPaid && onPaid && (
              <button
                onClick={() => setShowPaidModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-white "
                style={{ backgroundColor: 'var(--accent-strong)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent-sub)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--accent-strong)'}>
                <MdCheck size={15} /> To'lov qildim
              </button>
            )}

            {/* Tasdiqlash — so'rov egasi + paid */}
            {showConfirm && onConfirm && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-white "
                style={{ backgroundColor: 'var(--accent-strong)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent-sub)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--accent-strong)'}>
                <MdCheck size={15} /> Tasdiqlash
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rasm preview */}
      {previewImg && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85"
          onClick={() => setPreviewImg(null)}
        >
          <button
            onClick={() => setPreviewImg(null)}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
          >
            <FaXmark size={15} />
          </button>
          <img
            src={previewImg}
            alt="chek"
            className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

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
            onClose()
            showCheckModal(payment.id, payment.project)
            onPaid(payment.id)
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
