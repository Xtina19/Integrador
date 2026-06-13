import { Plus, Globe, Mail, BookMarked } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { adminPublishers } from '../../data/adminMockData'

const statusMap: Record<string, { label: string; variant: 'success' | 'neutral' }> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'neutral' },
}

export function AdminPublishers() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
          <span>/</span>
          <span>Editoriales</span>
          <span className="ml-2">— {adminPublishers.length} registros</span>
        </div>
        <Button icon={Plus}>Registrar Editorial</Button>
      </div>

      <Card>
        <CardHeader title="Catálogo Maestro de Editoriales" subtitle="Mantenimiento de editoriales y contratos" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={adminPublishers}
            columns={[
              {
                key: 'name',
                header: 'Nombre',
                render: (p) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <BookMarked size={16} className="text-corporate" />
                    </div>
                    <span className="font-medium text-gray-900">{p.name}</span>
                  </div>
                ),
              },
              {
                key: 'country',
                header: 'País',
                render: (p) => (
                  <div className="flex items-center gap-1.5">
                    <Globe size={14} className="text-gray-400" />
                    <span>{p.country}</span>
                  </div>
                ),
              },
              {
                key: 'contact',
                header: 'Contacto',
                render: (p) => (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail size={10} /> {p.contact}
                  </span>
                ),
              },
              { key: 'contractType', header: 'Tipo de Contrato', className: 'text-sm' },
              {
                key: 'productCount',
                header: 'Productos',
                render: (p) => <span className="font-semibold text-corporate">{p.productCount}</span>,
              },
              {
                key: 'status',
                header: 'Estado',
                render: (p) => {
                  const s = statusMap[p.status]
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: () => <TableActions onView={() => {}} onEdit={() => {}} onDelete={() => {}} />,
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
