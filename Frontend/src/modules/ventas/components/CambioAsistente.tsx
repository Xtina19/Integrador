import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { POS_CATALOG } from '../data/posCatalog'
import type { FormaPagoDto, VentaDetalleDto, VentaLineaDto } from '@/services/api/ventasApi'
import { formatDop } from '../utils/ventasUi'

export type CompensacionCambioCliente = 'devolucion_dinero' | 'nota_credito'

export interface CambioAsistenteSubmit {
  lineasDevueltas: Array<{ productoId: string; cantidad: number }>
  lineasNuevas: Array<{ productoId: string; cantidad: number; precioUnitario: number }>
  compensacionCliente?: CompensacionCambioCliente
  pagoDiferencia?: {
    formaPago: FormaPagoDto
    monto: number
    montoEntregadoEfectivo?: number
  }
}

interface CambioAsistenteProps {
  venta: VentaDetalleDto
  busy?: boolean
  onCancel: () => void
  onSubmit: (payload: CambioAsistenteSubmit) => void
}

type Step = 1 | 2 | 3

interface DevLine {
  productoId: string
  cantidad: number
}

interface NewLine {
  productoId: string
  cantidad: number
}

function precioLineaFactura(linea: VentaLineaDto): number {
  return linea.precioUnitario
}

/**
 * Asistente guiado de cambio (CU-VEN-11).
 * La diferencia se calcula siempre; el cajero no la edita.
 */
export function CambioAsistente({ venta, busy, onCancel, onSubmit }: CambioAsistenteProps) {
  const [step, setStep] = useState<Step>(1)
  const [devueltas, setDevueltas] = useState<DevLine[]>([
    { productoId: venta.lineas[0]?.productoId ?? '', cantidad: 1 },
  ])
  const [nuevas, setNuevas] = useState<NewLine[]>([])
  const [soloDevolver, setSoloDevolver] = useState(false)
  const [compensacion, setCompensacion] = useState<CompensacionCambioCliente>('devolucion_dinero')
  const [formaPago, setFormaPago] = useState<FormaPagoDto>('efectivo')
  const [entregadoEfectivo, setEntregadoEfectivo] = useState<number | ''>('')

  const lineasDisponibles = venta.lineas

  const calculo = useMemo(() => {
    let valorDevuelto = 0
    const detalleDev: Array<{ titulo: string; cantidad: number; importe: number }> = []
    for (const d of devueltas) {
      if (!d.productoId || d.cantidad < 1) continue
      const origen = lineasDisponibles.find((l) => l.productoId === d.productoId)
      if (!origen) continue
      const importe = precioLineaFactura(origen) * d.cantidad
      valorDevuelto += importe
      detalleDev.push({
        titulo: origen.descripcionSnapshot,
        cantidad: d.cantidad,
        importe,
      })
    }

    let valorNuevo = 0
    const detalleNew: Array<{ titulo: string; cantidad: number; importe: number }> = []
    for (const n of nuevas) {
      if (!n.productoId || n.cantidad < 1) continue
      const cat = POS_CATALOG.find((p) => p.id === n.productoId)
      if (!cat) continue
      const importe = cat.precioSugerido * n.cantidad
      valorNuevo += importe
      detalleNew.push({ titulo: cat.titulo, cantidad: n.cantidad, importe })
    }

    const diferencia = valorNuevo - valorDevuelto
    return { valorDevuelto, valorNuevo, diferencia, detalleDev, detalleNew }
  }, [devueltas, nuevas, lineasDisponibles])

  const productOptions = lineasDisponibles.map((l) => ({
    value: l.productoId,
    label: `${l.descripcionSnapshot} — ${formatDop(l.precioUnitario)} (facturada)`,
  }))

  const catalogOptions = POS_CATALOG.map((p) => ({
    value: p.id,
    label: `${p.titulo} — ${formatDop(p.precioSugerido)}`,
  }))

  function canNextFrom1(): boolean {
    return (
      devueltas.length > 0 &&
      devueltas.every((d) => d.productoId && d.cantidad >= 1) &&
      calculo.detalleDev.length > 0
    )
  }

  function canNextFrom2(): boolean {
    if (soloDevolver) return true
    return (
      nuevas.length > 0 &&
      nuevas.every((n) => n.productoId && n.cantidad >= 1) &&
      calculo.detalleNew.length > 0
    )
  }

  function canConfirm(): boolean {
    if (calculo.diferencia > 0) {
      if (formaPago === 'efectivo') {
        const entregado =
          entregadoEfectivo === '' ? calculo.diferencia : Number(entregadoEfectivo)
        return entregado >= calculo.diferencia
      }
      return true
    }
    if (calculo.diferencia < 0) return Boolean(compensacion)
    return true
  }

  function handleConfirm() {
    const payload: CambioAsistenteSubmit = {
      lineasDevueltas: devueltas
        .filter((d) => d.productoId && d.cantidad >= 1)
        .map((d) => ({ productoId: d.productoId, cantidad: d.cantidad })),
      lineasNuevas: soloDevolver
        ? []
        : nuevas
            .filter((n) => n.productoId && n.cantidad >= 1)
            .map((n) => {
              const cat = POS_CATALOG.find((p) => p.id === n.productoId)!
              return {
                productoId: n.productoId,
                cantidad: n.cantidad,
                precioUnitario: cat.precioSugerido,
              }
            }),
    }
    if (calculo.diferencia > 0) {
      payload.pagoDiferencia = {
        formaPago,
        monto: calculo.diferencia,
        montoEntregadoEfectivo:
          formaPago === 'efectivo'
            ? entregadoEfectivo === ''
              ? calculo.diferencia
              : Number(entregadoEfectivo)
            : undefined,
      }
    } else if (calculo.diferencia < 0) {
      payload.compensacionCliente = compensacion
    }
    onSubmit(payload)
  }

  return (
    <Card>
      <CardHeader
        title="Asistente de cambio"
        subtitle="La diferencia se calcula automáticamente"
        action={
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Badge variant={step === 1 ? 'info' : 'neutral'}>1 Devolver</Badge>
            <Badge variant={step === 2 ? 'info' : 'neutral'}>2 Entregar</Badge>
            <Badge variant={step === 3 ? 'info' : 'neutral'}>3 Confirmar</Badge>
          </div>
        }
      />
      <CardBody className="space-y-5">
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Seleccione los productos de esta factura que el cliente devuelve.
            </p>
            {devueltas.map((row, idx) => (
              <div
                key={`dev-${idx}`}
                className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-3"
              >
                <Select
                  label="Producto a devolver"
                  options={productOptions}
                  value={row.productoId}
                  onChange={(e) => {
                    const next = [...devueltas]
                    next[idx] = { ...next[idx]!, productoId: e.target.value }
                    setDevueltas(next)
                  }}
                />
                <Input
                  label="Cantidad"
                  type="number"
                  min={1}
                  value={row.cantidad}
                  onChange={(e) => {
                    const next = [...devueltas]
                    next[idx] = { ...next[idx]!, cantidad: Number(e.target.value) || 1 }
                    setDevueltas(next)
                  }}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={devueltas.length <= 1}
                    onClick={() => setDevueltas(devueltas.filter((_, i) => i !== idx))}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setDevueltas([
                  ...devueltas,
                  { productoId: lineasDisponibles[0]?.productoId ?? '', cantidad: 1 },
                ])
              }
            >
              Agregar línea a devolver
            </Button>
            <p className="text-sm font-medium text-slate-800">
              Valor devuelto (calculado):{' '}
              <span className="tabular-nums text-corporate">
                {formatDop(calculo.valorDevuelto)}
              </span>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Seleccione los productos que se entregan al cliente, o indique que solo devuelve
              mercancía (sin producto de salida).
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={soloDevolver}
                onChange={(e) => {
                  const checked = e.target.checked
                  setSoloDevolver(checked)
                  if (checked) setNuevas([])
                  else if (nuevas.length === 0) {
                    setNuevas([{ productoId: POS_CATALOG[0]?.id ?? '', cantidad: 1 }])
                  }
                }}
              />
              Solo devolver mercancía (sin entregar otro producto)
            </label>
            {!soloDevolver && (
              <>
                {nuevas.map((row, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-3"
                  >
                    <Select
                      label="Producto nuevo"
                      options={catalogOptions}
                      value={row.productoId}
                      onChange={(e) => {
                        const next = [...nuevas]
                        next[idx] = { ...next[idx]!, productoId: e.target.value }
                        setNuevas(next)
                      }}
                    />
                    <Input
                      label="Cantidad"
                      type="number"
                      min={1}
                      value={row.cantidad}
                      onChange={(e) => {
                        const next = [...nuevas]
                        next[idx] = { ...next[idx]!, cantidad: Number(e.target.value) || 1 }
                        setNuevas(next)
                      }}
                    />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={nuevas.length <= 1}
                        onClick={() => setNuevas(nuevas.filter((_, i) => i !== idx))}
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setNuevas([...nuevas, { productoId: POS_CATALOG[0]?.id ?? '', cantidad: 1 }])
                  }
                >
                  Agregar producto nuevo
                </Button>
              </>
            )}
            <p className="text-sm font-medium text-slate-800">
              Valor nuevo (calculado):{' '}
              <span className="tabular-nums text-corporate">{formatDop(calculo.valorNuevo)}</span>
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Valor devuelto</p>
                <p className="text-lg font-bold tabular-nums">{formatDop(calculo.valorDevuelto)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Valor nuevo</p>
                <p className="text-lg font-bold tabular-nums">{formatDop(calculo.valorNuevo)}</p>
              </div>
              <div className="rounded-lg border border-corporate/30 bg-white px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Diferencia</p>
                <p
                  className={`text-lg font-bold tabular-nums ${
                    calculo.diferencia > 0
                      ? 'text-corporate'
                      : calculo.diferencia < 0
                        ? 'text-amber-700'
                        : 'text-slate-800'
                  }`}
                >
                  {calculo.diferencia === 0
                    ? formatDop(0)
                    : calculo.diferencia > 0
                      ? `+${formatDop(calculo.diferencia)} (cobrar)`
                      : `−${formatDop(Math.abs(calculo.diferencia))} (a favor cliente)`}
                </p>
              </div>
            </div>

            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-800">Devuelve</p>
              <ul className="mt-1 list-inside list-disc">
                {calculo.detalleDev.map((d, i) => (
                  <li key={`dd-${i}`}>
                    {d.titulo} ×{d.cantidad} — {formatDop(d.importe)}
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-medium text-slate-800">Entrega</p>
              {calculo.detalleNew.length === 0 ? (
                <p className="mt-1 text-sm text-amber-800">Sin producto de salida (solo devolución física).</p>
              ) : (
                <ul className="mt-1 list-inside list-disc">
                  {calculo.detalleNew.map((d, i) => (
                    <li key={`dn-${i}`}>
                      {d.titulo} ×{d.cantidad} — {formatDop(d.importe)}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {calculo.diferencia > 0 && (
              <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-800">
                  Cobrar únicamente la diferencia ({formatDop(calculo.diferencia)})
                </p>
                <Select
                  label="Forma de pago"
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value as FormaPagoDto)}
                  options={[
                    { value: 'efectivo', label: 'Efectivo' },
                    { value: 'tarjeta', label: 'Tarjeta' },
                    { value: 'transferencia', label: 'Transferencia' },
                  ]}
                />
                {formaPago === 'efectivo' && (
                  <Input
                    label="Efectivo entregado por el cliente"
                    type="number"
                    min={calculo.diferencia}
                    value={entregadoEfectivo === '' ? calculo.diferencia : entregadoEfectivo}
                    onChange={(e) =>
                      setEntregadoEfectivo(e.target.value === '' ? '' : Number(e.target.value))
                    }
                  />
                )}
                <p className="text-xs text-slate-500">
                  El monto del pago queda fijado en {formatDop(calculo.diferencia)}; no es editable.
                </p>
              </div>
            )}

            {calculo.diferencia < 0 && (
              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <p className="text-sm font-medium text-amber-900">
                  Diferencia a favor del cliente ({formatDop(Math.abs(calculo.diferencia))})
                </p>
                <Select
                  label="Compensación"
                  value={compensacion}
                  onChange={(e) =>
                    setCompensacion(e.target.value as CompensacionCambioCliente)
                  }
                  options={[
                    { value: 'devolucion_dinero', label: 'Devolver efectivo en caja' },
                    {
                      value: 'nota_credito',
                      label: 'Preparar nota de crédito (emisión en Fase 3)',
                    },
                  ]}
                />
              </div>
            )}

            {calculo.diferencia === 0 && (
              <p className="text-sm text-slate-600">
                Cambio sin diferencia monetaria. Solo se actualizará el expediente y se
                solicitará el efecto de inventario.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          <div className="flex flex-wrap gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={ArrowLeft}
                disabled={busy}
                onClick={() => setStep((step - 1) as Step)}
              >
                Atrás
              </Button>
            )}
            {step < 3 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={ArrowRight}
                disabled={busy || (step === 1 ? !canNextFrom1() : !canNextFrom2())}
                onClick={() => setStep((step + 1) as Step)}
              >
                Siguiente
              </Button>
            )}
            {step === 3 && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={Check}
                disabled={busy || !canConfirm()}
                onClick={handleConfirm}
              >
                {busy ? 'Registrando…' : 'Confirmar cambio'}
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
