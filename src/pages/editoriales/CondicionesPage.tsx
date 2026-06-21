import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { commercialConditions } from '../../data/adminMockData'

export function CondicionesPage() {
  return (
    <Card>
      <CardHeader title="Condiciones Comerciales" subtitle="Descuentos, crédito y contactos por editorial" />
      <CardBody className="!p-0">
        <Table
          keyField="publisherId"
          data={commercialConditions}
          columns={[
            { key: 'publisherName', header: 'Editorial', render: (c) => <span className="font-medium">{c.publisherName}</span> },
            { key: 'discount', header: 'Descuento negociado', render: (c) => <Badge variant="gold">{c.discount}</Badge> },
            { key: 'credit', header: 'Crédito' },
            { key: 'currency', header: 'Moneda', render: (c) => <Badge variant="neutral">{c.currency}</Badge> },
            { key: 'contact', header: 'Contacto principal', className: 'text-sm' },
            { key: 'notes', header: 'Observaciones', className: 'text-xs text-gray-500' },
          ]}
        />
      </CardBody>
    </Card>
  )
}
