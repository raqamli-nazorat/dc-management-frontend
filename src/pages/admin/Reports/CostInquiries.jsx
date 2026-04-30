import { useEffect, useRef, useState } from 'react'
import { usePageAction } from '../../../context/PageActionContext'
import { LuFilter, LuUserPlus } from 'react-icons/lu'
import { FaAngleDown, FaChevronDown } from 'react-icons/fa'
import { FaRegFile, FaXmark } from 'react-icons/fa6'
import { DatePicker, Select } from 'antd'
import { usePositions, useRegions } from "../../../MostUsesDates"
import FilterSelect from '../Components/FilterSelect'
import { FilterInput } from './Components/FilterInput'
import EmployeeStep from "./Modals/EmployeeStep"
import { toast } from '../../../Toast/ToastProvider'
import { axiosAPI } from '../../../service/axiosAPI'
import dayjs from 'dayjs'
import { PiUsersThreeBold } from 'react-icons/pi'
import ProjectsStep from './Modals/ProjectsStep'

const CostInquiries = [
  { value: "paid", label: "To'landi" },
  { value: "pending", label: "Kutulmoqda" },
  { value: "accepted", label: "Tasdiqlandi" },
  { value: "rejected", label: "Bekor qilindi" }
]

const SalaryType = [
  { value: "kpi", label: "KPI bonusi" },
  { value: "fine", label: "Jarima miqdori" }
]

const meetings = [
  { label: "Qatnashgan", value: "attended" },
  { label: "Qatnashmagan \"Sababli\"", value: "missed_excused" },
  { label: "Qatnashmagan \"Sababsiz\"", value: "missed_unexcused" }
]

const payment_type = [
  { label: "Naqd pul orqali", value: "cash" },
  { label: "Karta raqam orqali", value: "card" },
]

const status_type = [
  { label: "Tasdiqlangan", value: "confirmed" },
  { label: "To'langan", value: "paid" },
  { label: "Bekor qilingan", value: "cancelled" }
]

const cost_type = [
  { label: "Mablag' chiqarish", value: "withdrawal" },
  { label: "Kompaniya xarajatlari", value: "company" },
  { label: "Boshqa xarajatlar", value: "other" }
]

const category_type = [
  { label: "Sayohat uchun", value: "travel" },
  { label: "yo'l kira uchun", value: "transport" },
  { label: "Ovqatlanish uchun", value: "meals" },
  { label: "Tibbiy xarajat uchun", value: "medical" }
]

const initialFilters = {
  startDate: '',
  endDate: '',
  position: '',
  region: '',
  salary_min: '',
  salary_max: '',
  balance_min: '',
  balance_max: '',
  task_status: '',
  tasks_min: '',
  tasks_max: '',
  expenses_amount_min: '',
  expenses_amount_max: '',
  payrolls_amount_min: '',
  payrolls_amount_max: '',
  project_status: '',
  user: '',
  accountants: '',
  projects: '',
  projects_min: '',
  projects_max: '',
  meetings_min: '',
  meetings_max: '',
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
  const [selectAccountant, setSelectAccountant] = useState(false)
  const [selectProject, setSelectProject] = useState(false)
  const [UserReports, setUserReports] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [ReportsNextURL, setReportsNextURL] = useState(null)
  const filterRef = useRef(null)
  const filterButtonRef = useRef(null)

  useEffect(() => {
    if (!filterModal) return

    const handleClickOutside = (event) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target)
      ) {
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
      const { data } = await axiosAPI.get(`reports/expenses/`, { params: { ...params, search } })
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
      setReportsNextURL(data.data.next)
    } catch (error) {
      console.error(error)
      toast.error('Keyingi sahifani yuklashda xatolik yuz berdi.', error?.response?.data?.error?.errMsg || 'Iltimos, qayta urinib ko\'ring.')
    }
  }

  const handleMoreReportsScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - scrollTop <= clientHeight + 50 && ReportsNextURL) {
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

  const sanitizeParams = (params) => {
    if (!params || typeof params !== 'object') return {}

    return Object.entries(params).reduce((cleaned, [key, value]) => {
      if (value === undefined || value === null || value === '') return cleaned
      if (Array.isArray(value) && value.length === 0) return cleaned

      if (typeof value === 'string') {
        const trimmed = value.trim()
        cleaned[key] = trimmed.replace(/\s+/g, '')
      } else {
        cleaned[key] = value
      }

      return cleaned
    }, {})
  }

  const handleFetchReports = () => {
    const params = sanitizeParams(filters)

    getEmployeeReports({ params, search })
    setFilterModal(false)
  }

  const handleClear = () => {
    setFilters(initialFilters)
    setSearch('')
    setFilterModal(false)
    getEmployeeReports({ params: {} })
    setHasFetched(false)
    setUserReports([])
  }

  const handleSelectEmployeeConfirm = (selected) => {
    setFilters(prev => ({ ...prev, user: selected.join(',') }))
    setSelectEmployee(false)
  }

  const handleSelectAccountantConfirm = (selected) => {
    setFilters(prev => ({ ...prev, accountants: selected.join(',') }))
    setSelectAccountant(false)
  }

  const handleSelectProjectConfirm = (selected) => {
    setFilters(prev => ({ ...prev, projects: selected.join(',') }))
    setSelectProject(false)
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
            ref={filterButtonRef}
            onClick={(e) => {
              e.preventDefault()
              setFilterModal(prev => !prev)
            }}
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
          onClick={handleFetchReports}
        >
          <FaRegFile size={15} />
          Shakillantirish
        </button>
      </div>
      {/* Filter Panel */}
      {filterModal && (
        <div ref={filterRef} className="absolute top-8 z-50 mt-4 p-6 bg-white dark:bg-[#1E2021] border border-slate-200 dark:border-[#292A2A] rounded-3xl shadow-xl space-y-6 transition-all duration-500 animate-in fade-in slide-in-from-top-4 w-full">

          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-4 lg:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">So'ralgan vaqt</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative flex-1">
                  <DatePicker
                    showTime
                    inputReadOnly
                    format="DD.MM.YYYY HH:mm"
                    value={filters.created_at_start}
                    onChange={(value) => handleFilterChange('created_at_start', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400 transition-colors hover:border-slate-200!"
                    placeholder='Boshlanish sanasi'
                  />
                </div>
                <div className="relative flex-1">
                  <DatePicker
                    showTime
                    inputReadOnly
                    value={filters.created_at_end}
                    format="DD.MM.YYYY HH:mm"
                    onChange={(value) => handleFilterChange('created_at_end', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400 transition-colors hover:border-slate-200!"
                    placeholder='Tugash sana'
                  />
                </div>
              </div>
            </div>

            <div className="col-span-4 lg:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Tasdiqlangan vaqt</label>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <DatePicker
                    showTime
                    inputReadOnly
                    value={filters.confirmed_at_start}
                    format="DD.MM.YYYY HH:mm"
                    onChange={(value) => handleFilterChange('confirmed_at_start', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400 transition-colors hover:border-slate-200!"
                    placeholder='Boshlanish sanasi'
                  />
                </div>

                <div className="relative">
                  <DatePicker
                    showTime
                    inputReadOnly
                    value={filters.confirmed_at_end}
                    format="DD.MM.YYYY HH:mm"
                    onChange={(value) => handleFilterChange('confirmed_at_end', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400 transition-colors hover:border-slate-200!"
                    placeholder='Tugash sanasi'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">To'langan vaqt</label>
              <div className="grid grid-cols-2 gap-3">
                <DatePicker
                  showTime
                  inputReadOnly
                  value={filters.paid_at_start}
                  format="DD.MM.YYYY HH:mm"
                  onChange={(value) => handleFilterChange('paid_at_start', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400 transition-colors hover:border-slate-200!"
                  placeholder='Boshlanish sanasi'
                />
                <DatePicker
                  showTime
                  inputReadOnly
                  value={filters.paid_at_end}
                  format="DD.MM.YYYY HH:mm"
                  onChange={(value) => handleFilterChange('paid_at_end', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400 transition-colors hover:border-slate-200!"
                  placeholder='Tugash sanasi'
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Bekor qilingan vaqt</label>
              <div className="grid grid-cols-2 gap-3">
                <DatePicker
                  showTime
                  inputReadOnly
                  value={filters.cancelled_at_start}
                  format="DD.MM.YYYY HH:mm"
                  onChange={(value) => handleFilterChange('cancelled_at_start', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400 transition-colors hover:border-slate-200!"
                  placeholder='Boshlanish sanasi'
                />
                <DatePicker
                  showTime
                  inputReadOnly
                  value={filters.cancelled_at_end}
                  format="DD.MM.YYYY HH:mm"
                  onChange={(value) => handleFilterChange('cancelled_at_end', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400 transition-colors hover:border-slate-200!"
                  placeholder='Tugash sanasi'
                />
              </div>
            </div>
          </div>

          {/* Row 3*/}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2 md:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Miqdor</label>
              <div className='grid grid-cols-2 gap-3'>
                <FilterInput
                  label="dan"
                  value={filters.amount_min}
                  onChange={(e) => handleFilterChange('amount_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  value={filters.amount_max}
                  onChange={(e) => handleFilterChange('amount_max', formatNum(e.target.value))}
                />
              </div>
            </div>

            <div className="col-span-2 md:col-span-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">To'lov turi</label>
                  <FilterSelect
                    padding='13.5px 12px'
                    placeholder="To'lov turi tanlang"
                    options={payment_type.map(type => type.label)}
                    value={payment_type.find(type => type.value === filters.payment_method)?.label}
                    onChange={(value) => handleFilterChange('payment_method', payment_type.find(type => type.label === value)?.value)}
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Holati</label>
                  <FilterSelect
                    padding='13.5px 12px'
                    placeholder="Holatini tanlang"
                    options={status_type.map(type => type.label)}
                    value={status_type.find(type => type.value === filters.status)?.label}
                    onChange={(value) => handleFilterChange('status', status_type.find(type => type.label === value)?.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Xodimlar</label>
              <button
                type="button"
                onClick={() => setSelectEmployee(true)}
                className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[#222323] border border-slate-200 dark:border-[#292A2A] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d] transition-colors cursor-pointer ${filters?.user?.length > 0 ? 'filter-notif' : ''}`}
              >
                <span className="truncate text-sm font-medium">
                  {filters.user ? `${filters.user.split(',').filter(Boolean).length} ta xodim` : 'Xodim tanlang'}
                </span>
                <div className="flex items-center gap-2">
                  <PiUsersThreeBold size={18} />

                  {filters.user && (
                    <FaXmark
                      size={18}
                      className="text-red-500"
                      onClick={(e) => { e.stopPropagation(); handleFilterChange('user', '') }}
                    />
                  )}
                </div>
              </button>
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Hisobchi</label>
              <button
                type="button"
                onClick={() => setSelectAccountant(true)}
                className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[#222323] border border-slate-200 dark:border-[#292A2A] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d] transition-colors cursor-pointer ${filters?.accountants?.length > 0 ? 'filter-notif' : ''}`}
              >
                <span className="truncate text-sm font-medium">
                  {filters.accountants ? `${filters.accountants.split(',').filter(Boolean).length} ta hisobchi` : 'Hisobchi tanlang'}
                </span>
                <div className="flex items-center gap-2">
                  <PiUsersThreeBold size={18} />

                  {filters.accountants && (
                    <FaXmark
                      size={18}
                      className="text-red-500"
                      onClick={(e) => { e.stopPropagation(); handleFilterChange('accountants', '') }}
                    />
                  )}
                </div>
              </button>
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Loyihalar</label>
              <button
                type="button"
                onClick={() => setSelectProject(true)}
                className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[#222323] border border-slate-200 dark:border-[#292A2A] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d] transition-colors cursor-pointer ${filters?.projects?.length > 0 ? 'filter-notif' : ''}`}
              >
                <span className="truncate text-sm font-medium">
                  {filters.projects ? `${filters.projects.split(',').filter(Boolean).length} ta loyiha` : 'Loyiha tanlang'}
                </span>
                <div className="flex items-center gap-2">
                  <img src="/imgs/Briefcase.svg" alt="Loyiha" size={18} />

                  {filters.projects && (
                    <FaXmark
                      size={18}
                      className="text-red-500"
                      onClick={(e) => { e.stopPropagation(); handleFilterChange('projects', '') }}
                    />
                  )}
                </div>
              </button>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Xarajat turi</label>
              <FilterSelect
                value={cost_type.find((type) => type.value === filters.type)?.label}
                padding='11px 12px'
                placeholder={'Jami'}
                onChange={(value) => handleFilterChange('type', cost_type.find((type) => type.label === value)?.value)}
                options={cost_type.map((type) => type.label)}
              />
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Toifa</label>
              <FilterSelect
                value={category_type.find((type) => type.value === filters.expense_category)?.label}
                padding='11px 12px'
                placeholder={'Jami'}
                onChange={(value) => handleFilterChange('expense_category', category_type.find((type) => type.label === value)?.value)}
                options={category_type.map((type) => type.label)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      {
        isLoading ? (
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
            <table className="text-left border-collapse w-full min-w-[2000px]">
              <thead className="bg-[#7186ED] text-white sticky top-0 z-20! dark:bg-[#1E2021]">
                <tr>
                  <th className="p-3 text-xs sticky w-[45px] left-0 z-20! bg-[#7186ED] font-bold border-r border-[#e2e6f2]">№</th>
                  <th className="p-3 text-xs w-[150px] sticky left-[40px] z-10! bg-[#7186ED] font-bold border-r border-[#e2e6f2]">Ism Sharifi</th>
                  <th className="p-3 text-xs font-bold border-r w-[160px] sticky left-[155px] z-10! bg-[#7186ED] border-[#e2e6f2] text-center">Loyiha nomi</th>
                  <th className="p-3 text-xs font-bold border-r w-[180px] border-[#e2e6f2] text-end">Xarajat turi</th>
                  <th className="p-3 text-xs font-bold border-r w-[180px] border-[#e2e6f2] text-end">Toifa</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-end">Miqdori (UZS)</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-end">To'lov turi</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-end">Holati</th>
                  <th className="p-3 text-xs font-bold border-r w-[180px] border-[#e2e6f2] text-end">So'rov sababi</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-end">So'ralgan vaqti</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-end">To'langan vaqti</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-center">Tasdiqlangan vaqti</th>
                  <th className="p-3 text-xs font-bold border-r w-[200px] border-[#e2e6f2] text-end">Hisobchi</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-start">Bekor qilingan vaqti</th>
                  <th className="p-3 text-xs font-bold border-r w-[180px] border-[#e2e6f2] text-end">Bekor sababi</th>
                  <th className="p-3 text-xs sticky right-0 z-10! w-[180px] bg-[#7186ED] font-bold border-l border-[#e2e6f2] text-end">Kart raqami</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1E2021] dark:text-slate-300">
                {UserReports.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-[#292A2A] hover:bg-slate-50 dark:hover:bg-[#252626] transition-colors">
                    <td className="p-3 text-xs text-slate-500 border-r border-[#e2e6f2] dark:border-[#292A2A] sticky w-[45px] left-0 z-10! bg-slate-50">
                      {index + 1}
                    </td>
                    <td className="p-3 text-xs font-semibold text-slate-700 dark:text-slate-200 border-r border-[#e2e6f2] dark:border-[#292A2A] sticky left-[40px] z-10! bg-slate-50">{
                      item.user}
                    </td>
                    <td className="p-3 text-xs font-semibold text-slate-700 dark:text-slate-200 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center sticky left-[155px] z-10! bg-slate-50">{
                      item.project || "-"}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-end">
                      {item.expense_category || '-'}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-end">
                      {cost_type.find((t) => t.value === item.type)?.label || '-'}
                    </td>
                    <td className="p-3 text-xs font-bold text-slate-900 dark:text-white border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {Number(item.amount || 0).toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item.payment_method === 'card' ? 'Karta orqali' : item.payment_method === 'cash' ? 'Naqd pul' : item.payment_method || '-'}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item.status === 'cancelled' ? 'Bekor qilingan' : item.status === 'paid' ? 'To\'langan' : item.status === 'confirmed' ? 'Tasdiqlangan' : item.status}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item.reason || '-'}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : '-'}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item.paid_at ? dayjs(item.paid_at).format('DD.MM.YYYY HH:mm') : '-'}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : '-'}
                    </td>

                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item.accountant ? item.accountant : '-'}
                    </td>

                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item.cancelled_at ? dayjs(item.cancelled_at).format('DD.MM.YYYY HH:mm') : '-'}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item.cancel_reason || '-'}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-l border-[#e2e6f2] dark:border-[#292A2A] text-center sticky right-0 z-10! bg-slate-50">
                      {item.card_number || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

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

      {
        selectEmployee && (
          <EmployeeStep
            selectedList={filters.user ? filters.user.split(',') : []}
            onConfirm={handleSelectEmployeeConfirm}
            onClose={() => setSelectEmployee(false)}
          />
        )
      }

      {selectAccountant && (
        <EmployeeStep
          selectedList={filters.accountants ? filters.accountants.split(',') : []}
          onConfirm={handleSelectAccountantConfirm}
          employee_role='accountant'
          onClose={() => setSelectAccountant(false)}
        />
      )}

      {selectProject && (
        <ProjectsStep
          selectedList={filters.projects ? filters.projects.split(',') : []}
          onConfirm={handleSelectProjectConfirm}
          onClose={() => setSelectProject(false)}
        />
      )}

    </div >
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