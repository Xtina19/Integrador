import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, PackageCheck, Truck, DollarSign } from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { purchaseStatusMap } from '@/modules/compras/constants/comprasUi'
import { useERP } from '@/store/ERPProvider'
import { comprasApi } from '@/services/api/comprasApi'
import { formatDop, formatMoney } from '@/lib/money'
import type { PurchaseOrder } from '@/types/domain'

/** Usa el mes más reciente con órdenes registradas (evita RD$0 cuando la BD no coincide con el mes calendario). */
function resolvePurchaseMonthStats(orders: PurchaseOrder[]) {
  const active = orders.filter((o) => o.status !== 'cancelled')
  if (active.length === 0) {
    return { total: 0, label: 'Sin órdenes registradas' }
  }

  const latest = active.reduce((best, o) => (o.date > best.date ? o : best), active[0])
  const ref = new Date(latest.date)
  const month = ref.getMonth()
  const year = ref.getFullYear()

  const total = active
    .filter((o) => {
      const d = new Date(o.date)
      return d.getMonth() === month && d.getFullYear() === year
    })
    .reduce((s, o) => s + o.total, 0)

  const label = ref.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })
  return { total, label }
}

export function ComprasDashboard() {
  const navigate = useNavigate()
  const { state, comprasReady } = useERP()
  const fromApi = comprasApi.isEnabled()

  const openOrders = useMemo(
    () => state.purchaseOrders.filter((o) => !['received', 'cancelled', 'finalized'].includes(o.status)),
    [state.purchaseOrders]
  )

  const stats = useMemo(() => {
    const period = resolvePurchaseMonthStats(state.purchaseOrders)
    const extra = fromApi ? 0 : state.monthlyPurchasesExtra || 0

    return {
      monthlyPurchases: period.total + extra,
      periodLabel: period.label,
      openOrders: openOrders.length,
      pendingReceptions: state.receptions.filter((r) => r.status === 'pending').length,
      activeSuppliers: new Set(
        state.purchaseOrders.filter((o) => o.status !== 'cancelled').map((o) => o.supplier)
      ).size,
    }
  }, [
    state.purchaseOrders,
    state.receptions,
    state.monthlyPurchasesExtra,
    openOrders.length,
    fromApi,
  ])

  return (
    <div className="space-y-6">
      {fromApi && !comprasReady && (
        <p className="text-sm text-gray-500">Cargando datos de Compras…</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Compras del Mes"
          value={formatDop(stats.monthlyPurchases)}
          detail={fromApi ? `Acumulado ${stats.periodLabel}` : stats.periodLabel}
          icon={<DollarSign size={22} />}
        />
        <StatCard
          title="Órdenes Abiertas"
          value={stats.openOrders}
          detail="Pendientes de recepción"
          icon={<ShoppingCart size={22} />}
        />
        <StatCard
          title="Recepciones Pendientes"
          value={stats.pendingReceptions}
          detail="Por confirmar"
          icon={<PackageCheck size={22} />}
        />
        <StatCard
          title="Proveedores Activos"
          value={stats.activeSuppliers}
          detail="Con órdenes registradas"
          icon={<Truck size={22} />}
        />
      </div>

      {openOrders.length > 0 && (
        <Card>
          <CardHeader
            title="Órdenes Abiertas"
            subtitle="Requieren seguimiento"
            action={
              <Button size="sm" variant="outline" onClick={() => navigate('/compras/ordenes')}>
                Ver todas
              </Button>
            }
          />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={openOrders.slice(0, 5)}
              columns={[
                { key: 'id', header: 'Orden', render: (o) => <span className="font-mono text-xs text-corporate">{o.id}</span> },
                { key: 'supplier', header: 'Proveedor', render: (o) => <span className="font-medium">{o.supplier}</span> },
                { key: 'date', header: 'Fecha', className: 'text-sm' },
                {
                  key: 'status',
                  header: 'Estado',
                  render: (o) => {
                    const meta = purchaseStatusMap[o.status] ?? { label: o.status, variant: 'default' as const }
                    return <Badge variant={meta.variant}>{meta.label}</Badge>
                  },
                },
                {
                  key: 'total',
                  header: 'Total',
                  className: 'text-right',
                  render: (o) => (
                    <span className="font-semibold text-corporate tabular-nums">
                      {formatMoney(o.total, o.currency)}
                    </span>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
