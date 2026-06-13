import { Plus, MapPin, Phone, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { adminBranches } from '../../data/adminMockData'

const statusMap: Record<string, { label: string; variant: 'success' | 'neutral' }> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'neutral' },
}

export function AdminBranches() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
          <span>/</span>
          <span>Sucursales</span>
          <span className="ml-2">— {adminBranches.length} registros</span>
        </div>
        <Button icon={Plus}>Registrar Sucursal</Button>
      </div>

      <Card>
        <CardHeader title="Catálogo de Sucursales" subtitle="Puntos de venta, almacén central y ubicaciones" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={adminBranches}
            columns={[
              { key: 'name', header: 'Nombre', render: (b) => <span className="font-medium text-gray-900">{b.name}</span> },
              {
                key: 'address',
                header: 'Dirección',
                render: (b) => (
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPin size={12} className="text-gold-dark shrink-0" />
                    <span>{b.address}</span>
                  </div>
                ),
              },
              {
                key: 'phone',
                header: 'Teléfono',
                render: (b) => (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Phone size={12} className="text-gray-400 shrink-0" />
                    <span>{b.phone}</span>
                  </div>
                ),
              },
              {
                key: 'manager',
                header: 'Encargado',
                render: (b) => (
                  <div className="flex items-center gap-1.5 text-sm">
                    <User size={12} className="text-gray-400 shrink-0" />
                    <span>{b.manager}</span>
                  </div>
                ),
              },
              {
                key: 'inventory',
                header: 'Inventario',
                render: (b) => <span className="font-semibold text-corporate">{b.inventory.toLocaleString()} uds.</span>,
              },
              {
                key: 'status',
                header: 'Estado',
                render: (b) => {
                  const s = statusMap[b.status]
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
