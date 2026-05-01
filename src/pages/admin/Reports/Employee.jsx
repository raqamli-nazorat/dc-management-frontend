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
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const monthStart = dayjs().startOf('month').hour(0).minute(0).second(0).millisecond(0)
const monthEnd = dayjs().endOf('month').hour(23).minute(59).second(0).millisecond(0)

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

const Employee = () => {

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
        item?.username || '-',
        item?.position || '-',
        item?.region || '-',
        item?.district || '-',
        item?.phone_number || '-',
        item?.fixed_salary || 0,
        item?.balance || 0,
        item?.report?.projects?.total || 0,
        item?.report?.projects?.completed || 0,
        item?.report?.projects?.in_progress || 0,
        item?.report?.projects?.cancelled || 0,
        item?.report?.projects?.overdue || 0,
        item?.report?.projects?.planning || 0,
        item?.report?.tasks?.total || 0,
        item?.report?.tasks?.todo || 0,
        item?.report?.tasks?.in_progress || 0,
        item?.report?.tasks?.overdue || 0,
        item?.report?.tasks?.done || 0,
        item?.report?.tasks?.production || 0,
        item?.report?.tasks?.checked || 0,
        item?.report?.tasks?.rejected || 0,
        item?.report?.meetings?.total || 0,
        item?.report?.meetings?.attended || 0,
        item?.report?.meetings?.missed_excused || 0,
        item?.report?.meetings?.missed_unexcused || 0,
        item?.report?.expense_requests_amount?.total || 0,
        item?.report?.expense_requests_amount?.pending || 0,
        item?.report?.expense_requests_amount?.pain || 0,
        item?.report?.expense_requests_amount?.confirmed || 0,
        item?.report?.payroll_amount?.total || 0,
        item?.report?.payroll_amount?.kpi_bonuses || 0,
        item?.report?.payroll_amount?.penalty_amount || 0,
        item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY') : '-'
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
          { content: 'Oylik maosh', rowSpan: 2 },
          { content: 'Balans', rowSpan: 2 },
          { content: 'Loyihalar', colSpan: 6 },
          { content: 'Vazifalar', colSpan: 8 },
          { content: 'Yig\'ilishlar', colSpan: 4 },
          { content: 'Xarajat so\'rovlari', colSpan: 4 },
          { content: 'Ish haqi', colSpan: 3 },
          { content: 'Ishga kirgan vaqti', rowSpan: 2 }
        ],
        [
          'Jami', 'Tugatilgan', 'Jarayonda', 'Bekor', 'Muddati', 'Reja',
          'Jami', 'Qilish', 'Jarayon', 'Muddati', 'Bajarilgan', 'Ishga t', 'Tekshirilgan', 'Rad',
          'Jami', 'Qatnashgan', 'Sababli', 'Sababsiz',
          'Jami', 'Kutilmoqda', 'To\'landi', 'Rad',
          'Jami', 'KPI', 'Jarima'
        ]
      ],
      body: UserReports.map((item, index) => [
        index + 1,
        item?.username || '-',
        item?.position || '-',
        item?.region || '-',
        item?.district || '-',
        item?.phone_number || '-',
        Number(item?.fixed_salary || 0).toLocaleString("uz-UZ"),
        Number(item?.balance || 0).toLocaleString("uz-UZ"),
        item?.report?.projects?.total || 0,
        item?.report?.projects?.completed || 0,
        item?.report?.projects?.in_progress || 0,
        item?.report?.projects?.cancelled || 0,
        item?.report?.projects?.overdue || 0,
        item?.report?.projects?.planning || 0,
        item?.report?.tasks?.total || 0,
        item?.report?.tasks?.todo || 0,
        item?.report?.tasks?.in_progress || 0,
        item?.report?.tasks?.overdue || 0,
        item?.report?.tasks?.done || 0,
        item?.report?.tasks?.production || 0,
        item?.report?.tasks?.checked || 0,
        item?.report?.tasks?.rejected || 0,
        item?.report?.meetings?.total || 0,
        item?.report?.meetings?.attended || 0,
        item?.report?.meetings?.missed_excused || 0,
        item?.report?.meetings?.missed_unexcused || 0,
        Number(item?.report?.expense_requests_amount?.total || 0).toLocaleString("uz-UZ"),
        Number(item?.report?.expense_requests_amount?.pending || 0).toLocaleString("uz-UZ"),
        Number(item?.report?.expense_requests_amount?.pain || 0).toLocaleString("uz-UZ"),
        Number(item?.report?.expense_requests_amount?.confirmed || 0).toLocaleString("uz-UZ"),
        Number(item?.report?.payroll_amount?.total || 0).toLocaleString("uz-UZ"),
        Number(item?.report?.payroll_amount?.kpi_bonuses || 0).toLocaleString("uz-UZ"),
        Number(item?.report?.payroll_amount?.penalty_amount || 0).toLocaleString("uz-UZ"),
        item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY') : '-'
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
      'Ism Sharifi': item?.username || '-',
      'Lavozim': item?.position || '-',
      'Viloyati': item?.region || '-',
      'Tumani': item?.district || '-',
      'Telefon raqami': item?.phone_number || '-',
      'Oylik maosh': item?.fixed_salary || 0,
      'Balans': item?.balance || 0,
      'Loyihalar - Jami': item?.report?.projects?.total || 0,
      'Loyihalar - Tugatilgan': item?.report?.projects?.completed || 0,
      'Loyihalar - Jarayonda': item?.report?.projects?.in_progress || 0,
      'Loyihalar - Bekor qilingan': item?.report?.projects?.cancelled || 0,
      "Loyihalar - Muddati o'tgan": item?.report?.projects?.overdue || 0,
      'Loyihalar - Rejalashtirilayotgan': item?.report?.projects?.planning || 0,
      'Vazifalar - Jami': item?.report?.tasks?.total || 0,
      'Vazifalar - Qilish kerak': item?.report?.tasks?.todo || 0,
      'Vazifalar - Jarayonda': item?.report?.tasks?.in_progress || 0,
      "Vazifalar - Muddati o'tgan": item?.report?.tasks?.overdue || 0,
      'Vazifalar - Bajarilgan': item?.report?.tasks?.done || 0,
      'Vazifalar - Ishga tushurilgan': item?.report?.tasks?.production || 0,
      'Vazifalar - Tekshirilgan': item?.report?.tasks?.checked || 0,
      'Vazifalar - Rad etilgan': item?.report?.tasks?.rejected || 0,
      "Yig'ilishlar - Jami": item?.report?.meetings?.total || 0,
      "Yig'ilishlar - Qatnashgan": item?.report?.meetings?.attended || 0,
      "Yig'ilishlar - Sababli qatnashmagan": item?.report?.meetings?.missed_excused || 0,
      "Yig'ilishlar - Sababsiz qatnashmagan": item?.report?.meetings?.missed_unexcused || 0,
      "Xarajat so'rovlari - Jami": item?.report?.expense_requests_amount?.total || 0,
      "Xarajat so'rovlari - Kutilmoqda": item?.report?.expense_requests_amount?.pending || 0,
      "Xarajat so'rovlari - To'landi": item?.report?.expense_requests_amount?.pain || 0,
      "Xarajat so'rovlari - Xodim qabul qilmagan": item?.report?.expense_requests_amount?.confirmed || 0,
      'Ish haqi - Jami': item?.report?.payroll_amount?.total || 0,
      'Ish haqi - KPI bonusi': item?.report?.payroll_amount?.kpi_bonuses || 0,
      'Ish haqi - Jarima miqdori': item?.report?.payroll_amount?.penalty_amount || 0,
      'Ishga kirgan vaqti': item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY') : '-'
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
              @page { size: landscape; margin: 0; }
              body { font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif; font-size: 7px; color: #333; -webkit-print-color-adjust: exact; print-color-adjust: exact; zoom: 50%; }
              h2 { text-align: center; margin-bottom: 15px; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #e2e8f0; padding: 2px 3px; text-align: left; white-space: nowrap; }
              th { background-color: #f8fafc; font-weight: bold; color: #475569; text-align: center; }
              th.main-group { background-color: #7186ED; color: white; }
              th.sub-group { background-color: #8999EF; color: white; font-size: 7px; }
              td.number { text-align: right; font-weight: bold; }
              td.center { text-align: center; }
              td.bg-slate { background-color: #f8fafc; }
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
                  <th class="sub-group">Jami</th><th class="sub-group">Kutilmoqda</th><th class="sub-group">To'landi</th><th class="sub-group">Qabul qilinmagan</th>
                  <th class="sub-group">Jami</th><th class="sub-group">KPI bonusi</th><th class="sub-group">Jarima miqdori</th>
                </tr>
              </thead>
              <tbody>
                \${UserReports.map((item, index) => \`
                  <tr>
                    <td class="center">\${index + 1}</td>
                    <td><b>\${item?.username || '-'}</b></td>
                    <td class="center">\${item?.position || '-'}</td>
                    <td class="center">\${item?.region || '-'}</td>
                    <td class="center">\${item?.district || '-'}</td>
                    <td class="center">\${item?.phone_number || '-'}</td>
                    <td class="number">\${Number(item?.fixed_salary || 0).toLocaleString("uz-UZ")}</td>
                    <td class="number">\${Number(item?.balance || 0).toLocaleString("uz-UZ")}</td>
                    <td class="center bg-slate">\${item?.report?.projects?.total || 0}</td>
                    <td class="center">\${item?.report?.projects?.completed || 0}</td>
                    <td class="center">\${item?.report?.projects?.in_progress || 0}</td>
                    <td class="center">\${item?.report?.projects?.cancelled || 0}</td>
                    <td class="center">\${item?.report?.projects?.overdue || 0}</td>
                    <td class="center">\${item?.report?.projects?.planning || 0}</td>
                    <td class="center bg-slate">\${item?.report?.tasks?.total || 0}</td>
                    <td class="center">\${item?.report?.tasks?.todo || 0}</td>
                    <td class="center">\${item?.report?.tasks?.in_progress || 0}</td>
                    <td class="center">\${item?.report?.tasks?.overdue || 0}</td>
                    <td class="center">\${item?.report?.tasks?.done || 0}</td>
                    <td class="center">\${item?.report?.tasks?.production || 0}</td>
                    <td class="center">\${item?.report?.tasks?.checked || 0}</td>
                    <td class="center">\${item?.report?.tasks?.rejected || 0}</td>
                    <td class="center bg-slate">\${item?.report?.meetings?.total || 0}</td>
                    <td class="center">\${item?.report?.meetings?.attended || 0}</td>
                    <td class="center">\${item?.report?.meetings?.missed_excused || 0}</td>
                    <td class="center">\${item?.report?.meetings?.missed_unexcused || 0}</td>
                    <td class="number bg-slate">\${Number(item?.report?.expense_requests_amount?.total || 0).toLocaleString("uz-UZ")}</td>
                    <td class="number">\${Number(item?.report?.expense_requests_amount?.pending || 0).toLocaleString("uz-UZ")}</td>
                    <td class="number">\${Number(item?.report?.expense_requests_amount?.pain || 0).toLocaleString("uz-UZ")}</td>
                    <td class="number">\${Number(item?.report?.expense_requests_amount?.confirmed || 0).toLocaleString("uz-UZ")}</td>
                    <td class="number bg-slate">\${Number(item?.report?.payroll_amount?.total || 0).toLocaleString("uz-UZ")}</td>
                    <td class="number">\${Number(item?.report?.payroll_amount?.kpi_bonuses || 0).toLocaleString("uz-UZ")}</td>
                    <td class="number">\${Number(item?.report?.payroll_amount?.penalty_amount || 0).toLocaleString("uz-UZ")}</td>
                    <td class="center">\${item?.created_at ? dayjs(item.created_at).format('DD.MM.YYYY') : '-'}</td>
                  </tr>
                \`).join('')}
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

  const hasActiveFilters = Object.values(filters).some((value) => {
    if (value === undefined || value === null || value === '') return false
    if (Array.isArray(value) && value.length === 0) return false
    return true
  })

  const showClearButton = Object.keys(filters).some((key) => {
    const value = filters[key];
    if (key === 'joined_min' || key === 'joined_max') {
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

    getEmployeeReports({ params })
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

        {/* Row 1: Muddat, Lavozimi, Viloyat, UserIcon */}
        <div className="grid grid-cols-16 gap-4 mb-2">
          <div className="col-span-12 lg:col-span-8">
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Muddat</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <DatePicker
                  inputReadOnly
                  format="DD.MM.YYYY HH:mm"
                  value={filters.joined_min}
                  onChange={(value) => handleFilterChange('joined_min', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400  hover:border-slate-200!"
                  placeholder='Boshlanish sana'
                />
              </div>
              <div className="relative flex-1">
                <DatePicker
                  inputReadOnly
                  value={filters.joined_max}
                  format="DD.MM.YYYY HH:mm"
                  onChange={(value) => handleFilterChange('joined_max', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#222323] border border-slate-200! dark:border-[#292A2A] rounded-xl! text-sm dark:text-white outline-none focus:border-blue-400  hover:border-slate-200!"
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
              className={`h-11 px-5 flex  relative items-center justify-center cursor-pointer bg-slate-100 dark:bg-[#222323] border border-slate-200 dark:border-[#292A2A] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d]  ${filters?.users?.length > 0 ? 'filter-notif' : ''}`}
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
                className='bg-white'
                value={filters.salary_min}
                onChange={(e) => handleFilterChange('salary_min', formatNum(e.target.value))}
              />
              <FilterInput
                className='bg-white'
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
                className='bg-white'
                value={filters.balance_min}
                onChange={(e) => handleFilterChange('balance_min', formatNum(e.target.value))}
              />
              <FilterInput
                label="gacha"
                className='bg-white'
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
                  value={filters.project_status || undefined}
                  onChange={(value) => handleFilterChange('project_status', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full custom-antd-select text-sm! py-[11px]! rounded-xl!"
                  size="large"
                  allowClear
                  placeholder="Jami"
                  optionLabelProp="label"
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
                      label: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1A1D2E]"></span> Bekor qilingan</div>,
                      dropdownLabel: <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1A1D2E]"></span> Bekor qilingan</div>
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
                  optionRender={(option) => option.data.dropdownLabel || option.data.label}
                />
              </div>
              <FilterInput
                label="dan"
                className='bg-white'
                value={filters.projects_min}
                onChange={(e) => handleFilterChange('projects_min', formatNum(e.target.value))}
              />
              <FilterInput
                label="gacha"
                className='bg-white'
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
                <Select
                  value={filters.task_status || undefined}
                  onChange={(value) => handleFilterChange('task_status', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full custom-antd-select text-sm! py-[11px]! rounded-xl!"
                  size="large"
                  allowClear
                  placeholder="Jami"
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
                  optionRender={(option) => option.data.dropdownLabel || option.data.label}
                />
              </div>
              <FilterInput
                label="dan"
                className='bg-white'
                value={filters.tasks_min}
                onChange={(e) => handleFilterChange('tasks_min', formatNum(e.target.value))}
              />
              <FilterInput
                label="gacha"
                className='bg-white'
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
                  className='bg-white'
                />
              </div>
              <div className="col-span-1 relative">
                <FilterInput
                  label="gacha"
                  value={filters.meetings_max}
                  onChange={(e) => handleFilterChange('meetings_max', formatNum(e.target.value))}
                  className='bg-white'
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
                className='bg-white'
              />
              <FilterInput
                label="gacha"
                value={filters.expenses_amount_max}
                onChange={(e) => handleFilterChange('expenses_amount_max', formatNum(e.target.value))}
                className='bg-white'
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
                className='bg-white'
              />
              <FilterInput
                label="gacha"
                value={filters.payrolls_amount_max}
                onChange={(e) => handleFilterChange('payrolls_amount_max', formatNum(e.target.value))}
                isFine={filters.salary_type === SalaryType[1].value}
                className='bg-white'
              />
            </div>
          </div>
        </div>

      </div>

      {/* Table Section */}
      {isLoading ? (
        <div className="mt-6 rounded-2xl h-[74vh] flex flex-col items-center justify-center border border-slate-200 dark:border-[#292A2A] bg-white dark:bg-[#1E2021] p-10 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ma'lumotlar shakllantirilmoqda...</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Iltimos, biroz kuting.</p>
        </div>
      ) : !hasFetched ? (
        <div className="mt-6 rounded-2xl h-[74vh] flex flex-col justify-center items-center border border-slate-200 dark:border-[#292A2A] bg-white dark:bg-[#1E2021] p-10 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filtrlarni tanlang va Shakillantirish tugmasini bosing.</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Bu yerda ma'lumotlar ko'rsatiladi.</p>
        </div>
      ) : UserReports.length === 0 ? (
        <div className="mt-6 rounded-2xl border h-[74vh] flex flex-col items-center justify-center border-slate-200 dark:border-[#292A2A] bg-white dark:bg-[#1E2021] p-10 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Natija topilmadi.</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Filtrlarni o'zgartirib qayta urinib ko'ring.</p>
        </div>
      ) : (
        <div
          className="mt-6 overflow-auto h-[76vh] border border-slate-200 dark:border-[#292A2A]"
          onScroll={handleMoreReportsScroll}
        >
          <table className="text-left border-collapse w-[4500px]">
            <thead className="bg-[#7186ED] text-white sticky top-0 z-20! dark:bg-[#1E2021]">
              <tr>
                <th rowSpan={2} className="p-3 text-xs sticky w-[45px] left-0 z-20! bg-[#7186ED] font-bold border-r-1! border-[#e2e6f2]">№</th>
                <th rowSpan={2} className="p-3 text-xs sticky w-[200px] left-[45px] z-10! bg-[#7186ED] font-bold border-r-1! border-[#e2e6f2]">Ism Sharifi</th>
                <th rowSpan={2} className="p-3 text-xs sticky w-[180px] left-[240px] z-10! bg-[#7186ED] font-bold border-r-1! border-[#e2e6f2] text-center">Lavozim</th>
                <th rowSpan={2} className="p-3 text-xs w-[160px] font-bold border-r-1! border-[#e2e6f2] text-center">Viloyati</th>
                <th rowSpan={2} className="p-3 text-xs w-[160px] font-bold border-r-1! border-[#e2e6f2] text-center">Tumani</th>
                <th rowSpan={2} className="p-3 text-xs w-[180px] font-bold border-r-1! border-[#e2e6f2] text-center">Telefon raqami</th>
                <th rowSpan={2} className="p-3 text-xs w-[180px] font-bold border-r-1! border-[#e2e6f2] text-center">Oylik maosh (UZS)</th>
                <th rowSpan={2} className="p-3 text-xs w-[180px] font-bold border-r-1! border-[#e2e6f2] text-center">Balans (UZS)</th>
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
                <tr key={item.id} className="border-b border-slate-100 dark:border-[#292A2A] hover:bg-slate-50 dark:hover:bg-[#252626] ">
                  <td
                    className="p-3 text-xs text-slate-500 border-r! border-t! border-[#e2e6f2] dark:border-[#292A2A] sticky w-[45px] left-0 z-10! bg-slate-50">
                    {index + 1}
                  </td>
                  <td className="p-3 text-xs font-semibold text-slate-700 dark:text-slate-200 border-r! border-t! border-[#e2e6f2] dark:border-[#292A2A] sticky left-[44px] z-10! bg-slate-50">
                    {item.username}
                  </td>
                  <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r! border-t! border-[#e2e6f2] dark:border-[#292A2A] text-center sticky left-[243px] z-10! bg-slate-50">
                    {item.position || "-"}
                  </td>
                  <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-t border-[#e2e6f2] dark:border-[#292A2A] text-center">{item.region || "-"}</td>
                  <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-t border-[#e2e6f2] dark:border-[#292A2A] text-center">{item.district || "-"}</td>
                  <td className="p-3 text-xs text-slate-600 dark:text-slate-400 border-r border-t border-[#e2e6f2] dark:border-[#292A2A] text-center">{item.phone_number || "-"}</td>
                  <td className="p-3 text-xs font-bold text-slate-900 dark:text-white border-r border-t border-[#e2e6f2] dark:border-[#292A2A] text-center">
                    {Number(item.fixed_salary || 0).toLocaleString("uz-UZ")}
                  </td>
                  <td className="p-3 text-xs font-bold text-slate-900 dark:text-white border-r border-t border-[#e2e6f2] dark:border-[#292A2A] text-center">
                    {Number(item.balance || 0).toLocaleString("uz-UZ")}
                  </td>
                  <td className="p-3 text-xs text-center border-r border-t border-[#e2e6f2] dark:border-[#292A2A] bg-slate-50/50 dark:bg-white/5">{item?.report?.projects?.total || 0}</td>
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
        <EmployeeStep
          selectedList={filters.users}
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