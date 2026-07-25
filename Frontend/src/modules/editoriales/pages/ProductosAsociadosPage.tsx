import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import { formatDop } from '@/lib/money'
import {
  editorialesApi,
  type EditorialProduct,
  type EditorialRecord,
} from '@/services/api/editorialesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

export function ProductosAsociadosPage() {
  const { showError } = useToast()
  const [products, setProducts] = useState<EditorialProduct[]>([])
  const [publishers, setPublishers] = useState<EditorialRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [publisherId, setPublisherId] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pubs, prods] = await Promise.all([
        editorialesApi.list(),
        editorialesApi.productos({
          q: search || undefined,
          editorialId: publisherId === 'all' ? undefined : publisherId,
        }),
      ])
      setPublishers(pubs)
      setProducts(prods)
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [search, publisherId, showError])

  useEffect(() => {
    void load()
  }, [load])

  const publisherOptions = useMemo(
    () => [
      { value: 'all', label: 'Todas' },
      ...publishers.map((p) => ({ value: p.id, label: p.name })),
    ],
    [publishers]
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por título, ISBN o código..."
            filters={
              <Select
                label="Editorial"
                value={publisherId}
                onChange={(e) => setPublisherId(e.target.value)}
                options={publisherOptions}
              />
            }
            activeFilters={
              publisherId !== 'all'
                ? [publishers.find((p) => p.id === publisherId)?.name ?? publisherId]
                : []
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Productos asociados"
          subtitle={loading ? 'Cargando…' : `${products.length} productos`}
        />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={products}
            columns={[
              {
                key: 'code',
                header: 'Código',
                render: (p) => <span className="font-mono text-xs text-corporate">{p.code}</span>,
              },
              { key: 'isbn', header: 'ISBN', className: 'text-xs font-mono text-gray-500' },
              { key: 'title', header: 'Título', render: (p) => <span className="font-medium">{p.title}</span> },
              { key: 'category', header: 'Categoría', render: (p) => p.category || '—' },
              {
                key: 'publisher',
                header: 'Editorial',
                render: (p) => <Badge variant="neutral">{p.publisher || '—'}</Badge>,
              },
              {
                key: 'stock',
                header: 'Stock',
                render: (p) => <span className="font-semibold tabular-nums">{p.stock}</span>,
              },
              {
                key: 'status',
                header: 'Estado',
                render: (p) => (
                  <Badge variant={p.status === 'active' ? 'success' : 'neutral'}>
                    {p.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                ),
              },
              {
                key: 'price',
                header: 'Precio',
                render: (p) => (
                  <span className="font-semibold text-corporate tabular-nums">{formatDop(p.price)}</span>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
