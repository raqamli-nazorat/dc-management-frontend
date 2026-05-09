// ThemeToggle.jsx — Dark/Light tema almashtirish tugmasi
// CSS variables ishlatadi, qattiq rang yozilmagan
import { useTheme } from '../context/ThemeContext'

// Quyosh ikonkasi (light mode)
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

// Oy ikonkasi (dark mode)
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? "Light rejimga o'tish" : "Dark rejimga o'tish"}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '12px',
        border: '1px solid var(--stroke-sub)',
        background: 'var(--bg-elevation-1)',
        color: 'var(--text-sub)',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        transition: 'background 0.2s, color 0.2s, border-color 0.2s',
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  )
}
