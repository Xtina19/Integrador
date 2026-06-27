interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  onRowClick?: (item: T) => void
  highlightId?: string | null
}

export function Table<T extends Record<string, unknown>>({ columns, data, keyField, onRowClick, highlightId }: TableProps<T>) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((item) => {
            const rowId = String(item[keyField])
            const highlighted = highlightId != null && rowId === highlightId
            return (
            <tr
              key={rowId}
              id={highlighted ? `highlight-${rowId}` : undefined}
              onClick={() => onRowClick?.(item)}
              className={`hover:bg-gray-50/80 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${
                highlighted ? 'bg-gold/15 ring-1 ring-inset ring-gold/50' : ''
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-gray-700 ${col.className ?? ''}`}>
                  {col.render ? col.render(item) : String(item[col.key] ?? '')}
                </td>
              ))}
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
