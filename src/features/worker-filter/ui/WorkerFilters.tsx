import { Search, X } from 'lucide-react'
import { useWorkerFilters } from '../model/useWorkerFilters'
import { Button } from '@/shared/ui/Button'

export function WorkerFilters() {
  const { search, status, setSearch, setStatus, reset } = useWorkerFilters()
  const hasFilters = search || status

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-silver" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism yoki email bo'yicha qidirish..."
          className="h-9 w-full rounded border border-smoke bg-graphite pl-8 pr-3 text-sm text-ivory placeholder:text-silver focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 transition-colors"
        />
      </div>

      {/* Status filter */}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="h-9 rounded border border-smoke bg-graphite px-3 text-sm text-ivory focus:border-gold focus:outline-none transition-colors"
      >
        <option value="">Barcha statuslar</option>
        <option value="active">Faol</option>
        <option value="inactive">Nofaol</option>
        <option value="on_leave">Ta'tilda</option>
        <option value="probation">Sinov muddatida</option>
      </select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1">
          <X size={14} /> Tozalash
        </Button>
      )}
    </div>
  )
}
