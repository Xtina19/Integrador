import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, FileText, Link2, Printer, Ban, RefreshCw, ListTree } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { VentasApiRequiredBanner } from '../components/VentasApiRequiredBanner'
import {
  ventasApi,
  type NotaCreditoAdminDto,
} from '@/services/api/ventasApi'
import {
  formatDop,
  formatFecha,
  notaCreditoEstadoBadge,
  notaCreditoEstadoLabel,
  refLabel,
} from '../utils/ventasUi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

type DialogMode = 'consultar' | 'aplicaciones' | 'anular' | null

/**
 * Centro de consulta administrativa de Notas de Crédito.
 * NO emite ni crea NC — la emisión sigue exclusiva del expediente de Factura.
 */
export function NotasCreditoListPage() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [rows, setRows] = useState<NotaCreditoAdminDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [sucursalId, setSucursalId] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [selected, setSelected] = useState<NotaCreditoAdminDto | null>(null)
  const [dialog, setDialog] = useState<DialogMode>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!ventasApi.isEnabled()) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await ventasApi.listarNotasCredito({
        texto: search.trim() || undefined,
        estado: estado || undefined,
        sucursalId: sucursalId || undefined,
        clienteId: clienteId.trim() || undefined,
        desde: desde ? `${desde}T00:00:00.000Z` : undefined,
        hasta: hasta ? `${hasta}T23:59:59.999Z` : undefined,
        limit: 500,
      })
      setRows(data)
    } catch (e) {
      setError(getFriendlyErrorMessage(e))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [search, estado, sucursalId, clienteId, desde, hasta])

  useEffect(() => {
    void load()
  }, [load])

  const indicators = useMemo(() => {
    const emitidas = rows.filter((r) => r.estado !== 'anulada')
    const anuladas = rows.filter((r) => r.estado === 'anulada').length
    const creditoDisponible = emitidas.reduce((s, r) => s + r.saldoPendiente, 0)
    const creditoAplicado = emitidas.reduce((s, r) => s + r.montoAplicado, 0)
    return {
      totalEmitidas: emitidas.length,
      creditoDisponible,
      creditoAplicado,
      totalAnuladas: anuladas,
    }
  }, [rows])

  function puedeAnular(nc: NotaCreditoAdminDto): boolean {
    return (
      nc.estado !== 'anulada' &&
      nc.montoAplicado === 0 &&
      nc.aplicaciones.length === 0
    )
  }

  function imprimirNc(nc: NotaCreditoAdminDto) {
    const w = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900')
    if (!w) {
      showError('No se pudo abrir la ventana de impresión.')
      return
    }
    w.document.write(`<!doctype html><html><head><title>${nc.id}</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;color:#111}
        h1{font-size:18px;margin:0 0 8px;color:#1E2D86}
        .meta{font-size:13px;margin:4px 0}
        table{width:100%;border-collapse:collapse;margin-top:16px;font-size:13px}
        th,td{border:1px solid #ddd;padding:8px;text-align:left}
      </style></head><body>
      <h1>LibroSys — Nota de crédito</h1>
      <p class="meta"><strong>${nc.id}</strong> · ${notaCreditoEstadoLabel(nc.estado)}</p>
      <p class="meta">Factura origen: ${nc.numeroFacturaOrigen}</p>
      <p class="meta">Cliente: ${nc.clienteNombre ?? refLabel(nc.clienteId)}</p>
      <p class="meta">Fecha: ${formatFecha(nc.fecha)}</p>
      <p class="meta">Sucursal: ${refLabel(nc.sucursalId)}</p>
      <p class="meta">Motivo: ${nc.motivo}</p>
      <p class="meta">Monto: ${formatDop(nc.monto)} · Aplicado: ${formatDop(nc.montoAplicado)} · Disponible: ${formatDop(nc.saldoPendiente)}</p>
      <h2 style="font-size:14px;margin-top:20px">Aplicaciones</h2>
      <table><thead><tr><th>Venta destino</th><th>Monto</th><th>Fecha</th></tr></thead>
      <tbody>
      ${
        nc.aplicaciones.length === 0
          ? '<tr><td colspan="3">Sin aplicaciones</td></tr>'
          : nc.aplicaciones
              .map(
                (a) =>
                  `<tr><td>${a.ventaDestinoId}</td><td>${formatDop(a.montoAplicado)}</td><td>${formatFecha(a.fecha)}</td></tr>`,
              )
              .join('')
      }
      </tbody></table>
      <script>window.onload=()=>{window.print()}</script>
      </body></html>`)
    w.document.close()
  }

  async function confirmarAnular() {
    if (!selected || !puedeAnular(selected)) return
    setBusy(true)
    try {
      await ventasApi.anularNotaCredito(selected.ventaOrigenId, selected.id, {
        expectedVersion: selected.ventaVersion,
      })
      showSuccess(`NC ${selected.id} anulada.`)
      setDialog(null)
      setSelected(null)
      void load()
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'id',
        header: 'Número NC',
        render: (r: NotaCreditoAdminDto) => (
          <span className="font-medium text-corporate">{r.id}</span>
        ),
      },
      {
        key: 'fecha',
        header: 'Fecha',
        render: (r: NotaCreditoAdminDto) => formatFecha(r.fecha),
      },
      {
        key: 'cliente',
        header: 'Cliente',
        render: (r: NotaCreditoAdminDto) => r.clienteNombre ?? refLabel(r.clienteId),
      },
      {
        key: 'factura',
        header: 'Factura origen',
        render: (r: NotaCreditoAdminDto) => (
          <button
            type="button"
            className="text-corporate underline-offset-2 hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/ventas/facturas/${r.ventaOrigenId}?tab=notas_credito`)
            }}
          >
            {r.numeroFacturaOrigen}
          </button>
        ),
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (r: NotaCreditoAdminDto) => (
          <Badge variant={notaCreditoEstadoBadge(r.estado)}>
            {notaCreditoEstadoLabel(r.estado)}
          </Badge>
        ),
      },
      {
        key: 'monto',
        header: 'Monto original',
        render: (r: NotaCreditoAdminDto) => formatDop(r.monto),
      },
      {
        key: 'saldo',
        header: 'Saldo disponible',
        render: (r: NotaCreditoAdminDto) => formatDop(r.saldoPendiente),
      },
      {
        key: 'aplicado',
        header: 'Total aplicado',
        render: (r: NotaCreditoAdminDto) => formatDop(r.montoAplicado),
      },
      {
        key: 'usuario',
        header: 'Usuario emisor',
        render: (r: NotaCreditoAdminDto) => refLabel(r.usuarioId),
      },
      {
        key: 'sucursal',
        header: 'Sucursal',
        render: (r: NotaCreditoAdminDto) => refLabel(r.sucursalId),
      },
      {
        key: 'actions',
        header: 'Acciones',
        render: (r: NotaCreditoAdminDto) => (
          <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              icon={Eye}
              onClick={() => {
                setSelected(r)
                setDialog('consultar')
              }}
            >
              Consultar
            </Button>
            <Button size="sm" variant="ghost" icon={Printer} onClick={() => imprimirNc(r)}>
              Reimprimir
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={Link2}
              onClick={() =>
                navigate(`/ventas/facturas/${r.ventaOrigenId}?tab=notas_credito`)
              }
            >
              Factura
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={ListTree}
              onClick={() => {
                setSelected(r)
                setDialog('aplicaciones')
              }}
            >
              Aplicaciones
            </Button>
            {puedeAnular(r) && (
              <Button
                size="sm"
                variant="ghost"
                icon={Ban}
                onClick={() => {
                  setSelected(r)
                  setDialog('anular')
                }}
              >
                Anular
              </Button>
            )}
          </div>
        ),
      },
    ],
    [navigate],
  )

  if (!ventasApi.isEnabled()) return <VentasApiRequiredBanner />

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-corporate">Notas de Crédito</h1>
          <p className="mt-1 text-sm text-slate-500">
            Consulta administrativa. La emisión se realiza desde el expediente de la factura
            origen.
          </p>
        </div>
        <Button size="sm" variant="outline" icon={RefreshCw} onClick={() => void load()}>
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardBody className="py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">NC emitidas</p>
            <p className="mt-1 text-xl font-semibold text-corporate">
              {indicators.totalEmitidas}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Crédito disponible</p>
            <p className="mt-1 text-xl font-semibold text-emerald-700">
              {formatDop(indicators.creditoDisponible)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Crédito aplicado</p>
            <p className="mt-1 text-xl font-semibold text-slate-800">
              {formatDop(indicators.creditoAplicado)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Anuladas</p>
            <p className="mt-1 text-xl font-semibold text-red-700">
              {indicators.totalAnuladas}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Listado de notas de crédito" />
        <CardBody className="space-y-4">
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Número NC, factura o cliente…"
            filters={
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Select
                  label="Estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  options={[
                    { value: '', label: 'Todos' },
                    { value: 'emitida', label: 'Disponible' },
                    { value: 'parcialmente_aplicada', label: 'Parcialmente utilizada' },
                    { value: 'aplicada', label: 'Utilizada' },
                    { value: 'anulada', label: 'Anulada' },
                  ]}
                />
                <Select
                  label="Sucursal"
                  value={sucursalId}
                  onChange={(e) => setSucursalId(e.target.value)}
                  options={[
                    { value: '', label: 'Todas' },
                    { value: 'suc-central', label: 'Sucursal Central' },
                    { value: 'suc-santiago', label: 'Sucursal Santiago' },
                    { value: 'suc-polanco', label: 'Sucursal Polanco' },
                    { value: 'suc-villa', label: 'Sucursal Villa Olga' },
                  ]}
                />
                <Input
                  label="Cliente (ID)"
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  placeholder="cli-… / CLI-…"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Desde"
                    type="date"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                  />
                  <Input
                    label="Hasta"
                    type="date"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                  />
                </div>
              </div>
            }
          />

          {!loading && rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No hay notas de crédito para mostrar.
            </p>
          ) : (
            <Table
              columns={columns}
              data={rows}
              keyField="id"
              onRowClick={(r) => {
                setSelected(r)
                setDialog('consultar')
              }}
            />
          )}
        </CardBody>
      </Card>

      <FormDialog
        open={dialog === 'consultar' && Boolean(selected)}
        onClose={() => {
          setDialog(null)
          setSelected(null)
        }}
        title={selected ? `Nota de crédito ${selected.id}` : 'Nota de crédito'}
        subtitle={selected ? notaCreditoEstadoLabel(selected.estado) : undefined}
        mode="view"
        maxWidth="lg"
      >
        {selected && (
          <div className="space-y-1">
            <DetailRow label="Número NC" value={<span className="font-mono">{selected.id}</span>} />
            <DetailRow label="Fecha" value={formatFecha(selected.fecha)} />
            <DetailRow
              label="Cliente"
              value={selected.clienteNombre ?? refLabel(selected.clienteId)}
            />
            <DetailRow
              label="Factura origen"
              value={
                <button
                  type="button"
                  className="text-corporate underline-offset-2 hover:underline"
                  onClick={() => {
                    setDialog(null)
                    navigate(
                      `/ventas/facturas/${selected.ventaOrigenId}?tab=notas_credito`,
                    )
                  }}
                >
                  {selected.numeroFacturaOrigen}
                </button>
              }
            />
            <DetailRow
              label="Estado"
              value={
                <Badge variant={notaCreditoEstadoBadge(selected.estado)}>
                  {notaCreditoEstadoLabel(selected.estado)}
                </Badge>
              }
            />
            <DetailRow label="Monto original" value={formatDop(selected.monto)} />
            <DetailRow label="Saldo disponible" value={formatDop(selected.saldoPendiente)} />
            <DetailRow label="Total aplicado" value={formatDop(selected.montoAplicado)} />
            <DetailRow label="Usuario emisor" value={refLabel(selected.usuarioId)} />
            <DetailRow label="Sucursal" value={refLabel(selected.sucursalId)} />
            <DetailRow label="Motivo" value={selected.motivo} />
            <div className="flex flex-wrap gap-2 pt-4">
              <Button size="sm" variant="outline" icon={Printer} onClick={() => imprimirNc(selected)}>
                Reimprimir
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={FileText}
                onClick={() => {
                  setDialog(null)
                  navigate(`/ventas/facturas/${selected.ventaOrigenId}?tab=notas_credito`)
                }}
              >
                Abrir factura origen
              </Button>
            </div>
          </div>
        )}
      </FormDialog>

      <FormDialog
        open={dialog === 'aplicaciones' && Boolean(selected)}
        onClose={() => {
          setDialog(null)
          setSelected(null)
        }}
        title="Historial de aplicaciones"
        subtitle={selected?.id}
        mode="view"
        maxWidth="md"
      >
        {selected &&
          (selected.aplicaciones.length === 0 ? (
            <p className="text-sm text-slate-500">Sin aplicaciones registradas.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {selected.aplicaciones.map((a, i) => (
                <li
                  key={`${a.ventaDestinoId}-${i}`}
                  className="rounded-lg border border-slate-100 px-3 py-2"
                >
                  <p>
                    <span className="text-slate-500">Venta destino:</span> {a.ventaDestinoId}
                  </p>
                  <p>
                    <span className="text-slate-500">Monto:</span> {formatDop(a.montoAplicado)}
                  </p>
                  <p>
                    <span className="text-slate-500">Fecha:</span> {formatFecha(a.fecha)}
                  </p>
                </li>
              ))}
            </ul>
          ))}
      </FormDialog>

      <FormDialog
        open={dialog === 'anular' && Boolean(selected)}
        onClose={() => {
          setDialog(null)
          setSelected(null)
        }}
        title="Anular nota de crédito"
        subtitle={selected?.id}
        mode="edit"
        maxWidth="md"
        saveLabel={busy ? 'Anulando…' : 'Confirmar anulación'}
        saveDisabled={busy || !selected || !puedeAnular(selected)}
        onSave={() => void confirmarAnular()}
      >
        <p className="text-sm text-slate-600">
          Solo se puede anular una NC sin aplicaciones (saldo completo disponible). Esta acción
          no crea un documento nuevo ni cambia la factura origen.
        </p>
      </FormDialog>
    </div>
  )
}
