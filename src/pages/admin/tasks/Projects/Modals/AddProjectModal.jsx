import { useEffect, useRef, useState } from "react"
import { axiosAPI } from "../../../../../service/axiosAPI"
import { FaArrowLeft, FaCheck, FaChevronDown, FaXmark } from "react-icons/fa6"
import { Roles } from "../../../../../MostUsesDates/"
import { DatePicker, TimePicker } from "antd"
import { toast } from "../../../../../Toast/ToastProvider"
import dayjs from "dayjs"

const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'

const UserPickerModal = ({ title, selected, onConfirm, onClose, users = [], onSearch }) => {
  const [search, setSearch] = useState('')
  const [temp, setTemp] = useState(selected.map(u => u.id))

  const toggle = (id) => setTemp(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )

  const toggleAll = () => {
    if (temp.length === users.length) setTemp([])
    else setTemp(users.map(u => u.id))
  }

  const handleConfirm = () => {
    onConfirm(users.filter(u => temp.includes(u.id)))
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative w-full min-h-[70vh]! max-w-[520px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111] flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer">
              <FaArrowLeft size={16} />
            </button>
            <h2 className="text-lg font-extrabold text-[#1A1D2E] dark:text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border  cursor-pointer border-[#E2E6F2] text-[#5B6078] hover:bg-[#F1F3F9] dark:border-[#292A2A] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              Barchini tanlash
            </button>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Ism Sharifi bo'yicha izlash"
                value={search}
                onChange={e => {
                  if (e.target.value.length > 0) {
                    setSearch(e.target.value)
                  } else {
                    setSearch("");
                    onSearch("");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSearch(search);
                  }
                }}
                className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none border bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-white dark:placeholder-[#5B6078] focus:border-[#526ED3]"
              />
            </div>
          </div>
        </div>
        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-2">
          {users.length === 0 && (
            <p className="text-sm text-[#8F95A8] text-center py-8">Foydalanuvchi topilmadi</p>
          )}
          {users.map(u => {
            const isSelected = temp.includes(u.id)
            return (
              <button
                key={u.id}
                onClick={() => toggle(u.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border  cursor-pointer text-left
                  ${isSelected
                    ? 'bg-[#EEF1FB] border-[#C7D0F5] dark:bg-[#292A2A] dark:border-[#3F57B3]'
                    : 'bg-white border-[#EEF1F7] hover:bg-[#F8F9FC] dark:bg-[#191A1A] dark:border-[#292A2A] dark:hover:bg-[#222323]'}`}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                  ${isSelected ? 'bg-[#3F57B3] border-[#3F57B3]' : 'border-[#D0D5E2] dark:border-[#474848]'}`}>
                  {isSelected && <FaCheck size={9} className="text-white" />}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-xs font-bold text-[#526ED3] shrink-0">
                  {u.username?.slice(0, 2).toUpperCase()}
                </div>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1A1D2E] dark:text-white truncate">{u.username}</p>
                  <p className="text-xs text-[#8F95A8] dark:text-[#5B6078] truncate">
                    {u.roles?.map(r => Roles[r] || r).join(', ') || '—'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EEF1F7] dark:border-[#292A2A] flex items-center justify-between shrink-0">
          <span className="text-sm text-[#5B6078] dark:text-[#C2C8E0]">{temp.length} ta tanlangan</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setTemp([])}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium  cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
              <FaXmark size={12} /> Tozalash
            </button>
            <button onClick={handleConfirm}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold  cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
              <FaCheck size={12} /> Qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const SelectedUsersField = ({ label, selected, onOpen, onRemove }) => {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div
        onClick={onOpen}
        className="w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer text-left 
          bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A] hover:border-[#526ED3]"
      >
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-sm text-[#8F95A8] dark:text-[#5B6078]">{label}</span>
          ) : (
            selected.map(u => (
              <span key={u.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium
                  bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]">
                {u.username}
                <span
                  onMouseDown={e => { e.stopPropagation(); onRemove(u.id) }}
                  className="hover:opacity-70 cursor-pointer ml-0.5 flex items-center">
                  <FaXmark size={9} />
                </span>
              </span>
            ))
          )}
        </div>
        <FaChevronDown size={11} className="text-[#8F95A8] shrink-0 ml-2" />
      </div>
    </div>
  )
}

const AddProjectModal = ({ onClose, refreshData, useDropdown, STATUS_API }) => {
  const { open: statusOpen, setOpen: setStatusOpen, ref: statusRef } = useDropdown()
  const { open: mgrOpen, setOpen: setMgrOpen, ref: mgrRef } = useDropdown()

  const [users, setUsers] = useState([])
  const [testers, setTesters] = useState([])

  const getUsers = async (searchTerm = "") => {
    try {
      const { data } = await axiosAPI.get('/users/', { params: { search: searchTerm, page_size: 100 } })
      setUsers(data?.data?.results || data?.results || data || [])
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.error?.errorMsg || 'Xodimlar topilmadi')
    }
  }

  const getTesters = async (searchTerm = "") => {
    try {
      const { data } = await axiosAPI.get('reports/projects/all-testers/', { params: { search: searchTerm, page_size: 100 } })
      setTesters(data?.data || [])
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.error?.errorMsg || 'Xodimlar topilmadi')
    }
  }

  useEffect(() => {
    getUsers("")
    getTesters("")
  }, [])

  const [form, setForm] = useState({
    title: '', prefix: '', status: 'active', description: '', manager: null,
    project_price: '', penalty_percentage: '', employees: [], testers: [],
    deadline: '', time: '', is_active: true,
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(null)

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
  }

  const fmtBonus = (raw, key) => {
    if (!raw) return ""

    let val = raw.toString().replace(/[^0-9.]/g, "")
    if (key === "penalty" && Number(val) > 100) {
      val = "100"
    }

    const dots = val.split(".")
    if (dots.length > 2) {
      val = dots[0] + "." + dots.slice(1).join("")
    }
    const [int, dec] = val.split(".")
    const fmtInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    return dec !== undefined ? `${fmtInt}.${dec.slice(0, 2)}` : fmtInt
  }

  const validate = () => {
    const e = {}
    if (!form.title?.trim()) e.title = true
    if (!form.prefix?.trim()) e.prefix = true
    if (!form.status) e.status = true
    if (!form.manager) e.manager = true
    if (!form.project_price) e.project_price = true
    if (!form.penalty_percentage) e.penalty_percentage = true
    if (!form.deadline) e.deadline = true
    if (!form.time) e.time = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const body = {
        title: form.title.trim(),
        prefix: form.prefix.trim().toUpperCase(),
        status: form.status,
        description: form.description.trim(),
        is_active: form.is_active,
        project_price: form.project_price.toString().replace(/\s/g, ''),
        penalty_percentage: form.penalty_percentage.toString().replace(/\s/g, ''),
      }
      if (form.manager) body.manager = form.manager.id
      if (form.employees.length) body.employees = form.employees.map(u => u.id)
      if (form.testers.length) body.testers = form.testers.map(u => u.id)
      if (form.deadline) {
        const dStr = typeof form.deadline === 'string' ? form.deadline : form.deadline.format('YYYY-MM-DD')
        const tStr = typeof form.time === 'string' ? form.time : (form.time?.format?.('HH:mm') || '00:00')
        body.deadline = `${dStr}T${tStr}:00`
      }
      const res = await axiosAPI.post('/projects/', body)

      if (refreshData) refreshData()

      toast.success('Loyiha yaratildi.', "Yangi loyiha muvaffaqiyatli qo'shildi.")
      onClose()
    } catch (err) {
      const details = err?.response?.data?.error?.details
      const errorMsg = err?.response?.data?.error?.errorMsg || 'Loyiha yaratishda xatolik yuz berdi'
      if (details && typeof details === 'object') {
        const newErrors = {}
        if (details.title) newErrors.title = Array.isArray(details.title) ? details.title[0] : true
        if (details.prefix) newErrors.prefix = Array.isArray(details.prefix) ? details.prefix[0] : true
        if (details.status) newErrors.status = Array.isArray(details.status) ? details.status[0] : true
        if (details.description) newErrors.description = Array.isArray(details.description) ? details.description[0] : true
        if (details.manager) newErrors.manager = Array.isArray(details.manager) ? details.manager[0] : true
        if (details.deadline) newErrors.deadline = Array.isArray(details.deadline) ? details.deadline[0] : true

        if (Object.keys(newErrors).length) setErrors(newErrors)
        const msgs = Object.entries(details)
          .map(([, v]) => Array.isArray(v) ? v[0] : v)
          .filter(Boolean)
          .join('\n')
        toast.error('Xatolik', msgs || errorMsg)
      } else {
        toast.error('Xatolik', errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (err) =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border bg-white text-[#1A1D2E] placeholder-[#8F95A8] dark:bg-[#191A1A] dark:text-white dark:placeholder-[#5B6078] ${err ? 'border-red-500 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A] focus:border-[#526ED3]'}`

  const statusList = Array.isArray(STATUS_API) ? STATUS_API : Object.entries(STATUS_API || {}).map(([value, label]) => ({ value, label }))
  const currentStatusLabel = statusList.find(s => s.value === form.status)?.label || 'Holati tanlang'

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer  z-[200]">
          <FaXmark size={14} />
        </button>

        <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">
          {/* header */}
          <div className="px-7 pt-7 pb-4 sticky top-0 bg-white dark:bg-[#111111] z-[100] rounded-t-xl">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
                <FaArrowLeft size={17} />
              </button>
              <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Loyiha qo'shish</h2>
            </div>
            <p className="text-sm text-[#5B6078]">Loyiha nomi va asosiy ma'lumotlarni to'ldiring</p>
          </div>

          {/* body */}
          <div className="px-7 pb-4 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nomi</label>
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="Nomi kiriting"
                  className={inputCls(errors.title)}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{typeof errors.title === 'string' ? errors.title : '* Bu maydon majburiy'}</p>}
              </div>
              <div ref={statusRef}>
                <label className={labelCls}>Holati</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setStatusOpen(o => !o)}
                    className={`w-full flex items-center disabled:cursor-default! justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer bg-white dark:bg-[#191A1A] ${errors.status ? 'border-red-500 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'} ${form.status ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}
                    disabled
                  >
                    <span>{currentStatusLabel}</span>
                    <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {errors.status && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
                  {statusOpen && (
                    <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
                      {statusList.map((s, i) => (
                        <button key={s.value} type="button" onClick={() => { set('status', s.value); setStatusOpen(false) }}
                          className={`w-full text-left px-4 py-2.5 text-sm  cursor-pointer ${i < statusList.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''} ${form.status === s.value ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Tavsifi</label>
              <div className="relative">
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Tavsifni yozing" rows={3}
                  className={inputCls(errors.description) + ' resize-none'} />
                {form.description && (
                  <button type="button" onClick={() => set('description', '')}
                    className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
                    <FaXmark size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div ref={mgrRef}>
                <label className={labelCls}>Menejer</label>
                <div className="relative">
                  <button type="button" onClick={() => setMgrOpen(o => !o)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer bg-white ${errors.manager ? 'border-red-500 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'} dark:bg-[#191A1A]`}>
                    <span className={form.manager ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}>
                      {form.manager?.username || 'Menejer tanlang'}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {form.manager && (
                        <span onMouseDown={e => { e.stopPropagation(); set('manager', null) }}
                          className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                      )}
                      <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${mgrOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {mgrOpen && (
                    <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-48 bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
                      {users.filter(u => u.roles?.includes('manager')).map((u, i, arr) => (
                        <button key={u.id} type="button" onClick={() => { set('manager', u); setMgrOpen(false) }}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer ${i < arr.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''} ${form.manager?.id === u.id ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                          <div className="w-6 h-6 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-[10px] font-bold text-[#526ED3] shrink-0">
                            {u.username?.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate">{u.username}</p>
                            {u.position && <p className="text-xs text-[#8F95A8] truncate">{u.position}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.manager && <p className="text-xs text-red-500 mt-1">* Bu maydon majburiy</p>}
              </div>
              <div>
                <label className={labelCls}>Loyiha narxi (UZS)</label>
                <input value={form.project_price} onChange={e => set('project_price', fmtBonus(e.target.value))}
                  placeholder="Loyiha uchun: 0,0"
                  className={inputCls(errors.project_price) + "font-bold"} />
                {errors.project_price && <p className="text-xs text-red-500 mt-1">* Bu maydon majburiy</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Titul</label>
                <input
                  value={form.prefix}
                  onChange={e => set('prefix', e.target.value.toUpperCase())}
                  placeholder="Titul kiriting"
                  className={inputCls(errors.prefix)}
                  maxLength={3}
                />
                {errors.prefix && <p className="text-xs text-red-500 mt-1">* Bu maydon majburiy</p>}
              </div>

              <div>
                <label className={labelCls}>Jarima foizi (%)</label>
                <input
                  value={form.penalty_percentage}
                  onChange={e => set('penalty_percentage', fmtBonus(e.target.value, "penalty"))}
                  placeholder="0,0"
                  className={inputCls(errors.penalty_percentage)}
                />
                {errors.penalty_percentage && <p className="text-xs text-red-500 mt-1 ml-1">* Bu maydon majburiy</p>}
              </div>
            </div>

            <SelectedUsersField
              label="Xodimlar"
              selected={form.employees}
              onOpen={() => setPickerOpen('employees')}
              onRemove={id => set('employees', form.employees.filter(u => u.id !== id))}
            />

            <SelectedUsersField
              label="Sinovchilar"
              selected={form.testers}
              onOpen={() => setPickerOpen('testers')}
              onRemove={id => set('testers', form.testers.filter(u => u.id !== id))}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Muddat sanasi</label>
                <DatePicker
                  value={form.deadline ? dayjs(form.deadline) : null}
                  onChange={(val) => set('deadline', val)}
                  className={`py-2! rounded-xl! w-full ${errors.deadline ? 'border-red-500!' : ''}`}
                  format="DD-MM-YYYY"
                  placeholder="Muddat"
                />
                {errors.deadline && <p className="text-xs text-red-500 mt-1 ml-1">* Bu maydon majburiy</p>}
              </div>
              <div>
                <label className={labelCls}>Soati</label>
                <TimePicker
                  value={form.time ? dayjs(form.time, 'HH:mm') : null}
                  onChange={(val) => set('time', val)}
                  className={`py-2! rounded-xl! w-full ${errors.time ? 'border-red-500!' : ''}`}
                  format="HH:mm"
                  placeholder="00:00"
                />
                {errors.time && <p className="text-xs text-red-500 mt-1 ml-1">* Bu maydon majburiy</p>}
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="px-7 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#1A1D2E] dark:text-white">Faolmi?</span>
              <button type="button" onClick={() => set('is_active', !form.is_active)}
                className={`relative w-10 h-5 rounded-full  cursor-pointer ${form.is_active ? 'bg-[#3F57B3]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
                <span className={`absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
                <FaXmark size={13} /> Yopish
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3] disabled:opacity-60">
                {loading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      </div>

      {pickerOpen === 'employees' && (
        <UserPickerModal title="Xodim tanlang"
          selected={form.employees}
          users={users}
          onClose={() => setPickerOpen(null)}
          onConfirm={list => { set('employees', list); setPickerOpen(null) }}
          onSearch={getUsers}
        />
      )}

      {pickerOpen === 'testers' && (
        <UserPickerModal title="Sinovchi tanlang"
          selected={form.testers}
          users={testers}
          onClose={() => setPickerOpen(null)}
          onConfirm={list => { set('testers', list); setPickerOpen(null) }}
          onSearch={getTesters}
        />
      )}
    </>
  )
}

export default AddProjectModal