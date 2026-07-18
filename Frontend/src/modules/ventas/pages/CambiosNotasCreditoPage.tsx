import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import { SaleExchangeDialog } from '@/modules/ventas/components/SaleExchangeDialog'
import { CreditNoteRecordDialog } from '@/modules/ventas/components/CreditNoteRecordDialog'
import { useSalesData } from '@/context/SalesDataContext'
import { useToast } from '@/context/ToastContext'
import type { CambiosPageTab, CreditNote, CreditNoteStatus, ProductExchangeRecord } from '@/modules/ventas/types/salesExchange'
import { CREDIT_NOTE_STATUS_LABELS } from '@/modules/ventas/types/salesExchange'

const PAGE_TABS: { id: CambiosPageTab; label: string }[] = [
  { id: 'cambios', label: 'Cambios de Productos' },
  { id: 'notas', label: 'Notas de Crédito' },
]

const creditNoteStatusVariant: Record<CreditNoteStatus, 'success' | 'neutral' | 'danger'> = {
  active: 'success',
  used: 'neutral',
  expired: 'danger',
}

export function CambiosNotasCreditoPage() {
  const { productExchanges, creditNotes } = useSalesData()
  const { showSuccess } = useToast()

  const [activeTab, setActiveTab] = useState<CambiosPageTab>('cambios')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [newExchangeOpen, setNewExchangeOpen] = useState(false)
  const [viewNoteId, setViewNoteId] = useState<string | null>(null)

  const selectedNote = viewNoteId ? creditNotes.find((n) => n.id === viewNoteId) ?? null : null

  const filteredExchanges = useMemo(() => {
    if (!search) return productExchanges
    const q = search.toLowerCase()
    return productExchanges.filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        e.invoiceId.toLowerCase().includes(q) ||
        e.originalProductTitle.toLowerCase().includes(q) ||
        e.newProductTitle.toLowerCase().includes(q)
    )
  }, [productExchanges, search])

  const filteredNotes = useMemo(() => {
    return creditNotes.filter((n) => {
      const matchSearch =
        search === '' ||
        n.id.toLowerCase().includes(search.toLowerCase()) ||
        n.invoiceId.toLowerCase().includes(search.toLowerCase()) ||
        n.reason.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || n.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [creditNotes, search, statusFilter])

  function handlePrint(note: CreditNote) {
    showSuccess(`Nota de crédito ${note.id} enviada a impresión (simulado)`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto">
          {PAGE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setSearch('')
                setStatusFilter('all')
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'bg-corporate text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === 'cambios' && (
          <Button icon={Plus} onClick={() => setNewExchangeOpen(true)}>
            Nuevo Cambio
          </Button>
        )}
      </div>

      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder={
              activeTab === 'cambios' ? 'Buscar por código, factura o producto...' : 'Buscar por número, factura o motivo...'
            }
            filters={
              activeTab === 'notas' ? (
                <Select
                  label="Estado"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Todos' },
                    { value: 'active', label: 'Activas' },
                    { value: 'used', label: 'Utilizadas' },
                    { value: 'expired', label: 'Vencidas' },
                  ]}
                />
              ) : undefined
            }
            activeFilters={
              activeTab === 'notas' && statusFilter !== 'all'
                ? [CREDIT_NOTE_STATUS_LABELS[statusFilter as CreditNoteStatus] ?? statusFilter]
                : []
            }
          />
        </CardBody>
      </Card>

      {activeTab === 'cambios' && (
        <Card>
          <CardHeader title="Cambios de Productos" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={filteredExchanges as (ProductExchangeRecord & Record<string, unknown>)[]}
              columns={[
                { key: 'id', header: 'Código', render: (r) => <span className="font-mono text-xs text-corporate">{r.id}</span> },
                { key: 'invoiceId', header: 'Factura', render: (r) => <span className="font-mono text-xs">{r.invoiceId}</span> },
                { key: 'originalProductTitle', header: 'Producto entregado', render: (r) => <span className="font-medium">{r.originalProductTitle}</span> },
                { key: 'newProductTitle', header: 'Producto nuevo', render: (r) => <span className="font-medium">{r.newProductTitle}</span> },
                { key: 'qty', header: 'Cantidad' },
                {
                  key: 'priceDifference',
                  header: 'Diferencia',
                  render: (r: ProductExchangeRecord) => (
                    <span className={r.priceDifference < 0 ? 'text-emerald-600' : r.priceDifference > 0 ? 'text-corporate' : 'text-gray-600'}>
                      {r.priceDifference === 0
                        ? 'Sin diferencia'
                        : `RD$${Math.abs(r.priceDifference).toLocaleString()}`}
                    </span>
                  ),
                },
                { key: 'user', header: 'Usuario' },
                { key: 'date', header: 'Fecha', className: 'text-sm whitespace-nowrap' },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'notas' && (
        <Card>
          <CardHeader title="Notas de Crédito" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={filteredNotes as (CreditNote & Record<string, unknown>)[]}
              columns={[
                { key: 'id', header: 'Número', render: (n) => <span className="font-mono text-xs text-corporate">{n.id}</span> },
                { key: 'invoiceId', header: 'Factura', render: (n) => <span className="font-mono text-xs">{n.invoiceId}</span> },
                { key: 'date', header: 'Fecha', className: 'text-sm whitespace-nowrap' },
                {
                  key: 'amount',
                  header: 'Monto',
                  render: (n) => <span className="font-semibold text-emerald-600">RD${n.amount.toLocaleString()}</span>,
                },
                {
                  key: 'status',
                  header: 'Estado',
                  render: (n: CreditNote) => (
                    <Badge variant={creditNoteStatusVariant[n.status]}>{CREDIT_NOTE_STATUS_LABELS[n.status]}</Badge>
                  ),
                },
                { key: 'reason', header: 'Motivo' },
                {
                  key: 'actions',
                  header: 'Acciones',
                  render: (n: CreditNote) => (
                    <TableActions
                      onView={() => setViewNoteId(n.id)}
                      onPrint={() => handlePrint(n)}
                    />
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      )}

      <SaleExchangeDialog
        open={newExchangeOpen}
        onClose={() => setNewExchangeOpen(false)}
        onCompleted={() => setNewExchangeOpen(false)}
      />

      <CreditNoteRecordDialog
        note={selectedNote}
        open={Boolean(selectedNote)}
        onClose={() => setViewNoteId(null)}
      />
    </div>
  )
}
