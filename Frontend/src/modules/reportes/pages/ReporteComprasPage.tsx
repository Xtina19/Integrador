import { useMemo, useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { purchaseStatusMap } from '@/modules/compras/constants/comprasUi'
import { useTableExport } from '@/hooks/useTableExport'
import { useERP } from '@/store/ERPProvider'
import { formatDop } from '@/lib/money'

export function ReporteComprasPage() {
  const { state, comprasReady } = useERP()
  const { onExportPdf, onExportExcel } = useTableExport('Reporte Compras')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return state.purchaseOrders.filter(
      (o) =>
        search === '' ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.supplier.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, state.purchaseOrders])

  return (
    <div className="space-y-6">
      {!comprasReady && (
        <p className="text-sm text-gray-500">Cargando datos de Compras desde la base de datos…</p>
      )}
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
                  purchaseStatusMap[o.status]?.label ?? o.status,
                ])
              )
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Órdenes de Compra" subtitle={`${filtered.length} registros desde la base de datos`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'id', header: 'Orden', className: 'font-mono text-xs text-corporate' },
              { key: 'supplier', header: 'Proveedor', render: (o) => <span className="font-medium">{o.supplier}</span> },
              { key: 'date', header: 'Fecha', className: 'text-sm' },
              { key: 'items', header: 'Ítems', className: 'text-right tabular-nums' },
              {
                key: 'total',
                header: 'Total',
                className: 'text-right',
                render: (o) => <span className="font-semibold tabular-nums">{formatDop(o.total)}</span>,
              },
              {
                key: 'status',
                header: 'Estado',
                render: (o) => {
                  const meta = purchaseStatusMap[o.status] ?? { label: o.status, variant: 'neutral' as const }
                  return <Badge variant={meta.variant}>{meta.label}</Badge>
                },
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
