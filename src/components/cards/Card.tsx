interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ children, className = '' }: CardProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

interface StatCardProps {
  title: string
  value: string | number
  detail?: string
  icon: React.ReactNode
  trend?: { value: string; positive: boolean }
}

export function StatCard({ title, value, detail, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-corporate mt-1">{value}</p>
            {detail && (
              <p className="text-xs font-medium text-gold-dark mt-1">{detail}</p>
            )}
            {trend && (
              <p className={`text-xs font-medium mt-1 ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-corporate/10 text-corporate">
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
