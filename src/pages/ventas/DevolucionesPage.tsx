import { useState, useMemo } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { Toolbar } from '../../components/ui/Toolbar'
import { Select } from '../../components/ui/Input'
import { FormDialog, DetailRow } from '../../components/ui/FormDialog'
import { useSalesData } from '../../context/SalesDataContext'

const statusConfig = {
  approved: { label: 'Aprobada', variant: 'success' as const },
  pending: { label: 'Pendiente', variant: 'warning' as const },
  rejected: { label: 'Rechazada', variant: 'danger' as const },
}

export function DevolucionesPage() {
  const { returns, updateReturnStatus } = useSalesData()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewId, setViewId] = useState<string | null>(null)

  const selectedReturn = viewId ? returns.find((r) => r.id === viewId) ?? null : null

  const filtered = useMemo(() => {
    return returns.filter((r) => {
      const matchSearch =
        search === '' ||
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.invoice.toLowerCase().includes(search.toLowerCase()) ||
        r.product.toLowerCase().includes(search.toLowerCase()) ||
        r.reason.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter, returns])

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por código, factura o producto..."
            filters={
              <Select
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'approved', label: 'Aprobadas' },
                  { value: 'pending', label: 'Pendientes' },
                  { value: 'rejected', label: 'Rechazadas' },
                ]}
              />
            }
            activeFilters={
              statusFilter !== 'all'
                ? [statusConfig[statusFilter as keyof typeof statusConfig]?.label ?? statusFilter]
                : []
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Devoluciones" subtitle={`${filtered.length} solicitudes`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'id', header: 'Código', render: (r) => <span className="font-mono text-xs text-corporate">{r.id}</span> },
              { key: 'invoice', header: 'Factura', render: (r) => <span className="font-mono text-xs text-gray-600">{r.invoice}</span> },
              { key: 'product', header: 'Producto', render: (r) => <span className="font-medium text-gray-900">{r.product}</span> },
              { key: 'reason', header: 'Motivo' },
              { key: 'date', header: 'Fecha', className: 'text-sm whitespace-nowrap' },
              {
                key: 'status',
                header: 'Estado',
                render: (r) => {
                  const cfg = statusConfig[r.status]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    {r.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => updateReturnStatus(r.id, 'approved')}>
                          Aprobar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateReturnStatus(r.id, 'rejected')}>
                          Rechazar
                        </Button>
                      </>
                    )}
                    <TableActions onView={() => setViewId(r.id)} />
                  </div>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <FormDialog
        open={Boolean(selectedReturn)}
        onClose={() => setViewId(null)}
        title="Detalle de Devolución"
        subtitle={selectedReturn?.id}
        mode="view"
      >
        {selectedReturn && (
          <div className="space-y-1">
            <DetailRow label="Código" value={<span className="font-mono">{selectedReturn.id}</span>} />
            <DetailRow label="Factura" value={<span className="font-mono">{selectedReturn.invoice}</span>} />
            <DetailRow label="Producto" value={selectedReturn.product} />
            <DetailRow label="Motivo" value={selectedReturn.reason} />
            <DetailRow label="Fecha" value={selectedReturn.date} />
            <DetailRow
              label="Estado"
              value={
                <Badge variant={statusConfig[selectedReturn.status].variant}>
                  {statusConfig[selectedReturn.status].label}
                </Badge>
              }
            />
          </div>
        )}
      </FormDialog>
    </div>
  )
}
