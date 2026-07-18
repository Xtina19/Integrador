import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FileImage } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Input, Select } from '@/components/ui/Input'
import { DetailRow } from '@/components/ui/FormDialog'
import { descartesApi, type DescarteDetalleDto } from '@/services/api/descartesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'
import { newIdempotencyKey } from '@/utils/idempotency'
import { descarteBadge } from '../utils/statusBadges'
import { DetailPageShell } from '../components/DetailPageShell'

export function DetalleDescartePage() {
  const { id = '' } = useParams()
  const { showSuccess, showError } = useToast()
  const [data, setData] = useState<DescarteDetalleDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [evidenciaComentario, setEvidenciaComentario] = useState('')
  const [evidenciaTipo, setEvidenciaTipo] = useState<'fotografia' | 'pdf' | 'acta' | 'documento' | 'comentario'>('comentario')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await descartesApi.get(id)
      if (!res) {
        setError('Descarte no encontrado.')
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

  async function adjuntarEvidencia() {
    if (!data || !evidenciaComentario.trim()) {
      showError('Ingrese una referencia o comentario para la evidencia.')
      return
    }
    setActing(true)
    try {
      const res = await descartesApi.adjuntarEvidencia(data.id, {
        tipo: evidenciaTipo,
        comentario: evidenciaComentario.trim(),
      })
      if (!res.success) {
        showError(res.error?.message ?? 'No se pudo adjuntar la evidencia.')
        return
      }
      showSuccess('Evidencia adjuntada')
      setEvidenciaComentario('')
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
        { label: 'Descartes', to: '/inventario?tab=descartes' },
        { label: data?.codigo ?? id },
      ]}
      backPath="/inventario?tab=descartes"
      title={data?.codigo ?? 'Descarte'}
      badge={data && <Badge variant={descarteBadge(data.estado as never)}>{data.estado}</Badge>}
      loading={loading}
      error={error}
      actions={
        data && (
          <>
            {data.estado === 'borrador' && (
              <>
                <Button size="sm" disabled={acting} onClick={() => runAction('Solicitud', () => descartesApi.solicitar(data.id, data.version))}>
                  Solicitar
                </Button>
                <Button size="sm" variant="outline" disabled={acting} onClick={() => runAction('Cancelación', () => descartesApi.cancelar(data.id, data.version))}>
                  Cancelar
                </Button>
              </>
            )}
            {data.estado === 'solicitado' && (
              <>
                <Button size="sm" disabled={acting} onClick={() => runAction('Aprobación', () => descartesApi.aprobar(data.id, data.version))}>
                  Aprobar
                </Button>
                <Button size="sm" variant="outline" disabled={acting} onClick={() => runAction('Rechazo', () => descartesApi.rechazar(data.id, data.version))}>
                  Rechazar
                </Button>
              </>
            )}
            {data.estado === 'aprobado' && (
              <Button size="sm" disabled={acting} onClick={() => runAction('Aplicación', () => descartesApi.aplicar(data.id, data.version, newIdempotencyKey()))}>
                Aplicar (Engine)
              </Button>
            )}
            {data.estado === 'aplicado' && (
              <Button size="sm" variant="outline" disabled={acting} onClick={() => runAction('Reversión', () => descartesApi.revertir(data.id, data.version))}>
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
                <DetailRow label="Motivo" value={`${data.motivoCodigo}${data.motivoDescripcion ? ` — ${data.motivoDescripcion}` : ''}`} />
                <DetailRow label="Responsable" value={data.responsableNombre ?? '—'} />
                <DetailRow label="Fecha" value={data.fecha} />
                <DetailRow label="Requiere aprobación" value={data.requiereAprobacion ? 'Sí' : 'No'} />
                <DetailRow label="Versión (concurrencia)" value={String(data.version)} />
                <DetailRow label="Observación" value={data.observaciones ?? '—'} />
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
                  { key: 'cantidad', header: 'Cantidad', render: (l) => <span className="font-semibold tabular-nums text-red-600">−{l.cantidad}</span> },
                  { key: 'costo', header: 'Costo', render: (l) => <span className="tabular-nums">{l.costo ?? 0}</span> },
                  { key: 'observacion', header: 'Observación', className: 'text-xs text-slate-500' },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Evidencias" />
            <CardBody className="space-y-3">
              {data.evidencias.length === 0 && <p className="text-sm text-slate-500">Sin evidencias adjuntas.</p>}
              {data.evidencias.map((ev) => (
                <div key={ev.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <FileImage size={14} className="text-corporate" />
                  <span className="font-medium capitalize">{ev.tipo}</span>
                  {ev.nombreArchivo && <span className="text-slate-500">— {ev.nombreArchivo}</span>}
                  {ev.comentario && <span className="text-slate-500">— {ev.comentario}</span>}
                </div>
              ))}
              {data.estado === 'borrador' && (
                <div className="grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-[160px_1fr_auto]">
                  <Select
                    label="Tipo"
                    value={evidenciaTipo}
                    onChange={(e) => setEvidenciaTipo(e.target.value as typeof evidenciaTipo)}
                    options={[
                      { value: 'fotografia', label: 'Fotografía' },
                      { value: 'pdf', label: 'PDF' },
                      { value: 'acta', label: 'Acta' },
                      { value: 'documento', label: 'Documento' },
                      { value: 'comentario', label: 'Comentario' },
                    ]}
                  />
                  <Input
                    label="Referencia / comentario"
                    value={evidenciaComentario}
                    onChange={(e) => setEvidenciaComentario(e.target.value)}
                    placeholder="archivo.pdf o descripción…"
                  />
                  <div className="flex items-end">
                    <Button size="sm" disabled={acting} onClick={() => void adjuntarEvidencia()}>
                      Adjuntar
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </DetailPageShell>
  )
}
