import { useMemo, useState } from 'react'
import { FormPageLayout } from '@/components/ui/FormPageLayout'
import { Input, Select } from '@/components/ui/Input'
import { roles } from '@/mocks/mockCore'
import { adminBranches } from '@/mocks/mockAdmin'
import { activeSessions, mfaSettings } from '@/mocks/mockUsuarios'
import { validateUser } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import { useToast } from '@/context/ToastContext'

const existingUsernames = [
  ...activeSessions.map((s) => s.user.split('@')[0]),
  ...mfaSettings.map((m) => m.user.split('@')[0]),
]
const existingEmails = [
  ...activeSessions.map((s) => s.user),
  ...mfaSettings.map((m) => m.user),
]

export function NuevoUsuarioPage() {
  const { showSuccess } = useToast()
  const [error, setError] = useState('')
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

  const validation = useMemo(
    () => validateUser(form, existingUsernames, existingEmails),
    [form]
  )

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Usuarios y Permisos', to: '/usuarios' },
        { label: 'Nuevo Usuario' },
      ]}
      title="Nuevo Usuario"
      subtitle="Alta de usuario del sistema"
      listPath="/usuarios"
      saveDisabled={!validation.valid}
      onSave={() => {
        if (!validation.valid) {
          setError(validation.errors.join(' '))
          return false
        }
        showSuccess(`Usuario ${trim(form.username)} registrado correctamente`)
        return true
      }}
    >
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">{error}</div>}
      {!validation.valid && !error && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
          {validation.errors[0]}
        </div>
      )}
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
