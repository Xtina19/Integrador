import {
  Package,
  Store,
  AlertTriangle,
  TrendingUp,
  Truck,
  BookOpen,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import { StatCard, Card, CardHeader, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import {
  branches,
  inventoryChartData,
  stockByCategory,
  lowStockProducts,
  recentSales,
  logisticsAlerts,
} from '../data/mockData'

const alertIcons: Record<string, string> = {
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-red-100 text-red-600',
  info: 'bg-blue-100 text-blue-600',
}

export function Dashboard() {
  const totalProducts = 12470
  const totalStock = branches.reduce((sum, b) => sum + b.stock, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total de Productos"
          value={totalProducts.toLocaleString()}
          detail="Catálogo activo"
          icon={<BookOpen size={22} />}
          trend={{ value: '+3.2% este mes', positive: true }}
        />
        <StatCard
          title="Inventario Total"
          value={totalStock.toLocaleString()}
          detail="Unidades en sistema"
          icon={<Package size={22} />}
          trend={{ value: '+1.8% vs mes anterior', positive: true }}
        />
        <StatCard
          title="Bajo Stock"
          value={lowStockProducts.length}
          detail="Requieren reposición"
          icon={<AlertTriangle size={22} />}
        />
        <StatCard
          title="Ventas Hoy"
          value="$12,450"
          detail="42 transacciones"
          icon={<TrendingUp size={22} />}
          trend={{ value: '+12% vs ayer', positive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Evolución de Inventario" subtitle="Almacén central vs sucursales — últimos 6 meses" />
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={inventoryChartData}>
                <defs>
                  <linearGradient id="colorCentral" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E2D86" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1E2D86" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSuc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4D22E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F4D22E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                />
                <Legend />
                <Area type="monotone" dataKey="central" name="Almacén Central" stroke="#1E2D86" fill="url(#colorCentral)" strokeWidth={2} />
                <Area type="monotone" dataKey="sucursales" name="Sucursales" stroke="#F4D22E" fill="url(#colorSuc)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Stock por Categoría" subtitle="Distribución actual" />
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stockByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stockByCategory.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {stockByCategory.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-600 truncate">{cat.name}</span>
                  <span className="font-medium text-gray-900 ml-auto">{cat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Inventario por Sucursal"
            subtitle="Stock actual por ubicación"
            action={<Store size={18} className="text-corporate" />}
          />
          <CardBody className="!p-0">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={branches} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} stroke="#9ca3af" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                <Bar dataKey="stock" name="Unidades" fill="#1E2D86" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Alertas Logísticas" subtitle="Notificaciones del sistema" />
          <CardBody className="space-y-3">
            {logisticsAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface">
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${alertIcons[alert.type]}`}>
                  {alert.type === 'danger' ? <AlertTriangle size={16} /> : alert.type === 'info' ? <Truck size={16} /> : <AlertTriangle size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{alert.time}</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Productos con Bajo Stock" subtitle="Por debajo del mínimo configurado" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={lowStockProducts}
              columns={[
                { key: 'title', header: 'Producto', render: (p) => <span className="font-medium text-gray-900">{p.title}</span> },
                { key: 'stock', header: 'Stock', render: (p) => <Badge variant="danger">{p.stock} / {p.minStock}</Badge> },
                { key: 'branch', header: 'Sucursal' },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Ventas Recientes" subtitle="Últimas transacciones" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={recentSales}
              columns={[
                { key: 'id', header: 'ID', className: 'text-xs text-gray-400' },
                { key: 'product', header: 'Producto', render: (s) => <span className="font-medium">{s.product}</span> },
                { key: 'branch', header: 'Sucursal' },
                { key: 'total', header: 'Total', render: (s) => <span className="font-semibold text-corporate">${s.total}</span> },
              ]}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
