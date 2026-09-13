// Web Audio API based sound synthesizer for Meeting Room events
// Zero external MP3 downloads, 0ms latency, works offline and on all browsers.

let audioCtx = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (AudioContextClass) {
        audioCtx = new AudioContextClass()
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {})
    }
    return audioCtx
  } catch {
    return null
  }
}

/**
 * 1. Ekranni ulash (Screen Share Start)
 * Yoqimli, ko'tariluvchi zamonaviy akkord (C5 -> E5 -> G5)
 */
export function playScreenShareStartSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    const notes = [523.25, 659.25, 783.99] // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.08)

      gain.gain.setValueAtTime(0, now + i * 0.08)
      gain.gain.linearRampToValueAtTime(0.14, now + i * 0.08 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.32)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + i * 0.08)
      osc.stop(now + i * 0.08 + 0.35)
    })
  } catch {}
}

/**
 * Ekranni to'xtatish (Screen Share Stop)
 * Yumshoq pasayuvchi release ohangi
 */
export function playScreenShareStopSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    const notes = [659.25, 493.88] // E5, B4
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.09)

      gain.gain.setValueAtTime(0, now + i * 0.09)
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.09 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + i * 0.09)
      osc.stop(now + i * 0.09 + 0.28)
    })
  } catch {}
}

/**
 * 2. Xabar yozganda / kelganda (Chat Message)
 * Shaffof, yoqimli va muloyim pop / ping tovushi (Telegram / iMessage kabi)
 */
export function playChatMessageSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now) // A5
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.07)

    gain.gain.setValueAtTime(0.16, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.16)
  } catch {}
}

/**
 * 3. Odam qo'shilganda (Participant Joined)
 * Issiq, do'stona marimba tovushi (Google Meet / Slack kabi)
 */
export function playParticipantJoinedSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    // F4 -> A4 -> C5
    const notes = [349.23, 440.0, 523.25]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + i * 0.07)

      gain.gain.setValueAtTime(0, now + i * 0.07)
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.07 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + i * 0.07)
      osc.stop(now + i * 0.07 + 0.38)
    })
  } catch {}
}

/**
 * 4. Tasdiqlash so'raganda (Knock / Admission Request)
 * Elegant qo'ng'iroq (Doorbell chime: E5 -> C5)
 */
export function playKnockRequestSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    const rings = [
      { freq: 659.25, time: 0 },    // E5
      { freq: 523.25, time: 0.16 }, // C5
    ]

    rings.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + time)

      gain.gain.setValueAtTime(0, now + time)
      gain.gain.linearRampToValueAtTime(0.22, now + time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.45)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + time)
      osc.stop(now + time + 0.5)
    })
  } catch {}
}

/**
 * 5. Qo'l ko'targanda (Hand Raised)
 * Yorqin va tiniq qo'ng'iroq pongi (A5 bell)
 */
export function playHandRaisedSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    // Asosiy ohang + garmonik tovush
    const frequencies = [880, 1760]
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      const vol = idx === 0 ? 0.22 : 0.08
      gain.gain.setValueAtTime(vol, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.5)
    })
  } catch {}
}
