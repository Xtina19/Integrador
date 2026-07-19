import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Plus, Minus, Trash2, CreditCard, BookOpen, User, UserPlus } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/context/ToastContext'
import { useClientesCatalog } from '@/context/ClientesCatalogContext'
import { VentasApiRequiredBanner } from '../components/VentasApiRequiredBanner'
import { POS_CATALOG, POS_DEFAULTS } from '../data/posCatalog'
import {
  ventasApi,
  type FormaPagoDto,
  type NotaCreditoDisponibleDto,
  type TipoVentaDto,
} from '@/services/api/ventasApi'
import { formatDop, newIdempotencyKey } from '../utils/ventasUi'
import { getFriendlyErrorMessage } from '@/services/http'

interface CartLine {
  productId: string
  qty: number
  discountPct: number
}

type FormaPagoReal = Exclude<FormaPagoDto, 'nota_credito'>

interface PayLine {
  formaPago: FormaPagoReal
  monto: number
}

/** Crédito comercial aplicado a la venta (no es forma de pago). */
interface NcAplicadaLine {
  nc: NotaCreditoDisponibleDto
  montoAplicado: number
}

/** Distribuye el total de la venta entre NCs (greedy) y calcula montos aplicados. */
function buildNcAplicadas(
  total: number,
  ncs: NotaCreditoDisponibleDto[],
): NcAplicadaLine[] {
  let restante = Math.max(0, Math.round(total))
  const lines: NcAplicadaLine[] = []
  for (const nc of ncs) {
    if (restante <= 0) break
    const usar = Math.min(Math.round(nc.saldoPendiente), restante)
    if (usar <= 0) continue
    lines.push({ nc, montoAplicado: usar })
    restante -= usar
  }
  return lines
}

export function POSPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { showSuccess, showError } = useToast()
  const { buscarActivos, getById } = useClientesCatalog()
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [tipoVenta, setTipoVenta] = useState<TipoVentaDto>('consumidor_final')
  const [clienteId, setClienteId] = useState('')
  const [clienteQuery, setClienteQuery] = useState('')
  const [clientes, setClientes] = useState<Array<{ id: string; nombre: string }>>([])
  const [pagos, setPagos] = useState<PayLine[]>([{ formaPago: 'efectivo', monto: 0 }])
  const [submitting, setSubmitting] = useState(false)
  const [ncDialog, setNcDialog] = useState(false)
  const [ncDisponibles, setNcDisponibles] = useState<NotaCreditoDisponibleDto[]>([])
  /** NCs elegidas para aplicar como crédito a la venta (antes de Pagos). */
  const [ncSeleccionIds, setNcSeleccionIds] = useState<string[]>([])
  const [ncPickerId, setNcPickerId] = useState('')

  async function detectarCreditoCliente(id: string, options?: { prompt?: boolean }) {
    if (!id) {
      setNcDisponibles([])
      setNcSeleccionIds([])
      setNcPickerId('')
      setNcDialog(false)
      return
    }
    try {
      const rows = await ventasApi.listarNotasCreditoDisponibles(id)
      setNcDisponibles(rows)
      if (options?.prompt === false) return
      setNcSeleccionIds([])
      if (rows.length > 0) setNcDialog(true)
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    }
  }

  useEffect(() => {
    const fromAlta = searchParams.get('clienteId')
    if (!fromAlta) return
    const cliente = getById(fromAlta)
    if (cliente && cliente.estado === 'activo') {
      setTipoVenta('cliente_registrado')
      setClienteId(cliente.id)
      setClienteQuery(cliente.nombre)
      setClientes([{ id: cliente.id, nombre: cliente.nombre }])
      showSuccess(`Cliente ${cliente.codigo} seleccionado`)
      void detectarCreditoCliente(cliente.id)
    }
    const next = new URLSearchParams(searchParams)
    next.delete('clienteId')
    setSearchParams(next, { replace: true })
  }, [searchParams, getById, setSearchParams, showSuccess])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return POS_CATALOG
    return POS_CATALOG.filter(
      (p) => p.titulo.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    )
  }, [search])

  const cartDetails = useMemo(() => {
    return cart
      .map((line) => {
        const product = POS_CATALOG.find((p) => p.id === line.productId)
        if (!product) return null
        const bruto = product.precioSugerido * line.qty
        const desc = Math.round((bruto * line.discountPct) / 100)
        return {
          ...line,
          product,
          bruto,
          desc,
          neto: bruto - desc,
        }
      })
      .filter(Boolean) as Array<
      CartLine & {
        product: (typeof POS_CATALOG)[0]
        bruto: number
        desc: number
        neto: number
      }
    >
  }, [cart])

  const totalEstimado = cartDetails.reduce((s, l) => s + l.neto, 0)

  const ncSeleccionadas = useMemo(
    () => ncDisponibles.filter((n) => ncSeleccionIds.includes(n.id)),
    [ncDisponibles, ncSeleccionIds],
  )

  const ncAplicadas = useMemo(
    () => buildNcAplicadas(totalEstimado, ncSeleccionadas),
    [totalEstimado, ncSeleccionadas],
  )

  const totalNcAplicado = ncAplicadas.reduce((s, l) => s + l.montoAplicado, 0)
  const saldoPendientePago = Math.max(0, Math.round(totalEstimado) - totalNcAplicado)
  const totalPagos = pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0)

  useEffect(() => {
    if (pagos.length !== 1 || saldoPendientePago < 0) return
    setPagos((prev) => {
      if (prev.length !== 1) return prev
      if (prev[0].monto === saldoPendientePago) return prev
      return [{ ...prev[0], monto: saldoPendientePago }]
    })
  }, [saldoPendientePago, pagos.length])

  function addToCart(productId: string) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, qty: i.qty + 1 } : i,
        )
      }
      return [...prev, { productId, qty: 1, discountPct: 0 }]
    })
  }

  function buscarClientes() {
    const texto = clienteQuery.trim()
    if (!texto) return
    const rows = buscarActivos(texto)
    setClientes(rows.map((c) => ({ id: c.id, nombre: `${c.codigo} — ${c.nombre}` })))
    if (rows.length === 0) {
      showError('No se encontraron clientes activos. Use Registrar cliente.')
    }
  }

  function irAltaRapida() {
    navigate(`/administracion/clientes/alta-rapida?returnTo=${encodeURIComponent('/ventas/pos')}`)
  }

  function onCambiarFormaPago(idx: number, v: FormaPagoReal) {
    setPagos((prev) => prev.map((row, i) => (i === idx ? { ...row, formaPago: v } : row)))
  }

  function agregarNcSeleccionada(ncId: string) {
    if (!ncId) return
    if (tipoVenta !== 'cliente_registrado' || !clienteId) {
      showError('Seleccione un cliente registrado para aplicar una nota de crédito.')
      return
    }
    setNcSeleccionIds((prev) => (prev.includes(ncId) ? prev : [...prev, ncId]))
    setNcPickerId('')
  }

  function quitarNcSeleccionada(ncId: string) {
    setNcSeleccionIds((prev) => prev.filter((id) => id !== ncId))
  }

  function onSeleccionarCliente(id: string) {
    setClienteId(id)
    void detectarCreditoCliente(id)
  }

  function aceptarAplicarNc() {
    setNcSeleccionIds(ncDisponibles.map((n) => n.id))
    setNcDialog(false)
    const totalCredito = ncDisponibles.reduce((s, n) => s + n.saldoPendiente, 0)
    showSuccess(`Crédito disponible listo para aplicar (hasta ${formatDop(totalCredito)}).`)
  }

  function rechazarAplicarNc() {
    setNcSeleccionIds([])
    setNcDialog(false)
    setPagos([{ formaPago: 'efectivo', monto: Math.round(totalEstimado) || 0 }])
  }

  async function emitir(mode: 'auto' | 'pago' | 'mixto') {
    if (!ventasApi.isEnabled()) return
    if (cartDetails.length === 0) {
      showError('Agregue al menos un producto.')
      return
    }
    if (tipoVenta === 'cliente_registrado' && !clienteId) {
      showError('Seleccione un cliente registrado.')
      return
    }

    const pagosNc = ncAplicadas.map((l) => ({
      formaPago: 'nota_credito' as const,
      monto: l.montoAplicado,
      notaCreditoId: l.nc.id,
    }))
    const pagosReales = pagos.filter((p) => p.monto > 0)
    const activePagos = [...pagosNc, ...pagosReales]

    if (activePagos.length === 0) {
      showError('Indique al menos un pago o aplique una nota de crédito.')
      return
    }

    const sumaCubre = activePagos.reduce((s, p) => s + Math.round(p.monto), 0)
    if (sumaCubre !== Math.round(totalEstimado)) {
      showError(
        `La suma de crédito aplicado y pagos (${formatDop(sumaCubre)}) debe igualar el total (${formatDop(totalEstimado)}).`,
      )
      return
    }

    const hasNc = pagosNc.length > 0
    const hasOther = pagosReales.length > 0
    let resolvedMode = mode
    if (hasNc && hasOther) resolvedMode = 'mixto'
    else if (hasNc && !hasOther) resolvedMode = 'pago'
    else if (mode === 'pago' && pagosReales.length !== 1) {
      showError('Registrar pago requiere exactamente un medio de pago (además del crédito NC si aplica).')
      return
    } else if (mode === 'mixto' && pagosReales.length + (hasNc ? 1 : 0) < 2) {
      showError('Pago mixto requiere al menos dos conceptos (NC + pago, o dos formas de pago).')
      return
    }

    if (tipoVenta === 'cliente_registrado' && clienteId) {
      const cliente = getById(clienteId)
      if (!cliente || cliente.estado !== 'activo') {
        showError('Seleccione un cliente activo del maestro.')
        return
      }
    }

    const payload = {
      tipoVenta,
      clienteId: tipoVenta === 'cliente_registrado' ? clienteId : undefined,
      clienteSnapshot:
        tipoVenta === 'cliente_registrado' && clienteId
          ? (() => {
              const c = getById(clienteId)!
              return { nombre: c.nombre, activo: c.estado === 'activo' }
            })()
          : undefined,
      sucursalId: POS_DEFAULTS.sucursalId,
      almacenId: POS_DEFAULTS.almacenId,
      moneda: POS_DEFAULTS.moneda,
      lineas: cartDetails.map((l) => ({
        productoId: l.productId,
        cantidad: l.qty,
        precioUnitario: l.product.precioSugerido,
        descuentoPorcentaje: l.discountPct > 0 ? l.discountPct : undefined,
      })),
      pagos: activePagos.map((p) =>
        p.formaPago === 'nota_credito'
          ? {
              formaPago: p.formaPago,
              monto: Math.round(p.monto),
              notaCreditoId: p.notaCreditoId.trim(),
            }
          : {
              formaPago: p.formaPago,
              monto: Math.round(p.monto),
              montoEntregadoEfectivo:
                p.formaPago === 'efectivo' ? Math.round(p.monto) : undefined,
            },
      ),
      idempotencyKey: newIdempotencyKey('pos'),
    }

    setSubmitting(true)
    try {
      const venta =
        resolvedMode === 'mixto'
          ? await ventasApi.emitirPagoMixto(payload)
          : resolvedMode === 'pago'
            ? await ventasApi.emitirConPago(payload)
            : await ventasApi.emitir(payload)
      showSuccess(`Factura ${venta.numeroFactura} emitida.`)
      setCart([])
      setPagos([{ formaPago: 'efectivo', monto: 0 }])
      setNcSeleccionIds([])
      setNcDisponibles([])
      setNcPickerId('')
      navigate(`/ventas/facturas/${venta.id}`)
    } catch (e) {
      showError(getFriendlyErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (!ventasApi.isEnabled()) return <VentasApiRequiredBanner />

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-corporate">Punto de Venta</h1>

      <div className="grid min-h-[calc(100vh-14rem)] grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <Card>
            <CardHeader title="Catálogo" />
            <CardBody className="space-y-4">
              <Input
                icon={Search}
                placeholder="Buscar producto…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p.id)}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-corporate/40 hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-corporate/10 text-corporate">
                      <BookOpen size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{p.titulo}</p>
                      <p className="mt-1 text-sm font-semibold text-corporate">
                        {formatDop(p.precioSugerido)}
                      </p>
                    </div>
                    <Plus size={16} className="mt-1 text-slate-400" />
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader title="Ticket" />
            <CardBody className="space-y-4">
              <Select
                label="Tipo de venta"
                value={tipoVenta}
                onChange={(e) => {
                  const next = e.target.value as TipoVentaDto
                  setTipoVenta(next)
                  if (next !== 'cliente_registrado') {
                    setClienteId('')
                    setNcSeleccionIds([])
                    setNcDisponibles([])
                    setNcPickerId('')
                    setNcDialog(false)
                  }
                }}
                options={[
                  { value: 'consumidor_final', label: 'Consumidor final' },
                  { value: 'cliente_registrado', label: 'Cliente registrado' },
                ]}
              />

              {tipoVenta === 'cliente_registrado' && (
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex gap-2">
                    <Input
                      icon={User}
                      placeholder="Buscar cliente…"
                      value={clienteQuery}
                      onChange={(e) => setClienteQuery(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={buscarClientes}>
                      Buscar
                    </Button>
                  </div>
                  {clientes.length > 0 && (
                    <Select
                      label="Cliente"
                      value={clienteId}
                      onChange={(e) => onSeleccionarCliente(e.target.value)}
                      options={[
                        { value: '', label: 'Seleccione…' },
                        ...clientes.map((c) => ({ value: c.id, label: c.nombre })),
                      ]}
                    />
                  )}
                  {ncAplicadas.length > 0 && (
                    <p className="text-xs text-emerald-700">
                      Crédito NC aplicado: {formatDop(totalNcAplicado)}. Pendiente de pago:{' '}
                      {formatDop(saldoPendientePago)}.
                    </p>
                  )}
                  <Button type="button" variant="outline" size="sm" icon={UserPlus} onClick={irAltaRapida}>
                    Registrar cliente
                  </Button>
                </div>
              )}

              {cartDetails.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Carrito vacío</p>
              ) : (
                <ul className="space-y-3">
                  {cartDetails.map((line) => (
                    <li
                      key={line.productId}
                      className="rounded-lg border border-slate-100 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{line.product.titulo}</p>
                          <p className="text-xs text-slate-500">{formatDop(line.product.precioSugerido)}</p>
                        </div>
                        <button
                          type="button"
                          className="text-slate-400 hover:text-red-600"
                          onClick={() =>
                            setCart((prev) => prev.filter((i) => i.productId !== line.productId))
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Minus}
                          onClick={() =>
                            setCart((prev) =>
                              prev
                                .map((i) =>
                                  i.productId === line.productId
                                    ? { ...i, qty: i.qty - 1 }
                                    : i,
                                )
                                .filter((i) => i.qty > 0),
                            )
                          }
                        >
                          {' '}
                        </Button>
                        <Badge variant="neutral">{line.qty}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Plus}
                          onClick={() =>
                            setCart((prev) =>
                              prev.map((i) =>
                                i.productId === line.productId ? { ...i, qty: i.qty + 1 } : i,
                              ),
                            )
                          }
                        >
                          {' '}
                        </Button>
                        <Input
                          className="w-20"
                          type="number"
                          min={0}
                          max={100}
                          value={line.discountPct}
                          onChange={(e) => {
                            const v = Math.min(100, Math.max(0, Number(e.target.value) || 0))
                            setCart((prev) =>
                              prev.map((i) =>
                                i.productId === line.productId ? { ...i, discountPct: v } : i,
                              ),
                            )
                          }}
                          aria-label="Descuento %"
                        />
                        <span className="text-xs text-slate-500">% desc.</span>
                        <span className="ml-auto text-sm font-semibold">{formatDop(line.neto)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-sm text-slate-500">Total</span>
                <span className="text-lg font-bold text-corporate">{formatDop(totalEstimado)}</span>
              </div>
            </CardBody>
          </Card>

          {tipoVenta === 'cliente_registrado' && clienteId && (
            <Card>
              <CardHeader title="Nota de Crédito" />
              <CardBody className="space-y-3">
                <p className="text-xs text-slate-500">
                  Crédito comercial aplicado a la venta. No es un medio de pago.
                </p>
                <Select
                  label="Seleccionar Nota de Crédito disponible"
                  value={ncPickerId}
                  onChange={(e) => {
                    const id = e.target.value
                    setNcPickerId(id)
                    agregarNcSeleccionada(id)
                  }}
                  options={[
                    { value: '', label: ncDisponibles.length ? 'Elegir NC…' : 'Sin NC disponibles' },
                    ...ncDisponibles
                      .filter((nc) => !ncSeleccionIds.includes(nc.id))
                      .map((nc) => ({
                        value: nc.id,
                        label: `${nc.id} · Factura ${nc.numeroFacturaOrigen} · Saldo ${formatDop(nc.saldoPendiente)}`,
                      })),
                  ]}
                />
                {ncAplicadas.length === 0 ? (
                  <p className="text-sm text-slate-500">Ninguna nota de crédito aplicada.</p>
                ) : (
                  <ul className="space-y-2">
                    {ncAplicadas.map(({ nc, montoAplicado }) => {
                      const saldoDisp = Math.round(nc.saldoPendiente)
                      const saldoRestanteNc = Math.max(0, saldoDisp - montoAplicado)
                      return (
                        <li
                          key={nc.id}
                          className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p className="font-medium text-slate-900">
                                NC {nc.id}
                                <span className="ml-2 text-xs font-normal text-slate-500">
                                  Factura {nc.numeroFacturaOrigen}
                                </span>
                              </p>
                              <p className="text-slate-600">
                                Saldo disponible:{' '}
                                <span className="font-semibold text-emerald-800">{formatDop(saldoDisp)}</span>
                              </p>
                              <p className="text-slate-600">
                                Monto aplicado:{' '}
                                <span className="font-semibold text-corporate">{formatDop(montoAplicado)}</span>
                              </p>
                              <p className="text-slate-600">
                                Saldo restante NC:{' '}
                                <span className="font-semibold">{formatDop(saldoRestanteNc)}</span>
                              </p>
                            </div>
                            <button
                              type="button"
                              className="text-slate-400 hover:text-red-600"
                              title="Quitar NC"
                              onClick={() => quitarNcSeleccionada(nc.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total venta</span>
                    <span className="font-medium">{formatDop(totalEstimado)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Crédito aplicado</span>
                    <span className="font-medium text-emerald-700">− {formatDop(totalNcAplicado)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Saldo pendiente de pago</span>
                    <span className="text-corporate">{formatDop(saldoPendientePago)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Pagos"
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPagos((prev) => [...prev, { formaPago: 'tarjeta', monto: 0 }])
                  }
                >
                  + Forma
                </Button>
              }
            />
            <CardBody className="space-y-3">
              {saldoPendientePago === 0 && ncAplicadas.length > 0 ? (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  El crédito de la nota cubre el total. No se requieren medios de pago adicionales.
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Cubra el saldo pendiente ({formatDop(saldoPendientePago)}) con efectivo, tarjeta o
                  transferencia.
                </p>
              )}
              {pagos.map((p, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-2">
                  <Select
                    label="Forma de pago"
                    value={p.formaPago}
                    onChange={(e) => onCambiarFormaPago(idx, e.target.value as FormaPagoReal)}
                    options={[
                      { value: 'efectivo', label: 'Efectivo' },
                      { value: 'tarjeta', label: 'Tarjeta' },
                      { value: 'transferencia', label: 'Transferencia' },
                    ]}
                  />
                  <Input
                    label="Monto"
                    type="number"
                    min={0}
                    value={p.monto || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0
                      setPagos((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, monto: v } : row)),
                      )
                    }}
                  />
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Suma pagos</span>
                <span className="font-medium">{formatDop(totalPagos)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Crédito NC + pagos</span>
                <span className="font-medium">{formatDop(totalNcAplicado + totalPagos)}</span>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  icon={CreditCard}
                  disabled={submitting}
                  onClick={() => void emitir('auto')}
                >
                  Emitir venta
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    disabled={submitting}
                    onClick={() => void emitir('pago')}
                  >
                    Registrar pago
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={submitting}
                    onClick={() => void emitir('mixto')}
                  >
                    Pago mixto
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  disabled={submitting}
                  onClick={() => {
                    setCart([])
                    setPagos([{ formaPago: 'efectivo', monto: 0 }])
                    setNcSeleccionIds([])
                    setNcPickerId('')
                  }}
                >
                  Limpiar ticket
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={ncDialog}
        onClose={rechazarAplicarNc}
        onConfirm={aceptarAplicarNc}
        title="Crédito disponible"
        message={`Este cliente posee crédito disponible${
          ncDisponibles.length
            ? ` (${formatDop(ncDisponibles.reduce((s, n) => s + n.saldoPendiente, 0))} en ${ncDisponibles.length} NC)`
            : ''
        }. ¿Desea aplicarlo a la venta?`}
        confirmLabel="Sí, aplicar"
        cancelLabel="No"
        variant="warning"
      />
    </div>
  )
}
