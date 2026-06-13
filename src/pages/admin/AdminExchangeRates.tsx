import { useNavigate } from 'react-router-dom'
import { Plus, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { adminExchangeRates, exchangeRateHistory } from '../../data/adminMockData'
import { adminPath } from '../../lib/adminConfig'

export function AdminExchangeRates() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
          <span>/</span>
          <span>Tasas de Cambio</span>
          <span className="ml-2">— {adminExchangeRates.length} tasas vigentes</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('tasas-cambio', 'nuevo'))}>
          Actualizar Tasa
        </Button>
      </div>

      <Card>
        <CardHeader title="Tasas de Cambio Vigentes" subtitle="Tipos de cambio activos del sistema" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={adminExchangeRates}
            columns={[
              {
                key: 'fromCurrency',
                header: 'Moneda Origen',
                render: (r) => <Badge variant="gold">{r.fromCurrency}</Badge>,
              },
              {
                key: 'arrow',
                header: '',
                render: () => <ArrowRight size={14} className="text-gray-400" />,
                className: 'w-8',
              },
              {
                key: 'toCurrency',
                header: 'Moneda Destino',
                render: (r) => <Badge variant="neutral">{r.toCurrency}</Badge>,
              },
              {
                key: 'value',
                header: 'Valor',
                render: (r) => <span className="font-bold text-corporate text-base">{r.value.toFixed(4)}</span>,
              },
              { key: 'date', header: 'Fecha', className: 'text-sm text-gray-600' },
              { key: 'updatedBy', header: 'Actualizado por', className: 'text-sm' },
              {
                key: 'actions',
                header: 'Acciones',
                render: (r) => (
                  <TableActions
                    onView={() => navigate(adminPath('tasas-cambio', 'ver', r.id))}
                    onEdit={() => navigate(adminPath('tasas-cambio', 'editar', r.id))}
                    onDelete={() => navigate(adminPath('tasas-cambio', 'eliminar', r.id))}
                  />
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Historial de Cambios" subtitle="Registro de actualizaciones de tasas de cambio" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={exchangeRateHistory}
            columns={[
              {
                key: 'fromCurrency',
                header: 'Origen',
                render: (r) => <Badge variant="gold">{r.fromCurrency}</Badge>,
              },
              {
                key: 'toCurrency',
                header: 'Destino',
                render: (r) => <Badge variant="neutral">{r.toCurrency}</Badge>,
              },
              {
                key: 'value',
                header: 'Valor',
                render: (r) => <span className="font-semibold text-corporate">{r.value.toFixed(4)}</span>,
              },
              { key: 'date', header: 'Fecha/Hora', className: 'text-xs text-gray-500 whitespace-nowrap' },
              { key: 'updatedBy', header: 'Usuario', className: 'text-sm font-medium' },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
