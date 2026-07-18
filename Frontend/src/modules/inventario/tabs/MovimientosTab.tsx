import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, History } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select, Input } from '@/components/ui/Input'
import type { MovimientoTipoUi, MovimientoVista } from '../types/inventoryUi'
import { MOVIMIENTO_TIPO_LABEL } from '../types/inventoryUi'

const tipoGroups: { id: string; label: string; tipos: MovimientoTipoUi[] }[] = [
  { id: 'entradas', label: 'Entradas', tipos: ['entrada', 'recepcion', 'transferencia_entrada'] },
  { id: 'salidas', label: 'Salidas', tipos: ['salida', 'venta', 'transferencia_salida'] },
  { id: 'transferencias', label: 'Transferencias', tipos: ['transferencia_salida', 'transferencia_entrada'] },
  { id: 'ajustes', label: 'Ajustes', tipos: ['ajuste'] },
  { id: 'descartes', label: 'Descartes', tipos: ['descarte'] },
  { id: 'compensaciones', label: 'Compensaciones', tipos: ['compensacion'] },
]

interface Props {
  movimientos: MovimientoVista[]
  onOpenKardex: (productoId: string) => void
  onOpenDocumento: (tipo: string, id: string) => void
  highlightId?: string | null
}

export function MovimientosTab({ movimientos, onOpenKardex, onOpenDocumento, highlightId }: Props) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [grupo, setGrupo] = useState('all')
  const [sucursal, setSucursal] = useState('all')
  const [usuario, setUsuario] = useState('')
  const [documento, setDocumento] = useState('')

  const sucursales = useMemo(
    () => [...new Set(movimientos.map((m) => m.sucursal))],
    [movimientos]
  )

  const filtered = useMemo(() => {
    const tiposGrupo = tipoGroups.find((g) => g.id === grupo)?.tipos
    return movimientos.filter((m) => {
      const q = search.toLowerCase()
      const matchSearch = !q || m.productoTitulo.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
      const matchGrupo = !tiposGrupo || tiposGrupo.includes(m.tipo)
      const matchSuc = sucursal === 'all' || m.sucursal === sucursal
      const matchUser = !usuario || m.usuario.toLowerCase().includes(usuario.toLowerCase())
      const matchDoc =
        !documento ||
        m.documentoId.toLowerCase().includes(documento.toLowerCase()) ||
        m.documentoTipo.toLowerCase().includes(documento.toLowerCase())
      return matchSearch && matchGrupo && matchSuc && matchUser && matchDoc
    })
  }, [movimientos, search, grupo, sucursal, usuario, documento])

  return (
    <Card>
      <CardHeader title="Movimientos" />
      <CardBody className="!p-0">
        <div className="space-y-4 p-4 pb-0">
          <div className="flex flex-wrap gap-2">
            <Chip active={grupo === 'all'} onClick={() => setGrupo('all')} label="Todos" />
            {tipoGroups.map((g) => (
              <Chip key={g.id} active={grupo === g.id} onClick={() => setGrupo(g.id)} label={g.label} />
            ))}
          </div>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Producto o ID movimiento..."
            filters={
              <>
                <Select
                  label="Sucursal"
                  value={sucursal}
                  onChange={(e) => setSucursal(e.target.value)}
                  options={[
                    { value: 'all', label: 'Todas' },
                    ...sucursales.map((s) => ({ value: s, label: s })),
                  ]}
                />
                <Input
                  label="Documento"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  placeholder="TRF / AJ / DSC..."
                />
                <Input
                  label="Usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="correo..."
                />
              </>
            }
          />
        </div>
        <Table
          keyField="id"
          data={filtered}
          highlightId={highlightId}
          columns={[
            { key: 'fecha', header: 'Fecha', className: 'whitespace-nowrap text-xs text-slate-500' },
            {
              key: 'tipo',
              header: 'Tipo',
              render: (m) => (
                <Badge variant={m.cantidad < 0 ? 'warning' : 'success'}>{MOVIMIENTO_TIPO_LABEL[m.tipo]}</Badge>
              ),
            },
            {
              key: 'productoTitulo',
              header: 'Producto',
              render: (m) => <span className="font-medium text-slate-800">{m.productoTitulo}</span>,
            },
            { key: 'almacenNombre', header: 'Almacén', className: 'text-xs text-slate-500' },
            {
              key: 'cantidad',
              header: 'Cant.',
              render: (m) => (
                <span
                  className={`font-semibold tabular-nums ${m.cantidad < 0 ? 'text-red-600' : 'text-emerald-700'}`}
                >
                  {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                </span>
              ),
            },
            {
              key: 'saldoPosterior',
              header: 'Saldo',
              render: (m) => (
                <span className="text-xs tabular-nums text-slate-600">
                  {m.saldoAnterior} → {m.saldoPosterior}
                </span>
              ),
            },
            {
              key: 'documentoId',
              header: 'Documento',
              render: (m) => (
                <button
                  type="button"
                  className="text-left text-xs font-medium text-corporate hover:underline"
                  onClick={() => onOpenDocumento(m.documentoTipo, m.documentoId)}
                >
                  {m.documentoId}
                  <span className="block font-normal text-slate-400">{m.documentoTipo}</span>
                </button>
              ),
            },
            { key: 'usuario', header: 'Usuario', className: 'text-xs text-slate-500' },
            {
              key: 'actions',
              header: '',
              render: (m) => (
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Eye}
                    onClick={() => navigate(`/inventario/movimientos/${m.id}`)}
                  >
                    Detalle
                  </Button>
                  <Button size="sm" variant="outline" icon={History} onClick={() => onOpenKardex(m.productoId)}>
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

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-corporate bg-corporate text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-corporate/40'
      }`}
    >
      {label}
    </button>
  )
}
