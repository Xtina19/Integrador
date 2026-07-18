import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FileMinus, FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { conteosApi, type ConteoDetalleDto, type LineaConteoDto } from '@/services/api/conteosApi'
import { ajustesApi } from '@/services/api/ajustesApi'
import { descartesApi } from '@/services/api/descartesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { DetailPageShell } from '../components/DetailPageShell'

export function RegularizacionConteoPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [data, setData] = useState<ConteoDetalleDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)

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

  const pendientes =
    data?.lineas.filter(
      (l) => l.clasificacion && l.clasificacion !== 'cuadra' && l.clasificacion !== 'investigacion' && !l.regularizacionId,
    ) ?? []

  async function crearAjuste(linea: LineaConteoDto) {
    if (!data) return
    setActing(linea.id)
    try {
      const diferencia = linea.diferencia ?? 0
      const res = await ajustesApi.crear({
        almacenId: data.almacenId,
        tipoAjuste: 'conteo',
        lineas: [
          {
            productoId: linea.productoId,
            isbn: linea.isbn,
            titulo: linea.titulo,
            cantidadObjetivo: linea.cantidadContada ?? linea.cantidadTeorica,
            diferencia,
            motivoCodigo: linea.clasificacion,
            lineaConteoId: linea.id,
          },
        ],
        observacion: `Regularización de conteo ${data.codigo} · línea ${linea.id}`,
        documentoOrigenTipo: 'conteo',
        documentoOrigenId: data.id,
      })
      if (!res.success || !res.data) {
        showError(res.error?.message ?? 'No se pudo crear el ajuste.')
        return
      }
      showSuccess(`Ajuste ${res.data.codigo} creado — apruébelo y aplíquelo para regularizar la línea`)
      navigate(`/inventario/ajustes/${res.data.id}`)
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setActing(null)
    }
  }

  async function crearDescarte(linea: LineaConteoDto) {
    if (!data) return
    setActing(linea.id)
    try {
      const cantidad = Math.abs(linea.diferencia ?? 0)
      const res = await descartesApi.crear({
        fecha: new Date().toISOString().slice(0, 10),
        sucursalId: data.almacenId,
        almacenId: data.almacenId,
        motivoCodigo: 'DANO_FISICO',
        motivoDescripcion: `Regularización de conteo ${data.codigo}`,
        lineas: [
          {
            productoId: linea.productoId,
            isbn: linea.isbn,
            titulo: linea.titulo,
            existenciaActual: linea.cantidadTeorica,
            cantidad,
            costo: 0,
          },
        ],
        evidencias: [],
        requiereAprobacion: true,
      })
      if (!res.success || !res.data) {
        showError(res.error?.message ?? 'No se pudo crear el descarte.')
        return
      }
      showSuccess(`Descarte ${res.data.codigo} creado — apruébelo y aplíquelo para regularizar la línea`)
      navigate(`/inventario/descartes/${res.data.id}`)
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setActing(null)
    }
  }

  return (
    <DetailPageShell
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Conteos', to: '/inventario?tab=conteos' },
        { label: data?.codigo ?? id, to: data ? `/inventario/conteos/${data.id}` : undefined },
        { label: 'Regularización' },
      ]}
      backPath={data ? `/inventario/conteos/${data.id}` : '/inventario?tab=conteos'}
      title="Regularización de diferencias"
      loading={loading}
      error={error}
    >
      {data && (
        <div className="space-y-4">
          {pendientes.length === 0 ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-8 text-center text-sm text-emerald-800">
              No hay diferencias pendientes de regularización. El conteo puede cerrarse.
            </div>
          ) : (
            <Card>
              <CardHeader title="Líneas pendientes de regularizar" />
              <CardBody className="!p-0">
                <Table
                  keyField="id"
                  data={pendientes}
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
                      header: 'Clasificación',
                      render: (l) => <Badge variant="warning">{l.clasificacion}</Badge>,
                    },
                    {
                      key: 'actions',
                      header: '',
                      render: (l) => (
                        <div className="flex gap-2">
                          {l.clasificacion === 'dano' ? (
                            <Button size="sm" icon={FileMinus} disabled={acting === l.id} onClick={() => void crearDescarte(l)}>
                              Crear descarte
                            </Button>
                          ) : (
                            <Button size="sm" icon={FilePlus} disabled={acting === l.id} onClick={() => void crearAjuste(l)}>
                              Crear ajuste
                            </Button>
                          )}
                        </div>
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
