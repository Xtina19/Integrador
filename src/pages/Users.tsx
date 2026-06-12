import { useState } from 'react'
import { Plus, Shield, UserCheck, ClipboardList, Check, X } from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { roles, auditLog, permissions } from '../data/mockData'

type Tab = 'roles' | 'permissions' | 'audit'

export function Users() {
  const [activeTab, setActiveTab] = useState<Tab>('roles')
  const totalUsers = roles.reduce((sum, r) => sum + r.users, 0)

  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'permissions', label: 'Permisos', icon: UserCheck },
    { id: 'audit', label: 'Auditoría', icon: ClipboardList },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Usuarios Activos"
          value={totalUsers}
          detail={`${roles.length} roles configurados`}
          icon={<UserCheck size={22} />}
        />
        <StatCard
          title="Roles del Sistema"
          value={roles.length}
          detail="Niveles de acceso"
          icon={<Shield size={22} />}
        />
        <StatCard
          title="Actividades Hoy"
          value={auditLog.length}
          detail="Registros de auditoría"
          icon={<ClipboardList size={22} />}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-corporate text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        <Button icon={Plus}>Nuevo Usuario</Button>
      </div>

      {activeTab === 'roles' && (
        <Card>
          <CardHeader title="Roles del Sistema" subtitle="Configuración de accesos por perfil" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={roles}
              columns={[
                {
                  key: 'name',
                  header: 'Rol',
                  render: (r) => (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center">
                        <Shield size={16} className="text-corporate" />
                      </div>
                      <span className="font-medium text-gray-900">{r.name}</span>
                    </div>
                  ),
                },
                {
                  key: 'users',
                  header: 'Usuarios',
                  render: (r) => <span className="font-semibold text-corporate">{r.users}</span>,
                },
                {
                  key: 'permissions',
                  header: 'Permisos',
                  render: (r) => (
                    <div className="flex flex-wrap gap-1">
                      {r.permissions.map((p) => (
                        <Badge key={p} variant={p === 'all' ? 'gold' : 'neutral'}>
                          {p === 'all' ? 'Acceso total' : p.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'permissions' && (
        <Card>
          <CardHeader title="Matriz de Permisos" subtitle="Permisos del rol Administrador" />
          <CardBody className="!p-0">
            <Table
              keyField="module"
              data={permissions}
              columns={[
                {
                  key: 'module',
                  header: 'Módulo',
                  render: (p) => <span className="font-medium text-gray-900">{p.module}</span>,
                },
                {
                  key: 'view',
                  header: 'Ver',
                  render: (p) => (
                    <span className={p.view ? 'text-emerald-600' : 'text-gray-300'}>
                      {p.view ? <Check size={18} /> : <X size={18} />}
                    </span>
                  ),
                },
                {
                  key: 'create',
                  header: 'Crear',
                  render: (p) => (
                    <span className={p.create ? 'text-emerald-600' : 'text-gray-300'}>
                      {p.create ? <Check size={18} /> : <X size={18} />}
                    </span>
                  ),
                },
                {
                  key: 'edit',
                  header: 'Editar',
                  render: (p) => (
                    <span className={p.edit ? 'text-emerald-600' : 'text-gray-300'}>
                      {p.edit ? <Check size={18} /> : <X size={18} />}
                    </span>
                  ),
                },
                {
                  key: 'delete',
                  header: 'Eliminar',
                  render: (p) => (
                    <span className={p.delete ? 'text-emerald-600' : 'text-gray-300'}>
                      {p.delete ? <Check size={18} /> : <X size={18} />}
                    </span>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'audit' && (
        <Card>
          <CardHeader title="Historial de Actividades" subtitle="Registro de auditoría del sistema" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={auditLog}
              columns={[
                {
                  key: 'timestamp',
                  header: 'Fecha/Hora',
                  className: 'text-xs text-gray-400 whitespace-nowrap',
                },
                {
                  key: 'user',
                  header: 'Usuario',
                  render: (a) => <span className="font-medium text-gray-900">{a.user}</span>,
                },
                {
                  key: 'action',
                  header: 'Acción',
                },
                {
                  key: 'module',
                  header: 'Módulo',
                  render: (a) => <Badge variant="neutral">{a.module}</Badge>,
                },
                {
                  key: 'ip',
                  header: 'IP',
                  className: 'text-xs font-mono text-gray-400',
                },
              ]}
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
