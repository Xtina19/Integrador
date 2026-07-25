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

export function ComprasDashboard() {
  const navigate = useNavigate()
  const { state, comprasReady } = useERP()
  const fromApi = comprasApi.isEnabled()

  const openOrders = useMemo(
    () => state.purchaseOrders.filter((o) => !['received', 'cancelled', 'finalized'].includes(o.status)),
    [state.purchaseOrders]
  )

  const stats = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    const monthly = state.purchaseOrders
      .filter((o) => {
        const d = new Date(o.date)
        return d.getMonth() === month && d.getFullYear() === year && o.status !== 'cancelled'
      })
      .reduce((s, o) => s + o.total, 0)
    return {
      monthlyPurchases: monthly + (state.monthlyPurchasesExtra || 0),
      openOrders: openOrders.length,
      pendingReceptions: state.receptions.filter((r) => r.status === 'pending').length,
      activeSuppliers: new Set(state.purchaseOrders.map((o) => o.supplier)).size,
    }
  }, [state.purchaseOrders, state.receptions, state.monthlyPurchasesExtra, openOrders.length])

  return (
    <div className="space-y-6">
      {fromApi && !comprasReady && (
        <p className="text-sm text-gray-500">Cargando datos de Compras…</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Compras del Mes"
          value={formatDop(stats.monthlyPurchases)}
          detail={fromApi ? 'Acumulado del mes' : 'Acumulado junio 2026'}
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
          detail="Con órdenes recientes"
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
