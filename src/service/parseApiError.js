/**
 * API xatolik xabarini parse qilish
 * details: array yoki object bo'lishi mumkin
 * { error: { errorMsg, details: [...] | {...} } }
 */
export function parseApiError(err, fallback = 'Xatolik yuz berdi') {
  const error = err?.response?.data?.error
  if (!error) return err?.response?.data?.detail || fallback
  const { errorMsg, details, isFriendly } = error

  // isFriendly bo'lsa — errorMsg ni to'g'ridan-to'g'ri qaytaramiz
  if (isFriendly && errorMsg) return errorMsg

  if (details) {
    if (Array.isArray(details) && details.length > 0) {
      return details.join('\n')
    }
    if (typeof details === 'object' && !Array.isArray(details)) {
      const msgs = Object.entries(details)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
        .join('\n')
      if (msgs) return msgs
    }
  }
  return errorMsg || fallback
}
