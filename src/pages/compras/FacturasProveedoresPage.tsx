import { useState, useMemo } from 'react'
import { Receipt } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { Toolbar } from '../../components/ui/Toolbar'
import { Select } from '../../components/ui/Input'
import { supplierInvoices } from '../../data/purchasesMockData'

const invoiceStatusMap: Record<string, { label: string; variant: 'success' | 'warning' }> = {
  paid: { label: 'Pagada', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'warning' },
}

export function FacturasProveedoresPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return supplierInvoices.filter((f) => {
      const matchSearch =
        search === '' ||
        f.id.toLowerCase().includes(search.toLowerCase()) ||
        f.supplier.toLowerCase().includes(search.toLowerCase()) ||
        f.orderId.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || f.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

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
        <CardHeader title="Facturas de Proveedores" subtitle={`${filtered.length} facturas registradas`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              {
                key: 'id',
                header: 'Factura',
                render: (f) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <Receipt size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{f.id}</span>
                  </div>
                ),
              },
              { key: 'supplier', header: 'Proveedor', render: (f) => <span className="font-medium">{f.supplier}</span> },
              { key: 'orderId', header: 'Orden de Compra', render: (f) => <span className="font-mono text-xs">{f.orderId}</span> },
              { key: 'date', header: 'Fecha', className: 'text-sm' },
              { key: 'amount', header: 'Monto', render: (f) => <span className="font-semibold text-corporate">RD${f.amount.toLocaleString()}</span> },
              {
                key: 'status',
                header: 'Estado',
                render: (f) => {
                  const cfg = invoiceStatusMap[f.status]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: () => <TableActions onView={() => {}} />,
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
