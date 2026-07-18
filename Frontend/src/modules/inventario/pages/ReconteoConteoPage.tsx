import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RefreshCw, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { conteosApi, type ConteoDetalleDto } from '@/services/api/conteosApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { DetailPageShell } from '../components/DetailPageShell'

export function ReconteoConteoPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [data, setData] = useState<ConteoDetalleDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
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
    } catch (e) {
      setError(getFriendlyErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const lineasConDiferencia = data?.lineas.filter((l) => (l.diferencia ?? 0) !== 0) ?? []

  async function iniciarReconteo() {
    if (!data) return
    setActing(true)
    try {
      const res = await conteosApi.reconteo(
        data.id,
        data.version,
        lineasConDiferencia.map((l) => l.id),
      )
      if (!res.success) {
        showError(res.error?.message ?? 'No se pudo iniciar el reconteo.')
        return
      }
      showSuccess('Reconteo iniciado para las líneas con diferencia')
      await load()
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setActing(false)
    }
  }

  async function guardarLinea(lineaId: string) {
    if (!data) return
    const cantidad = Number(drafts[lineaId])
    if (!Number.isInteger(cantidad) || cantidad < 0) {
      showError('La cantidad del reconteo debe ser un entero ≥ 0.')
      return
    }
    setSavingLinea(lineaId)
    try {
      const res = await conteosApi.registrarLinea(data.id, lineaId, cantidad, data.version)
      if (!res.success || !res.data) {
        showError(res.error?.message ?? 'No se pudo registrar el reconteo.')
        return
      }
      showSuccess('Reconteo registrado')
      await load()
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setSavingLinea(null)
    }
  }

  return (
    <DetailPageShell
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Conteos', to: '/inventario?tab=conteos' },
        { label: data?.codigo ?? id, to: data ? `/inventario/conteos/${data.id}` : undefined },
        { label: 'Reconteo' },
      ]}
      backPath={data ? `/inventario/conteos/${data.id}` : '/inventario?tab=conteos'}
      title="Reconteo"
      loading={loading}
      error={error}
      actions={
        data &&
        lineasConDiferencia.some((l) => l.estadoLinea !== 'en_reconteo') && (
          <Button size="sm" icon={RefreshCw} disabled={acting} onClick={() => void iniciarReconteo()}>
            Iniciar reconteo
          </Button>
        )
      }
    >
      {data && (
        <div className="space-y-4">
          {lineasConDiferencia.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
              No hay líneas con diferencia. No se requiere reconteo.
            </div>
          ) : (
            <Card>
              <CardHeader title="Líneas con diferencia" />
              <CardBody className="!p-0">
                <Table
                  keyField="id"
                  data={lineasConDiferencia}
                  columns={[
                    {
                      key: 'titulo',
                      header: 'Producto',
                      render: (l) => <span className="font-medium">{l.titulo ?? l.productoId}</span>,
                    },
                    { key: 'cantidadTeorica', header: 'Teórica', render: (l) => <span className="tabular-nums">{l.cantidadTeorica}</span> },
                    { key: 'cantidadContada', header: '1er conteo', render: (l) => <span className="tabular-nums">{l.cantidadContada}</span> },
                    {
                      key: 'diferencia',
                      header: 'Diferencia',
                      render: (l) => (
                        <span className={`font-semibold tabular-nums ${(l.diferencia ?? 0) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {l.diferencia}
                        </span>
                      ),
                    },
                    {
                      key: 'estadoLinea',
                      header: 'Estado',
                      render: (l) => <Badge variant={l.estadoLinea === 'en_reconteo' ? 'gold' : 'neutral'}>{l.estadoLinea.replace(/_/g, ' ')}</Badge>,
                    },
                    {
                      key: 'reconteo',
                      header: 'Nueva cantidad',
                      render: (l) => (
                        <input
                          type="number"
                          min={0}
                          disabled={l.estadoLinea !== 'en_reconteo'}
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm disabled:bg-slate-100"
                          value={drafts[l.id] ?? ''}
                          onChange={(e) => setDrafts((prev) => ({ ...prev, [l.id]: e.target.value }))}
                        />
                      ),
                    },
                    {
                      key: 'actions',
                      header: '',
                      render: (l) => (
                        <Button
                          size="sm"
                          icon={Save}
                          disabled={l.estadoLinea !== 'en_reconteo' || savingLinea === l.id}
                          onClick={() => void guardarLinea(l.id)}
                        >
                          Guardar
                        </Button>
                      ),
                    },
                  ]}
                />
              </CardBody>
            </Card>
          )}

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
