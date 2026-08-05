import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Receipt, Wallet } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SupplierInvoiceRecordDialog, type SupplierInvoice } from '@/modules/compras/components/SupplierInvoiceRecordDialog'
import { RegistrarFacturaProveedorDialog } from '@/modules/compras/components/RegistrarFacturaProveedorDialog'
import { useToast } from '@/context/ToastContext'
import { useERP } from '@/store/ERPProvider'
import { comprasApi } from '@/services/api/comprasApi'
import { getFriendlyErrorMessage } from '@/services/http'
import {
  invoiceStatusMap,
  canEditFacturaProveedor,
  canAnularFacturaProveedor,
  canRegistrarPagoFacturaProveedor,
  invoiceStatusBadge,
} from '@/modules/compras/constants/comprasUi'
import { ordersEligibleForFactura } from '@/modules/compras/services/facturaProveedorUi'
import { formatMoney } from '@/lib/money'

export function FacturasProveedoresPage() {
  const { showSuccess, showError } = useToast()
  const { state, refreshCompras, comprasReady, anularSupplierInvoice, registerSupplierInvoicePayment } = useERP()
  const fromApi = comprasApi.isEnabled()
  const [loading, setLoading] = useState(fromApi)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialog, setDialog] = useState<{ invoiceId: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [payId, setPayId] = useState<string | null>(null)
  const [registerOpen, setRegisterOpen] = useState(false)

  const invoices = state.supplierInvoices

  useEffect(() => {
    if (!fromApi) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        await refreshCompras()
      } catch (e) {
        if (!cancelled) console.warn('[Compras] Facturas:', getFriendlyErrorMessage(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fromApi, refreshCompras])

  const eligibleCount = useMemo(
    () => ordersEligibleForFactura(state.purchaseOrders, state.receptions, state.supplierInvoices).length,
    [state.purchaseOrders, state.receptions, state.supplierInvoices]
  )

  const selectedInvoice = dialog ? invoices.find((f) => f.id === dialog.invoiceId) ?? null : null
  const selectedCanEdit = selectedInvoice ? canEditFacturaProveedor(selectedInvoice) : false

  const filtered = useMemo(() => {
    return invoices.filter((f) => {
      const matchSearch =
        search === '' ||
        f.id.toLowerCase().includes(search.toLowerCase()) ||
        f.supplier.toLowerCase().includes(search.toLowerCase()) ||
        f.orderId.toLowerCase().includes(search.toLowerCase()) ||
        (f.numeroFactura ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || f.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter, invoices])

  const handleRegistered = useCallback(async () => {
    if (fromApi) await refreshCompras()
  }, [fromApi, refreshCompras])

  async function handleDelete() {
    if (!deleteId) return
    const inv = invoices.find((f) => f.id === deleteId)
    if (inv && !canAnularFacturaProveedor(inv)) {
      showError('Las facturas pagadas o anuladas no se pueden eliminar ni anular.')
      setDeleteId(null)
      return
    }
    const result = await anularSupplierInvoice(deleteId)
    if (!result.success) {
      showError(result.errors?.join(' ') ?? 'No se pudo anular la factura.')
    } else {
      showSuccess('Factura anulada correctamente')
    }
    setDeleteId(null)
  }

  async function handleRegisterPayment() {
    if (!payId) return
    const inv = invoices.find((f) => f.id === payId)
    const result = await registerSupplierInvoicePayment(payId)
    if (!result.success) {
      showError(result.errors?.join(' ') ?? 'No se pudo registrar el pago.')
    } else {
      showSuccess(`Pago registrado — ${inv?.id ?? payId} marcada como pagada.`)
    }
    setPayId(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por factura, proveedor u orden..."
            filters={
              <Select
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'pending', label: 'Pendiente' },
                  { value: 'partial', label: 'Parcial' },
                  { value: 'paid', label: 'Pagada' },
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [invoiceStatusMap[statusFilter]?.label ?? statusFilter] : []}
            actions={
              <Button size="sm" icon={Plus} onClick={() => setRegisterOpen(true)} disabled={!comprasReady}>
                Registrar factura
                {eligibleCount > 0 ? ` (${eligibleCount})` : ''}
              </Button>
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Facturas de Proveedores"
          subtitle={
            loading
              ? 'Cargando…'
              : `${filtered.length} factura${filtered.length === 1 ? '' : 's'} — compras nacionales`
          }
        />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered as (SupplierInvoice & Record<string, unknown>)[]}
            columns={[
              {
                key: 'id',
                header: 'Código',
                render: (f) => (
                  <span className="font-mono text-xs text-corporate flex items-center gap-1">
                    <Receipt size={14} /> {f.id}
                  </span>
                ),
              },
              {
                key: 'numeroFactura',
                header: 'Nº proveedor',
                render: (f) => <span className="font-mono text-xs">{f.numeroFactura ?? '—'}</span>,
              },
              { key: 'supplier', header: 'Proveedor', render: (f) => <span className="font-medium">{f.supplier}</span> },
              { key: 'orderId', header: 'Orden', className: 'font-mono text-xs' },
              { key: 'date', header: 'Fecha', className: 'text-sm' },
              {
                key: 'amount',
                header: 'Monto',
                className: 'text-right',
                render: (f) => (
                  <span className="font-semibold text-corporate tabular-nums">
                    {formatMoney(f.amount, f.currency || 'DOP')}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Estado pago',
                render: (f) => {
                  const meta = invoiceStatusBadge(f)
                  return <Badge variant={meta.variant}>{meta.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (f) => {
                  const editable = canEditFacturaProveedor(f)
                  const canAnular = canAnularFacturaProveedor(f)
                  const canPay = canRegistrarPagoFacturaProveedor(f)
                  return (
                    <div className="flex items-center gap-2">
                      {canPay && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Wallet}
                          onClick={() => setPayId(f.id)}
                        >
                          Registrar pago
                        </Button>
                      )}
                      <TableActions
                        onView={() => setDialog({ invoiceId: f.id, mode: 'view' })}
                        onEdit={editable ? () => setDialog({ invoiceId: f.id, mode: 'edit' }) : undefined}
                        onDelete={canAnular ? () => setDeleteId(f.id) : undefined}
                      />
                    </div>
                  )
                },
              },
            ]}
          />
        </CardBody>
      </Card>

      <SupplierInvoiceRecordDialog
        invoice={selectedInvoice}
        mode={dialog?.mode === 'edit' && selectedCanEdit ? 'edit' : 'view'}
        open={!!dialog}
        onClose={() => setDialog(null)}
        allowEdit={selectedCanEdit}
        onEdit={() => selectedInvoice && setDialog({ invoiceId: selectedInvoice.id, mode: 'edit' })}
        onSave={(invoice) => {
          setDialog(null)
          showSuccess('Factura actualizada')
          void invoice
        }}
      />

      <RegistrarFacturaProveedorDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={handleRegistered}
      />

      <ConfirmDialog
        open={!!payId}
        title="Registrar pago"
        message="Se marcará la factura como pagada en su totalidad. ¿Continuar?"
        confirmLabel="Confirmar pago"
        onConfirm={() => void handleRegisterPayment()}
        onClose={() => setPayId(null)}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Anular factura"
        message="Se anulará la factura del proveedor. ¿Continuar?"
        confirmLabel="Anular"
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteId(null)}
      />
    </div>
  )
}
