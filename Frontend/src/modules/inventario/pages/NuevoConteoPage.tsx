import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { FormBreadcrumb } from '@/components/ui/FormBreadcrumb'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { branches, categories, products } from '@/mocks/mockCore'
import { conteosApi } from '@/services/api/conteosApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { trim } from '@/utils/formValidation'

type TipoConteo = 'general' | 'parcial' | 'ciclico'
type AlcanceTipo = 'todo_almacen' | 'categoria' | 'editorial' | 'ubicacion' | 'productos'

interface ProductoAlcanceRow {
  productoId: string
  isbn: string
  titulo: string
  categoria: string
  editorial: string
  ubicacion: string
  existenciaActual: number
  stockMinimo: number
  seleccionado: boolean
}

function nextCodigo(): string {
  const d = new Date()
  const stamp = d.toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 900) + 100)
  return `CF-${stamp}-${seq}`
}

const editoriales = [...new Set(products.map((p) => p.publisher))]
const ubicaciones = [...new Set(products.map((p) => p.location.split(' - ')[0] ?? p.location))]

export function NuevoConteoPage() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [codigo] = useState(nextCodigo)
  const [form, setForm] = useState({
    nombre: '',
    tipoConteo: 'parcial' as TipoConteo,
    sucursalId: branches[0]?.id ?? '',
    almacenId: branches[0]?.id ?? '',
    alcanceTipo: 'todo_almacen' as AlcanceTipo,
    alcanceValor: '',
    fechaProgramada: new Date().toISOString().slice(0, 10),
    horaProgramada: '09:00',
    responsableId: 'inventario',
    responsableNombre: 'Inventario · Operaciones',
    observaciones: '',
    bloquearAlmacenAlAbrir: true,
    permitirReconteo: true,
    diferenciaMinimaReconteo: '1',
    productoBusqueda: '',
  })

  const sucursalNombre = branches.find((b) => b.id === form.sucursalId)?.name ?? form.sucursalId

  const productosBase = useMemo((): ProductoAlcanceRow[] => {
    let list = products.map((p) => ({
      productoId: p.id,
      isbn: p.isbn,
      titulo: p.title,
      categoria: p.category,
      editorial: p.publisher,
      ubicacion: p.location,
      existenciaActual: p.stock,
      stockMinimo: 10,
      seleccionado: true,
    }))

    if (form.alcanceTipo === 'categoria' && form.alcanceValor) {
      list = list.filter((p) => p.categoria === form.alcanceValor)
    } else if (form.alcanceTipo === 'editorial' && form.alcanceValor) {
      list = list.filter((p) => p.editorial === form.alcanceValor)
    } else if (form.alcanceTipo === 'ubicacion' && form.alcanceValor) {
      list = list.filter((p) => p.ubicacion.startsWith(form.alcanceValor))
    } else if (form.alcanceTipo === 'productos') {
      const q = form.productoBusqueda.toLowerCase()
      if (q) {
        list = list.filter(
          (p) =>
            p.titulo.toLowerCase().includes(q) ||
            p.isbn.includes(q) ||
            p.productoId.toLowerCase().includes(q),
        )
      }
    }
    return list
  }, [form.alcanceTipo, form.alcanceValor, form.productoBusqueda])

  const [excluidos, setExcluidos] = useState<Set<string>>(new Set())
  const [seleccionManual, setSeleccionManual] = useState<Set<string>>(new Set())

  const productosEnAlcance = useMemo(() => {
    if (form.alcanceTipo === 'productos') {
      return productosBase
        .filter((p) => seleccionManual.has(p.productoId))
        .map((p) => ({ ...p, seleccionado: true }))
    }
    return productosBase
      .filter((p) => !excluidos.has(p.productoId))
      .map((p) => ({ ...p, seleccionado: true }))
  }, [productosBase, excluidos, seleccionManual, form.alcanceTipo])

  const validationErrors = useMemo(() => {
    const errs: string[] = []
    if (!trim(form.nombre)) errs.push('El nombre del conteo es obligatorio.')
    if (!form.sucursalId) errs.push('La sucursal es obligatoria.')
    if (!form.almacenId) errs.push('El almacén es obligatorio.')
    if (!form.responsableId) errs.push('El responsable es obligatorio.')
    if (
      (form.alcanceTipo === 'categoria' ||
        form.alcanceTipo === 'editorial' ||
        form.alcanceTipo === 'ubicacion') &&
      !form.alcanceValor
    ) {
      errs.push('Debe seleccionar el valor del alcance.')
    }
    if (productosEnAlcance.length === 0) errs.push('El alcance debe incluir al menos un producto.')
    const diff = Number(form.diferenciaMinimaReconteo)
    if (!Number.isFinite(diff) || diff < 0) errs.push('Diferencia mínima para reconteo inválida.')
    return errs
  }, [form, productosEnAlcance])

  function toggleProductoManual(id: string) {
    setSeleccionManual((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function eliminarDelAlcance(id: string) {
    if (form.alcanceTipo === 'productos') {
      setSeleccionManual((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } else {
      setExcluidos((prev) => new Set(prev).add(id))
    }
  }

  async function handleSave() {
    if (validationErrors.length) {
      setError(validationErrors[0])
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await conteosApi.crear({
        codigo,
        nombre: trim(form.nombre),
        tipoConteo: form.tipoConteo,
        sucursalId: form.sucursalId,
        almacenId: form.almacenId,
        alcanceTipo: form.alcanceTipo,
        alcanceValor: form.alcanceValor || undefined,
        fechaProgramada: form.fechaProgramada,
        horaProgramada: form.horaProgramada,
        responsableId: form.responsableId,
        responsableNombre: form.responsableNombre,
        observaciones: trim(form.observaciones) || undefined,
        bloquearAlmacenAlAbrir: form.bloquearAlmacenAlAbrir,
        permitirReconteo: form.permitirReconteo,
        diferenciaMinimaReconteo: Number(form.diferenciaMinimaReconteo),
        productos: productosEnAlcance.map((p) => ({
          productoId: p.productoId,
          isbn: p.isbn,
          titulo: p.titulo,
          categoria: p.categoria,
          editorial: p.editorial,
          ubicacion: p.ubicacion,
          existenciaActual: p.existenciaActual,
          stockMinimo: p.stockMinimo,
        })),
      })
      if (!res.success || !res.data) {
        setError(res.error?.message ?? 'No se pudo crear el conteo.')
        showError(res.error?.message ?? 'Error al crear conteo')
        return
      }
      showSuccess(`Conteo ${res.data.codigo} creado en borrador`)
      navigate('/inventario?tab=conteos')
    } catch (e) {
      const msg = getFriendlyErrorMessage(e)
      setError(msg)
      showError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FormBreadcrumb
          items={[
            { label: 'Inventario', to: '/inventario' },
            { label: 'Conteos', to: '/inventario?tab=conteos' },
            { label: 'Crear conteo físico' },
          ]}
        />
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/inventario?tab=conteos')}
        >
          Regresar
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-corporate">Crear conteo físico</h1>
      </div>

      {(error || validationErrors[0]) && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error || validationErrors[0]}
        </div>
      )}

      <Card>
        <CardHeader title="1. Información general" />
        <CardBody>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input label="Código (autogenerado)" value={codigo} disabled readOnly />
            <Input
              label="Nombre del conteo *"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Conteo cíclico Literatura — Polanco"
            />
            <Select
              label="Tipo de conteo *"
              value={form.tipoConteo}
              onChange={(e) => setForm({ ...form, tipoConteo: e.target.value as TipoConteo })}
              options={[
                { value: 'general', label: 'General' },
                { value: 'parcial', label: 'Parcial' },
                { value: 'ciclico', label: 'Cíclico' },
              ]}
            />
            <Select
              label="Sucursal *"
              value={form.sucursalId}
              onChange={(e) => {
                const id = e.target.value
                setForm({ ...form, sucursalId: id, almacenId: id })
              }}
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
            <Select
              label="Almacén *"
              value={form.almacenId}
              onChange={(e) => setForm({ ...form, almacenId: e.target.value })}
              options={branches.map((b) => ({
                value: b.id,
                label: `${b.name} (almacén)`,
              }))}
            />
            <div className="text-sm text-slate-500 md:col-span-2">
              Sucursal seleccionada: <strong>{sucursalNombre}</strong>. El almacén queda vinculado a
              esa sucursal.
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="2. Alcance" />
        <CardBody>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Select
              label="Alcance *"
              value={form.alcanceTipo}
              onChange={(e) => {
                setExcluidos(new Set())
                setSeleccionManual(new Set())
                setForm({
                  ...form,
                  alcanceTipo: e.target.value as AlcanceTipo,
                  alcanceValor: '',
                  productoBusqueda: '',
                })
              }}
              options={[
                { value: 'todo_almacen', label: 'Todo el almacén' },
                { value: 'categoria', label: 'Categoría' },
                { value: 'editorial', label: 'Editorial' },
                { value: 'ubicacion', label: 'Ubicación' },
                { value: 'productos', label: 'Productos específicos' },
              ]}
            />
            {form.alcanceTipo === 'categoria' && (
              <Select
                label="Categoría *"
                value={form.alcanceValor}
                onChange={(e) => setForm({ ...form, alcanceValor: e.target.value })}
                options={[
                  { value: '', label: 'Seleccione…' },
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
              />
            )}
            {form.alcanceTipo === 'editorial' && (
              <Select
                label="Editorial *"
                value={form.alcanceValor}
                onChange={(e) => setForm({ ...form, alcanceValor: e.target.value })}
                options={[
                  { value: '', label: 'Seleccione…' },
                  ...editoriales.map((e) => ({ value: e, label: e })),
                ]}
              />
            )}
            {form.alcanceTipo === 'ubicacion' && (
              <Select
                label="Ubicación *"
                value={form.alcanceValor}
                onChange={(e) => setForm({ ...form, alcanceValor: e.target.value })}
                options={[
                  { value: '', label: 'Seleccione…' },
                  ...ubicaciones.map((u) => ({ value: u, label: u })),
                ]}
              />
            )}
            {form.alcanceTipo === 'productos' && (
              <Input
                label="Buscador de productos"
                value={form.productoBusqueda}
                onChange={(e) => setForm({ ...form, productoBusqueda: e.target.value })}
                placeholder="ISBN, título o código…"
              />
            )}
          </div>

          {form.alcanceTipo === 'productos' && (
            <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-slate-200">
              {productosBase.map((p) => (
                <label
                  key={p.productoId}
                  className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={seleccionManual.has(p.productoId)}
                    onChange={() => toggleProductoManual(p.productoId)}
                  />
                  <span className="font-mono text-xs text-slate-500">{p.isbn}</span>
                  <span className="font-medium">{p.titulo}</span>
                </label>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="3. Configuración" />
        <CardBody>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Fecha programada"
              type="date"
              value={form.fechaProgramada}
              onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })}
            />
            <Input
              label="Hora"
              type="time"
              value={form.horaProgramada}
              onChange={(e) => setForm({ ...form, horaProgramada: e.target.value })}
            />
            <Input
              label="Responsable *"
              value={form.responsableNombre}
              onChange={(e) => setForm({ ...form, responsableNombre: e.target.value })}
            />
            <Input
              label="Diferencia mínima para reconteo"
              type="number"
              min={0}
              value={form.diferenciaMinimaReconteo}
              onChange={(e) => setForm({ ...form, diferenciaMinimaReconteo: e.target.value })}
            />
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Observaciones</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-corporate focus:outline-none focus:ring-2 focus:ring-corporate/20"
                rows={3}
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.bloquearAlmacenAlAbrir}
                onChange={(e) => setForm({ ...form, bloquearAlmacenAlAbrir: e.target.checked })}
              />
              Bloquear almacén al abrir
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.permitirReconteo}
                onChange={(e) => setForm({ ...form, permitirReconteo: e.target.checked })}
              />
              Permitir reconteo
            </label>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="4. Productos del alcance"
        />
        <CardBody className="!p-0">
          <Table
            keyField="productoId"
            data={productosEnAlcance}
            columns={[
              { key: 'isbn', header: 'ISBN', className: 'font-mono text-xs' },
              {
                key: 'titulo',
                header: 'Producto',
                render: (p) => <span className="font-medium">{p.titulo}</span>,
              },
              { key: 'categoria', header: 'Categoría', className: 'text-xs' },
              { key: 'editorial', header: 'Editorial', className: 'text-xs' },
              { key: 'ubicacion', header: 'Ubicación', className: 'text-xs' },
              {
                key: 'existenciaActual',
                header: 'Existencia actual',
                render: (p) => <span className="tabular-nums font-semibold">{p.existenciaActual}</span>,
              },
              {
                key: 'stockMinimo',
                header: 'Stock mínimo',
                render: (p) => <span className="tabular-nums">{p.stockMinimo}</span>,
              },
              {
                key: 'seleccionado',
                header: 'Seleccionado',
                render: () => <Badge variant="success">Sí</Badge>,
              },
              {
                key: 'actions',
                header: '',
                render: (p) => (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Trash2}
                    onClick={() => eliminarDelAlcance(p.productoId)}
                  >
                    Quitar
                  </Button>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <div className="flex flex-col items-stretch justify-end gap-3 border-t border-gray-200 pt-2 sm:flex-row sm:items-center">
        <Button variant="outline" onClick={() => navigate('/inventario?tab=conteos')}>
          Cancelar
        </Button>
        <Button
          icon={Save}
          onClick={() => void handleSave()}
          disabled={saving || validationErrors.length > 0}
        >
          {saving ? 'Guardando…' : 'Crear conteo'}
        </Button>
      </div>
    </div>
  )
}
