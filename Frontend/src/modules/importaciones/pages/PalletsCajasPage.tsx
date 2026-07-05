import { useState, useMemo } from 'react'
import { Package } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { palletsBoxes } from '@/mocks/mockImportaciones'

type PalletBox = (typeof palletsBoxes)[number]

export function PalletsCajasPage() {
  const [pallets] = useState<PalletBox[]>(() => [...palletsBoxes])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewId, setViewId] = useState<string | null>(null)

  const selected = viewId ? pallets.find((p) => p.id === viewId) ?? null : null

  const filtered = useMemo(() => {
    return pallets.filter((p) => {
      const matchSearch =
        search === '' ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.shipment.toLowerCase().includes(search.toLowerCase()) ||
        p.location.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === 'all' || p.type === typeFilter
      return matchSearch && matchType
    })
  }, [pallets, search, typeFilter])

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por código, embarque o ubicación..."
            filters={
              <Select
                label="Tipo"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'Pallet', label: 'Pallet' },
                  { value: 'Caja', label: 'Caja' },
                ]}
              />
            }
            activeFilters={typeFilter !== 'all' ? [typeFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Pallets y Cajas" subtitle={`${filtered.length} unidades registradas`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              {
                key: 'id',
                header: 'Código',
                render: (p) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <Package size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{p.id}</span>
                  </div>
                ),
              },
              { key: 'shipment', header: 'Embarque', render: (p) => <span className="font-mono text-xs">{p.shipment}</span> },
              {
                key: 'type',
                header: 'Tipo',
                render: (p) => <Badge variant={p.type === 'Pallet' ? 'info' : 'neutral'}>{p.type}</Badge>,
              },
              { key: 'boxes', header: 'Cajas', render: (p) => <span className="font-semibold">{p.boxes}</span> },
              { key: 'weight', header: 'Peso' },
              { key: 'location', header: 'Ubicación', className: 'text-sm' },
              {
                key: 'actions',
                header: '',
                className: 'w-16',
                render: (p) => <TableActions onView={() => setViewId(p.id)} />,
              },
            ]}
          />
        </CardBody>
      </Card>

      <FormDialog
        open={Boolean(selected)}
        onClose={() => setViewId(null)}
        title={selected ? `${selected.type}: ${selected.id}` : ''}
        subtitle={selected?.shipment}
        mode="view"
        maxWidth="lg"
      >
        {selected && (
          <>
            <DetailRow label="Código" value={<span className="font-mono text-xs text-corporate">{selected.id}</span>} />
            <DetailRow label="Embarque" value={<span className="font-mono text-xs">{selected.shipment}</span>} />
            <DetailRow
              label="Tipo"
              value={<Badge variant={selected.type === 'Pallet' ? 'info' : 'neutral'}>{selected.type}</Badge>}
            />
            <DetailRow label="Cajas" value={<span className="font-semibold">{selected.boxes}</span>} />
            <DetailRow label="Peso" value={selected.weight} />
            <DetailRow label="Ubicación" value={selected.location} />
          </>
        )}
      </FormDialog>
    </div>
  )
}
