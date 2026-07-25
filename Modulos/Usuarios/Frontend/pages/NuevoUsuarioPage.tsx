import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormPageLayout } from '@/components/ui/FormPageLayout'
import { Input, Select } from '@/components/ui/Input'
import { trim } from '@/utils/formValidation'
import { useToast } from '@/context/ToastContext'
import { rolesApi } from '@/services/api/rolesApi'
import { usuariosApi } from '@/services/api/usuariosApi'
import { getFriendlyErrorMessage } from '@/services/http'

export function NuevoUsuarioPage() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [error, setError] = useState('')
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    username: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    void (async () => {
      try {
        const list = (await rolesApi.list()) as { id: string; name: string; status: string }[]
        const active = list.filter((r) => r.status === 'active')
        setRoles(active.map((r) => ({ id: r.id, name: r.name })))
        if (active[0]) setForm((f) => ({ ...f, role: f.role || active[0].id }))
      } catch (err) {
        showError(getFriendlyErrorMessage(err))
      }
    })()
  }, [showError])

  const valid = useMemo(() => {
    if (!trim(form.fullName) || !trim(form.email) || !trim(form.username) || !form.role) return false
    if (form.password.length < 6) return false
    if (form.password !== form.confirmPassword) return false
    return true
  }, [form])

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Usuarios', to: '/administracion/usuarios' },
        { label: 'Nuevo Usuario' },
      ]}
      title="Nuevo Usuario"
      listPath="/administracion/usuarios"
      saveDisabled={!valid}
      onSave={() => {
        if (!valid) {
          setError('Complete los campos obligatorios y verifique la contraseña.')
          return false
        }
        void (async () => {
          try {
            const parts = trim(form.fullName).split(/\s+/)
            const nombre = parts[0] || form.fullName
            const apellido = parts.slice(1).join(' ')
            await usuariosApi.create({
              code: trim(form.username).toUpperCase(),
              name: nombre,
              lastName: apellido,
              email: trim(form.email),
              phone: trim(form.phone),
              roleId: form.role,
              password: form.password,
              status: 'active',
            })
            showSuccess(`Usuario ${trim(form.username)} registrado correctamente`)
            navigate('/administracion/usuarios')
          } catch (err) {
            setError(getFriendlyErrorMessage(err))
          }
        })()
        return false
      }}
    >
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">{error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Nombre completo *"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="md:col-span-2"
        />
        <Input label="Correo *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Select
          label="Rol *"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          options={roles.map((r) => ({ value: r.id, label: r.name }))}
        />
        <Input
          label="Usuario (código) *"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <Input
          label="Contraseña *"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Input
          label="Confirmar contraseña *"
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        />
      </div>
    </FormPageLayout>
  )
}
