import { DateTimeBox } from '../../../Components/DateTimeBox'
import { labelCls } from '../constants'

export function DateBox({ type, value, onChange, placeholder }) {
  return (
    <DateTimeBox
      type={type}
      placeholder={placeholder || (type === 'time' ? 'SS:DD' : 'KK/OO/YYYY')}
      value={value}
      onChange={onChange}
    />
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
            <DateTimeBox type="date" placeholder="dan (KK/OO/YYYY)" value={dateFromD} onChange={onDateFromD} />
          </div>
          <div className="w-[100px]">
            <DateTimeBox type="time" placeholder="SS:DD" value={dateFromT} onChange={onTimeFromD} />
          </div>
        </div>
        {/* Gacha */}
        <div className="flex gap-1.5">
          <div className="flex-1">
            <DateTimeBox type="date" placeholder="gacha (KK/OO/YYYY)" value={dateToD} onChange={onDateToD} />
          </div>
          <div className="w-[100px]">
            <DateTimeBox type="time" placeholder="SS:DD" value={dateToT} onChange={onTimeToD} />
          </div>
        </div>
      </div>
    </div>
  )
}
