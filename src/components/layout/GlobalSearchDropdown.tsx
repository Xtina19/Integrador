import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Ship,
  ArrowLeftRight,
  BookOpen,
  Calendar,
  Users,
  Settings,
  Shield,
  FileBarChart,
  Building2,
  type LucideIcon,
} from 'lucide-react'
import { getSearchResultIconKey, type GlobalSearchIconKey, type GlobalSearchResult } from '../../services/globalSearchService'

const iconMap: Record<GlobalSearchIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  inventory: Package,
  sales: ShoppingCart,
  purchases: Truck,
  imports: Ship,
  transfers: ArrowLeftRight,
  publishers: BookOpen,
  events: Calendar,
  users: Users,
  admin: Building2,
  reports: FileBarChart,
  audit: Shield,
  config: Settings,
}

interface GlobalSearchDropdownProps {
  open: boolean
  query: string
  results: GlobalSearchResult[]
  onSelect: (result: GlobalSearchResult) => void
}

export function GlobalSearchDropdown({ open, query, results, onSelect }: GlobalSearchDropdownProps) {
  if (!open || !query.trim()) return null

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-50 max-h-80 overflow-y-auto">
      {results.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No se encontraron resultados</p>
      ) : (
        results.map((result) => {
          const iconKey =
            result.recordType === 'product' && result.path.startsWith('/administracion')
              ? 'admin'
              : getSearchResultIconKey(result.recordType)
          const Icon = iconMap[iconKey]
          return (
            <button
              key={`${result.recordType}-${result.id}-${result.path}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(result)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface transition-colors border-b border-gray-50 last:border-0"
            >
              <div className="w-8 h-8 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={16} className="text-corporate" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                {result.subtitle && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{result.subtitle}</p>
                )}
                <p className="text-[10px] text-corporate font-medium mt-1">{result.moduleLabel}</p>
              </div>
            </button>
          )
        })
      )}
    </div>
  )
}
