/**
 * Meeting code and URL helpers
 * URL format: /meetings/<uid-lowercase>
 * For example: uid="MT-511" => "mt-511"
 * Fallback to numeric id if uid not available.
 */

/**
 * Returns the slug to use in the URL.
 * Prefers uid (lowercased), falls back to numeric id.
 */
export function getMeetingCode(id, uid) {
  if (uid && String(uid).trim()) {
    return String(uid).trim().toLowerCase()
  }
  if (id !== undefined && id !== null && String(id).trim()) {
    return String(id).trim()
  }
  return ''
}

/**
 * Parses the numeric meeting id from a URL param.
 * Handles both pure numeric ids ("224") and uid-style strings ("mt-511").
 * Returns numeric string if found, else null (uid-style needs a backend lookup).
 */
export function parseMeetingId(param) {
  if (!param) return null
  const str = String(param).trim()

  // Pure numeric e.g. "224"
  if (/^\d+$/.test(str)) {
    return str
  }

  // "12-54sa-asq4" style: first part before dash is numeric id
  const dashIndex = str.indexOf('-')
  if (dashIndex > 0) {
    const firstPart = str.slice(0, dashIndex)
    if (/^\d+$/.test(firstPart)) {
      return firstPart
    }
  }

  // uid-style ("mt-511") — cannot extract numeric id, return null
  // MeetingRoom will do a backend lookup using the raw param
  return null
}

export function getFullMeetingUrl(id, uid) {
  const code = getMeetingCode(id, uid)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/meetings/${code}`
}

/**
 * Formats relative avatar URLs to absolute media URLs
 * Strips /api suffix from VITE_BASE_URL so media files are loaded from host root
 */
export function formatAvatarUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed
  }
  const rawBase = import.meta.env.VITE_BASE_URL || ''
  const cleanBase = rawBase.replace(/\/api\/?$/i, '').replace(/\/+$/, '')
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return cleanBase ? `${cleanBase}${cleanPath}` : cleanPath
}

export function getAvatarGradient(name = '') {
  const gradients = [
    'bg-[#1a73e8]',
    'bg-[#1e8e3e]',
    'bg-[#9334e6]',
    'bg-[#007b83]',
    'bg-[#e37400]',
    'bg-[#d93025]',
    'bg-[#d01884]',
    'bg-[#3949ab]',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return gradients[Math.abs(hash) % gradients.length]
}

