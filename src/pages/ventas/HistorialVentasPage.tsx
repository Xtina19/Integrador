import { useState, useMemo } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { Toolbar } from '../../components/ui/Toolbar'
import { Select } from '../../components/ui/Input'
import { SaleRecordDialog } from '../../components/ventas/SaleRecordDialog'
import { useSalesData } from '../../context/SalesDataContext'

const statusConfig = {
  paid: { label: 'Pagada', variant: 'success' as const },
  cancelled: { label: 'Cancelada', variant: 'danger' as const },
}

export function HistorialVentasPage() {
  const { salesHistory } = useSalesData()
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewId, setViewId] = useState<string | null>(null)

  const branches = [...new Set(salesHistory.map((s) => s.branch))].sort()
  const selectedSale = viewId ? salesHistory.find((s) => s.id === viewId) ?? null : null

  const filtered = useMemo(() => {
    return salesHistory.filter((s) => {
      const matchSearch =
        search === '' ||
        s.id.toLowerCase().includes(search.toLowerCase()) ||
        s.customer.toLowerCase().includes(search.toLowerCase())
      const matchBranch = branchFilter === 'all' || s.branch === branchFilter
      const matchStatus = statusFilter === 'all' || s.status === statusFilter
      return matchSearch && matchBranch && matchStatus
    })
  }, [search, branchFilter, statusFilter, salesHistory])

  const activeFilters = [
    ...(branchFilter !== 'all' ? [branchFilter] : []),
    ...(statusFilter !== 'all'
      ? [statusConfig[statusFilter as keyof typeof statusConfig]?.label ?? statusFilter]
      : []),
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por factura o cliente..."
            filters={
              <>
                <Select
                  label="Sucursal"
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Todas las sucursales' },
                    ...branches.map((b) => ({ value: b, label: b })),
                  ]}
                />
                <Select
                  label="Estado"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Todos' },
                    { value: 'paid', label: 'Pagadas' },
                    { value: 'cancelled', label: 'Canceladas' },
                  ]}
                />
              </>
            }
            activeFilters={activeFilters}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Historial de Ventas" subtitle={`${filtered.length} facturas`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              {
                key: 'id',
                header: 'Factura',
                render: (s) => (
                  <span className="font-mono text-xs font-medium text-corporate">{s.id}</span>
                ),
              },
              { key: 'date', header: 'Fecha', className: 'text-sm whitespace-nowrap' },
              { key: 'customer', header: 'Cliente', render: (s) => <span className="font-medium text-gray-900">{s.customer}</span> },
              { key: 'branch', header: 'Sucursal' },
              { key: 'total', header: 'Total', render: (s) => <span className="font-semibold text-corporate">${s.total.toLocaleString()}</span> },
              {
                key: 'status',
                header: 'Estado',
                render: (s) => {
                  const cfg = statusConfig[s.status]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (s) => <TableActions onView={() => setViewId(s.id)} />,
              },
            ]}
          />
        </CardBody>
      </Card>

      <SaleRecordDialog sale={selectedSale} open={Boolean(selectedSale)} onClose={() => setViewId(null)} />
    </div>
  )
}
