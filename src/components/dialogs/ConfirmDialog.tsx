import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar eliminación',
  message = '¿Está seguro de eliminar este registro?',
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Cerrar" />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-100">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${
                variant === 'danger' ? 'bg-red-50' : 'bg-amber-50'
              }`}
            >
              <AlertTriangle
                size={22}
                className={variant === 'danger' ? 'text-red-600' : 'text-amber-600'}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant="danger" icon={Trash2} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
