import { useState, useMemo } from 'react'
import { PackageCheck } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ReceptionRecordDialog } from '@/modules/compras/components/ReceptionRecordDialog'
import type { Reception } from '@/types/domain'
import { useERP } from '@/store/ERPProvider'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'

const receptionStatusMap: Record<string, { label: string; variant: 'success' | 'warning' }> = {
  complete: { label: 'Completa', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'warning' },
}

export function RecepcionesPage() {
  const { state, completeReception, deleteReception } = useERP()
  const { showSuccess } = useToast()
  const receptions = state.receptions
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialog, setDialog] = useState<{ receptionId: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const selectedReception = dialog ? receptions.find((r) => r.id === dialog.receptionId) ?? null : null

  const filtered = useMemo(() => {
    return receptions.filter((r) => {
      const matchSearch =
        search === '' ||
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.orderId.toLowerCase().includes(search.toLowerCase()) ||
        r.supplier.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter, receptions])

  function handleDelete() {
    if (!deleteId) return
    const result = deleteReception(deleteId)
    if (!result.success) return
    showSuccess('Recepción eliminada correctamente')
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por recepción, orden o proveedor..."
            filters={
              <Select
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'complete', label: 'Completa' },
                  { value: 'pending', label: 'Pendiente' },
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [receptionStatusMap[statusFilter]?.label ?? statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Recepciones de Mercancía" subtitle={`${filtered.length} recepciones registradas`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered as (Reception & Record<string, unknown>)[]}
            columns={[
              {
                key: 'id',
                header: 'Recepción',
                render: (r) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <PackageCheck size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{r.id}</span>
                  </div>
                ),
              },
              { key: 'orderId', header: 'Orden de Compra', render: (r) => <span className="font-mono text-xs">{r.orderId}</span> },
              { key: 'supplier', header: 'Proveedor', render: (r) => <span className="font-medium">{r.supplier}</span> },
              {
                key: 'purchaseType',
                header: 'Origen',
                render: (r) => (
                  <Badge variant={r.purchaseType === 'international' ? 'info' : 'neutral'}>
                    {r.purchaseType === 'international' ? 'Importación' : 'Nacional'}
                  </Badge>
                ),
              },
              { key: 'date', header: 'Fecha', className: 'text-sm' },
              { key: 'items', header: 'Ítems recibidos', render: (r) => <span className="font-semibold">{r.items}</span> },
              {
                key: 'status',
                header: 'Estado',
                render: (r) => {
                  const cfg = receptionStatusMap[r.status]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    {r.status === 'pending' && (
                      <Button size="sm" onClick={() => completeReception(r.id)}>
                        Completar
                      </Button>
                    )}
                    <TableActions
                      onView={() => setDialog({ receptionId: r.id, mode: 'view' })}
                      onEdit={() => setDialog({ receptionId: r.id, mode: 'edit' })}
                      onDelete={r.status === 'pending' ? () => setDeleteId(r.id) : undefined}
                    />
                  </div>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <ReceptionRecordDialog
        reception={selectedReception}
        mode={dialog?.mode ?? 'view'}
        open={Boolean(dialog && selectedReception)}
        onClose={() => setDialog(null)}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="¿Está seguro de eliminar esta recepción?"
      />
    </div>
  )
}
