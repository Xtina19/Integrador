import { Link } from 'react-router-dom'
import { LucideIcon } from 'lucide-react'
import { Card, CardBody } from '../ui/Card'

interface QuickAccessItem {
  to: string
  icon: LucideIcon
  label: string
  description: string
  count?: number
}

interface QuickAccessGridProps {
  items: QuickAccessItem[]
}

export function QuickAccessGrid({ items }: QuickAccessGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <Link key={item.to} to={item.to}>
          <Card className="hover:border-corporate/30 transition-colors h-full">
            <CardBody>
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-corporate/10 text-corporate shrink-0">
                  <item.icon size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  {item.count !== undefined && (
                    <p className="text-xs font-medium text-gold-dark mt-1.5">{item.count} registros</p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </Link>
      ))}
    </div>
  )
}
