import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ClipboardList, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { DetailRow } from '@/components/ui/FormDialog'
import { conteosApi, type ConteoDetalleDto } from '@/services/api/conteosApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { CONTEO_FASES } from '../types/inventoryUi'
import { conteoBadge } from '../utils/statusBadges'
import { DetailPageShell } from '../components/DetailPageShell'

export function DetalleConteoPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [data, setData] = useState<ConteoDetalleDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await conteosApi.get(id)
      if (!res) {
        setError('Conteo no encontrado.')
        setData(null)
      } else {
        setData(res)
      }
    } catch (e) {
      setError(getFriendlyErrorMessage(e))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function abrir() {
    if (!data) return
    setActing(true)
    try {
      const res = await conteosApi.abrir(data.id, data.version)
      if (!res.success) {
        showError(res.error?.message ?? 'No se pudo abrir el conteo.')
        return
      }
      showSuccess('Conteo abierto · snapshot tomado')
      await load()
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setActing(false)
    }
  }

  async function enviarRevision() {
    if (!data) return
    setActing(true)
    try {
      const res = await conteosApi.revision(data.id, data.version)
      if (!res.success) {
        showError(res.error?.message ?? 'No se pudo enviar a revisión.')
        return
      }
      showSuccess('Conteo enviado a revisión')
      await load()
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setActing(false)
    }
  }

  async function cerrar() {
    if (!data) return
    setActing(true)
    try {
      const res = await conteosApi.cerrar(data.id, data.version)
      if (!res.success) {
        showError(res.error?.message ?? 'No se pudo cerrar el conteo.')
        return
      }
      showSuccess('Conteo cerrado')
      await load()
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setActing(false)
    }
  }

  async function cancelar() {
    if (!data) return
    setActing(true)
    try {
      const res = await conteosApi.cancelar(data.id, data.version)
      if (!res.success) {
        showError(res.error?.message ?? 'No se pudo cancelar el conteo.')
        return
      }
      showSuccess('Conteo cancelado')
      await load()
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setActing(false)
    }
  }

  return (
    <DetailPageShell
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Conteos', to: '/inventario?tab=conteos' },
        { label: data?.codigo ?? id },
      ]}
      backPath="/inventario?tab=conteos"
      title={data?.codigo ?? 'Conteo físico'}
      badge={
        data && (
          <Badge variant={conteoBadge(data.estado as never)}>{data.estado.replace(/_/g, ' ')}</Badge>
        )
      }
      loading={loading}
      error={error}
      actions={
        data && (
          <>
            {data.estado === 'borrador' && (
              <Button size="sm" disabled={acting} onClick={() => void abrir()}>
                Abrir conteo
              </Button>
            )}
            {(data.estado === 'abierto' || data.estado === 'en_conteo') && (
              <Button size="sm" onClick={() => navigate(`/inventario/conteos/${data.id}/captura`)}>
                Ir a captura
              </Button>
            )}
            {data.estado === 'en_conteo' && (
              <Button size="sm" variant="outline" onClick={() => navigate(`/inventario/conteos/${data.id}/reconteo`)}>
                Reconteo
              </Button>
            )}
            {(data.estado === 'en_conteo' || data.estado === 'abierto') && (
              <Button size="sm" variant="outline" disabled={acting} onClick={() => void enviarRevision()}>
                Enviar a revisión
              </Button>
            )}
            {data.estado === 'en_revision' && (
              <Button size="sm" onClick={() => navigate(`/inventario/conteos/${data.id}/clasificacion`)}>
                Clasificar diferencias
              </Button>
            )}
            {data.estado === 'en_revision' && (
              <Button size="sm" variant="outline" onClick={() => navigate(`/inventario/conteos/${data.id}/regularizacion`)}>
                Regularización
              </Button>
            )}
            {data.estado === 'en_revision' && (
              <Button size="sm" variant="outline" disabled={acting} onClick={() => void cerrar()}>
                Cerrar
              </Button>
            )}
            {(data.estado === 'borrador' || data.estado === 'abierto') && (
              <Button size="sm" variant="outline" disabled={acting} onClick={() => void cancelar()}>
                Cancelar conteo
              </Button>
            )}
          </>
        )
      }
    >
      {data && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Detalle general" />
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="Almacén" value={data.almacenId} />
                <DetailRow label="Tipo" value={data.tipoConteo} />
                <DetailRow label="Fase actual" value={data.fase} />
                <DetailRow label="Responsable" value={data.responsableNombre ?? data.responsableId} />
                <DetailRow label="Productos en alcance" value={String(data.productosAlcance)} />
                <DetailRow label="Diferencias" value={String(data.diferencias)} />
                <DetailRow
                  label="Bloqueo de almacén"
                  value={
                    data.bloqueoActivo ? (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <Lock size={12} /> Activo
                      </span>
                    ) : (
                      'Libre'
                    )
                  }
                />
                <DetailRow label="Versión (concurrencia)" value={String(data.version)} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Fases del flujo operativo" />
            <CardBody>
              <ol className="flex flex-wrap items-stretch gap-2">
                {CONTEO_FASES.map((fase, i) => {
                  const cur = CONTEO_FASES.indexOf(data.fase as (typeof CONTEO_FASES)[number])
                  const done = cur >= 0 && i <= cur
                  return (
                    <li
                      key={fase}
                      className={`flex w-28 flex-col rounded-lg border p-2.5 ${
                        done ? 'border-corporate bg-corporate/5' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-corporate">0{i + 1}</span>
                      <span className="text-xs font-semibold text-slate-800">{fase}</span>
                    </li>
                  )
                })}
              </ol>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Líneas del conteo" />
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
                  { key: 'cantidadContada', header: 'Contada', render: (l) => <span className="tabular-nums">{l.cantidadContada ?? '—'}</span> },
                  {
                    key: 'diferencia',
                    header: 'Diferencia',
                    render: (l) => (
                      <span className={`font-semibold tabular-nums ${(l.diferencia ?? 0) < 0 ? 'text-red-600' : (l.diferencia ?? 0) > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {l.diferencia ?? 0}
                      </span>
                    ),
                  },
                  {
                    key: 'clasificacion',
                    header: 'Clasificación',
                    render: (l) => (l.clasificacion ? <Badge variant="info">{l.clasificacion}</Badge> : <span className="text-xs text-slate-400">—</span>),
                  },
                  {
                    key: 'estadoLinea',
                    header: 'Estado línea',
                    render: (l) => <span className="text-xs capitalize text-slate-500">{l.estadoLinea.replace(/_/g, ' ')}</span>,
                  },
                ]}
              />
            </CardBody>
          </Card>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <ClipboardList size={16} className="text-corporate" />
            No mueve stock. Las diferencias se regularizan mediante Ajuste o Descarte, referenciando esta línea.
          </div>
        </div>
      )}
    </DetailPageShell>
  )
}
