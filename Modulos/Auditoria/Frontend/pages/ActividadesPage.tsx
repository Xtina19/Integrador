import { useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { auditActivities } from '@/mocks/mockAuditoria'
import { useTableExport } from '@/hooks/useTableExport'

const typeMap = {
  create: { label: 'Creación', variant: 'success' as const },
  update: { label: 'Actualización', variant: 'warning' as const },
  delete: { label: 'Eliminación', variant: 'danger' as const },
}

export function ActividadesPage() {
  const { onExportPdf, onExportExcel } = useTableExport('Actividades')
  const [search, setSearch] = useState('')

  const filtered = auditActivities.filter(
    (a) =>
      search === '' ||
      a.action.toLowerCase().includes(search.toLowerCase()) ||
      a.user.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por acción o usuario..."
            onExportPdf={onExportPdf}
            onExportExcel={() =>
              onExportExcel(
                ['Fecha/Hora', 'Usuario', 'Acción', 'Módulo', 'Tipo'],
                filtered.map((a) => [a.timestamp, a.user, a.action, a.module, typeMap[a.type].label])
              )
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Registro de Actividades" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'timestamp', header: 'Fecha/Hora', className: 'text-sm whitespace-nowrap' },
              { key: 'user', header: 'Usuario', render: (a) => <span className="font-medium">{a.user}</span> },
              { key: 'action', header: 'Acción' },
              { key: 'module', header: 'Módulo' },
              {
                key: 'type',
                header: 'Tipo',
                render: (a) => {
                  const cfg = typeMap[a.type]
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
