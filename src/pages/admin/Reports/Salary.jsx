import { useEffect, useRef, useState } from 'react'
import { usePageAction } from '../../../context/PageActionContext'
import { LuFilter } from 'react-icons/lu'
import { FaAngleDown } from 'react-icons/fa'
import { FaRegFile, FaXmark } from 'react-icons/fa6'
import { DatePicker } from 'antd'
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
import 'jspdf-autotable'
import Papa from 'papaparse'

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

const Employee = () => {
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
        name: item?.user?.first_name ? `${item.user.first_name} ${item.user.last_name || ''}` : item?.user?.username || item?.user?.name || 'Noma\'lum',
        month: months.find(m => m.value === item?.month)?.label || item?.month || '-',
        salary: item?.salary || 0,
        kpi: item?.kpi || 0,
        penalty: item?.penalty || 0,
        total: item?.total_amount || 0,
        status: item?.is_confirmed ? 'Tasdiqlangan' : 'Hisoblangan',
        created_at: item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : '-',
        confirmed_at: item?.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : '-',
        accountant: item?.accountant?.first_name ? `${item.accountant.first_name} ${item.accountant.last_name || ''}` : item?.accountant?.username || item?.accountant?.name || '-'
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

    doc.autoTable({
      head: [['№', 'Ism Sharifi', 'Oy', 'Oylik maosh', 'KPI bonus', 'Jarima miqdori', 'Jami miqdori', 'Holati', 'Hisoblangan vaqti', 'Tasdiqlangan vaqti', 'Hisobchi']],
      body: UserReports.map((item, index) => [
        index + 1,
        item?.user?.first_name ? `${item.user.first_name} ${item.user.last_name || ''}` : item?.user?.username || item?.user?.name || 'Noma\'lum',
        months.find(m => m.value === item?.month)?.label || item?.month || '-',
        formatNum(item?.salary || 0),
        formatNum(item?.kpi || 0),
        formatNum(item?.penalty || 0),
        formatNum(item?.total_amount || 0),
        item?.is_confirmed ? 'Tasdiqlangan' : 'Hisoblangan',
        item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : '-',
        item?.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : '-',
        item?.accountant?.first_name ? `${item.accountant.first_name} ${item.accountant.last_name || ''}` : item?.accountant?.username || item?.accountant?.name || '-'
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
      'Ism Sharifi': item?.user?.first_name ? `${item.user.first_name} ${item.user.last_name || ''}` : item?.user?.username || item?.user?.name || 'Noma\'lum',
      'Oy': months.find(m => m.value === item?.month)?.label || item?.month || '-',
      'Oylik maosh': item?.salary || 0,
      'KPI bonus': item?.kpi || 0,
      'Jarima miqdori': item?.penalty || 0,
      'Jami miqdori': item?.total_amount || 0,
      'Holati': item?.is_confirmed ? 'Tasdiqlangan' : 'Hisoblangan',
      'Hisoblangan vaqti': item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : '-',
      'Tasdiqlangan vaqti': item?.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : '-',
      'Hisobchi': item?.accountant?.first_name ? `${item.accountant.first_name} ${item.accountant.last_name || ''}` : item?.accountant?.username || item?.accountant?.name || '-'
    }));

    const csvContent = "\uFEFF" + Papa.unparse(csvData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Ish_haqi_hisoboti_${dayjs().format('DD_MM_YYYY')}.csv`);
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
          <title>Ish haqi hisoboti</title>
          <style>
            @page { 
              size: landscape; 
              margin: 0; 
            }
            body { 
              font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              font-size: 8px; 
              color: #333;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              zoom: 50%;
            }
            h2 { 
              text-align: center; 
              margin-bottom: 15px; 
              font-size: 14px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
            }
            th, td { 
              border: 1px solid #e2e8f0; 
              padding: 3px 4px; 
              text-align: left;
              white-space: nowrap;
            }
            th { 
              background-color: #f8fafc; 
              font-weight: bold; 
              color: #475569;
              text-align: center;
            }
            td.number { 
              text-align: right; 
              font-weight: bold;
            }
            td.center { 
              text-align: center; 
            }
            .status-badge {
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: bold;
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
                  <td>${item?.user?.first_name ? `${item.user.first_name} ${item.user.last_name || ''}` : item?.user?.username || item?.user?.name || 'Noma\'lum'}</td>
                  <td>${months.find(m => m.value === item?.month)?.label || item?.month || '-'}</td>
                  <td class="number">${formatNum(item?.salary || 0)}</td>
                  <td class="number">${formatNum(item?.kpi || 0)}</td>
                  <td class="number" style="color: #ef4444;">${formatNum(item?.penalty || 0)}</td>
                  <td class="number">${formatNum(item?.total_amount || 0)}</td>
                  <td class="center">
                    <span class="status-badge ${item?.is_confirmed ? 'status-tasdiqlangan' : 'status-hisoblangan'}">
                      ${item?.is_confirmed ? 'Tasdiqlangan' : 'Hisoblangan'}
                    </span>
                  </td>
                  <td class="center">${item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : '-'}</td>
                  <td class="center">${item?.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : '-'}</td>
                  <td class="center">${item?.accountant?.first_name ? `${item.accountant.first_name} ${item.accountant.last_name || ''}` : item?.accountant?.username || item?.accountant?.name || '-'}</td>
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

  const hasActiveFilters = Object.values(filters).some((value) => {
    if (value === undefined || value === null || value === '') return false
    if (Array.isArray(value) && value.length === 0) return false
    return true
  })

  const showClearButton = Object.keys(filters).some((key) => {
    const value = filters[key];
    if (key === 'created_at_min' || key === 'created_at_max') {
      if (!value) return false;
      if (initialFilters[key] && value.isSame && value.isSame(initialFilters[key])) {
        return false;
      }
      return true;
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
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#8E95B5]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Izlash..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 outline-none  bg-slate-100 border border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8] dark:bg-[#222323] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5]"
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
            className={`flex items-center justify-between gap-2 h-8 px-5 pr-3! bg-slate-100 dark:bg-[#1E2021] dark:text-slate-400! rounded-xl text-slate-600 text-sm font-semibold cursor-pointer relative border border-slate-200 dark:border-[#292A2A] ${showClearButton ? 'filter-notif' : ''}`}
          >
            <LuFilter size={16} />
            Filtrlash

            <FaAngleDown size={16} className={`transition-transform duration-300 ${!filterModal ? '-rotate-90' : ''}`} />
          </button>
          {showClearButton && (
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
          disabled={!hasActiveFilters}
          onClick={handleFetchReports}
        >
          <FaRegFile size={15} />
          Shakillantirish
        </button>
      </div>
      {/* Filter Panel */}
      <div
        className={`transition-all duration-300 ease-in-out w-full ${filterModal ? 'max-h-[1200px] opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'} mt-4`}
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
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400  hover:border-slate-200!"
                  placeholder='Boshlanish sanasi'
                />
              </div>
              <div className="relative flex-1">
                <DatePicker
                  inputReadOnly
                  value={filters.created_at_max}
                  format="DD.MM.YYYY HH:mm"
                  onChange={(value) => handleFilterChange('created_at_max', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400  hover:border-slate-200!"
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
                  inputReadOnly
                  value={filters.confirmed_at_min}
                  format="DD.MM.YYYY HH:mm"
                  onChange={(value) => handleFilterChange('confirmed_at_min', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400  hover:border-slate-200!"
                  placeholder='Boshlanish sanasi'
                />
              </div>

              <div className="relative">
                <DatePicker
                  inputReadOnly
                  value={filters.confirmed_at_max}
                  format="DD.MM.YYYY HH:mm"
                  onChange={(value) => handleFilterChange('confirmed_at_max', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400  hover:border-slate-200!"
                  placeholder='Tugash sanasi'
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
                  className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[#222323] border border-slate-200 dark:border-[#292A2A] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d]  cursor-pointer ${filters?.user?.length > 0 ? 'filter-notif' : ''}`}
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
                  className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[#222323] border border-slate-200 dark:border-[#292A2A] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d]  cursor-pointer ${filters?.accountant?.length > 0 ? 'filter-notif' : ''}`}
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
              options={months.map(type => type.label)}
              value={months.find(type => type.value === filters.month)?.label}
              onChange={(value) => handleFilterChange('month', months.find(type => type.label === value)?.value)}
            />
          </div>

          <div className="col-span-1">
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Holati</label>
            <FilterSelect
              padding='13.5px 12px'
              placeholder="Holatini tanlang"
              options={status_type.map(type => type.label)}
              value={status_type.find(type => type.value === filters.is_confirmed)?.label}
              onChange={(value) => handleFilterChange('is_confirmed', status_type.find(type => type.label === value)?.value)}
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
                className='bg-white'
                value={filters.total_amount_min}
                onChange={(e) => handleFilterChange('total_amount_min', formatNum(e.target.value))}
              />
              <FilterInput
                label="gacha"
                className='bg-white'
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
                className='bg-white'
                value={filters.salary_min}
                onChange={(e) => handleFilterChange('salary_min', formatNum(e.target.value))}
              />
              <FilterInput
                label="gacha"
                className='bg-white'
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
                className='bg-white'
                value={filters.kpi_min}
                onChange={(e) => handleFilterChange('kpi_min', formatNum(e.target.value))}
              />
              <FilterInput
                label="gacha"
                className='bg-white'
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
                className='bg-white'
                value={filters.penalty_min}
                onChange={(e) => handleFilterChange('penalty_min', formatNum(e.target.value))}
              />
              <FilterInput
                label="gacha"
                className='bg-white'
                value={filters.penalty_max}
                onChange={(e) => handleFilterChange('penalty_max', formatNum(e.target.value))}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Table Section */}
      {
        isLoading ? (
          <div className="mt-6 rounded-2xl border flex flex-col justify-center items-center h-[74vh] border-slate-200 dark:border-[#292A2A] bg-white dark:bg-[#1E2021] p-10 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ma'lumotlar shakllantirilmoqda...</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Iltimos, biroz kuting.</p>
          </div>
        ) : !hasFetched ? (
          <div className="mt-6 h-[76vh] flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-[#292A2A] bg-white dark:bg-[#1E2021] p-10 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filtrlarni tanlang va Shakillantirish tugmasini bosing.</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Bu yerda ma'lumotlar ko'rsatiladi.</p>
          </div>
        ) : UserReports.length === 0 ? (
          <div className="mt-6 rounded-2xl flex flex-col justify-center items-center h-[74vh] border border-slate-200 dark:border-[#292A2A] bg-white dark:bg-[#1E2021] p-10 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Natija topilmadi.</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Filtrlarni o'zgartirib qayta urinib ko'ring.</p>
          </div>
        ) : (
          <div
            className="mt-6 overflow-auto h-[74vh] border border-slate-200 dark:border-[#292A2A]"
            onScroll={handleMoreReportsScroll}
          >
            <table className="text-left border-collapse w-full min-w-[2000px]">
              <thead className="bg-[#7186ED] text-white sticky top-0 z-20! dark:bg-[#1E2021]">
                <tr>
                  <th className="p-3 text-xs sticky w-[45px] left-0 z-20! bg-[#7186ED] font-bold border-r border-[#e2e6f2] text-center">№</th>
                  <th className="p-3 text-xs w-[150px] sticky left-[60px] z-20! bg-[#7186ED] font-bold border-r border-[#e2e6f2] text-start">Ism Sharifi</th>
                  <th className="p-3 text-xs font-bold border-r w-[100px] border-[#e2e6f2] text-start">Oy</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-end">Oylik maosh</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-end">KPI bonus</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-end">Jarima miqdori</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-end">Jami miqdori</th>
                  <th className="p-3 text-xs font-bold border-r w-[120px] border-[#e2e6f2] text-center">Holati</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-center">Hisoblangan vaqti</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-center">Tasdiqlangan vaqti</th>
                  <th className="p-3 text-xs font-bold sticky right-0 bg-[#7186ED] dark:bg-[#1E2021] z-10! border-r w-[150px] border-[#e2e6f2] text-center">Hisobchi</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1E2021] dark:text-slate-300">
                {UserReports.map((item, index) => (
                  <tr className="border-b border-slate-100 dark:border-[#292A2A] hover:bg-slate-50 dark:hover:bg-[#252626] " key={item.id || index}>
                    <td className="p-3 text-xs text-slate-500 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center sticky w-[45px] left-0 z-10! bg-slate-50 dark:bg-[#1E2021]">
                      {index + 1}
                    </td>
                    <td className="p-3 text-xs font-semibold text-slate-700 dark:text-slate-200 border-r border-[#e2e6f2] dark:border-[#292A2A] sticky left-[60px] z-10! bg-slate-50 dark:bg-[#1E2021]">
                      {item?.user?.first_name ? `${item.user.first_name} ${item.user.last_name || ''}` : item?.user?.username || item?.user?.name || 'Noma\'lum'}
                    </td>
                    <td className="p-3 text-xs font-semibold text-slate-700 dark:text-slate-200 border-r border-[#e2e6f2] dark:border-[#292A2A] text-start">
                      {months.find(m => m.value === item?.month)?.label || item?.month || '-'}
                    </td>
                    <td className="p-3 text-xs font-bold text-slate-900 dark:text-white border-r border-[#e2e6f2] dark:border-[#292A2A] text-end">
                      {formatNum(item?.salary || 0)}
                    </td>
                    <td className="p-3 text-xs font-bold text-slate-900 dark:text-white border-r border-[#e2e6f2] dark:border-[#292A2A] text-end">
                      {formatNum(item?.kpi || 0)}
                    </td>
                    <td className="p-3 text-xs font-bold text-red-500 border-r border-[#e2e6f2] dark:border-[#292A2A] text-end">
                      {formatNum(item?.penalty || 0)}
                    </td>
                    <td className="p-3 text-xs font-bold text-slate-900 dark:text-white border-r border-[#e2e6f2] dark:border-[#292A2A] text-end">
                      {formatNum(item?.total_amount || 0)}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${item?.is_confirmed ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'}`}>
                        {item?.is_confirmed ? 'Tasdiqlangan' : 'Hisoblangan'}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : '-'}
                    </td>
                    <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item?.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : '-'}
                    </td>
                    <td className="p-3 text-xs sticky right-0 bg-slate-50 dark:bg-[#1E2021] text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item?.accountant?.first_name ? `${item.accountant.first_name} ${item.accountant.last_name || ''}` : item?.accountant?.username || item?.accountant?.name || '-'}
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
            title="Xodimlar tanlang"
            onConfirm={handleSelectEmployeeConfirm}
            onClose={() => setSelectEmployee(false)}
          />
        )
      }

      {selectAccountant && (
        <EmployeeStep
          selectedList={filters.accountant ? filters.accountant.split(',') : []}
          onConfirm={handleSelectAccountantConfirm}
          title="Hisobchilar tanlang"
          employee_role='accountant'
          onClose={() => setSelectAccountant(false)}
        />
      )}

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