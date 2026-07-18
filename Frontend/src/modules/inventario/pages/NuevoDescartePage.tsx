import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import { FormBreadcrumb } from '@/components/ui/FormBreadcrumb'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { branches, products } from '@/mocks/mockCore'
import { descartesApi, type MotivoDescarteCodigo } from '@/services/api/descartesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { trim } from '@/utils/formValidation'

const MOTIVOS: { value: MotivoDescarteCodigo; label: string }[] = [
  { value: 'DANO_FISICO', label: 'Daño físico' },
  { value: 'DONACION', label: 'Donación' },
  { value: 'PERDIDA', label: 'Pérdida' },
  { value: 'ROBO', label: 'Robo' },
  { value: 'ERROR_RECEPCION', label: 'Error de recepción' },
  { value: 'PRODUCTO_DEFECTUOSO', label: 'Producto defectuoso' },
  { value: 'CADUCIDAD', label: 'Caducidad' },
  { value: 'OTRO', label: 'Otro' },
]

interface LineaForm {
  key: string
  productoId: string
  isbn: string
  titulo: string
  existenciaActual: number
  cantidad: string
  costo: string
  motivoEspecifico: string
  observacion: string
}

interface EvidenciaForm {
  key: string
  tipo: 'fotografia' | 'pdf' | 'acta' | 'documento' | 'comentario'
  nombreArchivo: string
  comentario: string
}

function nextCodigo(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `DSC-${stamp}-${String(Math.floor(Math.random() * 900) + 100)}`
}

export function NuevoDescartePage() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [codigo] = useState(nextCodigo)
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    sucursalId: branches[0]?.id ?? '',
    almacenId: branches[0]?.id ?? '',
    responsableNombre: 'Inventario · Operaciones',
    observaciones: '',
    motivoCodigo: 'DANO_FISICO' as MotivoDescarteCodigo,
    motivoDescripcion: '',
    requiereAprobacion: true,
    supervisorNombre: 'Supervisor de sucursal',
  })
  const [lineas, setLineas] = useState<LineaForm[]>([])
  const [evidencias, setEvidencias] = useState<EvidenciaForm[]>([])

  const productosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    if (!q) return products.slice(0, 8)
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.isbn.includes(q) ||
        p.id.toLowerCase().includes(q),
    )
  }, [busqueda])

  const validationErrors = useMemo(() => {
    const errs: string[] = []
    if (!form.sucursalId) errs.push('La sucursal es obligatoria.')
    if (!form.almacenId) errs.push('El almacén es obligatorio.')
    if (!trim(form.responsableNombre)) errs.push('El responsable es obligatorio.')
    if (!form.motivoCodigo) errs.push('El motivo es obligatorio.')
    if (form.motivoCodigo === 'OTRO' && !trim(form.motivoDescripcion)) {
      errs.push('Debe describir el motivo cuando selecciona Otro.')
    }
    if (lineas.length === 0) errs.push('Debe agregar al menos un producto.')
    for (const l of lineas) {
      const qty = Number(l.cantidad)
      if (!Number.isInteger(qty) || qty <= 0) {
        errs.push(`Cantidad inválida en ${l.titulo || l.productoId}.`)
        break
      }
      if (qty > l.existenciaActual) {
        errs.push(`No se puede descartar más unidades que el stock de ${l.titulo}.`)
        break
      }
    }
    return errs
  }, [form, lineas])

  function agregarProducto(productId: string) {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    if (lineas.some((l) => l.productoId === p.id)) {
      setError('El producto ya está en el descarte.')
      return
    }
    setError('')
    setLineas((prev) => [
      ...prev,
      {
        key: `${p.id}-${Date.now()}`,
        productoId: p.id,
        isbn: p.isbn,
        titulo: p.title,
        existenciaActual: p.stock,
        cantidad: '1',
        costo: '0',
        motivoEspecifico: '',
        observacion: '',
      },
    ])
  }

  async function handleSave() {
    if (validationErrors.length) {
      setError(validationErrors[0])
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await descartesApi.crear({
        codigo,
        fecha: form.fecha,
        sucursalId: form.sucursalId,
        almacenId: form.almacenId,
        responsableId: 'inventario',
        responsableNombre: trim(form.responsableNombre),
        observaciones: trim(form.observaciones) || undefined,
        motivoCodigo: form.motivoCodigo,
        motivoDescripcion: trim(form.motivoDescripcion) || undefined,
        lineas: lineas.map((l) => ({
          productoId: l.productoId,
          isbn: l.isbn,
          titulo: l.titulo,
          existenciaActual: l.existenciaActual,
          cantidad: Number(l.cantidad),
          costo: Number(l.costo) || 0,
          motivoEspecifico: trim(l.motivoEspecifico) || undefined,
          observacion: trim(l.observacion) || undefined,
        })),
        evidencias: evidencias.map((e) => ({
          tipo: e.tipo,
          nombreArchivo: trim(e.nombreArchivo) || undefined,
          comentario: trim(e.comentario) || undefined,
        })),
        requiereAprobacion: form.requiereAprobacion,
        supervisorNombre: trim(form.supervisorNombre) || undefined,
      })
      if (!res.success || !res.data) {
        setError(res.error?.message ?? 'No se pudo crear el descarte.')
        showError(res.error?.message ?? 'Error al crear descarte')
        return
      }
      showSuccess(`Descarte ${res.data.codigo} creado en borrador`)
      navigate('/inventario?tab=descartes')
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
            { label: 'Descartes', to: '/inventario?tab=descartes' },
            { label: 'Crear descarte' },
          ]}
        />
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/inventario?tab=descartes')}
        >
          Regresar
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-corporate">Crear descarte</h1>
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
              label="Fecha *"
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
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
              options={branches.map((b) => ({ value: b.id, label: `${b.name} (almacén)` }))}
            />
            <Input
              label="Responsable *"
              value={form.responsableNombre}
              onChange={(e) => setForm({ ...form, responsableNombre: e.target.value })}
            />
            <div className="flex items-end">
              <Badge variant="neutral">Estado: Borrador</Badge>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Observaciones</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-corporate focus:outline-none focus:ring-2 focus:ring-corporate/20"
                rows={2}
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="2. Motivo del descarte" />
        <CardBody>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Select
              label="Motivo *"
              value={form.motivoCodigo}
              onChange={(e) =>
                setForm({ ...form, motivoCodigo: e.target.value as MotivoDescarteCodigo })
              }
              options={MOTIVOS.map((m) => ({ value: m.value, label: m.label }))}
            />
            {form.motivoCodigo === 'OTRO' && (
              <Input
                label="Descripción del motivo *"
                value={form.motivoDescripcion}
                onChange={(e) => setForm({ ...form, motivoDescripcion: e.target.value })}
                placeholder="Detalle obligatorio…"
              />
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="3. Productos" />
        <CardBody>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              label="Buscador de productos"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="ISBN, título o código…"
            />
          </div>
          <div className="mb-4 max-h-40 overflow-y-auto rounded-lg border border-slate-200">
            {productosFiltrados.map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => agregarProducto(p.id)}
              >
                <span>
                  <span className="font-mono text-xs text-slate-400">{p.isbn}</span>{' '}
                  <span className="font-medium">{p.title}</span>
                  <span className="ml-2 text-xs text-slate-500">Stock {p.stock}</span>
                </span>
                <Plus size={14} className="text-corporate" />
              </button>
            ))}
          </div>

          <Table
            keyField="key"
            data={lineas}
            columns={[
              { key: 'isbn', header: 'ISBN', className: 'font-mono text-xs' },
              {
                key: 'titulo',
                header: 'Producto',
                render: (l) => <span className="font-medium">{l.titulo}</span>,
              },
              {
                key: 'existenciaActual',
                header: 'Existencia',
                render: (l) => <span className="tabular-nums font-semibold">{l.existenciaActual}</span>,
              },
              {
                key: 'cantidad',
                header: 'Cant. a descartar',
                render: (l) => (
                  <input
                    type="number"
                    min={1}
                    max={l.existenciaActual}
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                    value={l.cantidad}
                    onChange={(e) =>
                      setLineas((prev) =>
                        prev.map((x) => (x.key === l.key ? { ...x, cantidad: e.target.value } : x)),
                      )
                    }
                  />
                ),
              },
              {
                key: 'costo',
                header: 'Costo',
                render: (l) => (
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                    value={l.costo}
                    onChange={(e) =>
                      setLineas((prev) =>
                        prev.map((x) => (x.key === l.key ? { ...x, costo: e.target.value } : x)),
                      )
                    }
                  />
                ),
              },
              {
                key: 'motivoEspecifico',
                header: 'Motivo específico',
                render: (l) => (
                  <input
                    className="w-36 rounded border border-gray-300 px-2 py-1 text-sm"
                    value={l.motivoEspecifico}
                    onChange={(e) =>
                      setLineas((prev) =>
                        prev.map((x) =>
                          x.key === l.key ? { ...x, motivoEspecifico: e.target.value } : x,
                        ),
                      )
                    }
                  />
                ),
              },
              {
                key: 'observacion',
                header: 'Observación',
                render: (l) => (
                  <input
                    className="w-36 rounded border border-gray-300 px-2 py-1 text-sm"
                    value={l.observacion}
                    onChange={(e) =>
                      setLineas((prev) =>
                        prev.map((x) =>
                          x.key === l.key ? { ...x, observacion: e.target.value } : x,
                        ),
                      )
                    }
                  />
                ),
              },
              {
                key: 'actions',
                header: '',
                render: (l) => (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Trash2}
                    onClick={() => setLineas((prev) => prev.filter((x) => x.key !== l.key))}
                  >
                    Eliminar
                  </Button>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="4. Evidencias"
          action={
            <Button
              size="sm"
              variant="outline"
              icon={Plus}
              onClick={() =>
                setEvidencias((prev) => [
                  ...prev,
                  {
                    key: `ev-${Date.now()}`,
                    tipo: 'fotografia',
                    nombreArchivo: '',
                    comentario: '',
                  },
                ])
              }
            >
              Agregar evidencia
            </Button>
          }
        />
        <CardBody className="space-y-3">
          {evidencias.length === 0 && (
            <p className="text-sm text-slate-500">Sin evidencias adjuntas (opcional en borrador).</p>
          )}
          {evidencias.map((ev) => (
            <div
              key={ev.key}
              className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-4"
            >
              <Select
                label="Tipo"
                value={ev.tipo}
                onChange={(e) =>
                  setEvidencias((prev) =>
                    prev.map((x) =>
                      x.key === ev.key
                        ? { ...x, tipo: e.target.value as EvidenciaForm['tipo'] }
                        : x,
                    ),
                  )
                }
                options={[
                  { value: 'fotografia', label: 'Fotografía' },
                  { value: 'pdf', label: 'PDF' },
                  { value: 'acta', label: 'Acta' },
                  { value: 'documento', label: 'Documento' },
                  { value: 'comentario', label: 'Comentario' },
                ]}
              />
              <Input
                label="Nombre / referencia"
                value={ev.nombreArchivo}
                onChange={(e) =>
                  setEvidencias((prev) =>
                    prev.map((x) =>
                      x.key === ev.key ? { ...x, nombreArchivo: e.target.value } : x,
                    ),
                  )
                }
                placeholder="archivo.pdf / foto.jpg"
              />
              <Input
                label="Comentario"
                value={ev.comentario}
                onChange={(e) =>
                  setEvidencias((prev) =>
                    prev.map((x) =>
                      x.key === ev.key ? { ...x, comentario: e.target.value } : x,
                    ),
                  )
                }
              />
              <div className="flex items-end">
                <Button
                  size="sm"
                  variant="outline"
                  icon={Trash2}
                  onClick={() => setEvidencias((prev) => prev.filter((x) => x.key !== ev.key))}
                >
                  Quitar
                </Button>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="5. Aprobación" />
        <CardBody>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.requiereAprobacion}
                onChange={(e) => setForm({ ...form, requiereAprobacion: e.target.checked })}
              />
              Requiere aprobación
            </label>
            <Input
              label="Solicitante"
              value={form.responsableNombre}
              disabled
              readOnly
            />
            <Input
              label="Supervisor"
              value={form.supervisorNombre}
              onChange={(e) => setForm({ ...form, supervisorNombre: e.target.value })}
            />
            <Input label="Fecha" value={form.fecha} disabled readOnly />
            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-700">Estado de aprobación</p>
              <Badge variant="neutral">Borrador</Badge>
              <p className="mt-2 text-[11px] text-slate-400">
                Flujo: Borrador → Solicitado → Aprobado / Rechazado → Aplicado → Revertido
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col items-stretch justify-end gap-3 border-t border-gray-200 pt-2 sm:flex-row sm:items-center">
        <Button variant="outline" onClick={() => navigate('/inventario?tab=descartes')}>
          Cancelar
        </Button>
        <Button
          icon={Save}
          onClick={() => void handleSave()}
          disabled={saving || validationErrors.length > 0}
        >
          {saving ? 'Guardando…' : 'Crear descarte'}
        </Button>
      </div>
    </div>
  )
}
