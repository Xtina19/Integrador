import { useState, useMemo } from 'react'
import { FormPageLayout } from '@/components/ui/FormPageLayout'
import { Input, Select } from '@/components/ui/Input'
import { shipmentCostFields, emptyShipmentCosts, computeShipmentCostsTotal } from '@/business-rules/shipmentCosts'
import { validateShipmentForm } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import type { ShipmentCosts } from '@/types/domain'
import { useERP } from '@/store/ERPProvider'
import { formatDop, formatMoney } from '@/lib/money'

export function RegistrarEmbarquePage() {
  const { state, registerShipment } = useERP()
  const pendingInvoices = useMemo(
    () => state.internationalInvoices.filter((f) => !f.shipmentId && f.stage === 'invoice'),
    [state.internationalInvoices]
  )

  const [error, setError] = useState('')
  const [form, setForm] = useState({
    invoiceId: pendingInvoices[0]?.id ?? '',
    code: '',
    type: 'Marítimo' as const,
    origin: '',
    destination: 'Santo Domingo, RD',
    departure: '',
    arrival: '',
    boxes: '',
    notes: '',
  })
  const [costs, setCosts] = useState<ShipmentCosts>(emptyShipmentCosts())

  const selectedInvoice = state.internationalInvoices.find((f) => f.id === form.invoiceId)
  const costsTotal = computeShipmentCostsTotal(costs)

  const validation = useMemo(
    () =>
      validateShipmentForm(
        {
          code: form.code,
          supplier: selectedInvoice?.supplier ?? '',
          origin: form.origin,
          destination: form.destination,
          departure: form.departure,
          arrival: form.arrival,
          boxes: form.boxes,
          invoiceId: form.invoiceId,
        },
        state.shipments.map((s) => s.code)
      ),
    [form, selectedInvoice, state.shipments]
  )

  function updateCost(key: keyof ShipmentCosts, value: string) {
    setCosts((prev) => ({ ...prev, [key]: Number(value) || 0 }))
  }

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Importaciones', to: '/importaciones' },
        { label: 'Embarques', to: '/importaciones/embarques' },
        { label: 'Registrar Embarque' },
      ]}
      title="Registrar Embarque"
      subtitle="Vincular embarque a factura internacional y registrar sus costos"
      listPath="/importaciones/embarques"
      saveDisabled={!validation.valid || pendingInvoices.length === 0}
      onSave={() => {
        if (!form.invoiceId) {
          setError('Seleccione una factura internacional pendiente de embarque.')
          return false
        }
        const result = registerShipment({
          code: trim(form.code),
          type: form.type,
          origin: trim(form.origin),
          destination: trim(form.destination),
          departure: form.departure,
          arrival: form.arrival,
          boxes: Number(form.boxes) || 0,
          supplier: selectedInvoice?.supplier ?? '',
          invoiceId: form.invoiceId,
          costs,
          notes: trim(form.notes),
        })
        if (!result.success) {
          setError(result.errors?.join(' ') ?? 'Error al guardar')
          return false
        }
        return true
      }}
    >
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">{error}</div>}
      {!validation.valid && !error && pendingInvoices.length > 0 && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
          {validation.errors[0]}
        </div>
      )}
      {pendingInvoices.length === 0 && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-4">
          No hay facturas internacionales pendientes. Apruebe una orden de compra internacional en Compras para generar una factura.
        </div>
      )}
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="Factura Internacional *"
            value={form.invoiceId}
            onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}
            options={
              pendingInvoices.length
                ? pendingInvoices.map((f) => ({
                    value: f.id,
                    label: `${f.id} — OC ${f.orderId} (${f.supplier})`,
                  }))
                : [{ value: '', label: 'Sin facturas disponibles' }]
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
          <Input label="Código embarque *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
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
          <Input
            label="Proveedor (desde factura)"
            value={selectedInvoice?.supplier ?? ''}
            disabled
          />
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

        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Costos del Embarque</h3>
              <p className="text-xs text-gray-500 mt-1">
                Ingrese los costos reales de esta importación. Se utilizarán automáticamente en el costeo por libro.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Total: <span className="font-bold text-corporate tabular-nums">{formatDop(costsTotal)}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shipmentCostFields.map(({ key, label }) => (
              <Input
                key={key}
                label={label}
                type="number"
                min={0}
                step="0.01"
                value={costs[key] || ''}
                onChange={(e) => updateCost(key, e.target.value)}
                placeholder="0"
              />
            ))}
          </div>
        </div>
      </div>
    </FormPageLayout>
  )
}
