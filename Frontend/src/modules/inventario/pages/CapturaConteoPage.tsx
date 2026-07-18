import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { conteosApi, type ConteoDetalleDto } from '@/services/api/conteosApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { DetailPageShell } from '../components/DetailPageShell'

export function CapturaConteoPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [data, setData] = useState<ConteoDetalleDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [savingLinea, setSavingLinea] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await conteosApi.get(id)
      if (!res) {
        setError('Conteo no encontrado.')
        return
      }
      setData(res)
      setDrafts((prev) => {
        const next = { ...prev }
        for (const l of res.lineas) {
          if (next[l.id] === undefined) next[l.id] = String(l.cantidadContada ?? '')
        }
        return next
      })
    } catch (e) {
      setError(getFriendlyErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function guardarLinea(lineaId: string) {
    if (!data) return
    const raw = drafts[lineaId]
    const cantidad = Number(raw)
    if (!Number.isInteger(cantidad) || cantidad < 0) {
      showError('La cantidad contada debe ser un entero ≥ 0.')
      return
    }
    setSavingLinea(lineaId)
    try {
      const res = await conteosApi.registrarLinea(data.id, lineaId, cantidad, data.version)
      if (!res.success || !res.data) {
        showError(res.error?.message ?? 'No se pudo registrar la línea.')
        return
      }
      showSuccess('Cantidad registrada')
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          version: res.data!.version,
          estado: res.data!.estado,
          lineas: prev.lineas.map((l) =>
            l.id === lineaId
              ? {
                  ...l,
                  cantidadContada: cantidad,
                  cantidadAceptada: cantidad,
                  diferencia: cantidad - l.cantidadTeorica,
                  estadoLinea: 'contada',
                }
              : l,
          ),
        }
      })
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setSavingLinea(null)
    }
  }

  const pendientes = data?.lineas.filter((l) => l.estadoLinea === 'pendiente').length ?? 0

  return (
    <DetailPageShell
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Conteos', to: '/inventario?tab=conteos' },
        { label: data?.codigo ?? id, to: data ? `/inventario/conteos/${data.id}` : undefined },
        { label: 'Captura' },
      ]}
      backPath={data ? `/inventario/conteos/${data.id}` : '/inventario?tab=conteos'}
      title="Captura de conteo"
      loading={loading}
      error={error}
    >
      {data && (
        <div className="space-y-4">
          <div className="text-sm text-slate-500">
            {pendientes > 0
              ? `${pendientes} línea(s) pendientes de captura.`
              : 'Todas las líneas tienen una cantidad registrada.'}
          </div>
          <Card>
            <CardBody className="!p-0">
              <Table
                keyField="id"
                data={data.lineas}
                columns={[
                  {
                    key: 'titulo',
                    header: 'Producto',
                    render: (l) => <span className="font-medium">{l.titulo ?? l.productoId}</span>,
                  },
                  { key: 'cantidadTeorica', header: 'Teórica', render: (l) => <span className="tabular-nums">{l.cantidadTeorica}</span> },
                  {
                    key: 'cantidadContada',
                    header: 'Cantidad contada',
                    render: (l) => (
                      <input
                        type="number"
                        min={0}
                        className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                        value={drafts[l.id] ?? ''}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [l.id]: e.target.value }))}
                      />
                    ),
                  },
                  {
                    key: 'estadoLinea',
                    header: 'Estado',
                    render: (l) => (
                      <Badge variant={l.estadoLinea === 'pendiente' ? 'warning' : 'success'}>
                        {l.estadoLinea.replace(/_/g, ' ')}
                      </Badge>
                    ),
                  },
                  {
                    key: 'actions',
                    header: '',
                    render: (l) => (
                      <Button
                        size="sm"
                        icon={Save}
                        disabled={savingLinea === l.id}
                        onClick={() => void guardarLinea(l.id)}
                      >
                        {savingLinea === l.id ? 'Guardando…' : 'Guardar'}
                      </Button>
                    ),
                  },
                ]}
              />
            </CardBody>
          </Card>

          <div className="flex justify-end border-t border-gray-200 pt-2">
            <Button variant="outline" onClick={() => navigate(`/inventario/conteos/${data.id}`)}>
              Volver al conteo
            </Button>
          </div>
        </div>
      )}
    </DetailPageShell>
  )
}
