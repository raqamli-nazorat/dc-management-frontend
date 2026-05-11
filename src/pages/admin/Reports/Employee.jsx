import { useEffect, useRef, useState } from 'react'
import { usePageAction } from '../../../context/PageActionContext'
import { LuFilter, LuRefreshCw, LuUserPlus } from 'react-icons/lu'
import { FaAngleDown, FaChevronDown } from 'react-icons/fa'
import { FaRegFile, FaXmark, FaCalendarDays, FaSpinner } from 'react-icons/fa6'
import { DatePicker, Select, ConfigProvider, theme, Checkbox } from 'antd'
import { useTheme } from '../../../context/ThemeContext'
import { usePositions, useRegions } from "../../../MostUsesDates"
import FilterSelect from '../Components/FilterSelect'
import { FilterInput } from './Components/FilterInput'
import EmployeeStep from "./Modals/EmployeeStep"
import { toast } from '../../../Toast/ToastProvider'
import { axiosAPI } from '../../../service/axiosAPI'
import dayjs from 'dayjs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { FiCalendar } from 'react-icons/fi'
import { IoCloseCircle } from 'react-icons/io5'
import { MdExpandMore } from 'react-icons/md'

const monthStart = dayjs().startOf('month').hour(0).minute(0).second(0).millisecond(0)
const monthEnd = dayjs().endOf('month').hour(23).minute(59).second(0).millisecond(0)

const CostInquiries = [
  { value: "paid", label: "To'landi" },
  { value: "pending", label: "Kutulmoqda" },
  { value: "accepted", label: "Tasdiqlandi" },
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

const initialFilters = {
  joined_min: monthStart,
  joined_max: monthEnd,
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
  expenses_amount: '',
  expenses_amount_min: '',
  expenses_amount_max: '',
  salary_type: '',
  payrolls_amount_min: '',
  payrolls_amount_max: '',
  project_status: '',
  projects_min: '',
  projects_max: '',
  meetings: '',
  meetings_min: '',
  meetings_max: '',
  users: [],
}

const MAIN_COLUMNS = [
  { key: 'number', label: '№', width: 49.5 },
  { key: 'username', label: 'Ism Sharifi', width: 221.5 },
  { key: 'position', label: 'Lavozim', width: 199.5 },
  { key: 'region', label: 'Viloyati', width: 177 },
  { key: 'district', label: 'Tumani', width: 177 },
  { key: 'phone_number', label: 'Telefon raqami', width: 199.5 },
  { key: 'fixed_salary', label: 'Oylik maosh (UZS)', width: 199.5 },
  { key: 'balance', label: 'Balans (UZS)', width: 199.5 },
]

const GROUP_PROJECTS = { key: 'projects', label: 'Loyihalar', colSpan: 6, subWidth: 110.7 }
const GROUP_TASKS = { key: 'tasks', label: 'Vazifalar', colSpan: 8, subWidth: 110.5 }
const GROUP_MEETINGS = { key: 'meetings', label: "Yig'ilishlar", colSpan: 4, subWidth: 110.5 }
const GROUP_EXPENSES = { key: 'expenses', label: "Xarajat so'rovlari (UZS)", colSpan: 4, subWidth: 133 }
const GROUP_PAYROLL = { key: 'payroll', label: 'Ish haqi (UZS)', colSpan: 3, subWidth: 132.7 }

const GROUPS = [GROUP_PROJECTS, GROUP_TASKS, GROUP_MEETINGS, GROUP_EXPENSES, GROUP_PAYROLL]

const GROUP_SUBS = {
  projects: [
    { key: 'projects_jami', label: 'Jami' },
    { key: 'projects_tugatilgan', label: 'Tugatilgan' },
    { key: 'projects_jarayonda', label: 'Jarayonda' },
    { key: 'projects_bekor', label: 'Bekor qilingan' },
    { key: 'projects_muddati', label: "Muddati o'tgan" },
    { key: 'projects_rejalashtirilgan', label: 'Rejalashtirilgan' },
  ],
  tasks: [
    { key: 'tasks_jami', label: 'Jami' },
    { key: 'tasks_qilish', label: 'Qilish kerak' },
    { key: 'tasks_jarayonda', label: 'Jarayonda' },
    { key: 'tasks_muddati', label: "Muddati o'tgan" },
    { key: 'tasks_bajarilgan', label: 'Bajarilgan' },
    { key: 'tasks_ishga', label: 'Ishga tushurilgan' },
    { key: 'tasks_tekshirilgan', label: 'Tekshirilgan' },
    { key: 'tasks_rad', label: 'Rad etilgan' },
  ],
  meetings: [
    { key: 'meetings_jami', label: 'Jami' },
    { key: 'meetings_qatnashgan', label: 'Qatnashgan' },
    { key: 'meetings_sababli', label: 'Qatnashmaagan "sababli"' },
    { key: 'meetings_sababsiz', label: 'Qatnashmagan "sababsiz"' },
  ],
  expenses: [
    { key: 'expenses_jami', label: 'Jami' },
    { key: 'expenses_kutilmoqda', label: 'Kutilmoqda' },
    { key: 'expenses_tolandi', label: "To'landi" },
    { key: 'expenses_tasdiqlangan', label: 'Tasdiqlangan' },
  ],
  payroll: [
    { key: 'payroll_jami', label: 'Jami' },
    { key: 'payroll_kpi', label: 'KPI bonusi' },
    { key: 'payroll_jarima', label: 'Jarima miqdori' },
  ],
}

const Employee = () => {

  const { isDark } = useTheme()
  const positions = usePositions()
  const regions = useRegions()

  const { setDownload, setPrint, clearDownload, clearPrint } = usePageAction()
  const [search, setSearch] = useState(null)
  const [filterModal, setFilterModal] = useState(false)
  const [filters, setFilters] = useState(initialFilters)
  const [selectEmployee, setSelectEmployee] = useState(false)
  const [UserReports, setUserReports] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [ReportsNextURL, setReportsNextURL] = useState(null)
  const filterRef = useRef(null)
  const filterButtonRef = useRef(null)

  const [tablePin, setTablePin] = useState({ number: true })

  const handlePin = (key, value) => {
    setTablePin(prev => {
      const next = { ...prev, [key]: value }
      // If it's a group key, toggle all its sub-columns too
      if (GROUP_SUBS[key]) {
        GROUP_SUBS[key].forEach(sub => { next[sub.key] = value })
      }
      return next
    })
  }

  const getSubPinnedLeft = (subKey) => {
    if (!tablePin[subKey]) return undefined
    let offset = 0
    // Add widths of pinned main columns
    for (const col of MAIN_COLUMNS) {
      if (tablePin[col.key]) offset += col.width
    }
    // Walk through groups and their sub-columns
    for (const group of GROUPS) {
      const subs = GROUP_SUBS[group.key]
      for (const sub of subs) {
        if (sub.key === subKey) return offset
        if (tablePin[sub.key]) offset += group.subWidth
      }
    }
    return undefined
  }

  const getPinnedLeft = (key, subIndex = -1) => {
    if (!tablePin[key]) return undefined
    let offset = 0
    for (const col of MAIN_COLUMNS) {
      if (col.key === key) return offset
      if (tablePin[col.key]) offset += col.width
    }
    for (const group of GROUPS) {
      if (group.key === key) {
        if (subIndex === -1) return offset
        return offset + (subIndex * group.subWidth)
      }
      if (tablePin[group.key]) {
        offset += (group.colSpan * group.subWidth)
      }
    }
    return undefined
  }

  const getPinnedRight = (key) => {
    if (!tablePin[key]) return undefined
    let offset = 0
    if (key === 'date_joined') return 0
    if (tablePin.date_joined) offset += 155

    const rightGroups = [...GROUPS].reverse()
    for (const group of rightGroups) {
      if (group.key === key) return offset
      if (tablePin[group.key]) {
        offset += (group.colSpan * group.subWidth)
      }
    }
    return undefined
  }

  const getSubPinnedRight = (subKey) => {
    if (!tablePin[subKey]) return undefined
    let offset = 0
    if (tablePin.date_joined) offset += 155

    const rightGroups = [...GROUPS].reverse()
    for (const group of rightGroups) {
      const subs = [...GROUP_SUBS[group.key]].reverse()
      for (const sub of subs) {
        if (sub.key === subKey) return offset
        if (tablePin[sub.key]) offset += group.subWidth
      }
    }
    return undefined
  }

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

  const handleExcelDownload = async () => {
    if (!UserReports || UserReports.length === 0) {
      toast.info('Yuklab olish uchun ma\'lumot yo\'q');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Xodimlar hisoboti');

    const row1 = worksheet.addRow([
      '№', 'Ism Sharifi', 'Lavozim', 'Viloyati', 'Tumani', 'Telefon raqami', 'Oylik maosh (UZS)', 'Balans (UZS)',
      'Loyihalar', '', '', '', '', '',
      'Vazifalar', '', '', '', '', '', '', '',
      'Yig\'ilishlar', '', '', '',
      'Xarajat so\'rovlari (UZS)', '', '', '',
      'Ish haqi (UZS)', '', '',
      'Ishga kirgan vaqti'
    ]);

    const row2 = worksheet.addRow([
      '', '', '', '', '', '', '', '',
      'Jami', 'Tugatilgan', 'Jarayonda', 'Bekor qilingan', 'Muddati o\'tgan', 'Rejalashtirilayotgan',
      'Jami', 'Qilish kerak', 'Jarayonda', 'Muddati o\'tgan', 'Bajarilgan', 'Ishga tushurilgan', 'Tekshirilgan', 'Rad etilgan',
      'Jami', 'Qatnashgan', 'Qatnashmagan "sababli"', 'Qatnashmagan "sababsiz"',
      'Jami', 'Kutilmoqda', 'To\'landi', 'To\'lov o\'tkazildi "xodim qabul qilmagan"',
      'Jami', 'KPI bonusi', 'Jarima miqdori',
      ''
    ]);

    worksheet.mergeCells('A1:A2');
    worksheet.mergeCells('B1:B2');
    worksheet.mergeCells('C1:C2');
    worksheet.mergeCells('D1:D2');
    worksheet.mergeCells('E1:E2');
    worksheet.mergeCells('F1:F2');
    worksheet.mergeCells('G1:G2');
    worksheet.mergeCells('H1:H2');
    worksheet.mergeCells('I1:N1');
    worksheet.mergeCells('O1:V1');
    worksheet.mergeCells('W1:Z1');
    worksheet.mergeCells('AA1:AD1');
    worksheet.mergeCells('AE1:AG1');
    worksheet.mergeCells('AH1:AH2');

    worksheet.columns = [
      { key: 'col1', width: 5 }, { key: 'col2', width: 25 }, { key: 'col3', width: 15 }, { key: 'col4', width: 15 },
      { key: 'col5', width: 15 }, { key: 'col6', width: 15 }, { key: 'col7', width: 15 }, { key: 'col8', width: 15 },
      { key: 'col9', width: 10 }, { key: 'col10', width: 10 }, { key: 'col11', width: 10 }, { key: 'col12', width: 10 }, { key: 'col13', width: 10 }, { key: 'col14', width: 10 },
      { key: 'col15', width: 10 }, { key: 'col16', width: 10 }, { key: 'col17', width: 10 }, { key: 'col18', width: 10 }, { key: 'col19', width: 10 }, { key: 'col20', width: 10 }, { key: 'col21', width: 10 }, { key: 'col22', width: 10 },
      { key: 'col23', width: 10 }, { key: 'col24', width: 10 }, { key: 'col25', width: 15 }, { key: 'col26', width: 15 },
      { key: 'col27', width: 12 }, { key: 'col28', width: 12 }, { key: 'col29', width: 12 }, { key: 'col30', width: 20 },
      { key: 'col31', width: 12 }, { key: 'col32', width: 12 }, { key: 'col33', width: 12 },
      { key: 'col34', width: 15 }
    ];

    [row1, row2].forEach((row, rowIndex) => {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowIndex === 0 ? 'FF7186ED' : 'FF8999EF' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: rowIndex === 0 ? 11 : 9 };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E6F2' } },
          left: { style: 'thin', color: { argb: 'FFE2E6F2' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E6F2' } },
          right: { style: 'thin', color: { argb: 'FFE2E6F2' } }
        };
      });
      row.height = rowIndex === 0 ? 25 : 35;
    });

    UserReports.forEach((item, index) => {
      const row = worksheet.addRow([
        index + 1,
        item?.username || '',
        item?.position || '',
        item?.region || '',
        item?.district || '',
        item?.phone_number || '',
        item?.fixed_salary || '',
        item?.balance || '',
        item?.report?.projects?.total || '',
        item?.report?.projects?.completed || '',
        item?.report?.projects?.in_progress || '',
        item?.report?.projects?.cancelled || '',
        item?.report?.projects?.overdue || '',
        item?.report?.projects?.planning || '',
        item?.report?.tasks?.total || '',
        item?.report?.tasks?.todo || '',
        item?.report?.tasks?.in_progress || '',
        item?.report?.tasks?.overdue || '',
        item?.report?.tasks?.done || '',
        item?.report?.tasks?.production || '',
        item?.report?.tasks?.checked || '',
        item?.report?.tasks?.rejected || '',
        item?.report?.meetings?.total || '',
        item?.report?.meetings?.attended || '',
        item?.report?.meetings?.missed_excused || '',
        item?.report?.meetings?.missed_unexcused || '',
        item?.report?.expense_requests_amount?.total || '',
        item?.report?.expense_requests_amount?.pending || '',
        item?.report?.expense_requests_amount?.pain || '',
        item?.report?.expense_requests_amount?.confirmed || '',
        item?.report?.payroll_amount?.total || '',
        item?.report?.payroll_amount?.kpi_bonuses || '',
        item?.report?.payroll_amount?.penalty_amount || '',
        item?.date_joined ? dayjs(item.date_joined).format('DD.MM.YYYY') : ''
      ]);

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E6F2' } }, left: { style: 'thin', color: { argb: 'FFE2E6F2' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E6F2' } }, right: { style: 'thin', color: { argb: 'FFE2E6F2' } }
        };

        let isBold = false;

        if ([1, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 34].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if ([7, 8, 27, 28, 29, 30, 31, 32, 33].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0.00';
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }

        if (colNumber === 2 || colNumber === 7 || colNumber === 8) {
          isBold = true;
        }

        cell.font = { color: { argb: 'FF475569' }, bold: isBold, size: 10 };

        if ([9, 15, 23, 27, 31].includes(colNumber)) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      });
      row.height = 25;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Xodimlar_hisoboti_${dayjs().format('DD_MM_YYYY')}.xlsx`);
  }

  const handlePdfDownload = () => {
    if (!UserReports || UserReports.length === 0) {
      toast.info('Yuklab olish uchun ma\'lumot yo\'q');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', format: 'a3' });

    autoTable(doc, {
      head: [
        [
          { content: '№', rowSpan: 2 },
          { content: 'Ism Sharifi', rowSpan: 2 },
          { content: 'Lavozim', rowSpan: 2 },
          { content: 'Viloyati', rowSpan: 2 },
          { content: 'Tumani', rowSpan: 2 },
          { content: 'Telefon raqami', rowSpan: 2 },
          { content: 'Oylik maosh (UZS)', rowSpan: 2 },
          { content: 'Balans (UZS)', rowSpan: 2 },
          { content: 'Loyihalar', colSpan: 6 },
          { content: 'Vazifalar', colSpan: 8 },
          { content: 'Yig\'ilishlar', colSpan: 4 },
          { content: 'Xarajat so\'rovlari (UZS)', colSpan: 4 },
          { content: 'Ish haqi (UZS)', colSpan: 3 },
          { content: 'Ishga kirgan vaqti', rowSpan: 2 }
        ],
        [
          'Jami', 'Tugatilgan', 'Jarayonda', 'Bekor', 'Muddati', 'Reja',
          'Jami', 'Qilish', 'Jarayon', 'Muddati', 'Bajarilgan', 'Ishga t', 'Tekshirilgan', 'Rad',
          'Jami', 'Qatnashgan', 'Sababli', 'Sababsiz',
          'Jami', 'Kutilmoqda', 'To\'landi', 'Tasdiqlangan',
          'Jami', 'KPI', 'Jarima'
        ]
      ],
      body: UserReports.map((item, index) => [
        index + 1,
        item?.username || '',
        item?.position || '',
        item?.region || '',
        item?.district || '',
        item?.phone_number || '',
        Number(item?.fixed_salary || '').toLocaleString("uz-UZ"),
        Number(item?.balance || '').toLocaleString("uz-UZ"),
        item?.report?.projects?.total || '',
        item?.report?.projects?.completed || '',
        item?.report?.projects?.in_progress || '',
        item?.report?.projects?.cancelled || '',
        item?.report?.projects?.overdue || '',
        item?.report?.projects?.planning || '',
        item?.report?.tasks?.total || '',
        item?.report?.tasks?.todo || '',
        item?.report?.tasks?.in_progress || '',
        item?.report?.tasks?.overdue || '',
        item?.report?.tasks?.done || '',
        item?.report?.tasks?.production || '',
        item?.report?.tasks?.checked || '',
        item?.report?.tasks?.rejected || '',
        item?.report?.meetings?.total || '',
        item?.report?.meetings?.attended || '',
        item?.report?.meetings?.missed_excused || '',
        item?.report?.meetings?.missed_unexcused || '',
        Number(item?.report?.expense_requests_amount?.total || '').toLocaleString("uz-UZ"),
        Number(item?.report?.expense_requests_amount?.pending || '').toLocaleString("uz-UZ"),
        Number(item?.report?.expense_requests_amount?.pain || '').toLocaleString("uz-UZ"),
        Number(item?.report?.expense_requests_amount?.confirmed || '').toLocaleString("uz-UZ"),
        Number(item?.report?.payroll_amount?.total || '').toLocaleString("uz-UZ"),
        Number(item?.report?.payroll_amount?.kpi_bonuses || '').toLocaleString("uz-UZ"),
        Number(item?.report?.payroll_amount?.penalty_amount || '').toLocaleString("uz-UZ"),
        item?.date_joined ? dayjs(item.date_joined).format('DD.MM.YYYY') : ''
      ]),
      headStyles: {
        fillColor: [113, 134, 237],
        textColor: [255, 255, 255],
        halign: 'center',
        valign: 'middle',
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 5,
        cellPadding: 1,
        lineColor: [226, 230, 242],
        lineWidth: 0.1,
      },
      theme: 'grid',
      margin: { top: 15 },
      didDrawPage: function () {
        doc.setFontSize(14);
        doc.text('Xodimlar hisoboti', 14, 10);
      }
    });

    doc.save(`Xodimlar_hisoboti_${dayjs().format('DD_MM_YYYY')}.pdf`);
  }

  const handleCsvDownload = () => {
    if (!UserReports || UserReports.length === 0) {
      toast.info('Yuklab olish uchun ma\'lumot yo\'q');
      return;
    }

    const csvData = UserReports.map((item, index) => ({
      '№': index + 1,
      'Ism Sharifi': item?.username || '',
      'Lavozim': item?.position || '',
      'Viloyati': item?.region || '',
      'Tumani': item?.district || '',
      'Telefon raqami': item?.phone_number || '',
      'Oylik maosh (UZS)': item?.fixed_salary || '',
      'Balans (UZS)': item?.balance || '',
      'Loyihalar - Jami': item?.report?.projects?.total || '',
      'Loyihalar - Tugatilgan': item?.report?.projects?.completed || '',
      'Loyihalar - Jarayonda': item?.report?.projects?.in_progress || '',
      'Loyihalar - Bekor qilingan': item?.report?.projects?.cancelled || '',
      "Loyihalar - Muddati o'tgan": item?.report?.projects?.overdue || '',
      'Loyihalar - Rejalashtirilayotgan': item?.report?.projects?.planning || '',
      'Vazifalar - Jami': item?.report?.tasks?.total || '',
      'Vazifalar - Qilish kerak': item?.report?.tasks?.todo || '',
      'Vazifalar - Jarayonda': item?.report?.tasks?.in_progress || '',
      "Vazifalar - Muddati o'tgan": item?.report?.tasks?.overdue || '',
      'Vazifalar - Bajarilgan': item?.report?.tasks?.done || '',
      'Vazifalar - Ishga tushurilgan': item?.report?.tasks?.production || '',
      'Vazifalar - Tekshirilgan': item?.report?.tasks?.checked || '',
      'Vazifalar - Rad etilgan': item?.report?.tasks?.rejected || '',
      "Yig'ilishlar - Jami": item?.report?.meetings?.total || '',
      "Yig'ilishlar - Qatnashgan": item?.report?.meetings?.attended || '',
      "Yig'ilishlar - Sababli qatnashmagan": item?.report?.meetings?.missed_excused || '',
      "Yig'ilishlar - Sababsiz qatnashmagan": item?.report?.meetings?.missed_unexcused || '',
      "Xarajat so'rovlari (UZS) - Jami": item?.report?.expense_requests_amount?.total || '',
      "Xarajat so'rovlari (UZS) - Kutilmoqda": item?.report?.expense_requests_amount?.pending || '',
      "Xarajat so'rovlari (UZS) - To'landi": item?.report?.expense_requests_amount?.pain || '',
      "Xarajat so'rovlari (UZS) - Tasdiqlangan": item?.report?.expense_requests_amount?.confirmed || '',
      'Ish haqi (UZS) - Jami': item?.report?.payroll_amount?.total || '',
      'Ish haqi (UZS) - KPI bonusi': item?.report?.payroll_amount?.kpi_bonuses || '',
      'Ish haqi - Jarima miqdori': item?.report?.payroll_amount?.penalty_amount || '',
      'Ishga kirgan vaqti': item?.date_joined ? dayjs(item.date_joined).format('DD.MM.YYYY') : ''
    }));

    const csvContent = "\\uFEFF" + Papa.unparse(csvData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Xodimlar_hisoboti_${dayjs().format('DD_MM_YYYY')}.csv`);
  }

  const handlePrint = () => {
    if (!UserReports || UserReports.length === 0) {
      toast.info("Chop etish uchun ma'lumot yo'q");
      return;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Xodimlar hisoboti</title>
            <style>
              @page { 
                size: landscape; 
                margin: 5mm; 
              }
              body { 
                font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif; 
                font-size: 8px; 
                color: var(--text-strong); 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
              h2 { 
                text-align: center; 
                margin-bottom: 10px; 
                font-size: 14px; 
                color: #1e293b;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-bottom: 15px; 
              }
              th, td { 
                border: 1px solid #e2e8f0; 
                padding: 3px 4px; 
                text-align: left; 
                white-space: nowrap; 
              }
              th { 
                background-color: #7186ED; 
                font-weight: bold; 
                color: white; 
                text-align: center; 
                font-size: 7px;
              }
              th.main-group { 
                background-color: #7186ED; 
                color: white; 
                border-color: #5a6ed1;
              }
              th.sub-group { 
                background-color: #7186ED ; 
                color: #475569; 
                font-size: 6px; 
              }
              td {
                color: #334155;
              }
              td.number { 
                text-align: right; 
                font-weight: 600; 
              }
              td.center { 
                text-align: center; 
              }
              td.bg-slate { 
                background-color: #f8fafc; 
              }
              td.bold {
                font-weight: 600;
                color: #1e293b;
              }
            </style>
          </head>
          <body>
            <h2>Xodimlar hisoboti</h2>
            <table>
              <thead>
                <tr>
                  <th rowspan="2" class="main-group">№</th>
                  <th rowspan="2" class="main-group">Ism Sharifi</th>
                  <th rowspan="2" class="main-group">Lavozim</th>
                  <th rowspan="2" class="main-group">Viloyati</th>
                  <th rowspan="2" class="main-group">Tumani</th>
                  <th rowspan="2" class="main-group">Telefon raqami</th>
                  <th rowspan="2" class="main-group">Oylik maosh (UZS)</th>
                  <th rowspan="2" class="main-group">Balans (UZS)</th>
                  <th colspan="6" class="main-group">Loyihalar</th>
                  <th colspan="8" class="main-group">Vazifalar</th>
                  <th colspan="4" class="main-group">Yig'ilishlar</th>
                  <th colspan="4" class="main-group">Xarajat so'rovlari (UZS)</th>
                  <th colspan="3" class="main-group">Ish haqi (UZS)</th>
                  <th rowspan="2" class="main-group">Ishga kirgan vaqti</th>
                </tr>
                <tr>
                  <th class="sub-group">Jami</th><th class="sub-group">Tugatilgan</th><th class="sub-group">Jarayonda</th><th class="sub-group">Bekor qilingan</th><th class="sub-group">Muddati o'tgan</th><th class="sub-group">Rejalashtirilayotgan</th>
                  <th class="sub-group">Jami</th><th class="sub-group">Qilish kerak</th><th class="sub-group">Jarayonda</th><th class="sub-group">Muddati o'tgan</th><th class="sub-group">Bajarilgan</th><th class="sub-group">Ishga tushurilgan</th><th class="sub-group">Tekshirilgan</th><th class="sub-group">Rad etilgan</th>
                  <th class="sub-group">Jami</th><th class="sub-group">Qatnashgan</th><th class="sub-group">Sababli</th><th class="sub-group">Sababsiz</th>
                  <th class="sub-group">Jami</th><th class="sub-group">Kutilmoqda</th><th class="sub-group">To'landi</th><th class="sub-group">Tasdiqlangan</th>
                  <th class="sub-group">Jami</th><th class="sub-group">KPI bonusi</th><th class="sub-group">Jarima miqdori</th>
                </tr>
              </thead>
              <tbody>
                ${UserReports.map((item, index) => `
                  <tr>
                    <td class="center">${index + 1}</td>
                    <td class="bold">${item?.username || ''}</td>
                    <td>${item?.position || ''}</td>
                    <td>${item?.region || ''}</td>
                    <td>${item?.district || ''}</td>
                    <td class="center">${item?.phone_number || ''}</td>
                    <td class="number">${item?.fixed_salary ? Number(item.fixed_salary).toLocaleString("uz-UZ") : ""}</td>
                    <td class="number">${item?.balance ? Number(item.balance).toLocaleString("uz-UZ") : ""}</td>
                    <td class="center bg-slate">${item?.report?.projects?.total || ''}</td>
                    <td class="center">${item?.report?.projects?.completed || ''}</td>
                    <td class="center">${item?.report?.projects?.in_progress || ''}</td>
                    <td class="center">${item?.report?.projects?.cancelled || ''}</td>
                    <td class="center">${item?.report?.projects?.overdue || ''}</td>
                    <td class="center">${item?.report?.projects?.planning || ''}</td>
                    <td class="center bg-slate">${item?.report?.tasks?.total || ''}</td>
                    <td class="center">${item?.report?.tasks?.todo || ''}</td>
                    <td class="center">${item?.report?.tasks?.in_progress || ''}</td>
                    <td class="center">${item?.report?.tasks?.overdue || ''}</td>
                    <td class="center">${item?.report?.tasks?.done || ''}</td>
                    <td class="center">${item?.report?.tasks?.production || ''}</td>
                    <td class="center">${item?.report?.tasks?.checked || ''}</td>
                    <td class="center">${item?.report?.tasks?.rejected || ''}</td>
                    <td class="center bg-slate">${item?.report?.meetings?.total || ''}</td>
                    <td class="center">${item?.report?.meetings?.attended || ''}</td>
                    <td class="center">${item?.report?.meetings?.missed_excused || ''}</td>
                    <td class="center">${item?.report?.meetings?.missed_unexcused || ''}</td>
                    <td class="number bg-slate">${item?.report?.expense_requests_amount?.total ? Number(item.report.expense_requests_amount.total).toLocaleString("uz-UZ") : ""}</td>
                    <td class="number">${item?.report?.expense_requests_amount?.pending ? Number(item.report.expense_requests_amount.pending).toLocaleString("uz-UZ") : ""}</td>
                    <td class="number">${item?.report?.expense_requests_amount?.pain ? Number(item.report.expense_requests_amount.pain).toLocaleString("uz-UZ") : ""}</td>
                    <td class="number">${item?.report?.expense_requests_amount?.confirmed ? Number(item.report.expense_requests_amount.confirmed).toLocaleString("uz-UZ") : ""}</td>
                    <td class="number bg-slate">${item?.report?.payroll_amount?.total ? Number(item.report.payroll_amount.total).toLocaleString("uz-UZ") : ""}</td>
                    <td class="number">${item?.report?.payroll_amount?.kpi_bonuses ? Number(item.report.payroll_amount.kpi_bonuses).toLocaleString("uz-UZ") : ""}</td>
                    <td class="number">${item?.report?.payroll_amount?.penalty_amount ? Number(item.report.payroll_amount.penalty_amount).toLocaleString("uz-UZ") : ""}</td>
                    <td class="center">${item?.date_joined ? dayjs(item.date_joined).format('DD.MM.YYYY') : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 100);
  }

  // Initialize page actions on mount
  useEffect(() => {
    setDownload({
      show: true,
      excel: handleExcelDownload,
      pdf: handlePdfDownload,
      csv: handleCsvDownload,
    })
    setPrint({
      show: true,
      onClick: handlePrint,
    })

    return () => {
      clearDownload()
      clearPrint()
    }
  }, [UserReports])

  const formatNum = (val) => {
    if (!val && val !== 0) return '';

    let cleanVal = val.toString().replace(/[^\d.]/g, '');

    let [integerPart, decimalPart] = cleanVal.split('.');

    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    if (decimalPart !== undefined) {
      const sliced = decimalPart.slice(0, 2);
      if (sliced === '00') {
        return integerPart;
      }
      return `${integerPart}.${sliced}`;
    }

    return integerPart;
  }

  const sanitizeParams = (params) => {
    if (!params || typeof params !== 'object') return {}

    return Object.entries(params).reduce((cleaned, [key, value]) => {
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) return cleaned

      if (Array.isArray(value)) {
        cleaned[key] = value.join(',')
        return cleaned
      }

      if (dayjs.isDayjs(value)) {
        cleaned[key] = value.format('YYYY-MM-DDTHH:mm:ss')
      } else if (typeof value === 'string') {
        const trimmed = value.trim()
        cleaned[key] = trimmed.replace(/\s+/g, '')
      } else {
        cleaned[key] = value
      }

      return cleaned
    }, {})
  }

  const showClearButton = Object.keys(filters).some((key) => {
    const value = filters[key];
    if (key === 'joined_min' || key === 'joined_max') {
      return !!value;
    }
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });

  const handleFetchReports = () => {
    const params = sanitizeParams(filters)

    getEmployeeReports({ params })
    setFilterModal(false)
  }

  const handleClear = () => {
    setFilters({
      ...initialFilters,
      joined_min: null,
      joined_max: null
    })
    setSearch('')
    setUserReports([])
    setHasFetched(false)
    setFilterModal(false)
  }

  const handleSelectEmployeeConfirm = (selected) => {
    setFilters(prev => ({ ...prev, users: selected }))
    setSelectEmployee(false)
  }

  const handleSearch = () => {
    const params = sanitizeParams(filters)

    getEmployeeReports({ params, search })
  }

  return (
    <div className="relative">
      <div className='flex items-center justify-between'>
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)] dark:text-[var(--text-soft)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Izlash..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 outline-none  bg-slate-100 border border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-soft)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)]"
              style={{ fontSize: 13, fontWeight: 500, padding: '6px 12px 6px 32px', borderRadius: 12 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.trim()) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
          </div>
          <button
            ref={filterButtonRef}
            onClick={(e) => {
              e.preventDefault()
              setFilterModal(prev => !prev)
            }}
            className={`flex items-center justify-between gap-2 h-8 px-5 pr-3! bg-slate-100 dark:bg-[var(--bg-elevation-1)] rounded-xl text-slate-600 text-sm font-semibold dark:text-[var(--text-strong)]! cursor-pointer relative border border-slate-200 dark:border-[var(--stroke-soft)] ${showClearButton ? 'filter-notif' : ''}`}
          >
            <LuFilter size={16} />
            Filtrlash

            <FaAngleDown size={16} className={`transition-transform duration-300 ${!filterModal ? '-rotate-90' : ''}`} />
          </button>
          {showClearButton && (
            <button
              onClick={handleClear}
              className={`flex items-center justify-between gap-2 h-8 px-4 bg-[#f1f5f9] rounded-xl text-red-600 dark:bg-[var(--bg-elevation-1)] text-sm font-semibold cursor-pointer`}
            >
              <FaXmark size={16} />
              Tozalash
            </button>
          )}
        </div>
        <button
          className={`flex items-center justify-between gap-2 px-4 py-2 bg-green-500 rounded-xl text-white text-sm font-bold cursor-pointer transition-all duration-300 hover:bg-green-600 disabled:bg-slate-400 dark:disabled:bg-slate-800 disabled:cursor-default`}
          onClick={handleFetchReports}
        >
          {isLoading ? <LuRefreshCw size={15} className="animate-spin" /> : <FaRegFile size={15} />}
          {isLoading ? "Shakllantirilmoqda..." : "Shakllantirish"}
        </button>
      </div>

      {/* Filter Panel */}
      <div
        className={`transition-all duration-300 ease-in-out w-full ${filterModal ? 'max-h-[1200px] opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'} mt-4`}
      >

        <ConfigProvider
          theme={{
            algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
              borderRadius: 12,
              colorPrimary: '#7186ED',
              motion: false,
              colorTextPlaceholder: isDark ? '#90a1b9' : '#62748e',
              colorBgContainer: isDark ? '#161b22' : '#ffffff',
              colorBgElevated: isDark ? '#161b22' : '#ffffff',
            },
            components: {
              Select: {
                selectorBg: isDark ? '#161b22' : '#ffffff',
                optionSelectedBg: isDark ? '#21262d' : '#F1F3F9',
                optionActiveBg: isDark ? '#1c2128' : 'var(--bg-elevation-1)',
              },
              DatePicker: {
                controlItemBgActive: isDark ? '#21262d' : 'var(--bg-elevation-1)',
              }
            }
          }}
        >
          {/* Row 1: Muddat, Lavozimi, Viloyat, UserIcon */}
          <div className="grid grid-cols-16 gap-4 mb-2">
            <div className="col-span-12 lg:col-span-8">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Ishga kirish sanasi</label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <DatePicker
                    inputReadOnly
                    format="DD.MM.YYYY HH:mm"
                    value={filters.joined_min}
                    onChange={(value) => handleFilterChange('joined_min', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[var(--stroke-soft)]! rounded-xl! text-sm dark:text-[var(--text-strong)]! dark:bg-[var(--bg-elevation-1)]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                    placeholder='Boshlanish sana'
                    suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[var(--text-soft)]" />}
                    allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[var(--text-soft)]" /> }}
                  />
                </div>
                <div className="relative flex-1">
                  <DatePicker
                    inputReadOnly
                    value={filters.joined_max}
                    format="DD.MM.YYYY HH:mm"
                    onChange={(value) => handleFilterChange('joined_max', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[var(--stroke-soft)]! rounded-xl! text-sm dark:text-[var(--text-strong)]! dark:bg-[var(--bg-elevation-1)]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                    placeholder='Tugash sana'
                    suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[var(--text-soft)]" />}
                    allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[var(--text-soft)]" /> }}
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
                  value={regions.find(reg => reg.id === filters.region)?.name}
                  placeholder="Viloyat tanlash"
                  options={regions.map(reg => reg.name)}
                  onChange={(value) => handleFilterChange('region', regions.find(reg => reg.name === value).id)}
                />
              </div>
            </div>

            <div className="col-span-12 md:col-span-4 lg:col-span-1 flex items-end justify-end">
              <button
                onClick={() => setSelectEmployee(true)}
                className={`h-11 px-5 flex  relative items-center justify-center cursor-pointer bg-slate-100 dark:bg-[var(--bg-elevation-1)] border border-slate-200 dark:border-[var(--stroke-soft)] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[var(--bg-elevation-2)]  ${filters?.users?.length > 0 ? 'filter-notif' : ''}`}
              >
                <LuUserPlus size={20} />
              </button>
            </div>
          </div>

          {/* Row 2: Oylik maoshi, Balansi */}
          <div className="grid grid-cols-8 gap-4 mb-2">
            <div className="col-span-2 md:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Oylik maoshi (UZS)</label>
              <div className="flex items-center gap-3">
                <FilterInput
                  label="dan"
                  className='bg-[var(--bg-base)]'
                  value={filters.salary_min}
                  onChange={(e) => handleFilterChange('salary_min', formatNum(e.target.value))}
                />
                <FilterInput
                  className='bg-[var(--bg-base)]'
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
                  className='bg-[var(--bg-base)]'
                  value={filters.balance_min}
                  onChange={(e) => handleFilterChange('balance_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  className='bg-[var(--bg-base)]'
                  value={filters.balance_max}
                  onChange={(e) => handleFilterChange('balance_max', formatNum(e.target.value))}
                />
              </div>
            </div>

            <div className="col-span-4 md:col-span-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Loyiha</label>
              <div className='grid grid-cols-4 gap-3'>
                <div className="col-span-2 relative">
                  <FilterSelect
                    value={filters.project_status || undefined}
                    onChange={(value) => handleFilterChange('project_status', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full py-[10px]! border-slate-200! dark:border-[var(--stroke-soft)]!"
                    placeholder="Jami"
                    options={[
                      {
                        value: 'completed',
                        label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#99CC00]"></span> Tugatilgan</div>,
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#99CC00]"></span> Tugatilgan</div>
                      },
                      {
                        value: 'active',
                        label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#8BBABB]"></span> Jarayonda</div>,
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#8BBABB]"></span> Jarayonda</div>
                      },
                      {
                        value: 'cancelled',
                        label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[var(--text-strong)]"></span> Bekor qilingan</div>,
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[var(--text-strong)]"></span> Bekor qilingan</div>
                      },
                      {
                        value: 'overdue',
                        label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#FF1919]"></span> Muddati o'tgan</div>,
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#FF1919]"></span> Muddati o'tgan</div>
                      },
                      {
                        value: 'planning',
                        label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#D9D9D9]"></span> Rejalashtirilgan</div>,
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#D9D9D9]"></span> Rejalashtirilgan</div>
                      },
                    ]}
                  />
                </div>
                <FilterInput
                  label="dan"
                  className='bg-[var(--bg-base)]'
                  value={filters.projects_min}
                  onChange={(e) => handleFilterChange('projects_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  className='bg-[var(--bg-base)]'
                  value={filters.projects_max}
                  onChange={(e) => handleFilterChange('projects_max', formatNum(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Vazifalar, (placeholder or other) */}
          <div className="grid grid-cols-8 gap-4 mb-2">
            <div className="col-span-4 md:col-span-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Vazifalar</label>
              <div className='grid grid-cols-4 gap-3'>
                <div className="col-span-2">
                  <FilterSelect
                    value={filters.task_status || undefined}
                    onChange={(value) => handleFilterChange('task_status', value)}
                    className="w-full py-[10px]! border-slate-200! dark:border-[var(--stroke-soft)]!"
                    placeholder="Jami"
                    options={[
                      {
                        value: 'todo',
                        label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#FBC02D]"></span> Qilish kerak</div>,
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#FBC02D]"></span> Qilish kerak</div>
                      },
                      {
                        value: 'in_progress',
                        label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1E88E5]"></span> Jarayonda</div>,
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1E88E5]"></span> Jarayonda</div>
                      },
                      {
                        value: 'production',
                        label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#43A047]"></span> Ishga tushurilgan</div>,
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#43A047]"></span> Ishga tushurilgan</div>
                      },
                      {
                        value: 'checked',
                        label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#20FFF6]"></span> Tekshirilgan</div>,
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#20FFF6]"></span>Tekshirilgan</div>
                      },
                      {
                        value: 'rejected',
                        label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#E53935]"></span> Rad etilgan</div>,
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#E53935]"></span> Rad etilgan</div>
                      },
                      {
                        value: 'overdue',
                        label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#616161]"></span> Muddati o'tgan</div>,
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#616161]"></span> Muddati o'tgan</div>
                      },
                      {
                        value: 'done',
                        label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#4CAF50]"></span> Bajarildi</div>,
                        dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#4CAF50]"></span> Bajarildi</div>
                      },
                    ]}
                  />
                </div>
                <FilterInput
                  label="dan"
                  className='bg-[var(--bg-base)]'
                  value={filters.tasks_min}
                  onChange={(e) => handleFilterChange('tasks_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  className='bg-[var(--bg-base)]'
                  value={filters.tasks_max}
                  onChange={(e) => handleFilterChange('tasks_max', formatNum(e.target.value))}
                />
              </div>
            </div>

            <div className="col-span-4 md:col-span-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Yig'ilishlar</label>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2 relative">
                  <FilterSelect
                    value={meetings.find(m => m.value === filters.meetings)?.label}
                    padding='11px 12px'
                    placeholder='Jami'
                    onChange={(value) => handleFilterChange('meetings', meetings.find(m => m.label === value)?.value)}
                    options={meetings.map(m => m.label)}
                  />
                </div>
                <div className="col-span-1 relative">
                  <FilterInput
                    label="dan"
                    value={filters.meetings_min}
                    onChange={(e) => handleFilterChange('meetings_min', formatNum(e.target.value))}
                    className='bg-[var(--bg-base)]'
                  />
                </div>
                <div className="col-span-1 relative">
                  <FilterInput
                    label="gacha"
                    value={filters.meetings_max}
                    onChange={(e) => handleFilterChange('meetings_max', formatNum(e.target.value))}
                    className='bg-[var(--bg-base)]'
                  />
                </div>

              </div>
            </div>
          </div>

          {/* Row 4: Xarajat so'rovi, Ish haqi */}
          <div className="grid grid-cols-8 gap-4 mb-2">
            <div className="col-span-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Xarajat so'rovi (UZS)</label>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2 relative">
                  <FilterSelect
                    value={CostInquiries.find((inquiry) => inquiry.value === filters.expenses_amount)?.label}
                    padding='11px 12px'
                    placeholder={'Jami'}
                    onChange={(value) => handleFilterChange('expenses_amount', CostInquiries.find((inquiry) => inquiry.label === value)?.value)}
                    options={CostInquiries.map((inquiry) => inquiry.label)}
                  />
                </div>
                <FilterInput
                  label="dan"
                  value={filters.expenses_amount_min}
                  onChange={(e) => handleFilterChange('expenses_amount_min', formatNum(e.target.value))}
                  className='bg-[var(--bg-base)]'
                />
                <FilterInput
                  label="gacha"
                  value={filters.expenses_amount_max}
                  onChange={(e) => handleFilterChange('expenses_amount_max', formatNum(e.target.value))}
                  className='bg-[var(--bg-base)]'
                />
              </div>
            </div>

            <div className="col-span-4">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Ish haqi</label>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2 relative">
                  <FilterSelect
                    value={SalaryType.find((type) => type.value === filters.salary_type)?.label}
                    padding='11px 12px'
                    placeholder={'Jami'}
                    onChange={(value) => handleFilterChange('salary_type', SalaryType.find((type) => type.label === value)?.value)}
                    options={SalaryType.map((type) => type.label)}
                  />
                </div>
                <FilterInput
                  label="dan"
                  value={filters.payrolls_amount_min}
                  onChange={(e) => handleFilterChange('payrolls_amount_min', formatNum(e.target.value))}
                  isFine={filters.salary_type === SalaryType[1].value}
                  className='bg-[var(--bg-base)]'
                />
                <FilterInput
                  label="gacha"
                  value={filters.payrolls_amount_max}
                  onChange={(e) => handleFilterChange('payrolls_amount_max', formatNum(e.target.value))}
                  isFine={filters.salary_type === SalaryType[1].value}
                  className='bg-[var(--bg-base)]'
                />
              </div>
            </div>
          </div>

        </ConfigProvider>
      </div>

      {/* Table Section */}
      {isLoading ? (
        <div className="mt-6 rounded-2xl h-[74vh] flex flex-col items-center justify-center border border-slate-200 dark:border-[var(--stroke-soft)] bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] p-10 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ma'lumotlar shakllantirilmoqda...</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Iltimos, biroz kuting.</p>
        </div>
      ) : !hasFetched ? (
        <div className="mt-6 rounded-2xl h-[74vh] flex flex-col justify-center items-center border border-slate-200 dark:border-[var(--stroke-soft)] bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] p-10 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filtrlarni tanlang va Shakillantirish tugmasini bosing.</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Bu yerda ma'lumotlar ko'rsatiladi.</p>
        </div>
      ) : UserReports.length === 0 ? (
        <div className="mt-6 rounded-2xl border h-[74vh] flex flex-col items-center justify-center border-slate-200 dark:border-[var(--stroke-soft)] bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] p-10 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Natija topilmadi.</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Filtrlarni o'zgartirib qayta urinib ko'ring.</p>
        </div>
      ) : (
        <div
          className="mt-6 overflow-auto h-[74vh] border border-slate-200 dark:border-[var(--stroke-soft)]"
          onScroll={handleMoreReportsScroll}
        >
          <table className="text-left border-collapse w-[4500px]">
            <thead className="bg-[#7186ED] text-white sticky top-0 z-20! dark:bg-[#7f95e6]">
              <tr>
                <th rowSpan={2} className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] w-[40px] dark:border-[#292A2A]  sticky z-50!`} style={{ width: 45, minWidth: 45, maxWidth: 45, left: getPinnedLeft('number'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                  <div className="flex flex-col items-center gap-1">
                    №
                  </div>
                </th>
                <th rowSpan={2} className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.username ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 200, minWidth: 200, maxWidth: 200, left: getPinnedLeft('username'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={tablePin.username}
                      onChange={(e) => handlePin('username', e.target.checked)}
                      className="custom-header-checkbox"
                    />
                    Ism Sharifi
                  </div>
                </th>
                <th rowSpan={2} className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.position ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 180, minWidth: 180, maxWidth: 180, left: getPinnedLeft('position'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={tablePin.position}
                      onChange={(e) => handlePin('position', e.target.checked)}
                      className="custom-header-checkbox"
                    />
                    Lavozim
                  </div>
                </th>
                <th rowSpan={2} className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.region ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 160, minWidth: 160, maxWidth: 160, left: getPinnedLeft('region'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={tablePin.region}
                      onChange={(e) => handlePin('region', e.target.checked)}
                      className="custom-header-checkbox"
                    />
                    Viloyati
                  </div>
                </th>
                <th rowSpan={2} className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.district ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 160, minWidth: 160, maxWidth: 160, left: getPinnedLeft('district'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={tablePin.district}
                      onChange={(e) => handlePin('district', e.target.checked)}
                      className="custom-header-checkbox"
                    />
                    Tumani
                  </div>
                </th>
                <th rowSpan={2} className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.phone_number ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 180, minWidth: 180, maxWidth: 180, left: getPinnedLeft('phone_number'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={tablePin.phone_number}
                      onChange={(e) => handlePin('phone_number', e.target.checked)}
                      className="custom-header-checkbox"
                    />
                    Telefon raqami
                  </div>
                </th>
                <th rowSpan={2} className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.fixed_salary ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 180, minWidth: 180, maxWidth: 180, left: getPinnedLeft('fixed_salary'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={tablePin.fixed_salary}
                      onChange={(e) => handlePin('fixed_salary', e.target.checked)}
                      className="custom-header-checkbox"
                    />
                    Oylik maosh (UZS)
                  </div>
                </th>
                <th rowSpan={2} className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.balance ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 180, minWidth: 180, maxWidth: 180, left: getPinnedLeft('balance'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={tablePin.balance}
                      onChange={(e) => handlePin('balance', e.target.checked)}
                      className="custom-header-checkbox"
                    />
                    Balans (UZS)
                  </div>
                </th>
                <th colSpan={6} className={`p-2 text-xs font-bold border-b border-[var(--stroke-sub)] bg-[#7186ED] dark:bg-[#7f95e6] dark:border-[#292A2A]  ${tablePin.projects ? 'sticky z-50!' : 'z-20!'}`} style={{ left: getPinnedLeft('projects'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                  <div className="flex items-center justify-center gap-2">
                    <Checkbox
                      checked={tablePin.projects}
                      onChange={(e) => handlePin('projects', e.target.checked)}
                      className="custom-header-checkbox"
                    />
                    Loyihalar
                  </div>
                </th>
                <th colSpan={8} className={`p-2 text-xs font-bold border-b border-[var(--stroke-sub)] bg-[#7186ED] dark:bg-[#7f95e6] dark:border-[#292A2A]  ${tablePin.tasks ? 'sticky z-50!' : 'z-20!'}`} style={{ left: getPinnedLeft('tasks'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                  <div className="flex items-center justify-center gap-2">
                    <Checkbox
                      checked={tablePin.tasks}
                      onChange={(e) => handlePin('tasks', e.target.checked)}
                      className="custom-header-checkbox"
                    />
                    Vazifalar
                  </div>
                </th>
                <th colSpan={4} className={`p-2 text-xs font-bold border-b border-[var(--stroke-sub)] bg-[#7186ED] dark:bg-[#7f95e6] dark:border-[#292A2A]  ${tablePin.meetings ? 'sticky z-60!' : 'z-20!'}`} style={{ right: getPinnedRight('meetings'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>
                  <div className="flex items-center justify-center gap-2">
                    <Checkbox
                      checked={tablePin.meetings}
                      onChange={(e) => handlePin('meetings', e.target.checked)}
                      className="custom-header-checkbox"
                    />
                    Yig'ilishlar
                  </div>
                </th>
                <th colSpan={4} className={`p-2 text-xs font-bold border-b border-[var(--stroke-sub)] bg-[#7186ED] dark:bg-[#7f95e6] dark:border-[#292A2A]  ${tablePin.expenses ? 'sticky z-60!' : 'z-20!'}`} style={{ right: getPinnedRight('expenses'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>
                  <div className="flex items-center justify-center gap-2">
                    <Checkbox
                      checked={tablePin.expenses}
                      onChange={(e) => handlePin('expenses', e.target.checked)}
                      className="custom-header-checkbox"
                    />
                    Xarajat so'rovlari (UZS)
                  </div>
                </th>
                <th colSpan={3} className={`p-2 text-xs font-bold border-b border-[var(--stroke-sub)] bg-[#7186ED] dark:bg-[#7f95e6] dark:border-[#292A2A]  ${tablePin.payroll ? 'sticky z-60!' : 'z-20!'}`} style={{ right: getPinnedRight('payroll'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>
                  <div className="flex items-center justify-center gap-2">
                    <Checkbox
                      checked={tablePin.payroll}
                      onChange={(e) => handlePin('payroll', e.target.checked)}
                      className="custom-header-checkbox"
                    />
                    Ish haqi (UZS)
                  </div>
                </th>
                <th rowSpan={2} className={`p-2 text-xs bg-[#7186ED] font-bold border-[var(--stroke-sub)] text-center dark:bg-[#7f95e6]! dark:border-[#292A2A]  ${tablePin.date_joined ? 'sticky right-0 z-60!' : 'z-20!'}`} style={{ width: 140, minWidth: 140, maxWidth: 140, right: getPinnedRight('date_joined'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>
                  <Checkbox
                    checked={tablePin.date_joined}
                    onChange={(e) => handlePin('date_joined', e.target.checked)}
                    className="custom-header-checkbox scale-75"
                  />
                  Ishga kirgan vaqti
                </th>
              </tr>

              <tr className="bg-[#7186ED] dark:bg-[#7f95e6] text-[10px] text-center">
                {GROUP_SUBS.projects.map((sub) => (
                  <th key={sub.key} className={`p-2 bg-[#7186ED] dark:bg-[#7f95e6]  ${tablePin[sub.key] ? 'sticky z-50!' : ''}`} style={{ width: 100, minWidth: 100, maxWidth: 100, left: getSubPinnedLeft(sub.key), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-0.5">
                      <Checkbox checked={!!tablePin[sub.key]} onChange={(e) => handlePin(sub.key, e.target.checked)} className="custom-header-checkbox scale-75" />
                      {sub.label}
                    </div>
                  </th>
                ))}

                {GROUP_SUBS.tasks.map((sub) => (
                  <th key={sub.key} className={`p-2 bg-[#7186ED] dark:bg-[#7f95e6]  ${tablePin[sub.key] ? 'sticky z-50!' : ''}`} style={{ width: 100, minWidth: 100, maxWidth: 100, left: getSubPinnedLeft(sub.key), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-0.5">
                      <Checkbox checked={!!tablePin[sub.key]} onChange={(e) => handlePin(sub.key, e.target.checked)} className="custom-header-checkbox scale-75" />
                      {sub.label}
                    </div>
                  </th>
                ))}

                {GROUP_SUBS.meetings.map((sub) => (
                  <th key={sub.key} className={`p-2 bg-[#7186ED] dark:bg-[#7f95e6]  ${tablePin[sub.key] ? 'sticky z-60!' : ''}`} style={{ width: 100, minWidth: 100, maxWidth: 100, right: getSubPinnedRight(sub.key), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-0.5">
                      <Checkbox checked={!!tablePin[sub.key]} onChange={(e) => handlePin(sub.key, e.target.checked)} className="custom-header-checkbox scale-75" />
                      {sub.label}
                    </div>
                  </th>
                ))}

                {GROUP_SUBS.expenses.map((sub) => (
                  <th key={sub.key} className={`p-2 bg-[#7186ED] dark:bg-[#7f95e6]  ${tablePin[sub.key] ? 'sticky z-60!' : ''}`} style={{ width: 120, minWidth: 120, maxWidth: 120, right: getSubPinnedRight(sub.key), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-0.5">
                      <Checkbox checked={!!tablePin[sub.key]} onChange={(e) => handlePin(sub.key, e.target.checked)} className="custom-header-checkbox scale-75" />
                      {sub.label}
                    </div>
                  </th>
                ))}

                {GROUP_SUBS.payroll.map((sub) => (
                  <th key={sub.key} className={`p-2 bg-[#7186ED] dark:bg-[#7f95e6]  ${tablePin[sub.key] ? 'sticky z-60!' : ''}`} style={{ width: 120, minWidth: 120, maxWidth: 120, right: getSubPinnedRight(sub.key), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-0.5">
                      <Checkbox checked={!!tablePin[sub.key]} onChange={(e) => handlePin(sub.key, e.target.checked)} className="custom-header-checkbox scale-75" />
                      {sub.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#161b22] dark:text-slate-300">
              {UserReports.map((item, index) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-[#292A2A]">
                  <td
                    className={`p-3 text-[13px] text-[#6E7681] border-t border-[var(--stroke-sub)] dark:border-[#292A2A] z-10! bg-white dark:bg-[#161b22] dark:text-[#E6EDF3] sticky`}
                    style={{ width: 45, left: getPinnedLeft('number'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    {index + 1}
                  </td>
                  <td className={`p-3 text-[13px] text-start border-r font-semibold text-slate-700 dark:text-[#E6EDF3] border-t border-[var(--stroke-sub)] dark:border-[#292A2A] z-10! bg-white dark:bg-[#161b22]  ${tablePin.username ? 'sticky' : ''}`}
                    style={{
                      width: 200,
                      left: getPinnedLeft('username'),
                      boxShadow: tablePin.username ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none'
                    }}>
                    {item.username}
                  </td>
                  <td className={`p-3 text-[13px] text-slate-600 border-r dark:text-[#E6EDF3] border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-start z-10! bg-white dark:bg-[#161b22]  ${tablePin.position ? 'sticky' : ''}`}
                    style={{
                      width: 180,
                      left: getPinnedLeft('position'),
                      boxShadow: tablePin.position ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none'
                    }}>
                    {item.position}
                  </td>
                  <td className={`p-3 text-[13px] text-slate-600 border-r dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-end z-10! bg-white dark:bg-[#161b22]  ${tablePin.region ? 'sticky' : ''}`}
                    style={{ width: 160, left: getPinnedLeft('region'), boxShadow: tablePin.region ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                    {item.region}
                  </td>
                  <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-end z-10! bg-white dark:bg-[#161b22]  ${tablePin.district ? 'sticky' : ''}`}
                    style={{ width: 160, left: getPinnedLeft('district'), boxShadow: tablePin.district ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                    {item.district}
                  </td>
                  <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-center z-10! bg-white dark:bg-[#161b22]  ${tablePin.phone_number ? 'sticky' : ''}`}
                    style={{ width: 180, left: getPinnedLeft('phone_number'), boxShadow: tablePin.phone_number ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                    {item.phone_number}
                  </td>
                  <td className={`p-3 text-[13px] font-bold text-slate-900 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-end z-10! bg-white dark:bg-[#161b22]  ${tablePin.fixed_salary ? 'sticky' : ''}`}
                    style={{ width: 180, left: getPinnedLeft('fixed_salary'), boxShadow: tablePin.fixed_salary ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                    {item.fixed_salary && Number(item.fixed_salary) > 0 ? Number(item.fixed_salary).toLocaleString("uz-UZ") : ""}
                  </td>
                  <td className={`p-3 text-[13px] font-bold text-slate-900 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-end z-10! bg-white dark:bg-[#161b22]  ${tablePin.balance ? 'sticky' : ''}`}
                    style={{ width: 180, left: getPinnedLeft('balance'), boxShadow: tablePin.balance ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                    {item.balance && Number(item.balance) > 0 ? Number(item.balance).toLocaleString("uz-UZ") : ""}
                  </td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.projects_jami ? 'sticky z-10!' : ''}`} style={{ width: 100, left: getSubPinnedLeft('projects_jami'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.projects?.total || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.projects_tugatilgan ? 'sticky z-10!' : ''}`} style={{ width: 100, left: getSubPinnedLeft('projects_tugatilgan'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.projects?.completed || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.projects_jarayonda ? 'sticky z-10!' : ''}`} style={{ width: 100, left: getSubPinnedLeft('projects_jarayonda'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.projects?.in_progress || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.projects_bekor ? 'sticky z-10!' : ''}`} style={{ width: 100, left: getSubPinnedLeft('projects_bekor'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.projects?.cancelled || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.projects_muddati ? 'sticky z-10!' : ''}`} style={{ width: 100, left: getSubPinnedLeft('projects_muddati'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.projects?.overdue || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.projects_rejalashtirilgan ? 'sticky z-10!' : ''}`} style={{ width: 100, left: getSubPinnedLeft('projects_rejalashtirilgan'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.projects?.planning || ""}</td>

                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.tasks_jami ? 'sticky z-10!' : ''}`} style={{ width: 100, left: getSubPinnedLeft('tasks_jami'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.tasks?.total || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.tasks_qilish ? 'sticky z-10!' : ''}`} style={{ width: 100, left: getSubPinnedLeft('tasks_qilish'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.tasks?.todo || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.tasks_jarayonda ? 'sticky z-10!' : ''}`} style={{ width: 100, left: getSubPinnedLeft('tasks_jarayonda'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.tasks?.in_progress || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.tasks_muddati ? 'sticky z-10!' : ''}`} style={{ width: 100, left: getSubPinnedLeft('tasks_muddati'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.tasks?.overdue || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.tasks_bajarilgan ? 'sticky z-10!' : ''}`} style={{ width: 100, left: getSubPinnedLeft('tasks_bajarilgan'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.tasks?.done || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.tasks_ishga ? 'sticky z-10!' : ''}`} style={{ width: 100, left: getSubPinnedLeft('tasks_ishga'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.tasks?.production || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.tasks_tekshirilgan ? 'sticky z-10!' : ''}`} style={{ width: 100, left: getSubPinnedLeft('tasks_tekshirilgan'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.tasks?.checked || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.tasks_rad ? 'sticky z-10!' : ''}`} style={{ width: 100, left: getSubPinnedLeft('tasks_rad'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.tasks?.rejected || ""}</td>

                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.meetings_jami ? 'sticky z-10!' : ''}`} style={{ width: 100, right: getSubPinnedRight('meetings_jami'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.meetings?.total || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.meetings_qatnashgan ? 'sticky z-10!' : ''}`} style={{ width: 100, right: getSubPinnedRight('meetings_qatnashgan'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.meetings?.attended || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.meetings_sababli ? 'sticky z-10!' : ''}`} style={{ width: 100, right: getSubPinnedRight('meetings_sababli'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.meetings?.missed_excused || ""}</td>
                  <td className={`p-3 text-[13px] text-center border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.meetings_sababsiz ? 'sticky z-10!' : ''}`} style={{ width: 100, right: getSubPinnedRight('meetings_sababsiz'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>{item?.report?.meetings?.missed_unexcused || ""}</td>

                  <td className={`p-3 text-[13px] text-end border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.expenses_jami ? 'sticky z-10!' : ''}`} style={{ width: 120, right: getSubPinnedRight('expenses_jami'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>
                    {item?.report?.expense_requests_amount?.total ? Number(item.report.expense_requests_amount.total).toLocaleString("uz-UZ") : ""}
                  </td>
                  <td className={`p-3 text-[13px] text-end border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.expenses_kutilmoqda ? 'sticky z-10!' : ''}`} style={{ width: 120, right: getSubPinnedRight('expenses_kutilmoqda'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>
                    {item?.report?.expense_requests_amount?.pending ? Number(item.report.expense_requests_amount.pending).toLocaleString("uz-UZ") : ""}
                  </td>
                  <td className={`p-3 text-[13px] text-end border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.expenses_tolandi ? 'sticky z-10!' : ''}`} style={{ width: 120, right: getSubPinnedRight('expenses_tolandi'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>
                    {item?.report?.expense_requests_amount?.pain ? Number(item.report.expense_requests_amount.pain).toLocaleString("uz-UZ") : ""}
                  </td>
                  <td className={`p-3 text-[13px] text-end border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.expenses_tasdiqlangan ? 'sticky z-10!' : ''}`} style={{ width: 120, right: getSubPinnedRight('expenses_tasdiqlangan'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>
                    {item?.report?.expense_requests_amount?.confirmed ? Number(item.report.expense_requests_amount.confirmed).toLocaleString("uz-UZ") : ""}
                  </td>

                  <td className={`p-3 text-[13px] text-end border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.payroll_jami ? 'sticky z-10!' : ''}`} style={{ width: 120, right: getSubPinnedRight('payroll_jami'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>
                    {item?.report?.payroll_amount?.total ? Number(item.report.payroll_amount.total).toLocaleString("uz-UZ") : ""}
                  </td>
                  <td className={`p-3 text-[13px] text-end border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.payroll_kpi ? 'sticky z-10!' : ''}`} style={{ width: 120, right: getSubPinnedRight('payroll_kpi'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>
                    {item?.report?.payroll_amount?.kpi_bonuses ? Number(item.report.payroll_amount.kpi_bonuses).toLocaleString("uz-UZ") : ""}
                  </td>
                  <td className={`p-3 text-[13px] text-end border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.payroll_jarima ? 'sticky z-10!' : ''}`} style={{ width: 120, right: getSubPinnedRight('payroll_jarima'), boxShadow: isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)' }}>
                    {item?.report?.payroll_amount?.penalty_amount ? Number(item.report.payroll_amount.penalty_amount).toLocaleString("uz-UZ") : ""}
                  </td>
                  <td className={`p-3 text-[13px] text-end border-t border-[var(--stroke-sub)] dark:border-[#292A2A] dark:text-[#E6EDF3] bg-white dark:bg-[#161b22] ${tablePin.date_joined ? 'sticky right-0 z-10!' : ''}`}
                    style={{ right: getPinnedRight('date_joined'), boxShadow: tablePin.date_joined ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                    {item?.date_joined ? dayjs(item.date_joined).format('DD.MM.YYYY') : ""}
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
          background-color: var(--accent-strong);
          position: absolute;
          top: 4px;
          right: 4px;
          z-index: 10;
        }

        .custom-header-checkbox .ant-checkbox-inner {
          background-color: white !important;
          border-color: white !important;
          border-radius: 6px !important;
          width: 18px !important;
          height: 18px !important;
        }
        
        .custom-header-checkbox .ant-checkbox-checked .ant-checkbox-inner {
          background-color: var(--accent-strong) !important;
          border-color: var(--accent-strong) !important;
        }
        
        .custom-header-checkbox .ant-checkbox-inner::after {
          border-color: white !important;
        }

        .dark .custom-header-checkbox .ant-checkbox-inner {
          background-color: #292A2A !important;
          border-color: #404040 !important;
        }

        .dark .custom-header-checkbox .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #7186ED !important;
          border-color: #7186ED !important;
        }
      `}</style>

      {selectEmployee && (
        <EmployeeStep
          selectedList={filters.users}
          title="Xodim tanlang"
          employee_role='employee'
          onConfirm={handleSelectEmployeeConfirm}
          onClose={() => setSelectEmployee(false)}
        />
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