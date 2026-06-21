import {
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  Globe,
  CalendarDays,
} from 'lucide-react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { StatCard, Card, CardHeader, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { lowStockProducts, events, inventoryChartData, stockByCategory } from '../data/mockData'
import { salesStats } from '../data/salesMockData'
import { purchaseStats } from '../data/purchasesMockData'
import { importStats } from '../data/importsMockData'

const CATEGORY_ORDER = ['Literatura', 'Académico', 'Infantil', 'Cómics', 'Otros']

const categoryData = CATEGORY_ORDER.map((name) => {
  const item = stockByCategory.find((c) => c.name === name)!
  return item
})

const categoryTotal = categoryData.reduce((sum, c) => sum + c.value, 0)

function InventoryTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-6 text-sm">
            <span className="flex items-center gap-2 text-gray-700">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold text-gray-900 tabular-nums">
              {Number(entry.value).toLocaleString()} uds.
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoryTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload as (typeof categoryData)[0] & { percent: number }
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
      <p className="text-xs text-gray-500 mt-1">
        {item.value.toLocaleString()} uds. · {item.percent.toFixed(1)}%
      </p>
    </div>
  )
}

export function Dashboard() {
  const upcomingEvents = events.filter((e) => e.status === 'upcoming' || e.status === 'active').length
  const nextEvent = events.find((e) => e.status === 'upcoming' || e.status === 'active')

  const donutData = categoryData.map((cat) => ({
    ...cat,
    percent: (cat.value / categoryTotal) * 100,
  }))

  return (
    <div className="space-y-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Evolución de Inventario"
            subtitle="Almacén Central vs Sucursales — Últimos 6 meses"
          />
          <CardBody className="pt-2 pb-6">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={inventoryChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  width={48}
                />
                <Tooltip content={<InventoryTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingTop: 24, fontSize: 13 }}
                />
                <Line
                  type="monotone"
                  dataKey="central"
                  name="Almacén Central"
                  stroke="#1E2D86"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#1E2D86', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#1E2D86', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="sucursales"
                  name="Sucursales"
                  stroke="#F4D22E"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#F4D22E', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#F4D22E', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Stock por Categoría" subtitle="Distribución actual del inventario" />
          <CardBody className="pt-2">
            <div className="flex flex-col gap-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CategoryTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3 border-t border-gray-100 pt-4">
                {donutData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{cat.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">
                        {cat.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 tabular-nums">{cat.percent.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
