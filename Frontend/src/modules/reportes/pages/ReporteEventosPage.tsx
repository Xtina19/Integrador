import { useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { eventBudgets } from '@/mocks/mockEventos'
import { useTableExport } from '@/hooks/useTableExport'
import { formatDop } from '@/lib/money'

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
                  formatDop(e.budget),
                  formatDop(e.spent),
                  formatDop(e.remaining),
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
                className: 'text-right font-mono tabular-nums',
                render: (e) => formatDop(e.budget),
              },
              {
                key: 'spent',
                header: 'Gastado',
                className: 'text-right font-mono tabular-nums',
                render: (e) => formatDop(e.spent),
              },
              {
                key: 'remaining',
                header: 'Disponible',
                className: 'text-right font-mono tabular-nums',
                render: (e) => formatDop(e.remaining),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
