import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Select } from '@/components/ui/Input'
import { conteosApi, type ClasificacionDiferenciaDto, type ConteoDetalleDto } from '@/services/api/conteosApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { DetailPageShell } from '../components/DetailPageShell'

const CLASIFICACIONES: { value: ClasificacionDiferenciaDto; label: string }[] = [
  { value: 'sobrante', label: 'Sobrante' },
  { value: 'faltante', label: 'Faltante' },
  { value: 'dano', label: 'Daño' },
  { value: 'investigacion', label: 'En investigación' },
]

export function ClasificacionConteoPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [data, setData] = useState<ConteoDetalleDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, ClasificacionDiferenciaDto>>({})
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
      if (res.estado !== 'en_revision') {
        setError(`Solo se clasifica en revisión (estado actual: ${res.estado}).`)
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

  const conDiferencia = data?.lineas.filter((l) => (l.diferencia ?? 0) !== 0) ?? []

  async function guardarClasificacion(lineaId: string) {
    if (!data) return
    const clasificacion = drafts[lineaId]
    if (!clasificacion) {
      showError('Seleccione una clasificación.')
      return
    }
    setSavingLinea(lineaId)
    try {
      const res = await conteosApi.clasificar(data.id, lineaId, data.version, clasificacion)
      if (!res.success || !res.data) {
        showError(res.error?.message ?? 'No se pudo clasificar la línea.')
        return
      }
      showSuccess('Línea clasificada')
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          version: res.data!.version,
          lineas: prev.lineas.map((l) =>
            l.id === lineaId ? { ...l, clasificacion, estadoLinea: 'revisada' } : l,
          ),
        }
      })
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
        { label: 'Clasificación' },
      ]}
      backPath={data ? `/inventario/conteos/${data.id}` : '/inventario?tab=conteos'}
      title="Clasificación de diferencias"
      loading={loading}
      error={error}
    >
      {data && (
        <div className="space-y-4">
          {conDiferencia.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
              No hay diferencias por clasificar.
            </div>
          ) : (
            <Card>
              <CardHeader title="Líneas con diferencia" />
              <CardBody className="!p-0">
                <Table
                  keyField="id"
                  data={conDiferencia}
                  columns={[
                    { key: 'titulo', header: 'Producto', render: (l) => <span className="font-medium">{l.titulo ?? l.productoId}</span> },
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
                      key: 'clasificacion',
                      header: 'Clasificación actual',
                      render: (l) => (l.clasificacion ? <Badge variant="info">{l.clasificacion}</Badge> : <span className="text-xs text-slate-400">Pendiente</span>),
                    },
                    {
                      key: 'select',
                      header: 'Nueva clasificación',
                      render: (l) => (
                        <Select
                          value={drafts[l.id] ?? ''}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [l.id]: e.target.value as ClasificacionDiferenciaDto }))
                          }
                          options={[{ value: '', label: 'Seleccione…' }, ...CLASIFICACIONES]}
                        />
                      ),
                    },
                    {
                      key: 'actions',
                      header: '',
                      render: (l) => (
                        <Button size="sm" icon={Save} disabled={savingLinea === l.id} onClick={() => void guardarClasificacion(l.id)}>
                          Guardar
                        </Button>
                      ),
                    },
                  ]}
                />
              </CardBody>
            </Card>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-2">
            <Button variant="outline" onClick={() => navigate(`/inventario/conteos/${data.id}`)}>
              Volver al conteo
            </Button>
            <Button onClick={() => navigate(`/inventario/conteos/${data.id}/regularizacion`)}>
              Ir a regularización
            </Button>
          </div>
        </div>
      )}
    </DetailPageShell>
  )
}
