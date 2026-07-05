import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Shield, UserCheck, Monitor, KeyRound, AlertOctagon, Smartphone } from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { roles, permissions } from '@/mocks/mockCore'
import { activeSessions, accessHistory, failedAttempts, mfaSettings } from '@/mocks/mockUsuarios'
import { useGlobalSearchRecordEffect, useRecordHighlightScroll } from '@/context/GlobalSearchNavigationContext'

type Tab = 'roles' | 'permissions' | 'sesiones' | 'accesos' | 'fallidos' | 'mfa'

export function Users() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('roles')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const totalUsers = roles.reduce((sum, r) => sum + r.users, 0)

  useGlobalSearchRecordEffect('user', {
    onHighlight: (recordId) => {
      setActiveTab('mfa')
      setHighlightId(recordId)
    },
  })
  useRecordHighlightScroll(highlightId)

  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'permissions', label: 'Permisos', icon: UserCheck },
    { id: 'sesiones', label: 'Sesiones', icon: Monitor },
    { id: 'accesos', label: 'Historial', icon: KeyRound },
    { id: 'fallidos', label: 'Intentos Fallidos', icon: AlertOctagon },
    { id: 'mfa', label: 'MFA', icon: Smartphone },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Usuarios Activos" value={totalUsers} detail={`${roles.length} roles configurados`} icon={<UserCheck size={22} />} />
        <StatCard title="Sesiones Activas" value={activeSessions.length} detail="Conectados ahora" icon={<Monitor size={22} />} />
        <StatCard title="Intentos Fallidos" value={failedAttempts.length} detail="Últimas 24 horas" icon={<AlertOctagon size={22} />} />
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
        <Button icon={Plus} onClick={() => navigate('/usuarios/nuevo')}>Nuevo Usuario</Button>
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
                { key: 'users', header: 'Usuarios', render: (r) => <span className="font-semibold text-corporate">{r.users}</span> },
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
                { key: 'module', header: 'Módulo', render: (p) => <span className="font-medium text-gray-900">{p.module}</span> },
                { key: 'view', header: 'Ver', render: (p) => <Badge variant={p.view ? 'success' : 'neutral'}>{p.view ? 'Sí' : 'No'}</Badge> },
                { key: 'create', header: 'Crear', render: (p) => <Badge variant={p.create ? 'success' : 'neutral'}>{p.create ? 'Sí' : 'No'}</Badge> },
                { key: 'edit', header: 'Editar', render: (p) => <Badge variant={p.edit ? 'success' : 'neutral'}>{p.edit ? 'Sí' : 'No'}</Badge> },
                { key: 'delete', header: 'Eliminar', render: (p) => <Badge variant={p.delete ? 'success' : 'neutral'}>{p.delete ? 'Sí' : 'No'}</Badge> },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'sesiones' && (
        <Card>
          <CardHeader title="Sesiones Activas" subtitle="Usuarios conectados al sistema" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={activeSessions}
              columns={[
                { key: 'name', header: 'Usuario', render: (s) => <span className="font-medium">{s.name}</span> },
                { key: 'user', header: 'Correo', className: 'text-sm text-gray-500' },
                { key: 'device', header: 'Dispositivo' },
                { key: 'ip', header: 'IP', className: 'text-xs font-mono' },
                { key: 'started', header: 'Inicio' },
                { key: 'lastActivity', header: 'Última actividad' },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'accesos' && (
        <Card>
          <CardHeader title="Historial de Acceso" subtitle="Inicios y cierres de sesión" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={accessHistory}
              columns={[
                { key: 'timestamp', header: 'Fecha/Hora', className: 'text-xs whitespace-nowrap' },
                { key: 'user', header: 'Usuario', render: (a) => <span className="font-medium">{a.user}</span> },
                { key: 'action', header: 'Acción' },
                { key: 'ip', header: 'IP', className: 'text-xs font-mono' },
                { key: 'device', header: 'Dispositivo', className: 'text-xs' },
                { key: 'status', header: 'Estado', render: (a) => <Badge variant={a.status === 'success' ? 'success' : 'danger'}>{a.status === 'success' ? 'Exitoso' : 'Fallido'}</Badge> },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'fallidos' && (
        <Card>
          <CardHeader title="Intentos Fallidos de Acceso" subtitle="Alertas de seguridad" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={failedAttempts}
              columns={[
                { key: 'timestamp', header: 'Fecha/Hora', className: 'text-xs' },
                { key: 'username', header: 'Usuario', render: (f) => <span className="font-medium">{f.username}</span> },
                { key: 'ip', header: 'IP', className: 'text-xs font-mono' },
                { key: 'reason', header: 'Motivo', render: (f) => <Badge variant="danger">{f.reason}</Badge> },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'mfa' && (
        <Card>
          <CardHeader title="Autenticación Multifactor (MFA)" subtitle="Estado de MFA por usuario" />
          <CardBody className="!p-0">
            <Table
              keyField="user"
              highlightId={highlightId}
              data={mfaSettings}
              columns={[
                { key: 'name', header: 'Usuario', render: (m) => <span className="font-medium">{m.name}</span> },
                { key: 'user', header: 'Correo', className: 'text-sm text-gray-500' },
                { key: 'mfaEnabled', header: 'MFA', render: (m) => <Badge variant={m.mfaEnabled ? 'success' : 'warning'}>{m.mfaEnabled ? 'Activo' : 'Inactivo'}</Badge> },
                { key: 'method', header: 'Método' },
                { key: 'lastVerified', header: 'Última verificación' },
              ]}
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
