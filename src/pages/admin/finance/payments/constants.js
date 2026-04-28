export const XARAJAT_TURLARI = ['Kompaniya xarajatlari', "Mablag' chiqarish", 'Boshqa xarajatlar', 'Moliyaviy']
export const TOIFALAR = ['Sayohat uchun', "Yo'l kira uchun", 'Ovqatlanish uchun', 'Mukofotlar']
export const TOLOV_TURLARI = ["Naqd pulda", "Karta orqali", "Bank o'tkazmasi", "Elektron to'lov"]

export const LOYIHALAR = [
  { name: 'Marketing Platform', desc: 'Marketing platformasi reklama', date: '15.04.2026' },
  { name: 'E-commerce Site', desc: 'E-commerce sayti mahsulotla', date: '20.05.2026' },
  { name: 'Analytics Dashboard', desc: "Analytics dashboardi ma'lumo", date: '30.06.2026' },
  { name: 'Social Media Manager', desc: 'Ijtimoiy tarmoqlarni boshqarish', date: '15.07.2026' },
  { name: 'Email Marketing Tool', desc: 'Email marketing vositalari mijo', date: '10.09.2026' },
  { name: 'Customer Relationship Management', desc: 'Mijozlar bilan aloqalarni boshqa', date: '25.10.2026' },
]

export const EMPTY_FILTER = {
  type: '', toifa: '', loyiha: '', sumFrom: '', sumTo: '',
  dateFromD: '', dateFromT: '', dateToD: '', dateToT: '',
  approvedFromD: '', approvedFromT: '', approvedToD: '', approvedToT: '',
  completedFromD: '', completedFromT: '', completedToD: '', completedToT: '',
  myTasks: false,
}

export function fmt(n) {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtMoney(raw) {
  const digits = raw.replace(/\D/g, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function fmtCard(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

export const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'
