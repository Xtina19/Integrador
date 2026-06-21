import { useNavigate, Link } from 'react-router-dom'
import { Plus, Globe, FileText, BookMarked, Mail } from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { adminPublishers } from '../../data/adminMockData'
import { adminPath } from '../../lib/adminConfig'

const contractStatusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  active: { label: 'Vigente', variant: 'success' },
  expiring: { label: 'Por vencer', variant: 'warning' },
  expired: { label: 'Vencido', variant: 'danger' },
}

export function Editoriales() {
  const navigate = useNavigate()

  const totalProducts = adminPublishers.reduce((sum, p) => sum + p.productCount, 0)
  const activeContracts = adminPublishers.filter((p) => p.contractStatus === 'active').length
  const expiringSoon = adminPublishers.filter((p) => p.contractStatus === 'expiring')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
        <span>/</span>
        <span>Editoriales</span>
        <span className="ml-2">— {adminPublishers.length} registros</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Editoriales Registradas"
          value={adminPublishers.length}
          detail="Catálogo maestro activo"
          icon={<BookMarked size={22} />}
        />
        <StatCard
          title="Productos Asociados"
          value={totalProducts.toLocaleString()}
          detail="En catálogo"
          icon={<FileText size={22} />}
        />
        <StatCard
          title="Contratos Vigentes"
          value={activeContracts}
          detail="Contratos activos"
          icon={<Globe size={22} />}
        />
      </div>

      <div className="flex justify-end">
        <Button icon={Plus} onClick={() => navigate(adminPath('editoriales', 'nuevo'))}>
          Registrar Editorial
        </Button>
      </div>

      <Card>
        <CardHeader title="Listado de Editoriales" subtitle="Catálogo maestro de editoriales" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={adminPublishers}
            columns={[
              {
                key: 'name',
                header: 'Editorial',
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
                key: 'contact',
                header: 'Correo',
                render: (p) => (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail size={10} className="shrink-0" />
                    {p.contact}
                  </span>
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
              { key: 'contractType', header: 'Tipo de contrato', className: 'text-sm' },
              {
                key: 'productCount',
                header: 'Productos',
                render: (p) => <span className="font-semibold text-corporate">{p.productCount}</span>,
              },
              {
                key: 'contractStatus',
                header: 'Estado',
                render: (p) => {
                  const s = contractStatusMap[p.contractStatus]
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              {
                key: 'contractExpiry',
                header: 'Vencimiento',
                render: (p) => (
                  <span className={`text-sm ${p.contractStatus === 'expiring' ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>
                    {p.contractExpiry}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (p) => (
                  <TableActions
                    onView={() => navigate(adminPath('editoriales', 'ver', p.id))}
                    onEdit={() => navigate(adminPath('editoriales', 'editar', p.id))}
                    onDelete={() => navigate(adminPath('editoriales', 'eliminar', p.id))}
                  />
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      {expiringSoon.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {expiringSoon.map((p) => (
            <Card key={p.id} className="border-amber-200 bg-amber-50/30">
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-amber-800">Contrato próximo a vencer</p>
                    <p className="font-semibold text-gray-900 mt-1">{p.name}</p>
                    <p className="text-xs text-amber-600 font-medium mt-2">
                      Vence: {p.contractExpiry}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(adminPath('editoriales', 'editar', p.id))}
                  >
                    Renovar
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
