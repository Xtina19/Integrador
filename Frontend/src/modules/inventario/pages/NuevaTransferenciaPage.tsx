import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Table } from '@/components/ui/Table'
import { branches, products } from '@/mocks/mockCore'
import { transferenciasApi } from '@/services/api/transferenciasApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { trim } from '@/utils/formValidation'
import { DetailPageShell } from '../components/DetailPageShell'

interface LineaForm {
  key: string
  productoId: string
  isbn: string
  titulo: string
  existenciaActual: number
  cantidadSolicitada: string
}

function nextCodigo(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `TRF-${stamp}-${String(Math.floor(Math.random() * 900) + 100)}`
}

export function NuevaTransferenciaPage() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [codigo] = useState(nextCodigo)
  const [busqueda, setBusqueda] = useState('')
  const [almacenOrigenId, setAlmacenOrigenId] = useState(branches[0]?.id ?? '')
  const [almacenDestinoId, setAlmacenDestinoId] = useState(branches[1]?.id ?? branches[0]?.id ?? '')
  const [observacion, setObservacion] = useState('')
  const [lineas, setLineas] = useState<LineaForm[]>([])

  const productosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim()
    if (!q) return products.slice(0, 8)
    return products.filter(
      (p) => p.title.toLowerCase().includes(q) || p.isbn.includes(q) || p.id.toLowerCase().includes(q),
    )
  }, [busqueda])

  const validationErrors = useMemo(() => {
    const errs: string[] = []
    if (!almacenOrigenId) errs.push('El almacén origen es obligatorio.')
    if (!almacenDestinoId) errs.push('El almacén destino es obligatorio.')
    if (almacenOrigenId && almacenOrigenId === almacenDestinoId) {
      errs.push('El almacén origen y destino deben ser distintos.')
    }
    if (lineas.length === 0) errs.push('Debe agregar al menos un producto.')
    for (const l of lineas) {
      const qty = Number(l.cantidadSolicitada)
      if (!Number.isInteger(qty) || qty <= 0) {
        errs.push(`Cantidad inválida en ${l.titulo || l.productoId}.`)
        break
      }
    }
    return errs
  }, [almacenOrigenId, almacenDestinoId, lineas])

  function agregarProducto(productId: string) {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    if (lineas.some((l) => l.productoId === p.id)) {
      setError('El producto ya está en la transferencia.')
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
        cantidadSolicitada: '1',
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
      const res = await transferenciasApi.crear({
        codigo,
        almacenOrigenId,
        almacenDestinoId,
        lineas: lineas.map((l) => ({
          productoId: l.productoId,
          isbn: l.isbn,
          titulo: l.titulo,
          cantidadSolicitada: Number(l.cantidadSolicitada),
        })),
        observacion: trim(observacion) || undefined,
      })
      if (!res.success || !res.data) {
        const msg = res.error?.message ?? 'No se pudo crear la transferencia.'
        setError(msg)
        showError(msg)
        return
      }
      showSuccess(`Transferencia ${res.data.codigo} creada`)
      navigate(`/inventario/transferencias/${res.data.id}`)
    } catch (e) {
      const msg = getFriendlyErrorMessage(e)
      setError(msg)
      showError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailPageShell
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Transferencias', to: '/inventario?tab=transferencias' },
        { label: 'Nueva transferencia' },
      ]}
      backPath="/inventario?tab=transferencias"
      title="Nueva transferencia"
      error={error || validationErrors[0] || null}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader title="1. Origen y destino" />
          <CardBody>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Input label="Código (autogenerado)" value={codigo} disabled readOnly />
              <div />
              <Select
                label="Almacén origen *"
                value={almacenOrigenId}
                onChange={(e) => setAlmacenOrigenId(e.target.value)}
                options={branches.map((b) => ({ value: b.id, label: b.name }))}
              />
              <Select
                label="Almacén destino *"
                value={almacenDestinoId}
                onChange={(e) => setAlmacenDestinoId(e.target.value)}
                options={branches.map((b) => ({ value: b.id, label: b.name }))}
              />
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Observaciones</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-corporate focus:outline-none focus:ring-2 focus:ring-corporate/20"
                  rows={2}
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="2. Productos" />
          <CardBody>
            <div className="mb-4">
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
                  header: 'Existencia origen',
                  render: (l) => <span className="tabular-nums font-semibold">{l.existenciaActual}</span>,
                },
                {
                  key: 'cantidadSolicitada',
                  header: 'Cant. solicitada',
                  render: (l) => (
                    <input
                      type="number"
                      min={1}
                      className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                      value={l.cantidadSolicitada}
                      onChange={(e) =>
                        setLineas((prev) =>
                          prev.map((x) => (x.key === l.key ? { ...x, cantidadSolicitada: e.target.value } : x)),
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

        <div className="flex flex-col items-stretch justify-end gap-3 border-t border-gray-200 pt-2 sm:flex-row sm:items-center">
          <Button variant="outline" onClick={() => navigate('/inventario?tab=transferencias')}>
            Cancelar
          </Button>
          <Button icon={Save} onClick={() => void handleSave()} disabled={saving || validationErrors.length > 0}>
            {saving ? 'Guardando…' : 'Crear transferencia'}
          </Button>
        </div>
      </div>
    </DetailPageShell>
  )
}
