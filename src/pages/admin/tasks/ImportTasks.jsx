import { useRef, useState } from 'react'
import { FaXmark, FaFileExcel, FaDownload, FaCircleCheck, FaTriangleExclamation } from 'react-icons/fa6'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'
import { parseApiError } from '../../../service/parseApiError'
import {
  downloadTaskTemplate,
  readTaskFile,
  buildTaskBody,
  normKey,
} from './taskImport'

const listFrom = (res) => {
  const payload = res?.data?.data ?? res?.data
  const list = Array.isArray(payload) ? payload : (payload?.results ?? [])
  return Array.isArray(list) ? list : []
}

export default function ImportTasks({ onImported }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [result, setResult] = useState(null) // { created, failed: [{excelRow, title, reason}] }

  const openPicker = () => { if (!busy) fileRef.current?.click() }

  const handleTemplate = async () => {
    try {
      await downloadTaskTemplate()
    } catch {
      toast.error('Xatolik', 'Namuna shablonni yaratib bo‘lmadi')
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // bir xil faylni qayta tanlash mumkin bo‘lsin
    if (!file) return

    setBusy(true)
    setResult(null)
    setProgress({ done: 0, total: 0 })

    try {
      // 1) O‘qish + sarlavhalarni tekshirish
      let rows
      try {
        rows = await readTaskFile(file)
      } catch (err) {
        if (err?.headerMismatch) {
          toast.error('Ustunlar mos emas', err.message)
        } else {
          toast.error('Faylni o‘qishda xatolik', "Faqat to‘g‘ri .xlsx/.xls fayl yuklang")
        }
        return
      }
      if (!rows.length) {
        toast.error("Bo‘sh fayl", "Faylда yuklash uchun qator topilmadi")
        return
      }

      // 2) Ma‘lumotnomalarni yuklash (loyiha + lavozim)
      const [projRes, posRes] = await Promise.all([
        axiosAPI.get('/project-shorts/', { params: { page_size: 500 } }).catch(() => null),
        axiosAPI.get('/applications/positions/', { params: { page_size: 200 } }).catch(() => null),
      ])
      const projects = listFrom(projRes)
      const positions = listFrom(posRes)

      const projByName = new Map()
      const projById = new Map()
      projects.forEach(p => {
        if (p?.title) projByName.set(normKey(p.title), p)
        if (p?.id != null) projById.set(String(p.id), p)
      })
      const posByName = new Map()
      const posById = new Map()
      positions.forEach(p => {
        if (p?.name) posByName.set(normKey(p.name), p)
        if (p?.id != null) posById.set(String(p.id), p)
      })

      const findProject = (v) => projById.get(String(v).trim()) || projByName.get(normKey(v)) || null
      const findPosition = (v) => posById.get(String(v).trim()) || posByName.get(normKey(v)) || null

      // 3) Topshiruvchisi bor qatorlarning loyiha xodimlarini yuklash
      const projectIdsWithAssignee = new Set()
      rows.forEach(r => {
        const hasAssignee = String(r.data.assignee ?? '').trim() !== ''
        if (!hasAssignee) return
        const proj = findProject(r.data.project)
        if (proj) projectIdsWithAssignee.add(proj.id)
      })

      const employeesByProject = new Map() // projectId -> Map(normUsername -> emp)
      await Promise.all(
        [...projectIdsWithAssignee].map(async (pid) => {
          try {
            const res = await axiosAPI.get(`/projects/${pid}/`)
            const proj = res?.data?.data ?? res?.data
            const emps = Array.isArray(proj?.employees_info) ? proj.employees_info : []
            const map = new Map()
            emps.forEach(emp => { if (emp?.username) map.set(normKey(emp.username), emp) })
            employeesByProject.set(pid, map)
          } catch {
            employeesByProject.set(pid, new Map())
          }
        })
      )
      const findEmployee = (projectId, username) =>
        employeesByProject.get(projectId)?.get(normKey(username)) || null

      // 4) Har bir qatorni tekshirish + body yasash
      const ctx = { findProject, findPosition, findEmployee }
      const valid = []
      const failed = []
      rows.forEach(r => {
        const { body, errors } = buildTaskBody(r.data, ctx)
        const title = String(r.data.title ?? '').trim() || '—'
        if (errors.length) failed.push({ excelRow: r.excelRow, title, reason: errors.join('; ') })
        else valid.push({ excelRow: r.excelRow, title, body })
      })

      // 5) Yaroqli qatorlarni birin-ketin backendga yuborish
      let created = 0
      setProgress({ done: 0, total: valid.length })
      for (let i = 0; i < valid.length; i++) {
        const item = valid[i]
        try {
          await axiosAPI.post('/tasks/', item.body)
          created++
        } catch (err) {
          failed.push({
            excelRow: item.excelRow,
            title: item.title,
            reason: parseApiError(err, 'Backend xatosi'),
          })
        }
        setProgress({ done: i + 1, total: valid.length })
      }

      // 6) Natija
      failed.sort((a, b) => a.excelRow - b.excelRow)
      setResult({ created, failed, total: rows.length })
      if (created > 0) {
        toast.success('Yuklandi', `${created} ta vazifa qo‘shildi${failed.length ? `, ${failed.length} ta qator o‘tkazib yuborildi` : ''}`)
        onImported?.()
      } else if (failed.length) {
        toast.error('Hech narsa qo‘shilmadi', `${failed.length} ta qatorда xatolik bor`)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Namuna shablon */}
      <button onClick={handleTemplate} disabled={busy} type="button"
        title="Namuna shablonni yuklab olish"
        className="relative flex items-center gap-1.5 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border cursor-pointer disabled:opacity-50
          bg-[#F1F3F9] border-[var(--stroke-sub)] text-[var(--text-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-sub)]">
        <FaDownload size={12} /> Namuna
      </button>

      {/* Vazifa yuklash */}
      <button onClick={openPicker} disabled={busy} type="button"
        className="relative flex items-center gap-1.5 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border cursor-pointer disabled:opacity-60
          bg-[var(--accent-strong)] border-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]">
        <FaFileExcel size={13} /> {busy ? 'Yuklanmoqda…' : 'Vazifa yuklash'}
      </button>

      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />

      {/* Jarayon overlay */}
      {busy && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/50" />
          <div className="relative w-full max-w-[360px] rounded-2xl bg-[var(--bg-base)] p-6 shadow-2xl text-center">
            <svg className="animate-spin w-8 h-8 mx-auto mb-3 text-[var(--accent-strong)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-sm font-semibold text-[var(--text-strong)]">Vazifalar yuklanmoqda…</p>
            {progress.total > 0 && (
              <p className="text-xs text-[var(--text-sub)] mt-1">{progress.done} / {progress.total}</p>
            )}
          </div>
        </div>
      )}

      {/* Natija modal */}
      {result && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setResult(null)} />
          <div className="relative w-full max-w-[520px] max-h-[80vh] flex flex-col rounded-2xl bg-[var(--bg-base)] shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[17px] font-extrabold text-[var(--text-strong)]">Yuklash natijasi</h3>
                <p className="text-sm text-[var(--text-sub)] mt-0.5">Jami {result.total} ta qator</p>
              </div>
              <button onClick={() => setResult(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-elevation-1)] text-[var(--text-sub)] cursor-pointer">
                <FaXmark size={14} />
              </button>
            </div>

            <div className="px-6 flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm font-bold">
                <FaCircleCheck size={14} /> {result.created} ta qo‘shildi
              </div>
              {result.failed.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm font-bold">
                  <FaTriangleExclamation size={14} /> {result.failed.length} ta xato
                </div>
              )}
            </div>

            {result.failed.length > 0 && (
              <div className="px-6 py-4 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                <p className="text-xs font-bold text-[var(--text-sub)] mb-2 uppercase">O‘tkazib yuborilgan qatorlar</p>
                <div className="flex flex-col gap-2">
                  {result.failed.map((f, i) => (
                    <div key={i} className="rounded-xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] p-3">
                      <p className="text-sm font-semibold text-[var(--text-strong)]">
                        <span className="text-[var(--text-soft)]">{f.excelRow}-qator:</span> {f.title}
                      </p>
                      <p className="text-xs text-red-500 mt-1 whitespace-pre-wrap">{f.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="px-6 py-4 mt-auto border-t border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] flex justify-end">
              <button onClick={() => setResult(null)}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)] cursor-pointer">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
