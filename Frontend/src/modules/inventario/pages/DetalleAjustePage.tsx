import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { DetailRow } from '@/components/ui/FormDialog'
import { ajustesApi, type AjusteDetalleDto } from '@/services/api/ajustesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { newIdempotencyKey } from '@/utils/idempotency'
import { ajusteBadge } from '../utils/statusBadges'
import { DetailPageShell } from '../components/DetailPageShell'

export function DetalleAjustePage() {
  const { id = '' } = useParams()
  const { showSuccess, showError } = useToast()
  const [data, setData] = useState<AjusteDetalleDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await ajustesApi.get(id)
      if (!res) {
        setError('Ajuste no encontrado.')
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

  async function runAction(
    label: string,
    action: () => Promise<{ success: boolean; error?: { message: string } }>,
  ) {
    setActing(true)
    try {
      const res = await action()
      if (!res.success) {
        showError(res.error?.message ?? `No se pudo ${label}.`)
        return
      }
      showSuccess(`${label} realizada correctamente`)
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
        { label: 'Ajustes', to: '/inventario?tab=ajustes' },
        { label: data?.codigo ?? id },
      ]}
      backPath="/inventario?tab=ajustes"
      title={data?.codigo ?? 'Ajuste'}
      badge={data && <Badge variant={ajusteBadge(data.estado as never)}>{data.estado}</Badge>}
      loading={loading}
      error={error}
      actions={
        data && (
          <>
            {data.estado === 'borrador' && (
              <Button size="sm" disabled={acting} onClick={() => runAction('Solicitud', () => ajustesApi.solicitar(data.id, data.version))}>
                Solicitar
              </Button>
            )}
            {(data.estado === 'borrador' || data.estado === 'solicitado') && (
              <Button size="sm" variant="outline" disabled={acting} onClick={() => runAction('Cancelación', () => ajustesApi.cancelar(data.id, data.version))}>
                Cancelar
              </Button>
            )}
            {data.estado === 'solicitado' && (
              <>
                <Button size="sm" disabled={acting} onClick={() => runAction('Aprobación', () => ajustesApi.aprobar(data.id, data.version))}>
                  Aprobar
                </Button>
                <Button size="sm" variant="outline" disabled={acting} onClick={() => runAction('Rechazo', () => ajustesApi.rechazar(data.id, data.version))}>
                  Rechazar
                </Button>
              </>
            )}
            {data.estado === 'aprobado' && (
              <Button size="sm" disabled={acting} onClick={() => runAction('Aplicación', () => ajustesApi.aplicar(data.id, data.version, newIdempotencyKey()))}>
                Aplicar (Engine)
              </Button>
            )}
            {data.estado === 'aplicado' && (
              <Button size="sm" variant="outline" disabled={acting} onClick={() => runAction('Reversión', () => ajustesApi.revertir(data.id, data.version))}>
                Revertir
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
                <DetailRow label="Tipo de ajuste" value={data.tipoAjuste} />
                <DetailRow label="Solicitante" value={data.solicitanteId} />
                <DetailRow label="Aprobador" value={data.aprobadorId ?? '—'} />
                <DetailRow label="Fecha" value={data.fecha} />
                <DetailRow label="Versión (concurrencia)" value={String(data.version)} />
                {data.documentoOrigenTipo && (
                  <DetailRow
                    label="Origen"
                    value={`${data.documentoOrigenTipo} · ${data.documentoOrigenId}`}
                  />
                )}
                <DetailRow label="Observación" value={data.observacion ?? '—'} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Líneas" />
            <CardBody className="!p-0">
              <Table
                keyField="id"
                data={data.lineas}
                columns={[
                  { key: 'titulo', header: 'Producto', render: (l) => <span className="font-medium">{l.titulo ?? l.productoId}</span> },
                  {
                    key: 'diferencia',
                    header: 'Diferencia',
                    render: (l) => (
                      <span className={`font-semibold tabular-nums ${l.diferencia < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                        {l.diferencia > 0 ? `+${l.diferencia}` : l.diferencia}
                      </span>
                    ),
                  },
                  { key: 'cantidadObjetivo', header: 'Objetivo', render: (l) => <span className="tabular-nums">{l.cantidadObjetivo}</span> },
                  { key: 'motivoCodigo', header: 'Motivo', className: 'text-xs text-slate-500' },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      )}
    </DetailPageShell>
  )
}
