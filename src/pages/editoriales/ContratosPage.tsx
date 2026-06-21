import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { Toolbar } from '../../components/ui/Toolbar'
import { publisherContracts } from '../../data/adminMockData'
import { adminPath } from '../../lib/adminConfig'
import { contractStatusConfig, getContractVisualStatus } from '../../lib/publisherContractStatus'

export function ContratosPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return publisherContracts.filter(
      (c) =>
        search === '' ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.publisherName.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por código o editorial..." />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Contratos Editoriales" subtitle={`${filtered.length} contratos registrados`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'code', header: 'Código', render: (c) => <span className="font-mono text-xs text-corporate">{c.code}</span> },
              { key: 'publisherName', header: 'Editorial', render: (c) => <span className="font-medium">{c.publisherName}</span> },
              { key: 'type', header: 'Tipo' },
              { key: 'startDate', header: 'Fecha inicio', className: 'text-sm' },
              { key: 'endDate', header: 'Fecha fin', className: 'text-sm' },
              {
                key: 'status',
                header: 'Estado',
                render: (c) => {
                  const visual = getContractVisualStatus(c.endDate)
                  const cfg = contractStatusConfig[visual]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              { key: 'responsible', header: 'Responsable' },
              {
                key: 'actions',
                header: 'Acciones',
                render: (c) => (
                  <div className="flex items-center gap-1">
                    <TableActions
                      onView={() => navigate(adminPath('editoriales', 'ver', c.publisherId))}
                      onEdit={() => navigate(adminPath('editoriales', 'editar', c.publisherId))}
                    />
                    <Button size="sm" variant="outline" onClick={() => navigate(adminPath('editoriales', 'editar', c.publisherId))}>
                      Renovar
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
