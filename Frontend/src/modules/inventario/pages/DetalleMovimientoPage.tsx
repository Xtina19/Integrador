import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { History } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DetailRow } from '@/components/ui/FormDialog'
import { movimientosApi, type MovimientoDto } from '@/services/api/movimientosApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { DetailPageShell } from '../components/DetailPageShell'

function documentoRoute(tipo: string, id: string): string | null {
  const t = tipo.toLowerCase()
  if (t.includes('transfer')) return `/inventario/transferencias/${id}`
  if (t.includes('descarte')) return `/inventario/descartes/${id}`
  if (t.includes('ajuste')) return `/inventario/ajustes/${id}`
  if (t.includes('conteo')) return `/inventario/conteos/${id}`
  return null
}

export function DetalleMovimientoPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<MovimientoDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await movimientosApi.get(id)
      if (!res) {
        setError('Movimiento no encontrado.')
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

  const docRoute = data ? documentoRoute(data.documentoTipo, data.documentoId) : null

  return (
    <DetailPageShell
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Movimientos', to: '/inventario?tab=movimientos' },
        { label: data?.id ?? id },
      ]}
      backPath="/inventario?tab=movimientos"
      title={data?.id ?? 'Movimiento'}
      loading={loading}
      error={error}
      actions={
        data && (
          <>
            <Button icon={History} onClick={() => navigate(`/inventario/kardex/${data.productoId}`)}>
              Ver Kardex
            </Button>
            {docRoute && (
              <Button variant="outline" onClick={() => navigate(docRoute)}>
                Abrir documento origen
              </Button>
            )}
          </>
        )
      }
    >
      {data && (
        <Card>
          <CardHeader title="Detalle del movimiento" />
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailRow label="Fecha" value={data.fecha} />
              <DetailRow label="Tipo" value={<Badge variant={data.cantidad < 0 ? 'warning' : 'success'}>{data.tipo}</Badge>} />
              <DetailRow label="Producto" value={data.productoTitulo ?? data.productoId} />
              <DetailRow label="Almacén" value={data.almacenNombre ?? data.almacenId} />
              <DetailRow
                label="Cantidad"
                value={
                  <span className={`font-semibold tabular-nums ${data.cantidad < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {data.cantidad > 0 ? `+${data.cantidad}` : data.cantidad}
                  </span>
                }
              />
              <DetailRow label="Saldo" value={`${data.saldoAnterior} → ${data.saldoPosterior}`} />
              <DetailRow label="Documento origen" value={`${data.documentoTipo} · ${data.documentoId}`} />
              <DetailRow label="Usuario" value={data.usuario} />
            </div>
          </CardBody>
        </Card>
      )}
    </DetailPageShell>
  )
}
