import { TrendingUp, DollarSign, Receipt, Award } from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { StatCard, Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import {
  salesStats,
  salesByBranch,
  monthlySales,
  topProducts,
} from '@/mocks/mockVentas'

export function VentasDashboard() {
  const topProduct = topProducts[0]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Ventas del Día"
          value={`$${salesStats.dailySales.toLocaleString()}`}
          detail={`${salesStats.dailyTransactions} transacciones`}
          icon={<TrendingUp size={22} />}
          trend={{ value: '+12% vs ayer', positive: true }}
        />
        <StatCard
          title="Ventas del Mes"
          value={`$${salesStats.monthlySales.toLocaleString()}`}
          detail="Acumulado junio 2026"
          icon={<DollarSign size={22} />}
          trend={{ value: '+8.4% vs mayo', positive: true }}
        />
        <StatCard
          title="Ticket Promedio"
          value={`$${salesStats.avgTicket.toLocaleString()}`}
          detail="Por transacción"
          icon={<Receipt size={22} />}
        />
        <StatCard
          title="Producto Top"
          value={topProduct.qty}
          detail={topProduct.title}
          icon={<Award size={22} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Ventas por Sucursal"
            subtitle="Acumulado del mes actual"
          />
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesByBranch} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
                />
                <Bar dataKey="sales" name="Ventas" fill="#1E2D86" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Evolución Mensual"
            subtitle="Ventas — últimos 6 meses"
          />
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlySales}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4D22E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F4D22E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Ventas"
                  stroke="#1E2D86"
                  fill="url(#colorVentas)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Productos Más Vendidos" subtitle="Top del mes" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={topProducts}
            columns={[
              { key: 'id', header: 'Código', className: 'text-xs font-mono text-gray-400' },
              {
                key: 'title',
                header: 'Producto',
                render: (p) => <span className="font-medium text-gray-900">{p.title}</span>,
              },
              {
                key: 'qty',
                header: 'Unidades',
                render: (p) => <Badge variant="gold">{p.qty}</Badge>,
              },
              {
                key: 'revenue',
                header: 'Ingresos',
                render: (p) => (
                  <span className="font-semibold text-corporate">${p.revenue.toLocaleString()}</span>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
