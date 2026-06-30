import { ArrowLeft, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FormBreadcrumb, type BreadcrumbItem } from './FormBreadcrumb'
import { Button } from './Button'
import { Card, CardHeader, CardBody } from './Card'

interface FormPageLayoutProps {
  breadcrumbs: BreadcrumbItem[]
  title: string
  subtitle?: string
  listPath: string
  children: React.ReactNode
  onSave?: () => void | boolean
  saveDisabled?: boolean
}

export function FormPageLayout({
  breadcrumbs,
  title,
  subtitle,
  listPath,
  children,
  onSave,
  saveDisabled = false,
}: FormPageLayoutProps) {
  const navigate = useNavigate()

  const handleSave = () => {
    const result = onSave?.()
    if (result === false) return
    navigate(listPath)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <FormBreadcrumb items={breadcrumbs} />
        <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate(listPath)}>
          Regresar
        </Button>
      </div>

      <Card>
        <CardHeader title={title} subtitle={subtitle} />
        <CardBody>{children}</CardBody>
      </Card>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2 border-t border-gray-200">
        <Button variant="outline" onClick={() => navigate(listPath)}>
          Cancelar
        </Button>
        <Button icon={Save} onClick={handleSave} disabled={saveDisabled}>
          Guardar
        </Button>
      </div>
    </div>
  )
}
