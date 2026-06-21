import { useState } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { Toolbar } from '../../components/ui/Toolbar'
import { salesHistory } from '../../data/salesMockData'

const statusMap = {
  paid: { label: 'Pagada', variant: 'success' as const },
  cancelled: { label: 'Anulada', variant: 'danger' as const },
}

export function ReporteVentasPage() {
  const [search, setSearch] = useState('')

  const filtered = salesHistory.filter(
    (s) =>
      search === '' ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.customer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por factura o cliente..."
            onExportPdf={() => {}}
            onExportExcel={() => {}}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Reporte de Ventas" subtitle="Historial de facturación" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'id', header: 'Factura', render: (s) => <span className="font-mono text-xs text-corporate">{s.id}</span> },
              { key: 'date', header: 'Fecha', className: 'text-sm whitespace-nowrap' },
              { key: 'customer', header: 'Cliente', render: (s) => <span className="font-medium">{s.customer}</span> },
              { key: 'branch', header: 'Sucursal' },
              {
                key: 'total',
                header: 'Total',
                className: 'text-right font-mono',
                render: (s) => `RD$${s.total.toLocaleString()}`,
              },
              {
                key: 'status',
                header: 'Estado',
                render: (s) => {
                  const cfg = statusMap[s.status]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
