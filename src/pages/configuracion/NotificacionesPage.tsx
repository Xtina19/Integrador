import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { configSections } from '../../data/configMockData'

const notificationsSection = configSections.find((s) => s.id === 'notifications')

export function NotificacionesPage() {
  if (!notificationsSection) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Configuración de Notificaciones"
          subtitle="Parámetros de alertas del sistema"
          action={
            <Button size="sm" variant="outline" onClick={() => {}}>
              Guardar cambios
            </Button>
          }
        />
        <CardBody>
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
