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
import { formatDop } from '@/lib/money'
import type { SupplierInvoice } from '@/modules/compras/components/SupplierInvoiceRecordDialog'

/** Acumula facturas pagadas del mes más reciente con movimiento. */
function resolvePurchaseMonthStats(invoices: SupplierInvoice[]) {
  const paid = invoices.filter((i) => i.status === 'paid' && i.amount > 0)
  if (paid.length === 0) {
    return { total: 0, label: 'Sin pagos registrados' }
  }

  const latest = paid.reduce((best, i) => (i.date > best.date ? i : best), paid[0])
  const ref = new Date(latest.date)
  const month = ref.getMonth()
  const year = ref.getFullYear()

  const total = paid
    .filter((i) => {
      const d = new Date(i.date)
      return d.getMonth() === month && d.getFullYear() === year
    })
    .reduce((s, i) => s + i.amount, 0)

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

  const pendingCxp = useMemo(
    () =>
      state.supplierInvoices.filter(
        (i) => i.status !== 'paid' && String(i.documentEstado ?? '').toLowerCase() !== 'anulada',
      ),
    [state.supplierInvoices],
  )

  const stats = useMemo(() => {
    const period = resolvePurchaseMonthStats(state.supplierInvoices)
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
    state.supplierInvoices,
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
          detail={fromApi ? `Pagos ${stats.periodLabel}` : stats.periodLabel}
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

      {pendingCxp.length > 0 && (
        <Card>
          <CardHeader
            title="Cuentas por pagar"
            subtitle={`${pendingCxp.length} factura${pendingCxp.length === 1 ? '' : 's'} pendiente${pendingCxp.length === 1 ? '' : 's'} de pago`}
            action={
              <Button size="sm" variant="outline" onClick={() => navigate('/compras/cuentas-por-pagar')}>
                Consultar
              </Button>
            }
          />
        </Card>
      )}

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
                  key: 'items',
                  header: 'Unidades',
                  className: 'text-right',
                  render: (o) => <span className="font-semibold tabular-nums">{o.items}</span>,
                },
              ]}
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
