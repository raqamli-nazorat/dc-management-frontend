/**
 * Backend'dan kelgan xatolik xabarini oladi.
 * Bu backend { data: null, error: {...}, success: false } formatida qaytaradi.
 * Django REST Framework odatda quyidagi formatda qaytaradi:
 * { "detail": "..." }
 * { "message": "..." }
 * { "field": ["xato"] }
 * { "non_field_errors": ["xato"] }
 */
export function getErrorMessage(err, fallback = 'Xatolik yuz berdi.') {
  const data = err?.response?.data
  if (!data) return err?.message || fallback

  // { data: null, error: { errorMsg, details, ... }, success: false }
  const inner = data.error ?? data

  // details ob'ekt yoki array bo'lsa — ularni birlashtirib ko'rsatish
  if (inner.details) {
    if (Array.isArray(inner.details) && inner.details.length) {
      return inner.details.join('\n')
    }
    if (typeof inner.details === 'object') {
      const msgs = Object.entries(inner.details)
        .map(([, v]) => Array.isArray(v) ? v[0] : v)
        .filter(Boolean)
      if (msgs.length) return msgs.join('\n')
    }
  }

  // { errorMsg: "..." } — bu backend'ning asosiy formati
  if (typeof inner.errorMsg === 'string') return inner.errorMsg

  // { detail: "..." }
  if (typeof inner.detail === 'string') return inner.detail

  // { message: "..." }
  if (typeof inner.message === 'string') return inner.message

  // { non_field_errors: ["..."] }
  if (Array.isArray(inner.non_field_errors) && inner.non_field_errors.length)
    return inner.non_field_errors[0]

  // { field: ["xato1", ...] }
  const firstKey = Object.keys(inner)[0]
  if (firstKey) {
    const val = inner[firstKey]
    if (Array.isArray(val) && val.length) return `${firstKey}: ${val[0]}`
    if (typeof val === 'string') return `${firstKey}: ${val}`
  }

  return fallback
}
