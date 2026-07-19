import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Shield, UserCheck } from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { rolesApi } from '@/services/api/rolesApi'
import { usuariosApi } from '@/services/api/usuariosApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

type Tab = 'usuarios' | 'roles'

type Rol = { id: string; code: string; name: string; description?: string; status: string; users?: number }
type Usuario = {
  id: string
  code: string
  name: string
  lastName?: string
  email: string
  roleName?: string
  status: string
}

export function Users() {
  const navigate = useNavigate()
  const { showError, showSuccess } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('usuarios')
  const [roles, setRoles] = useState<Rol[]>([])
  const [users, setUsers] = useState<Usuario[]>([])

  const load = useCallback(async () => {
    try {
      const [r, u] = await Promise.all([rolesApi.list(), usuariosApi.list()])
      setRoles(r as Rol[])
      setUsers(u as Usuario[])
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }, [showError])

  useEffect(() => {
    void load()
  }, [load])

  async function toggleUser(u: Usuario) {
    try {
      await usuariosApi.setEstado(u.id, u.status === 'active' ? 'inactive' : 'active')
      showSuccess(u.status === 'active' ? 'Usuario desactivado' : 'Usuario activado')
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  async function toggleRol(r: Rol) {
    try {
      await rolesApi.setEstado(r.id, r.status === 'active' ? 'inactive' : 'active')
      showSuccess(r.status === 'active' ? 'Rol desactivado' : 'Rol activado')
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: 'usuarios', label: 'Usuarios', icon: UserCheck },
    { id: 'roles', label: 'Roles', icon: Shield },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Usuarios"
          value={users.length}
          detail={`${users.filter((u) => u.status === 'active').length} activos`}
          icon={<UserCheck size={22} />}
        />
        <StatCard title="Roles" value={roles.length} detail="Perfiles del sistema" icon={<Shield size={22} />} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'bg-corporate text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/administracion/roles')}>
            Mant. Roles
          </Button>
          <Button icon={Plus} onClick={() => navigate('/administracion/usuarios/nuevo')}>
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {activeTab === 'usuarios' && (
        <Card>
          <CardHeader title="Usuarios del Sistema" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={users}
              columns={[
                { key: 'code', header: 'Código', render: (u) => <Badge variant="gold">{u.code}</Badge> },
                {
                  key: 'name',
                  header: 'Nombre',
                  render: (u) => (
                    <span className="font-medium">
                      {u.name} {u.lastName || ''}
                    </span>
                  ),
                },
                { key: 'email', header: 'Email' },
                { key: 'roleName', header: 'Rol' },
                {
                  key: 'status',
                  header: 'Estado',
                  render: (u) => (
                    <Badge variant={u.status === 'active' ? 'success' : 'neutral'}>
                      {u.status === 'active' ? 'Activo' : u.status === 'blocked' ? 'Bloqueado' : 'Inactivo'}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Acciones',
                  render: (u) => (
                    <button type="button" className="text-xs font-medium text-corporate hover:underline" onClick={() => void toggleUser(u)}>
                      {u.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'roles' && (
        <Card>
          <CardHeader title="Roles del Sistema" subtitle="Configuración de accesos por perfil" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={roles}
              columns={[
                { key: 'code', header: 'Código', render: (r) => <Badge variant="gold">{r.code}</Badge> },
                { key: 'name', header: 'Rol', render: (r) => <span className="font-medium">{r.name}</span> },
                { key: 'description', header: 'Descripción', render: (r) => r.description || '—' },
                { key: 'users', header: 'Usuarios', render: (r) => r.users ?? 0 },
                {
                  key: 'status',
                  header: 'Estado',
                  render: (r) => (
                    <Badge variant={r.status === 'active' ? 'success' : 'neutral'}>
                      {r.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Acciones',
                  render: (r) => (
                    <button type="button" className="text-xs font-medium text-corporate hover:underline" onClick={() => void toggleRol(r)}>
                      {r.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
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
