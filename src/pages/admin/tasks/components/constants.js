export const TASKS_DATA = [
  { id: 1, code: 'TASD', name: "Dashboard qo'shish", project: 'Crm sistema', creator: "Dudan Turg'unov", assignee: "Dudan Turg'unov", type: "Qo'shimcha", level: 'Kritik', status: 'Jarayonda', deadline: '01.01.2024 20:00' },
  { id: 2, code: 'TASD', name: 'Login sahifasi',     project: 'Dashboard',    creator: "To'raqul Fozilov", assignee: "To'raqul Fozilov", type: 'Xato',        level: 'Yuqori',  status: 'Bajarildi',  deadline: '15.02.2024 18:00' },
  { id: 3, code: 'TASD', name: 'API integratsiya',   project: 'SaaS loyiha',  creator: 'Davron Turdiyev',  assignee: 'Davron Turdiyev',  type: 'Vazifa',      level: "O'rta",   status: 'Kutilmoqda', deadline: '01.03.2024 10:00' },
]

export const PROJECTS_LIST = [
  { id: 1, name: 'Marketing Platform',  desc: 'Marketing platformasi reklama', date: '15.04.2026' },
  { id: 2, name: 'E-commerce Site',     desc: 'E-commerce sayti mahsulotla',   date: '20.05.2026' },
  { id: 3, name: 'Analytics Dashboard', desc: "Analytics dashboardi ma'lumo",  date: '30.06.2026' },
  { id: 4, name: 'Crm sistema',         desc: 'CRM tizimi',                    date: '01.01.2026' },
  { id: 5, name: 'Dashboard',           desc: 'Boshqaruv paneli',              date: '01.02.2026' },
  { id: 6, name: 'SaaS loyiha',         desc: 'SaaS platforma',                date: '01.03.2026' },
]

export const EMPLOYEES_LIST = [
  { name: 'Марк Леонидов',      role: 'Dizayner' },
  { name: 'Марина Иванова',     role: 'Dasturchi' },
  { name: 'Nodira Xodjayeva',   role: 'Frontend dasturchi' },
  { name: 'Olimjon Isayev',     role: 'UI/UX dizayner' },
  { name: 'Malika Tashkentova', role: 'Mahsulot menejeri' },
  { name: 'Lazizbek Rahimov',   role: 'Mobil dasturchi' },
  { name: "Dudan Turg'unov",    role: 'Menejer' },
  { name: "To'raqul Fozilov",   role: 'Menejer' },
]

export const PROJECTS  = PROJECTS_LIST.map(p => p.name)
export const ASSIGNEES = EMPLOYEES_LIST.map(e => e.name)
export const LEVELS    = ['Past', "O'rta", 'Yuqori', 'Kritik']
export const TYPES     = ['Xatoli', "Qo'shimcha", 'Tadqiqot', 'Yangi funksiya']
export const STATUSES  = ['Jarayonda', 'Bajarildi', 'Kutilmoqda', 'Bekor qilindi']

export const EMPTY_FILTER = { project: '', level: '', type: '', status: '', assignee: '' }

export const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'

export const fmtNum = raw => {
  const clean = raw.replace(/[^\d.]/g, '').replace(/^(\d*\.?\d*).*$/, '$1')
  const [int, dec] = clean.split('.')
  const formatted = (int || '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return dec !== undefined ? `${formatted}.${dec}` : formatted
}
