import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FormPageLayout } from '@/components/ui/FormPageLayout'
import { Input, Select } from '@/components/ui/Input'
import { emptyShipmentCosts } from '@/business-rules/shipmentCosts'
import { validateShipmentForm } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import { useERP } from '@/store/ERPProvider'
import { formatMoney } from '@/lib/money'
import { nextEmbarqueCode } from '@/utils/idGenerator'
import { importacionesApi } from '@/services/api/importacionesApi'

export function RegistrarEmbarquePage() {
  const { state, registerShipment } = useERP()
  const fromApi = importacionesApi.isEnabled()
  const pendingInvoices = useMemo(() => {
    if (fromApi) {
      return state.internationalInvoices.filter((f) => f.pendingEmbarque)
    }
    return state.internationalInvoices.filter((f) => !f.shipmentId && f.stage === 'invoice')
  }, [fromApi, state.internationalInvoices])

  const [error, setError] = useState('')
  const [form, setForm] = useState({
    invoiceId: pendingInvoices[0]?.id ?? '',
    type: 'Marítimo' as const,
    origin: '',
    destination: 'Santo Domingo, RD',
    departure: '',
    arrival: '',
    boxes: '',
    notes: '',
  })

  const codigoPreview = useMemo(
    () => nextEmbarqueCode(state.shipments.map((s) => s.code)),
    [state.shipments],
  )

  const selectedInvoice = state.internationalInvoices.find((f) => f.id === form.invoiceId)

  const validation = useMemo(
    () =>
      validateShipmentForm(
        {
          code: codigoPreview,
          supplier: selectedInvoice?.supplier ?? '',
          origin: form.origin,
          destination: form.destination,
          departure: form.departure,
          arrival: form.arrival,
          boxes: form.boxes,
          invoiceId: form.invoiceId,
        },
        state.shipments.map((s) => s.code),
        undefined,
        { autoCode: true },
      ),
    [form, selectedInvoice, state.shipments, codigoPreview],
  )

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Importaciones', to: '/importaciones' },
        { label: 'Embarques', to: '/importaciones/embarques' },
        { label: 'Registrar Embarque' },
      ]}
      title="Registrar Embarque"
      subtitle="Vincular embarque a orden internacional aprobada"
      listPath="/importaciones/embarques"
      saveDisabled={!validation.valid || pendingInvoices.length === 0}
      onSave={async () => {
        if (!form.invoiceId) {
          setError('Seleccione una orden internacional pendiente de embarque.')
          return false
        }
        const selected = state.internationalInvoices.find((f) => f.id === form.invoiceId)
        const result = await registerShipment({
          type: form.type,
          origin: trim(form.origin),
          destination: trim(form.destination),
          departure: form.departure,
          arrival: form.arrival,
          boxes: Number(form.boxes) || 0,
          supplier: selectedInvoice?.supplier ?? '',
          invoiceId: form.invoiceId,
          ordenCompraId: selected?.orderDbId,
          costs: emptyShipmentCosts(),
          notes: trim(form.notes),
        })
        if (!result.success) {
          setError(result.errors?.join(' ') ?? 'Error al guardar')
          return false
        }
        return true
      }}
    >
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">{error}</div>
      )}
      {!validation.valid && !error && pendingInvoices.length > 0 && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
          {validation.errors[0]}
        </div>
      )}
      {pendingInvoices.length === 0 && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-4">
          No hay órdenes internacionales aprobadas pendientes de embarque. Apruebe una orden de compra internacional en Compras.
        </div>
      )}

      <div className="text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6">
        Los costos de flete se registran como <strong>documentos</strong> (facturas, BL, guías) en{' '}
        <Link to="/importaciones/costos" className="text-corporate font-medium underline">
          Costos de Flete
        </Link>{' '}
        una vez creado el embarque.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Orden internacional *"
          value={form.invoiceId}
          onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}
          options={
            pendingInvoices.length
              ? pendingInvoices.map((f) => ({
                  value: f.id,
                  label: `${f.orderId} — ${f.supplier} (${formatMoney(f.amount, f.currency)})`,
                }))
              : [{ value: '', label: fromApi ? 'Sin órdenes pendientes' : 'Sin facturas disponibles' }]
          }
          className="md:col-span-2"
        />
        {selectedInvoice && (
          <div className="md:col-span-2 text-sm text-gray-600 bg-surface border border-gray-100 rounded-lg px-4 py-3">
            Orden vinculada: <span className="font-mono text-corporate">{selectedInvoice.orderId}</span> — Proveedor:{' '}
            <span className="font-medium">{selectedInvoice.supplier}</span> — Monto:{' '}
            {formatMoney(selectedInvoice.amount, selectedInvoice.currency)}
          </div>
        )}
        <Input label="Código embarque (autogenerado)" value={codigoPreview} disabled readOnly />
        <Select
          label="Tipo *"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
          options={[
            { value: 'Marítimo', label: 'Marítimo' },
            { value: 'Aéreo', label: 'Aéreo' },
            { value: 'Courier', label: 'Courier' },
          ]}
        />
        <Input label="Origen *" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
        <Input label="Destino *" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
        <Input label="Fecha salida *" type="date" value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} />
        <Input label="Fecha estimada llegada *" type="date" value={form.arrival} onChange={(e) => setForm({ ...form, arrival: e.target.value })} />
        <Input label="Cantidad de cajas *" type="number" min={1} value={form.boxes} onChange={(e) => setForm({ ...form, boxes: e.target.value })} />
        <Input label="Proveedor (desde factura)" value={selectedInvoice?.supplier ?? ''} disabled />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Observaciones</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate/20 focus:border-corporate"
            placeholder="Notas del embarque..."
          />
        </div>
      </div>
    </FormPageLayout>
  )
}
