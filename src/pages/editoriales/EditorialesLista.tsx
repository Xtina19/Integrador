import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Globe, BookMarked, Mail } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { Toolbar } from '../../components/ui/Toolbar'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Input'
import { adminPublishers } from '../../data/adminMockData'
import { adminPath } from '../../lib/adminConfig'
import { contractStatusConfig, getContractVisualStatus } from '../../lib/publisherContractStatus'

const PAGE_SIZE = 5

export function EditorialesLista() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return adminPublishers.filter((p) => {
      const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.contact.includes(search)
      const visualStatus = getContractVisualStatus(p.contractExpiry)
      const matchStatus = statusFilter === 'all' || visualStatus === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button icon={Plus} onClick={() => navigate(adminPath('editoriales', 'nuevo'))}>Registrar Editorial</Button>
      </div>

      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1) }}
            searchPlaceholder="Buscar por nombre o correo..."
            filters={
              <Select
                label="Estado contrato"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'active', label: 'Vigente' },
                  { value: 'expiring', label: 'Por vencer' },
                  { value: 'expired', label: 'Vencido' },
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Editoriales" subtitle={`${filtered.length} registros`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={paginated}
            columns={[
              {
                key: 'name',
                header: 'Editorial',
                render: (p) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <BookMarked size={16} className="text-corporate" />
                    </div>
                    <span className="font-medium text-gray-900">{p.name}</span>
                  </div>
                ),
              },
              { key: 'contact', header: 'Correo', render: (p) => <span className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} />{p.contact}</span> },
              { key: 'country', header: 'País', render: (p) => <div className="flex items-center gap-1.5"><Globe size={14} className="text-gray-400" />{p.country}</div> },
              { key: 'contractType', header: 'Tipo de Contrato' },
              { key: 'productCount', header: 'Productos', render: (p) => <span className="font-semibold text-corporate">{p.productCount}</span> },
              {
                key: 'status',
                header: 'Estado',
                render: (p) => {
                  const s = contractStatusConfig[getContractVisualStatus(p.contractExpiry)]
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              { key: 'contractExpiry', header: 'Vencimiento' },
              {
                key: 'actions',
                header: 'Acciones',
                render: (p) => (
                  <TableActions
                    onView={() => navigate(adminPath('editoriales', 'ver', p.id))}
                    onEdit={() => navigate(adminPath('editoriales', 'editar', p.id))}
                    onDelete={() => navigate(adminPath('editoriales', 'eliminar', p.id))}
                  />
                ),
              },
            ]}
          />
          <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </CardBody>
      </Card>
    </div>
  )
}
