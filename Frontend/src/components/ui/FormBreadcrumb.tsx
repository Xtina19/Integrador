import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface FormBreadcrumbProps {
  items: BreadcrumbItem[]
}

export function FormBreadcrumb({ items }: FormBreadcrumbProps) {
  return (
    <nav className="flex items-center flex-wrap gap-1.5 text-sm text-gray-500">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={14} className="text-gray-300" />}
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
