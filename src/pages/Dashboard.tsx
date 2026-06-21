import {
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  Globe,
  CalendarDays,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { StatCard, Card, CardHeader, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { lowStockProducts, events } from '../data/mockData'
import { salesStats, monthlySales } from '../data/salesMockData'
import { purchaseStats, monthlyPurchases } from '../data/purchasesMockData'
import { importStats } from '../data/importsMockData'

export function Dashboard() {
  const upcomingEvents = events.filter((e) => e.status === 'upcoming' || e.status === 'active').length
  const nextEvent = events.find((e) => e.status === 'upcoming' || e.status === 'active')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          title="Ventas del Mes"
          value={`RD$${salesStats.monthlySales.toLocaleString()}`}
          detail={`Ticket prom. RD$${salesStats.avgTicket}`}
          icon={<TrendingUp size={22} />}
        />
        <StatCard
          title="Compras del Mes"
          value={`RD$${purchaseStats.monthlyPurchases.toLocaleString()}`}
          detail={`${purchaseStats.openOrders} órdenes abiertas`}
          icon={<ShoppingCart size={22} />}
        />
        <StatCard
          title="Stock Crítico"
          value={lowStockProducts.length}
          detail="Productos bajo mínimo"
          icon={<AlertTriangle size={22} />}
        />
        <StatCard
          title="Importaciones Activas"
          value={importStats.activeShipments}
          detail={`${importStats.boxesInTransit} cajas en tránsito`}
          icon={<Globe size={22} />}
        />
        <StatCard
          title="Eventos Próximos"
          value={upcomingEvents}
          detail={nextEvent ? nextEvent.name.slice(0, 28) : 'Sin eventos programados'}
          icon={<CalendarDays size={22} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Ventas Mensuales" subtitle="Últimos 6 meses — RD$" />
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [`RD$${value.toLocaleString()}`, 'Ventas']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                />
                <Legend />
                <Bar dataKey="sales" name="Ventas" fill="#1E2D86" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Compras Mensuales" subtitle="Últimos 6 meses — RD$" />
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyPurchases}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [`RD$${value.toLocaleString()}`, 'Compras']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                />
                <Legend />
                <Bar dataKey="purchases" name="Compras" fill="#F4D22E" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Productos con Stock Crítico" subtitle="Requieren reposición inmediata" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={lowStockProducts}
            columns={[
              { key: 'title', header: 'Producto', render: (p) => <span className="font-medium text-gray-900">{p.title}</span> },
              { key: 'isbn', header: 'ISBN', className: 'text-xs font-mono text-gray-500' },
              { key: 'stock', header: 'Stock', render: (p) => <Badge variant="danger">{p.stock} / {p.minStock}</Badge> },
              { key: 'branch', header: 'Sucursal' },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
