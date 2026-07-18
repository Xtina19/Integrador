import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DetailRow } from '@/components/ui/FormDialog'
import { auditoriaInventarioApi, type AuditoriaInventarioDto } from '@/services/api/auditoriaInventarioApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { DetailPageShell } from '../components/DetailPageShell'

function documentoRoute(tipo: string, id: string): string | null {
  const t = tipo.toLowerCase()
  if (t.includes('transfer')) return `/inventario/transferencias/${id}`
  if (t.includes('descarte')) return `/inventario/descartes/${id}`
  if (t.includes('ajuste')) return `/inventario/ajustes/${id}`
  if (t.includes('conteo')) return `/inventario/conteos/${id}`
  if (t.includes('mov')) return `/inventario/movimientos/${id}`
  return null
}

export function DetalleAuditoriaPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<AuditoriaInventarioDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await auditoriaInventarioApi.listar()
      const found = rows.find((r) => r.id === id) ?? null
      if (!found) {
        setError('Registro de auditoría no encontrado.')
      }
      setData(found)
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

  const docRoute = data ? documentoRoute(data.documentoTipo, data.documentoId) : null

  return (
    <DetailPageShell
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Auditoría', to: '/inventario?tab=auditoria' },
        { label: data?.id ?? id },
      ]}
      backPath="/inventario?tab=auditoria"
      title={data?.accion ?? 'Registro de auditoría'}
      badge={
        data && (
          <Badge variant={data.resultado === 'OK' ? 'success' : data.resultado === 'RECHAZADO' ? 'warning' : 'danger'}>
            {data.resultado}
          </Badge>
        )
      }
      loading={loading}
      error={error}
      actions={
        docRoute && (
          <Button variant="outline" onClick={() => navigate(docRoute)}>
            Abrir documento
          </Button>
        )
      }
    >
      {data && (
        <Card>
          <CardHeader title="Detalle del evento" />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Fecha" value={data.fecha} />
              <DetailRow label="Usuario" value={data.usuario} />
              <DetailRow label="Acción" value={data.accion} />
              <DetailRow label="Documento" value={`${data.documentoTipo} · ${data.documentoId}`} />
              <DetailRow label="IP" value={data.ip ?? '—'} />
              <DetailRow label="Resultado" value={data.resultado} />
              <DetailRow label="Detalle" value={data.detalle ?? '—'} />
            </div>
          </CardBody>
        </Card>
      )}
    </DetailPageShell>
  )
}
