import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, History } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import type { ProductoInventarioVista } from '../types/inventoryUi'
import { stockEstadoBadge } from '../utils/statusBadges'

const estadoLabel = { normal: 'Normal', bajo: 'Bajo stock', agotado: 'Agotado' } as const

interface Props {
  productos: ProductoInventarioVista[]
  onOpenKardex: (productoId: string) => void
}

export function GeneralTab({ productos, onOpenKardex }: Props) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('all')

  const filtered = useMemo(() => {
    return productos.filter((p) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        p.titulo.toLowerCase().includes(q) ||
        p.isbn.includes(q) ||
        p.autor.toLowerCase().includes(q)
      const matchEstado = estado === 'all' || p.estado === estado
      return matchSearch && matchEstado
    })
  }, [productos, search, estado])

  return (
    <Card>
      <CardHeader title="Existencias" />
      <CardBody className="!p-0">
        <div className="p-4 pb-0">
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar título, ISBN o autor..."
            filters={
              <Select
                label="Estado stock"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'bajo', label: 'Bajo stock' },
                  { value: 'agotado', label: 'Agotado' },
                ]}
              />
            }
            activeFilters={estado !== 'all' ? [estadoLabel[estado as keyof typeof estadoLabel]] : []}
          />
        </div>
        <Table
          keyField="id"
          data={filtered}
          columns={[
            { key: 'isbn', header: 'ISBN', className: 'font-mono text-xs text-slate-600' },
            {
              key: 'titulo',
              header: 'Producto',
              render: (p) => (
                <div>
                  <p className="font-medium text-slate-900">{p.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {p.autor} · {p.categoria}
                  </p>
                </div>
              ),
            },
            {
              key: 'stockConsolidado',
              header: 'Stock consolidado',
              render: (p) => (
                <div>
                  <span className="text-lg font-semibold tabular-nums text-corporate">{p.stockConsolidado}</span>
                  <p className="text-[11px] text-slate-400">mín. {p.stockMinimo}</p>
                </div>
              ),
            },
            {
              key: 'porAlmacen',
              header: 'Almacenes',
              render: (p) => (
                <div className="flex flex-wrap gap-1">
                  {p.porAlmacen.map((a) => (
                    <span
                      key={a.almacenId}
                      className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600"
                      title={a.almacenNombre}
                    >
                      {a.sucursal}: <strong>{a.saldo}</strong>
                    </span>
                  ))}
                </div>
              ),
            },
            {
              key: 'docs',
              header: 'Docs activos',
              render: (p) => (
                <div className="space-y-0.5 text-xs text-slate-600">
                  <p>TRF activas: {p.transferenciasActivas}</p>
                  <p>Conteos: {p.conteosAbiertos}</p>
                  <p>Ajustes: {p.ajustesPendientes}</p>
                  <p>Descartes: {p.descartesRelacionados}</p>
                </div>
              ),
            },
            {
              key: 'ultimoMovimientoFecha',
              header: 'Último mov.',
              render: (p) => (
                <div className="text-xs text-slate-500">
                  <p>{p.ultimoMovimientoFecha ?? '—'}</p>
                  <p className="text-[10px] text-slate-400">Aud: {p.ultimaAuditoriaFecha ?? '—'}</p>
                </div>
              ),
            },
            {
              key: 'estado',
              header: 'Estado',
              render: (p) => <Badge variant={stockEstadoBadge(p.estado)}>{estadoLabel[p.estado]}</Badge>,
            },
            {
              key: 'actions',
              header: '',
              render: (p) => (
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Eye}
                    onClick={() => navigate(`/inventario/productos/${p.id}`)}
                  >
                    Ficha
                  </Button>
                  <Button size="sm" variant="outline" icon={History} onClick={() => onOpenKardex(p.id)}>
                    Kardex
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </CardBody>
    </Card>
  )
}
