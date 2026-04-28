import { useState } from 'react'
import { FaXmark, FaArrowLeft } from 'react-icons/fa6'
import { SelectFieldForm } from '../components/SelectField'
import { LoyihaDropdownForm } from '../components/LoyihaDropdown'
import { XARAJAT_TURLARI, TOIFALAR, TOLOV_TURLARI, labelCls, fmtMoney, fmtCard } from '../constants'

export default function SorovModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    loyiha: '', type: '', toifa: '', amount: '', sabab: '', tolovTuri: '', karta: ''
  })
  const [errors, setErrors] = useState({})
  const setF = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const showKarta = form.tolovTuri === 'Karta orqali'

  const validate = () => {
    const e = {}
    if (!form.loyiha) e.loyiha = 'Loyiha tanlanmagan'
    if (!form.type) e.type = 'Xarajat turi tanlanmagan'
    if (!form.toifa) e.toifa = 'Toifa tanlanmagan'
    if (!form.amount) e.amount = 'Miqdor kiritilmagan'
    if (!form.tolovTuri) e.tolovTuri = "To'lov turi tanlanmagan"
    if (showKarta && form.karta.replace(/\s/g, '').length < 16) e.karta = "Karta raqami to'liq emas"
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSubmit(form)
  }

  const iCls = (k) => `w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors
    bg-white text-[#1A1D2E] placeholder-[#8F95A8] focus:border-[#526ED3]
    dark:bg-[#191A1A] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]
    ${errors[k] ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'}`

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">

        {/* Header */}
        <div className="px-6 pt-7">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={onClose} className="text-[#5B6078] dark:text-[#C2C8E0] hover:opacity-70 cursor-pointer shrink-0">
              <FaArrowLeft size={16} className="dark:text-white text-[#1A1D2E]" />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF]">So'rov yuborish</h2>
          </div>
          <p className="text-[15px] text-[#5B6078] dark:text-[#C2C8E0] mt-0.5">
            So'rov uchun kerakli ma'lumotlarni kiriting
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Loyiha */}
          <div>
            <label className={labelCls}>Loyiha uchun</label>
            <LoyihaDropdownForm value={form.loyiha} onChange={v => setF('loyiha', v)} error={errors.loyiha} />
          </div>

          {/* Xarajat turi + Toifa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Xarajat turi</label>
              <SelectFieldForm value={form.type} onChange={v => setF('type', v)} options={XARAJAT_TURLARI} placeholder="Xarajat turini tanlang" error={errors.type} />
            </div>
            <div>
              <label className={labelCls}>Toifa</label>
              <SelectFieldForm value={form.toifa} onChange={v => setF('toifa', v)} options={TOIFALAR} placeholder="Toifani tanlang" error={errors.toifa} />
            </div>
          </div>

          {/* Miqdor */}
          <div>
            <label className={labelCls}>Miqdor (UZS)</label>
            <input
              className={iCls('amount') + ' text-right'}
              placeholder="Summani kiriting: 0.00"
              value={form.amount}
              onChange={e => setF('amount', fmtMoney(e.target.value))}
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          {/* Sabab */}
          <div>
            <label className={labelCls}>Sabab</label>
            <div className="relative">
              <textarea
                rows={3}
                className={iCls('sabab') + ' resize-none pr-8'}
                placeholder="Sababni yozing..."
                value={form.sabab}
                onChange={e => setF('sabab', e.target.value)}
              />
              {form.sabab && (
                <button type="button" onClick={() => setF('sabab', '')}
                  className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] cursor-pointer">
                  <FaXmark size={12} />
                </button>
              )}
            </div>
          </div>

          {/* To'lov turi + Karta */}
          <div className={showKarta ? 'grid grid-cols-2 gap-4' : ''}>
            <div>
              <label className={labelCls}>To'lov turi</label>
              <SelectFieldForm value={form.tolovTuri} onChange={v => setF('tolovTuri', v)} options={TOLOV_TURLARI} placeholder="To'lov turini tanlang" error={errors.tolovTuri} />
            </div>
            {showKarta && (
              <div>
                <label className={labelCls}>Karta raqami</label>
                <div className="relative">
                  <input
                    className={iCls('karta')}
                    placeholder="0000 0000 0000 0000"
                    value={form.karta}
                    onChange={e => setF('karta', fmtCard(e.target.value))}
                    maxLength={19}
                  />
                  {form.karta && (
                    <button type="button" onClick={() => setF('karta', '')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] cursor-pointer">
                      <FaXmark size={12} />
                    </button>
                  )}
                </div>
                {errors.karta && <p className="text-xs text-red-500 mt-1">{errors.karta}</p>}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={14} />
            Yopish
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
