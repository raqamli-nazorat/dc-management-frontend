import { useState, useRef } from 'react'
import { FaXmark, FaArrowLeft } from 'react-icons/fa6'
import ProjectDropdown from '../components/ProjectDropdown'
import AssigneeDropdown from '../components/AssigneeDropdown'
import SimpleSelect from '../components/SimpleSelect'
import { labelCls, fmtNum, LEVELS, TYPES } from '../components/constants'

export default function AddTaskModal({ onClose, onAdd }) {
  const dateRef = useRef(null)
  const timeRef = useRef(null)
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    project: '', name: '', description: '', level: '', type: '',
    assignee: '', price: '', fine: '', deadline: '', time: '', files: [],
  })
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.project)     e.project = true
    if (!form.name.trim()) e.name    = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputCls = err =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors
    bg-white text-[#1A1D2E] placeholder-[#8F95A8]
    dark:bg-[#191A1A] dark:text-white dark:placeholder-[#5B6078]
    ${err ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A] focus:border-[#526ED3]'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <button onClick={onClose} className="fixed top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer transition-colors z-[200]">
        <FaXmark size={14} />
      </button>
      <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">

        <div className="px-7 pt-7 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0"><FaArrowLeft size={17} /></button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Vazifa qo'shish</h2>
          </div>
          <p className="text-sm text-[#8F95A8] ml-8">Yangi vazifa yaratish uchun ma'lumotlarni kiriting</p>
        </div>

        <div className="px-7 pb-4 flex flex-col gap-4">

          <div className="grid grid-cols-2 gap-4">
            <ProjectDropdown value={form.project} onChange={v => { set('project', v); setErrors(p => ({ ...p, project: false })) }} error={errors.project} />
            <div>
              <label className={labelCls}>Nomi</label>
              <input value={form.name} onChange={e => { set('name', e.target.value); setErrors(p => ({ ...p, name: false })) }}
                placeholder="Nomi yozing" className={inputCls(errors.name)} />
              {errors.name && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Tavsifi</label>
            <div className="relative">
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Tavsifni yozing" rows={3} className={inputCls(false) + ' resize-none pr-8'} />
              {form.description && (
                <button type="button" onClick={() => set('description', '')}
                  className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
                  <FaXmark size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SimpleSelect label="Darajasi" value={form.level} onChange={v => set('level', v)} options={LEVELS} placeholder="Darajasi tanlang" />
            <SimpleSelect label="Turi"     value={form.type}  onChange={v => set('type', v)}  options={TYPES}  placeholder="Turi tanlang" />
          </div>

          <AssigneeDropdown value={form.assignee} onChange={v => set('assignee', v)} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Vazifa narxi (UZS)</label>
              <input value={form.price} onChange={e => set('price', fmtNum(e.target.value))}
                placeholder="0.00" className={inputCls(false) + ' text-right'} />
            </div>
            <div>
              <label className={labelCls}>Jarima foizi (%)</label>
              <input value={form.fine} onChange={e => set('fine', e.target.value.replace(/\D/g, ''))}
                placeholder="Jarima" className={inputCls(false)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Muddati</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                <input ref={dateRef} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                  className={`flex-1 min-w-0 text-sm outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden
                    ${!form.deadline ? '[&::-webkit-datetime-edit]:opacity-0' : 'text-[#1A1D2E] dark:text-white'}`} />
                <button type="button" onClick={() => dateRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Taxminiy vaqt</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                <input ref={timeRef} type="time" value={form.time || '00:00'} onChange={e => set('time', e.target.value === '00:00' ? '' : e.target.value)}
                  step="60"
                  className={`flex-1 min-w-0 text-sm outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden
                    ${!form.time ? 'text-[#B6BCCB] dark:text-[#474848]' : 'text-[#1A1D2E] dark:text-white'}`} />
                <button type="button" onClick={() => timeRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Qo'shimcha fayllar</label>
            <div onClick={() => fileRef.current?.click()}
              className="flex flex-wrap gap-2 min-h-[64px] px-3 py-3 rounded-xl border-2 border-dashed border-[#E2E6F2] dark:border-[#292A2A]
                bg-white dark:bg-[#191A1A] cursor-pointer hover:border-[#526ED3] transition-colors">
              {form.files.length === 0 && (
                <span className="text-sm text-[#8F95A8] dark:text-[#5B6078] select-none m-auto">Fayl yuklash uchun bosing</span>
              )}
              {form.files.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]">
                  {f.name}
                  <button type="button" onMouseDown={ev => { ev.stopPropagation(); set('files', form.files.filter((_, j) => j !== i)) }}
                    className="hover:opacity-70 cursor-pointer"><FaXmark size={9} /></button>
                </span>
              ))}
            </div>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={e => set('files', [...form.files, ...Array.from(e.target.files || [])])} />
          </div>

        </div>

        <div className="px-7 py-5 flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={13} /> Yopish
          </button>
          <button onClick={() => { if (!validate()) return; onAdd({ ...form, id: Date.now(), code: 'TASD', creator: 'Admin' }); onClose() }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Qo'shish
          </button>
        </div>

      </div>
    </div>
  )
}
