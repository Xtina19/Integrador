import { useState } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { Toolbar } from '../../components/ui/Toolbar'
import { notificationEmails } from '../../data/configMockData'

export function CorreosPage() {
  const [search, setSearch] = useState('')

  const filtered = notificationEmails.filter(
    (e) =>
      search === '' ||
      e.event.toLowerCase().includes(search.toLowerCase()) ||
      e.recipients.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por evento o destinatario..."
            onExportPdf={() => {}}
            onExportExcel={() => {}}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Correos de Notificación" subtitle="Destinatarios por tipo de evento" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'id', header: 'ID', render: (e) => <span className="font-mono text-xs text-corporate">{e.id}</span> },
              { key: 'event', header: 'Evento', render: (e) => <span className="font-medium">{e.event}</span> },
              { key: 'recipients', header: 'Destinatarios', className: 'text-sm' },
              {
                key: 'active',
                header: 'Estado',
                render: (e) => (
                  <Badge variant={e.active ? 'success' : 'neutral'}>
                    {e.active ? 'Activo' : 'Inactivo'}
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
