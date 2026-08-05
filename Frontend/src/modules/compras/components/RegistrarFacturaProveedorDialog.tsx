import { useEffect, useMemo, useState } from 'react'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { Input, Select } from '@/components/ui/Input'
import {
  nextNumeroFacturaProveedor,
  ordersEligibleForFactura,
} from '@/modules/compras/services/facturaProveedorUi'
import { isComprasSyncedToApi } from '@/modules/compras/services/comprasDualMode'
import { resolvePurchaseOrderLines } from '@/modules/compras/services/purchaseService'
import { useERP } from '@/store/ERPProvider'
import { useToast } from '@/context/ToastContext'
import { getFriendlyErrorMessage } from '@/services/http'
import { formatMoney } from '@/lib/money'

interface RegistrarFacturaProveedorDialogProps {
  open: boolean
  onClose: () => void
  onRegistered: () => void | Promise<void>
  /** Preseleccionar OC al abrir desde Recepciones. */
  preselectedOrderId?: string
}

export function RegistrarFacturaProveedorDialog({
  open,
  onClose,
  onRegistered,
  preselectedOrderId,
}: RegistrarFacturaProveedorDialogProps) {
  const { state, registerSupplierInvoice } = useERP()
  const { showSuccess, showError } = useToast()
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    ncf: '',
    fechaEmision: new Date().toISOString().slice(0, 10),
    fechaVencimiento: '',
    fechaRecepcionDocumento: new Date().toISOString().slice(0, 10),
  })

  const eligible = useMemo(
    () => ordersEligibleForFactura(state.purchaseOrders, state.receptions, state.supplierInvoices),
    [state.purchaseOrders, state.receptions, state.supplierInvoices]
  )

  const selectedOrder = useMemo(
    () => eligible.find((o) => o.id === selectedOrderId) ?? null,
    [eligible, selectedOrderId]
  )

  const assignedNumero = useMemo(
    () => nextNumeroFacturaProveedor(state.supplierInvoices),
    [state.supplierInvoices]
  )

  const orderOptions = useMemo(
    () =>
      eligible.map((o) => ({
        value: o.id,
        label: `${o.id} — ${o.supplier} (${formatMoney(o.total, o.currency)})`,
      })),
    [eligible]
  )

  const lines = useMemo(
    () => (selectedOrder ? resolvePurchaseOrderLines(selectedOrder) : []),
    [selectedOrder]
  )

  useEffect(() => {
    if (!open) return
    setForm({
      ncf: '',
      fechaEmision: new Date().toISOString().slice(0, 10),
      fechaVencimiento: '',
      fechaRecepcionDocumento: new Date().toISOString().slice(0, 10),
    })
    if (preselectedOrderId && eligible.some((o) => o.id === preselectedOrderId)) {
      setSelectedOrderId(preselectedOrderId)
    } else if (eligible.length === 1) {
      setSelectedOrderId(eligible[0].id)
    } else {
      setSelectedOrderId('')
    }
  }, [open, preselectedOrderId, eligible])

  async function handleSave() {
    if (!selectedOrder) {
      showError('Seleccione una orden de compra recibida.')
      return false
    }
    if (!form.fechaEmision) {
      showError('Indique la fecha de emisión.')
      return false
    }

    setSubmitting(true)
    try {
      const result = await registerSupplierInvoice({
        orderId: selectedOrder.id,
        ncf: form.ncf,
        fechaEmision: form.fechaEmision,
        fechaVencimiento: form.fechaVencimiento || undefined,
        fechaRecepcionDocumento: form.fechaRecepcionDocumento || undefined,
      })
      if (!result.success) {
        showError(result.errors?.join(' ') ?? 'No se pudo registrar la factura.')
        return false
      }
      showSuccess(`Factura ${assignedNumero} registrada para ${selectedOrder.id}.`)
      await onRegistered()
      onClose()
      return true
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Registrar factura de proveedor"
      subtitle="Documento de cobro nacional (distinto de factura internacional)"
      mode="edit"
      onSave={handleSave}
      saveLabel={submitting ? 'Registrando…' : 'Registrar factura'}
      saveDisabled={submitting || eligible.length === 0}
      maxWidth="2xl"
    >
      {eligible.length === 0 ? (
        <p className="text-sm text-gray-600">
          No hay órdenes nacionales con recepción confirmada pendientes de facturar.
        </p>
      ) : (
        <div className="space-y-6">
          <Select
            label="Orden de compra *"
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            options={[{ value: '', label: 'Seleccione…' }, ...orderOptions]}
          />

          {selectedOrder && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
                <DetailRow label="Proveedor" value={selectedOrder.supplier} />
                <DetailRow label="Total orden" value={formatMoney(selectedOrder.total, selectedOrder.currency)} />
                <DetailRow
                  label="Número de factura"
                  value={<span className="font-mono text-corporate">{assignedNumero}</span>}
                />
                <DetailRow
                  label="Destino registro"
                  value={
                    isComprasSyncedToApi(selectedOrder)
                      ? 'Base de datos (API Compras)'
                      : 'Sesión local (sin BD aún)'
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="NCF"
                  value={form.ncf}
                  onChange={(e) => setForm({ ...form, ncf: e.target.value })}
                  placeholder="Opcional"
                />
                <Input
                  label="Fecha emisión *"
                  type="date"
                  value={form.fechaEmision}
                  onChange={(e) => setForm({ ...form, fechaEmision: e.target.value })}
                />
                <Input
                  label="Fecha recepción documento"
                  type="date"
                  value={form.fechaRecepcionDocumento}
                  onChange={(e) => setForm({ ...form, fechaRecepcionDocumento: e.target.value })}
                />
                <Input
                  label="Fecha vencimiento"
                  type="date"
                  value={form.fechaVencimiento}
                  onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
                />
              </div>

              {lines.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Líneas a facturar ({lines.length})
                  </p>
                  <ul className="text-sm space-y-1 max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-3">
                    {lines.map((line, idx) => (
                      <li key={idx} className="flex justify-between gap-4">
                        <span>
                          {line.product} × {line.qty}
                        </span>
                        <span className="tabular-nums shrink-0">
                          {formatMoney(line.qty * line.unitCost, selectedOrder.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </FormDialog>
  )
}
