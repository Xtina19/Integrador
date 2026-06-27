import { useState } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { Toolbar } from '../../components/ui/Toolbar'
import { kardexMovements } from '../../data/inventoryMockData'
import { useTableExport } from '../../lib/useTableExport'

export function ReporteInventarioPage() {
  const { onExportPdf, onExportExcel } = useTableExport('Reporte Inventario')
  const [search, setSearch] = useState('')

  const filtered = kardexMovements.filter(
    (m) =>
      search === '' ||
      m.product.toLowerCase().includes(search.toLowerCase()) ||
      m.reference.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por producto o referencia..."
            onExportPdf={onExportPdf}
            onExportExcel={() =>
              onExportExcel(
                ['Fecha', 'Producto', 'ISBN', 'Tipo', 'Cantidad', 'Saldo', 'Referencia', 'Usuario'],
                filtered.map((m) => [
                  m.date,
                  m.product,
                  m.isbn,
                  m.type,
                  String(m.qty),
                  String(m.balance),
                  m.reference,
                  m.user,
                ])
              )
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Reporte de Inventario" subtitle="Movimientos de kardex recientes" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'date', header: 'Fecha', className: 'text-sm whitespace-nowrap' },
              { key: 'product', header: 'Producto', render: (m) => <span className="font-medium">{m.product}</span> },
              { key: 'isbn', header: 'ISBN', className: 'font-mono text-xs' },
              {
                key: 'type',
                header: 'Tipo',
                render: (m) => (
                  <Badge variant={m.type === 'Entrada' ? 'success' : m.type === 'Salida' ? 'danger' : 'info'}>
                    {m.type}
                  </Badge>
                ),
              },
              { key: 'qty', header: 'Cantidad', className: 'text-right font-mono' },
              { key: 'balance', header: 'Saldo', className: 'text-right font-mono' },
              { key: 'reference', header: 'Referencia', className: 'font-mono text-xs text-corporate' },
              { key: 'user', header: 'Usuario', className: 'text-sm' },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
