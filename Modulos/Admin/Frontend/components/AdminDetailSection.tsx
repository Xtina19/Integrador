import { Card, CardHeader, CardBody } from '@/components/ui/Card'

interface DetailSectionProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
}

export function DetailSection({ title, subtitle, children, action }: DetailSectionProps) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} action={action} />
      <CardBody>{children}</CardBody>
    </Card>
  )
}

interface DetailRowProps {
  label: string
  value: React.ReactNode
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start py-3 border-b border-gray-100 last:border-0 gap-1 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500 sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 flex-1">{value}</dd>
    </div>
  )
}
