import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Ship } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import { importStatusLabels } from '@/constants/stateMachines'
import type { Consolidation, ImportStatus, Shipment } from '@/types/domain'
import { useERP } from '@/store/ERPProvider'
import { useImportacionesSearch } from '@/context/ImportacionesSearchContext'
import { useGlobalSearchRecordEffect, useRecordHighlightScroll } from '@/context/GlobalSearchNavigationContext'
import { filterShipments, getConsolidationForShipment } from '@/lib/importSearchUtils'
import { consolidationStatusMap } from '@/modules/importaciones/lib/consolidationDisplay'
import { ShipmentRecordDialog } from '@/modules/importaciones/components/ShipmentRecordDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/context/ToastContext'

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
  const { showSuccess, showError } = useToast()
  const { search, setSearch } = useImportacionesSearch()
  const [statusFilter, setStatusFilter] = useState('all')
  const [consolidationFilter, setConsolidationFilter] = useState('all')
  const [dialog, setDialog] = useState<{ shipmentId: string; mode: 'view' | 'edit' } | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useGlobalSearchRecordEffect('shipment', {
    onView: (recordId) => setDialog({ shipmentId: recordId, mode: 'view' }),
    onHighlight: (recordId) => setHighlightId(recordId),
  })

  useGlobalSearchRecordEffect('consolidation', {
    onView: (consolidationId) => {
      const con = state.consolidations.find((c) => c.id === consolidationId)
      if (con?.shipmentId) setDialog({ shipmentId: con.shipmentId, mode: 'view' })
    },
    onHighlight: (consolidationId) => {
      const con = state.consolidations.find((c) => c.id === consolidationId)
      if (con?.shipmentId) setHighlightId(con.shipmentId)
    },
  })

  useRecordHighlightScroll(highlightId)

  const selectedShipment = dialog
    ? state.shipments.find((s) => s.id === dialog.shipmentId) ?? null
    : null

  const filtered = useMemo(() => {
    const bySearch = filterShipments(state.shipments, state.consolidations, search)
    return bySearch.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      const con = getConsolidationForShipment(s, state.consolidations)
      if (consolidationFilter === 'all') return true
      if (consolidationFilter === 'none') return !con
      return con?.status === consolidationFilter
    })
  }, [state.shipments, state.consolidations, search, statusFilter, consolidationFilter])

  async function handleAdvance(shipmentId: string) {
    const result = await advanceShipment(shipmentId)
    if (!result.success) {
      showError(result.errors?.join(' ') ?? 'No se pudo avanzar el embarque.')
      return
    }
    showSuccess('Estado del embarque actualizado.')
  }

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
            searchPlaceholder="Buscar embarque, consolidación, factura, OC..."
            filters={
              <>
                <Select
                  label="Estado embarque"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Todos' },
                    ...Object.entries(importStatusLabels).map(([value, label]) => ({ value, label })),
                  ]}
                />
                <Select
                  label="Consolidación"
                  value={consolidationFilter}
                  onChange={(e) => setConsolidationFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Todas' },
                    { value: 'none', label: 'Sin consolidación' },
                    { value: 'pending', label: 'Pendiente' },
                    { value: 'processed', label: 'Procesado' },
                    { value: 'closed', label: 'Cerrado' },
                  ]}
                />
              </>
            }
            activeFilters={[
              ...(statusFilter !== 'all' ? [importStatusLabels[statusFilter as ImportStatus] ?? statusFilter] : []),
              ...(consolidationFilter !== 'all'
                ? [
                    consolidationFilter === 'none'
                      ? 'Sin consolidación'
                      : consolidationStatusMap[consolidationFilter as Consolidation['status']]?.label ?? consolidationFilter,
                  ]
                : []),
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Embarques y Consolidaciones" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            highlightId={highlightId}
            data={filtered as (Shipment & Record<string, unknown>)[]}
            columns={[
              {
                key: 'code',
                header: 'Embarque',
                render: (s) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <Ship size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{s.code}</span>
                  </div>
                ),
              },
              { key: 'type', header: 'Transporte', className: 'text-sm' },
              { key: 'origin', header: 'Origen', className: 'text-sm' },
              { key: 'destination', header: 'Destino', className: 'text-sm' },
              { key: 'boxes', header: 'Bultos', render: (s) => <span className="font-semibold">{s.boxes}</span> },
              {
                key: 'consolidation',
                header: 'Consolidación',
                render: (s) => {
                  const con = getConsolidationForShipment(s as Shipment, state.consolidations)
                  if (!con) return <span className="text-gray-400 text-xs">Pendiente aduana</span>
                  const cfg = consolidationStatusMap[con.status]
                  return (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs text-corporate">{con.code}</span>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </div>
                  )
                },
              },
              {
                key: 'warehouse',
                header: 'Almacén',
                render: (s) => {
                  const con = getConsolidationForShipment(s as Shipment, state.consolidations)
                  return <span className="text-sm">{con?.warehouseName ?? '—'}</span>
                },
              },
              {
                key: 'status',
                header: 'Estado embarque',
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
                      <Button size="sm" variant="outline" onClick={() => void handleAdvance((s as { id: string }).id)}>
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
        onConfirm={async () => {
          if (!deleteId) return
          const result = await deleteShipment(deleteId)
          if (result.success) showSuccess('Embarque eliminado correctamente')
          else showError(result.errors?.join(' ') ?? 'No se pudo eliminar.')
          setDeleteId(null)
        }}
        message="¿Está seguro de eliminar este embarque?"
      />
    </div>
  )
}
