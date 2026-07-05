import { useNavigate } from 'react-router-dom'
import { ShoppingCart, PackageCheck, Truck, DollarSign } from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { purchaseStats, purchaseOrders, purchaseStatusMap } from '@/mocks/mockCompras'

export function ComprasDashboard() {
  const navigate = useNavigate()
  const openOrders = purchaseOrders.filter((o) => !['received', 'cancelled'].includes(o.status))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Compras del Mes"
          value={`RD$${purchaseStats.monthlyPurchases.toLocaleString()}`}
          detail="Acumulado junio 2026"
          icon={<DollarSign size={22} />}
        />
        <StatCard
          title="Órdenes Abiertas"
          value={purchaseStats.openOrders}
          detail="Pendientes de recepción"
          icon={<ShoppingCart size={22} />}
        />
        <StatCard
          title="Recepciones Pendientes"
          value={purchaseStats.pendingReceptions}
          detail="Por confirmar"
          icon={<PackageCheck size={22} />}
        />
        <StatCard
          title="Proveedores Activos"
          value={purchaseStats.activeSuppliers}
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
                { key: 'items', header: 'Ítems', render: (o) => <span className="font-semibold">{o.items}</span> },
                { key: 'total', header: 'Total', render: (o) => <span className="font-semibold text-corporate">RD${o.total.toLocaleString()}</span> },
                {
                  key: 'status',
                  header: 'Estado',
                  render: (o) => {
                    const cfg = purchaseStatusMap[o.status]
                    return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  },
                },
              ]}
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
