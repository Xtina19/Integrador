import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { conteosApi, type ConteoDetalleDto } from '@/services/api/conteosApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { DetailPageShell } from '../components/DetailPageShell'

export function RevisionConteoPage() {
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

  async function enviarRevision() {
    if (!data) return
    setActing(true)
    try {
      const res = await conteosApi.revision(data.id, data.version)
      if (!res.success) {
        showError(res.error?.message ?? 'No se pudo enviar a revisión.')
        return
      }
      showSuccess('Conteo en revisión')
      await load()
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setActing(false)
    }
  }

  const conDiferencia = data?.lineas.filter((l) => (l.diferencia ?? 0) !== 0) ?? []
  const sinDiferencia = (data?.lineas.length ?? 0) - conDiferencia.length

  return (
    <DetailPageShell
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Conteos', to: '/inventario?tab=conteos' },
        { label: data?.codigo ?? id, to: data ? `/inventario/conteos/${data.id}` : undefined },
        { label: 'Revisión' },
      ]}
      backPath={data ? `/inventario/conteos/${data.id}` : '/inventario?tab=conteos'}
      title="Revisión de conteo"
      loading={loading}
      error={error}
      actions={
        data &&
        (data.estado === 'en_conteo' || data.estado === 'abierto') && (
          <Button size="sm" disabled={acting} onClick={() => void enviarRevision()}>
            Enviar a revisión
          </Button>
        )
      }
    >
      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-2xl font-bold tabular-nums text-corporate">{data.lineas.length}</p>
              <p className="text-xs text-slate-500">Líneas totales</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-2xl font-bold tabular-nums text-emerald-700">{sinDiferencia}</p>
              <p className="text-xs text-emerald-700">Cuadran</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-2xl font-bold tabular-nums text-amber-700">{conDiferencia.length}</p>
              <p className="text-xs text-amber-700">Con diferencia</p>
            </div>
          </div>

          <Card>
            <CardHeader title="Líneas con diferencia" />
            <CardBody className="!p-0">
              <Table
                keyField="id"
                data={conDiferencia}
                columns={[
                  { key: 'titulo', header: 'Producto', render: (l) => <span className="font-medium">{l.titulo ?? l.productoId}</span> },
                  { key: 'cantidadTeorica', header: 'Teórica', render: (l) => <span className="tabular-nums">{l.cantidadTeorica}</span> },
                  { key: 'cantidadContada', header: 'Contada', render: (l) => <span className="tabular-nums">{l.cantidadContada}</span> },
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
                    render: (l) => <Badge variant="warning">{l.estadoLinea.replace(/_/g, ' ')}</Badge>,
                  },
                ]}
              />
            </CardBody>
          </Card>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-2">
            <Button variant="outline" onClick={() => navigate(`/inventario/conteos/${data.id}`)}>
              Volver al conteo
            </Button>
            {data.estado === 'en_revision' && (
              <Button onClick={() => navigate(`/inventario/conteos/${data.id}/clasificacion`)}>
                Continuar a clasificación
              </Button>
            )}
          </div>
        </div>
      )}
    </DetailPageShell>
  )
}
