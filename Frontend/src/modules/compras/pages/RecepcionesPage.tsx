import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackageCheck, Receipt, Wallet } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ReceptionRecordDialog } from '@/modules/compras/components/ReceptionRecordDialog'
import { RegistrarFacturaProveedorDialog } from '@/modules/compras/components/RegistrarFacturaProveedorDialog'
import type { Reception } from '@/types/domain'
import { useERP } from '@/store/ERPProvider'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { receptionStatusMap } from '@/modules/compras/constants/comprasUi'
import { ordersEligibleForFactura } from '@/modules/compras/services/facturaProveedorUi'

export function RecepcionesPage() {
  const { state, completeReception, deleteReception, refreshCompras } = useERP()
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()
  const receptions = state.receptions
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialog, setDialog] = useState<{ receptionId: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [registerForOrderId, setRegisterForOrderId] = useState<string | undefined>(undefined)

  const eligibleOrderIds = useMemo(() => {
    return new Set(
      ordersEligibleForFactura(state.purchaseOrders, state.receptions, state.supplierInvoices).map(
        (o) => o.id
      )
    )
  }, [state.purchaseOrders, state.receptions, state.supplierInvoices])

  const invoicedOrderIds = useMemo(
    () =>
      new Set(
        state.supplierInvoices
          .filter((i) => String(i.documentEstado ?? '').toLowerCase() !== 'anulada')
          .map((i) => i.orderId),
      ),
    [state.supplierInvoices],
  )

  function canRegisterFactura(reception: Reception): boolean {
    return reception.status === 'complete' && eligibleOrderIds.has(reception.orderId)
  }

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

  async function handleComplete(receptionId: string) {
    const reception = receptions.find((r) => r.id === receptionId)
    const result = await completeReception(receptionId)
    if (!result.success) {
      showError(result.errors?.join(' ') ?? 'No se pudo completar la recepción.')
      return
    }
    showSuccess('Recepción confirmada. El stock se actualizó en inventario.')
    if (reception && reception.purchaseType !== 'international') {
      setRegisterForOrderId(reception.orderId)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    const result = await deleteReception(deleteId)
    if (!result.success) {
      showError(result.errors?.join(' ') ?? 'No se pudo eliminar la recepción.')
      return
    }
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
                  { value: 'pending', label: 'Borrador' },
                  { value: 'complete', label: 'Confirmada' },
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [receptionStatusMap[statusFilter]?.label ?? statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Recepciones de Mercancía" />
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
                      <Button size="sm" onClick={() => void handleComplete(r.id)}>
                        Completar
                      </Button>
                    )}
                    {canRegisterFactura(r) && (
                      <Button
                        size="sm"
                        variant="outline"
                        icon={Receipt}
                        onClick={() => setRegisterForOrderId(r.orderId)}
                      >
                        Facturar
                      </Button>
                    )}
                    {r.status === 'complete' && invoicedOrderIds.has(r.orderId) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Wallet}
                        onClick={() => navigate('/compras/cuentas-por-pagar')}
                      >
                        Ver CxP
                      </Button>
                    )}
                    <TableActions
                      onView={() => setDialog({ receptionId: r.id, mode: 'view' })}
                      onEdit={r.status === 'pending' ? () => setDialog({ receptionId: r.id, mode: 'edit' }) : undefined}
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
        onConfirm={() => void handleDelete()}
        message="¿Está seguro de eliminar esta recepción?"
      />

      <RegistrarFacturaProveedorDialog
        open={registerForOrderId != null}
        preselectedOrderId={registerForOrderId}
        onClose={() => setRegisterForOrderId(undefined)}
        onRegistered={async () => {
          setRegisterForOrderId(undefined)
          await refreshCompras()
        }}
      />
    </div>
  )
}
