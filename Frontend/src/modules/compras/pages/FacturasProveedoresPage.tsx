import { useEffect, useMemo, useState } from 'react'
import { Receipt } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SupplierInvoiceRecordDialog, type SupplierInvoice } from '@/modules/compras/components/SupplierInvoiceRecordDialog'
import { useToast } from '@/context/ToastContext'
import { comprasApi } from '@/services/api/comprasApi'
import { loadComprasFromApi } from '@/services/api/comprasLoader'
import { getFriendlyErrorMessage } from '@/services/http'
import {
  invoiceStatusMap,
  canEditFacturaProveedor,
  canAnularFacturaProveedor,
} from '@/modules/compras/constants/comprasUi'
import { formatMoney } from '@/lib/money'

export function FacturasProveedoresPage() {
  const { showSuccess, showError } = useToast()
  const fromApi = comprasApi.isEnabled()
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialog, setDialog] = useState<{ invoiceId: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!fromApi) {
        setLoading(false)
        setInvoices([])
        return
      }
      try {
        const loaded = await loadComprasFromApi()
        if (!cancelled) setInvoices(loaded.supplierInvoices)
      } catch (e) {
        if (!cancelled) showError(getFriendlyErrorMessage(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fromApi, showError])

  const selectedInvoice = dialog ? invoices.find((f) => f.id === dialog.invoiceId) ?? null : null
  const selectedCanEdit = selectedInvoice ? canEditFacturaProveedor(selectedInvoice) : false

  const filtered = useMemo(() => {
    return invoices.filter((f) => {
      const matchSearch =
        search === '' ||
        f.id.toLowerCase().includes(search.toLowerCase()) ||
        f.supplier.toLowerCase().includes(search.toLowerCase()) ||
        f.orderId.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || f.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter, invoices])

  async function handleDelete() {
    if (!deleteId) return
    const inv = invoices.find((f) => f.id === deleteId)
    if (inv && !canAnularFacturaProveedor(inv)) {
      showError('Las facturas pagadas o anuladas no se pueden eliminar ni anular.')
      setDeleteId(null)
      return
    }
    try {
      if (fromApi && inv?.dbId) {
        await comprasApi.anularFactura(inv.dbId)
        const loaded = await loadComprasFromApi()
        setInvoices(loaded.supplierInvoices)
      } else {
        setInvoices((prev) => prev.filter((f) => f.id !== deleteId))
      }
      showSuccess(fromApi ? 'Factura anulada correctamente' : 'Factura eliminada correctamente')
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    }
    setDeleteId(null)
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
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Facturas de Proveedores"
          subtitle={loading ? 'Cargando…' : fromApi ? 'Registro de facturas' : undefined}
        />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered as (SupplierInvoice & Record<string, unknown>)[]}
            columns={[
              {
                key: 'id',
                header: 'Factura',
                render: (f) => (
                  <span className="font-mono text-xs text-corporate flex items-center gap-1">
                    <Receipt size={14} /> {f.id}
                  </span>
                ),
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
                header: 'Estado',
                render: (f) => {
                  const key = f.documentEstado === 'anulada' ? 'anulada' : f.status
                  const meta = invoiceStatusMap[key] ?? { label: f.status, variant: 'warning' as const }
                  return <Badge variant={meta.variant}>{meta.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (f) => {
                  const editable = canEditFacturaProveedor(f)
                  const canAnular = canAnularFacturaProveedor(f)
                  return (
                    <TableActions
                      onView={() => setDialog({ invoiceId: f.id, mode: 'view' })}
                      onEdit={editable ? () => setDialog({ invoiceId: f.id, mode: 'edit' }) : undefined}
                      onDelete={canAnular ? () => setDeleteId(f.id) : undefined}
                    />
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
          setInvoices((prev) => prev.map((f) => (f.id === invoice.id ? invoice : f)))
          setDialog(null)
          showSuccess('Factura actualizada')
        }}
      />

      <ConfirmDialog
        open={!!deleteId}
        title={fromApi ? 'Anular factura' : 'Eliminar factura'}
        message={
          fromApi
            ? 'Se anulará la factura del proveedor. ¿Continuar?'
            : '¿Eliminar esta factura de proveedor?'
        }
        confirmLabel={fromApi ? 'Anular' : 'Eliminar'}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteId(null)}
      />
    </div>
  )
}
