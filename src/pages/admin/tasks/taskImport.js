import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

// ── Excel import/shablon ustunlari ──
// required: true bo'lsa sarlavhada " *" qo'shiladi va qizil rangda chiqadi.
export const IMPORT_COLUMNS = [
  { key: 'project',       header: 'Loyiha',        required: true,  example: 'DC Monitoring' },
  { key: 'title',         header: 'Vazifa nomi',   required: true,  example: 'Login sahifasi xatosi' },
  { key: 'priority',      header: 'Daraja',        required: true,  example: 'Yuqori' },
  { key: 'type',          header: 'Turi',          required: true,  example: 'Xatolik' },
  { key: 'description',   header: 'Tavsif',        required: false, example: 'Login bosilganda 500 xatolik chiqyapti' },
  { key: 'assignee',      header: 'Topshiruvchi',  required: false, example: 'aziz' },
  { key: 'position',      header: 'Lavozim',       required: false, example: 'Backend dasturchi' },
  { key: 'sprint',        header: 'Sprint',        required: false, example: '1' },
  { key: 'task_price',    header: 'Vazifa narxi',  required: false, example: '500000' },
  { key: 'penalty',       header: 'Jarima foizi',  required: false, example: '10' },
  { key: 'deadline_date', header: 'Muddat (sana)', required: false, example: '31.12.2026' },
  { key: 'deadline_time', header: 'Muddat vaqti',  required: false, example: '18:00' },
  { key: 'est_hours',     header: 'Reja (soat)',   required: false, example: '4' },
  { key: 'est_minutes',   header: 'Reja (daqiqa)', required: false, example: '30' },
]

const headerText = (c) => (c.required ? `${c.header} *` : c.header)

// ── Daraja / Tur xaritalari (o'zbekcha matn YOKI inglizcha kod) ──
const PRIORITY_MAP = {
  past: 'low', low: 'low',
  orta: 'medium', medium: 'medium',
  yuqori: 'high', high: 'high',
  kritik: 'critical', critical: 'critical',
}
const TYPE_MAP = {
  xatolik: 'bug', 'xatolik (bug)': 'bug', bug: 'bug',
  'yangi funksiya': 'feature', feature: 'feature',
  qoshimcha: 'extra', extra: 'extra', improvement: 'extra',
  tadqiqot: 'research', 'tadqiqot/organish': 'research', organish: 'research', research: 'research',
}

// Apostrof variantlarini olib tashlab, kichik harf + bo'sh joylarni siqish
const norm = (v) =>
  String(v ?? '')
    .replace(/['’`ʻ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

// Sarlavha solishtirish uchun (yulduzchani ham olib tashlaydi)
const normHeader = (v) => norm(v).replace(/\*/g, '').trim()

export const mapPriority = (v) => PRIORITY_MAP[norm(v)] || null
export const mapType = (v) => TYPE_MAP[norm(v)] || null

// Loyiha/lavozim/xodim nomlarini solishtirish uchun kalit normalizatsiyasi
export const normKey = (v) => norm(v)

// ── Excel katak qiymatini xom holda olish ──
function cellRaw(cell) {
  if (!cell) return null
  const v = cell.value
  if (v === null || v === undefined) return null
  if (v instanceof Date) return v
  if (typeof v === 'object') {
    if (v.text !== undefined) return v.text            // hyperlink
    if (v.result !== undefined) return v.result        // formula
    if (Array.isArray(v.richText)) return v.richText.map(t => t.text).join('')
    return null
  }
  return v
}

const asStr = (v) => {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return ''
  return String(v).trim()
}

// Sana → "YYYY-MM-DD" (Date katak yoki "KK.OO.YYYY" / "YYYY-MM-DD" matn)
function parseDate(v) {
  if (v === null || v === undefined || v === '') return null
  if (v instanceof Date) {
    const y = v.getUTCFullYear(), m = v.getUTCMonth() + 1, d = v.getUTCDate()
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  const s = String(v).trim()
  let m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/) // KK.OO.YYYY
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/) // YYYY-MM-DD
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  return null
}

// Vaqt → "HH:MM" (Date katak yoki "18:00" matn)
function parseTime(v) {
  if (v === null || v === undefined || v === '') return null
  if (v instanceof Date) {
    return `${String(v.getUTCHours()).padStart(2, '0')}:${String(v.getUTCMinutes()).padStart(2, '0')}`
  }
  const m = String(v).trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const h = Math.min(23, Number(m[1])), mi = Math.min(59, Number(m[2]))
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`
}

// ── Namuna shablonni yuklab olish ──
export async function downloadTaskTemplate() {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Vazifalar')
  ws.columns = IMPORT_COLUMNS.map(c => ({
    header: headerText(c),
    key: c.key,
    width: Math.max(16, c.header.length + 6),
  }))
  // Sarlavha qatori
  const head = ws.getRow(1)
  head.height = 22
  head.eachCell((cell, col) => {
    const c = IMPORT_COLUMNS[col - 1]
    cell.font = { bold: true, color: { argb: c?.required ? 'FFCC0000' : 'FF1F2937' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F3F9' } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } } }
  })
  // Misol qator
  const example = {}
  IMPORT_COLUMNS.forEach(c => { example[c.key] = c.example })
  const ex = ws.addRow(example)
  ex.font = { italic: true, color: { argb: 'FF9CA3AF' } }

  const buf = await wb.xlsx.writeBuffer()
  saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'vazifa-shablon.xlsx')
}

// ── Faylni o'qish + sarlavhalarni tekshirish ──
// Qaytaradi: [{ excelRow, data: {key: value} }]
// Sarlavhalar mos kelmasa: Error(headerMismatch = true) tashlaydi.
export async function readTaskFile(file) {
  const wb = new ExcelJS.Workbook()
  const buf = await file.arrayBuffer()
  await wb.xlsx.load(buf)
  const ws = wb.worksheets[0]
  if (!ws) {
    const e = new Error("Faylда ma'lumot varag'i topilmadi.")
    e.headerMismatch = true
    throw e
  }

  const knownByNorm = {}
  IMPORT_COLUMNS.forEach(c => { knownByNorm[normHeader(c.header)] = c.key })

  const colKeyByIndex = {} // Excel ustun raqami -> template key
  const unknown = []
  ws.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const h = normHeader(asStr(cellRaw(cell)))
    if (!h) return
    if (knownByNorm[h]) colKeyByIndex[colNumber] = knownByNorm[h]
    else unknown.push(asStr(cellRaw(cell)))
  })

  const presentKeys = new Set(Object.values(colKeyByIndex))
  const missingRequired = IMPORT_COLUMNS.filter(c => c.required && !presentKeys.has(c.key))
  if (missingRequired.length || unknown.length) {
    const parts = []
    if (missingRequired.length) parts.push('Yetishmayotgan majburiy ustun(lar): ' + missingRequired.map(c => c.header).join(', '))
    if (unknown.length) parts.push("Noma'lum ustun(lar): " + unknown.join(', '))
    const e = new Error(parts.join('. ') + '. Iltimos, namuna shablonдан foydalaning.')
    e.headerMismatch = true
    throw e
  }

  const rows = []
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return
    const data = {}
    let hasAny = false
    Object.entries(colKeyByIndex).forEach(([idx, key]) => {
      const v = cellRaw(row.getCell(Number(idx)))
      data[key] = v
      if (v !== null && v !== undefined && String(v).trim() !== '') hasAny = true
    })
    if (hasAny) rows.push({ excelRow: rowNumber, data })
  })
  return rows
}

// ── Bitta qatordan backend body yasash + xatolarni yig'ish ──
// ctx: { findProject(nameOrId), findPosition(nameOrId), findEmployee(projectId, username) }
// Qaytaradi: { body, projectId, errors: [string] }
export function buildTaskBody(data, ctx) {
  const errors = []
  const body = { status: 'todo' }
  let projectId = null

  // 1) Loyiha (majburiy)
  const projVal = asStr(data.project) || (data.project != null ? String(data.project) : '')
  if (!projVal) {
    errors.push('Loyiha kiritilmagan')
  } else {
    const proj = ctx.findProject(projVal)
    if (!proj) errors.push(`Loyiha topilmadi: "${projVal}"`)
    else { body.project = proj.id; projectId = proj.id }
  }

  // 2) Vazifa nomi (majburiy)
  const title = asStr(data.title)
  if (!title) errors.push('Vazifa nomi kiritilmagan')
  else body.title = title

  // 3) Daraja (majburiy)
  if (!asStr(data.priority)) errors.push('Daraja kiritilmagan')
  else {
    const pr = mapPriority(data.priority)
    if (!pr) errors.push(`Noma'lum daraja: "${asStr(data.priority)}"`)
    else body.priority = pr
  }

  // 4) Turi (majburiy)
  if (!asStr(data.type)) errors.push('Turi kiritilmagan')
  else {
    const ty = mapType(data.type)
    if (!ty) errors.push(`Noma'lum tur: "${asStr(data.type)}"`)
    else body.type = ty
  }

  // 5) Tavsif
  if (asStr(data.description)) body.description = asStr(data.description)

  // 6) Topshiruvchi (loyiha xodimi bo'lishi shart)
  const assigneeName = asStr(data.assignee)
  if (assigneeName) {
    if (!projectId) {
      // loyiha aniqlanmagani uchun xodimni tekshirib bo'lmaydi (yuqorida xato bor)
    } else {
      const emp = ctx.findEmployee(projectId, assigneeName)
      if (!emp) errors.push(`Topshiruvchi "${assigneeName}" bu loyiha xodimlari orasida topilmadi`)
      else body.assignee = emp.id
    }
  }

  // 7) Lavozim
  const posName = asStr(data.position)
  if (posName) {
    const pos = ctx.findPosition(posName)
    if (!pos) errors.push(`Lavozim topilmadi: "${posName}"`)
    else body.position = pos.id
  }

  // 8) Sprint (1-10)
  const sprintStr = asStr(data.sprint)
  if (sprintStr) {
    const n = parseInt(sprintStr, 10)
    if (!Number.isFinite(n) || n < 1 || n > 10) errors.push(`Sprint 1-10 oralig'ida bo'lishi kerak: "${sprintStr}"`)
    else body.sprint = n
  }

  // 9) Vazifa narxi
  const priceStr = asStr(data.task_price).replace(/\s/g, '').replace(',', '.')
  if (priceStr) {
    if (!/^\d+(\.\d+)?$/.test(priceStr)) errors.push(`Vazifa narxi noto'g'ri: "${asStr(data.task_price)}"`)
    else body.task_price = priceStr
  }

  // 10) Jarima foizi (0-100)
  const penStr = asStr(data.penalty).replace(',', '.')
  if (penStr) {
    const p = Number(penStr)
    if (!Number.isFinite(p) || p < 0 || p > 100) errors.push(`Jarima foizi 0-100 oralig'ida bo'lishi kerak: "${penStr}"`)
    else body.penalty_percentage = penStr
  }

  // 11-12) Muddat (sana + vaqt)
  if (data.deadline_date !== null && data.deadline_date !== undefined && String(data.deadline_date).trim() !== '') {
    const date = parseDate(data.deadline_date)
    if (!date) errors.push("Muddat sanasi noto'g'ri (KK.OO.YYYY): \"" + asStr(data.deadline_date) + '"')
    else {
      const time = parseTime(data.deadline_time) || '00:00'
      body.deadline = `${date}T${time}:00`
    }
  }

  // 13-14) Reja vaqti
  const hrs = parseInt(asStr(data.est_hours), 10) || 0
  const mins = parseInt(asStr(data.est_minutes), 10) || 0
  if (hrs || mins) {
    body.estimated_input_hours = hrs
    body.estimated_input_minutes = mins
  }

  return { body, projectId, assigneeName, errors }
}
