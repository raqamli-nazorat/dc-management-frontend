import { useRef, useState } from 'react'

/* Pastga surib o'lchamini o'zgartirish logikasi (textarea va div uchun umumiy) */
function useDragResize(ref, minH, maxH) {
    const [height, setHeight] = useState(null)

    const startResize = e => {
        e.preventDefault()
        const startY = e.touches ? e.touches[0].clientY : e.clientY
        const startH = ref.current?.offsetHeight || minH

        const onMove = ev => {
            if (ev.touches) ev.preventDefault() // telefonda sahifa siljib ketmasligi uchun
            const y = ev.touches ? ev.touches[0].clientY : ev.clientY
            setHeight(Math.min(Math.max(startH + (y - startY), minH), maxH))
        }
        const onUp = () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
            window.removeEventListener('touchmove', onMove)
            window.removeEventListener('touchend', onUp)
            document.body.style.userSelect = ''
        }

        document.body.style.userSelect = 'none'
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        window.addEventListener('touchmove', onMove, { passive: false })
        window.addEventListener('touchend', onUp)
    }

    return { height, startResize }
}

/* Pastga surib kattalashtirish uchun tutqich */
function ResizeHandle({ onStart }) {
    return (
        <div onMouseDown={onStart} onTouchStart={onStart} title="Pastga suring"
            className="absolute left-0 right-0 -bottom-1.5 h-3 flex items-center justify-center cursor-ns-resize group">
            <span className="w-10 h-1 rounded-full transition-colors bg-[var(--stroke-sub)] dark:bg-[var(--stroke-soft)] group-hover:bg-[var(--accent-sub)]" />
        </div>
    )
}

/* Tavsif kabi uzun matn maydonlari uchun pastga surib
   kattalashtirish/kichiklashtirish mumkin bo'lgan textarea.
   children — textarea ustiga qo'yiladigan elementlar (masalan, tozalash tugmasi). */
export default function ResizableTextarea({
    minH = 92,
    maxH = 600,
    containerClassName = '',
    className = '',
    style,
    children,
    ...rest
}) {
    const ref = useRef(null)
    const { height, startResize } = useDragResize(ref, minH, maxH)

    return (
        <div className={('relative ' + containerClassName).trim()}>
            <textarea
                ref={ref}
                {...rest}
                style={height ? { ...style, height } : style}
                className={className + ' resize-none block'}
            />
            {children}
            <ResizeHandle onStart={startResize} />
        </div>
    )
}

/* Read-only (faqat ko'rish) modallardagi tavsif bloklari uchun —
   div bo'lgani sababli matn o'z balandligida ochiladi, tutqich bilan
   kichiklashtirish/kattalashtirish mumkin. Surilgach inline height
   klassdagi max-h cheklovini ham bekor qiladi. */
export function ResizableBox({
    minH = 80,
    maxH = 600,
    containerClassName = '',
    className = '',
    style,
    children,
    ...rest
}) {
    const ref = useRef(null)
    const { height, startResize } = useDragResize(ref, minH, maxH)

    return (
        <div className={('relative ' + containerClassName).trim()}>
            <div
                ref={ref}
                {...rest}
                style={height ? { ...style, height, maxHeight: 'none', overflowY: 'auto' } : style}
                className={className}
            >
                {children}
            </div>
            <ResizeHandle onStart={startResize} />
        </div>
    )
}
