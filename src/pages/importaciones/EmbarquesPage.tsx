import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Ship } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { Toolbar } from '../../components/ui/Toolbar'
import { Select } from '../../components/ui/Input'
import { importStatusLabels } from '../../business-rules/stateMachines'
import type { ImportStatus, Shipment } from '../../types/domain'
import { useERP } from '../../store/ERPProvider'
import { useImportacionesSearch } from '../../context/ImportacionesSearchContext'
import { useGlobalSearchRecordEffect, useRecordHighlightScroll } from '../../context/GlobalSearchNavigationContext'
import { filterShipments } from '../../lib/importSearchUtils'
import { ShipmentRecordDialog } from '../../components/importaciones/ShipmentRecordDialog'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useToast } from '../../context/ToastContext'

const importStatusVariants: Record<ImportStatus, 'info' | 'warning' | 'success'> = {
  registered: 'info',
  in_transit: 'warning',
  customs: 'info',
  received: 'success',
  costed: 'success',
  finalized: 'success',
}

export function EmbarquesPage() {
  const navigate = useNavigate()
  const { state, advanceShipment, deleteShipment } = useERP()
  const { showSuccess } = useToast()
  const { search, setSearch } = useImportacionesSearch()
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialog, setDialog] = useState<{ shipmentId: string; mode: 'view' | 'edit' } | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useGlobalSearchRecordEffect('shipment', {
    onView: (recordId) => setDialog({ shipmentId: recordId, mode: 'view' }),
    onHighlight: (recordId) => setHighlightId(recordId),
  })
  useRecordHighlightScroll(highlightId)

  const selectedShipment = dialog
    ? state.shipments.find((s) => s.id === dialog.shipmentId) ?? null
    : null

  const filtered = useMemo(() => {
    const bySearch = filterShipments(state.shipments, search)
    return bySearch.filter((s) => statusFilter === 'all' || s.status === statusFilter)
  }, [state.shipments, search, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button icon={Plus} onClick={() => navigate('/importaciones/embarques/nuevo')}>
          Registrar Embarque
        </Button>
      </div>

      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por código, factura, OC, origen o destino..."
            filters={
              <Select
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  ...Object.entries(importStatusLabels).map(([value, label]) => ({ value, label })),
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [importStatusLabels[statusFilter as ImportStatus] ?? statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Embarques Internacionales" subtitle={`${filtered.length} embarques registrados`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            highlightId={highlightId}
            data={filtered as (Shipment & Record<string, unknown>)[]}
            columns={[
              {
                key: 'code',
                header: 'Código',
                render: (s) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <Ship size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{s.code}</span>
                  </div>
                ),
              },
              { key: 'type', header: 'Tipo de transporte' },
              { key: 'orderId', header: 'Orden de Compra', render: (s) => <span className="font-mono text-xs">{s.orderId ?? '—'}</span> },
              { key: 'invoiceId', header: 'Factura', render: (s) => <span className="font-mono text-xs">{s.invoiceId ?? '—'}</span> },
              { key: 'origin', header: 'Origen', className: 'text-sm' },
              { key: 'destination', header: 'Destino', className: 'text-sm' },
              { key: 'departure', header: 'Salida', className: 'text-sm' },
              { key: 'arrival', header: 'Llegada', className: 'text-sm' },
              { key: 'boxes', header: 'Cajas', render: (s) => <span className="font-semibold">{s.boxes}</span> },
              {
                key: 'status',
                header: 'Estado',
                render: (s) => {
                  const st = (s as { status: ImportStatus }).status
                  return <Badge variant={importStatusVariants[st]}>{importStatusLabels[st]}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (s) => (
                  <div className="flex gap-2">
                    {(s as { status: ImportStatus }).status !== 'finalized' && (
                      <Button size="sm" variant="outline" onClick={() => advanceShipment((s as { id: string }).id)}>
                        Avanzar
                      </Button>
                    )}
                    <TableActions
                      onView={() => setDialog({ shipmentId: (s as { id: string }).id, mode: 'view' })}
                      onEdit={() => setDialog({ shipmentId: (s as { id: string }).id, mode: 'edit' })}
                      onDelete={
                        (s as { status: ImportStatus }).status === 'registered'
                          ? () => setDeleteId((s as { id: string }).id)
                          : undefined
                      }
                    />
                  </div>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <ShipmentRecordDialog
        shipment={selectedShipment}
        mode={dialog?.mode ?? 'view'}
        open={Boolean(dialog && selectedShipment)}
        onClose={() => setDialog(null)}
        onEdit={() => dialog && setDialog({ ...dialog, mode: 'edit' })}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return
          const result = deleteShipment(deleteId)
          if (result.success) showSuccess('Embarque eliminado correctamente')
          setDeleteId(null)
        }}
        message="¿Está seguro de eliminar este embarque?"
      />
    </div>
  )
}
