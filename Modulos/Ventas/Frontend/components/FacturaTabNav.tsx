import { FACTURA_TABS, type FacturaTabId } from '../types/facturaUi'

interface FacturaTabNavProps {
  active: FacturaTabId
  onChange: (tab: FacturaTabId) => void
}

/** Navegación de secciones del expediente de factura (patrón Inventario). */
export function FacturaTabNav({ active, onChange }: FacturaTabNavProps) {
  return (
    <nav
      className="flex gap-0.5 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
      aria-label="Secciones de la factura"
    >
      {FACTURA_TABS.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-corporate text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-corporate'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
