export function getMeetingCode(id) {
  if (id !== void 0 && id !== null && String(id).trim()) {
    return String(id).trim();
  }
  return "";
}
export function parseMeetingId(param) {
  if (!param) return null;
  const str = String(param).trim();
  const dashIndex = str.indexOf("-");
  if (dashIndex > 0) {
    const firstPart = str.slice(0, dashIndex);
    if (/^\d+$/.test(firstPart)) {
      return firstPart;
    }
  }
  if (/^\d+$/.test(str)) {
    return str;
  }
  return null;
}
export function getFullMeetingUrl(id, uid) {
  const code = getMeetingCode(id, uid);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/meetings/${code}`;
}
