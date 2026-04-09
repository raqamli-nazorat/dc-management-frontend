import { LoginForm } from '@/features/auth/ui/LoginForm'

export function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian px-4">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,169,110,0.06),_transparent_60%)]" />

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-graphite">
            <span className="font-display text-xl font-bold text-gold">DC</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ivory">DC Management</h1>
          <p className="mt-2 text-sm text-silver">Boshqaruv paneliga kiring</p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-smoke bg-charcoal p-8 shadow-luxury">
          <h2 className="mb-6 font-display text-xl font-semibold text-ivory">Tizimga kirish</h2>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-ash">
          DC Management System &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
