import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  Ban,
  Eye,
  FileText,
  Loader2,
  Printer,
  Undo2,
} from 'lucide-react'
import { DetailPageShell } from '@/modules/inventario/components/DetailPageShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Table } from '@/components/ui/Table'
import { FormDialog } from '@/components/ui/FormDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input, Textarea } from '@/components/ui/Input'
import { useToast } from '@/context/ToastContext'
import { VentasApiRequiredBanner } from '../components/VentasApiRequiredBanner'
import { FacturaTabNav } from '../components/FacturaTabNav'
import {
  CambioAsistente,
  type CambioAsistenteSubmit,
} from '../components/CambioAsistente'
import { parseFacturaTab, type FacturaTabId } from '../types/facturaUi'
import {
  ventasApi,
  type CambioDto,
  type HistorialVentaDto,
  type NotaCreditoDto,
  type VentaDetalleDto,
} from '@/services/api/ventasApi'
import {
  formatDop,
  formatFecha,
  formaPagoLabel,
  newIdempotencyKey,
  notaCreditoEstadoBadge,
  notaCreditoEstadoLabel,
  refLabel,
  tipoVentaLabel,
  ventaEstadoBadge,
  ventaEstadoLabel,
} from '../utils/ventasUi'
import { getFriendlyErrorMessage } from '@/services/http'

type PostventaDialog = 'nc' | 'nc_detalle' | null

type InventarioConsultaRow = {
  id: string
  operacion: string
  sentido: string
  producto: string
  cantidad: number
  almacenId: string
  documento: string
  estado: string
  fecha?: string
}

function resolucionLabel(value: string): string {
  const map: Record<string, string> = {
    sin_diferencia: 'Sin diferencia',
    cobro: 'Cobro de diferencia',
    devolucion_dinero: 'Devolución de dinero',
    nota_credito: 'Nota de crédito',
    mixto: 'Mixto',
  }
  return map[value] ?? value
}

function eventoHistorialLabel(tipo: string, detalle?: string | null): string {
  if (tipo === 'cambio' && detalle) {
    if (detalle.startsWith('Cambio sin producto de salida')) {
      return 'Cambio sin producto de salida'
    }
    if (detalle.startsWith('Cambio con Nota de Crédito')) {
      return 'Cambio con Nota de Crédito'
    }
    if (detalle.startsWith('Cambio con diferencia')) {
      return 'Cambio con diferencia'
    }
    return 'Cambio'
  }
  const map: Record<string, string> = {
    emision: 'Venta realizada',
    pago: 'Pago registrado',
    reimpresion: 'Reimpresión',
    cambio: 'Cambio',
    nota_credito: 'Nota de crédito',
    aplicacion_nc: 'Aplicación de NC',
    anulacion: 'Anulación',
    descuento: 'Descuento',
  }
  return map[tipo] ?? tipo
}

export function VentaDetallePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showSuccess, showError } = useToast()
  const [activeTab, setActiveTab] = useState<FacturaTabId>(() =>
    parseFacturaTab(searchParams.get('tab')),
  )
  const [venta, setVenta] = useState<VentaDetalleDto | null>(null)
  const [historial, setHistorial] = useState<HistorialVentaDto[]>([])
  const [inventarioRows, setInventarioRows] = useState<InventarioConsultaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmAnular, setConfirmAnular] = useState(false)
  const [motivoAnular, setMotivoAnular] = useState('')
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState<PostventaDialog>(null)
  const [asistenteCambio, setAsistenteCambio] = useState(false)

  const [ncMonto, setNcMonto] = useState(0)
  const [ncMotivo, setNcMotivo] = useState('')
  const [ncSeleccionada, setNcSeleccionada] = useState<NotaCreditoDto | null>(null)
  const [ncConfirm, setNcConfirm] = useState<'anular' | 'revertir' | null>(null)

  useEffect(() => {
    setActiveTab(parseFacturaTab(searchParams.get('tab')))
  }, [searchParams])

  const changeTab = useCallback(
    (tab: FacturaTabId) => {
      setActiveTab(tab)
      const next = new URLSearchParams(searchParams)
      if (tab === 'general') next.delete('tab')
      else next.set('tab', tab)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const load = useCallback(async () => {
    if (!ventasApi.isEnabled() || !id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [v, h, inv] = await Promise.all([
        ventasApi.getById(id),
        ventasApi.historial(id),
        ventasApi.inventarioRelacionado(id),
      ])
      setVenta(v)
      setHistorial(h.length > 0 ? h : v.historial)
      setInventarioRows(
        inv.map((m) => ({
          id: m.id,
          operacion: m.operacion,
          sentido: m.sentido,
          producto: m.producto,
          cantidad: m.cantidad,
          almacenId: m.almacenId,
          documento: m.documentoTipo
            ? `${m.documentoTipo === 'venta' ? 'Factura' : m.documentoTipo === 'cambio' ? 'Cambio' : m.documentoTipo === 'nota_credito' ? 'Nota de crédito' : m.documentoTipo} ${m.documentoId}`
            : m.documentoId,
          estado: 'Registrado',
          fecha: m.fecha,
        })),
      )
    } catch (e) {
      setError(getFriendlyErrorMessage(e))
      setVenta(null)
      setInventarioRows([])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function handleReimprimir() {
    if (!venta) return
    setBusy(true)
    try {
      const updated = await ventasApi.reimprimir(venta.id)
      setVenta(updated)
      const h = await ventasApi.historial(venta.id)
      setHistorial(h)
      showSuccess('Reimpresión registrada en el historial de la factura.')
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function handleAnular() {
    if (!venta || !motivoAnular.trim()) return
    setBusy(true)
    try {
      await ventasApi.anular(venta.id, {
        motivo: motivoAnular.trim(),
        idempotencyKey: newIdempotencyKey('anul'),
        expectedVersion: venta.version,
      })
      setConfirmAnular(false)
      setMotivoAnular('')
      showSuccess('Factura anulada.')
      void load()
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function submitCambio(payload: CambioAsistenteSubmit) {
    if (!venta) return
    setBusy(true)
    try {
      await ventasApi.registrarCambio(venta.id, {
        ...payload,
        idempotencyKey: newIdempotencyKey('cam'),
        expectedVersion: venta.version,
      })
      setAsistenteCambio(false)
      showSuccess('Cambio registrado en la factura.')
      void load()
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function submitNc() {
    if (!venta) return
    setBusy(true)
    try {
      await ventasApi.emitirNotaCredito(venta.id, {
        monto: ncMonto,
        motivo: ncMotivo,
        expectedVersion: venta.version,
      })
      setDialog(null)
      showSuccess('Nota de crédito emitida.')
      void load()
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function confirmarNcAccion() {
    if (!venta || !ncSeleccionada || !ncConfirm) return
    setBusy(true)
    try {
      if (ncConfirm === 'anular') {
        await ventasApi.anularNotaCredito(venta.id, ncSeleccionada.id, {
          expectedVersion: venta.version,
        })
        showSuccess(`NC ${ncSeleccionada.id} anulada.`)
      } else {
        await ventasApi.revertirAplicacionesNotaCredito(venta.id, ncSeleccionada.id, {
          expectedVersion: venta.version,
        })
        showSuccess(`Aplicaciones de ${ncSeleccionada.id} revertidas.`)
      }
      setNcConfirm(null)
      setDialog(null)
      setNcSeleccionada(null)
      void load()
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  function imprimirNc(nc: NotaCreditoDto) {
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
      <p class="meta">Factura origen: ${venta?.numeroFactura ?? nc.ventaOrigenId}</p>
      <p class="meta">Cliente: ${refLabel(nc.clienteId)}</p>
      <p class="meta">Fecha: ${formatFecha(nc.fecha)}</p>
      <p class="meta">Motivo: ${nc.motivo}</p>
      <p class="meta">Monto: ${formatDop(nc.monto)} · Aplicado: ${formatDop(nc.montoAplicado)} · Disponible: ${formatDop(Math.max(0, nc.monto - nc.montoAplicado))}</p>
      <table><thead><tr><th>Factura destino</th><th>Monto</th><th>Fecha</th></tr></thead><tbody>
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

  if (!ventasApi.isEnabled()) return <VentasApiRequiredBanner />

  const emitida = venta?.estado === 'emitida'
  const puedePostventa = Boolean(emitida && venta?.tipoVenta === 'cliente_registrado')

  function openCambio() {
    setAsistenteCambio(true)
  }

  function openNc() {
    setNcMonto(0)
    setNcMotivo('')
    setDialog('nc')
  }

  const tabActions = (() => {
    if (!venta || !emitida) return null
    if (activeTab === 'cambios') {
      if (asistenteCambio) return null
      return (
        <Button
          size="sm"
          variant="primary"
          icon={ArrowLeftRight}
          disabled={!puedePostventa || busy}
          onClick={openCambio}
        >
          Registrar cambio
        </Button>
      )
    }
    if (activeTab === 'notas_credito') {
      return (
        <Button
          size="sm"
          variant="primary"
          icon={FileText}
          disabled={!puedePostventa || busy}
          onClick={openNc}
        >
          Emitir nota de crédito
        </Button>
      )
    }
    return null
  })()

  return (
    <>
      <DetailPageShell
        breadcrumbs={[
          { label: 'Ventas', to: '/ventas' },
          { label: 'Facturas', to: '/ventas/facturas' },
          { label: venta?.numeroFactura ?? 'Factura' },
        ]}
        backPath="/ventas/facturas"
        title={venta?.numeroFactura ?? 'Factura'}
        subtitle={venta ? formatFecha(venta.fechaEmision) : undefined}
        badge={
          venta ? (
            <Badge variant={ventaEstadoBadge(venta.estado)}>
              {ventaEstadoLabel(venta.estado)}
            </Badge>
          ) : undefined
        }
        loading={loading}
        error={error}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {tabActions}
            <Button
              size="sm"
              variant="outline"
              icon={Printer}
              disabled={!venta || busy}
              onClick={() => void handleReimprimir()}
            >
              Reimprimir
            </Button>
            {emitida && (
              <Button
                size="sm"
                variant="danger"
                icon={Ban}
                disabled={busy}
                onClick={() => setConfirmAnular(true)}
              >
                Anular
              </Button>
            )}
          </div>
        }
      >
        {venta && (
          <div className="space-y-4">
            <FacturaTabNav active={activeTab} onChange={changeTab} />

            {activeTab === 'general' && (
              <Card>
                <CardHeader title="Información general" />
                <CardBody>
                  <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="text-slate-500">Tipo de venta</dt>
                      <dd className="font-medium">{tipoVentaLabel(venta.tipoVenta)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Cliente</dt>
                      <dd className="font-medium">
                        {venta.clienteId
                          ? refLabel(venta.clienteId)
                          : 'Consumidor final'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Sucursal</dt>
                      <dd className="font-medium">{refLabel(venta.sucursalId)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Almacén</dt>
                      <dd className="font-medium">{refLabel(venta.almacenId)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Usuario de emisión</dt>
                      <dd className="font-medium">{refLabel(venta.usuarioEmisionId)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Moneda</dt>
                      <dd className="font-medium">{venta.moneda}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Subtotal</dt>
                      <dd className="font-medium tabular-nums">{formatDop(venta.subtotal)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Descuentos</dt>
                      <dd className="font-medium tabular-nums">
                        {formatDop(venta.totalDescuentos)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Total</dt>
                      <dd className="font-bold tabular-nums text-corporate">
                        {formatDop(venta.total)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Versión</dt>
                      <dd className="font-medium">{venta.version}</dd>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                      {venta.tieneCambios && <Badge variant="info">Con cambios</Badge>}
                      {venta.tieneNotasCredito && <Badge variant="gold">Con NC</Badge>}
                    </div>
                    {venta.motivoAnulacion && (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <dt className="text-slate-500">Motivo de anulación</dt>
                        <dd className="font-medium text-red-700">{venta.motivoAnulacion}</dd>
                      </div>
                    )}
                  </dl>
                  {!puedePostventa && emitida && (
                    <p className="mt-4 text-sm text-slate-500">
                      Cambio, devolución y nota de crédito requieren cliente registrado.
                    </p>
                  )}
                </CardBody>
              </Card>
            )}

            {activeTab === 'productos' && (
              <Card>
                <CardHeader title="Productos" />
                <CardBody className="p-0">
                  <Table
                    keyField="id"
                    data={venta.lineas}
                    columns={[
                      { key: 'descripcionSnapshot', header: 'Producto' },
                      { key: 'cantidad', header: 'Cant.' },
                      {
                        key: 'precioUnitario',
                        header: 'P. unit.',
                        render: (l) => formatDop(l.precioUnitario),
                      },
                      {
                        key: 'importeNeto',
                        header: 'Importe',
                        render: (l) => formatDop(l.importeNeto),
                      },
                    ]}
                  />
                </CardBody>
              </Card>
            )}

            {activeTab === 'pagos' && (
              <Card>
                <CardHeader title="Pagos" />
                <CardBody className="p-0">
                  <Table
                    keyField="id"
                    data={venta.pagos}
                    columns={[
                      {
                        key: 'formaPago',
                        header: 'Forma',
                        render: (p) => formaPagoLabel(p.formaPago),
                      },
                      {
                        key: 'monto',
                        header: 'Monto',
                        render: (p) => formatDop(p.monto),
                      },
                      { key: 'moneda', header: 'Moneda' },
                      {
                        key: 'notaCreditoId',
                        header: 'Nota de crédito',
                        render: (p) =>
                          p.formaPago === 'nota_credito' ? (p.notaCreditoId ?? '—') : '—',
                      },
                      {
                        key: 'vuelto',
                        header: 'Vuelto',
                        render: (p) => (p.vuelto != null ? formatDop(p.vuelto) : '—'),
                      },
                    ]}
                  />
                </CardBody>
              </Card>
            )}

            {activeTab === 'cambios' && (
              <div className="space-y-4">
                {asistenteCambio && puedePostventa ? (
                  <CambioAsistente
                    venta={venta}
                    busy={busy}
                    onCancel={() => setAsistenteCambio(false)}
                    onSubmit={(payload) => void submitCambio(payload)}
                  />
                ) : (
                  <Card>
                    <CardHeader title="Cambios" />
                    <CardBody className="space-y-4">
                      {!puedePostventa && emitida && (
                        <p className="text-sm text-slate-500">
                          Requiere cliente registrado.
                        </p>
                      )}
                      {venta.cambios.length === 0 ? (
                        <p className="text-sm text-slate-500">Sin cambios registrados.</p>
                      ) : (
                        <Table
                          keyField="id"
                          data={venta.cambios as CambioDto[]}
                          columns={[
                            {
                              key: 'fecha',
                              header: 'Fecha',
                              render: (c) => formatFecha(c.fecha),
                            },
                            { key: 'usuarioId', header: 'Usuario', render: (c) => refLabel(c.usuarioId) },
                            {
                              key: 'lineasDevueltas',
                              header: 'Devuelto',
                              render: (c) =>
                                c.lineasDevueltas
                                  .map(
                                    (l) =>
                                      `${l.descripcionSnapshot ?? l.productoId} ×${l.cantidad}`,
                                  )
                                  .join(', '),
                            },
                            {
                              key: 'lineasNuevas',
                              header: 'Nuevo',
                              render: (c) =>
                                c.lineasNuevas
                                  .map(
                                    (l) =>
                                      `${l.descripcionSnapshot ?? l.productoId} ×${l.cantidad}`,
                                  )
                                  .join(', '),
                            },
                            {
                              key: 'valorDevuelto',
                              header: 'Valor devuelto',
                              render: (c) =>
                                formatDop(
                                  c.valorDevuelto ??
                                    c.lineasDevueltas.reduce(
                                      (s, l) => s + (l.precioUnitario ?? 0) * l.cantidad,
                                      0,
                                    ),
                                ),
                            },
                            {
                              key: 'valorNuevo',
                              header: 'Valor nuevo',
                              render: (c) =>
                                formatDop(
                                  c.valorNuevo ??
                                    c.lineasNuevas.reduce(
                                      (s, l) => s + (l.precioUnitario ?? 0) * l.cantidad,
                                      0,
                                    ),
                                ),
                            },
                            {
                              key: 'diferenciaMonto',
                              header: 'Diferencia',
                              render: (c) => formatDop(c.diferenciaMonto),
                            },
                            {
                              key: 'resolucion',
                              header: 'Resolución',
                              render: (c) => resolucionLabel(c.resolucion),
                            },
                          ]}
                        />
                      )}
                    </CardBody>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'notas_credito' && (
              <Card>
                <CardHeader
                  title="Notas de crédito"
                  action={
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate('/ventas/notas-credito')}
                    >
                      Ver listado administrativo
                    </Button>
                  }
                />
                <CardBody className="space-y-4">
                  <p className="text-xs text-slate-500">
                    La emisión solo ocurre aquí, desde la factura origen. El menú Ventas → Notas de
                    Crédito es únicamente consulta.
                  </p>
                  {!puedePostventa && emitida && (
                    <p className="text-sm text-slate-500">Requiere cliente registrado.</p>
                  )}
                  {venta.notasCredito.length === 0 ? (
                    <p className="text-sm text-slate-500">Sin notas de crédito.</p>
                  ) : (
                    <Table
                      keyField="id"
                      data={venta.notasCredito as NotaCreditoDto[]}
                      columns={[
                        {
                          key: 'id',
                          header: 'Código',
                          render: (n) => (
                            <span className="font-mono text-xs text-corporate">{n.id}</span>
                          ),
                        },
                        {
                          key: 'fecha',
                          header: 'Fecha',
                          render: (n) => formatFecha(n.fecha),
                        },
                        { key: 'motivo', header: 'Motivo' },
                        {
                          key: 'monto',
                          header: 'Monto',
                          render: (n) => formatDop(n.monto),
                        },
                        {
                          key: 'saldo',
                          header: 'Disponible',
                          render: (n) =>
                            formatDop(Math.max(0, n.monto - n.montoAplicado)),
                        },
                        {
                          key: 'estado',
                          header: 'Estado',
                          render: (n) => (
                            <Badge variant={notaCreditoEstadoBadge(n.estado)}>
                              {notaCreditoEstadoLabel(n.estado)}
                            </Badge>
                          ),
                        },
                        {
                          key: 'acciones',
                          header: 'Acciones',
                          render: (n) => (
                            <div className="flex flex-wrap items-center gap-1">
                              <button
                                type="button"
                                className="p-1.5 rounded-md text-gray-400 hover:text-corporate hover:bg-corporate/5"
                                title="Consultar"
                                onClick={() => {
                                  setNcSeleccionada(n)
                                  setDialog('nc_detalle')
                                }}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                type="button"
                                className="p-1.5 rounded-md text-gray-400 hover:text-corporate hover:bg-corporate/5"
                                title="Imprimir"
                                onClick={() => imprimirNc(n)}
                              >
                                <Printer size={16} />
                              </button>
                              {(n.estado === 'parcialmente_aplicada' ||
                                n.estado === 'aplicada') && (
                                <button
                                  type="button"
                                  className="p-1.5 rounded-md text-gray-400 hover:text-amber-700 hover:bg-amber-50"
                                  title="Revertir aplicaciones"
                                  onClick={() => {
                                    setNcSeleccionada(n)
                                    setNcConfirm('revertir')
                                  }}
                                >
                                  <Undo2 size={16} />
                                </button>
                              )}
                              {n.estado === 'emitida' && n.montoAplicado === 0 && (
                                <button
                                  type="button"
                                  className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                                  title="Anular"
                                  onClick={() => {
                                    setNcSeleccionada(n)
                                    setNcConfirm('anular')
                                  }}
                                >
                                  <Ban size={16} />
                                </button>
                              )}
                            </div>
                          ),
                        },
                      ]}
                    />
                  )}
                </CardBody>
              </Card>
            )}

            {activeTab === 'historial' && (
              <Card>
                <CardHeader title="Historial" />
                <CardBody className="p-0">
                  <p className="px-4 pt-3 text-xs text-slate-500">
                    Trazabilidad comercial de la factura (emisión, postventa, reimpresiones y
                    anulaciones). La auditoría de stock vive en la pestaña Inventario.
                  </p>
                  {(historial.length === 0 ? venta.historial : historial).length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">Sin eventos registrados.</p>
                  ) : (
                    <Table
                      keyField="id"
                      data={historial.length > 0 ? historial : venta.historial}
                      columns={[
                        {
                          key: 'fecha',
                          header: 'Fecha / hora',
                          render: (h) => formatFecha(h.fecha),
                        },
                        {
                          key: 'tipoEvento',
                          header: 'Operación',
                          render: (h) => eventoHistorialLabel(h.tipoEvento, h.detalle),
                        },
                        { key: 'usuarioId', header: 'Usuario', render: (h) => refLabel(h.usuarioId) },
                        {
                          key: 'resultado',
                          header: 'Resultado',
                          render: (h) => (
                            <Badge
                              variant={
                                h.resultado === 'OK'
                                  ? 'success'
                                  : h.resultado === 'RECHAZADO'
                                    ? 'warning'
                                    : 'danger'
                              }
                            >
                              {h.resultado}
                            </Badge>
                          ),
                        },
                        {
                          key: 'detalle',
                          header: 'Descripción',
                          render: (h) => h.detalle ?? '—',
                        },
                      ]}
                    />
                  )}
                </CardBody>
              </Card>
            )}

            {activeTab === 'inventario' && (
              <Card>
                <CardHeader title="Inventario" />
                <CardBody className="space-y-3">
                  <p className="text-xs text-slate-500 px-1">
                    Movimientos de inventario asociados a esta factura y su postventa.
                  </p>
                  {inventarioRows.length === 0 ? (
                    <p className="text-sm text-slate-500">Sin movimientos de inventario registrados.</p>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <Table
                        keyField="id"
                        data={inventarioRows}
                        columns={[
                          {
                            key: 'fecha',
                            header: 'Fecha',
                            render: (r) => (r.fecha ? formatFecha(r.fecha) : '—'),
                          },
                          { key: 'operacion', header: 'Operación' },
                          { key: 'sentido', header: 'Sentido' },
                          { key: 'producto', header: 'Producto' },
                          { key: 'cantidad', header: 'Cant.' },
                          {
                            key: 'almacenId',
                            header: 'Almacén',
                            render: (r) => refLabel(r.almacenId),
                          },
                          { key: 'documento', header: 'Documento' },
                          { key: 'estado', header: 'Estado' },
                        ]}
                      />
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </DetailPageShell>

      <FormDialog
        open={confirmAnular}
        onClose={() => setConfirmAnular(false)}
        title="Anular factura"
        subtitle="Requiere supervisor o administrador"
        mode="edit"
        maxWidth="md"
        saveLabel={busy ? 'Anulando…' : 'Confirmar anulación'}
        saveDisabled={busy || !motivoAnular.trim()}
        onSave={() => void handleAnular()}
      >
        <Textarea
          label="Motivo de anulación"
          value={motivoAnular}
          onChange={(e) => setMotivoAnular(e.target.value)}
          rows={3}
        />
      </FormDialog>

      <FormDialog
        open={dialog === 'nc'}
        onClose={() => setDialog(null)}
        title="Emitir nota de crédito"
        mode="edit"
        maxWidth="md"
        saveLabel={busy ? 'Emitiendo…' : 'Emitir NC'}
        saveDisabled={busy || !ncMotivo.trim() || ncMonto <= 0}
        onSave={() => void submitNc()}
      >
        <Input
          label="Monto"
          type="number"
          min={1}
          value={ncMonto}
          onChange={(e) => setNcMonto(Number(e.target.value))}
        />
        <Textarea
          label="Motivo"
          value={ncMotivo}
          onChange={(e) => setNcMotivo(e.target.value)}
        />
      </FormDialog>

      <FormDialog
        open={dialog === 'nc_detalle' && Boolean(ncSeleccionada)}
        onClose={() => {
          setDialog(null)
          setNcSeleccionada(null)
        }}
        title={ncSeleccionada ? `Nota de crédito ${ncSeleccionada.id}` : 'Nota de crédito'}
        subtitle={
          ncSeleccionada ? notaCreditoEstadoLabel(ncSeleccionada.estado) : undefined
        }
        mode="view"
        maxWidth="lg"
      >
        {ncSeleccionada && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <p>
                <span className="text-slate-500">Cliente:</span>{' '}
                {refLabel(ncSeleccionada.clienteId)}
              </p>
              <p>
                <span className="text-slate-500">Fecha:</span>{' '}
                {formatFecha(ncSeleccionada.fecha)}
              </p>
              <p>
                <span className="text-slate-500">Monto:</span> {formatDop(ncSeleccionada.monto)}
              </p>
              <p>
                <span className="text-slate-500">Disponible:</span>{' '}
                {formatDop(Math.max(0, ncSeleccionada.monto - ncSeleccionada.montoAplicado))}
              </p>
            </div>
            <p>
              <span className="text-slate-500">Motivo:</span> {ncSeleccionada.motivo}
            </p>
            <div>
              <p className="font-medium text-slate-800 mb-2">Aplicaciones</p>
              {ncSeleccionada.aplicaciones.length === 0 ? (
                <p className="text-slate-500">Sin aplicaciones.</p>
              ) : (
                <Table
                  keyField="fecha"
                  data={ncSeleccionada.aplicaciones}
                  columns={[
                    { key: 'ventaDestinoId', header: 'Factura destino' },
                    {
                      key: 'montoAplicado',
                      header: 'Monto',
                      render: (a) => formatDop(a.montoAplicado),
                    },
                    {
                      key: 'fecha',
                      header: 'Fecha',
                      render: (a) => formatFecha(a.fecha),
                    },
                  ]}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={() => imprimirNc(ncSeleccionada)}
              >
                Imprimir
              </Button>
              {(ncSeleccionada.estado === 'parcialmente_aplicada' ||
                ncSeleccionada.estado === 'aplicada') && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Undo2}
                  onClick={() => setNcConfirm('revertir')}
                >
                  Revertir aplicaciones
                </Button>
              )}
              {ncSeleccionada.estado === 'emitida' && ncSeleccionada.montoAplicado === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Ban}
                  onClick={() => setNcConfirm('anular')}
                >
                  Anular
                </Button>
              )}
            </div>
          </div>
        )}
      </FormDialog>

      <ConfirmDialog
        open={Boolean(ncConfirm && ncSeleccionada)}
        onClose={() => setNcConfirm(null)}
        onConfirm={() => void confirmarNcAccion()}
        title={ncConfirm === 'anular' ? 'Anular nota de crédito' : 'Revertir aplicaciones'}
        message={
          ncConfirm === 'anular'
            ? `¿Anular ${ncSeleccionada?.id}? Solo es posible si no tiene aplicaciones.`
            : `¿Revertir todas las aplicaciones de ${ncSeleccionada?.id}? La NC quedará Disponible.`
        }
        confirmLabel={ncConfirm === 'anular' ? 'Anular NC' : 'Revertir'}
        variant={ncConfirm === 'anular' ? 'danger' : 'warning'}
      />

      {busy && (
        <div className="pointer-events-none fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-corporate px-3 py-2 text-xs text-white shadow-lg">
          <Loader2 size={14} className="animate-spin" /> Procesando…
        </div>
      )}
    </>
  )
}
