import { X } from 'lucide-react'
import { Save } from 'lucide-react'
import { Card, CardBody } from '@/components/cards/Card'
import { Button } from '@/components/ui/Button'

interface FormDialogProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  mode?: 'view' | 'edit'
  onSave?: () => void | boolean
  onEdit?: () => void
  saveLabel?: string
  saveDisabled?: boolean
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}

const maxWidthClass = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
}

export function FormDialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  mode = 'view',
  onSave,
  onEdit,
  saveLabel = 'Guardar',
  saveDisabled = false,
  maxWidth = '3xl',
}: FormDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div
        className={`relative w-full ${maxWidthClass[maxWidth]} max-h-[90vh] flex flex-col bg-white rounded-xl shadow-xl border border-gray-100`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <Card className="border-0 shadow-none rounded-none">
            <CardBody className="!p-6">{children}</CardBody>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {mode === 'view' && onEdit && (
            <Button variant="outline" onClick={onEdit}>
              Editar
            </Button>
          )}
          {mode === 'edit' && onSave && (
            <Button icon={Save} onClick={onSave} disabled={saveDisabled}>
              {saveLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 sm:w-44 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 flex-1">{value}</span>
    </div>
  )
}
