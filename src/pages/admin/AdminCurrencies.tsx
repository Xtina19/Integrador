import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { adminCurrencies } from '../../data/adminMockData'

const statusMap: Record<string, { label: string; variant: 'success' | 'neutral' }> = {
  active: { label: 'Activa', variant: 'success' },
  inactive: { label: 'Inactiva', variant: 'neutral' },
}

export function AdminCurrencies() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
          <span>/</span>
          <span>Monedas</span>
          <span className="ml-2">— {adminCurrencies.length} registros</span>
        </div>
        <Button icon={Plus}>Registrar Moneda</Button>
      </div>

      <Card>
        <CardHeader title="Catálogo de Monedas" subtitle="Monedas habilitadas en el sistema" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={adminCurrencies}
            columns={[
              {
                key: 'code',
                header: 'Código',
                render: (c) => <Badge variant="gold">{c.code}</Badge>,
              },
              { key: 'name', header: 'Nombre', render: (c) => <span className="font-medium text-gray-900">{c.name}</span> },
              {
                key: 'symbol',
                header: 'Símbolo',
                render: (c) => <span className="text-lg font-semibold text-corporate">{c.symbol}</span>,
              },
              {
                key: 'status',
                header: 'Estado',
                render: (c) => {
                  const s = statusMap[c.status]
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: () => <TableActions onEdit={() => {}} onDelete={() => {}} />,
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
