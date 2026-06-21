import { useNavigate, Link } from 'react-router-dom'
import { Plus, Globe, FileText, BookMarked, Mail, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { adminPublishers, getPublisherStats } from '../../data/adminMockData'
import { adminPath } from '../../lib/adminConfig'
import { contractStatusConfig, getContractVisualStatus } from '../../lib/publisherContractStatus'

export function Editoriales() {
  const navigate = useNavigate()
  const stats = getPublisherStats()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
          <span>/</span>
          <span>Editoriales</span>
          <span className="ml-2">— {stats.totalPublishers} registros</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('editoriales', 'nuevo'))}>
          Registrar Editorial
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Editoriales Registradas"
          value={stats.totalPublishers}
          detail="Catálogo maestro activo"
          icon={<BookMarked size={22} />}
        />
        <StatCard
          title="Productos Asociados"
          value={stats.totalProducts.toLocaleString()}
          detail="En catálogo"
          icon={<FileText size={22} />}
        />
        <StatCard
          title="Contratos Vigentes"
          value={stats.activeContracts}
          detail="Contratos activos"
          icon={<Globe size={22} />}
        />
        <StatCard
          title="Contratos por Vencer"
          value={stats.expiringCount}
          detail="Vencen en menos de 30 días"
          icon={<AlertTriangle size={22} />}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <span className="font-medium text-gray-700">Estado de contratos:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          Contrato Vigente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          Por vencer (&lt;30 días)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Contrato Vencido
        </span>
      </div>

      <Card>
        <CardHeader title="Listado de Editoriales" subtitle="Catálogo maestro de editoriales y contratos" />
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
              { key: 'contractType', header: 'Tipo de Contrato', className: 'text-sm' },
              {
                key: 'productCount',
                header: 'Productos Asociados',
                render: (p) => <span className="font-semibold text-corporate">{p.productCount}</span>,
              },
              {
                key: 'contractStatus',
                header: 'Estado',
                render: (p) => {
                  const status = getContractVisualStatus(p.contractExpiry)
                  const config = contractStatusConfig[status]
                  return <Badge variant={config.variant}>{config.label}</Badge>
                },
              },
              {
                key: 'contractExpiry',
                header: 'Fecha de Vencimiento',
                render: (p) => {
                  const status = getContractVisualStatus(p.contractExpiry)
                  const colorClass =
                    status === 'expired'
                      ? 'text-red-600 font-medium'
                      : status === 'expiring'
                        ? 'text-amber-600 font-medium'
                        : 'text-gray-600'
                  return <span className={`text-sm ${colorClass}`}>{p.contractExpiry}</span>
                },
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

      {stats.expiringSoon.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader
            title="Contratos Próximos a Vencer"
            subtitle="Editoriales con contratos que vencen en los próximos 30 días"
          />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={stats.expiringSoon}
              columns={[
                {
                  key: 'name',
                  header: 'Nombre Editorial',
                  render: (p) => <span className="font-medium text-gray-900">{p.name}</span>,
                },
                {
                  key: 'contractExpiry',
                  header: 'Fecha de vencimiento',
                  render: (p) => (
                    <span className="text-sm font-medium text-amber-600">{p.contractExpiry}</span>
                  ),
                },
                {
                  key: 'renew',
                  header: '',
                  render: (p) => (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(adminPath('editoriales', 'editar', p.id))}
                    >
                      Renovar
                    </Button>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
