import { useState } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Toolbar } from '../../components/ui/Toolbar'
import { auditChanges } from '../../data/auditMockData'
import { useTableExport } from '../../lib/useTableExport'

export function CambiosPage() {
  const { onExportPdf, onExportExcel } = useTableExport('Cambios')
  const [search, setSearch] = useState('')

  const filtered = auditChanges.filter(
    (c) =>
      search === '' ||
      c.entity.toLowerCase().includes(search.toLowerCase()) ||
      c.field.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por entidad o campo..."
            onExportPdf={onExportPdf}
            onExportExcel={() =>
              onExportExcel(
                ['Fecha/Hora', 'Usuario', 'Entidad', 'Campo', 'Valor anterior', 'Valor nuevo', 'Módulo'],
                filtered.map((c) => [c.timestamp, c.user, c.entity, c.field, c.oldValue, c.newValue, c.module])
              )
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Historial de Cambios" subtitle="Modificaciones en campos del sistema" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'timestamp', header: 'Fecha/Hora', className: 'text-sm whitespace-nowrap' },
              { key: 'user', header: 'Usuario' },
              { key: 'entity', header: 'Entidad', render: (c) => <span className="font-medium">{c.entity}</span> },
              { key: 'field', header: 'Campo', className: 'font-mono text-xs' },
              { key: 'oldValue', header: 'Valor anterior', className: 'text-sm text-gray-500' },
              { key: 'newValue', header: 'Valor nuevo', className: 'text-sm font-medium' },
              { key: 'module', header: 'Módulo' },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
