import { useEffect, useRef, useState } from 'react'
import { usePageAction } from '../../../context/PageActionContext'
import { LuFilter } from 'react-icons/lu'
import { FaAngleDown } from 'react-icons/fa'
import { FaRegFile, FaXmark } from 'react-icons/fa6'
import { DatePicker, ConfigProvider, theme, Checkbox } from 'antd'
import { useTheme } from '../../../context/ThemeContext'
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
import { FiCalendar } from 'react-icons/fi'
import { IoCloseCircle } from 'react-icons/io5'

const monthStart = dayjs().startOf('month').hour(0).minute(0).second(0).millisecond(0)
const monthEnd = dayjs().endOf('month').hour(23).minute(59).second(0).millisecond(0)

const tableStatuses = {
  planning: "Rejalashtirilmoqda",
  active: "Faol",
  overdue: "Muddati o'tgan",
  completed: "Yakunlangan",
  cancelled: "Bekor qilingan"
}

const initialFilters = {
  deadline_min: monthStart,
  deadline_max: monthEnd,
  employees: '',
  testers: '',
  manager: '',
  price_max: '',
  price_min: '',
  created_by: ''
}

const MAIN_COLUMNS = [
  { key: 'prefix', label: 'Titul', width: 100 },
  { key: 'title', label: 'Nomi', width: 200 },
  { key: 'description', label: "Ta'rifi", width: 250 },
  { key: 'deadline', label: 'Muddati', width: 180 },
  { key: 'status', label: 'Holati', width: 120 },
  { key: 'project_price', label: 'Boshqaruvchi bonusi (UZS)', width: 220 },
  { key: 'created_by_name', label: 'Muallif', width: 220 },
  { key: 'manager_name', label: 'Boshqaruvchi', width: 220 },
  { key: 'employees_names', label: 'Xodimlar', width: 220 },
  { key: 'testers_names', label: 'Sinovchilar', width: 220 },
]

const GROUP_TASKS = { key: 'tasks', label: 'Vazifalar', colSpan: 8, subWidth: 140 }
const GROUPS = [GROUP_TASKS]

const GROUP_SUBS = {
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
}

const Employee = () => {
  const { isDark } = useTheme()
  const { setDownload, setPrint, clearDownload, clearPrint } = usePageAction()
  const [search, setSearch] = useState(null)
  const [filterModal, setFilterModal] = useState(false)
  const [filters, setFilters] = useState(initialFilters)

  const [selectUser, setSelectUser] = useState(false)
  const [selectTester, setSelectTester] = useState(false)
  const [selectManager, setSelectManager] = useState(false)
  const [selectAuthor, setSelectAuthor] = useState(false)

  const [UserReports, setUserReports] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [ReportsNextURL, setReportsNextURL] = useState(null)
  const filterRef = useRef(null)
  const filterButtonRef = useRef(null)
  const [tablePin, setTablePin] = useState({
    prefix: false,
    title: false,
  })

  const handlePin = (key, value) => {
    setTablePin(prev => {
      const next = { ...prev, [key]: value }
      if (GROUP_SUBS[key]) {
        GROUP_SUBS[key].forEach(sub => { next[sub.key] = value })
      }
      return next
    })
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

  const getSubPinnedLeft = (subKey) => {
    if (!tablePin[subKey]) return undefined
    let offset = 0
    for (const col of MAIN_COLUMNS) {
      if (tablePin[col.key]) offset += col.width
    }
    for (const group of GROUPS) {
      const subs = GROUP_SUBS[group.key]
      for (const sub of subs) {
        if (sub.key === subKey) return offset
        if (tablePin[sub.key]) offset += group.subWidth
      }
    }
    return undefined
  }

  const getSubPinnedRight = (subKey) => {
    if (!tablePin[subKey]) return undefined
    let offset = 0
    // Only 'tasks' group is at the end (right side)
    const subs = GROUP_SUBS.tasks
    const idx = subs.findIndex(s => s.key === subKey)
    if (idx === -1) return undefined

    for (let i = subs.length - 1; i > idx; i--) {
      if (tablePin[subs[i].key]) offset += 140
    }
    return offset
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
      const { data } = await axiosAPI.get(`reports/projects/`, { params: { ...params, search } })
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

  const handleExcelDownload = async () => {
    if (!UserReports || UserReports.length === 0) {
      toast.info('Yuklab olish uchun ma\'lumot yo\'q');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Loyiha hisoboti');

    worksheet.columns = [
      { header: '№', key: 'id', width: 5 },
      { header: 'Titul', key: 'prefix', width: 15 },
      { header: 'Nomi', key: 'title', width: 30 },
      { header: "Ta'rifi", key: 'description', width: 40 },
      { header: 'Muddati', key: 'deadline', width: 20 },
      { header: 'Holati', key: 'status', width: 15 },
      { header: 'Boshqaruvchi bonusi', key: 'project_price', width: 20 },
      { header: 'Muallif', key: 'created_by_name', width: 25 },
      { header: 'Boshqaruvchi', key: 'manager_name', width: 25 },
      { header: 'Xodimlar', key: 'employees_names', width: 30 },
      { header: 'Sinovchilar', key: 'testers_names', width: 30 },
      { header: 'Jami', key: 'total', width: 10 },
      { header: 'Qilish kerak', key: 'todo', width: 15 },
      { header: 'Jarayonda', key: 'in_progress', width: 15 },
      { header: 'Muddati o\'tgan', key: 'overdue', width: 15 },
      { header: 'Bajarilgan', key: 'done', width: 15 },
      { header: 'Ishga tushurilgan', key: 'production', width: 20 },
      { header: 'Tekshirilgan', key: 'checked', width: 15 },
      { header: 'Rad etilgan', key: 'rejected', width: 15 },
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
    headerRow.height = 30;

    UserReports.forEach((item, index) => {
      const rowData = {
        id: index + 1,
        prefix: item?.prefix || '',
        title: item?.title || '',
        description: item?.description || '',
        deadline: item?.deadline ? dayjs(item.deadline).format('DD.MM.YYYY HH:mm') : '',
        status: tableStatuses[item?.status] || item?.status || '',
        project_price: item?.project_price || 0,
        created_by_name: item?.created_by_name || '',
        manager_name: item?.manager_name || '',
        employees_names: item?.employees_names || '',
        testers_names: item?.testers_names || '',
        total: item?.task_stats?.total || '',
        todo: item?.task_stats?.todo || '',
        in_progress: item?.task_stats?.in_progress || '',
        overdue: item?.task_stats?.overdue || '',
        done: item?.task_stats?.done || '',
        production: item?.task_stats?.production || '',
        checked: item?.task_stats?.checked || '',
        rejected: item?.task_stats?.rejected || '',
      };
      const row = worksheet.addRow(rowData);

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E6F2' } },
          left: { style: 'thin', color: { argb: 'FFE2E6F2' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E6F2' } },
          right: { style: 'thin', color: { argb: 'FFE2E6F2' } }
        };

        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        let fontColor = 'FF475569';
        let isBold = false;

        if (colNumber === 1) {
          fontColor = 'FF64748B';
        } else if (colNumber === 2 || colNumber === 3 || colNumber === 4) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          fontColor = 'FF334155';
          isBold = true;
        } else if (colNumber === 7) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          fontColor = 'FF0F172A';
          isBold = true;
          cell.numFmt = '#,##0.00';
        }

        cell.font = {
          color: { argb: fontColor },
          bold: isBold,
          size: 10
        };

        if (colNumber === 1 || colNumber === 2 || colNumber === 3) {
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
    saveAs(blob, `Loyiha_hisoboti_${dayjs().format('DD_MM_YYYY')}.xlsx`);
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
          { content: 'Titul', rowSpan: 2 },
          { content: 'Nomi', rowSpan: 2 },
          { content: 'Ta\'rifi', rowSpan: 2 },
          { content: 'Muddati', rowSpan: 2 },
          { content: 'Holati', rowSpan: 2 },
          { content: 'Boshqaruvchi bonusi', rowSpan: 2 },
          { content: 'Muallif', rowSpan: 2 },
          { content: 'Boshqaruvchi', rowSpan: 2 },
          { content: 'Xodimlar', rowSpan: 2 },
          { content: 'Sinovchilar', rowSpan: 2 },
          { content: 'Vazifalar', colSpan: 8, styles: { halign: 'center' } }
        ],
        [
          'Jami', 'Qilish kerak', 'Jarayonda', 'Muddati o\'tgan', 'Bajarilgan', 'Ish. tushurilgan', 'Tekshirilgan', 'Rad etilgan'
        ]
      ],
      body: UserReports.map((item, index) => [
        index + 1,
        item?.prefix || '-',
        item?.title || '-',
        item?.description || '-',
        item?.deadline ? dayjs(item.deadline).format('DD.MM.YYYY HH:mm') : '-',
        tableStatuses[item?.status] || item?.status || '-',
        formatNum(item?.project_price || 0),
        item?.created_by_name || '-',
        item?.manager_name || '-',
        item?.employees_names || '-',
        item?.testers_names || '-',
        item?.task_stats?.total || 0,
        item?.task_stats?.todo || 0,
        item?.task_stats?.in_progress || 0,
        item?.task_stats?.overdue || 0,
        item?.task_stats?.done || 0,
        item?.task_stats?.production || 0,
        item?.task_stats?.checked || 0,
        item?.task_stats?.rejected || 0,
      ]),
      headStyles: {
        fillColor: [113, 134, 237],
        textColor: [255, 255, 255],
        halign: 'center',
        valign: 'middle',
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7,
        lineColor: [226, 230, 242],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { halign: 'center', textColor: [100, 116, 139] },
        1: { halign: 'left', fontStyle: 'bold', textColor: [51, 65, 85] },
        2: { halign: 'left', fontStyle: 'bold', textColor: [51, 65, 85] },
        6: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
      },
      theme: 'grid',
      margin: { top: 15, left: 5, right: 5 },
      didDrawPage: function () {
        doc.setFontSize(14);
        doc.text('Loyiha hisoboti', 14, 10);
      }
    });

    doc.save(`Loyiha_hisoboti_${dayjs().format('DD_MM_YYYY')}.pdf`);
  }

  const handleCsvDownload = () => {
    if (!UserReports || UserReports.length === 0) {
      toast.info('Yuklab olish uchun ma\'lumot yo\'q');
      return;
    }

    const csvData = UserReports.map((item, index) => ({
      '№': index + 1,
      'Titul': item?.prefix || '-',
      'Nomi': item?.title || '-',
      'Ta\'rifi': item?.description || '-',
      'Muddati': item?.deadline ? dayjs(item.deadline).format('DD.MM.YYYY HH:mm') : '-',
      'Holati': tableStatuses[item?.status] || item?.status || '-',
      'Boshqaruvchi bonusi': item?.project_price || 0,
      'Muallif': item?.created_by_name || '-',
      'Boshqaruvchi': item?.manager_name || '-',
      'Xodimlar': item?.employees_names || '-',
      'Sinovchilar': item?.testers_names || '-',
      'Jami': item?.task_stats?.total || 0,
      'Qilish kerak': item?.task_stats?.todo || 0,
      'Jarayonda': item?.task_stats?.in_progress || 0,
      'Muddati o\'tgan': item?.task_stats?.overdue || 0,
      'Bajarilgan': item?.task_stats?.done || 0,
      'Ishga tushurilgan': item?.task_stats?.production || 0,
      'Tekshirilgan': item?.task_stats?.checked || 0,
      'Rad etilgan': item?.task_stats?.rejected || 0,
    }));

    const csvContent = "\uFEFF" + Papa.unparse(csvData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Loyiha_hisoboti_${dayjs().format('DD_MM_YYYY')}.csv`);
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
          <title>Loyiha hisoboti</title>
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
            .status-badge {
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 8px;
              font-weight: 700;
              display: inline-block;
              white-space: nowrap;
            }
            .status-planning { background-color: #e0f2fe; color: #0284c7; }
            .status-active { background-color: #dbeafe; color: #1e3a8a; }
            .status-completed { background-color: #dcfce7; color: #16a34a; }
            .status-overdue { background-color: #fee2e2; color: #dc2626; }
            .status-cancelled { background-color: #f3f4f6; color: #4b5563; }
          </style>
        </head>
        <body>
          <h2>Loyiha hisoboti</h2>
          <table>
            <thead>
              <tr>
                <th rowspan="2">№</th>
                <th rowspan="2">Titul</th>
                <th rowspan="2">Nomi</th>
                <th rowspan="2">Ta'rifi</th>
                <th rowspan="2">Muddati</th>
                <th rowspan="2">Holati</th>
                <th rowspan="2">Boshqaruvchi bonusi</th>
                <th rowspan="2">Muallif</th>
                <th rowspan="2">Boshqaruvchi</th>
                <th rowspan="2">Xodimlar</th>
                <th rowspan="2">Sinovchilar</th>
                <th colspan="8">Vazifalar</th>
              </tr>
              <tr>
                <th>Jami</th>
                <th>Qilish kerak</th>
                <th>Jarayonda</th>
                <th>Muddati o'tgan</th>
                <th>Bajarilgan</th>
                <th>Ishga tushurilgan</th>
                <th>Tekshirilgan</th>
                <th>Rad etilgan</th>
              </tr>
            </thead>
            <tbody>
              ${UserReports.map((item, index) => `
                <tr>
                  <td class="center">${index + 1}</td>
                  <td class="center">${item?.prefix || '-'}</td>
                  <td class="bold">${item?.title || '-'}</td>
                  <td>${item?.description || '-'}</td>
                  <td class="center">${item?.deadline ? dayjs(item.deadline).format('DD.MM.YYYY HH:mm') : '-'}</td>
                  <td class="center">
                      ${tableStatuses[item?.status] || item?.status || '-'}
                  </td>
                  <td class="number">${item?.project_price ? formatNum(item.project_price) : '0'}</td>
                  <td>${item?.created_by_name || '-'}</td>
                  <td>${item?.manager_name || '-'}</td>
                  <td>${item?.employees_names || '-'}</td>
                  <td>${item?.testers_names || '-'}</td>
                  <td class="center bold">${item?.task_stats?.total || '0'}</td>
                  <td class="center">${item?.task_stats?.todo || '0'}</td>
                  <td class="center">${item?.task_stats?.in_progress || '0'}</td>
                  <td class="center">${item?.task_stats?.overdue || '0'}</td>
                  <td class="center">${item?.task_stats?.done || '0'}</td>
                  <td class="center">${item?.task_stats?.production || '0'}</td>
                  <td class="center">${item?.task_stats?.checked || '0'}</td>
                  <td class="center">${item?.task_stats?.rejected || '0'}</td>
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
    if (key === 'deadline_min' || key === 'deadline_max') {
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
      deadline_min: null,
      deadline_max: null
    })
    setSearch('')
    setFilterModal(false)
    getEmployeeReports({ params: {} })
    setHasFetched(false)
    setUserReports([])
  }

  const handleSelectUserConfirm = (selected) => {
    setFilters(prev => ({ ...prev, employees: selected.join(',') }))
    setSelectUser(false)
  }

  const handleSelectTesterConfirm = (selected) => {
    setFilters(prev => ({ ...prev, testers: selected.join(',') }))
    setSelectTester(false)
  }

  const handleSelectManagerConfirm = (selected) => {
    setFilters(prev => ({ ...prev, manager: selected.join(',') }))
    setSelectManager(false)
  }

  const handleSelectAuthorConfirm = (selected) => {
    setFilters(prev => ({ ...prev, created_by: selected.join(',') }))
    setSelectAuthor(false)
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
              className="pl-8 pr-3 outline-none bg-slate-100 border border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-soft)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)]"
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
            className={`flex items-center justify-between gap-2 h-8 px-5 pr-3! bg-slate-100 dark:bg-[var(--bg-elevation-1)] dark:text-[var(--text-strong)]! rounded-xl text-slate-600 text-sm font-semibold cursor-pointer relative border border-slate-200 dark:border-[var(--stroke-soft)] ${showClearButton ? 'filter-notif' : ''}`}
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
          <FaRegFile size={15} />
          Shakllantirish
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
              colorTextPlaceholder: isDark ? '#90a1b9' : '#62748e'
            },
            components: {
              Select: {
                selectorBg: isDark ? '#222323' : '#ffffff',
                optionSelectedBg: isDark ? '#303131' : '#F1F3F9',
                optionActiveBg: isDark ? '#222323' : 'var(--bg-elevation-1)',
              }
            }
          }}
        >
          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-4 mb-3">
            <div className="col-span-4 lg:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Muddati</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative flex-1">
                  <DatePicker
                    inputReadOnly
                    format="DD.MM.YYYY HH:mm"
                    value={filters.deadline_min}
                    onChange={(value) => handleFilterChange('deadline_min', value)}
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
                    value={filters.deadline_max}
                    format="DD.MM.YYYY HH:mm"
                    onChange={(value) => handleFilterChange('deadline_max', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[var(--stroke-soft)]! rounded-xl! text-sm dark:text-[var(--text-strong)]! dark:bg-[var(--bg-elevation-1)]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                    placeholder='Tugash sana'
                    suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[var(--text-soft)]" />}
                    allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[var(--text-soft)]" /> }}
                  />
                </div>
              </div>
            </div>

            <div className="col-span-4 lg:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Boshqaruvchi bonusi</label>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <FilterInput
                    label="dan"
                    className='bg-[var(--bg-elevation-1-alt)]'
                    value={filters.price_min}
                    onChange={(e) => handleFilterChange('price_min', formatNum(e.target.value))}
                  />
                </div>

                <div className="relative">
                  <FilterInput
                    label="gacha"
                    className='bg-[var(--bg-elevation-1-alt)]'
                    value={filters.price_max}
                    onChange={(e) => handleFilterChange('price_max', formatNum(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-4 mb-3">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Muallif</label>
              <button
                type="button"
                onClick={() => setSelectAuthor(true)}
                className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[var(--bg-elevation-1)] border border-slate-200 dark:border-[var(--stroke-soft)] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d] cursor-pointer ${filters?.created_by?.length > 0 ? 'filter-notif' : ''}`}
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
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Boshqaruvchi</label>
              <button
                type="button"
                onClick={() => setSelectManager(true)}
                className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[var(--bg-elevation-1)] border border-slate-200 dark:border-[var(--stroke-soft)] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d] cursor-pointer ${filters?.manager?.length > 0 ? 'filter-notif' : ''}`}
              >
                <span className="truncate text-sm font-medium">
                  {filters.manager ? `${filters.manager.split(',').filter(Boolean).length} ta boshqaruvchi` : 'Boshqaruvchi tanlang'}
                </span>
                <div className="flex items-center gap-2">
                  <PiUsersThreeBold size={18} />

                  {filters.manager && (
                    <FaXmark
                      size={18}
                      className="text-red-500"
                      onClick={(e) => { e.stopPropagation(); handleFilterChange('manager', '') }}
                    />
                  )}
                </div>
              </button>
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Xodimlar</label>
              <button
                type="button"
                onClick={() => setSelectUser(true)}
                className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[var(--bg-elevation-1)] border border-slate-200 dark:border-[var(--stroke-soft)] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d] cursor-pointer ${filters?.employees?.length > 0 ? 'filter-notif' : ''}`}
              >
                <span className="truncate text-sm font-medium">
                  {filters.employees ? `${filters.employees.split(',').filter(Boolean).length} ta xodim` : 'Xodimlar tanlang'}
                </span>
                <div className="flex items-center gap-2">
                  <PiUsersThreeBold size={18} />

                  {filters.employees && (
                    <FaXmark
                      size={18}
                      className="text-red-500"
                      onClick={(e) => { e.stopPropagation(); handleFilterChange('employees', '') }}
                    />
                  )}
                </div>
              </button>
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Sinovchilar</label>
              <button
                type="button"
                onClick={() => setSelectTester(true)}
                className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[var(--bg-elevation-1)] border border-slate-200 dark:border-[var(--stroke-soft)] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d] cursor-pointer ${filters?.testers?.length > 0 ? 'filter-notif' : ''}`}
              >
                <span className="truncate text-sm font-medium">
                  {filters.testers ? `${filters.testers.split(',').filter(Boolean).length} ta sinovchi` : 'Sinovchilar tanlang'}
                </span>
                <div className="flex items-center gap-2">
                  <PiUsersThreeBold size={18} />

                  {filters.testers && (
                    <FaXmark
                      size={18}
                      className="text-red-500"
                      onClick={(e) => { e.stopPropagation(); handleFilterChange('testers', '') }}
                    />
                  )}
                </div>
              </button>
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
            <table className="text-left border-collapse w-full min-w-[2800px]">
              <thead className="bg-[#7186ED] text-white sticky top-0 z-20! dark:bg-[var(--bg-elevation-1)]">
                <tr>
                  <th rowSpan={2} className="py-2 px-3 text-xs border-r bg-[#7186ED] dark:bg-[#1e2021]! font-bold border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-center" >№</th>
                  {MAIN_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      rowSpan={2}
                      className={`p-3 text-xs bg-[#7186ED] dark:bg-[#1e2021] font-bold border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] transition-all duration-300 ${tablePin[col.key] ? 'sticky z-50!' : 'z-20!'}`}
                      style={{
                        width: col.width,
                        minWidth: col.width,
                        maxWidth: col.width,
                        left: getPinnedLeft(col.key),
                        boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 #CBD5E1',
                        textAlign: col.key === 'number' ? 'center' : (col.key === 'title' || col.key === 'description' || col.key === 'project_price' || col.key === 'created_by_name' || col.key === 'manager_name' || col.key === 'employees_names') ? 'end' : (col.key === 'prefix' ? 'start' : 'center')
                      }}
                    >
                      <div className={`flex items-center gap-2 ${col.key === 'number' ? 'justify-center' : (col.key === 'prefix' ? 'justify-start' : 'justify-end')}`}>
                        <Checkbox
                          checked={tablePin[col.key]}
                          onChange={(e) => handlePin(col.key, e.target.checked)}
                          className="custom-header-checkbox"
                        />
                        {col.label}
                      </div>
                    </th>
                  ))}
                  <th colSpan={8} className={`p-2 text-xs font-bold border-b border-[var(--stroke-sub)] bg-[#7186ED] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] transition-all duration-300 ${tablePin.tasks ? 'sticky z-50!' : 'z-20!'}`} style={{ left: getPinnedLeft('tasks'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center justify-center gap-2">
                      <Checkbox
                        checked={tablePin.tasks}
                        onChange={(e) => handlePin('tasks', e.target.checked)}
                        className="custom-header-checkbox"
                      />
                      Vazifalar
                    </div>
                  </th>
                </tr>
                <tr className="bg-[#7186ED] dark:bg-[var(--bg-elevation-1)] text-[10px] text-center">
                  {GROUP_SUBS.tasks.map((sub) => (
                    <th
                      key={sub.key}
                      className={`p-2 bg-[#7186ED] dark:bg-[var(--bg-elevation-1)] transition-all duration-300 ${tablePin[sub.key] ? 'sticky z-50!' : ''}`}
                      style={{
                        width: 140,
                        minWidth: 140,
                        maxWidth: 140,
                        left: getSubPinnedLeft(sub.key),
                        boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)'
                      }}
                    >
                      <div className="flex items-center gap-0.5 justify-center">
                        <Checkbox
                          checked={!!tablePin[sub.key]}
                          onChange={(e) => handlePin(sub.key, e.target.checked)}
                          className="custom-header-checkbox scale-75"
                        />
                        {sub.label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] dark:text-slate-300">
                {UserReports.map((item, index) => (
                  <tr className="border-b border-slate-100 dark:border-[var(--stroke-soft)] hover:bg-slate-50 dark:hover:bg-[var(--bg-elevation-1-alt)] transition-colors" key={item.id || index}>
                    <td className={`p-3 text-xs text-slate-500 border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-center z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] transition-all duration-300 border-r`}>
                      {index + 1}
                    </td>
                    <td className={`p-3 text-xs text-slate-600 dark:text-slate-400 border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-start z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] transition-all duration-300 ${tablePin.prefix ? 'sticky' : ''}`}
                      style={{ width: 100, left: getPinnedLeft('prefix'), boxShadow: tablePin.prefix ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.prefix}
                    </td>
                    <td className={`p-3 text-xs font-semibold text-end text-slate-700 dark:text-slate-200 border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] transition-all duration-300 ${tablePin.title ? 'sticky' : ''}`}
                      style={{ width: 200, left: getPinnedLeft('title'), boxShadow: tablePin.title ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.title}
                    </td>
                    <td className={`p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-end z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] transition-all duration-300 ${tablePin.description ? 'sticky' : ''}`}
                      style={{ width: 250, left: getPinnedLeft('description'), boxShadow: tablePin.description ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.description}
                    </td>
                    <td className={`p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-center z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] transition-all duration-300 ${tablePin.deadline ? 'sticky' : ''}`}
                      style={{ width: 180, left: getPinnedLeft('deadline'), boxShadow: tablePin.deadline ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.deadline ? dayjs(item.deadline).format('DD.MM.YYYY HH:mm') : ''}
                    </td>
                    <td className={`p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-center z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] transition-all duration-300 ${tablePin.status ? 'sticky' : ''}`}
                      style={{ width: 120, left: getPinnedLeft('status'), boxShadow: tablePin.status ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {tableStatuses[item?.status]}
                    </td>
                    <td className={`p-3 text-xs font-bold text-slate-900 dark:text-[var(--text-strong)] border-r border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-end z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] transition-all duration-300 ${tablePin.project_price ? 'sticky' : ''}`}
                      style={{ width: 220, left: getPinnedLeft('project_price'), boxShadow: tablePin.project_price ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.project_price ? formatNum(item.project_price) : ''}
                    </td>
                    <td className={`p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-end z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] transition-all duration-300 ${tablePin.created_by_name ? 'sticky' : ''}`}
                      style={{ width: 220, left: getPinnedLeft('created_by_name'), boxShadow: tablePin.created_by_name ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.created_by_name}
                    </td>
                    <td className={`p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-end z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] transition-all duration-300 ${tablePin.manager_name ? 'sticky' : ''}`}
                      style={{ width: 220, left: getPinnedLeft('manager_name'), boxShadow: tablePin.manager_name ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.manager_name}
                    </td>
                    <td className={`p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-end z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] transition-all duration-300 ${tablePin.employees_names ? 'sticky' : ''}`}
                      style={{ width: 220, left: getPinnedLeft('employees_names'), boxShadow: tablePin.employees_names ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.employees_names}
                    </td>
                    <td className={`p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-center z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] transition-all duration-300 ${tablePin.testers_names ? 'sticky' : ''}`}
                      style={{ width: 220, left: getPinnedLeft('testers_names'), boxShadow: tablePin.testers_names ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.testers_names}
                    </td>

                    <td className={`p-3 text-xs font-bold text-slate-700 dark:text-slate-300 border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-center transition-all duration-300 ${tablePin.tasks_jami ? 'sticky z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)]' : ''}`} style={{ width: 140, left: getSubPinnedLeft('tasks_jami'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.task_stats?.total || ''}</td>
                    <td className={`p-3 text-xs font-bold text-slate-700 dark:text-slate-300 border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-center transition-all duration-300 ${tablePin.tasks_qilish ? 'sticky z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)]' : ''}`} style={{ width: 140, left: getSubPinnedLeft('tasks_qilish'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.task_stats?.todo || ''}</td>
                    <td className={`p-3 text-xs font-bold text-slate-700 dark:text-slate-300 border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-center transition-all duration-300 ${tablePin.tasks_jarayonda ? 'sticky z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)]' : ''}`} style={{ width: 140, left: getSubPinnedLeft('tasks_jarayonda'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.task_stats?.in_progress || ''}</td>
                    <td className={`p-3 text-xs font-bold text-slate-700 dark:text-slate-300 border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-center transition-all duration-300 ${tablePin.tasks_muddati ? 'sticky z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)]' : ''}`} style={{ width: 140, left: getSubPinnedLeft('tasks_muddati'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.task_stats?.overdue || ''}</td>
                    <td className={`p-3 text-xs font-bold text-slate-700 dark:text-slate-300 border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-center transition-all duration-300 ${tablePin.tasks_bajarilgan ? 'sticky z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)]' : ''}`} style={{ width: 140, left: getSubPinnedLeft('tasks_bajarilgan'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.task_stats?.done || ''}</td>
                    <td className={`p-3 text-xs font-bold text-slate-700 dark:text-slate-300 border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-center transition-all duration-300 ${tablePin.tasks_ishga ? 'sticky z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)]' : ''}`} style={{ width: 140, left: getSubPinnedLeft('tasks_ishga'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.task_stats?.production || ''}</td>
                    <td className={`p-3 text-xs font-bold text-slate-700 dark:text-slate-300 border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-center transition-all duration-300 ${tablePin.tasks_tekshirilgan ? 'sticky z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)]' : ''}`} style={{ width: 140, left: getSubPinnedLeft('tasks_tekshirilgan'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.task_stats?.checked || ''}</td>
                    <td className={`p-3 text-xs font-bold text-slate-700 dark:text-slate-300 border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] text-center transition-all duration-300 ${tablePin.tasks_rad ? 'sticky z-10! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)]' : ''}`} style={{ width: 140, right: getSubPinnedLeft('tasks_rad'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>{item?.task_stats?.rejected || ''}</td>
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
      `}</style>

      {selectUser && (
        <EmployeeStep
          selectedList={filters.employees ? filters.employees.split(',') : []}
          onConfirm={handleSelectUserConfirm}
          title="Xodimlar tanlang"
          employee_role="employee"
          onClose={() => setSelectUser(false)}
        />
      )}

      {selectManager && (
        <EmployeeStep
          selectedList={filters.manager ? filters.manager.split(',') : []}
          onConfirm={handleSelectManagerConfirm}
          title="Boshqaruvchi tanlang"
          param={{ roles: "manager" }}
          onClose={() => setSelectManager(false)}
        />
      )}

      {selectAuthor && (
        <EmployeeStep
          selectedList={filters.created_by ? filters.created_by.split(',') : []}
          onConfirm={handleSelectAuthorConfirm}
          title="Muallif tanlang"
          param={{ roles: "admin" }}
          onClose={() => setSelectAuthor(false)}
        />
      )}

      {selectTester && (
        <EmployeeStep
          selectedList={filters.testers ? filters.testers.split(',') : []}
          employee_role="tester"
          title="Sinovchilar tanlang"
          onConfirm={handleSelectTesterConfirm}
          onClose={() => setSelectTester(false)}
        />
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

    </div >
  )
}

export default Employee

const customSelectStyles = `
      .custom-antd-select .ant-select-selector {
        border - radius: 12px !important;
      border-color: #e2e8f0 !important;
      height: 44px !important;
      display: flex !important;
      align-items: center !important;
      background: transparent !important;
      box-shadow: none !important;
      outline: none !important;
  }
      .custom-antd-select.ant-select-focused .ant-select-selector {
        border - color: #e2e8f0 !important;
      box-shadow: none !important;
  }
      .dark .custom-antd-select .ant-select-selector {
        border - color: #292A2A !important;
      background: #222323 !important;
      color: white !important;
  }
      .dark .custom-antd-select.ant-select-focused .ant-select-selector {
        border - color: #292A2A !important;
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
        background - color: #1C1D1D !important;
      border: 1px solid #292A2A !important;
  }
      .dark .ant-select-item {
        color: white !important;
  }
      .dark .ant-select-item-option-active {
        background - color: #222323 !important;
  }
      .dark .ant-select-item-option-selected {
        background - color: #303131 !important;
  }
      `

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.innerHTML = customSelectStyles
  document.head.appendChild(style)
}