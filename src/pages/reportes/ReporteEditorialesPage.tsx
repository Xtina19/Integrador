import { useState } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { Toolbar } from '../../components/ui/Toolbar'
import { publisherContracts } from '../../data/adminMockData'
import { contractStatusConfig, getContractVisualStatus } from '../../lib/publisherContractStatus'
import { useTableExport } from '../../lib/useTableExport'

export function ReporteEditorialesPage() {
  const { onExportPdf, onExportExcel } = useTableExport('Reporte Editoriales')
  const [search, setSearch] = useState('')

  const filtered = publisherContracts.filter(
    (c) =>
      search === '' ||
      c.publisherName.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por editorial o código..."
            onExportPdf={onExportPdf}
            onExportExcel={() =>
              onExportExcel(
                ['Código', 'Editorial', 'Tipo', 'Inicio', 'Fin', 'Estado', 'Responsable'],
                filtered.map((c) => {
                  const visual = getContractVisualStatus(c.endDate)
                  return [
                    c.code,
                    c.publisherName,
                    c.type,
                    c.startDate,
                    c.endDate,
                    contractStatusConfig[visual].label,
                    c.responsible,
                  ]
                })
              )
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Reporte de Editoriales" subtitle="Contratos y vigencia" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'code', header: 'Código', render: (c) => <span className="font-mono text-xs text-corporate">{c.code}</span> },
              { key: 'publisherName', header: 'Editorial', render: (c) => <span className="font-medium">{c.publisherName}</span> },
              { key: 'type', header: 'Tipo' },
              { key: 'startDate', header: 'Inicio', className: 'text-sm' },
              { key: 'endDate', header: 'Fin', className: 'text-sm' },
              {
                key: 'status',
                header: 'Estado',
                render: (c) => {
                  const visual = getContractVisualStatus(c.endDate)
                  const cfg = contractStatusConfig[visual]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              { key: 'responsible', header: 'Responsable' },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
