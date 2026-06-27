import { useState } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Toolbar } from '../../components/ui/Toolbar'
import { eventBudgets } from '../../data/eventsMockData'
import { useTableExport } from '../../lib/useTableExport'

export function ReporteEventosPage() {
  const { onExportPdf, onExportExcel } = useTableExport('Reporte Eventos')
  const [search, setSearch] = useState('')

  const filtered = eventBudgets.filter(
    (e) => search === '' || e.eventName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por evento..."
            onExportPdf={onExportPdf}
            onExportExcel={() =>
              onExportExcel(
                ['ID', 'Evento', 'Presupuesto', 'Gastado', 'Disponible'],
                filtered.map((e) => [
                  e.eventId,
                  e.eventName,
                  `RD$${e.budget.toLocaleString()}`,
                  `RD$${e.spent.toLocaleString()}`,
                  `RD$${e.remaining.toLocaleString()}`,
                ])
              )
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Reporte de Eventos" subtitle="Presupuesto vs. gasto por evento" />
        <CardBody className="!p-0">
          <Table
            keyField="eventId"
            data={filtered}
            columns={[
              { key: 'eventId', header: 'ID', render: (e) => <span className="font-mono text-xs text-corporate">{e.eventId}</span> },
              { key: 'eventName', header: 'Evento', render: (e) => <span className="font-medium">{e.eventName}</span> },
              {
                key: 'budget',
                header: 'Presupuesto',
                className: 'text-right font-mono',
                render: (e) => `RD$${e.budget.toLocaleString()}`,
              },
              {
                key: 'spent',
                header: 'Gastado',
                className: 'text-right font-mono',
                render: (e) => `RD$${e.spent.toLocaleString()}`,
              },
              {
                key: 'remaining',
                header: 'Disponible',
                className: 'text-right font-mono',
                render: (e) => `RD$${e.remaining.toLocaleString()}`,
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
