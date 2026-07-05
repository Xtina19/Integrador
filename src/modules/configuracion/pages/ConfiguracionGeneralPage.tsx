import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { configSections } from '@/mocks/mockConfiguracion'

function formatValue(value: string, type: 'text' | 'number' | 'boolean') {
  if (type === 'boolean') {
    return value === 'true' ? (
      <Badge variant="success">Activo</Badge>
    ) : (
      <Badge variant="neutral">Inactivo</Badge>
    )
  }
  return <span className="font-medium text-gray-900">{value}</span>
}

export function ConfiguracionGeneralPage() {
  return (
    <div className="space-y-6">
      {configSections
        .filter((section) => section.id !== 'notifications')
        .map((section) => (
          <Card key={section.id}>
            <CardHeader title={section.title} subtitle={`${section.items.length} parámetros configurados`} />
            <CardBody>
              <dl className="divide-y divide-gray-100">
                {section.items.map((item) => (
                  <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                    <dt className="text-sm text-gray-600">{item.label}</dt>
                    <dd className="text-sm">{formatValue(item.value, item.type)}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
        ))}
    </div>
  )
}
