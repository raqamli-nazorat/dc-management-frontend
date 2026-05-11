import { useEffect, useRef, useState } from 'react'
import { usePageAction } from '../../../context/PageActionContext'
import { LuRefreshCw } from 'react-icons/lu'
import { FaAngleDown } from 'react-icons/fa'
import { FaRegFile, FaXmark } from 'react-icons/fa6'
import { DatePicker, ConfigProvider, theme, Checkbox } from 'antd'
import { useTheme } from '../../../context/ThemeContext'

const MAIN_COLUMNS = [
  { key: 'number', label: '№', width: 64 },
  { key: 'user', label: 'Ism Sharifi', width: 213.5 },
  { key: 'month', label: 'Oy', width: 142.5 },
  { key: 'fixed_salary', label: 'Oylik maosh', width: 199 },
  { key: 'kpi_bonus', label: 'KPI bonus', width: 199 },
  { key: 'penalty_amount', label: 'Jarima miqdori', width: 199.5 },
  { key: 'total_amount', label: 'Jami miqdori', width: 199.5 },
  { key: 'status', label: 'Holati', width: 120 },
  { key: 'created_at', label: 'Hisoblangan vaqti', width: 140 },
  { key: 'confirmed_at', label: 'Tasdiqlangan vaqti', width: 199 },
  { key: 'accountant', label: 'Hisobchi', width: 213.5 },
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
import { FiCalendar } from 'react-icons/fi'
import { IoCloseCircle } from 'react-icons/io5'

const status_type = [
  { label: "Hisoblangan", value: false },
  { label: "Tasdiqlangan", value: true },
]

const monthStart = dayjs().startOf('month').hour(0).minute(0).second(0).millisecond(0)
const monthEnd = dayjs().endOf('month').hour(23).minute(59).second(0).millisecond(0)

const months = [
  { label: "Yanvar", value: 1 },
  { label: "Fevral", value: 2 },
  { label: "Mart", value: 3 },
  { label: "Aprel", value: 4 },
  { label: "May", value: 5 },
  { label: "Iyun", value: 6 },
  { label: "Iyul", value: 7 },
  { label: "Avgust", value: 8 },
  { label: "Sentabr", value: 9 },
  { label: "Oktabr", value: 10 },
  { label: "Noyabr", value: 11 },
  { label: "Dekabr", value: 12 },
]

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

const Salary = () => {
  const { isDark } = useTheme()
  const { setDownload, setPrint, clearDownload, clearPrint } = usePageAction()
  const [search, setSearch] = useState(null)
  const [filterModal, setFilterModal] = useState(false)
  const [filters, setFilters] = useState(initialFilters)
  const [selectEmployee, setSelectEmployee] = useState(false)
  const [selectAccountant, setSelectAccountant] = useState(false)
  const [UserReports, setUserReports] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [ReportsNextURL, setReportsNextURL] = useState(null)
  const filterRef = useRef(null)
  const filterButtonRef = useRef(null)
  const RIGHT_PINNED_KEYS = ['created_at', 'confirmed_at', 'accountant'];
  const [tablePin, setTablePin] = useState({
    number: true,
    user: false,
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
      const { data } = await axiosAPI.get(`reports/payrolls/`, { params: { ...params, search } })
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
    const worksheet = workbook.addWorksheet('Ish haqi hisoboti');

    worksheet.columns = [
      { header: '№', key: 'id', width: 5 },
      { header: 'Ism Sharifi', key: 'name', width: 25 },
      { header: 'Oy', key: 'month', width: 15 },
      { header: 'Oylik maosh', key: 'salary', width: 20 },
      { header: 'KPI bonus', key: 'kpi', width: 20 },
      { header: 'Jarima miqdori', key: 'penalty', width: 20 },
      { header: 'Jami miqdori', key: 'total', width: 20 },
      { header: 'Holati', key: 'status', width: 15 },
      { header: 'Hisoblangan vaqti', key: 'created_at', width: 20 },
      { header: 'Tasdiqlangan vaqti', key: 'confirmed_at', width: 20 },
      { header: 'Hisobchi', key: 'accountant', width: 25 },
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
        name: item?.user || "-",
        month: item?.month ? dayjs(item.month).format('DD.MM.YYYY') : "-",
        salary: item?.fixed_salary || 0,
        kpi: item?.kpi_bonus || 0,
        penalty: item?.penalty_amount || 0,
        total: item?.total_amount || 0,
        status: item?.status || "-",
        created_at: item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : '-',
        confirmed_at: item?.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : '-',
        accountant: item?.accountant || "-"
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

        if (colNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          fontColor = 'FF64748B';
        } else if (colNumber === 2 || colNumber === 3) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          fontColor = 'FF334155';
          isBold = true;
        } else if ([4, 5, 7].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          fontColor = 'FF0F172A';
          isBold = true;
          cell.numFmt = '#,##0.00';
        } else if (colNumber === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          fontColor = 'FFEF4444';
          isBold = true;
          cell.numFmt = '#,##0.00';
        } else if ([8, 9, 10, 11].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          fontColor = 'FF475569';
        }

        cell.font = {
          color: { argb: fontColor },
          bold: isBold,
          size: 10
        };

        if (colNumber === 1 || colNumber === 2) {
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
    saveAs(blob, `Ish_haqi_hisoboti_${dayjs().format('DD_MM_YYYY')}.xlsx`);
  }

  const handlePdfDownload = () => {
    if (!UserReports || UserReports.length === 0) {
      toast.info('Yuklab olish uchun ma\'lumot yo\'q');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });

    autoTable(doc, {
      head: [['№', 'Ism Sharifi', 'Oy', 'Oylik maosh', 'KPI bonus', 'Jarima miqdori', 'Jami miqdori', 'Holati', 'Hisoblangan vaqti', 'Tasdiqlangan vaqti', 'Hisobchi']],
      body: UserReports.map((item, index) => [
        index + 1,
        item?.user || '-',
        item?.month ? dayjs(item.month).format('DD.MM.YYYY') : '-',
        formatNum(item?.fixed_salary || 0),
        formatNum(item?.kpi_bonus || 0),
        formatNum(item?.penalty_amount || 0),
        formatNum(item?.total_amount || 0),
        item?.status || '-',
        item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : '-',
        item?.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : '-',
        item?.accountant || '-'
      ]),
      headStyles: {
        fillColor: [113, 134, 237],
        textColor: [255, 255, 255],
        halign: 'center',
        valign: 'middle',
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        lineColor: [226, 230, 242],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { halign: 'center', textColor: [100, 116, 139] },
        1: { halign: 'left', fontStyle: 'bold', textColor: [51, 65, 85] },
        2: { halign: 'left', fontStyle: 'bold', textColor: [51, 65, 85] },
        3: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
        4: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
        5: { halign: 'right', fontStyle: 'bold', textColor: [239, 68, 68] },
        6: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
        7: { halign: 'center', textColor: [71, 85, 105] },
        8: { halign: 'center', textColor: [71, 85, 105] },
        9: { halign: 'center', textColor: [71, 85, 105] },
        10: { halign: 'center', textColor: [71, 85, 105] },
      },
      theme: 'grid',
      margin: { top: 15 },
      didDrawPage: function () {
        doc.setFontSize(14);
        doc.text('Ish haqi hisoboti', 14, 10);
      }
    });

    doc.save(`Ish_haqi_hisoboti_${dayjs().format('DD_MM_YYYY')}.pdf`);
  }

  const handleCsvDownload = () => {
    if (!UserReports || UserReports.length === 0) {
      toast.info('Yuklab olish uchun ma\'lumot yo\'q');
      return;
    }

    const csvData = UserReports.map((item, index) => ({
      '№': index + 1,
      'Ism Sharifi': item?.user || '-',
      'Oy': item?.month ? dayjs(item.month).format('DD.MM.YYYY') : '-',
      'Oylik maosh': item?.fixed_salary || 0,
      'KPI bonus': item?.kpi_bonus || 0,
      'Jarima miqdori': item?.penalty_amount || 0,
      'Jami miqdori': item?.total_amount || 0,
      'Holati': item?.status || '-',
      'Hisoblangan vaqti': item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : '-',
      'Tasdiqlangan vaqti': item?.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : '-',
      'Hisobchi': item?.accountant || '-'
    }));

    const csvContent = "\uFEFF" + Papa.unparse(csvData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Ish_haqi_hisoboti_${dayjs().format('DD_MM_YYYY')}.csv`);
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
          <title>Ish haqi hisoboti</title>
          <style>
            @page { 
              size: landscape; 
              margin: 5mm; 
            }
            body { 
              font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              font-size: 9px; 
              color: var(--text-strong);
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            h2 { 
              text-align: center; 
              margin-bottom: 20px; 
              font-size: 18px;
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
              padding: 6px 8px; 
              text-align: left;
            }
            th { 
              background-color: #7186ED; 
              font-weight: bold; 
              color: white;
              text-align: center;
              text-transform: uppercase;
              font-size: 8px;
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
            .status-tasdiqlangan {
              background-color: #dcfce7;
              color: #16a34a;
            }
            .status-hisoblangan {
              background-color: #fef3c7;
              color: #d97706;
            }
          </style>
        </head>
        <body>
          <h2>Ish haqi hisoboti</h2>
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Ism Sharifi</th>
                <th>Oy</th>
                <th>Oylik maosh</th>
                <th>KPI bonus</th>
                <th>Jarima miqdori</th>
                <th>Jami miqdori</th>
                <th>Holati</th>
                <th>Hisoblangan vaqti</th>
                <th>Tasdiqlangan vaqti</th>
                <th>Hisobchi</th>
              </tr>
            </thead>
            <tbody>
              ${UserReports.map((item, index) => `
                <tr>
                  <td class="center">${index + 1}</td>
                  <td class="bold">${item?.user || '-'}</td>
                  <td class="center">${item?.month ? dayjs(item.month).format('MM.YYYY') : '-'}</td>
                  <td class="number">${item?.fixed_salary ? formatNum(item.fixed_salary) : '0'}</td>
                  <td class="number">${item?.kpi_bonus ? formatNum(item.kpi_bonus) : '0'}</td>
                  <td class="number" style="color: #ef4444;">${item?.penalty_amount ? formatNum(item.penalty_amount) : '0'}</td>
                  <td class="number">${item?.total_amount ? formatNum(item.total_amount) : '0'}</td>
                  <td class="center">                    
                      ${item?.status || '-'}
                  </td>
                  <td class="center">${item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : '-'}</td>
                  <td class="center">${item?.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : '-'}</td>
                  <td>${item?.accountant || '-'}</td>
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
    setFilters(prev => ({ ...prev, user: selected.join(',') }))
    setSelectEmployee(false)
  }

  const handleSelectAccountantConfirm = (selected) => {
    setFilters(prev => ({ ...prev, accountant: selected.join(',') }))
    setSelectAccountant(false)
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
            className={`flex items-center justify-between gap-2 h-8 px-5 pr-3! bg-slate-100 dark:bg-[var(--bg-elevation-1)] dark:text-[var(--text-strong)] rounded-xl text-slate-600 text-sm font-semibold cursor-pointer relative border border-slate-200 dark:border-[var(--stroke-soft)] ${showClearButton ? 'filter-notif' : ''}`}
          >
            <img src="/imgs/filterIcon.svg" alt="" className="w-4 h-3.5 [filter:brightness(0)_saturate(100%)_invert(38%)_sepia(10%)_saturate(500%)_hue-rotate(190deg)] dark:[filter:brightness(0)_saturate(100%)_invert(70%)_sepia(10%)_saturate(300%)_hue-rotate(190deg)]" />
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
              colorBgContainer: isDark ? '#0d1117' : '#ffffff',
              colorBgElevated: isDark ? '#0d1117' : '#ffffff',
            },
            components: {
              Select: {
                selectorBg: isDark ? '#0d1117' : '#ffffff',
                optionSelectedBg: isDark ? '#1f2937' : '#F1F3F9',
                optionActiveBg: isDark ? '#2d3748' : 'var(--bg-elevation-1)',
              }
            }
          }}
        >
          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-4 mb-3">
            <div className="col-span-4 lg:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">So'ralgan vaqt</label>
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

            <div className="col-span-4 lg:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Tasdiqlangan vaqt</label>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <DatePicker
                    inputReadOnly
                    value={filters.confirmed_at_min}
                    format="DD.MM.YYYY HH:mm"
                    onChange={(value) => handleFilterChange('confirmed_at_min', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[var(--stroke-soft)]! rounded-xl! text-sm dark:text-[var(--text-strong)]! dark:bg-[var(--bg-elevation-1)]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                    placeholder='Boshlanish sanasi'
                    suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[var(--text-soft)]" />}
                    allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[var(--text-soft)]" /> }}
                  />
                </div>

                <div className="relative">
                  <DatePicker
                    inputReadOnly
                    value={filters.confirmed_at_max}
                    format="DD.MM.YYYY HH:mm"
                    onChange={(value) => handleFilterChange('confirmed_at_max', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[var(--stroke-soft)]! rounded-xl! text-sm dark:text-[var(--text-strong)]! dark:bg-[var(--bg-elevation-1)]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                    placeholder='Tugash sanasi'
                    suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[var(--text-soft)]" />}
                    allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[var(--text-soft)]" /> }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-4 mb-3">
            <div className="col-span-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Xodimlar</label>
                  <button
                    type="button"
                    onClick={() => setSelectEmployee(true)}
                    className={`relative w-full h-12 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[var(--bg-elevation-1)] border border-slate-200 dark:border-[var(--stroke-soft)] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[var(--bg-elevation-2)]  cursor-pointer ${filters?.user?.length > 0 ? 'filter-notif' : ''}`}
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
                    className={`relative w-full h-12 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[var(--bg-elevation-1)] border border-slate-200 dark:border-[var(--stroke-soft)] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[var(--bg-elevation-2)]  cursor-pointer ${filters?.accountant?.length > 0 ? 'filter-notif' : ''}`}
                  >
                    <span className="truncate text-sm font-medium">
                      {filters.accountant ? `${filters.accountant.split(',').filter(Boolean).length} ta hisobchi` : 'Hisobchi tanlang'}
                    </span>
                    <div className="flex items-center gap-2">
                      <PiUsersThreeBold size={18} />

                      {filters.accountant && (
                        <FaXmark
                          size={18}
                          className="text-red-500"
                          onClick={(e) => { e.stopPropagation(); handleFilterChange('accountant', '') }}
                        />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="col-span-1">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Oy uchun</label>
              <FilterSelect
                padding='13.5px 12px'
                placeholder="Oy tanlang"
                options={months}
                value={filters.month}
                onChange={(value) => handleFilterChange('month', value)}
              />
            </div>

            <div className="col-span-1">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Holati</label>
              <FilterSelect
                padding='13.5px 12px'
                placeholder="Holatini tanlang"
                options={status_type}
                value={filters.is_confirmed}
                onChange={(value) => handleFilterChange('is_confirmed', value)}
              />
            </div>
          </div>

          {/* Row 3*/}
          <div className="grid grid-cols-8 gap-4">
            <div className="col-span-2 md:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Jami miqdori (UZS)</label>
              <div className='grid grid-cols-2 gap-3'>
                <FilterInput
                  label="dan"
                  className='bg-[var(--bg-base)]'
                  value={filters.total_amount_min}
                  onChange={(e) => handleFilterChange('total_amount_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  className='bg-[var(--bg-base)]'
                  value={filters.total_amount_max}
                  onChange={(e) => handleFilterChange('total_amount_max', formatNum(e.target.value))}
                />
              </div>
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Oylik maoshi (UZS)</label>
              <div className='grid grid-cols-2 gap-3'>
                <FilterInput
                  label="dan"
                  className='bg-[var(--bg-base)]'
                  value={filters.salary_min}
                  onChange={(e) => handleFilterChange('salary_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  className='bg-[var(--bg-base)]'
                  value={filters.salary_max}
                  onChange={(e) => handleFilterChange('salary_max', formatNum(e.target.value))}
                />
              </div>
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">KPI bonus (UZS)</label>
              <div className='grid grid-cols-2 gap-3'>
                <FilterInput
                  label="dan"
                  className='bg-[var(--bg-base)]'
                  value={filters.kpi_min}
                  onChange={(e) => handleFilterChange('kpi_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  className='bg-[var(--bg-base)]'
                  value={filters.kpi_max}
                  onChange={(e) => handleFilterChange('kpi_max', formatNum(e.target.value))}
                />
              </div>
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Jarima miqdori (UZS)</label>
              <div className='grid grid-cols-2 gap-3'>
                <FilterInput
                  label="dan"
                  className='bg-[var(--bg-base)]'
                  value={filters.penalty_min}
                  onChange={(e) => handleFilterChange('penalty_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  className='bg-[var(--bg-base)]'
                  value={filters.penalty_max}
                  onChange={(e) => handleFilterChange('penalty_max', formatNum(e.target.value))}
                />
              </div>
            </div>

          </div>
        </ConfigProvider>
      </div>

      {/* Table Section */}
      {
        isLoading ? (
          <div className="mt-6 rounded-2xl border flex flex-col justify-center items-center h-[74vh] border-slate-200 dark:border-[var(--stroke-soft)] bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] p-10 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ma'lumotlar shakllantirilmoqda...</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Iltimos, biroz kuting.</p>
          </div>
        ) : !hasFetched ? (
          <div className="mt-6 h-[74vh] flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-[var(--stroke-soft)] bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] p-10 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filtrlarni tanlang va Shakillantirish tugmasini bosing.</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Bu yerda ma'lumotlar ko'rsatiladi.</p>
          </div>
        ) : UserReports.length === 0 ? (
          <div className="mt-6 rounded-2xl flex flex-col justify-center items-center h-[74vh] border border-slate-200 dark:border-[var(--stroke-soft)] bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] p-10 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Natija topilmadi.</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Filtrlarni o'zgartirib qayta urinib ko'ring.</p>
          </div>
        ) : (
          <div
            className="mt-6 overflow-auto h-[74vh] border border-slate-200 dark:border-[var(--stroke-soft)]"
            onScroll={handleMoreReportsScroll}
          >
            <table className="text-left border-collapse w-[2000px]">
              <thead className="bg-[#7186ED] text-white sticky top-0 z-20! dark:bg-[#7f95e6]">
                <tr>
                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] sticky z-50!`} style={{ width: 45, minWidth: 45, maxWidth: 45, left: getPinnedLeft('number'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex flex-col items-center gap-1">
                      №
                    </div>
                  </th>
                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.user ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 150, minWidth: 150, maxWidth: 150, left: getPinnedLeft('user'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={tablePin.user}
                        onChange={(e) => handlePin('user', e.target.checked)}
                        className="custom-header-checkbox"
                      />
                      Ism Sharifi
                    </div>
                  </th>
                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.month ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 100, minWidth: 100, maxWidth: 100, left: getPinnedLeft('month'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={tablePin.month}
                        onChange={(e) => handlePin('month', e.target.checked)}
                        className="custom-header-checkbox"
                      />
                      Oy
                    </div>
                  </th>
                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.fixed_salary ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 140, minWidth: 140, maxWidth: 140, left: getPinnedLeft('fixed_salary'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={tablePin.fixed_salary}
                        onChange={(e) => handlePin('fixed_salary', e.target.checked)}
                        className="custom-header-checkbox"
                      />
                      Oylik maosh (UZS)
                    </div>
                  </th>
                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.kpi_bonus ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 140, minWidth: 140, maxWidth: 140, left: getPinnedLeft('kpi_bonus'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={tablePin.kpi_bonus}
                        onChange={(e) => handlePin('kpi_bonus', e.target.checked)}
                        className="custom-header-checkbox"
                      />
                      KPI bonus
                    </div>
                  </th>
                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.penalty_amount ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 140, minWidth: 140, maxWidth: 140, left: getPinnedLeft('penalty_amount'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={tablePin.penalty_amount}
                        onChange={(e) => handlePin('penalty_amount', e.target.checked)}
                        className="custom-header-checkbox"
                      />
                      Jarima miqdori (UZS)
                    </div>
                  </th>
                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.total_amount ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 140, minWidth: 140, maxWidth: 140, left: getPinnedLeft('total_amount'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={tablePin.total_amount}
                        onChange={(e) => handlePin('total_amount', e.target.checked)}
                        className="custom-header-checkbox"
                      />
                      Jami miqdori
                    </div>
                  </th>
                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.status ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 120, minWidth: 120, maxWidth: 120, left: getPinnedLeft('status'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={tablePin.status}
                        onChange={(e) => handlePin('status', e.target.checked)}
                        className="custom-header-checkbox"
                      />
                      Holati
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.created_at ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 140, minWidth: 140, maxWidth: 140, right: getPinnedRight('created_at'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={tablePin.created_at}
                        onChange={(e) => handlePin('created_at', e.target.checked)}
                        className="custom-header-checkbox"
                      />
                      Hisoblangan vaqti
                    </div>
                  </th>

                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.confirmed_at ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 140, minWidth: 140, maxWidth: 140, right: getPinnedRight('confirmed_at'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={tablePin.confirmed_at}
                        onChange={(e) => handlePin('confirmed_at', e.target.checked)}
                        className="custom-header-checkbox"
                      />
                      Tasdiqlangan vaqti
                    </div>
                  </th>
                  <th className={`p-3 text-[13px] bg-[#7186ED] dark:bg-[#7f95e6] font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-start  ${tablePin.accountant ? 'sticky z-50!' : 'z-20!'}`} style={{ width: 150, minWidth: 150, maxWidth: 150, right: getPinnedRight('accountant'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={tablePin.accountant}
                        onChange={(e) => handlePin('accountant', e.target.checked)}
                        className="custom-header-checkbox"
                      />
                      Hisobchi
                    </div>
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#7f95e6] dark:text-slate-300">
                {UserReports.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-[#292A2A]">
                    <td
                      className={`p-3 text-[13px] text-[#6E7681] border-t border-[var(--stroke-sub)] dark:border-[#292A2A] z-10! bg-white dark:bg-[#0d1117] dark:text-[#E6EDF3] sticky`}
                      style={{ width: 45, minWidth: 45, maxWidth: 45, left: getPinnedLeft('number'), boxShadow: isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)' }}>
                      {index + 1}
                    </td>
                    <td className={`p-3 text-[13px] text-start font-semibold text-slate-700 dark:text-[#E6EDF3] border-t border-[var(--stroke-sub)] dark:border-[#292A2A] z-10! bg-white dark:bg-[#0d1117]  ${tablePin.user ? 'sticky' : ''}`}
                      style={{
                        width: 150,
                        minWidth: 150,
                        maxWidth: 150,
                        left: getPinnedLeft('user'),
                        boxShadow: tablePin.user ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none'
                      }}>
                      {item.user}
                    </td>
                    <td className={`p-3 text-[13px] border-r text-slate-600 dark:text-[#E6EDF3] border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-start z-10! bg-white dark:bg-[#0d1117]  ${tablePin.month ? 'sticky' : ''}`}
                      style={{
                        width: 100,
                        minWidth: 100,
                        maxWidth: 100,
                        left: getPinnedLeft('month'),
                        boxShadow: tablePin.month ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none'
                      }}>
                      {item?.month ? dayjs(item.month).format('DD.MM.YYYY') : ''}
                    </td>
                    <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-end z-10! bg-white dark:bg-[#0d1117]  ${tablePin.fixed_salary ? 'sticky' : ''}`}
                      style={{ width: 140, minWidth: 140, maxWidth: 140, left: getPinnedLeft('fixed_salary'), boxShadow: tablePin.fixed_salary ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.fixed_salary ? formatNum(item.fixed_salary) : ''}
                    </td>
                    <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-end z-10! bg-white dark:bg-[#0d1117]  ${tablePin.kpi_bonus ? 'sticky' : ''}`}
                      style={{ width: 140, minWidth: 140, maxWidth: 140, left: getPinnedLeft('kpi_bonus'), boxShadow: tablePin.kpi_bonus ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.kpi_bonus ? formatNum(item.kpi_bonus) : ''}
                    </td>
                    <td className={`p-3 text-[13px] text-slate-600 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-center z-10! bg-white dark:bg-[#0d1117]  ${tablePin.penalty_amount ? 'sticky' : ''}`}
                      style={{ width: 140, minWidth: 140, maxWidth: 140, left: getPinnedLeft('penalty_amount'), boxShadow: tablePin.penalty_amount ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.penalty_amount ? formatNum(item.penalty_amount) : ''}
                    </td>
                    <td className={`p-3 text-[13px] font-bold text-slate-900 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-end z-10! bg-white dark:bg-[#0d1117]  ${tablePin.total_amount ? 'sticky' : ''}`}
                      style={{ width: 140, minWidth: 140, maxWidth: 140, left: getPinnedLeft('total_amount'), boxShadow: tablePin.total_amount ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.total_amount ? formatNum(item.total_amount) : ''}
                    </td>
                    <td className={`p-3 text-[13px] font-bold text-slate-900 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-center z-10! bg-white dark:bg-[#0d1117]  ${tablePin.status ? 'sticky' : ''}`}
                      style={{ width: 120, minWidth: 120, maxWidth: 120, left: getPinnedLeft('status'), boxShadow: tablePin.status ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.status || ""}
                    </td>
                    <td className={`p-3 text-[13px] font-bold text-slate-900 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-end z-10! bg-white dark:bg-[#0d1117]  ${tablePin.created_at ? 'sticky' : ''}`}
                      style={{ width: 140, minWidth: 140, maxWidth: 140, right: getPinnedRight('created_at'), boxShadow: tablePin.created_at ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : ''}
                    </td>
                    <td className={`p-3 text-[13px] font-bold text-slate-900 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-end z-10! bg-white dark:bg-[#0d1117]  ${tablePin.confirmed_at ? 'sticky' : ''}`}
                      style={{ width: 140, minWidth: 140, maxWidth: 140, right: getPinnedRight('confirmed_at'), boxShadow: tablePin.confirmed_at ? (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : ''}
                    </td>
                    <td className={`p-3 text-[13px] font-bold text-slate-900 dark:text-[#E6EDF3] border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-end z-10! bg-white dark:bg-[#0d1117]  ${tablePin.accountant ? 'sticky' : ''}`}
                      style={{ width: 150, minWidth: 150, maxWidth: 150, right: getPinnedRight('accountant'), boxShadow: tablePin.accountant ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : 'none' }}>
                      {item?.accountant || ""}
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

      {selectEmployee && (
        <EmployeeStep
          selectedList={filters.user ? filters.user.split(',') : []}
          title="Xodimlar tanlang"
          employee_role='employee'
          onConfirm={handleSelectEmployeeConfirm}
          onClose={() => setSelectEmployee(false)}
        />
      )}

      {selectAccountant && (
        <EmployeeStep
          selectedList={filters.accountant ? filters.accountant.split(',') : []}
          onConfirm={handleSelectAccountantConfirm}
          title="Hisobchilar tanlang"
          param={{ roles: "accountant" }}
          onClose={() => setSelectAccountant(false)}
        />
      )}

    </div >
  )
}

export default Salary

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