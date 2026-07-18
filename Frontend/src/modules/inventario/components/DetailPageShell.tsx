import { ArrowLeft, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FormBreadcrumb, type BreadcrumbItem } from '@/components/ui/FormBreadcrumb'
import { Button } from '@/components/ui/Button'

interface DetailPageShellProps {
  breadcrumbs: BreadcrumbItem[]
  backPath: string
  title: string
  subtitle?: string
  badge?: React.ReactNode
  loading?: boolean
  error?: string | null
  actions?: React.ReactNode
  children: React.ReactNode
}

export function DetailPageShell({
  breadcrumbs,
  backPath,
  title,
  subtitle,
  badge,
  loading,
  error,
  actions,
  children,
}: DetailPageShellProps) {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FormBreadcrumb items={breadcrumbs} />
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(backPath)}>
          Regresar
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-corporate">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-16 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </div>
      ) : (
        children
      )}
    </div>
  )
}
