import { Search, Filter, Download } from 'lucide-react'
import { Input } from './Input'
import { Button } from '@/components/ui/Button'
import { Badge } from './Badge'

interface ToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: React.ReactNode
  activeFilters?: string[]
  onExportPdf?: () => void
  onExportExcel?: () => void
  actions?: React.ReactNode
}

export function Toolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  activeFilters = [],
  onExportPdf,
  onExportExcel,
  actions,
}: ToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              icon={Search}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          {filters}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onExportPdf && (
            <Button variant="outline" size="sm" icon={Download} onClick={onExportPdf}>
              PDF
            </Button>
          )}
          {onExportExcel && (
            <Button variant="outline" size="sm" icon={Download} onClick={onExportExcel}>
              Excel
            </Button>
          )}
          {actions}
        </div>
      </div>
      {(activeFilters.length > 0 || search) && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Filtros activos:</span>
          {search && <Badge variant="gold">"{search}"</Badge>}
          {activeFilters.map((f) => (
            <Badge key={f} variant="gold">{f}</Badge>
          ))}
        </div>
      )}
    </div>
  )
}
