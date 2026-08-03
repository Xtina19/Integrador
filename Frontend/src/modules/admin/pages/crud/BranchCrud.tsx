import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminFormLayout } from '@/modules/admin/components/AdminFormLayout'
import {
  AdminDetailLayout,
  AdminDeleteLayout,
} from '@/modules/admin/components/AdminDetailLayout'
import {
  DetailSection,
  DetailRow,
} from '@/modules/admin/components/AdminDetailSection'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { RecordNotFound } from '@/modules/admin/components/RecordNotFound'
import { ADMIN_MODULES } from '@/lib/adminConfig'
import { trim } from '@/utils/formValidation'
import {
  almacenesApi,
  type AlmacenDto,
  type GuardarAlmacenRequest,
  type SucursalOptionDto,
} from '@/services/api/almacenesApi'
import { ensureCode } from '@/services/api/httpList'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

const config = ADMIN_MODULES.sucursales

const typeOptions = [
  { value: 'Principal', label: 'Principal' },
  { value: 'Sucursal', label: 'Sucursal' },
  { value: 'Transito', label: 'Tránsito' },
  { value: 'Evento', label: 'Evento' },
]

interface AlmacenFormState {
  sucursalId: string
  codigo: string
  nombre: string
  tipoAlmacen: string
  direccion: string
  ciudad: string
  responsable: string
  telefono: string
}

const EMPTY_FORM: AlmacenFormState = {
  sucursalId: '',
  codigo: '',
  nombre: '',
  tipoAlmacen: 'Sucursal',
  direccion: '',
  ciudad: '',
  responsable: '',
  telefono: '',
}

function toForm(almacen: AlmacenDto): AlmacenFormState {
  return {
    sucursalId: almacen.sucursalId ?? '',
    codigo: almacen.codigo,
    nombre: almacen.nombre,
    tipoAlmacen: almacen.tipoAlmacen || 'Sucursal',
    direccion: almacen.direccion,
    ciudad: almacen.ciudad,
    responsable: almacen.responsable,
    telefono: almacen.telefono,
  }
}

function statusBadge(almacen: AlmacenDto) {
  return (
    <Badge
      variant={
        almacen.estado === 'Activo'
          ? 'success'
          : 'neutral'
      }
    >
      {almacen.estado}
    </Badge>
  )
}

export function BranchFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()

  const [existing, setExisting] =
    useState<AlmacenDto | null>(null)

  const [almacenes, setAlmacenes] =
    useState<AlmacenDto[]>([])

  const [sucursales, setSucursales] =
    useState<SucursalOptionDto[]>([])

  const [form, setForm] =
    useState<AlmacenFormState>(EMPTY_FORM)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)

      try {
        const [almacenesList, sucursalesList] =
          await Promise.all([
            almacenesApi.list(),
            almacenesApi.listSucursales(),
          ])

        if (cancelled) return

        setAlmacenes(almacenesList)
        setSucursales(sucursalesList)

        if (isEdit && id) {
          const almacen =
            almacenesList.find((row) => row.id === id) ??
            (await almacenesApi.getById(id))

          if (cancelled) return

          if (!almacen) {
            setNotFound(true)
            return
          }

          setExisting(almacen)
          setForm(toForm(almacen))
        }
      } catch (err) {
        if (isEdit) {
          setNotFound(true)
        }

        showError(getFriendlyErrorMessage(err))
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [id, isEdit, showError])

  const validation = useMemo(() => {
    const errors: string[] = []

    if (!trim(form.nombre)) {
      errors.push('El nombre es obligatorio.')
    }

    if (!form.sucursalId) {
      errors.push('Seleccione una sucursal.')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }, [form.nombre, form.sucursalId])

  function buildPayload(): GuardarAlmacenRequest {
    const otherCodes = almacenes
      .filter((almacen) => almacen.id !== id)
      .map((almacen) => almacen.codigo)

    const codigo = ensureCode(
      'ALM',
      trim(form.nombre),
      trim(form.codigo),
      otherCodes,
    )

    return {
      sucursalId: form.sucursalId
        ? Number(form.sucursalId)
        : null,
      codigo,
      nombre: trim(form.nombre),
      tipoAlmacen: form.tipoAlmacen,
      direccion: trim(form.direccion),
      ciudad: trim(form.ciudad),
      responsable: trim(form.responsable),
      telefono: trim(form.telefono),
    }
  }

  function save() {
  if (!validation.valid || saving) {
    return false
  }

  setSaving(true)

  void (async () => {
    try {
      const payload = buildPayload()

      if (isEdit && id) {
        await almacenesApi.update(id, payload)
        showSuccess('Almacén actualizado')
      } else {
        await almacenesApi.create(payload)
        showSuccess('Almacén creado')
      }

      navigate(config.basePath)
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    } finally {
      setSaving(false)
    }
  })()

  return false
}

  function saveAndContinue() {
    if (!validation.valid || saving) {
      return false
    }

    setSaving(true)

    void (async () => {
      try {
        await almacenesApi.create(buildPayload())
        showSuccess('Almacén creado')

        const refreshed = await almacenesApi.list()
        setAlmacenes(refreshed)
        setForm(EMPTY_FORM)
      } catch (err) {
        showError(getFriendlyErrorMessage(err))
      } finally {
        setSaving(false)
      }
    })()

    return false
  }

  if (isEdit && !loading && (notFound || !existing)) {
    return (
      <RecordNotFound
        moduleLabel="almacén"
        listPath={config.basePath}
      />
    )
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        Cargando almacén...
      </p>
    )
  }

  return (
    <AdminFormLayout
      breadcrumbs={[
        {
          label: 'Almacenes',
          to: config.basePath,
        },
        {
          label: isEdit
            ? 'Editar almacén'
            : 'Registrar almacén',
        },
      ]}
      title={
        isEdit
          ? 'Editar almacén'
          : 'Registrar almacén'
      }
      subtitle={
        isEdit
          ? `Modificando ${existing?.nombre ?? ''}`
          : 'Nueva ubicación de inventario'
      }
      listPath={config.basePath}
      saveDisabled={!validation.valid || saving}
      onSave={save}
      onSaveContinue={
        !isEdit
          ? saveAndContinue
          : undefined
      }
    >
      {!validation.valid && (
        <div className="mb-4 rounded-lg border border-amber-100 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {validation.errors[0]}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Select
          label="Sucursal *"
          value={form.sucursalId}
          onChange={(event) =>
            setForm({
              ...form,
              sucursalId: event.target.value,
            })
          }
          options={[
            {
              value: '',
              label: 'Seleccione una sucursal...',
            },
            ...sucursales.map((sucursal) => ({
              value: sucursal.id,
              label:
                `${sucursal.codigo} · ${sucursal.nombre}`,
            })),
          ]}
        />

        <Select
          label="Tipo de almacén *"
          value={form.tipoAlmacen}
          onChange={(event) =>
            setForm({
              ...form,
              tipoAlmacen: event.target.value,
            })
          }
          options={typeOptions}
        />

        <Input
          label="Código"
          value={form.codigo}
          onChange={(event) =>
            setForm({
              ...form,
              codigo: event.target.value.toUpperCase(),
            })
          }
          placeholder="Se genera si se deja vacío"
        />

        <Input
          label="Nombre *"
          value={form.nombre}
          onChange={(event) =>
            setForm({
              ...form,
              nombre: event.target.value,
            })
          }
        />

        <Input
          label="Dirección"
          value={form.direccion}
          onChange={(event) =>
            setForm({
              ...form,
              direccion: event.target.value,
            })
          }
        />

        <Input
          label="Ciudad"
          value={form.ciudad}
          onChange={(event) =>
            setForm({
              ...form,
              ciudad: event.target.value,
            })
          }
        />

        <Input
          label="Responsable"
          value={form.responsable}
          onChange={(event) =>
            setForm({
              ...form,
              responsable: event.target.value,
            })
          }
        />

        <Input
          label="Teléfono"
          value={form.telefono}
          onChange={(event) =>
            setForm({
              ...form,
              telefono: event.target.value,
            })
          }
        />
      </div>
    </AdminFormLayout>
  )
}

export function BranchDetailPage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()

  const [almacen, setAlmacen] =
    useState<AlmacenDto | null>(null)

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) {
        setNotFound(true)
        setLoading(false)
        return
      }

      try {
        const row = await almacenesApi.getById(id)

        if (cancelled) return

        if (!row) {
          setNotFound(true)
          return
        }

        setAlmacen(row)
      } catch {
        if (!cancelled) {
          setNotFound(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [id])

  async function toggleEstado() {
    if (!almacen || changing) return

    const nuevoEstado =
      almacen.estado === 'Activo'
        ? 'Inactivo'
        : 'Activo'

    setChanging(true)

    try {
      await almacenesApi.setEstado(
        almacen.id,
        nuevoEstado,
      )

      setAlmacen((current) =>
        current
          ? {
            ...current,
            estado: nuevoEstado,
          }
          : current,
      )

      showSuccess(
        nuevoEstado === 'Activo'
          ? 'Almacén activado'
          : 'Almacén desactivado',
      )
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    } finally {
      setChanging(false)
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        Cargando almacén...
      </p>
    )
  }

  if (notFound || !almacen) {
    return (
      <RecordNotFound
        moduleLabel="almacén"
        listPath={config.basePath}
      />
    )
  }

  return (
    <AdminDetailLayout
      config={config}
      id={almacen.id}
      breadcrumbs={[
        {
          label: 'Almacenes',
          to: config.basePath,
        },
        {
          label: 'Detalle de almacén',
        },
      ]}
      title={almacen.nombre}
      subtitle={almacen.codigo}
      statusBadge={statusBadge(almacen)}
    >
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          disabled={changing}
          className="text-sm font-medium text-corporate hover:underline disabled:opacity-50"
          onClick={() => void toggleEstado()}
        >
          {changing
            ? 'Procesando...'
            : almacen.estado === 'Activo'
              ? 'Desactivar'
              : 'Activar'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DetailSection title="Información general">
          <dl>
            <DetailRow
              label="Código"
              value={
                <Badge variant="gold">
                  {almacen.codigo}
                </Badge>
              }
            />

            <DetailRow
              label="Nombre"
              value={almacen.nombre}
            />

            <DetailRow
              label="Tipo"
              value={
                <Badge variant="neutral">
                  {almacen.tipoAlmacen || '—'}
                </Badge>
              }
            />

            <DetailRow
              label="Sucursal"
              value={
                almacen.sucursalNombre ?? 'Sin sucursal'
              }
            />

            <DetailRow
              label="Estado"
              value={statusBadge(almacen)}
            />
          </dl>
        </DetailSection>

        <DetailSection title="Ubicación y contacto">
          <dl>
            <DetailRow
              label="Dirección"
              value={almacen.direccion || '—'}
            />

            <DetailRow
              label="Ciudad"
              value={almacen.ciudad || '—'}
            />

            <DetailRow
              label="Responsable"
              value={almacen.responsable || '—'}
            />

            <DetailRow
              label="Teléfono"
              value={almacen.telefono || '—'}
            />
          </dl>
        </DetailSection>

        <DetailSection title="Estado operativo">
          <dl>
            <DetailRow
              label="Bloqueado"
              value={almacen.bloqueado ? 'Sí' : 'No'}
            />

            <DetailRow
              label="Motivo del bloqueo"
              value={almacen.motivoBloqueo || '—'}
            />

            <DetailRow
              label="Fecha de bloqueo"
              value={almacen.fechaBloqueo ?? '—'}
            />
          </dl>
        </DetailSection>
      </div>
    </AdminDetailLayout>
  )
}

export function BranchDeletePage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()

  const [almacen, setAlmacen] =
    useState<AlmacenDto | null>(null)

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) {
        setNotFound(true)
        setLoading(false)
        return
      }

      try {
        const row = await almacenesApi.getById(id)

        if (cancelled) return

        if (!row) {
          setNotFound(true)
          return
        }

        setAlmacen(row)
      } catch {
        if (!cancelled) {
          setNotFound(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        Cargando almacén...
      </p>
    )
  }

  if (notFound || !almacen) {
    return (
      <RecordNotFound
        moduleLabel="almacén"
        listPath={config.basePath}
      />
    )
  }

  return (
    <AdminDeleteLayout
      config={config}
      breadcrumbs={[
        {
          label: 'Almacenes',
          to: config.basePath,
        },
        {
          label: config.deleteTitle,
        },
      ]}
      recordTitle={almacen.nombre}
      recordSubtitle={almacen.codigo}
      recordSummary={[
        {
          label: 'Sucursal',
          value: almacen.sucursalNombre ?? 'Sin sucursal',
        },
        {
          label: 'Tipo',
          value: almacen.tipoAlmacen || '—',
        },
        {
          label: 'Estado',
          value: almacen.estado,
        },
      ]}
      onConfirm={async () => {
        try {
          await almacenesApi.setEstado(
            almacen.id,
            'Inactivo',
          )

          showSuccess('Almacén desactivado')
          return true
        } catch (err) {
          showError(getFriendlyErrorMessage(err))
          return false
        }
      }}
    />
  )
}