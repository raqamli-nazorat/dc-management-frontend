import { useState } from 'react'
import { FaXmark, FaArrowLeft } from 'react-icons/fa6'
import { SelectField } from '../components/SelectField'
import { LoyihaDropdownForm } from '../components/LoyihaDropdown'
import {
  TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS,
  labelCls, fmtCard,
} from '../constants'

// Decimal son formatlash: bo'shliq ajratuvchi, max 2 decimal
function fmtAmount(raw) {
  let val = raw.replace(/[^\d.]/g, '')
  const parts = val.split('.')
  if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
  const [int, dec] = val.split('.')
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  if (dec !== undefined) return intFormatted + '.' + dec.slice(0, 2)
  return intFormatted
}

// Yuborish uchun toza decimal string: "500 000.50" → "500000.50"
function toDecimalStr(val) {
  return val.replace(/\s/g, '')
}

export default function SorovModal({ onClose, onSubmit, categories = [], projects = [] }) {
  const [form, setForm] = useState({
    type: '', project: '', expense_category: '',
    amount: '', reason: '', payment_method: '', card_number: '',
  })
  const [errors, setErrors] = useState({})
  const setF = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const showCard = form.payment_method === 'card'

  const validate = () => {
    const e = {}
    if (!form.type)             e.type             = 'Xarajat turi tanlanmagan'
    if (!form.expense_category) e.expense_category = 'Toifa tanlanmagan'
    if (!form.amount || isNaN(parseFloat(toDecimalStr(form.amount))))
      e.amount = 'Miqdor kiritilmagan'
    if (!form.payment_method)   e.payment_method   = "To'lov turi tanlanmagan"
    if (showCard && form.card_number.replace(/\s/g, '').length < 16)
      e.card_number = "Karta raqami to'liq emas"
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const body = {
      type:             form.type,
      expense_category: Number(form.expense_category),
      amount:           toDecimalStr(form.amount),
      reason:           form.reason,
      payment_method:   form.payment_method,
      card_number:      showCard ? form.card_number.replace(/\s/g, '') : null,
    }
    // project ixtiyoriy — faqat tanlangan bo'lsa qo'shiladi
    if (form.project) body.project = Number(form.project)

    onSubmit(body)
  }

  const iCls = (k) => `w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors
    bg-white text-[#1A1D2E] placeholder-[#8F95A8] focus:border-[#526ED3]
    dark:bg-[#191A1A] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]
    ${errors[k] ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'}`

  const categoryOptions = categories.map(c => ({ label: c.title, value: String(c.id) }))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full absolute top-5 right-5 cursor-pointer transition-colors
              bg-[#F1F3F9] hover:bg-[#E2E6F2] text-[#5B6078] dark:bg-[#292A2A] dark:hover:bg-[#333435] dark:text-[#C2C8E0]">
              <FaXmark size={14} />
            </button>
      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">

        {/* Header */}
        <div className="px-6 pt-7">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="hover:opacity-70 cursor-pointer shrink-0">
                <FaArrowLeft size={16} className="dark:text-white text-[#1A1D2E]" />
              </button>
              <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF]">So'rov yuborish</h2>
            </div>
          
          </div>
          <p className="text-[15px] text-[#5B6078] dark:text-[#C2C8E0]">
            So'rov uchun kerakli ma'lumotlarni kiriting
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Loyiha — ixtiyoriy */}
          <div>
            <label className={labelCls}>Loyiha <span className="text-[#B6BCCB]">(ixtiyoriy)</span></label>
            <LoyihaDropdownForm
              value={form.project}
              onChange={v => setF('project', v)}
              projects={projects}
              error={errors.project}
            />
          </div>

          {/* Xarajat turi + Toifa */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Xarajat turi"
              value={form.type}
              onChange={v => setF('type', v)}
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
            />
          </div>

          {/* Miqdor — decimal */}
          <div>
            <label className={labelCls}>Miqdor (UZS)</label>
            <input
              inputMode="decimal"
              className={iCls('amount') + ' text-right'}
              placeholder="0.00"
              value={form.amount}
              onChange={e => setF('amount', fmtAmount(e.target.value))}
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          {/* Sabab */}
          <div>
            <label className={labelCls}>Sabab</label>
            <div className="relative">
              <textarea
                rows={3}
                className={iCls('reason') + ' resize-none pr-8'}
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
                    className={iCls('card_number')}
                    placeholder="0000 0000 0000 0000"
                    value={form.card_number}
                    onChange={e => setF('card_number', fmtCard(e.target.value))}
                    maxLength={19}
                  />
                  {form.card_number && (
                    <button type="button" onClick={() => setF('card_number', '')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] cursor-pointer">
                      <FaXmark size={12} />
                    </button>
                  )}
                </div>
                {errors.card_number && <p className="text-xs text-red-500 mt-1">{errors.card_number}</p>}
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
