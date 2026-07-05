import { Eye, Pencil, Trash2, ArrowLeftRight, Printer } from 'lucide-react'
interface TableActionsProps {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onExchange?: () => void
  onPrint?: () => void
}

export function TableActions({ onView, onEdit, onDelete, onExchange, onPrint }: TableActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {onView && (
        <button
          onClick={(e) => { e.stopPropagation(); onView() }}
          className="p-1.5 rounded-md text-gray-400 hover:text-corporate hover:bg-corporate/5 transition-colors"
          title="Ver detalle"
        >
          <Eye size={16} />
        </button>
      )}
      {onExchange && (
        <button
          onClick={(e) => { e.stopPropagation(); onExchange() }}
          className="p-1.5 rounded-md text-gray-400 hover:text-gold-dark hover:bg-gold/10 transition-colors"
          title="Cambio"
        >
          <ArrowLeftRight size={16} />
        </button>
      )}
      {onPrint && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrint() }}
          className="p-1.5 rounded-md text-gray-400 hover:text-corporate hover:bg-corporate/5 transition-colors"
          title="Imprimir"
        >
          <Printer size={16} />
        </button>
      )}
      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          className="p-1.5 rounded-md text-gray-400 hover:text-gold-dark hover:bg-gold/10 transition-colors"
          title="Editar"
        >
          <Pencil size={16} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}
