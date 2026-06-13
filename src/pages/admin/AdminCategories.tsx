import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { adminCategories } from '../../data/adminMockData'
import { adminPath } from '../../lib/adminConfig'

const statusMap: Record<string, { label: string; variant: 'success' | 'neutral' }> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'neutral' },
}

export function AdminCategories() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
          <span>/</span>
          <span>Categorías</span>
          <span className="ml-2">— {adminCategories.length} registros</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('categorias', 'nuevo'))}>
          Crear Categoría
        </Button>
      </div>

      <Card>
        <CardHeader title="Catálogo de Categorías" subtitle="Clasificación maestra de productos" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={adminCategories}
            columns={[
              { key: 'id', header: 'ID', className: 'text-xs font-mono text-gray-400' },
              { key: 'name', header: 'Nombre', render: (c) => <span className="font-medium text-gray-900">{c.name}</span> },
              { key: 'description', header: 'Descripción', className: 'text-sm text-gray-600 max-w-xs' },
              {
                key: 'productCount',
                header: 'Productos',
                render: (c) => <span className="font-semibold text-corporate">{c.productCount.toLocaleString()}</span>,
              },
              {
                key: 'status',
                header: 'Estado',
                render: (c) => {
                  const s = statusMap[c.status]
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (c) => (
                  <TableActions
                    onView={() => navigate(adminPath('categorias', 'ver', c.id))}
                    onEdit={() => navigate(adminPath('categorias', 'editar', c.id))}
                    onDelete={() => navigate(adminPath('categorias', 'eliminar', c.id))}
                  />
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
