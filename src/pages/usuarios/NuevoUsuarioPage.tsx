import { useState } from 'react'
import { FormPageLayout } from '../../components/ui/FormPageLayout'
import { Input, Select } from '../../components/ui/Input'
import { roles } from '../../data/mockData'
import { adminBranches } from '../../data/adminMockData'

export function NuevoUsuarioPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: roles[0]?.id ?? 'admin',
    branch: adminBranches[0]?.name ?? '',
    username: '',
    password: '',
    confirmPassword: '',
    mfaEnabled: false,
  })

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Usuarios y Permisos', to: '/usuarios' },
        { label: 'Nuevo Usuario' },
      ]}
      title="Nuevo Usuario"
      subtitle="Alta de usuario del sistema"
      listPath="/usuarios"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Nombre completo *" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="md:col-span-2" />
        <Input label="Correo *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Teléfono *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Select
          label="Rol *"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          options={roles.map((r) => ({ value: r.id, label: r.name }))}
        />
        <Select
          label="Sucursal *"
          value={form.branch}
          onChange={(e) => setForm({ ...form, branch: e.target.value })}
          options={adminBranches.map((b) => ({ value: b.name, label: b.name }))}
        />
        <Input label="Usuario *" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="md:col-span-2" />
        <Input label="Contraseña *" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <Input label="Confirmar contraseña *" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        <div className="md:col-span-2 flex items-center gap-3 pt-1">
          <input
            id="mfa"
            type="checkbox"
            checked={form.mfaEnabled}
            onChange={(e) => setForm({ ...form, mfaEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-corporate focus:ring-corporate/20"
          />
          <label htmlFor="mfa" className="text-sm font-medium text-gray-700">
            MFA habilitado
          </label>
        </div>
      </div>
    </FormPageLayout>
  )
}
