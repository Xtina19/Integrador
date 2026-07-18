import type { InventoryDashboardKpis } from '../types/inventoryUi'

function formatValor(value: number | null): string {
  if (value === null) return '—'
  return `RD$${Math.round(value).toLocaleString('es-DO')}`
}

interface KpiItem {
  label: string
  value: string
  accent: string
}

function buildItems(kpis: InventoryDashboardKpis): KpiItem[] {
  return [
    {
      label: 'Stock total',
      value: String(kpis.stockTotal),
      accent: 'border-l-corporate',
    },
    {
      label: 'Productos bajo stock',
      value: String(kpis.productosBajoStock),
      accent: 'border-l-amber-500',
    },
    {
      label: 'Productos sin stock',
      value: String(kpis.productosSinStock),
      accent: 'border-l-rose-500',
    },
    {
      label: 'Almacenes bloqueados',
      value: String(kpis.almacenesBloqueados),
      accent: 'border-l-violet-500',
    },
    {
      label: 'Valor del inventario',
      value: formatValor(kpis.valorInventario),
      accent: 'border-l-emerald-500',
    },
    {
      label: 'Última actualización',
      value: kpis.ultimaActualizacion,
      accent: 'border-l-slate-400',
    },
  ]
}

interface Props {
  kpis: InventoryDashboardKpis
}

/** Dashboard = estado general del módulo. Sin indicadores de procesos. */
export function InventoryDashboard({ kpis }: Props) {
  const items = buildItems(kpis)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Centro de control</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg border border-slate-200/80 bg-slate-50/50 px-3 py-2.5 border-l-4 ${item.accent}`}
          >
            <p
              className={`font-bold text-slate-900 ${
                item.label === 'Última actualización' || item.label === 'Valor del inventario'
                  ? 'text-sm leading-snug'
                  : 'text-xl tabular-nums'
              }`}
            >
              {item.value}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
