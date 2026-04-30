import { useEffect, useRef, useState } from 'react'
import { usePageAction } from '../../../context/PageActionContext'
import { LuFilter, LuUserPlus } from 'react-icons/lu'
import { FaAngleDown, FaChevronDown } from 'react-icons/fa'
import { FaRegFile, FaXmark } from 'react-icons/fa6'
import { DatePicker, Select } from 'antd'
import { usePositions, useRegions } from "../../../MostUsesDates"
import FilterSelect from '../Components/FilterSelect'
import EmployeeStep from "./Modals/EmployeeStep"
import { toast } from '../../../Toast/ToastProvider'
import { axiosAPI } from '../../../service/axiosAPI'
import dayjs from 'dayjs'

const CostInquiries = {
  paid: "To'landi",
  pending: "Kutulmoqda",
  accepted: "Tasdiqlandi",
  rejected: "Bekor qilindi"
}

const SalaryType = {
  kpi: "KPI bonusi",
  fine: "Jarima miqdori"
}

const FilterInput = ({ label, value, onChange, isFine, className = '' }) => {
  const [focused, setFocused] = useState(false)
  const hasValue = value !== '' && value !== null && value !== undefined && value !== 0
  const isActive = focused || hasValue

  const getFontSize = () => {
    if (!isActive) return 14
    const strValue = value?.toString() || ''
    const length = strValue.length
    if (length <= 10) return 14
    if (length <= 12) return 12
    if (length <= 14) return 11
    return 10
  }

  const fontSize = getFontSize()
  const labelWidth = label === 'dan' ? 38 : 52

  return (
    <div
      className={`flex-1 dark:bg-[#222323] border border-slate-200 dark:border-[#292A2A] rounded-xl flex flex-col justify-center px-4 h-11 focus-within:border-blue-400 transition-all duration-300 relative cursor-text group ${className}`}
      onClick={() => setFocused(true)}
    >
      <span
        className={`absolute left-4 transition-all duration-300 pointer-events-none font-semibold
          ${isActive
            ? 'top-1.5 text-[10px] text-slate-400'
            : 'top-1/2 -translate-y-1/2 text-sm text-slate-400'
          }`}
      >
        {label}{!isActive && ':'}
      </span>

      <div
        className={`flex items-center transition-all duration-300
          ${isActive
            ? 'mt-3'
            : `ml-[${labelWidth}px]`
          }`}
        style={{ marginLeft: isActive ? 0 : `${labelWidth}px` }}
      >
        {isFine && (hasValue || value === 0) && (
          <span className="text-red-500 font-bold mr-0.5" style={{ fontSize: `${fontSize}px` }}>-</span>
        )}

        {!isActive && !focused ? (
          <span className="text-slate-900 dark:text-white text-sm font-medium">0</span>
        ) : (
          <input
            value={value === 0 ? '' : value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full bg-transparent outline-none font-bold transition-all duration-300 ${isFine ? 'text-red-500!' : 'text-slate-900! dark:text-white!'}`}
            style={{ fontSize: `${fontSize}px` }}
            autoFocus={focused}
            placeholder={focused ? "0" : ""}
          />
        )}
      </div>
    </div>
  )
}

const initialFilters = {
  startDate: '',
  endDate: '',
  position: '',
  region: '',
  salary_min: 0,
  salary_max: 0,
  balance_min: 0,
  balance_max: 0,
  task_status: '',
  tasks_min: 0,
  tasks_max: 0,
  expenses_amount_min: 0,
  expenses_amount_max: 0,
  payrolls_amount_min: 0,
  payrolls_amount_max: 0,
  project_status: '',
  projects_min: 0,
  projects_max: 0,
  meetings_min: 0,
  meetings_max: 0,
  ishHaqiType: '',
}

const Employee = () => {

  const positions = usePositions()
  const regions = useRegions()

  const { setDownload, setPrint, clearDownload, clearPrint } = usePageAction()
  const [search, setSearch] = useState(null)
  const [filterModal, setFilterModal] = useState(false)
  const [filters, setFilters] = useState({})
  const [selectEmployee, setSelectEmployee] = useState(false)
  const [UserReports, setUserReports] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [ReportsNextURL, setReportsNextURL] = useState(null)
  const filterRef = useRef(null)

  useEffect(() => {
    if (!filterModal) return

    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterModal(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [filterModal])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getEmployeeReports = async ({ params, search }) => {
    setIsLoading(true)
    setHasFetched(true)

    try {
      const { data } = await axiosAPI.get(`reports/users/`, { params: { ...params, search } })
      const results = data.data.results || []

      setUserReports(results)
      setReportsNextURL(data.data.next)
    } catch (error) {
      console.error(error);

      const errData = error?.response?.data?.error;

      // Field-level detail xatolarini chiqarish (masalan: password, name ...)
      let errMsg = "Xatolik yuz berdi" || error?.response?.data?.error?.errorMsg;
      if (errData?.details && typeof errData.details === 'object') {
        const detailMsgs = Object.values(errData.details).flat().join(' ');
        if (detailMsgs) errMsg = detailMsgs;
      } else if (errData?.errorMsg) {
        errMsg = errData.errorMsg;
      } else if (typeof error?.response?.data === 'string') {
        errMsg = error.response.data;
      }

      toast.error('Yangilanishda xatolik', errMsg);
    }
    finally {
      setIsLoading(false)
    }
  }


  const loadMoreReports = async () => {
    if (!ReportsNextURL) return
    try {
      const { data } = await axiosAPI.get(ReportsNextURL)
      setUserReports(prev => [...prev, ...data.data.results])
    } catch (error) {
      console.error(error)
      toast.error('Keyingi sahifani yuklashda xatolik yuz berdi.', error?.response?.data?.error?.errMsg || 'Iltimos, qayta urinib ko\'ring.')
    }
  }

  const handleMoreReportsScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      loadMoreReports()
    }
  }

  const handleExcelDownload = () => {
    console.log('excel')
  }

  const handlePdfDownload = () => {
    console.log('pdf')
  }

  const handleCsvDownload = () => {
    console.log('csv')
  }

  const handlePrint = () => {
    console.log('print')
  }

  // Initialize page actions on mount
  useEffect(() => {
    setDownload({
      show: true,
      excel: handleExcelDownload,
      pdf: handlePdfDownload,
      csv: handleCsvDownload
    })
    setPrint({
      show: true,
      onClick: handlePrint
    })

    return () => {
      clearDownload()
      clearPrint()
    }
  }, [])

  const formatNum = (val) => {
    if (!val && val !== 0) return '';

    let cleanVal = val.toString().replace(/[^\d.]/g, '');

    let [integerPart, decimalPart] = cleanVal.split('.');

    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    if (decimalPart !== undefined) {
      const sliced = decimalPart.slice(0, 2);
      if (sliced === '00') {
        return integerPart === '0' ? '' : integerPart;
      }
      return `${integerPart}.${sliced}`;
    }

    return integerPart === '0' ? '' : integerPart;
  }

  const handleClear = () => {
    setFilters({})
    setSearch('')
    setFilterModal(false)
    getEmployeeReports({ params: {} })
  }

  const handleSelectEmployeeConfirm = (selected) => {
    console.log('confirm', selected)
    setFilters(prev => ({ ...prev, users: selected }))
    console.log(filters)
    setSelectEmployee(false)
  }


  return (
    <div className="relative">
      <div className='flex items-center justify-between'>
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#8E95B5]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Izlash..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 outline-none transition-colors bg-slate-100 border border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8] dark:bg-[#222323] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5]"
              style={{ fontSize: 13, fontWeight: 500, padding: '6px 12px 6px 32px', borderRadius: 12 }}
            />
          </div>
          <button
            onClick={() => setFilterModal(!filterModal)}
            className={`flex items-center justify-between gap-2 h-8 px-5 pr-3! bg-slate-100 dark:bg-[#1E2021] dark:text-slate-400! rounded-xl text-slate-600 text-sm font-semibold cursor-pointer relative border border-slate-200 dark:border-[#292A2A] ${Object.keys(filters).some(key => filters[key] !== initialFilters[key] && filters[key] !== null && filters[key] !== undefined) ? 'filter-notif' : ''}`}
          >
            <LuFilter size={16} />
            Filtrlash

            <FaAngleDown size={16} className={`transition-transform duration-300 ${!filterModal ? '-rotate-90' : ''}`} />
          </button>
          {Object.keys(filters).some(key => filters[key] !== initialFilters[key] && filters[key] !== null && filters[key] !== undefined) && (
            <button
              onClick={handleClear}
              className={`flex items-center justify-between gap-2 h-8 px-4 bg-red-100 rounded-xl text-red-600 dark:bg-red-100 text-sm font-semibold cursor-pointer`}
            >
              <FaXmark size={16} />
              Tozalash
            </button>
          )}
        </div>
        <button
          className={`flex items-center justify-between gap-2 px-4 py-2 bg-green-500 rounded-xl text-white text-sm font-bold cursor-pointer transition-all duration-300 hover:bg-green-600 disabled:bg-slate-400 dark:disabled:bg-slate-800 disabled:cursor-default`}
          disabled={!Object.keys(filters).some(key => filters[key] !== initialFilters[key] && filters[key] !== null && filters[key] !== undefined) && !search}
          onClick={() => {
            getEmployeeReports({ params: filters, search });
            setFilterModal(false);
          }}
        >
          <FaRegFile size={15} />
          Shakillantirish
        </button>
      </div>
      {/* Filter Panel */}
      {filterModal && (
        <div ref={filterRef} className="absolute top-8 z-50 mt-4 p-6 bg-white dark:bg-[#1E2021] border border-slate-200 dark:border-[#292A2A] rounded-3xl shadow-xl space-y-6 transition-all duration-500 animate-in fade-in slide-in-from-top-4">

          {/* Row 1: Muddat, Lavozimi, Viloyat, UserIcon */}
          <div className="grid grid-cols-16 gap-4">
            <div className="col-span-12 lg:col-span-8">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Muddat</label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <DatePicker
                    showTime
                    inputReadOnly
                    format="DD.MM.YYYY HH:mm"
                    value={filters.startDate}
                    onChange={(value) => handleFilterChange('startDate', value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400 transition-colors hover:border-slate-200!"
                    placeholder='Boshlanish sana'
                  />
                </div>
                <div className="relative flex-1">
                  <DatePicker
                    showTime
                    inputReadOnly
                    value={filters.endDate}
                    format="DD.MM.YYYY HH:mm"
                    onChange={(value) => handleFilterChange('endDate', value)}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400 transition-colors hover:border-slate-200!"
                    placeholder='Tugash sana'
                  />
                </div>
              </div>
            </div>

            <div className="col-span-12 md:col-span-4 lg:col-span-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Lavozimi</label>
              <div className="relative">
                <FilterSelect
                  padding='12px 12px'
                  value={positions.find(p => p.id === filters.position)?.name}
                  placeholder="Lavozim tanlash"
                  options={positions.map(pos => pos.name)}
                  onChange={(value) => handleFilterChange('position', positions.find(p => p.name === value).id)}
                />
              </div>
            </div>

            <div className="col-span-12 md:col-span-3 lg:col-span-3">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Viloyat</label>
              <div className="relative">
                <FilterSelect
                  padding='12px 12px'
                  value={filters.region}
                  placeholder="Viloyat tanlash"
                  options={regions.map(reg => reg.name)}
                  onChange={(value) => handleFilterChange('region', value)}
                />
              </div>
            </div>

            <div className="col-span-12 md:col-span-4 lg:col-span-1 flex items-end justify-end">
              <button
                onClick={() => setSelectEmployee(true)}
                className={`h-11 px-5 flex  relative items-center justify-center cursor-pointer bg-slate-100 dark:bg-[#222323] border border-slate-200 dark:border-[#292A2A] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d] transition-colors ${filters?.users?.length > 0 ? 'filter-notif' : ''}`}
              >
                <LuUserPlus size={20} />
              </button>
            </div>
          </div>

          {/* Row 2: Oylik maoshi, Balansi */}
          <div className="grid grid-cols-8 gap-4">
            <div className="col-span-2 md:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Oylik maoshi (UZS)</label>
              <div className="flex items-center gap-3">
                <FilterInput
                  label="dan"
                  value={filters.salary_min}
                  onChange={(e) => handleFilterChange('salary_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  value={filters.salary_max}
                  onChange={(e) => handleFilterChange('salary_max', formatNum(e.target.value))}
                />
              </div>
            </div>

            <div className="col-span-4 md:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Balansi (UZS)</label>
              <div className="flex items-center gap-3">
                <FilterInput
                  label="dan"
                  value={filters.balance_min}
                  onChange={(e) => handleFilterChange('balance_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  value={filters.balance_max}
                  onChange={(e) => handleFilterChange('balance_max', formatNum(e.target.value))}
                />
              </div>
            </div>

            <div className="col-span-4 md:col-span-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Loyiha</label>
              <div className='grid grid-cols-4 gap-3'>
                <div className="col-span-2 relative">
                  <Select
                    value={filters.project_status || 'Jami'}
                    onChange={(value) => handleFilterChange('project_status', value)}
                    className="w-full custom-antd-select text-sm! py-[11px]! rounded-xl!"
                    size="large"
                    allowClear
                    placeholder="Jami"
                    optionLabelProp="label"
                    options={[
                      {
                        value: 'completed',
                        label: 'Tugatilgan',
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#99CC00]"></span> Tugatilgan</div>
                      },
                      {
                        value: 'active',
                        label: 'Jarayonda',
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#8BBABB]"></span> Jarayonda</div>
                      },
                      {
                        value: 'cancelled',
                        label: 'Bekor qilingan',
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1A1D2E]"></span> Bekor qilingan</div>
                      },
                      {
                        value: 'overdue',
                        label: 'Muddati o\'tgan',
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#FF1919]"></span> Muddati o'tgan</div>
                      },
                      {
                        value: 'planning',
                        label: 'Rejalashtirilgan',
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#D9D9D9]"></span> Rejalashtirilgan</div>
                      },
                    ]}
                    optionRender={(option) => option.data.dropdownLabel || option.data.label}
                  />
                </div>
                <FilterInput
                  label="dan"
                  value={filters.projects_min}
                  onChange={(e) => handleFilterChange('projects_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  value={filters.projects_max}
                  onChange={(e) => handleFilterChange('projects_max', formatNum(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Vazifalar, (placeholder or other) */}
          <div className="grid grid-cols-8 gap-4">
            <div className="col-span-4 md:col-span-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Vazifalar</label>
              <div className='grid grid-cols-4 gap-3'>
                <div className="col-span-2">
                  <Select
                    value={filters.task_status || 'Jami'}
                    onChange={(value) => handleFilterChange('task_status', value)}
                    className="w-full custom-antd-select text-sm! py-[11px]! rounded-xl!"
                    size="large"
                    allowClear
                    placeholder="Jami"
                    optionLabelProp="label"
                    options={[
                      {
                        value: 'todo',
                        label: 'Qilish kerak',
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#FBC02D]"></span> Qilish kerak</div>
                      },
                      {
                        value: 'in_progress',
                        label: 'Jarayonda',
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1E88E5]"></span> Jarayonda</div>
                      },
                      {
                        value: 'production',
                        label: 'Ishga tushurilgan',
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#43A047]"></span> Ishga tushurilgan</div>
                      },
                      {
                        value: 'checked',
                        label: 'Tekshirilgan',
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#20FFF6]"></span>Tekshirilgan</div>
                      },
                      {
                        value: 'rejected',
                        label: 'Rad etilgan',
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#E53935]"></span> Rad etilgan</div>
                      },
                      {
                        value: 'overdue',
                        label: 'Muddati o\'tgan',
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#616161]"></span> Muddati o'tgan</div>
                      },
                      {
                        value: 'done',
                        label: 'Bajarildi',
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#4CAF50]"></span> Bajarildi</div>
                      },
                    ]}
                    optionRender={(option) => option.data.dropdownLabel || option.data.label}
                  />
                </div>
                <FilterInput
                  label="dan"
                  value={filters.tasks_min}
                  onChange={(e) => handleFilterChange('tasks_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  value={filters.tasks_max}
                  onChange={(e) => handleFilterChange('tasks_max', formatNum(e.target.value))}
                />
              </div>
            </div>

            <div className="col-span-4 md:col-span-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Ish staji</label>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2 relative">
                  <FilterSelect
                    // value={filters.ishStajiType}
                    padding='11px 12px'
                    placeholder={'Jami'}
                    // onChange={(value) => handleFilterChange('', value)}
                    options={['Jami', '1 yildan kam', '1-3 yil', '3-5 yil', '5-10 yil', '10 yildan ko\'p']}
                  />
                </div>
                <div className="col-span-1 relative">
                  <FilterInput
                    label="dan"
                    value={filters.meetings_min}
                    onChange={(e) => handleFilterChange('meetings_min', formatNum(e.target.value))}
                  />
                </div>
                <div className="col-span-1 relative">
                  <FilterInput
                    label="gacha"
                    value={filters.meetings_max}
                    onChange={(e) => handleFilterChange('meetings_max', formatNum(e.target.value))}
                  />
                </div>

              </div>
            </div>
          </div>

          {/* Row 4: Xarajat so'rovi, Ish haqi */}
          <div className="grid grid-cols-8 gap-4">
            <div className="col-span-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Xarajat so'rovi (UZS)</label>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2 relative">
                  <FilterSelect
                    // value={filters.ishStajiType}
                    padding='11px 12px'
                    placeholder={'Jami'}
                    // onChange={(value) => handleFilterChange('', value)}
                    options={Object.values(CostInquiries)}
                  />
                </div>
                <FilterInput
                  label="dan"
                  value={filters.expenses_amount_min}
                  onChange={(e) => handleFilterChange('expenses_amount_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  value={filters.expenses_amount_max}
                  onChange={(e) => handleFilterChange('expenses_amount_max', formatNum(e.target.value))}
                />
              </div>
            </div>

            <div className="col-span-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Ish haqi</label>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2 relative">
                  <FilterSelect
                    value={filters.ishHaqiType}
                    padding='11px 12px'
                    placeholder={'Jami'}
                    onChange={(value) => handleFilterChange('ishHaqiType', value)}
                    options={Object.values(SalaryType)}
                  />
                </div>
                <FilterInput
                  label="dan"
                  value={filters.payrolls_amount_min}
                  onChange={(e) => handleFilterChange('payrolls_amount_min', formatNum(e.target.value))}
                  isFine={filters.ishHaqiType === SalaryType.fine}
                />
                <FilterInput
                  label="gacha"
                  value={filters.payrolls_amount_max}
                  onChange={(e) => handleFilterChange('payrolls_amount_max', formatNum(e.target.value))}
                  isFine={filters.ishHaqiType === SalaryType.fine}
                />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Table Section */}
      {isLoading ? (
        <div className="mt-6 rounded-2xl border border-slate-200 dark:border-[#292A2A] bg-white dark:bg-[#1E2021] p-10 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ma'lumotlar shakllantirilmoqda...</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Iltimos, biroz kuting.</p>
        </div>
      ) : !hasFetched ? (
        <div className="mt-6 rounded-2xl border border-slate-200 dark:border-[#292A2A] bg-white dark:bg-[#1E2021] p-10 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filtrlarni tanlang va Shakillantirish tugmasini bosing.</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Bu yerda ma'lumotlar ko'rsatiladi.</p>
        </div>
      ) : UserReports.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 dark:border-[#292A2A] bg-white dark:bg-[#1E2021] p-10 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Natija topilmadi.</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Filtrlarni o'zgartirib qayta urinib ko'ring.</p>
        </div>
      ) : (
        <div
          className="mt-6 overflow-auto rounded-2xl h-[76vh] border border-slate-200 dark:border-[#292A2A]"
          onScroll={handleMoreReportsScroll}
        >
          <table className="text-left border-collapse w-[4500px]">
            <thead className="bg-[#7186ED] text-white">
              <tr>
                <th rowSpan={2} className="p-3 text-xs sticky w-[45px] left-0 z-20! bg-[#7186ED] font-bold border-r-1! border-[#e2e6f2]">№</th>
                <th rowSpan={2} className="p-3 text-xs sticky left-[45px] z-10! bg-[#7186ED] font-bold border-r-1! border-[#e2e6f2]">Ism Sharifi</th>
                <th rowSpan={2} className="p-3 text-xs sticky left-[240px] z-10! bg-[#7186ED] font-bold border-r-1! border-[#e2e6f2] text-center">Lavozim</th>
                <th rowSpan={2} className="p-3 text-xs font-bold border-r-1! border-[#e2e6f2] text-center">Viloyati</th>
                <th rowSpan={2} className="p-3 text-xs font-bold border-r-1! border-[#e2e6f2] text-center">Tumani</th>
                <th rowSpan={2} className="p-3 text-xs font-bold border-r-1! border-[#e2e6f2] text-center">Telefon raqami</th>
                <th rowSpan={2} className="p-3 text-xs font-bold border-r-1! border-[#e2e6f2] text-center">Oylik maosh (UZS)</th>
                <th rowSpan={2} className="p-3 text-xs font-bold border-r-1! border-[#e2e6f2] text-center">Balans (UZS)</th>
                <th colSpan={6} className="p-2 text-xs font-bold border-r-1! text-center border-b border-[#e2e6f2]">Loyihalar</th>
                <th colSpan={8} className="p-2 text-xs font-bold border-r-1! text-center border-b border-[#e2e6f2]">Vazifalar</th>
                <th colSpan={4} className="p-2 text-xs font-bold border-r-1! text-center border-b border-[#e2e6f2]">Yig'ilishlar</th>
                <th colSpan={4} className="p-2 text-xs font-bold border-r-1! text-center border-b border-[#e2e6f2]">Xarajat so'rovlari (UZS)</th>
                <th colSpan={3} className="p-2 text-xs font-bold border-r-1! text-center border-b border-[#e2e6f2]">Ish haqi (UZS)</th>
                <th rowSpan={2} className="p-2 text-xs sticky right-0 z-10! bg-[#7186ED] font-bold border-r-1! text-center border-b border-[#e2e6f2]">Ishga kirgan vaqti</th>
              </tr>
              <tr className="bg-[#8999EF] text-[10px] text-center">
                <th className="p-2 border-r border-[#e2e6f2]">Jami</th>
                <th className="p-2 border-r border-[#e2e6f2]">Tugatilgan</th>
                <th className="p-2 border-r border-[#e2e6f2]">Jarayonda</th>
                <th className="p-2 border-r border-[#e2e6f2]">Bekor qilingan</th>
                <th className="p-2 border-r border-[#e2e6f2]">Muddati o'tgan</th>
                <th className="p-2 border-r border-[#e2e6f2]">Rejalashtirilayotgan</th>
                <th className="p-2 border-r border-[#e2e6f2]">Jami</th>
                <th className="p-2 border-r border-[#e2e6f2]">Qilish kerak</th>
                <th className="p-2 border-r border-[#e2e6f2]">Jarayonda</th>
                <th className="p-2 border-r border-[#e2e6f2]">Muddati o'tgan</th>
                <th className="p-2 border-r border-[#e2e6f2]">Bajarilgan</th>
                <th className="p-2 border-r border-[#e2e6f2]">Ishga tushurilgan</th>
                <th className="p-2 border-r border-[#e2e6f2]">Tekshirilgan</th>
                <th className="p-2 border-r border-[#e2e6f2]">Rad etilgan</th>
                <th className="p-2 border-r border-[#e2e6f2]">Jami</th>
                <th className="p-2 border-r border-[#e2e6f2]">Qatnashgan</th>
                <th className="p-2 border-r border-[#e2e6f2]">Qatnashmaagan "sababli"</th>
                <th className="p-2 border-r border-[#e2e6f2]">Qatnashmagan "sababsiz"</th>
                <th className="p-2 border-r border-[#e2e6f2]">Jami</th>
                <th className="p-2 border-r border-[#e2e6f2]">Kutilmoqda</th>
                <th className="p-2 border-r border-[#e2e6f2]">To'landi</th>
                <th className="p-2 border-r border-[#e2e6f2]">To'lov o'tkazildi "xodim qabul qilmagan</th>
                <th className="p-2 border-r border-[#e2e6f2]">Jami</th>
                <th className="p-2 border-r border-[#e2e6f2]">KPI bonusi</th>
                <th className="p-2 border-r border-[#e2e6f2]">Jarima miqdori</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1E2021] dark:text-slate-300">
              {UserReports.map((item, index) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-[#292A2A] hover:bg-slate-50 dark:hover:bg-[#252626] transition-colors">
                  <td
                    className="p-3 text-xs text-slate-500 border-r! border-t! border-[#e2e6f2] dark:border-[#292A2A] sticky w-[45px] left-0 z-20! bg-slate-50">
                    {index + 1}
                  </td>
                  <td className="p-3 text-xs font-semibold text-slate-700 dark:text-slate-200 border-r! border-t! border-[#e2e6f2] dark:border-[#292A2A] sticky left-[44px] z-10! bg-slate-50">
                    {item.username}
                  </td>
                  <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r! border-t! border-[#e2e6f2] dark:border-[#292A2A] text-center sticky left-[243px] z-10! bg-slate-50">
                    {item.position}
                  </td>
                  <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-t border-[#e2e6f2] dark:border-[#292A2A] text-center">{item.region}</td>
                  <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-t border-[#e2e6f2] dark:border-[#292A2A] text-center">{item.district}</td>
                  <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-t border-[#e2e6f2] dark:border-[#292A2A] text-center">{item.phone_number}</td>
                  <td className="p-3 text-xs font-bold text-slate-900 dark:text-white border-r border-t border-[#e2e6f2] dark:border-[#292A2A] text-center">
                    {Number(item.fixed_salary || 0).toLocaleString("uz-UZ")}
                  </td>
                  <td className="p-3 text-xs font-bold text-slate-900 dark:text-white border-r border-t border-[#e2e6f2] dark:border-[#292A2A] text-center">
                    {Number(item.balance || 0).toLocaleString("uz-UZ")}
                  </td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A] bg-slate-50/50 dark:bg-white/5">0</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.projects.completed}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.projects.in_progress}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.projects.cancelled}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.projects.overdue}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.projects.planning}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A] bg-slate-50/50 dark:bg-white/5">
                    {item?.report?.tasks.total}
                  </td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.tasks.todo}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.tasks.in_progress}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.tasks.overdue}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.tasks.done}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.tasks.production}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.tasks.checked}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.tasks.rejected}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A] bg-slate-50/50 dark:bg-white/5">
                    {item?.report?.meetings?.total}
                  </td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.meetings?.attended}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.meetings?.missed_excused}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">{item?.report?.meetings?.missed_unexcused}</td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A] bg-slate-50/50 dark:bg-white/5">
                    {Number(item?.report?.expense_requests_amount?.total || 0).toLocaleString("uz-UZ")}
                  </td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">
                    {Number(item?.report?.expense_requests_amount?.pending || 0).toLocaleString("uz-UZ")}
                  </td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">
                    {Number(item?.report?.expense_requests_amount?.pain || 0).toLocaleString("uz-UZ")}
                  </td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">
                    {Number(item?.report?.expense_requests_amount?.confirmed || 0).toLocaleString("uz-UZ")}
                  </td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">
                    {Number(item?.report?.payroll_amount?.total || 0).toLocaleString("uz-UZ")}
                  </td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">
                    {Number(item?.report?.payroll_amount?.kpi_bonuses || 0).toLocaleString("uz-UZ")}
                  </td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A]">
                    {Number(item?.report?.payroll_amount?.penalty_amount || 0).toLocaleString("uz-UZ")}
                  </td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A] dark:bg-white/5 sticky right-0 z-10! bg-slate-50!">
                    {dayjs(item?.created_at || "2026-04-30T03:23:39+05:00").format('DD.MM.YYYY')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .filter-notif::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #3f57b3;
          position: absolute;
          top: 4px;
          right: 4px;
          z-index: 10;
        }
      `}</style>

      {selectEmployee && (
        <EmployeeStep selectedList={[]} onConfirm={handleSelectEmployeeConfirm} onClose={() => setSelectEmployee(false)} />
      )}

    </div>
  )
}

export default Employee

const customSelectStyles = `
  .custom-antd-select .ant-select-selector {
    border-radius: 12px !important;
    border-color: #e2e8f0 !important;
    height: 44px !important;
    display: flex !important;
    align-items: center !important;
    background: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }
  .custom-antd-select.ant-select-focused .ant-select-selector {
    border-color: #e2e8f0 !important;
    box-shadow: none !important;
  }
  .dark .custom-antd-select .ant-select-selector {
    border-color: #292A2A !important;
    background: #222323 !important;
    color: white !important;
  }
  .dark .custom-antd-select.ant-select-focused .ant-select-selector {
    border-color: #292A2A !important;
  }
  .custom-antd-select .ant-select-selection-item {
    display: flex !important;
    align-items: center !important;
    font-size: 14px !important;
    font-weight: 500 !important;
  }
  .dark .custom-antd-select .ant-select-selection-item {
    color: white !important;
  }
  .dark .ant-select-dropdown {
    background-color: #1C1D1D !important;
    border: 1px solid #292A2A !important;
  }
  .dark .ant-select-item {
    color: white !important;
  }
  .dark .ant-select-item-option-active {
    background-color: #222323 !important;
  }
  .dark .ant-select-item-option-selected {
    background-color: #303131 !important;
  }
`

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.innerHTML = customSelectStyles
  document.head.appendChild(style)
}