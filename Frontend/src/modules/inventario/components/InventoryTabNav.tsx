import type { InventoryTabId } from '../types/inventoryUi'

const tabs: { id: InventoryTabId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'movimientos', label: 'Movimientos' },
  { id: 'transferencias', label: 'Transferencias' },
  { id: 'conteos', label: 'Conteos' },
  { id: 'ajustes', label: 'Ajustes' },
  { id: 'descartes', label: 'Descartes' },
  { id: 'kardex', label: 'Kardex' },
  { id: 'auditoria', label: 'Auditoría' },
]

interface Props {
  active: InventoryTabId
  onChange: (tab: InventoryTabId) => void
}

export function InventoryTabNav({ active, onChange }: Props) {
  return (
    <nav
      className="flex gap-0.5 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
      aria-label="Procesos de inventario"
    >
      {tabs.map((tab) => {
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

export { tabs as inventoryTabDefinitions }
