interface ProcessStat {
  id: string
  label: string
  value: number
  accent?: string
  active?: boolean
  onClick?: () => void
}

interface Props {
  items: ProcessStat[]
}

/** Indicadores de proceso (una sola fila, sin duplicar el Centro de control). */
export function ProcessStatCards({ items }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const interactive = Boolean(item.onClick)
        const className = `rounded-lg border px-3 py-2.5 text-left border-l-4 ${
          item.accent ?? 'border-l-corporate'
        } ${
          item.active
            ? 'border-corporate bg-corporate text-white'
            : 'border-slate-200 bg-white text-slate-800'
        } ${interactive ? 'cursor-pointer transition-colors hover:border-corporate/50' : ''}`

        if (interactive) {
          return (
            <button key={item.id} type="button" onClick={item.onClick} className={className}>
              <p className="text-lg font-bold tabular-nums">{item.value}</p>
              <p className={`text-[11px] leading-snug ${item.active ? 'opacity-90' : 'text-slate-500'}`}>
                {item.label}
              </p>
            </button>
          )
        }

        return (
          <div key={item.id} className={className}>
            <p className="text-lg font-bold tabular-nums">{item.value}</p>
            <p className="text-[11px] leading-snug text-slate-500">{item.label}</p>
          </div>
        )
      })}
    </div>
  )
}
