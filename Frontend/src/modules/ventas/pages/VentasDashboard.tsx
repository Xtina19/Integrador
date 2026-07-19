import { VentasCommercialDashboard } from '../components/VentasCommercialDashboard'

/** Dashboard de Ventas — solo KPIs (sin subtítulos narrativos). */
export function VentasDashboard() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-corporate">Ventas</h1>
      <VentasCommercialDashboard />
    </div>
  )
}
