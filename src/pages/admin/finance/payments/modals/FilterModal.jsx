import { useState, useEffect } from 'react'
import { FaXmark, FaArrowLeft } from 'react-icons/fa6'
import { SelectField } from '../components/SelectField'
import { LoyihaDropdown } from '../components/LoyihaDropdown'
import { DateTimeRangeRow } from '../components/DateBox'
import { TYPE_OPTIONS, STATUS_OPTIONS, EMPTY_FILTER, labelCls } from '../constants'
import { axiosAPI } from '../../../../../service/axiosAPI'

export default function FilterModal({ onClose, onApply, initial }) {
  const [f, setF] = useState({ ...EMPTY_FILTER, ...initial })
  const [categories, setCategories] = useState([])
  const [projects, setProjects] = useState([])

  useEffect(() => {
    axiosAPI.get('/expense-category/')
      .then(res => {
        const d = res.data?.data ?? res.data
        setCategories(Array.isArray(d) ? d : (d.results ?? []))
      })
      .catch(() => {})
    axiosAPI.get('/projects/')
      .then(res => {
        const d = res.data?.data ?? res.data
        setProjects(Array.isArray(d) ? d : (d.results ?? []))
      })
      .catch(() => {})
  }, [])
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
            bg-[#F1F3F9] hover:bg-[var(--stroke-sub)] text-[var(--text-sub)] dark:bg-[var(--bg-elevation-2)] dark:hover:bg-[var(--bg-elevation-2)] dark:text-[var(--text-sub)] transition-colors">
          <FaXmark size={14} />
        </button>


      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-[var(--bg-base)]">

        {/* X tugmasi */}
       
        {/* Header */}
        <div className="px-6 pt-6 pb-3">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="hover:opacity-70 cursor-pointer shrink-0">
              <FaArrowLeft className="dark:text-[var(--text-strong)] text-[var(--text-strong)]" size={16} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Filtrlash</h2>
          </div>
          <p className="text-sm text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-5">
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
                  bg-[var(--bg-base)] border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-sub)] focus:border-[var(--accent-sub)]
                  dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)]"
                placeholder="dan: 0"
                value={f.amount__gte}
                onChange={e => set('amount__gte', e.target.value.replace(/[^\d]/g, ''))}
              />
              <input
                inputMode="decimal"
                className="w-full h-[42px] px-3 py-2.5 rounded-xl text-sm outline-none border
                  bg-[var(--bg-base)] border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-sub)] focus:border-[var(--accent-sub)]
                  dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)]"
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
              text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]">
            <FaXmark size={13} /> Tozalash
          </button>
          <button onClick={() => onApply(f)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
              bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]">
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