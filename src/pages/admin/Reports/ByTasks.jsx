import { useEffect, useRef, useState } from 'react'
import { usePageAction } from '../../../context/PageActionContext'
import { LuFilter } from 'react-icons/lu'
import { FaAngleDown } from 'react-icons/fa'
import { FaRegFile, FaXmark } from 'react-icons/fa6'
import { DatePicker, Select } from 'antd'
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
              font-size: 7px; 
              color: #333;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            h2 { 
              text-align: center; 
              margin-bottom: 10px; 
              font-size: 14px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 10px;
            }
            th, td { 
              border: 1px solid #e2e8f0; 
              padding: 2px 3px; 
              text-align: left;
              word-wrap: break-word;
            }
            th { 
              background-color: #f8fafc; 
              font-weight: bold; 
              color: #475569;
              text-align: center;
              font-size: 8px;
            }
            td.number { 
              text-align: right; 
              font-weight: bold;
            }
            td.center { 
              text-align: center; 
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
                <th>Loyiha</th>
                <th>Vazifa</th>
                <th>Topshiruvchi</th>
                <th>Muallif</th>
                <th>Darajasi</th>
                <th>Holati</th>
                <th>Turi</th>
                <th>Narxi</th>
                <th>Jarima %</th>
                <th>Muddati</th>
                <th>Yaratilgan</th>
                <th>Sprint</th>
                <th>Kimga</th>
                <th>Qaytish</th>
                <th>Bekor qilish sababi</th>
              </tr>
            </thead>
            <tbody>
              ${UserReports.map((item, index) => `
                <tr>
                  <td class="center">${index + 1}</td>
                  <td class="center">${item?.prefix || "-"}</td>
                  <td>${item?.project || "-"}</td>
                  <td>${item?.title || "-"}</td>
                  <td>${item?.assignee || "-"}</td>
                  <td>${item?.created_by || "-"}</td>
                  <td class="center">${priority_type.find((s) => s?.value === item?.priority)?.label || "-"}</td>
                  <td class="center">${status[item?.status] || "-"}</td>
                  <td class="center">${type.find((s) => s?.value === item?.type)?.label || "-"}</td>
                  <td class="number">${formatNum(item?.task_price || 0)}</td>
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
    setFilters(prev => ({ ...prev, assignee: selected.join(',') }))
    setSelectSubmitter(false)
  }

  const handleSelectAccountantConfirm = (selected) => {
    setFilters(prev => ({ ...prev, created_by: selected.join(',') }))
    setSelectSubmitter(false)
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

          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Loyihalar</label>
            <button
              type="button"
              onClick={() => setSelectProject(true)}
              className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[#222323] border border-slate-200 dark:border-[#292A2A] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d]  cursor-pointer ${filters?.project?.length > 0 ? 'filter-notif' : ''}`}
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
              className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[#222323] border border-slate-200 dark:border-[#292A2A] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d] transition-colors cursor-pointer ${filters?.assignee?.length > 0 ? 'filter-notif' : ''}`}
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
              className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[#222323] border border-slate-200 dark:border-[#292A2A] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d] transition-colors cursor-pointer ${filters?.created_by?.length > 0 ? 'filter-notif' : ''}`}
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
              padding='13.5px 12px'
              placeholder="Darajasini tanlang"
              options={priority_type}
              value={filters.priority}
              onChange={(value) => handleFilterChange('priority', value)}
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Holati</label>
            <Select
              value={filters.status || undefined}
              onChange={(value) => handleFilterChange('status', value)}
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
              className="w-full custom-antd-select text-sm! py-[11px]! rounded-xl!"
              size="large"
              allowClear
              placeholder="Holatini tanlang"
              optionLabelProp="label"
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
                  value: 'done',
                  label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#5E35B1]"></span> Bajarilgan</div>,
                  dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#5E35B1]"></span> Bajarilfab</div>
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
                }
              ]}
              optionRender={(option) => option.data.dropdownLabel || option.data.label}
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Turi</label>
            <FilterSelect
              padding='13.5px 12px'
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
              padding='13.5px 12px'
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
              padding='13.5px 12px'
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
                className='bg-white'
                value={filters.price_min}
                onChange={(e) => handleFilterChange('price_min', formatNum(e.target.value))}
              />
              <FilterInput
                label="gacha"
                className='bg-white'
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
          <div className="col-span-2 md:col-span-2">
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Qaytishlar soni</label>
            <div className='grid grid-cols-2 gap-3'>
              <FilterInput
                label="dan"
                className='bg-white'
                value={filters.reopened_min}
                onChange={(e) => handleFilterChange('reopened_min', formatNum(e.target.value))}
              />
              <FilterInput
                label="gacha"
                className='bg-white'
                value={filters.reopened_max}
                onChange={(e) => handleFilterChange('reopened_max', formatNum(e.target.value))}
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
          <div className="mt-6 h-[74vh] flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-[#292A2A] bg-white dark:bg-[#1E2021] p-10 text-center">
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
            <table className="text-left border-collapse min-w-[2800px]">
              <thead className="bg-[#7186ED] text-white sticky top-0 z-20! dark:bg-[#1E2021]">
                <tr>
                  <th className="p-3 text-xs sticky w-[45px] left-0 z-20! bg-[#7186ED] font-bold border-r border-[#e2e6f2] text-center">№</th>
                  <th className="p-3 text-xs w-[100px] z-20! font-bold border-r border-[#e2e6f2] text-start">Titul</th>
                  <th className="p-3 text-xs font-bold sticky left-[43px] z-20! bg-[#7186ED] border-r w-[180px] border-[#e2e6f2] text-start">Loyiha nomi</th>
                  <th className="p-3 text-xs font-bold border-r w-[180px] border-[#e2e6f2] text-end">Vazifa nomi</th>
                  <th className="p-3 text-xs font-bold border-r w-[250px] border-[#e2e6f2] text-end">Topshiruvchi</th>
                  <th className="p-3 text-xs font-bold border-r w-[250px] border-[#e2e6f2] text-end">Muallif</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-end">Darajasi</th>
                  <th className="p-3 text-xs font-bold border-r w-[120px] border-[#e2e6f2] text-center">Holati</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-center">Turi</th>
                  <th className="p-3 text-xs font-bold border-r w-[140px] border-[#e2e6f2] text-center">Vazifa narxi (UZS)</th>
                  <th className="p-3 text-xs font-bold border-r w-[150px] border-[#e2e6f2] text-center">Jarima foizi (%)</th>
                  <th className="p-3 text-xs sticky right-[164px] bg-[#7186ED] font-bold border-r w-[150px] border-[#e2e6f2] text-center">Muddati</th>
                  <th className="p-3 text-xs  sticky right-0 bg-[#7186ED] font-bold border-y! w-[150px] border-[#e2e6f2] text-center">Yaratilgan vaqti</th>
                  <th className="p-3 text-xs font-bold border-r w-[150px] border-[#e2e6f2] text-center">Sprint raqami</th>
                  <th className="p-3 text-xs font-bold border-r w-[150px] border-[#e2e6f2] text-center">Kim uchun</th>
                  <th className="p-3 text-xs font-bold border-r w-[150px] border-[#e2e6f2] text-center">Qaytishlar soni</th>
                  <th className="p-3 text-xs font-bold border-r w-[150px] border-[#e2e6f2] text-center">Bekor qilish sababi</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1E2021] dark:text-slate-300">
                {UserReports.map((item, index) => (
                  <tr className="border-b border-slate-100 dark:border-[#292A2A] hover:bg-slate-50 dark:hover:bg-[#252626] " key={item.id || index}>
                    <td className="p-3 text-xs text-slate-500 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center sticky w-[45px] left-0 z-10! bg-slate-50 dark:bg-[#1E2021]">
                      {index + 1}
                    </td>
                    <td className="p-3 text-xs font-medium text-slate-500 dark:text-slate-200 border-r border-[#e2e6f2] dark:border-[#292A2A]">
                      {item?.prefix || "-"}
                    </td>
                    <td className="p-3 text-xs font-medium text-slate-700 dark:text-slate-200 border-r border-[#e2e6f2] dark:border-[#292A2A] text-start sticky left-[40px] z-10! bg-slate-50">
                      {item?.project || "-"}
                    </td>
                    <td className="p-3 text-xs font-medium text-slate-900 dark:text-white border-r border-[#e2e6f2] dark:border-[#292A2A] text-end">
                      {item?.title || '-'}
                    </td>
                    <td className="p-3 text-xs font-medium text-slate-900 dark:text-white border-r border-[#e2e6f2] dark:border-[#292A2A] text-end">
                      {item?.assignee || "-"}
                    </td>
                    <td className="p-3 text-xs font-medium border-r border-[#e2e6f2] dark:border-[#292A2A] text-end">
                      {item?.created_by || "-"}
                    </td>
                    <td className="p-3 text-xs font-medium text-slate-900 dark:text-white border-r border-[#e2e6f2] dark:border-[#292A2A] text-end">
                      {priority_type.find((s) => s?.value === item?.priority)?.label || '-'}
                    </td>
                    <td className="p-3 text-xs font-medium border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {status[item?.status] || '-'}
                    </td>
                    <td className="p-3 text-xs font-medium border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {type.find((s) => s?.value === item?.type)?.label || '-'}
                    </td>
                    <td className="p-3 text-xs font-bold text-slate-600 dark:text-slate-400 border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item?.task_price?.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') || "-"}
                    </td>
                    <td className="p-3 text-xs border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item?.penalty_percentage || item?.penalty_percentage === 0 ? Number(item.penalty_percentage) : "-"}
                    </td>
                    <td className="p-3 text-xs sticky right-[160px] bg-white border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {dayjs(item?.deadline).format("DD.MM.YYYY HH:mm") || "-"}
                    </td>
                    <td className="p-3 text-xs sticky right-0 bg-white border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {dayjs(item?.created_at).format("DD.MM.YYYY HH:mm") || "-"}
                    </td>
                    <td className="p-3 text-xs border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item?.sprint || "-"}
                    </td>
                    <td className="p-3 text-xs border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item?.position ? item.position.split(',').map(p => p.trim()).join(', ') : "-"}
                    </td>
                    <td className="p-3 text-xs border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item?.reopened_count || "-"}
                    </td>
                    <td className="p-3 text-xs border-r border-[#e2e6f2] dark:border-[#292A2A] text-center">
                      {item?.rejection_reason || "-"}
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
        selectSubmitter && (
          <EmployeeStep
            selectedList={filters.assignee ? filters.assignee.split(',') : []}
            title="Topshiruvchi tanlang"
            onConfirm={handleSelectEmployeeConfirm}
            onClose={() => setSelectSubmitter(false)}
          />
        )
      }

      {selectAuthor && (
        <EmployeeStep
          selectedList={filters.created_by ? filters.created_by.split(',') : []}
          onConfirm={handleSelectAccountantConfirm}
          title="Muallif tanlang"
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