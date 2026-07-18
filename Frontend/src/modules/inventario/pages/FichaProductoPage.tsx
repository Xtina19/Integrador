import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { History } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DetailRow } from '@/components/ui/FormDialog'
import { inventarioQueryApi } from '@/services/api/inventarioQueryApi'
import { getFriendlyErrorMessage } from '@/services/http'
import type { ProductoInventarioVista } from '../types/inventoryUi'
import { stockEstadoBadge } from '../utils/statusBadges'
import { DetailPageShell } from '../components/DetailPageShell'

const estadoLabel = { normal: 'Normal', bajo: 'Bajo stock', agotado: 'Agotado' } as const

export function FichaProductoPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<ProductoInventarioVista | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await inventarioQueryApi.productoVistaById(id)
      if (!res) {
        setError('Producto no encontrado en la vista de inventario.')
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

  return (
    <DetailPageShell
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: data?.titulo ?? id },
      ]}
      backPath="/inventario"
      title={data?.titulo ?? 'Ficha de producto'}
      badge={data && <Badge variant={stockEstadoBadge(data.estado)}>{estadoLabel[data.estado]}</Badge>}
      loading={loading}
      error={error}
      actions={
        data && (
          <>
            <Button icon={History} onClick={() => navigate(`/inventario/kardex/${data.id}`)}>
              Abrir Kardex
            </Button>
            {data.ultimoMovimientoId && (
              <Button variant="outline" onClick={() => navigate(`/inventario/movimientos/${data.ultimoMovimientoId}`)}>
                Último movimiento
              </Button>
            )}
          </>
        )
      }
    >
      {data && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Datos generales" />
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="ISBN" value={data.isbn} />
                <DetailRow label="Autor" value={data.autor} />
                <DetailRow label="Categoría" value={data.categoria} />
                <DetailRow label="Stock consolidado" value={`${data.stockConsolidado} (mín. ${data.stockMinimo})`} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Stock por sucursal / almacén" />
            <CardBody className="!p-0">
              <div className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Almacén</th>
                      <th className="px-4 py-2">Sucursal</th>
                      <th className="px-4 py-2 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.porAlmacen.map((a) => (
                      <tr key={a.almacenId} className="border-t border-slate-100">
                        <td className="px-4 py-2">{a.almacenNombre}</td>
                        <td className="px-4 py-2 text-slate-500">{a.sucursal}</td>
                        <td className="px-4 py-2 text-right font-semibold tabular-nums">{a.saldo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Documentos activos del ciclo de inventario" />
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricChip label="Transferencias activas" value={data.transferenciasActivas} />
                <MetricChip label="Conteos abiertos" value={data.conteosAbiertos} />
                <MetricChip label="Ajustes pendientes" value={data.ajustesPendientes} />
                <MetricChip label="Descartes relacionados" value={data.descartesRelacionados} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Trazabilidad" />
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="Último movimiento" value={data.ultimoMovimientoFecha ?? '—'} />
                <DetailRow label="Última auditoría" value={data.ultimaAuditoriaFecha ?? '—'} />
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </DetailPageShell>
  )
}

function MetricChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-lg font-bold tabular-nums text-corporate">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  )
}
