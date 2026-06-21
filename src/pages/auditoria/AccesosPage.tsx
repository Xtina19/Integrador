import { useState } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { Toolbar } from '../../components/ui/Toolbar'
import { auditAccess } from '../../data/auditMockData'

export function AccesosPage() {
  const [search, setSearch] = useState('')

  const filtered = auditAccess.filter(
    (a) =>
      search === '' ||
      a.user.toLowerCase().includes(search.toLowerCase()) ||
      a.ip.includes(search)
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por usuario o IP..."
            onExportPdf={() => {}}
            onExportExcel={() => {}}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Registro de Accesos" subtitle="Inicios de sesión y eventos de autenticación" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'timestamp', header: 'Fecha/Hora', className: 'text-sm whitespace-nowrap' },
              { key: 'user', header: 'Usuario', render: (a) => <span className="font-medium">{a.user}</span> },
              { key: 'action', header: 'Acción' },
              { key: 'ip', header: 'IP', className: 'font-mono text-xs' },
              { key: 'device', header: 'Dispositivo', className: 'text-sm' },
              {
                key: 'status',
                header: 'Estado',
                render: (a) => (
                  <Badge variant={a.status === 'success' ? 'success' : 'danger'}>
                    {a.status === 'success' ? 'Exitoso' : 'Fallido'}
                  </Badge>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
