import { useState } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Toolbar } from '../../components/ui/Toolbar'
import { auditDeletions } from '../../data/auditMockData'
import { useTableExport } from '../../lib/useTableExport'

export function EliminacionesPage() {
  const { onExportPdf, onExportExcel } = useTableExport('Eliminaciones')
  const [search, setSearch] = useState('')

  const filtered = auditDeletions.filter(
    (d) =>
      search === '' ||
      d.entity.toLowerCase().includes(search.toLowerCase()) ||
      d.reason.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por entidad o motivo..."
            onExportPdf={onExportPdf}
            onExportExcel={() =>
              onExportExcel(
                ['Fecha/Hora', 'Usuario', 'Entidad', 'Módulo', 'Motivo'],
                filtered.map((d) => [d.timestamp, d.user, d.entity, d.module, d.reason])
              )
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Registro de Eliminaciones" subtitle="Entidades eliminadas del sistema" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'timestamp', header: 'Fecha/Hora', className: 'text-sm whitespace-nowrap' },
              { key: 'user', header: 'Usuario' },
              { key: 'entity', header: 'Entidad', render: (d) => <span className="font-medium">{d.entity}</span> },
              { key: 'module', header: 'Módulo' },
              { key: 'reason', header: 'Motivo', className: 'text-sm' },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
