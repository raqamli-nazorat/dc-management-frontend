import { useRef } from 'react'
import { FaCalendarDays, FaClock } from 'react-icons/fa6'
import { labelCls } from '../constants'

export function DateBox({ type, value, onChange, icon, placeholder }) {
  const ref = useRef(null)
  const isEmpty = !value

  return (
    <div className="flex items-center gap-1.5 px-3 py-2.5 border border-[#E2E6F2] dark:border-[#292A2A]
      rounded-xl bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3]  cursor-text">
      {placeholder && (
        <span className={`text-xs shrink-0 select-none ${isEmpty ? 'text-[#B6BCCB] dark:text-[#474848]' : 'text-[#5B6078] dark:text-[#C2C8E0]'}`}>
          {placeholder}:
        </span>
      )}
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={type === 'time' ? '00:00' : ''}
        step={type === 'time' ? '60' : undefined}
        className={`flex-1 min-w-0 text-xs outline-none bg-transparent cursor-pointer
          placeholder-[#B6BCCB] dark:placeholder-[#474848]
          [&::-webkit-calendar-picker-indicator]:hidden
          ${type === 'date' && !value ? '[&::-webkit-datetime-edit]:opacity-0' : 'text-[#1A1D2E] dark:text-[#FFFFFF]'}
        `}
      />
      <button
        type="button"
        onClick={() => ref.current?.showPicker?.()}
        className="shrink-0 cursor-pointer text-[#B6BCCB] dark:text-[#474848] hover:text-[#526ED3] "
      >
        {icon}
      </button>
    </div>
  )
}

export function DateTimeRangeRow({ label, dateFromD, dateFromT, dateToD, dateToT, onDateFromD, onTimeFromD, onDateToD, onTimeToD }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {/* Dan */}
        <div className="flex gap-1.5">
          <div className="flex-1">
            <DateBox type="date" value={dateFromD} onChange={onDateFromD} placeholder="dan" icon={<FaCalendarDays size={11} />} />
          </div>
          <div className="w-[90px]">
            <DateBox type="time" value={dateFromT || '00:00'} onChange={onTimeFromD} icon={<FaClock size={11} />} />
          </div>
        </div>
        {/* Gacha */}
        <div className="flex gap-1.5">
          <div className="flex-1">
            <DateBox type="date" value={dateToD} onChange={onDateToD} placeholder="gacha" icon={<FaCalendarDays size={11} />} />
          </div>
          <div className="w-[90px]">
            <DateBox type="time" value={dateToT || '00:00'} onChange={onTimeToD} icon={<FaClock size={11} />} />
          </div>
        </div>
      </div>
    </div>
  )
}
