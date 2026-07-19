import { useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { purchaseOrders, purchaseStatusMap } from '@/mocks/mockCompras'
import { useTableExport } from '@/hooks/useTableExport'
import { formatDop } from '@/lib/money'

export function ReporteComprasPage() {
  const { onExportPdf, onExportExcel } = useTableExport('Reporte Compras')
  const [search, setSearch] = useState('')

  const filtered = purchaseOrders.filter(
    (o) =>
      search === '' ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por orden o proveedor..."
            onExportPdf={onExportPdf}
            onExportExcel={() =>
              onExportExcel(
                ['Orden', 'Proveedor', 'Fecha', 'Ítems', 'Total', 'Estado'],
                filtered.map((o) => [
                  o.id,
                  o.supplier,
                  o.date,
                  String(o.items),
                  formatDop(o.total),
                  purchaseStatusMap[o.status].label,
                ])
              )
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Reporte de Compras" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'id', header: 'Orden', render: (o) => <span className="font-mono text-xs text-corporate">{o.id}</span> },
              { key: 'supplier', header: 'Proveedor', render: (o) => <span className="font-medium">{o.supplier}</span> },
              { key: 'date', header: 'Fecha', className: 'text-sm' },
              { key: 'items', header: 'Ítems', className: 'text-right' },
              {
                key: 'total',
                header: 'Total',
                className: 'text-right font-mono tabular-nums',
                render: (o) => formatDop(o.total),
              },
              {
                key: 'status',
                header: 'Estado',
                render: (o) => {
                  const cfg = purchaseStatusMap[o.status]
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
