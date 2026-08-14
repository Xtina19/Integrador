import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Shipment } from '@/types/domain'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { importStatusLabels } from '@/constants/stateMachines'
import { validateShipmentForm } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import {
  computeShipmentCostsTotal,
  hasShipmentCosts,
  shipmentCostFields,
} from '@/business-rules/shipmentCosts'
import { extractCountry, getConsolidationForShipment } from '@/lib/importSearchUtils'
import { useERP } from '@/store/ERPProvider'
import { formatDop, formatMoney } from '@/lib/money'
import { ShipmentConsolidationPanel } from '@/modules/importaciones/components/ShipmentConsolidationPanel'

interface ShipmentRecordDialogProps {
  shipment: Shipment | null
  mode: 'view' | 'edit'
  open: boolean
  onClose: () => void
  onEdit: () => void
}

const importStatusVariants: Record<Shipment['status'], 'info' | 'warning' | 'success'> = {
  registered: 'info',
  in_transit: 'warning',
  customs: 'info',
  received: 'success',
  costed: 'success',
  finalized: 'success',
}

export function ShipmentRecordDialog({ shipment, mode, open, onClose, onEdit }: ShipmentRecordDialogProps) {
  const { state, updateShipment } = useERP()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    type: 'Marítimo' as Shipment['type'],
    origin: '',
    destination: '',
    departure: '',
    arrival: '',
    boxes: '',
    notes: '',
  })

  useEffect(() => {
    if (!shipment) return
    setForm({
      type: shipment.type,
      origin: shipment.origin,
      destination: shipment.destination,
      departure: shipment.departure,
      arrival: shipment.arrival,
      boxes: String(shipment.boxes),
      notes: shipment.notes ?? '',
    })
    setError('')
  }, [shipment, mode, open])

  const validation = useMemo(
    () =>
      shipment && mode === 'edit'
        ? validateShipmentForm(
            {
              code: shipment.code,
              supplier: shipment.supplier ?? '',
              origin: form.origin,
              destination: form.destination,
              departure: form.departure,
              arrival: form.arrival,
              boxes: form.boxes,
            },
            state.shipments.map((s) => s.code),
            shipment.code,
            { autoCode: true }
          )
        : { valid: true, errors: [] },
    [form, mode, shipment, state.shipments]
  )

  if (!shipment) return null

  const linkedConsolidation = getConsolidationForShipment(shipment, state.consolidations)

  async function handleSave() {
    const result = await updateShipment({
      shipmentId: shipment!.id,
      type: form.type,
      origin: trim(form.origin),
      destination: trim(form.destination),
      departure: form.departure,
      arrival: form.arrival,
      boxes: Number(form.boxes) || 0,
      notes: form.notes,
    })
    if (!result.success) {
      setError(result.errors?.join(' ') ?? 'Error al guardar')
      return
    }
    onClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={mode === 'view' ? 'Embarque y Consolidación' : 'Editar Embarque'}
      subtitle={shipment.code}
      mode={mode}
      onEdit={onEdit}
      onSave={handleSave}
      saveDisabled={mode === 'edit' && !validation.valid}
    >
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">
          {error}
        </div>
      )}

      {mode === 'view' ? (
        <div className="space-y-1">
          <DetailRow label="Código" value={<span className="font-mono">{shipment.code}</span>} />
          <DetailRow label="Tipo de transporte" value={shipment.type} />
          <DetailRow label="Orden de compra" value={<span className="font-mono">{shipment.orderId ?? '—'}</span>} />
          <DetailRow label="Factura internacional" value={<span className="font-mono">{shipment.invoiceId ?? '—'}</span>} />
          <DetailRow label="País de origen" value={extractCountry(shipment.origin)} />
          <DetailRow label="Origen" value={shipment.origin} />
          <DetailRow label="Destino" value={shipment.destination} />
          <DetailRow label="Fecha salida" value={shipment.departure} />
          <DetailRow label="Fecha llegada" value={shipment.arrival} />
          <DetailRow
            label="Estado"
            value={
              <Badge variant={importStatusVariants[shipment.status]}>
                {importStatusLabels[shipment.status]}
              </Badge>
            }
          />
          <DetailRow label="Cantidad de cajas" value={shipment.boxes} />
          <DetailRow label="Observaciones" value={shipment.notes?.trim() ? shipment.notes : '—'} />
          <ShipmentConsolidationPanel shipment={shipment} consolidation={linkedConsolidation} />
          {(shipment.freightDocuments?.length ?? 0) > 0 && (
            <div className="pt-4 mt-2 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-900 mb-3">Documentos de flete</p>
              {shipment.freightDocuments!.map((d) => (
                <DetailRow
                  key={d.id}
                  label={`${d.code} · ${d.documentType}`}
                  value={
                    <span className="tabular-nums">
                      {formatMoney(d.amount, d.currency)} — {d.serviceProvider}
                    </span>
                  }
                />
              ))}
            </div>
          )}
          {hasShipmentCosts(shipment.costs) && (
            <div className="pt-4 mt-2 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-900 mb-3">Costos asociados</p>
              {shipmentCostFields.map(({ key, label }) => (
                <DetailRow key={key} label={label} value={<span className="tabular-nums">{formatDop(shipment.costs![key])}</span>} />
              ))}
              <DetailRow
                label="Total costos"
                value={<span className="font-bold text-corporate tabular-nums">{formatDop(computeShipmentCostsTotal(shipment.costs!))}</span>}
              />
            </div>
          )}
          <p className="text-xs text-gray-500 pt-2">
            <Link to="/importaciones/costos" className="text-corporate underline">
              Registrar documentos de flete
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Código embarque" value={shipment.code} disabled readOnly />
            <Select
              label="Tipo *"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Shipment['type'] })}
              options={[
                { value: 'Marítimo', label: 'Marítimo' },
                { value: 'Aéreo', label: 'Aéreo' },
                { value: 'Courier', label: 'Courier' },
              ]}
            />
            <Input label="Origen *" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
            <Input label="Destino *" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            <Input label="Fecha salida *" type="date" value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} />
            <Input label="Fecha llegada *" type="date" value={form.arrival} onChange={(e) => setForm({ ...form, arrival: e.target.value })} />
            <Input label="Cantidad de cajas *" type="number" min={1} value={form.boxes} onChange={(e) => setForm({ ...form, boxes: e.target.value })} />
            <Input label="Orden de compra" value={shipment.orderId ?? ''} disabled />
            <Input label="Factura internacional" value={shipment.invoiceId ?? ''} disabled className="md:col-span-2" />
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
          <p className="text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            Los costos se gestionan en{' '}
            <Link to="/importaciones/costos" className="text-corporate font-medium underline">
              Costos de Flete
            </Link>{' '}
            registrando documentos (facturas, BL, guías).
          </p>
          <ShipmentConsolidationPanel shipment={shipment} consolidation={linkedConsolidation} />
        </div>
      )}
    </FormDialog>
  )
}
