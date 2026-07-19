import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, RefreshCw } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { VentasApiRequiredBanner } from '../components/VentasApiRequiredBanner'
import { ventasApi, type EstadoVentaDto, type VentaResumenDto } from '@/services/api/ventasApi'
import {
  formatDop,
  formatFecha,
  tipoVentaLabel,
  ventaEstadoBadge,
  ventaEstadoLabel,
} from '../utils/ventasUi'
import { getFriendlyErrorMessage } from '@/services/http'

/** Listado de facturas emitidas (VEN-ARCH · menú Ventas). */
export function VentasListPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<VentaResumenDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<'' | EstadoVentaDto>('')

  const load = useCallback(async () => {
    if (!ventasApi.isEnabled()) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await ventasApi.listar({
        estado: estado || undefined,
        numeroFactura: search.trim() || undefined,
        limit: 200,
      })
      setRows(data)
    } catch (e) {
      setError(getFriendlyErrorMessage(e))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [estado, search])

  useEffect(() => {
    void load()
  }, [load])

  const columns = useMemo(
    () => [
      {
        key: 'numeroFactura',
        header: 'Factura',
        render: (r: VentaResumenDto) => (
          <span className="font-medium text-corporate">{r.numeroFactura}</span>
        ),
      },
      {
        key: 'fechaEmision',
        header: 'Fecha',
        render: (r: VentaResumenDto) => formatFecha(r.fechaEmision),
      },
      {
        key: 'tipoVenta',
        header: 'Tipo',
        render: (r: VentaResumenDto) => tipoVentaLabel(r.tipoVenta),
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (r: VentaResumenDto) => (
          <Badge variant={ventaEstadoBadge(r.estado)}>{ventaEstadoLabel(r.estado)}</Badge>
        ),
      },
      {
        key: 'total',
        header: 'Total',
        render: (r: VentaResumenDto) => formatDop(r.total),
      },
      {
        key: 'flags',
        header: 'Postventa',
        render: (r: VentaResumenDto) => (
          <div className="flex flex-wrap gap-1">
            {r.tieneCambios && <Badge variant="info">Cambio</Badge>}
            {r.tieneNotasCredito && <Badge variant="gold">NC</Badge>}
            {!r.tieneCambios && !r.tieneNotasCredito && (
              <span className="text-xs text-slate-400">—</span>
            )}
          </div>
        ),
      },
      {
        key: 'actions',
        header: '',
        render: (r: VentaResumenDto) => (
          <Button
            size="sm"
            variant="ghost"
            icon={Eye}
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/ventas/facturas/${r.id}`)
            }}
          >
            Ver
          </Button>
        ),
      },
    ],
    [navigate],
  )

  if (!ventasApi.isEnabled()) return <VentasApiRequiredBanner />

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-corporate">Facturas</h1>
        <Button size="sm" variant="outline" icon={RefreshCw} onClick={() => void load()}>
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader title="Facturas" />
        <CardBody className="space-y-4">
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Número de factura…"
            filters={
              <Select
                label="Estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value as '' | EstadoVentaDto)}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'emitida', label: 'Emitida' },
                  { value: 'anulada', label: 'Anulada' },
                ]}
              />
            }
          />

          {!loading && rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No hay facturas para mostrar.</p>
          ) : (
            <Table
              columns={columns}
              data={rows}
              keyField="id"
              onRowClick={(r) => navigate(`/ventas/facturas/${r.id}`)}
            />
          )}
        </CardBody>
      </Card>
    </div>
  )
}
