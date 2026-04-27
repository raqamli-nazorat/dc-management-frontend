import { useEffect } from "react"

export const Alert = ({ message, duration = 3000, onClose, show }) => {
    useEffect(() => {
        const t = setTimeout(onClose, duration)
        return () => clearTimeout(t)
    }, [duration, onClose])
    return (
        <>
            <div className={`${show ? 'translate-y-0' : 'translate-y-30'} fixed bottom-4 left-1/2 -translate-x-1/2 p-3 rounded-lg text-sm shadow-lg z-50 transition-all bg-black/60 dark:bg-white/90 text-white dark:text-black`}>
                {message}
            </div>
        </>
    )
}
