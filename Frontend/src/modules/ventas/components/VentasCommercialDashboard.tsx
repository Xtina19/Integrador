import { useCallback, useEffect, useMemo, useState } from 'react'
import { DollarSign, Receipt, ShoppingBag, TrendingUp, Users, Store } from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import { VentasApiRequiredBanner } from './VentasApiRequiredBanner'
import { ventasApi, type VentaResumenDto } from '@/services/api/ventasApi'
import { formatDop, formatMoney, refLabel } from '../utils/ventasUi'
import { roundMoney } from '@/lib/money'
import { getFriendlyErrorMessage } from '@/services/http'

function todayPrefix(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthPrefix(): string {
  return todayPrefix().slice(0, 7)
}

/** KPIs comerciales realistas (sin textos técnicos). */
export function VentasCommercialDashboard() {
  const [rows, setRows] = useState<VentaResumenDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!ventasApi.isEnabled()) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await ventasApi.listar({ limit: 500 })
      setRows(data)
    } catch (e) {
      setError(getFriendlyErrorMessage(e))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const kpis = useMemo(() => {
    const day = todayPrefix()
    const month = monthPrefix()
    const emitidas = rows.filter((r) => r.estado === 'emitida')
    const delDia = emitidas.filter((r) => r.fechaEmision.slice(0, 10) === day)
    const delMes = emitidas.filter((r) => r.fechaEmision.slice(0, 7) === month)

    const ventasHoy = delDia.reduce((s, r) => s + r.total, 0)
    const ventasMes = delMes.reduce((s, r) => s + r.total, 0)
    const ticketsHoy = delDia.length
    const ticketPromedio = ticketsHoy ? roundMoney(ventasHoy / ticketsHoy) : 0

    const clientesAtendidos = new Set(
      delMes.map((r) => r.clienteId || 'mostrador').filter(Boolean),
    ).size

    const porSucursal = new Map<string, number>()
    for (const r of delMes) {
      const key = refLabel(r.sucursalId, r.sucursalId)
      porSucursal.set(key, (porSucursal.get(key) ?? 0) + r.total)
    }
    const topSucursal = [...porSucursal.entries()].sort((a, b) => b[1] - a[1])[0]

    const porMoneda = new Map<string, number>()
    for (const r of delMes) {
      const m = (r.moneda || 'DOP').toUpperCase()
      porMoneda.set(m, (porMoneda.get(m) ?? 0) + r.total)
    }

    return {
      ventasHoy,
      ventasMes,
      ticketsHoy,
      ticketPromedio,
      clientesAtendidos,
      topSucursalLabel: topSucursal ? topSucursal[0] : '—',
      topSucursalMonto: topSucursal ? topSucursal[1] : 0,
      porMoneda: [...porMoneda.entries()],
      totalEmitidasMes: delMes.length,
    }
  }, [rows])

  if (!ventasApi.isEnabled()) return <VentasApiRequiredBanner />

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Ventas hoy"
          value={loading ? '…' : formatDop(kpis.ventasHoy)}
          detail={loading ? undefined : `${kpis.ticketsHoy} tickets`}
          icon={<DollarSign size={22} />}
        />
        <StatCard
          title="Ventas del mes"
          value={loading ? '…' : formatDop(kpis.ventasMes)}
          detail={loading ? undefined : `${kpis.totalEmitidasMes} facturas`}
          icon={<ShoppingBag size={22} />}
        />
        <StatCard
          title="Ticket promedio"
          value={loading ? '…' : formatDop(kpis.ticketPromedio)}
          detail="Promedio del día"
          icon={<TrendingUp size={22} />}
        />
        <StatCard
          title="Clientes atendidos"
          value={loading ? '…' : String(kpis.clientesAtendidos)}
          detail="En el mes"
          icon={<Users size={22} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Ventas por sucursal"
          value={loading ? '…' : kpis.topSucursalLabel}
          detail={
            loading ? undefined : `Lidera el mes · ${formatDop(kpis.topSucursalMonto)}`
          }
          icon={<Store size={22} />}
        />
        <StatCard
          title="Ventas por moneda"
          value={
            loading
              ? '…'
              : kpis.porMoneda.length
                ? kpis.porMoneda
                    .map(([m, t]) => formatMoney(t, m))
                    .join(' · ')
                : formatDop(0)
          }
          detail="Acumulado del mes"
          icon={<Receipt size={22} />}
        />
      </div>
    </div>
  )
}
