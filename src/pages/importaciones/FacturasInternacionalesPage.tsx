import { useState, useMemo } from 'react'
import { FileText } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { Toolbar } from '../../components/ui/Toolbar'
import { Select } from '../../components/ui/Input'
import { internationalInvoices } from '../../data/importsMockData'

const invoiceStatusMap: Record<string, { label: string; variant: 'success' | 'warning' }> = {
  paid: { label: 'Pagada', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'warning' },
}

export function FacturasInternacionalesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return internationalInvoices.filter((f) => {
      const matchSearch =
        search === '' ||
        f.id.toLowerCase().includes(search.toLowerCase()) ||
        f.supplier.toLowerCase().includes(search.toLowerCase()) ||
        f.shipment.toLowerCase().includes(search.toLowerCase())
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
            searchPlaceholder="Buscar por factura, proveedor o embarque..."
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
        <CardHeader title="Facturas Internacionales" subtitle={`${filtered.length} facturas registradas`} />
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
                      <FileText size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{f.id}</span>
                  </div>
                ),
              },
              { key: 'shipment', header: 'Embarque', render: (f) => <span className="font-mono text-xs">{f.shipment}</span> },
              { key: 'supplier', header: 'Proveedor', render: (f) => <span className="font-medium">{f.supplier}</span> },
              { key: 'date', header: 'Fecha', className: 'text-sm' },
              { key: 'currency', header: 'Moneda' },
              { key: 'amount', header: 'Monto', render: (f) => <span className="font-semibold text-corporate">{f.amount.toLocaleString()}</span> },
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
