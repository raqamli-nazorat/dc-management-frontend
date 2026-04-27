import { useState } from 'react'
import { FaXmark, FaArrowLeft } from 'react-icons/fa6'
import SimpleSelect from '../components/SimpleSelect'
import { EMPTY_FILTER, PROJECTS, STATUSES, LEVELS, TYPES, ASSIGNEES } from '../components/constants'

export default function TaskFilterModal({ onClose, onApply, initial }) {
  const [f, setF] = useState({ ...EMPTY_FILTER, ...initial })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <button onClick={onClose} className="fixed top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer transition-colors z-[200]">
        <FaXmark size={14} />
      </button>
      <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">

        <div className="px-7 pt-7 pb-3">
          <div className="flex items-center gap-3 mb-1.5">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Filtrlash</h2>
          </div>
          <p className="text-sm text-[#5B6078]">Kerakli filtrlarni tanlang, natijalar shunga qarab saralanadi</p>
        </div>

        <div className="px-7 pb-5 pt-2 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <SimpleSelect label="Loyiha"   value={f.project}  onChange={v => set('project', v)}  options={PROJECTS}  placeholder="Loyiha tanlang" />
            <SimpleSelect label="Holati"   value={f.status}   onChange={v => set('status', v)}   options={STATUSES}  placeholder="Holat tanlang" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SimpleSelect label="Darajasi" value={f.level}    onChange={v => set('level', v)}    options={LEVELS}    placeholder="Daraja tanlang" />
            <SimpleSelect label="Turi"     value={f.type}     onChange={v => set('type', v)}     options={TYPES}     placeholder="Tur tanlang" />
          </div>
          <SimpleSelect label="Topshiruvchi" value={f.assignee} onChange={v => set('assignee', v)} options={ASSIGNEES} placeholder="Topshiruvchi tanlang" />
        </div>

        <div className="px-7 py-5 flex items-center justify-end gap-3">
          <button onClick={() => setF(EMPTY_FILTER)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={13} /> Tozalash
          </button>
          <button onClick={() => onApply(f)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Qidirish
          </button>
        </div>

      </div>
    </div>
  )
}
