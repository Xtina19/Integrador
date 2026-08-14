import { useEffect, useState } from 'react'
import { FormDialog } from '@/components/ui/FormDialog'
import { Input } from '@/components/ui/Input'
import type { SupplierInvoice } from '@/modules/compras/components/SupplierInvoiceRecordDialog'
import { formatMoney } from '@/lib/money'

interface RegistrarPagoFacturaDialogProps {
  open: boolean
  invoice: SupplierInvoice | null
  onClose: () => void
  onConfirm: (total: number) => Promise<boolean>
}

export function RegistrarPagoFacturaDialog({
  open,
  invoice,
  onClose,
  onConfirm,
}: RegistrarPagoFacturaDialogProps) {
  const [total, setTotal] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setTotal('')
    setError('')
    setSubmitting(false)
  }, [open, invoice?.id])

  async function handleSave() {
    const monto = Number(total)
    if (!monto || monto <= 0) {
      setError('Indique el monto total de la factura del proveedor.')
      return false
    }
    setSubmitting(true)
    setError('')
    try {
      const ok = await onConfirm(monto)
      if (!ok) return false
      onClose()
      return true
    } finally {
      setSubmitting(false)
    }
  }

  if (!invoice) return null

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Registrar pago"
      subtitle="Ingrese el monto total indicado en la factura del proveedor"
      mode="edit"
      onSave={handleSave}
      saveLabel={submitting ? 'Registrando…' : 'Confirmar pago'}
      saveDisabled={submitting}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-4 text-sm space-y-1">
          <p>
            <span className="text-gray-500">Factura:</span>{' '}
            <span className="font-mono font-medium">{invoice.id}</span>
          </p>
          <p>
            <span className="text-gray-500">Proveedor:</span> {invoice.supplier}
          </p>
          <p>
            <span className="text-gray-500">Orden:</span> {invoice.orderId}
          </p>
        </div>
        <Input
          label="Monto total de la factura *"
          type="number"
          min={0.01}
          step={0.01}
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          placeholder="0.00"
        />
        {total && Number(total) > 0 && (
          <p className="text-sm text-gray-600">
            Total a registrar:{' '}
            <span className="font-semibold text-corporate tabular-nums">
              {formatMoney(Number(total), invoice.currency || 'DOP')}
            </span>
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </FormDialog>
  )
}
