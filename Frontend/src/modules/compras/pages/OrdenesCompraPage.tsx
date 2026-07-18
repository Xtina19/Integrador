import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PurchaseOrderRecordDialog } from '@/modules/compras/components/PurchaseOrderRecordDialog'
import { purchaseStatusLabels } from '@/constants/stateMachines'
import type { PurchaseOrder, PurchaseStatus } from '@/types/domain'
import { useERP } from '@/store/ERPProvider'
import { useToast } from '@/context/ToastContext'
import { useGlobalSearchRecordEffect, useRecordHighlightScroll } from '@/context/GlobalSearchNavigationContext'

const purchaseStatusVariants: Record<PurchaseStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  draft: 'neutral',
  pending: 'warning',
  approved: 'info',
  received: 'success',
  finalized: 'success',
  cancelled: 'danger',
}

export function OrdenesCompraPage() {
  const navigate = useNavigate()
  const { state, approvePurchaseOrder, deletePurchaseOrder } = useERP()
  const { showSuccess } = useToast()
  const purchaseOrders = state.purchaseOrders
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ orderId: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useGlobalSearchRecordEffect('purchase_order', {
    onView: (recordId) => setDialog({ orderId: recordId, mode: 'view' }),
    onHighlight: (recordId) => setHighlightId(recordId),
  })
  useRecordHighlightScroll(highlightId)

  const selectedOrder = dialog ? purchaseOrders.find((o) => o.id === dialog.orderId) ?? null : null

  const filtered = useMemo(() => {
    return purchaseOrders.filter((o) => {
      const matchSearch =
        search === '' ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.supplier.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter, purchaseOrders])

  function handleDelete() {
    if (!deleteId) return
    const result = deletePurchaseOrder(deleteId)
    if (!result.success) return
    showSuccess('Orden de compra eliminada correctamente')
    setDeleteId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button icon={Plus} onClick={() => navigate('/compras/ordenes/nuevo')}>Nueva Orden de Compra</Button>
      </div>

      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por código o proveedor..."
            filters={
              <Select
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  ...Object.entries(purchaseStatusLabels).map(([value, label]) => ({ value, label })),
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [purchaseStatusLabels[statusFilter as PurchaseStatus] ?? statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Órdenes de Compra" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            highlightId={highlightId}
            data={filtered as (PurchaseOrder & Record<string, unknown>)[]}
            columns={[
              {
                key: 'id',
                header: 'Código',
                render: (o) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <ShoppingCart size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{o.id}</span>
                  </div>
                ),
              },
              { key: 'supplier', header: 'Proveedor', render: (o) => <span className="font-medium">{o.supplier}</span> },
              {
                key: 'purchaseType',
                header: 'Tipo',
                render: (o) => (
                  <Badge variant={o.purchaseType === 'international' ? 'info' : 'neutral'}>
                    {o.purchaseType === 'international' ? 'Internacional' : 'Nacional'}
                  </Badge>
                ),
              },
              { key: 'date', header: 'Fecha', className: 'text-sm' },
              { key: 'items', header: 'Ítems', render: (o) => <span className="font-semibold">{o.items}</span> },
              {
                key: 'total',
                header: 'Total',
                render: (o) => (
                  <span className="font-semibold text-corporate">
                    {o.currency === 'DOP' ? 'RD$' : o.currency === 'EUR' ? '€' : '$'}
                    {o.total.toLocaleString()}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Estado',
                render: (o) => {
                  const cfg = purchaseStatusVariants[o.status]
                  return <Badge variant={cfg}>{purchaseStatusLabels[o.status]}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (o) => (
                  <div className="flex items-center gap-2">
                    {o.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => approvePurchaseOrder(o.id)}>
                        Aprobar
                      </Button>
                    )}
                    <TableActions
                      onView={() => setDialog({ orderId: o.id, mode: 'view' })}
                      onEdit={() => setDialog({ orderId: o.id, mode: 'edit' })}
                      onDelete={() => setDeleteId(o.id)}
                    />
                  </div>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <PurchaseOrderRecordDialog
        order={selectedOrder}
        mode={dialog?.mode ?? 'view'}
        open={Boolean(dialog && selectedOrder)}
        onClose={() => setDialog(null)}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="¿Está seguro de eliminar esta orden de compra?"
      />
    </div>
  )
}
