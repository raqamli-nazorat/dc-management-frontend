import { useState } from 'react'
import { FaXmark, FaArrowLeft } from 'react-icons/fa6'
import { SelectField } from '../components/SelectField'
import { LoyihaDropdown } from '../components/LoyihaDropdown'
import { DateTimeRangeRow } from '../components/DateBox'
import { XARAJAT_TURLARI, TOIFALAR, EMPTY_FILTER, labelCls, fmtMoney } from '../constants'

export default function FilterModal({ onClose, onApply, initial }) {
  const [f, setF] = useState({ ...EMPTY_FILTER, ...initial })
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">

        {/* Header */}
        <div className="px-6 pt-5">
          <div className="flex px-2 items-center gap-3 mb-2">
            <button onClick={onClose} className="text-[#5B6078] dark:text-[#C2C8E0] hover:opacity-70 cursor-pointer shrink-0">
              <FaArrowLeft className="dark:text-white text-[#1A1D2E]" size={16} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF]">Filtrlash</h2>
          </div>
          <p className="text-[15px] text-[#5B6078] dark:text-[#C2C8E0] mt-0.5">
            Kerakli filtirlarni tanlang, natijalar shunga qarab saralanadi
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Loyiha + Summa */}
          <div className="grid grid-cols-2 gap-4">
            <LoyihaDropdown value={f.loyiha} onChange={v => set('loyiha', v)} />
            <div>
              <label className={labelCls}>Summa (UZS)</label>
              <div className="flex gap-2">
                <input
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors
                    bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#5B6078] focus:border-[#526ED3]
                    dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]"
                  placeholder="dan: 0"
                  value={f.sumFrom}
                  onChange={e => set('sumFrom', fmtMoney(e.target.value))}
                />
                <input
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors
                    bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#5B6078] focus:border-[#526ED3]
                    dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]"
                  placeholder="gacha: 0"
                  value={f.sumTo}
                  onChange={e => set('sumTo', fmtMoney(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Xarajat turi + Toifa */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Xarajat turi" value={f.type} onChange={v => set('type', v)} options={XARAJAT_TURLARI} placeholder="Xarajat turini tanlang" />
            <SelectField label="Toifa" value={f.toifa} onChange={v => set('toifa', v)} options={TOIFALAR} placeholder="Toifani tanlang" />
          </div>

          {/* Vaqt oraliqlar */}
          <DateTimeRangeRow
            label="Yaratilgan vaqt oralig'i"
            dateFromD={f.dateFromD} dateFromT={f.dateFromT}
            dateToD={f.dateToD} dateToT={f.dateToT}
            onDateFromD={v => set('dateFromD', v)} onTimeFromD={v => set('dateFromT', v)}
            onDateToD={v => set('dateToD', v)} onTimeToD={v => set('dateToT', v)}
          />
          <DateTimeRangeRow
            label="To'langan vaqt oralig'i"
            dateFromD={f.approvedFromD} dateFromT={f.approvedFromT}
            dateToD={f.approvedToD} dateToT={f.approvedToT}
            onDateFromD={v => set('approvedFromD', v)} onTimeFromD={v => set('approvedFromT', v)}
            onDateToD={v => set('approvedToD', v)} onTimeToD={v => set('approvedToT', v)}
          />
          <DateTimeRangeRow
            label="Tasdiqlangan vaqt oralig'i"
            dateFromD={f.completedFromD} dateFromT={f.completedFromT}
            dateToD={f.completedToD} dateToT={f.completedToT}
            onDateFromD={v => set('completedFromD', v)} onTimeFromD={v => set('completedFromT', v)}
            onDateToD={v => set('completedToD', v)} onTimeToD={v => set('completedToT', v)}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-[#1A1D2E] dark:text-[#C2C8E0]">Mening vazifalarim</span>
            <button type="button" onClick={() => set('myTasks', !f.myTasks)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${f.myTasks ? 'bg-[#000000]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
              <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${f.myTasks ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setF(EMPTY_FILTER)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[15px] font-extrabold transition-colors cursor-pointer
                text-[#1A1D2E] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
              <FaXmark size={14} />
              Tozalash
            </button>
            <button onClick={() => onApply(f)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
                bg-[#3F57B3] text-white hover:bg-[#526ED3]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              Qidirish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
