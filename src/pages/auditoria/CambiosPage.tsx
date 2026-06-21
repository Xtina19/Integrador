import { useState } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Toolbar } from '../../components/ui/Toolbar'
import { auditChanges } from '../../data/auditMockData'

export function CambiosPage() {
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
            onExportPdf={() => {}}
            onExportExcel={() => {}}
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
