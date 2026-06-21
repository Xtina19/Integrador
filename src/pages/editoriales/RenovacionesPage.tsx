import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { contractRenewals } from '../../data/adminMockData'

export function RenovacionesPage() {
  return (
    <Card>
      <CardHeader title="Historial de Renovaciones" subtitle="Registro completo de renovaciones de contratos" />
      <CardBody className="!p-0">
        <Table
          keyField="id"
          data={contractRenewals}
          columns={[
            { key: 'id', header: 'ID', className: 'text-xs font-mono text-gray-400' },
            { key: 'publisherName', header: 'Editorial', render: (r) => <span className="font-medium">{r.publisherName}</span> },
            { key: 'contractId', header: 'Contrato', className: 'text-xs text-corporate' },
            { key: 'previousEnd', header: 'Vencimiento anterior' },
            { key: 'newEnd', header: 'Nuevo vencimiento', render: (r) => <span className="font-semibold text-corporate">{r.newEnd}</span> },
            { key: 'date', header: 'Fecha renovación' },
            { key: 'user', header: 'Usuario' },
          ]}
        />
      </CardBody>
    </Card>
  )
}
