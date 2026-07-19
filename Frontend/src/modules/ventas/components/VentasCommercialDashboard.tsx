import { useCallback, useEffect, useMemo, useState } from 'react'
import { DollarSign, Receipt, ShoppingBag, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import { VentasApiRequiredBanner } from './VentasApiRequiredBanner'
import { ventasApi, type VentaResumenDto } from '@/services/api/ventasApi'
import { formatDop } from '../utils/ventasUi'
import { getFriendlyErrorMessage } from '@/services/http'

function todayPrefix(): string {
  return new Date().toISOString().slice(0, 10)
}

/** KPIs comerciales del día. */
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
    const emitidas = rows.filter((r) => r.estado === 'emitida')
    const delDia = emitidas.filter((r) => r.fechaEmision.startsWith(day))
    const facturacion = delDia.reduce((s, r) => s + r.total, 0)
    const tickets = delDia.length
    const ticketPromedio = tickets ? Math.round(facturacion / tickets) : 0
    const conPostventa = emitidas.filter(
      (r) => r.tieneCambios || r.tieneNotasCredito,
    ).length
    return { facturacion, tickets, ticketPromedio, conPostventa, totalEmitidas: emitidas.length }
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
          title="Facturación del día"
          value={loading ? '…' : formatDop(kpis.facturacion)}
          icon={<DollarSign size={22} />}
        />
        <StatCard
          title="Tickets del día"
          value={loading ? '…' : String(kpis.tickets)}
          icon={<Receipt size={22} />}
        />
        <StatCard
          title="Ticket promedio"
          value={loading ? '…' : formatDop(kpis.ticketPromedio)}
          icon={<TrendingUp size={22} />}
        />
        <StatCard
          title="Facturas con postventa"
          value={loading ? '…' : String(kpis.conPostventa)}
          detail={loading ? undefined : `${kpis.totalEmitidas} emitidas`}
          icon={<ShoppingBag size={22} />}
        />
      </div>
    </div>
  )
}
