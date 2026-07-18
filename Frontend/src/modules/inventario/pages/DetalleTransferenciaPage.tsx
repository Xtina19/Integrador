import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { DetailRow } from '@/components/ui/FormDialog'
import { branches } from '@/mocks/mockCore'
import {
  transferenciasApi,
  type TransferenciaDetalleDto,
} from '@/services/api/transferenciasApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { newIdempotencyKey } from '@/utils/idempotency'
import { TRANSFERENCIA_ESTADO_LABEL } from '../types/inventoryUi'
import { transferenciaBadge } from '../utils/statusBadges'
import { DetailPageShell } from '../components/DetailPageShell'

const PIPELINE = ['borrador', 'solicitada', 'en_transito', 'recibida_parcial', 'recibida'] as const

function almacenNombre(id: string): string {
  return branches.find((b) => b.id === id)?.name ?? id
}

export function DetalleTransferenciaPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [data, setData] = useState<TransferenciaDetalleDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await transferenciasApi.get(id)
      if (!res) {
        setError('Transferencia no encontrada.')
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

  async function runAction(label: string, action: () => Promise<{ success: boolean; error?: { message: string } }>) {
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
        { label: 'Transferencias', to: '/inventario?tab=transferencias' },
        { label: data?.codigo ?? id },
      ]}
      backPath="/inventario?tab=transferencias"
      title={data?.codigo ?? 'Transferencia'}
      badge={data && <Badge variant={transferenciaBadge(data.estado)}>{TRANSFERENCIA_ESTADO_LABEL[data.estado]}</Badge>}
      loading={loading}
      error={error}
      actions={
        data && (
          <>
            {data.estado === 'borrador' && (
              <Button
                size="sm"
                disabled={acting}
                onClick={() => runAction('Solicitud', () => transferenciasApi.solicitar(data.id, data.version))}
              >
                Solicitar
              </Button>
            )}
            {(data.estado === 'borrador' || data.estado === 'solicitada') && (
              <Button
                size="sm"
                variant="outline"
                disabled={acting}
                onClick={() => runAction('Cancelación', () => transferenciasApi.cancelar(data.id, data.version))}
              >
                Cancelar
              </Button>
            )}
            {data.estado === 'solicitada' && (
              <Button
                size="sm"
                disabled={acting}
                onClick={() =>
                  runAction('Despacho', () => transferenciasApi.despachar(data.id, data.version, newIdempotencyKey()))
                }
              >
                Despachar
              </Button>
            )}
            {(data.estado === 'en_transito' || data.estado === 'recibida_parcial') && (
              <Button size="sm" icon={Truck} onClick={() => navigate(`/inventario/transferencias/${data.id}/recepcion`)}>
                Registrar recepción
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
                <DetailRow label="Origen" value={almacenNombre(data.almacenOrigenId)} />
                <DetailRow label="Destino" value={almacenNombre(data.almacenDestinoId)} />
                <DetailRow label="Fecha" value={data.fecha} />
                <DetailRow label="Solicitante" value={data.solicitanteId} />
                <DetailRow label="Versión (concurrencia)" value={String(data.version)} />
                <DetailRow label="Observación" value={data.observacion ?? '—'} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Progreso del flujo" />
            <CardBody>
              {data.estado === 'cancelada' ? (
                <Badge variant="danger">Cancelada</Badge>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {PIPELINE.map((estado) => {
                    const idx = PIPELINE.indexOf(estado)
                    const cur = PIPELINE.indexOf(data.estado as (typeof PIPELINE)[number])
                    const done = cur >= 0 && idx <= cur
                    return (
                      <span
                        key={estado}
                        className={`rounded px-2 py-1 text-[11px] font-medium ${
                          done ? 'bg-corporate text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {TRANSFERENCIA_ESTADO_LABEL[estado]}
                      </span>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Líneas" />
            <CardBody className="!p-0">
              <Table
                keyField="id"
                data={data.lineas}
                columns={[
                  { key: 'isbn', header: 'ISBN', className: 'font-mono text-xs' },
                  {
                    key: 'titulo',
                    header: 'Producto',
                    render: (l) => <span className="font-medium">{l.titulo ?? l.productoId}</span>,
                  },
                  {
                    key: 'cantidadSolicitada',
                    header: 'Solicitada',
                    render: (l) => <span className="tabular-nums font-semibold">{l.cantidadSolicitada}</span>,
                  },
                  { key: 'cantidadDespachada', header: 'Despachada', render: (l) => <span className="tabular-nums">{l.cantidadDespachada}</span> },
                  { key: 'cantidadRecibida', header: 'Recibida', render: (l) => <span className="tabular-nums">{l.cantidadRecibida}</span> },
                  { key: 'cantidadFaltante', header: 'Faltante', render: (l) => <span className="tabular-nums text-amber-600">{l.cantidadFaltante}</span> },
                  { key: 'cantidadDanada', header: 'Dañada', render: (l) => <span className="tabular-nums text-red-600">{l.cantidadDanada}</span> },
                ]}
              />
            </CardBody>
          </Card>
        </div>
      )}
    </DetailPageShell>
  )
}
