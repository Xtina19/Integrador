import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { adminPath } from '@/lib/adminConfig'
import { trim } from '@/utils/formValidation'
import { almacenesApi, type AlmacenDto } from '@/services/api/almacenesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

const statusMap: Record<string, { label: string; variant: 'success' | 'neutral' }> = {
  Activo: { label: 'Activo', variant: 'success' },
  Inactivo: { label: 'Inactivo', variant: 'neutral' },
}

const statusOptions = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Inactivo', label: 'Inactivo' },
]

const typeOptions = [
  { value: 'Principal', label: 'Principal' },
  { value: 'Sucursal', label: 'Sucursal' },
  { value: 'Transito', label: 'Tránsito' },
  { value: 'Evento', label: 'Evento' },
]

export function AdminBranches() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    tipoAlmacen: 'Sucursal',
    estado: 'Activo',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await almacenesApi.list()
      setAlmacenes(list)
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void load()
  }, [load])

  const selected = dialog ? almacenes.find((b) => b.id === dialog.id) ?? null : null

  useEffect(() => {
    if (selected && dialog?.mode === 'edit') {
      setForm({
        codigo: selected.codigo,
        nombre: selected.nombre,
        tipoAlmacen: selected.tipoAlmacen || 'Sucursal',
        estado: selected.estado,
      })
    }
  }, [selected, dialog?.mode, dialog?.id])

  const validation = useMemo(() => {
    const name = trim(form.nombre)
    if (!name) return { valid: false, errors: ['Nombre es obligatorio'] }
    return { valid: true, errors: [] as string[] }
  }, [form.nombre])

  async function handleSave() {
    if (!selected || !validation.valid) return false
    try {
      await almacenesApi.update(selected.id, {
        codigo: trim(form.codigo) || selected.codigo,
        nombre: trim(form.nombre),
        tipoAlmacen: form.tipoAlmacen,
        sucursalId: selected.sucursalId ? Number(selected.sucursalId) : null,
        direccion: selected.direccion,
        ciudad: selected.ciudad,
        responsable: selected.responsable,
        telefono: selected.telefono,
      })
      showSuccess('Almacén actualizado')
      setDialog(null)
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
      return false
    }
  }

  async function toggle(a: AlmacenDto) {
    try {
      const next = a.estado === 'Activo' ? 'Inactivo' : 'Activo'
      await almacenesApi.setEstado(a.id, next)
      showSuccess(a.estado === 'Activo' ? 'Almacén desactivado' : 'Almacén activado')
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/inventario" className="text-corporate hover:underline">Inventario</Link>
          <span>/</span>
          <span>Almacenes</span>
          <span className="ml-2">— {loading ? '…' : `${almacenes.length} registros`}</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('sucursales', 'nuevo'))}>
          Registrar Almacén
        </Button>
      </div>

      <Card>
        <CardHeader title="Catálogo de Almacenes" subtitle="Ubicaciones de inventario por tipo" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={almacenes}
            columns={[
              { key: 'codigo', header: 'Código', render: (b) => <Badge variant="gold">{b.codigo}</Badge> },
              { key: 'nombre', header: 'Nombre', render: (b) => <span className="font-medium text-gray-900">{b.nombre}</span> },
              { key: 'tipoAlmacen', header: 'Tipo', render: (b) => <Badge variant="neutral">{b.tipoAlmacen || '—'}</Badge> },
              {
                key: 'estado',
                header: 'Estado',
                render: (b) => {
                  const s = statusMap[b.estado] || statusMap.Inactivo
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (b) => (
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-xs font-medium text-corporate hover:underline" onClick={() => void toggle(b)}>
                      {b.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                    </button>
                    <TableActions
                      onView={() => navigate(adminPath('sucursales', 'ver', b.id))}
                      onEdit={() => navigate(adminPath('sucursales', 'editar', b.id))}
                    />
                  </div>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <FormDialog
        open={Boolean(dialog && selected)}
        onClose={() => setDialog(null)}
        title={dialog?.mode === 'edit' ? 'Editar Almacén' : 'Detalle de Almacén'}
        subtitle={selected?.codigo}
        mode={dialog?.mode ?? 'view'}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
        onSave={() => void handleSave()}
        saveDisabled={!validation.valid}
      >
        {selected && dialog?.mode === 'view' ? (
          <>
            <DetailRow label="Código" value={<Badge variant="gold">{selected.codigo}</Badge>} />
            <DetailRow label="Nombre" value={selected.nombre} />
            <DetailRow label="Tipo" value={<Badge variant="neutral">{selected.tipoAlmacen || '—'}</Badge>} />
            <DetailRow label="Estado" value={<Badge variant={statusMap[selected.estado]?.variant || 'neutral'}>{statusMap[selected.estado]?.label}</Badge>} />
          </>
        ) : selected ? (
          <>
          {!validation.valid && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
              {validation.errors[0]}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} />
            <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <Select label="Tipo" value={form.tipoAlmacen} onChange={(e) => setForm({ ...form, tipoAlmacen: e.target.value })} options={typeOptions} />
            <Select label="Estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} options={statusOptions} />
          </div>
          </>
        ) : null}
      </FormDialog>
    </div>
  )
}
