import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import type { KardexLineaVista } from '../types/inventoryUi'
import { MOVIMIENTO_TIPO_LABEL } from '../types/inventoryUi'

interface Props {
  lineas: KardexLineaVista[]
  filterProductoId?: string | null
  onOpenDocumento: (tipo: string, id: string) => void
  onClearProductoFilter?: () => void
}

export function KardexTab({ lineas, filterProductoId, onOpenDocumento, onClearProductoFilter }: Props) {
  const [search, setSearch] = useState('')
  const [tipoDoc, setTipoDoc] = useState('all')

  const filtered = useMemo(() => {
    return lineas.filter((l) => {
      if (filterProductoId && l.productoId !== filterProductoId) return false
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        l.productoTitulo.toLowerCase().includes(q) ||
        l.isbn.includes(q) ||
        l.documentoId.toLowerCase().includes(q)
      const matchDoc = tipoDoc === 'all' || l.documentoTipo === tipoDoc
      return matchSearch && matchDoc
    })
  }, [lineas, search, tipoDoc, filterProductoId])

  return (
    <Card>
      <CardHeader title="Kardex" />
      <CardBody className="!p-0">
        <div className="space-y-3 p-4 pb-0">
          {filterProductoId && (
            <div className="flex items-center justify-between rounded-lg border border-corporate/20 bg-corporate/5 px-3 py-2 text-sm">
              <span>
                Filtrado por producto <strong>{filterProductoId}</strong>
              </span>
              <Button size="sm" variant="outline" onClick={onClearProductoFilter}>
                Quitar filtro
              </Button>
            </div>
          )}
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Producto, ISBN o documento..."
            filters={
              <Select
                label="Tipo documento"
                value={tipoDoc}
                onChange={(e) => setTipoDoc(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'transferencia', label: 'Transferencia' },
                  { value: 'descarte', label: 'Descarte' },
                  { value: 'ajuste', label: 'Ajuste' },
                  { value: 'conteo', label: 'Conteo' },
                  { value: 'venta', label: 'Venta' },
                  { value: 'recepcion', label: 'Recepción' },
                  { value: 'compensacion', label: 'Compensación' },
                ]}
              />
            }
          />
        </div>
        <Table
          keyField="id"
          data={filtered}
          columns={[
            { key: 'fecha', header: 'Fecha', className: 'whitespace-nowrap text-xs text-slate-500' },
            {
              key: 'productoTitulo',
              header: 'Producto',
              render: (l) => (
                <div>
                  <p className="text-sm font-medium text-slate-800">{l.productoTitulo}</p>
                  <p className="font-mono text-[10px] text-slate-400">{l.isbn}</p>
                </div>
              ),
            },
            {
              key: 'tipo',
              header: 'Tipo',
              render: (l) => (
                <Badge variant={l.cantidad < 0 ? 'warning' : 'info'}>{MOVIMIENTO_TIPO_LABEL[l.tipo]}</Badge>
              ),
            },
            {
              key: 'cantidad',
              header: 'Cant.',
              render: (l) => (
                <span
                  className={`font-semibold tabular-nums ${l.cantidad < 0 ? 'text-red-600' : 'text-emerald-700'}`}
                >
                  {l.cantidad > 0 ? `+${l.cantidad}` : l.cantidad}
                </span>
              ),
            },
            {
              key: 'saldo',
              header: 'Saldo',
              render: (l) => <span className="tabular-nums font-medium">{l.saldo}</span>,
            },
            {
              key: 'documentoId',
              header: 'Documento origen',
              render: (l) => (
                <button
                  type="button"
                  className="text-left text-xs font-semibold text-corporate hover:underline"
                  onClick={() => onOpenDocumento(l.documentoTipo, l.documentoId)}
                >
                  {l.documentoId}
                  <span className="block font-normal capitalize text-slate-400">{l.documentoTipo}</span>
                </button>
              ),
            },
            { key: 'almacen', header: 'Almacén', className: 'text-xs text-slate-500' },
            { key: 'usuario', header: 'Usuario', className: 'text-xs text-slate-500' },
            {
              key: 'actions',
              header: '',
              render: (l) => (
                <Button
                  size="sm"
                  variant="outline"
                  icon={ExternalLink}
                  onClick={() => onOpenDocumento(l.documentoTipo, l.documentoId)}
                >
                  Abrir
                </Button>
              ),
            },
          ]}
        />
      </CardBody>
    </Card>
  )
}
