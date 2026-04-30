import { useState, useRef, useEffect } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown } from 'react-icons/fa6'
import { SelectField } from '../components/SelectField'
import { LoyihaDropdownForm } from '../components/LoyihaDropdown'
import { axiosAPI } from '../../../../../service/axiosAPI'
import {
  TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS,
  labelCls, fmtCard,
} from '../constants'

// Decimal son formatlash
function fmtAmount(raw) {
  let val = raw.replace(/[^\d.]/g, '')
  const parts = val.split('.')
  if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
  const [int, dec] = val.split('.')
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  if (dec !== undefined) return intFormatted + '.' + dec.slice(0, 2)
  return intFormatted
}

function toDecimalStr(val) {
  return val.replace(/\s/g, '')
}

// Tur bo'yicha qoidalar
// company:    toifa disabled, loyiha aktiv (majburiy)
// other:      loyiha disabled, toifa aktiv
// withdrawal: loyiha disabled, toifa disabled
const RULES = {
  company:    { projectDisabled: false, categoryDisabled: true,  projectRequired: true,  reasonRequired: true  },
  other:      { projectDisabled: true,  categoryDisabled: false, projectRequired: false, reasonRequired: false },
  withdrawal: { projectDisabled: true,  categoryDisabled: true,  projectRequired: false, reasonRequired: true  },
}

function getRules(type) {
  return RULES[type] ?? { projectDisabled: false, categoryDisabled: false, projectRequired: false, reasonRequired: false }
}

export default function SorovModal({ onClose, onSubmit, categories = [], projects = [] }) {
  const [userCard, setUserCard] = useState(null)

  // Modal ochilganda /users/me/ dan card_number olamiz
  useEffect(() => {
    axiosAPI.get('/users/me/')
      .then(res => {
        const data = res.data?.data ?? res.data
        const raw = data?.card_number
        if (raw) setUserCard(fmtCard(String(raw).replace(/\s/g, '')))
      })
      .catch(() => {})
  }, [])

  const [form, setForm] = useState({
    type: '', project: '', expense_category: '',
    amount: '', reason: '', payment_method: '', card_number: '',
  })
  const [errors, setErrors] = useState({})
  const [showCardSuggest, setShowCardSuggest] = useState(false)
  const cardRef = useRef(null)

  const setF = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const showCard = form.payment_method === 'card'
  const rules = getRules(form.type)

  // Tur o'zgarganda loyiha va sababni tozalash
  const handleTypeChange = (v) => {
    setForm(p => ({ ...p, type: v, project: '', reason: '' }))
    setErrors({})
  }

  const validate = () => {
    const e = {}
    if (!form.type)             e.type             = 'Xarajat turi tanlanmagan'
    if (!rules.categoryDisabled && !form.expense_category)
      e.expense_category = 'Toifa tanlanmagan'
    if (!form.amount || isNaN(parseFloat(toDecimalStr(form.amount))))
      e.amount = 'Miqdor kiritilmagan'
    if (!form.payment_method)   e.payment_method   = "To'lov turi tanlanmagan"
    if (showCard && form.card_number.replace(/\s/g, '').length < 16)
      e.card_number = "Karta raqami to'liq emas"
    if (rules.projectRequired && !form.project)
      e.project = 'Loyiha tanlash majburiy'
    if (rules.reasonRequired && !form.reason.trim())
      e.reason = 'Sabab kiritish majburiy'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const body = {
      type:             form.type,
      expense_category: Number(form.expense_category),
      amount:           toDecimalStr(form.amount),
      payment_method:   form.payment_method,
    }

    // reason — faqat bo'sh bo'lmasa qo'shiladi
    if (form.reason.trim()) body.reason = form.reason.trim()

    // card_number — faqat karta tanlanganda qo'shiladi
    if (showCard && form.card_number) {
      body.card_number = form.card_number.replace(/\s/g, '')
    }

    // project — faqat tanlanganda qo'shiladi
    if (form.project) body.project = Number(form.project)

    onSubmit(body)
  }

  const iCls = (k) => `w-full h-[42px] px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors
    bg-white text-[#1A1D2E] placeholder-[#8F95A8] focus:border-[#526ED3]
    dark:bg-[#191A1A] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]
    ${errors[k] ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'}`

  const categoryOptions = categories.map(c => ({ label: c.title, value: String(c.id) }))

  // Loyiha label
  const projectLabel = rules.projectRequired
    ? 'Loyiha'
    : <span>Loyiha <span className="text-[#B6BCCB]">(ixtiyoriy)</span></span>

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-black/60" />
      <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full absolute top-5 right-5 cursor-pointer transition-colors
        bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white">
        <FaXmark size={14} />
      </button>
      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">

        {/* Header */}
        <div className="px-6 pt-7">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={onClose} className="hover:opacity-70 cursor-pointer shrink-0">
              <FaArrowLeft size={16} className="dark:text-white text-[#1A1D2E]" />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF]">So'rov yuborish</h2>
          </div>
          <p className="text-[15px] text-[#5B6078] dark:text-[#C2C8E0]">
            So'rov uchun kerakli ma'lumotlarni kiriting
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Xarajat turi + Toifa */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Xarajat turi"
              value={form.type}
              onChange={handleTypeChange}
              options={TYPE_OPTIONS}
              placeholder="Turini tanlang"
              error={errors.type}
            />
            <SelectField
              label="Toifa"
              value={form.expense_category}
              onChange={v => setF('expense_category', v)}
              options={categoryOptions}
              placeholder="Toifani tanlang"
              error={errors.expense_category}
              disabled={rules.categoryDisabled}
            />
          </div>

          {/* Loyiha — har doim ko'rinadi, ba'zan disabled */}
          <div>
            <label className={labelCls}>
              {rules.projectRequired
                ? 'Loyiha'
                : <span>Loyiha <span className="text-[#B6BCCB]">(ixtiyoriy)</span></span>
              }
            </label>
            <LoyihaDropdownForm
              value={form.project}
              onChange={v => setF('project', v)}
              projects={projects}
              error={errors.project}
              disabled={rules.projectDisabled}
            />
          </div>

          {/* Miqdor */}
          <div>
            <label className={labelCls}>Miqdor (UZS)</label>
            <input
              inputMode="decimal"
              className={iCls('amount') + ' text-right'}
              placeholder="0.00"
              value={form.amount}
              onChange={e => setF('amount', fmtAmount(e.target.value))}
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">*{errors.amount}</p>}
          </div>

          {/* Sabab */}
          <div>
            <label className={labelCls}>
              Sabab
              {!rules.reasonRequired && <span className="text-[#B6BCCB] ml-1">(ixtiyoriy)</span>}
            </label>
              <div className="relative">
                <textarea
                  rows={3}
                  className={iCls('reason') + ' h-auto! resize-none pr-8'}
                  placeholder="Sababni yozing..."
                  value={form.reason}
                  onChange={e => setF('reason', e.target.value)}
                />
                {form.reason && (
                  <button type="button" onClick={() => setF('reason', '')}
                    className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] cursor-pointer">
                    <FaXmark size={12} />
                  </button>
                )}
              </div>
              {errors.reason && <p className="text-xs text-red-500 mt-1">*{errors.reason}</p>}
          </div>

          {/* To'lov turi + Karta */}
          <div className={showCard ? 'grid grid-cols-2 gap-4' : ''}>
            <SelectField
              label="To'lov turi"
              value={form.payment_method}
              onChange={v => setF('payment_method', v)}
              options={PAYMENT_METHOD_OPTIONS}
              placeholder="To'lov turini tanlang"
              error={errors.payment_method}
            />
            {showCard && (
              <div>
                <label className={labelCls}>Karta raqami</label>
                <div className="relative">
                  <input
                    ref={cardRef}
                    className={iCls('card_number')}
                    placeholder="0000 0000 0000 0000"
                    value={form.card_number}
                    onChange={e => { setF('card_number', fmtCard(e.target.value)); setShowCardSuggest(false) }}
                    onFocus={() => { if (userCard) setShowCardSuggest(true) }}
                    onBlur={() => setTimeout(() => setShowCardSuggest(false), 150)}
                    maxLength={19}
                  />
                  {form.card_number && (
                    <button type="button" onClick={() => setF('card_number', '')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] cursor-pointer">
                      <FaXmark size={12} />
                    </button>
                  )}
                  {/* Karta taklifi */}
                  {showCardSuggest && userCard && (
                    <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-xl shadow-xl border overflow-hidden
                      bg-white border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
                      <button
                        type="button"
                        onMouseDown={() => {
                          // userCard allaqachon fmtCard orqali formatlangan — to'g'ridan qo'yamiz
                          setForm(p => ({ ...p, card_number: userCard }))
                          setErrors(p => ({ ...p, card_number: '' }))
                          setShowCardSuggest(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors cursor-pointer
                          hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]">
                        <div className="w-8 h-8 rounded-lg bg-[#EEF1FB] dark:bg-[#292A2A] flex items-center justify-center shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3F57B3" strokeWidth="2">
                            <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#8F95A8] dark:text-[#C2C8E0] mb-0.5">Mening kartam</p>
                          <p className="text-sm font-mono font-semibold text-[#1A1D2E] dark:text-white tracking-wider">{userCard}</p>
                        </div>
                        <FaChevronDown size={11} className="text-[#8F95A8] -rotate-90 shrink-0" />
                      </button>
                    </div>
                  )}
                </div>
                {errors.card_number && <p className="text-xs text-red-500 mt-1">*{errors.card_number}</p>}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={14} /> Yopish
          </button>
          <button onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
              bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <img src="/imgs/checkIcon.svg" alt="" className="w-3.5 h-3.5 brightness-0 invert" />
            So'rov yuborish
          </button>
        </div>
      </div>
    </div>
  )
}
