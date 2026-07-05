import { useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import type { Consolidation } from '@/types/domain'
import { useERP } from '@/store/ERPProvider'
import { useImportacionesSearch } from '@/context/ImportacionesSearchContext'
import { useGlobalSearchRecordEffect, useRecordHighlightScroll } from '@/context/GlobalSearchNavigationContext'
import { filterConsolidations } from '@/lib/importSearchUtils'
import { ConsolidationRecordDialog } from '@/modules/importaciones/components/ConsolidationRecordDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/context/ToastContext'

const consolidationStatusMap: Record<string, { label: string; variant: 'success' | 'neutral' }> = {
  active: { label: 'Activa', variant: 'success' },
  closed: { label: 'Cerrada', variant: 'neutral' },
}

export function ConsolidacionesPage() {
  const { state, deleteConsolidation } = useERP()
  const { showSuccess } = useToast()
  const { search, setSearch } = useImportacionesSearch()
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialog, setDialog] = useState<{ consolidationId: string; mode: 'view' | 'edit' } | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useGlobalSearchRecordEffect('consolidation', {
    onView: (recordId) => setDialog({ consolidationId: recordId, mode: 'view' }),
    onHighlight: (recordId) => setHighlightId(recordId),
  })
  useRecordHighlightScroll(highlightId)

  const selectedConsolidation = dialog
    ? state.consolidations.find((c) => c.id === dialog.consolidationId) ?? null
    : null

  const shipmentCodes = useMemo(() => {
    if (!selectedConsolidation) return []
    return selectedConsolidation.shipmentIds
      .map((id) => state.shipments.find((s) => s.id === id)?.code)
      .filter(Boolean) as string[]
  }, [selectedConsolidation, state.shipments])

  const filtered = useMemo(() => {
    const bySearch = filterConsolidations(state.consolidations, state.shipments, search)
    return bySearch.filter((c) => statusFilter === 'all' || c.status === statusFilter)
  }, [search, statusFilter, state.consolidations, state.shipments])

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por código, nombre, embarque u orden..."
            filters={
              <Select
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'active', label: 'Activa' },
                  { value: 'closed', label: 'Cerrada' },
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [consolidationStatusMap[statusFilter]?.label ?? statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Consolidaciones" subtitle={`${filtered.length} consolidaciones vinculadas a importaciones`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            highlightId={highlightId}
            data={filtered as (Consolidation & Record<string, unknown>)[]}
            columns={[
              {
                key: 'id',
                header: 'Código',
                render: (c) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <Layers size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{c.id}</span>
                  </div>
                ),
              },
              { key: 'name', header: 'Nombre', render: (c) => <span className="font-medium">{c.name}</span> },
              { key: 'orders', header: 'Órdenes', render: (c) => <span className="font-semibold">{c.orderIds.length}</span> },
              { key: 'shipments', header: 'Embarques', render: (c) => <span className="font-semibold">{c.shipmentIds.length}</span> },
              { key: 'totalBoxes', header: 'Total cajas', render: (c) => <span className="font-semibold text-corporate">{c.totalBoxes}</span> },
              {
                key: 'status',
                header: 'Estado',
                render: (c) => {
                  const cfg = consolidationStatusMap[c.status]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (c) => (
                  <TableActions
                    onView={() => setDialog({ consolidationId: c.id, mode: 'view' })}
                    onEdit={() => setDialog({ consolidationId: c.id, mode: 'edit' })}
                    onDelete={c.status === 'active' ? () => setDeleteId(c.id) : undefined}
                  />
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <ConsolidationRecordDialog
        consolidation={selectedConsolidation}
        shipmentCodes={shipmentCodes}
        mode={dialog?.mode ?? 'view'}
        open={Boolean(dialog && selectedConsolidation)}
        onClose={() => setDialog(null)}
        onEdit={() => dialog && setDialog({ ...dialog, mode: 'edit' })}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return
          const result = deleteConsolidation(deleteId)
          if (result.success) showSuccess('Consolidación eliminada correctamente')
          setDeleteId(null)
        }}
        message="¿Está seguro de eliminar esta consolidación?"
      />
    </div>
  )
}
