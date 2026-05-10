import { useEffect, useRef, useState } from 'react'
import { usePageAction } from '../../../context/PageActionContext'
import { LuFilter, LuRefreshCw } from 'react-icons/lu'
import { FaAngleDown } from 'react-icons/fa'
import { FaRegFile, FaXmark } from 'react-icons/fa6'
import { DatePicker, Select, ConfigProvider, theme, Checkbox } from 'antd'
import { useTheme } from '../../../context/ThemeContext'

const MAIN_COLUMNS = [
  { key: 'number', label: '№', width: 48.5 },
  { key: 'prefix', label: 'Titul', width: 99 },
  { key: 'project', label: 'Loyiha nomi', width: 199.5 },
  { key: 'title', label: 'Vazifa nomi', width: 249 },
  { key: 'assignee', label: 'Topshiruvchi', width: 249.5 },
  { key: 'created_by', label: 'Muallif', width: 249 },
  { key: 'priority', label: 'Darajasi', width: 139 },
  { key: 'status', label: 'Holati', width: 119.2 },
  { key: 'type', label: 'Turi', width: 139 },
  { key: 'task_price', label: 'Vazifa narxi (UZS)', width: 199.5 },
  { key: 'penalty_percentage', label: 'Jarima foizi (%)', width: 150 },
  { key: 'deadline', label: 'Muddati', width: 160 },
  { key: 'created_at', label: 'Yaratilgan vaqti', width: 159 },
  { key: 'sprint', label: 'Sprint raqami', width: 149 },
  { key: 'position', label: 'Kim uchun', width: 179 },
  { key: 'reopened_count', label: 'Qaytishlar soni', width: 149 },
  { key: 'rejection_reason', label: 'Bekor qilish sababi', width: 219 },
]
import FilterSelect from '../Components/FilterSelect'
import { FilterInput } from './Components/FilterInput'
import EmployeeStep from "./Modals/EmployeeStep"
import { toast } from '../../../Toast/ToastProvider'
import { axiosAPI } from '../../../service/axiosAPI'
import dayjs from 'dayjs'
import { PiUsersThreeBold } from 'react-icons/pi'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import ProjectsStep from './Modals/ProjectsStep'
import { usePositions } from '../../../MostUsesDates/'
import { FiCalendar } from 'react-icons/fi'
import { IoCloseCircle } from 'react-icons/io5'
import { MdExpandMore } from 'react-icons/md'

const type = [
  { label: "Xatolik", value: "bug" },
  { label: "Qo'shimcha", value: "extra" },
  { label: "Tadqiqot", value: "research" },
  { label: "Yangi funksiya", value: "feature" }
]

const priority_type = [
  { label: "Past", value: "low" },
  { label: "O'rta", value: "medium" },
  { label: "Yuqori", value: "high" },
  { label: "Kritik", value: "critical" }
]

const sprint = [
  { label: "Sprint 1", value: 1 },
  { label: "Sprint 2", value: 2 },
  { label: "Sprint 3", value: 3 },
  { label: "Sprint 4", value: 4 },
  { label: "Sprint 5", value: 5 },
]

const status = {
  todo: "Qilinishi kerak",
  in_progress: "Jarayonda",
  overdue: "Muddati o'tgan",
  done: "Bajarildi",
  production: "Ishga tushirildi",
  checked: "Tekshirildi",
  rejected: "Rad etildi"
}

const monthStart = dayjs().startOf('month').hour(0).minute(0).second(0).millisecond(0)
const monthEnd = dayjs().endOf('month').hour(23).minute(59).second(0).millisecond(0)

const initialFilters = {
  created_at_min: monthStart,
  created_at_max: monthEnd,
  confirmed_at_min: '',
  confirmed_at_max: '',
  user: '',
  accountants: '',
  month: '',
  is_confirmed: '',
  total_amount_min: '',
  total_amount_max: '',
  salary_min: '',
  salary_max: '',
  kpi_min: '',
  kpi_max: '',
  penalty_min: '',
  penalty_max: '',
}

const Employee = () => {
  const { isDark } = useTheme()
  const positions = usePositions()

  const { setDownload, setPrint, clearDownload, clearPrint } = usePageAction()
  const [search, setSearch] = useState(null)
  const [filterModal, setFilterModal] = useState(false)
  const [filters, setFilters] = useState(initialFilters)
  const [selectSubmitter, setSelectSubmitter] = useState(false)
  const [selectAuthor, setSelectAuthor] = useState(false)
  const [selectProject, setSelectProject] = useState(false)
  const [UserReports, setUserReports] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [ReportsNextURL, setReportsNextURL] = useState(null)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const filterRef = useRef(null)
  const filterButtonRef = useRef(null)
  const RIGHT_PINNED_KEYS = ['deadline', 'created_at', 'sprint', 'position', 'reopened_count', 'rejection_reason'];
  const [tablePin, setTablePin] = useState({
    number: true,
    project: false,
  })

  const handlePin = (key, value) => {
    setTablePin(prev => ({ ...prev, [key]: value }))
  }

  const getPinnedLeft = (key) => {
    if (!tablePin[key]) return undefined
    let offset = 0
    for (const col of MAIN_COLUMNS) {
      if (col.key === key) return offset
      if (tablePin[col.key]) offset += col.width
    }
    return undefined
  }

  const getPinnedRight = (key) => {
    if (!tablePin[key]) return undefined
    let offset = 0
    for (let i = MAIN_COLUMNS.length - 1; i >= 0; i--) {
      const col = MAIN_COLUMNS[i]
      if (col.key === key) return offset
      if (tablePin[col.key]) offset += col.width
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
      const { data } = await axiosAPI.get(`reports/tasks/`, { params: { ...params, search } })
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
    if (!ReportsNextURL || isFetchingNextPage) return
    setIsFetchingNextPage(true)
    try {
      const { data } = await axiosAPI.get(ReportsNextURL)
      setUserReports(prev => [...prev, ...data.data.results])
      setReportsNextURL(data.data.next)
    } catch (error) {
      console.error(error)
      toast.error('Keyingi sahifani yuklashda xatolik yuz berdi.', error?.response?.data?.error?.errMsg || 'Iltimos, qayta urinib ko\'ring.')
    } finally {
      setIsFetchingNextPage(false)
    }
  }

  const handleMoreReportsScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    if (scrollHeight - scrollTop <= clientHeight + 100 && ReportsNextURL && !isFetchingNextPage) {
      loadMoreReports()
    }
  }

  const handleExcelDownload = async () => {
    if (!UserReports || UserReports.length === 0) {
      toast.info('Yuklab olish uchun ma\'lumot yo\'q');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vazifalar hisoboti');

    worksheet.columns = [
      { header: '№', key: 'id', width: 5 },
      { header: 'Titul', key: 'prefix', width: 15 },
      { header: 'Loyiha nomi', key: 'project', width: 25 },
      { header: 'Vazifa nomi', key: 'title', width: 30 },
      { header: 'Topshiruvchi', key: 'assignee', width: 25 },
      { header: 'Muallif', key: 'created_by', width: 25 },
      { header: 'Darajasi', key: 'priority', width: 15 },
      { header: 'Holati', key: 'status', width: 15 },
      { header: 'Turi', key: 'type', width: 15 },
      { header: 'Vazifa narxi (UZS)', key: 'task_price', width: 20 },
      { header: 'Jarima foizi (%)', key: 'penalty_percentage', width: 15 },
      { header: 'Muddati', key: 'deadline', width: 20 },
      { header: 'Yaratilgan vaqti', key: 'created_at', width: 20 },
      { header: 'Sprint raqami', key: 'sprint', width: 15 },
      { header: 'Kim uchun', key: 'position', width: 20 },
      { header: 'Qaytishlar soni', key: 'reopened_count', width: 15 },
      { header: 'Bekor qilish sababi', key: 'rejection_reason', width: 30 },
    ];

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF7186ED' }
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 11
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E6F2' } },
        left: { style: 'thin', color: { argb: 'FFE2E6F2' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E6F2' } },
        right: { style: 'thin', color: { argb: 'FFE2E6F2' } }
      };
    });
    headerRow.height = 35;

    UserReports.forEach((item, index) => {
      const rowData = {
        id: index + 1,
        prefix: item?.prefix || "-",
        project: item?.project || "-",
        title: item?.title || "-",
        assignee: item?.assignee || "-",
        created_by: item?.created_by || "-",
        priority: priority_type.find((s) => s?.value === item?.priority)?.label || "-",
        status: status[item?.status] || "-",
        type: type.find((s) => s?.value === item?.type)?.label || "-",
        task_price: item?.task_price || 0,
        penalty_percentage: item?.penalty_percentage || 0,
        deadline: item?.deadline ? dayjs(item.deadline).format('DD.MM.YYYY HH:mm') : "-",
        created_at: item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : "-",
        sprint: item?.sprint || "-",
        position: item?.position ? item?.position?.split(",").map((pos) => pos).join(", ") : "-",
        reopened_count: item?.reopened_count || 0,
        rejection_reason: item?.rejection_reason || "-"
      };
      const row = worksheet.addRow(rowData);

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E6F2' } },
          left: { style: 'thin', color: { argb: 'FFE2E6F2' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E6F2' } },
          right: { style: 'thin', color: { argb: 'FFE2E6F2' } }
        };

        let fontColor = 'FF475569';
        let isBold = false;
        let horizontalAlign = 'center';

        if (colNumber === 1) {
          fontColor = 'FF64748B';
        } else if ([3, 4, 5, 6].includes(colNumber)) {
          horizontalAlign = 'left';
          fontColor = 'FF334155';
          isBold = true;
        } else if (colNumber === 10) {
          horizontalAlign = 'right';
          fontColor = 'FF0F172A';
          isBold = true;
          cell.numFmt = '#,##0';
        } else if (colNumber === 17) {
          horizontalAlign = 'left';
        }

        cell.alignment = { vertical: 'middle', horizontal: horizontalAlign, wrapText: true };
        cell.font = {
          color: { argb: fontColor },
          bold: isBold,
          size: 10
        };

        if ([1, 2, 3].includes(colNumber)) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' }
          };
        }
      });
      row.height = 25;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Vazifalar_hisoboti_${dayjs().format('DD_MM_YYYY')}.xlsx`);
  }

  const handlePdfDownload = () => {
    if (!UserReports || UserReports.length === 0) {
      toast.info('Yuklab olish uchun ma\'lumot yo\'q');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });

    autoTable(doc, {
      head: [['№', 'Titul', 'Loyiha', 'Vazifa', 'Topshiruvchi', 'Muallif', 'Daraja', 'Holat', 'Turi', 'Narxi', 'Jarima %', 'Muddati', 'Yaratilgan', 'Sprint', 'Kimga', 'Qaytish', 'Bekor qilish sababi']],
      body: UserReports.map((item, index) => [
        index + 1,
        item?.prefix || "-",
        item?.project || "-",
        item?.title || "-",
        item?.assignee || "-",
        item?.created_by || "-",
        priority_type.find((s) => s?.value === item?.priority)?.label || "-",
        status[item?.status] || "-",
        type.find((s) => s?.value === item?.type)?.label || "-",
        formatNum(item?.task_price || 0),
        item?.penalty_percentage || 0,
        item?.deadline ? dayjs(item.deadline).format('DD.MM.YYYY HH:mm') : "-",
        item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : "-",
        item?.sprint || "-",
        item?.position ? item?.position?.split(",").map((pos) => pos).join(", ") : "-",
        item?.reopened_count || 0,
        item?.rejection_reason || "-"
      ]),
      headStyles: {
        fillColor: [113, 134, 237],
        textColor: [255, 255, 255],
        halign: 'center',
        valign: 'middle',
        fontStyle: 'bold',
        fontSize: 7
      },
      styles: {
        fontSize: 6,
        lineColor: [226, 230, 242],
        lineWidth: 0.1,
        cellPadding: 2
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 15 },
        2: { halign: 'left', cellWidth: 20 },
        3: { halign: 'left', cellWidth: 25 },
        4: { halign: 'left', cellWidth: 20 },
        5: { halign: 'left', cellWidth: 20 },
        9: { halign: 'right', fontStyle: 'bold' },
        10: { halign: 'center' },
        11: { halign: 'center' },
        12: { halign: 'center' },
        13: { halign: 'center' },
        14: { halign: 'center' },
        15: { halign: 'center' },
        16: { halign: 'left' }
      },
      theme: 'grid',
      margin: { top: 15, left: 5, right: 5 },
      didDrawPage: function () {
        doc.setFontSize(12);
        doc.text('Vazifalar hisoboti', 14, 10);
      }
    });

    doc.save(`Vazifalar_hisoboti_${dayjs().format('DD_MM_YYYY')}.pdf`);
  }

  const handleCsvDownload = () => {
    if (!UserReports || UserReports.length === 0) {
      toast.info('Yuklab olish uchun ma\'lumot yo\'q');
      return;
    }

    const csvData = UserReports.map((item, index) => ({
      '№': index + 1,
      'Titul': item?.prefix || "-",
      'Loyiha nomi': item?.project || "-",
      'Vazifa nomi': item?.title || "-",
      'Topshiruvchi': item?.assignee || "-",
      'Muallif': item?.created_by || "-",
      'Darajasi': priority_type.find((s) => s?.value === item?.priority)?.label || "-",
      'Holati': status[item?.status] || "-",
      'Turi': type.find((s) => s?.value === item?.type)?.label || "-",
      'Vazifa narxi (UZS)': item?.task_price || 0,
      'Jarima foizi (%)': item?.penalty_percentage || 0,
      'Muddati': item?.deadline ? dayjs(item.deadline).format('DD.MM.YYYY HH:mm') : "-",
      'Yaratilgan vaqti': item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : "-",
      'Sprint raqami': item?.sprint || "-",
      'Kim uchun': item?.position ? item?.position?.split(",").map((pos) => pos).join(", ") : "-",
      'Qaytishlar soni': item?.reopened_count || 0,
      'Bekor qilish sababi': item?.rejection_reason || "-"
    }));

    const csvContent = "\uFEFF" + Papa.unparse(csvData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Vazifalar_hisoboti_${dayjs().format('DD_MM_YYYY')}.csv`);
  }

  const handlePrint = () => {
    if (!UserReports || UserReports.length === 0) {
      toast.info('Chop etish uchun ma\'lumot yo\'q');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vazifalar hisoboti</title>
          <style>
            @page { 
              size: landscape; 
              margin: 5mm; 
            }
            body { 
              font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              font-size: 8px; 
              color: var(--text-strong);
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            h2 { 
              text-align: center; 
              margin-bottom: 15px; 
              font-size: 16px;
              color: #1e293b;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
              table-layout: auto;
            }
            th, td { 
              border: 1px solid #e2e8f0; 
              padding: 4px 6px; 
              text-align: left;
              word-wrap: break-word;
            }
            th { 
              background-color: #7186ED; 
              font-weight: bold; 
              color: white;
              text-align: center;
              text-transform: uppercase;
              font-size: 7px;
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
            td.bold {
              font-weight: 600;
              color: #1e293b;
            }
          </style>
        </head>
        <body>
          <h2>Vazifalar hisoboti</h2>
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Titul</th>
                <th>Loyiha nomi</th>
                <th>Vazifa nomi</th>
                <th>Topshiruvchi</th>
                <th>Muallif</th>
                <th>Darajasi</th>
                <th>Holati</th>
                <th>Turi</th>
                <th>Vazifa narxi (UZS)</th>
                <th>Jarima foizi (%)</th>
                <th>Muddati</th>
                <th>Yaratilgan vaqti</th>
                <th>Sprint raqami</th>
                <th>Kim uchun</th>
                <th>Qaytishlar soni</th>
                <th>Bekor qilish sababi</th>
              </tr>
            </thead>
            <tbody>
              ${UserReports.map((item, index) => `
                <tr>
                  <td class="center">${index + 1}</td>
                  <td class="center">${item?.prefix || "-"}</td>
                  <td class="bold">${item?.project || "-"}</td>
                  <td class="bold">${item?.title || "-"}</td>
                  <td>${item?.assignee || "-"}</td>
                  <td>${item?.created_by || "-"}</td>
                  <td class="center">${priority_type.find((s) => s?.value === item?.priority)?.label || "-"}</td>
                  <td class="center">${status[item?.status] || "-"}</td>
                  <td class="center">${type.find((s) => s?.value === item?.type)?.label || "-"}</td>
                  <td class="number">
                    ${item?.task_price ? item.task_price.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') : '0'}
                  </td>
                  <td class="center">${item?.penalty_percentage || 0}</td>
                  <td class="center">${item?.deadline ? dayjs(item.deadline).format('DD.MM.YYYY HH:mm') : "-"}</td>
                  <td class="center">${item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : "-"}</td>
                  <td class="center">${item?.sprint || "-"}</td>
                  <td class="center">${item?.position ? item?.position?.split(",").map((pos) => pos).join(", ") : "-"}</td>
                  <td class="center">${item?.reopened_count || 0}</td>
                  <td>${item?.rejection_reason || "-"}</td>
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
        return integerPart === '0' ? '' : integerPart;
      }
      return `${integerPart}.${sliced}`;
    }

    return integerPart === '0' ? '' : integerPart;
  }

  const formatPercent = (val) => {
    const cleaned = String(val || '').replace(/,/g, '.').replace(/[^\d.]/g, '')
    if (!cleaned) return ''
    const firstDot = cleaned.indexOf('.')
    const normalized = firstDot === -1
      ? cleaned
      : `${cleaned.slice(0, firstDot)}.${cleaned.slice(firstDot + 1).replace(/\./g, '')}`
    const [intPartRaw = '', decRaw = ''] = normalized.split('.')
    const intPart = intPartRaw.replace(/^0+(?=\d)/, '') || '0'

    if (firstDot === -1) {
      return Number(intPart) > 100 ? '100' : intPart
    } else {
      const limitedDec = decRaw.slice(0, 2)
      const resultStr = `${intPart}.${limitedDec}`
      return Number(resultStr) > 100 ? '100' : resultStr
    }
  }

  const sanitizeParams = (params) => {
    if (!params || typeof params !== 'object') return {}

    return Object.entries(params).reduce((cleaned, [key, value]) => {
      if (value === undefined || value === null || value === '') return cleaned
      if (Array.isArray(value) && value.length === 0) return cleaned

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
    if (key === 'created_at_min' || key === 'created_at_max') {
      return !!value;
    }
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });

  const handleFetchReports = () => {
    const params = sanitizeParams(filters)

    getEmployeeReports({ params, search })
    setFilterModal(false)
  }

  const handleClear = () => {
    setFilters({
      ...initialFilters,
      created_at_min: null,
      created_at_max: null
    })
    setSearch('')
    setFilterModal(false)
    setHasFetched(false)
    setUserReports([])
  }

  const handleSelectEmployeeConfirm = (selected) => {
    setFilters(prev => ({ ...prev, assignee: selected.join(',') }))
    setSelectSubmitter(false)
  }

  const handleSelectAccountantConfirm = (selected) => {
    setFilters(prev => ({ ...prev, created_by: selected.join(',') }))
    setSelectAuthor(false)
  }

  const handleSelectProjectConfirm = (selected) => {
    setFilters(prev => ({ ...prev, project: selected.join(',') }))
    setSelectProject(false)
  }

  const handleSearch = () => {
    if (!search.trim()) {
      return;
    }
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
                if (e.key === 'Enter') {
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
            className={`flex items-center justify-between gap-2 h-8 px-5 pr-3! bg-slate-100 dark:bg-[var(--bg-elevation-1)] dark:text-[var(--text-strong)] rounded-xl text-slate-600 text-sm font-semibold cursor-pointer relative border border-slate-200 dark:border-[var(--stroke-soft)] ${showClearButton ? 'filter-notif' : ''}`}
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
                optionSelectedBg: isDark ? '#161b22' : '#F1F3F9',
                optionActiveBg: isDark ? '#2d3748' : 'var(--bg-elevation-1)',
              }
            }
          }}
        >
          {/* Row 1 */}
          <div className="grid grid-cols-5 gap-4 mb-3">
            <div className="col-span-4 lg:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Yaratilgan vaqtdi</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative flex-1">
                  <DatePicker
                    inputReadOnly
                    format="DD.MM.YYYY HH:mm"
                    value={filters.created_at_min}
                    onChange={(value) => handleFilterChange('created_at_min', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[var(--stroke-soft)]! rounded-xl! text-sm dark:text-[var(--text-strong)]! dark:bg-[var(--bg-elevation-1)]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                    placeholder='Boshlanish sanasi'
                    suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[var(--text-soft)]" />}
                    allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[var(--text-soft)]" /> }}
                  />
                </div>
                <div className="relative flex-1">
                  <DatePicker
                    inputReadOnly
                    value={filters.created_at_max}
                    format="DD.MM.YYYY HH:mm"
                    onChange={(value) => handleFilterChange('created_at_max', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[var(--stroke-soft)]! rounded-xl! text-sm dark:text-[var(--text-strong)]! dark:bg-[var(--bg-elevation-1)]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                    placeholder='Tugash sana'
                    suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[var(--text-soft)]" />}
                    allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[var(--text-soft)]" /> }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Loyihalar</label>
              <button
                type="button"
                onClick={() => setSelectProject(true)}
                className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[var(--bg-elevation-1)] border border-slate-200 dark:border-[var(--stroke-soft)] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[var(--bg-elevation-2)]  cursor-pointer ${filters?.project?.length > 0 ? 'filter-notif' : ''}`}
              >
                <span className="truncate text-sm font-medium">
                  {filters.project ? `${filters.project.split(',').filter(Boolean).length} ta loyiha` : 'Loyiha tanlang'}
                </span>
                <div className="flex items-center gap-2">
                  <img src="/imgs/Briefcase.svg" alt="Loyiha" size={18} />

                  {filters.project && (
                    <FaXmark
                      size={18}
                      className="text-red-500"
                      onClick={(e) => { e.stopPropagation(); handleFilterChange('project', '') }}
                    />
                  )}
                </div>
              </button>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Topshiruvchi</label>
              <button
                type="button"
                onClick={() => setSelectSubmitter(true)}
                className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[var(--bg-elevation-1)] border border-slate-200 dark:border-[var(--stroke-soft)] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[var(--bg-elevation-2)] cursor-pointer ${filters?.assignee?.length > 0 ? 'filter-notif' : ''}`}
              >
                <span className="truncate text-sm font-medium">
                  {filters.assignee ? `${filters.assignee.split(',').filter(Boolean).length} ta topshiruvchi` : 'Topshiruvchi tanlang'}
                </span>
                <div className="flex items-center gap-2">
                  <PiUsersThreeBold size={18} />

                  {filters.assignee && (
                    <FaXmark
                      size={18}
                      className="text-red-500"
                      onClick={(e) => { e.stopPropagation(); handleFilterChange('assignee', '') }}
                    />
                  )}
                </div>
              </button>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Muallif</label>
              <button
                type="button"
                onClick={() => setSelectAuthor(true)}
                className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[var(--bg-elevation-1)] border border-slate-200 dark:border-[var(--stroke-soft)] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[var(--bg-elevation-2)] cursor-pointer ${filters?.created_by?.length > 0 ? 'filter-notif' : ''}`}
              >
                <span className="truncate text-sm font-medium">
                  {filters.created_by ? `${filters.created_by.split(',').filter(Boolean).length} ta muallif` : 'Muallif tanlang'}
                </span>
                <div className="flex items-center gap-2">
                  <PiUsersThreeBold size={18} />

                  {filters.created_by && (
                    <FaXmark
                      size={18}
                      className="text-red-500"
                      onClick={(e) => { e.stopPropagation(); handleFilterChange('created_by', '') }}
                    />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-4 mb-3">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Darajasi</label>
              <FilterSelect
                padding='13px 12px'
                placeholder="Darajasini tanlang"
                options={priority_type}
                value={filters.priority}
                onChange={(value) => handleFilterChange('priority', value)}
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Holati</label>
              <FilterSelect
                value={filters.status || undefined}
                onChange={(value) => handleFilterChange('status', value)}
                className="w-full py-[12px]! border-slate-200! dark:border-[var(--stroke-soft)]!"
                placeholder="Holatini tanlang"
                options={[
                  {
                    value: 'todo',
                    label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#FBC02D]"></span> Qilish kerak</div>
                  },
                  {
                    value: 'in_progress',
                    label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1E88E5]"></span> Jarayonda</div>
                  },
                  {
                    value: 'done',
                    label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#5E35B1]"></span> Bajarilgan</div>
                  },
                  {
                    value: 'production',
                    label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#43A047]"></span> Ishga tushurilgan</div>,
                  },
                  {
                    value: 'checked',
                    label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#20FFF6]"></span> Tekshirilgan</div>,
                  },
                  {
                    value: 'rejected',
                    label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#E53935]"></span> Rad etilgan</div>
                  },
                  {
                    value: 'overdue',
                    label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#616161]"></span> Muddati o'tgan</div>,
                  }
                ]}
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Turi</label>
              <FilterSelect
                padding='13px 12px'
                placeholder="Turini tanlang"
                options={type}
                value={filters.type}
                onChange={(value) => handleFilterChange('type', value)}
                multiple={true}
              />
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Sprint</label>
              <FilterSelect
                padding='13px 12px'
                placeholder="Sprint tanlang"
                options={sprint}
                value={filters.sprint}
                onChange={(value) => handleFilterChange('sprint', value)}
                multiple={true}
              />
            </div>
          </div>

          {/* Row 3*/}
          <div className="grid grid-cols-8 gap-4">
            <div className="col-span-2 md:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Kim uchun</label>
              <FilterSelect
                padding='13px 12px'
                placeholder="Kim uchun"
                options={positions.map(pos => ({ value: pos.name, label: pos.name }))}
                value={filters.position}
                onChange={(value) => handleFilterChange('position', value)}
                multiple={true}
              />
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Vazifasi narxi (UZS)</label>
              <div className='grid grid-cols-2 gap-3'>
                <FilterInput
                  label="dan"
                  className='bg-[var(--bg-elevation-1-alt)] h-12'
                  value={filters.price_min}
                  onChange={(e) => handleFilterChange('price_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  className='bg-[var(--bg-elevation-1-alt)] h-12'
                  value={filters.price_max}
                  onChange={(e) => handleFilterChange('price_max', formatNum(e.target.value))}
                />
              </div>
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Jarima foizi (%)</label>
              <div className='grid grid-cols-2 gap-3'>
                <FilterInput
                  label="dan"
                  className='bg-[var(--bg-elevation-1-alt)] h-12'
                  value={filters.penalty_min}
                  onChange={(e) => handleFilterChange('penalty_min', formatPercent(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  className='bg-[var(--bg-elevation-1-alt)] h-12'
                  value={filters.penalty_max}
                  onChange={(e) => handleFilterChange('penalty_max', formatPercent(e.target.value))}
                />
              </div>
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Qaytishlar soni</label>
              <div className='grid grid-cols-2 gap-3'>
                <FilterInput
                  label="dan"
                  className='bg-[var(--bg-elevation-1-alt)] h-12'
                  value={filters.reopened_min}
                  onChange={(e) => handleFilterChange('reopened_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  className='bg-[var(--bg-elevation-1-alt)] h-12'
                  value={filters.reopened_max}
                  onChange={(e) => handleFilterChange('reopened_max', formatNum(e.target.value))}
                />
              </div>
            </div>

          </div>
        </ConfigProvider>
      </div>

      {/* Table Section */}
      {
        isLoading ? (
          <div className="mt-6 rounded-2xl border flex flex-col justify-center items-center h-[74vh] border-slate-200 dark:border-[var(--stroke-soft)] bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] p-10 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ma'lumotlar shakllantirilmoqda...</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Iltimos, biroz kuting.</p>
          </div>
        ) : !hasFetched ? (
          <div className="mt-6 h-[74vh] flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-[var(--stroke-soft)] bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] p-10 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filtrlarni tanlang va Shakillantirish tugmasini bosing.</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Bu yerda ma'lumotlar ko'rsatiladi.</p>
          </div>
        ) : UserReports.length === 0 ? (
          <div className="mt-6 rounded-2xl flex flex-col justify-center items-center h-[74vh] border border-slate-200 dark:border-[var(--stroke-soft)] bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] p-10 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Natija topilmadi.</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Filtrlarni o'zgartirib qayta urinib ko'ring.</p>
          </div>
        ) : (
          <div
            className="mt-6 overflow-auto h-[74vh] border border-slate-200 dark:border-[var(--stroke-soft)]"
            onScroll={handleMoreReportsScroll}
          >
            <table className="text-left border-collapse w-[270px]">
              <thead className="bg-[#7186ED] text-white sticky top-0 z-20! dark:bg-[#7f95e6]">
                <tr>
                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] sticky z-50!`}
                    style={{ width: 49.5, minWidth: 49.5, maxWidth: 49.5, left: getPinnedLeft('number'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)', textAlign: 'center' }}>
                    №
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.prefix ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 100, minWidth: 100, maxWidth: 100, left: getPinnedLeft('prefix'), boxShadow: tablePin.prefix ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'start' }}>
                    <div className="flex items-center gap-2 justify-start">
                      <Checkbox checked={tablePin.prefix} onChange={(e) => handlePin('prefix', e.target.checked)} className="custom-header-checkbox" />
                      Titul
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.project ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 200, minWidth: 200, maxWidth: 200, left: getPinnedLeft('project'), boxShadow: tablePin.project ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'start' }}>
                    <div className="flex items-center gap-2 justify-start">
                      <Checkbox checked={tablePin.project} onChange={(e) => handlePin('project', e.target.checked)} className="custom-header-checkbox" />
                      Loyiha nomi
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.title ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 250, minWidth: 250, maxWidth: 250, left: getPinnedLeft('title'), boxShadow: tablePin.title ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'start' }}>
                    <div className="flex items-center gap-2 justify-start">
                      <Checkbox checked={tablePin.title} onChange={(e) => handlePin('title', e.target.checked)} className="custom-header-checkbox" />
                      Vazifa nomi
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.assignee ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 220, minWidth: 220, maxWidth: 220, left: getPinnedLeft('assignee'), boxShadow: tablePin.assignee ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'start' }}>
                    <div className="flex items-center gap-2 justify-start">
                      <Checkbox checked={tablePin.assignee} onChange={(e) => handlePin('assignee', e.target.checked)} className="custom-header-checkbox" />
                      Topshiruvchi
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.created_by ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 220, minWidth: 220, maxWidth: 220, left: getPinnedLeft('created_by'), boxShadow: tablePin.created_by ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'start' }}>
                    <div className="flex items-center gap-2 justify-start">
                      <Checkbox checked={tablePin.created_by} onChange={(e) => handlePin('created_by', e.target.checked)} className="custom-header-checkbox" />
                      Muallif
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.priority ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 140, minWidth: 140, maxWidth: 140, left: getPinnedLeft('priority'), boxShadow: tablePin.priority ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'end' }}>
                    <div className="flex items-center gap-2 justify-end">
                      <Checkbox checked={tablePin.priority} onChange={(e) => handlePin('priority', e.target.checked)} className="custom-header-checkbox" />
                      Darajasi
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.status ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 120, minWidth: 120, maxWidth: 120, left: getPinnedLeft('status'), boxShadow: tablePin.status ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'center' }}>
                    <div className="flex items-center gap-2 justify-center">
                      <Checkbox checked={tablePin.status} onChange={(e) => handlePin('status', e.target.checked)} className="custom-header-checkbox" />
                      Holati
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.type ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 140, minWidth: 140, maxWidth: 140, left: getPinnedLeft('type'), boxShadow: tablePin.type ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'center' }}>
                    <div className="flex items-center gap-2 justify-center">
                      <Checkbox checked={tablePin.type} onChange={(e) => handlePin('type', e.target.checked)} className="custom-header-checkbox" />
                      Turi
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.task_price ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 200, minWidth: 200, maxWidth: 200, left: getPinnedLeft('task_price'), boxShadow: tablePin.task_price ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'end' }}>
                    <div className="flex items-center gap-2 justify-end">
                      <Checkbox checked={tablePin.task_price} onChange={(e) => handlePin('task_price', e.target.checked)} className="custom-header-checkbox" />
                      Vazifa narxi (UZS)
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.penalty_percentage ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 150, minWidth: 150, maxWidth: 150, left: getPinnedLeft('penalty_percentage'), boxShadow: tablePin.penalty_percentage ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'end' }}>
                    <div className="flex items-center gap-2 justify-end">
                      <Checkbox checked={tablePin.penalty_percentage} onChange={(e) => handlePin('penalty_percentage', e.target.checked)} className="custom-header-checkbox" />
                      Jarima foizi (%)
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.deadline ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 160, minWidth: 160, maxWidth: 160, right: getPinnedRight('deadline'), boxShadow: tablePin.deadline ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'center' }}>
                    <div className="flex items-center gap-2 justify-center">
                      <Checkbox checked={tablePin.deadline} onChange={(e) => handlePin('deadline', e.target.checked)} className="custom-header-checkbox" />
                      Muddati
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.created_at ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 160, minWidth: 160, maxWidth: 160, right: getPinnedRight('created_at'), boxShadow: tablePin.created_at ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'center' }}>
                    <div className="flex items-center gap-2 justify-center">
                      <Checkbox checked={tablePin.created_at} onChange={(e) => handlePin('created_at', e.target.checked)} className="custom-header-checkbox" />
                      Yaratilgan vaqti
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.sprint ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 150, minWidth: 150, maxWidth: 150, right: getPinnedRight('sprint'), boxShadow: tablePin.sprint ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'center' }}>
                    <div className="flex items-center gap-2 justify-center">
                      <Checkbox checked={tablePin.sprint} onChange={(e) => handlePin('sprint', e.target.checked)} className="custom-header-checkbox" />
                      Sprint raqami
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.position ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 180, minWidth: 180, maxWidth: 180, right: getPinnedRight('position'), boxShadow: tablePin.position ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'end' }}>
                    <div className="flex items-center gap-2 justify-end">
                      <Checkbox checked={tablePin.position} onChange={(e) => handlePin('position', e.target.checked)} className="custom-header-checkbox" />
                      Kim uchun
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.reopened_count ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 150, minWidth: 150, maxWidth: 150, right: getPinnedRight('reopened_count'), boxShadow: tablePin.reopened_count ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'center' }}>
                    <div className="flex items-center gap-2 justify-center">
                      <Checkbox checked={tablePin.reopened_count} onChange={(e) => handlePin('reopened_count', e.target.checked)} className="custom-header-checkbox" />
                      Qaytishlar soni
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] ${tablePin.rejection_reason ? 'sticky z-50!' : 'z-20!'}`}
                    style={{ width: 220, minWidth: 220, maxWidth: 220, right: getPinnedRight('rejection_reason'), boxShadow: tablePin.rejection_reason ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : 'none', textAlign: 'start' }}>
                    <div className="flex items-center gap-2 justify-start">
                      <Checkbox checked={tablePin.rejection_reason} onChange={(e) => handlePin('rejection_reason', e.target.checked)} className="custom-header-checkbox" />
                      Bekor qilish sababi
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[var(--bg-elevation-1)] dark:text-slate-300">
                {UserReports.map((item, index) => (
                  <tr className="border-b border-slate-100 dark:border-[#292A2A]" key={item.id || index}>
                    <td className={`p-3 text-[13px] text-[#6E7681] border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-center sticky z-10! bg-white dark:bg-[#0d1117] dark:text-[#E6EDF3] border-r`}
                      style={{ width: 49.5, minWidth: 49.5, maxWidth: 49.5, left: getPinnedLeft('number'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                      {index + 1}
                    </td>

                    <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-start z-10! bg-white dark:bg-[#0d1117] ${tablePin.prefix ? 'sticky' : ''}`}
                      style={{ width: 100, minWidth: 100, maxWidth: 100, left: getPinnedLeft('prefix'), boxShadow: tablePin.prefix ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.prefix}
                    </td>

                    <td className={`p-3 text-[13px] font-semibold text-slate-700 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-start z-10! bg-white dark:bg-[#0d1117] ${tablePin.project ? 'sticky' : ''}`}
                      style={{ width: 180, minWidth: 180, maxWidth: 180, left: getPinnedLeft('project'), boxShadow: tablePin.project ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.project}
                    </td>

                    <td className={`p-3 text-[13px] font-semibold text-slate-700 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-start z-10! bg-white dark:bg-[#0d1117] ${tablePin.title ? 'sticky' : ''}`}
                      style={{ width: 180, minWidth: 180, maxWidth: 180, left: getPinnedLeft('title'), boxShadow: tablePin.title ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.title}
                    </td>

                    <td className={`p-3 text-[13px] font-semibold text-slate-700 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-start z-10! bg-white dark:bg-[#0d1117] ${tablePin.assignee ? 'sticky' : ''}`}
                      style={{ width: 250, minWidth: 250, maxWidth: 250, left: getPinnedLeft('assignee'), boxShadow: tablePin.assignee ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.assignee}
                    </td>

                    <td className={`p-3 text-[13px] font-semibold text-slate-700 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-start z-10! bg-white dark:bg-[#0d1117] ${tablePin.created_by ? 'sticky' : ''}`}
                      style={{ width: 250, minWidth: 250, maxWidth: 250, left: getPinnedLeft('created_by'), boxShadow: tablePin.created_by ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.created_by}
                    </td>

                    <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-center z-10! bg-white dark:bg-[#0d1117] ${tablePin.priority ? 'sticky' : ''}`}
                      style={{ width: 140, minWidth: 140, maxWidth: 140, left: getPinnedLeft('priority'), boxShadow: tablePin.priority ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {priority_type.find((s) => s?.value === item?.priority)?.label}
                    </td>

                    <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-center z-10! bg-white dark:bg-[#0d1117] ${tablePin.status ? 'sticky' : ''}`}
                      style={{ width: 120, minWidth: 120, maxWidth: 120, left: getPinnedLeft('status'), boxShadow: tablePin.status ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {status[item?.status]}
                    </td>

                    <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-center z-10! bg-white dark:bg-[#0d1117] ${tablePin.type ? 'sticky' : ''}`}
                      style={{ width: 140, minWidth: 140, maxWidth: 140, left: getPinnedLeft('type'), boxShadow: tablePin.type ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {type.find((s) => s?.value === item?.type)?.label}
                    </td>

                    <td className={`p-3 text-[13px] font-bold text-slate-900 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-end z-10! bg-white dark:bg-[#0d1117] ${tablePin.task_price ? 'sticky' : ''}`}
                      style={{ width: 150, minWidth: 150, maxWidth: 150, left: getPinnedLeft('task_price'), boxShadow: tablePin.task_price ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.task_price ? formatNum(item.task_price) : ''}
                    </td>

                    <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-end z-10! bg-white dark:bg-[#0d1117] ${tablePin.penalty_percentage ? 'sticky' : ''}`}
                      style={{ width: 150, minWidth: 150, maxWidth: 150, left: getPinnedLeft('penalty_percentage'), boxShadow: tablePin.penalty_percentage ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.penalty_percentage && item?.penalty_percentage != 0 ? Number(item.penalty_percentage) : ''}
                    </td>

                    <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-center z-10! bg-white dark:bg-[#0d1117] ${tablePin.deadline ? 'sticky' : ''}`}
                      style={{ width: 150, minWidth: 150, maxWidth: 150, right: getPinnedRight('deadline'), boxShadow: tablePin.deadline ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.deadline ? dayjs(item.deadline).format('DD.MM.YYYY HH:mm') : ""}
                    </td>

                    <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-center z-10! bg-white dark:bg-[#0d1117] ${tablePin.created_at ? 'sticky' : ''}`}
                      style={{ width: 150, minWidth: 150, maxWidth: 150, right: getPinnedRight('created_at'), boxShadow: tablePin.created_at ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : ""}
                    </td>

                    <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-center z-10! bg-white dark:bg-[#0d1117] ${tablePin.sprint ? 'sticky' : ''}`}
                      style={{ width: 150, minWidth: 150, maxWidth: 150, right: getPinnedRight('sprint'), boxShadow: tablePin.sprint ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.sprint}
                    </td>

                    <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-end z-10! bg-white dark:bg-[#0d1117] ${tablePin.position ? 'sticky' : ''}`}
                      style={{ width: 150, minWidth: 150, maxWidth: 150, right: getPinnedRight('position'), boxShadow: tablePin.position ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.position ? item.position.split(',').map(p => p.trim()).join(', ') : ''}
                    </td>

                    <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-center z-10! bg-white dark:bg-[#0d1117] ${tablePin.reopened_count ? 'sticky' : ''}`}
                      style={{ width: 150, minWidth: 150, maxWidth: 150, right: getPinnedRight('reopened_count'), boxShadow: tablePin.reopened_count ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.reopened_count || ''}
                    </td>

                    <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-start z-10! bg-white dark:bg-[#0d1117] ${tablePin.rejection_reason ? 'sticky' : ''}`}
                      style={{ width: 150, minWidth: 150, maxWidth: 150, right: getPinnedRight('rejection_reason'), boxShadow: tablePin.rejection_reason ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.rejection_reason}
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

      {selectSubmitter && (
        <EmployeeStep
          selectedList={filters.assignee ? filters.assignee.split(',') : []}
          title="Topshiruvchi tanlang"
          employee_role='all'
          onConfirm={handleSelectEmployeeConfirm}
          onClose={() => setSelectSubmitter(false)}
        />
      )}

      {selectAuthor && (
        <EmployeeStep
          selectedList={filters.created_by ? filters.created_by.split(',') : []}
          onConfirm={handleSelectAccountantConfirm}
          title="Muallif tanlang"
          param={{ roles: 'admin,manager,employee' }}
          onClose={() => setSelectAuthor(false)}
        />
      )}

      {selectProject && (
        <ProjectsStep
          selectedList={filters.project ? filters.project.split(',') : []}
          onConfirm={handleSelectProjectConfirm}
          onClose={() => setSelectProject(false)}
        />
      )}

    </div >
  )
}

export default Employee