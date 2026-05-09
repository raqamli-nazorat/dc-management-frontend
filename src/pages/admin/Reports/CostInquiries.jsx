import { useEffect, useRef, useState } from 'react'
import { usePageAction } from '../../../context/PageActionContext'
import { LuFilter } from 'react-icons/lu'
import { FaAngleDown } from 'react-icons/fa'
import { FaRegFile, FaXmark } from 'react-icons/fa6'
import { DatePicker, ConfigProvider, theme, Checkbox } from 'antd'
import { useTheme } from '../../../context/ThemeContext'

const MAIN_COLUMNS = [
  { key: 'user', label: 'Ism Sharifi', width: 180 },
  { key: 'project', label: 'Loyiha nomi', width: 200 },
  { key: 'expense_category', label: 'Xarajat turi', width: 180 },
  { key: 'type', label: 'Toifa', width: 250 },
  { key: 'amount', label: 'Miqdori (UZS)', width: 140 },
  { key: 'payment_method', label: 'To\'lov turi', width: 160 },
  { key: 'status', label: 'Holati', width: 140 },
  { key: 'reason', label: 'So\'rov sababi', width: 180 },
  { key: 'created_at', label: 'So\'ralgan vaqti', width: 190 },
  { key: 'paid_at', label: 'To\'langan vaqti', width: 160 },
  { key: 'confirmed_at', label: 'Tasdiqlangan vaqti', width: 200 },
  { key: 'accountant', label: 'Hisobchi', width: 200 },
  { key: 'cancelled_at', label: 'Bekor qilingan vaqti', width: 220 },
  { key: 'cancel_reason', label: 'Bekor qilish sababi', width: 180 },
  { key: 'card_number', label: 'Kart raqami', width: 180 },
]
import FilterSelect from '../Components/FilterSelect'
import { FilterInput } from './Components/FilterInput'
import EmployeeStep from "./Modals/EmployeeStep"
import { toast } from '../../../Toast/ToastProvider'
import { axiosAPI } from '../../../service/axiosAPI'
import dayjs from 'dayjs'
import { PiUsersThreeBold } from 'react-icons/pi'
import ProjectsStep from './Modals/ProjectsStep'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { FiCalendar } from 'react-icons/fi'
import { IoCloseCircle } from 'react-icons/io5'

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

const monthStart = dayjs().startOf('month').hour(0).minute(0).second(0).millisecond(0)
const monthEnd = dayjs().endOf('month').hour(23).minute(59).second(0).millisecond(0)

const initialFilters = {
  created_at_start: monthStart,
  created_at_end: monthEnd,
  confirmed_at_start: '',
  confirmed_at_end: '',
  paid_at_start: '',
  paid_at_end: '',
  cancelled_at_start: '',
  cancelled_at_end: '',
  amount_min: '',
  amount_max: '',
  payment_method: '',
  status: '',
  user: '',
  accountants: '',
  projects: '',
  type: '',
  expense_category: '',
}

const Employee = () => {
  const { isDark } = useTheme()
  const { setDownload, setPrint, clearDownload, clearPrint } = usePageAction()
  const [search, setSearch] = useState(null)
  const [filterModal, setFilterModal] = useState(false)
  const [filters, setFilters] = useState(initialFilters)
  const [selectEmployee, setSelectEmployee] = useState(false)
  const [selectAccountant, setSelectAccountant] = useState(false)
  const [selectProject, setSelectProject] = useState(false)
  const [UserReports, setUserReports] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [ReportsNextURL, setReportsNextURL] = useState(null)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const filterRef = useRef(null)
  const filterButtonRef = useRef(null)
  const RIGHT_PINNED_KEYS = ['created_at', 'paid_at', 'confirmed_at', 'accountant', 'cancelled_at', 'cancel_reason', 'card_number'];
  const [tablePin, setTablePin] = useState({
    number: false,
    user: false,
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
      toast.info("Yuklab olish uchun ma'lumot yo'q");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Xarajat so'rovlari");

    worksheet.columns = [
      { header: '№', key: 'id', width: 5 },
      { header: 'Ism Sharifi', key: 'name', width: 25 },
      { header: 'Loyiha nomi', key: 'project', width: 20 },
      { header: 'Xarajat turi', key: 'expense_category', width: 20 },
      { header: 'Toifa', key: 'type', width: 20 },
      { header: 'Miqdori (UZS)', key: 'amount', width: 20 },
      { header: "To'lov turi", key: 'payment_method', width: 15 },
      { header: 'Holati', key: 'status', width: 15 },
      { header: "So'rov sababi", key: 'reason', width: 25 },
      { header: "So'ralgan vaqti", key: 'created_at', width: 20 },
      { header: "To'langan vaqti", key: 'paid_at', width: 20 },
      { header: 'Tasdiqlangan vaqti', key: 'confirmed_at', width: 20 },
      { header: 'Hisobchi', key: 'accountant', width: 25 },
      { header: 'Bekor qilingan vaqti', key: 'cancelled_at', width: 20 },
      { header: 'Bekor sababi', key: 'cancel_reason', width: 25 },
      { header: 'Karta raqami', key: 'card_number', width: 25 },
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
        name: item.user || '',
        project: item.project || '',
        expense_category: item.expense_category || '',
        type: cost_type.find((t) => t.value === item.type)?.label || '',
        amount: item.amount || 0,
        payment_method: item.payment_method === 'card' ? 'Karta orqali' : item.payment_method === 'cash' ? 'Naqd pul' : item.payment_method || '',
        status: item.status === 'cancelled' ? 'Bekor qilingan' : item.status === 'paid' ? "To'langan" : item.status === 'confirmed' ? 'Tasdiqlangan' : item.status,
        reason: item.reason || '',
        created_at: item.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : '',
        paid_at: item.paid_at ? dayjs(item.paid_at).format('DD.MM.YYYY HH:mm') : '',
        confirmed_at: item.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : '',
        accountant: item.accountant || '',
        cancelled_at: item.cancelled_at ? dayjs(item.cancelled_at).format('DD.MM.YYYY HH:mm') : '',
        cancel_reason: item.cancel_reason || '',
        card_number: item.card_number ? String(item.card_number).replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') : ''
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
        } else if ([2, 3, 4, 5].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          fontColor = 'FF334155';
          isBold = colNumber === 2;
        } else if (colNumber === 6) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          fontColor = 'FF0F172A';
          isBold = true;
          cell.numFmt = '#,##0.00';
        } else {
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
    saveAs(blob, `Xarajat_sorovlari_${dayjs().format('DD_MM_YYYY')}.xlsx`);
  }

  const handlePdfDownload = () => {
    if (!UserReports || UserReports.length === 0) {
      toast.info("Yuklab olish uchun ma'lumot yo'q");
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', format: 'a3' });

    autoTable(doc, {
      head: [['№', 'Ism Sharifi', 'Loyiha nomi', 'Xarajat turi', 'Toifa', 'Miqdori (UZS)', "To'lov turi", 'Holati', "So'rov sababi", "So'ralgan vaqti", "To'langan vaqti", 'Tasdiqlangan vaqti', 'Hisobchi', 'Bekor qilingan vaqti', 'Bekor sababi', 'Karta raqami']],
      body: UserReports.map((item, index) => [
        index + 1,
        item.user || '',
        item.project || '',
        item.expense_category || '',
        cost_type.find((t) => t.value === item.type)?.label || '',
        formatNum(item.amount || 0),
        item.payment_method === 'card' ? 'Karta orqali' : item.payment_method === 'cash' ? 'Naqd pul' : item.payment_method || '',
        item.status === 'cancelled' ? 'Bekor qilingan' : item.status === 'paid' ? "To'langan" : item.status === 'confirmed' ? 'Tasdiqlangan' : item.status,
        item.reason || '',
        item.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : '',
        item.paid_at ? dayjs(item.paid_at).format('DD.MM.YYYY HH:mm') : '',
        item.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : '',
        item.accountant || '',
        item.cancelled_at ? dayjs(item.cancelled_at).format('DD.MM.YYYY HH:mm') : '',
        item.cancel_reason || '',
        item.card_number ? String(item.card_number).replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') : ''
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
        5: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
      },
      theme: 'grid',
      margin: { top: 15 },
      didDrawPage: function () {
        doc.setFontSize(14);
        doc.text("Xarajat so'rovlari", 14, 10);
      }
    });

    doc.save(`Xarajat_sorovlari_${dayjs().format('DD_MM_YYYY')}.pdf`);
  }

  const handleCsvDownload = () => {
    if (!UserReports || UserReports.length === 0) {
      toast.info("Yuklab olish uchun ma'lumot yo'q");
      return;
    }

    const csvData = UserReports.map((item, index) => ({
      '№': index + 1,
      'Ism Sharifi': item.user || '',
      'Loyiha nomi': item.project || '',
      'Xarajat turi': item.expense_category || '',
      'Toifa': cost_type.find((t) => t.value === item.type)?.label || '',
      'Miqdori (UZS)': item.amount || 0,
      "To'lov turi": item.payment_method === 'card' ? 'Karta orqali' : item.payment_method === 'cash' ? 'Naqd pul' : item.payment_method || '',
      'Holati': item.status === 'cancelled' ? 'Bekor qilingan' : item.status === 'paid' ? "To'langan" : item.status === 'confirmed' ? 'Tasdiqlangan' : item.status,
      "So'rov sababi": item.reason || '',
      "So'ralgan vaqti": item.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : '',
      "To'langan vaqti": item.paid_at ? dayjs(item.paid_at).format('DD.MM.YYYY HH:mm') : '',
      'Tasdiqlangan vaqti': item.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : '',
      'Hisobchi': item.accountant || '',
      'Bekor qilingan vaqti': item.cancelled_at ? dayjs(item.cancelled_at).format('DD.MM.YYYY HH:mm') : '',
      'Bekor sababi': item.cancel_reason || '',
      'Karta raqami': item.card_number ? String(item.card_number).replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') : ''
    }));

    const csvContent = "\uFEFF" + Papa.unparse(csvData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Xarajat_sorovlari_${dayjs().format('DD_MM_YYYY')}.csv`);
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
            <title>Xarajat so'rovlari</title>
            <style>
              @page { 
                size: landscape; 
                margin: 10mm; 
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
              .status-tolangan {
                background-color: #dbeafe;
                color: #1d4ed8;
              }
              .status-bekor {
                background-color: #fee2e2;
                color: #ef4444;
              }
              .status-boshqa {
                background-color: #fef3c7;
                color: #d97706;
              }
            </style>
          </head>
          <body>
            <h2>Xarajat so'rovlari</h2>
            <table>
              <thead>
                <tr>
                  <th>№</th>
                  <th>Ism Sharifi</th>
                  <th>Loyiha nomi</th>
                  <th>Xarajat turi</th>
                  <th>Toifa</th>
                  <th>Miqdori (UZS)</th>
                  <th>To'lov turi</th>
                  <th>Holati</th>
                  <th>So'rov sababi</th>
                  <th>So'ralgan vaqti</th>
                  <th>To'langan vaqti</th>
                  <th>Tasdiqlangan vaqti</th>
                  <th>Hisobchi</th>
                  <th>Bekor qilingan vaqti</th>
                  <th>Bekor sababi</th>
                  <th>Karta raqami</th>
                </tr>
              </thead>
              <tbody>
                ${UserReports.map((item, index) => {
      let statusClass = 'status-boshqa';
      let statusText = item.status === 'cancelled' ? 'Bekor qilingan' : item.status === 'paid' ? "To'langan" : item.status === 'confirmed' ? 'Tasdiqlangan' : item.status;

      if (item.status === 'confirmed') {
        statusClass = 'status-tasdiqlangan';
      } else if (item.status === 'paid') {
        statusClass = 'status-tolangan';
      } else if (item.status === 'cancelled') {
        statusClass = 'status-bekor';
      }

      return `
                  <tr>
                    <td class="center">${index + 1}</td>
                    <td class="bold">${item.user || ''}</td>
                    <td>${item.project || ''}</td>
                    <td class="center">${item.expense_category || ''}</td>
                    <td class="center">${cost_type.find((t) => t.value === item.type)?.label || ''}</td>
                    <td class="number">
                      ${item.amount ? Number(item.amount).toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    </td>
                    <td class="center">${item.payment_method === 'card' ? 'Karta orqali' : item.payment_method === 'cash' ? 'Naqd pul' : item.payment_method || ''}</td>
                    <td class="center">
                        ${statusText}
                    </td>
                    <td>${item.reason || ''}</td>
                    <td class="center">${item.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : ''}</td>
                    <td class="center">${item.paid_at ? dayjs(item.paid_at).format('DD.MM.YYYY HH:mm') : ''}</td>
                    <td class="center">${item.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : ''}</td>
                    <td>${item.accountant || ''}</td>
                    <td class="center">${item.cancelled_at ? dayjs(item.cancelled_at).format('DD.MM.YYYY HH:mm') : ''}</td>
                    <td class="number">${item.cancel_reason || ''}</td>
                    <td class="center">${item.card_number ? String(item.card_number).replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') : ''}</td>
                  </tr>
                `}).join('')}
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

      if (typeof value === 'string') {
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
    if (key === 'created_at_start' || key === 'created_at_end') {
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
      created_at_start: null,
      created_at_end: null
    })
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

  const handleSearch = () => {
    const params = sanitizeParams(filters)

    getEmployeeReports({ params, search })
  }

  return (
    <div className="relative">
      <div className='flex items-center justify-between'>
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)] dark:text-[#8E95B5]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Izlash..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 outline-none  bg-slate-100 border border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-soft)] dark:bg-[#222323] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5]"
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
            className={`flex items-center justify-between gap-2 h-8 px-5 pr-3! bg-slate-100 dark:bg-[#1E2021] dark:text-white! rounded-xl text-slate-600 text-sm font-semibold cursor-pointer relative border border-slate-200 dark:border-[#292A2A] ${showClearButton ? 'filter-notif' : ''}`}
          >
            <LuFilter size={16} />
            Filtrlash

            <FaAngleDown size={16} className={`transition-transform duration-300 ${!filterModal ? '-rotate-90' : ''}`} />
          </button>
          {showClearButton && (
            <button
              onClick={handleClear}
              className={`flex items-center justify-between gap-2 h-8 px-4 bg-[#f1f5f9] rounded-xl text-red-600 text-sm font-semibold cursor-pointer dark:bg-[#222323]`}
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
      <div className={`transition-all duration-300 ease-in-out w-full ${filterModal ? 'max-h-[1200px] opacity-100 pointer-events-auto' : 'max-h-0 opacity-0 pointer-events-none'} mt-4`}>
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
          <div className="grid grid-cols-4 gap-4 mb-2">
            <div className="col-span-4 lg:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">So'ralgan vaqt</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative flex-1">
                  <DatePicker
                    inputReadOnly
                    format="DD.MM.YYYY HH:mm"
                    value={filters.created_at_start}
                    onChange={(value) => handleFilterChange('created_at_start', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[#292A2A]! rounded-xl! text-sm dark:text-white! dark:bg-[#222323]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                    placeholder='Boshlanish sanasi'
                    suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[#8E95B5]" />}
                    allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[#8E95B5]" /> }}
                  />
                </div>
                <div className="relative flex-1">
                  <DatePicker
                    inputReadOnly
                    value={filters.created_at_end}
                    format="DD.MM.YYYY HH:mm"
                    onChange={(value) => handleFilterChange('created_at_end', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[#292A2A]! rounded-xl! text-sm dark:text-white! dark:bg-[#222323]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                    placeholder='Tugash sana'
                    suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[#8E95B5]" />}
                    allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[#8E95B5]" /> }}
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
                    value={filters.confirmed_at_start}
                    format="DD.MM.YYYY HH:mm"
                    onChange={(value) => handleFilterChange('confirmed_at_start', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[#292A2A]! rounded-xl! text-sm dark:text-white! dark:bg-[#222323]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                    placeholder='Boshlanish sanasi'
                    suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[#8E95B5]" />}
                    allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[#8E95B5]" /> }}
                  />
                </div>

                <div className="relative">
                  <DatePicker
                    inputReadOnly
                    value={filters.confirmed_at_end}
                    format="DD.MM.YYYY HH:mm"
                    onChange={(value) => handleFilterChange('confirmed_at_end', value)}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[#292A2A]! rounded-xl! text-sm dark:text-white! dark:bg-[#222323]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                    placeholder='Tugash sanasi'
                    suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[#8E95B5]" />}
                    allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[#8E95B5]" /> }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-4 mb-2">
            <div className="col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">To'langan vaqt</label>
              <div className="grid grid-cols-2 gap-3">
                <DatePicker
                  inputReadOnly
                  value={filters.paid_at_start}
                  format="DD.MM.YYYY HH:mm"
                  onChange={(value) => handleFilterChange('paid_at_start', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[#292A2A]! rounded-xl! text-sm dark:text-white! dark:bg-[#222323]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                  placeholder='Boshlanish sanasi'
                  suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[#8E95B5]" />}
                  allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[#8E95B5]" /> }}
                />
                <DatePicker
                  inputReadOnly
                  value={filters.paid_at_end}
                  format="DD.MM.YYYY HH:mm"
                  onChange={(value) => handleFilterChange('paid_at_end', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[#292A2A]! rounded-xl! text-sm dark:text-white! dark:bg-[#222323]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                  placeholder='Tugash sanasi'
                  suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[#8E95B5]" />}
                  allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[#8E95B5]" /> }}
                />
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Bekor qilingan vaqt</label>
              <div className="grid grid-cols-2 gap-3">
                <DatePicker
                  inputReadOnly
                  value={filters.cancelled_at_start}
                  format="DD.MM.YYYY HH:mm"
                  onChange={(value) => handleFilterChange('cancelled_at_start', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[#292A2A]! rounded-xl! text-sm dark:text-white! dark:bg-[#222323]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                  placeholder='Boshlanish sanasi'
                  suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[#8E95B5]" />}
                  allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[#8E95B5]" /> }}
                />
                <DatePicker
                  inputReadOnly
                  value={filters.cancelled_at_end}
                  format="DD.MM.YYYY HH:mm"
                  onChange={(value) => handleFilterChange('cancelled_at_end', value)}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[#292A2A]! rounded-xl! text-sm dark:text-white! dark:bg-[#222323]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                  placeholder='Tugash sanasi'
                  suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[#8E95B5]" />}
                  allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[#8E95B5]" /> }}
                />
              </div>
            </div>
          </div>

          {/* Row 3*/}
          <div className="grid grid-cols-4 gap-4 mb-2">
            <div className="col-span-2 md:col-span-2">
              <label className="block text-slate-500 dark:text-slate-400 text-xs font-semibold mb-2">Miqdor</label>
              <div className='grid grid-cols-2 gap-3'>
                <FilterInput
                  label="dan"
                  value={filters.amount_min}
                  className='bg-white'
                  onChange={(e) => handleFilterChange('amount_min', formatNum(e.target.value))}
                />
                <FilterInput
                  label="gacha"
                  value={filters.amount_max}
                  className='bg-white'
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
                className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[#222323] border border-slate-200 dark:border-[#292A2A] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d]  cursor-pointer ${filters?.accountants?.length > 0 ? 'filter-notif' : ''}`}
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
                className={`relative w-full h-11 flex items-center justify-between gap-2 px-4 bg-slate-100 dark:bg-[#222323] border border-slate-200 dark:border-[#292A2A] rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#2c2d2d]  cursor-pointer ${filters?.projects?.length > 0 ? 'filter-notif' : ''}`}
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
        </ConfigProvider>
      </div>

      {/* Table Section */}
      {
        isLoading ? (
          <div className="mt-6 rounded-2xl flex flex-col justify-center items-center h-[74vh] border border-slate-200 dark:border-[#292A2A] bg-white dark:bg-[#1E2021] p-10 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ma'lumotlar shakllantirilmoqda...</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Iltimos, biroz kuting.</p>
          </div>
        ) : !hasFetched ? (
          <div className="mt-6 rounded-2xl flex flex-col justify-center items-center h-[74vh] border border-slate-200 dark:border-[#292A2A] bg-white dark:bg-[#1E2021] p-10 text-center">
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
            <table className="text-left border-collapse w-full min-w-[2800px]">
              <thead className="bg-[#7186ED] text-white sticky top-0 z-20! dark:bg-[#1E2021]">
                <tr>
                  <th rowSpan={2} className="py-2 px-3 text-xs border-r bg-[#7186ED] dark:bg-[#1e2021]! font-bold border-[var(--stroke-sub)] dark:border-[#292A2A] text-center" >№</th>

                  {MAIN_COLUMNS.map((col) => {
                    const isRight = RIGHT_PINNED_KEYS.includes(col.key);
                    return (
                      <th
                        key={col.key}
                        className={`p-3 text-xs bg-[#7186ED] dark:bg-[#1e2021] font-bold border-r border-[var(--stroke-sub)] dark:border-[#292A2A] transition-all duration-300 ${tablePin[col.key] ? 'sticky z-50!' : 'z-20!'}`}
                        style={{
                          width: col.width,
                          minWidth: col.width,
                          maxWidth: col.width,
                          left: isRight ? undefined : getPinnedLeft(col.key),
                          right: isRight ? getPinnedRight(col.key) : undefined,
                          boxShadow: tablePin[col.key] ? (isRight ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)')) : 'none',
                          textAlign: col.key === 'number' ? 'center' : (col.key === 'user' || col.key === 'project' || col.key === 'accountant' || col.key === 'reason') ? 'start' : 'end'
                        }}
                      >
                        <div className={`flex items-center gap-2 ${col.key === 'number' ? 'justify-center' : (col.key === 'user' || col.key === 'project' || col.key === 'accountant' || col.key === 'reason') ? 'justify-start' : 'justify-end'}`}>
                          <Checkbox
                            checked={tablePin[col.key]}
                            onChange={(e) => handlePin(col.key, e.target.checked)}
                            className="custom-header-checkbox"
                          />
                          {col.label}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1E2021] dark:text-slate-300">

                {UserReports.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-[#292A2A] hover:bg-slate-50 dark:hover:bg-[#252626] transition-colors">
                    <td className={`p-3 text-xs text-slate-500 border-t border-[var(--stroke-sub)] dark:border-[#292A2A] text-center z-10! bg-white dark:bg-[#1E2021] transition-all duration-300 border-r`}>
                      {index + 1}
                    </td>
                    {MAIN_COLUMNS.map((col) => {
                      const isPinned = !!tablePin[col.key];
                      const isRight = RIGHT_PINNED_KEYS.includes(col.key);

                      let content = null;
                      switch (col.key) {
                        case 'user': content = item.user; break;
                        case 'project': content = item.project; break;
                        case 'expense_category': content = item.expense_category; break;
                        case 'type': content = cost_type.find((t) => t.value === item.type)?.label; break;
                        case 'amount': content = item.amount ? formatNum(item.amount) : ''; break;
                        case 'payment_method': content = item.payment_method === 'card' ? 'Karta orqali' : item.payment_method === 'cash' ? 'Naqd pul' : item.payment_method; break;
                        case 'status': content = item.status === 'cancelled' ? 'Bekor qilingan' : item.status === 'paid' ? 'To\'langan' : item.status === 'confirmed' ? 'Tasdiqlangan' : item.status; break;
                        case 'reason': content = item.reason; break;
                        case 'created_at': content = item.created_at ? dayjs(item.created_at).format('DD.MM.YYYY HH:mm') : ''; break;
                        case 'paid_at': content = item.paid_at ? dayjs(item.paid_at).format('DD.MM.YYYY HH:mm') : ''; break;
                        case 'confirmed_at': content = item.confirmed_at ? dayjs(item.confirmed_at).format('DD.MM.YYYY HH:mm') : ''; break;
                        case 'accountant': content = item.accountant; break;
                        case 'cancelled_at': content = item.cancelled_at ? dayjs(item.cancelled_at).format('DD.MM.YYYY HH:mm') : ''; break;
                        case 'cancel_reason': content = item.cancel_reason; break;
                        case 'card_number': content = item.card_number ? String(item.card_number).replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') : ''; break;
                        default: content = '';
                      }

                      return (
                        <td
                          key={col.key}
                          className={`p-3 text-xs border-r border-t border-[var(--stroke-sub)] dark:border-[#292A2A] bg-white dark:bg-[#1E2021] transition-all duration-300 ${isPinned ? 'sticky z-10!' : ''} ${col.key === 'number' ? 'text-slate-500 text-center' : (col.key === 'user' || col.key === 'project') ? 'font-semibold text-slate-700 dark:text-slate-200 text-start' : (col.key === 'amount' ? 'font-bold text-slate-900 dark:text-white text-end' : 'text-slate-600 dark:text-slate-400 text-end')} ${(col.key === 'payment_method' || col.key === 'status' || col.key === 'created_at' || col.key === 'paid_at' || col.key === 'confirmed_at' || col.key === 'cancelled_at' || col.key === 'card_number') ? 'text-center' : ''} ${col.key === 'reason' || col.key === 'accountant' ? 'text-start' : ''}`}
                          style={{
                            width: col.width,
                            minWidth: col.width,
                            maxWidth: col.width,
                            left: isRight ? undefined : getPinnedLeft(col.key),
                            right: isRight ? getPinnedRight(col.key) : undefined,
                            boxShadow: isPinned ? (isRight ? (isDark ? 'inset 1px 0 0 0 #292A2A' : 'inset 1px 0 0 0 var(--stroke-sub)') : (isDark ? 'inset -1px 0 0 0 #292A2A' : 'inset -1px 0 0 0 var(--stroke-sub)')) : 'none'
                          }}
                        >
                          {content}
                        </td>
                      );
                    })}
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
          onConfirm={handleSelectEmployeeConfirm}
          title="Xodimlar tanlang"
          employee_role='employee'
          onClose={() => setSelectEmployee(false)}
        />
      )}

      {selectAccountant && (
        <EmployeeStep
          selectedList={filters.accountants ? filters.accountants.split(',') : []}
          onConfirm={handleSelectAccountantConfirm}
          param={{ roles: "accountant" }}
          title="Hisobchilar tanlang"
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