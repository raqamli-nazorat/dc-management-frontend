/**
 * Meeting code and URL helpers
 * Generates and parses URLs in the format: /meetings/<id>-<uid>
 * For example: id=12, uid="54sa-asq4" => "12-54sa-asq4"
 */

export function getMeetingCode(id) {
  if (id !== undefined && id !== null && String(id).trim()) {
    return String(id).trim()
  }
  return ''
}

export function parseMeetingId(param) {
  if (!param) return null
  const str = String(param).trim()

  // Agar "12-54sa-asq4" ko'rinishida bo'lsa, birinchi "-" gacha bo'lgan id qismini kesib olamiz
  const dashIndex = str.indexOf('-')
  if (dashIndex > 0) {
    const firstPart = str.slice(0, dashIndex)
    if (/^\d+$/.test(firstPart)) {
      return firstPart
    }
  }

  // Agar faqat raqam bo'lsa (masalan "12")
  if (/^\d+$/.test(str)) {
    return str
  }

  return null
}

export function getFullMeetingUrl(id, uid) {
  const code = getMeetingCode(id, uid)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/meetings/${code}`
}
