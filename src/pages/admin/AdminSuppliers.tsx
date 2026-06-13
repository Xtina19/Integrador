import { useNavigate } from 'react-router-dom'
import { Plus, Mail, Phone, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { adminSuppliers } from '../../data/adminMockData'
import { adminPath } from '../../lib/adminConfig'

export function AdminSuppliers() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
          <span>/</span>
          <span>Proveedores</span>
          <span className="ml-2">— {adminSuppliers.length} registros</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('proveedores', 'nuevo'))}>
          Registrar Proveedor
        </Button>
      </div>

      <Card>
        <CardHeader title="Catálogo de Proveedores" subtitle="Proveedores, distribuidores y servicios" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={adminSuppliers}
            columns={[
              { key: 'name', header: 'Nombre', render: (s) => <span className="font-medium text-gray-900">{s.name}</span> },
              {
                key: 'contact',
                header: 'Contacto',
                render: (s) => (
                  <div className="flex items-center gap-1.5 text-sm">
                    <User size={12} className="text-gray-400 shrink-0" />
                    <span>{s.contact}</span>
                  </div>
                ),
              },
              {
                key: 'email',
                header: 'Correo',
                render: (s) => (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Mail size={10} className="shrink-0" />
                    <span>{s.email}</span>
                  </div>
                ),
              },
              {
                key: 'phone',
                header: 'Teléfono',
                render: (s) => (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Phone size={12} className="text-gray-400 shrink-0" />
                    <span>{s.phone}</span>
                  </div>
                ),
              },
              { key: 'supplierType', header: 'Tipo', render: (s) => <Badge variant="neutral">{s.supplierType}</Badge> },
              {
                key: 'purchasesCount',
                header: 'Compras',
                render: (s) => <span className="font-semibold text-corporate">{s.purchasesCount}</span>,
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (s) => (
                  <TableActions
                    onView={() => navigate(adminPath('proveedores', 'ver', s.id))}
                    onEdit={() => navigate(adminPath('proveedores', 'editar', s.id))}
                    onDelete={() => navigate(adminPath('proveedores', 'eliminar', s.id))}
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
