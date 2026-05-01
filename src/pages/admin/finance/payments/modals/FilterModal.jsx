import { useState } from 'react'
import { FaXmark, FaArrowLeft } from 'react-icons/fa6'
import { SelectField } from '../components/SelectField'
import { LoyihaDropdown } from '../components/LoyihaDropdown'
import { DateTimeRangeRow } from '../components/DateBox'
import { TYPE_OPTIONS, STATUS_OPTIONS, EMPTY_FILTER, labelCls } from '../constants'

export default function FilterModal({ onClose, onApply, initial, categories = [], projects = [] }) {
  const [f, setF] = useState({ ...EMPTY_FILTER, ...initial })
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  const categoryOptions = categories.map(c => ({ label: c.title, value: String(c.id) }))

  // Xarajat turi bo'yicha disabled logika:
  // withdrawal  → toifa ham, loyiha ham disabled
  // company     → faqat toifa disabled
  // other       → faqat loyiha disabled
  const isCategoryDisabled = f.type === 'withdrawal' || f.type === 'company'
  const isProjectDisabled  = f.type === 'withdrawal' || f.type === 'other'

  const handleTypeChange = (v) => {
    const next = { ...f, type: v }
    if (v === 'withdrawal') { next.expense_category = ''; next.project = '' }
    if (v === 'company')    { next.expense_category = '' }
    if (v === 'other')      { next.project = '' }
    setF(next)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-black/60" />
       <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer z-10
            bg-[#F1F3F9] hover:bg-[#E2E6F2] text-[#5B6078] dark:bg-[#292A2A] dark:hover:bg-[#333435] dark:text-[#C2C8E0] transition-colors">
          <FaXmark size={14} />
        </button>


      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">

        {/* X tugmasi */}
       
        {/* Header */}
        <div className="px-6 pt-6 pb-3">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="hover:opacity-70 cursor-pointer shrink-0">
              <FaArrowLeft className="dark:text-white text-[#1A1D2E]" size={16} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF]">Filtrlash</h2>
          </div>
          <p className="text-sm text-[#5B6078] dark:text-[#C2C8E0] mb-5">
            Kerakli filtirlarni tanlang, natijalar shunga qarab saralanadi
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-4 flex flex-col gap-4">

          {/* Xarajat turi + Holati */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Xarajat turi"
              value={f.type}
              onChange={handleTypeChange}
              options={TYPE_OPTIONS}
              placeholder="Xarajat turini tanlang"
            />
            <SelectField
              label="Holati"
              value={f.status}
              onChange={v => set('status', v)}
              options={STATUS_OPTIONS}
              placeholder="Holatini tanlang"
            />
          </div>

          {/* Toifa + Loyiha */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Toifa"
              value={f.expense_category}
              onChange={v => set('expense_category', v)}
              options={categoryOptions}
              placeholder="Toifani tanlang"
              disabled={isCategoryDisabled}
            />
            <LoyihaDropdown
              value={f.project}
              onChange={v => set('project', v)}
              projects={projects}
              disabled={isProjectDisabled}
            />
          </div>

          {/* Summa */}
          <div>
            <label className={labelCls}>Summa (UZS)</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                inputMode="decimal"
                className="w-full h-[42px] px-3 py-2.5 rounded-xl text-sm outline-none border
                  bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#B6BCCB] focus:border-[#526ED3]
                  dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#474848]"
                placeholder="dan: 0"
                value={f.amount__gte}
                onChange={e => set('amount__gte', e.target.value.replace(/[^\d]/g, ''))}
              />
              <input
                inputMode="decimal"
                className="w-full h-[42px] px-3 py-2.5 rounded-xl text-sm outline-none border
                  bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#B6BCCB] focus:border-[#526ED3]
                  dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#474848]"
                placeholder="gacha: 0"
                value={f.amount__lte}
                onChange={e => set('amount__lte', e.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
          </div>

          {/* Yaratilgan vaqt oralig'i */}
          <DateTimeRangeRow
            label="Yaratilgan vaqt oralig'i"
            dateFromD={f.created_at__date__gte} dateFromT={f.created_at__time__gte ?? ''}
            dateToD={f.created_at__date__lte}   dateToT={f.created_at__time__lte ?? ''}
            onDateFromD={v => set('created_at__date__gte', v)} onTimeFromD={v => set('created_at__time__gte', v)}
            onDateToD={v => set('created_at__date__lte', v)}   onTimeToD={v => set('created_at__time__lte', v)}
          />

          {/* To'langan vaqt oralig'i */}
          <DateTimeRangeRow
            label="To'langan vaqt oralig'i"
            dateFromD={f.paid_at__date__gte} dateFromT={f.paid_at__time__gte ?? ''}
            dateToD={f.paid_at__date__lte}   dateToT={f.paid_at__time__lte ?? ''}
            onDateFromD={v => set('paid_at__date__gte', v)} onTimeFromD={v => set('paid_at__time__gte', v)}
            onDateToD={v => set('paid_at__date__lte', v)}   onTimeToD={v => set('paid_at__time__lte', v)}
          />

          {/* Tasdiqlangan vaqt oralig'i */}
          <DateTimeRangeRow
            label="Tasdiqlangan vaqt oralig'i"
            dateFromD={f.confirmed_at__date__gte} dateFromT={f.confirmed_at__time__gte ?? ''}
            dateToD={f.confirmed_at__date__lte}   dateToT={f.confirmed_at__time__lte ?? ''}
            onDateFromD={v => set('confirmed_at__date__gte', v)} onTimeFromD={v => set('confirmed_at__time__gte', v)}
            onDateToD={v => set('confirmed_at__date__lte', v)}   onTimeToD={v => set('confirmed_at__time__lte', v)}
          />

        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3 ">
          <button onClick={() => setF(EMPTY_FILTER)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={13} /> Tozalash
          </button>
          <button onClick={() => onApply(f)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
              bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            Qidirish
          </button>
        </div>
      </div>
    </div>
  )
}