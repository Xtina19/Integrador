import { useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { configSections } from '@/mocks/mockConfiguracion'
import { useToast } from '@/context/ToastContext'

const notificationsSection = configSections.find((s) => s.id === 'notifications')

export function NotificacionesPage() {
  const { showSuccess } = useToast()
  const [saved, setSaved] = useState(false)

  if (!notificationsSection) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Configuración de Notificaciones"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSaved(true)
                showSuccess('Configuración de notificaciones guardada correctamente')
              }}
            >
              Guardar cambios
            </Button>
          }
        />
        <CardBody>
          {saved && (
            <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2">
              Los cambios han sido aplicados al sistema.
            </div>
          )}
          <dl className="divide-y divide-gray-100">
            {notificationsSection.items.map((item) => (
              <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <dt className="text-sm text-gray-600">{item.label}</dt>
                <dd className="text-sm">
                  {item.type === 'boolean' ? (
                    item.value === 'true' ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="neutral">Inactivo</Badge>
                    )
                  ) : (
                    <span className="font-medium text-gray-900">{item.value}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
    </div>
  )
}
