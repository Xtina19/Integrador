import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  to?: string
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[]
}

export function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
  return (
    <nav className="flex items-center flex-wrap gap-1.5 text-sm text-gray-500">
      <Link to="/administracion" className="text-corporate hover:underline">
        Administración
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={14} className="text-gray-300" />
          {item.to ? (
            <Link to={item.to} className="text-corporate hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-700 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
