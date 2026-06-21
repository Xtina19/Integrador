import { useState } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { Toolbar } from '../../components/ui/Toolbar'
import { shipments, shipmentStatusMap } from '../../data/importsMockData'

export function ReporteImportacionesPage() {
  const [search, setSearch] = useState('')

  const filtered = shipments.filter(
    (s) =>
      search === '' ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.origin.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por embarque u origen..."
            onExportPdf={() => {}}
            onExportExcel={() => {}}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Reporte de Importaciones" subtitle="Embarques y estado logístico" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'code', header: 'Embarque', render: (s) => <span className="font-mono text-xs text-corporate">{s.code}</span> },
              { key: 'type', header: 'Tipo' },
              { key: 'origin', header: 'Origen' },
              { key: 'destination', header: 'Destino' },
              { key: 'departure', header: 'Salida', className: 'text-sm' },
              { key: 'arrival', header: 'Llegada', className: 'text-sm' },
              { key: 'boxes', header: 'Cajas', className: 'text-right' },
              {
                key: 'status',
                header: 'Estado',
                render: (s) => {
                  const cfg = shipmentStatusMap[s.status]
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
