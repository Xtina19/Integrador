import { ArrowLeft, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AdminBreadcrumb } from './AdminBreadcrumb'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import type { AdminModuleConfig } from '@/lib/adminConfig'
import { adminPath } from '@/lib/adminConfig'

interface BreadcrumbItem {
  label: string
  to?: string
}

interface AdminDetailLayoutProps {
  config: AdminModuleConfig
  breadcrumbs: BreadcrumbItem[]
  id: string
  title: string
  subtitle?: string
  statusBadge?: React.ReactNode
  children: React.ReactNode
  showEdit?: boolean
  showDelete?: boolean
  listPath?: string
  editPath?: string
  deletePath?: string
}

export function AdminDetailLayout({
  config,
  breadcrumbs,
  id,
  title,
  subtitle,
  statusBadge,
  children,
  showEdit = true,
  showDelete = true,
  listPath,
  editPath,
  deletePath,
}: AdminDetailLayoutProps) {
  const navigate = useNavigate()
  const backPath = listPath ?? config.basePath

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminBreadcrumb items={breadcrumbs} />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(backPath)}>
            Regresar
          </Button>
          {showEdit && (
            <Button variant="outline" size="sm" icon={Pencil} onClick={() => navigate(editPath ?? adminPath(config.key, 'editar', id))}>
              Editar
            </Button>
          )}
          {showDelete && (
            <Button variant="outline" size="sm" icon={Trash2} onClick={() => navigate(deletePath ?? adminPath(config.key, 'eliminar', id))}>
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-corporate">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {statusBadge}
          </div>
        </CardBody>
      </Card>

      {children}
    </div>
  )
}

interface AdminDeleteLayoutProps {
  config: AdminModuleConfig
  breadcrumbs: BreadcrumbItem[]
  recordTitle: string
  recordSubtitle?: string
  recordSummary: { label: string; value: React.ReactNode }[]
  children?: React.ReactNode
  listPath?: string
  onConfirm?: () => void | boolean | Promise<void | boolean>
}

export function AdminDeleteLayout({
  config,
  breadcrumbs,
  recordTitle,
  recordSubtitle,
  recordSummary,
  children,
  listPath,
  onConfirm,
}: AdminDeleteLayoutProps) {
  const navigate = useNavigate()
  const backPath = listPath ?? config.basePath

  const handleConfirm = async () => {
    if (onConfirm) {
      const result = await onConfirm()
      if (result === false) return
    }
    navigate(backPath)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <AdminBreadcrumb items={breadcrumbs} />
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(backPath)}>
          Regresar
        </Button>
      </div>

      <Card className="border-red-200">
        <CardBody>
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 shrink-0">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{config.deleteTitle}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Está a punto de eliminar permanentemente este registro del sistema.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Información del registro</h3>
          <div className="p-4 rounded-lg bg-surface mb-4">
            <p className="font-semibold text-corporate text-lg">{recordTitle}</p>
            {recordSubtitle && <p className="text-sm text-gray-500 mt-0.5">{recordSubtitle}</p>}
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recordSummary.map((item) => (
              <div key={item.label}>
                <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">{item.label}</dt>
                <dd className="text-sm text-gray-900 mt-1">{item.value}</dd>
              </div>
            ))}
          </dl>
          {children}
        </CardBody>
      </Card>

      <Card className="border-amber-200 bg-amber-50/30">
        <CardBody>
          <h3 className="text-sm font-semibold text-amber-800 mb-3">Consecuencias de la eliminación</h3>
          <ul className="space-y-2">
            {config.deleteConsequences.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-gray-200">
        <Button variant="outline" onClick={() => navigate(backPath)}>
          Cancelar
        </Button>
        <Button variant="danger" icon={Trash2} onClick={() => void handleConfirm()}>
          Confirmar eliminación
        </Button>
      </div>
    </div>
  )
}
