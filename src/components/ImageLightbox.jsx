import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { FaXmark } from 'react-icons/fa6'

/**
 * Global rasm ko'rgich (lightbox).
 * Loyihadagi har qanday KONTENT rasmni bosganda uni katta qilib ochadi.
 *
 * - UI ikonkalar (`/imgs/...`, `.svg`) chetlab o'tiladi.
 * - `data-no-zoom` atributi bo'lgan rasmlar ham chetlab o'tiladi
 *   (o'z preview logikasi bor joylar uchun).
 *
 * Bir marta (Layout ichida) mount qilinadi — qolgan barcha rasmlar
 * avtomatik ravishda qo'llab-quvvatlanadi, alohida sozlash shart emas.
 */
function isZoomable(img) {
  if (!img || img.tagName !== 'IMG') return false
  if (img.closest('[data-no-zoom]')) return false

  const src = img.currentSrc || img.getAttribute('src') || ''
  if (!src) return false

  // UI ikonka/asset rasmlari — kattalashtirilmaydi
  if (src.includes('/imgs/')) return false
  if (/\.svg(\?|#|$)/i.test(src)) return false
  if (src.startsWith('data:image/svg')) return false

  return true
}

export default function ImageLightbox() {
  const [src, setSrc] = useState(null)

  const close = useCallback(() => setSrc(null), [])

  useEffect(() => {
    const handleClick = (e) => {
      const img = e.target
      if (!isZoomable(img)) return
      // Rasmni bosganda ota-element handlerlari (karta ochish va h.k.)
      // ishlamasligi uchun — faqat kattalashtiramiz.
      e.preventDefault()
      e.stopPropagation()
      setSrc(img.currentSrc || img.getAttribute('src'))
    }
    // Capture fazasi — React handlerlaridan oldin ushlaydi
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  useEffect(() => {
    if (!src) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [src, close])

  if (!src) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={close}
    >
      <button
        type="button"
        onClick={close}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer transition-colors"
        aria-label="Yopish"
      >
        <FaXmark size={18} />
      </button>
      <img
        src={src}
        alt=""
        data-no-zoom
        onClick={(e) => e.stopPropagation()}
        className="max-w-[92vw] max-h-[92vh] object-contain rounded-2xl shadow-2xl"
      />
    </div>,
    document.body
  )
}
