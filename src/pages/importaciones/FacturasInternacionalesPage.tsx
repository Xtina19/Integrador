import { useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { Toolbar } from '../../components/ui/Toolbar'
import { Select } from '../../components/ui/Input'
import type { InternationalInvoice } from '../../types/domain'
import { importPipelineLabels } from '../../business-rules/internationalPurchaseFlow'
import { useERP } from '../../store/ERPProvider'
import { useImportacionesSearch } from '../../context/ImportacionesSearchContext'
import { useGlobalSearchRecordEffect, useRecordHighlightScroll } from '../../context/GlobalSearchNavigationContext'
import { filterInternationalInvoices } from '../../lib/importSearchUtils'
import { InternationalInvoiceRecordDialog } from '../../components/importaciones/InternationalInvoiceRecordDialog'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useToast } from '../../context/ToastContext'

const invoiceStatusMap: Record<string, { label: string; variant: 'success' | 'warning' }> = {
  paid: { label: 'Pagada', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'warning' },
}

export function FacturasInternacionalesPage() {
  const { state, deleteInternationalInvoice } = useERP()
  const { showSuccess } = useToast()
  const { search, setSearch } = useImportacionesSearch()
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialog, setDialog] = useState<{ invoiceId: string; mode: 'view' | 'edit' } | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useGlobalSearchRecordEffect('invoice', {
    onView: (recordId) => setDialog({ invoiceId: recordId, mode: 'view' }),
    onHighlight: (recordId) => setHighlightId(recordId),
  })
  useRecordHighlightScroll(highlightId)

  const selectedInvoice = dialog
    ? state.internationalInvoices.find((f) => f.id === dialog.invoiceId) ?? null
    : null

  const filtered = useMemo(() => {
    const bySearch = filterInternationalInvoices(state.internationalInvoices, search)
    return bySearch.filter((f) => statusFilter === 'all' || f.status === statusFilter)
  }, [search, statusFilter, state.internationalInvoices])

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por factura, proveedor, OC o embarque..."
            filters={
              <Select
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'paid', label: 'Pagada' },
                  { value: 'pending', label: 'Pendiente' },
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [invoiceStatusMap[statusFilter]?.label ?? statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Facturas Internacionales" subtitle={`${filtered.length} facturas vinculadas a órdenes de compra`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            highlightId={highlightId}
            data={filtered as (InternationalInvoice & Record<string, unknown>)[]}
            columns={[
              {
                key: 'id',
                header: 'Factura',
                render: (f) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{f.id}</span>
                  </div>
                ),
              },
              { key: 'orderId', header: 'Orden de Compra', render: (f) => <span className="font-mono text-xs">{f.orderId}</span> },
              {
                key: 'shipment',
                header: 'Embarque',
                render: (f) => <span className="font-mono text-xs">{f.shipmentCode ?? '—'}</span>,
              },
              { key: 'supplier', header: 'Proveedor', render: (f) => <span className="font-medium">{f.supplier}</span> },
              { key: 'date', header: 'Fecha', className: 'text-sm' },
              { key: 'currency', header: 'Moneda' },
              { key: 'amount', header: 'Monto', render: (f) => <span className="font-semibold text-corporate">{f.amount.toLocaleString()}</span> },
              {
                key: 'stage',
                header: 'Etapa importación',
                render: (f) => <Badge variant="info">{importPipelineLabels[f.stage]}</Badge>,
              },
              {
                key: 'status',
                header: 'Estado pago',
                render: (f) => {
                  const cfg = invoiceStatusMap[f.status]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (f) => (
                  <TableActions
                    onView={() => setDialog({ invoiceId: f.id, mode: 'view' })}
                    onEdit={() => setDialog({ invoiceId: f.id, mode: 'edit' })}
                    onDelete={!f.shipmentId ? () => setDeleteId(f.id) : undefined}
                  />
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <InternationalInvoiceRecordDialog
        invoice={selectedInvoice}
        mode={dialog?.mode ?? 'view'}
        open={Boolean(dialog && selectedInvoice)}
        onClose={() => setDialog(null)}
        onEdit={() => dialog && setDialog({ ...dialog, mode: 'edit' })}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return
          const result = deleteInternationalInvoice(deleteId)
          if (result.success) showSuccess('Factura internacional eliminada correctamente')
          setDeleteId(null)
        }}
        message="¿Está seguro de eliminar esta factura internacional?"
      />
    </div>
  )
}
