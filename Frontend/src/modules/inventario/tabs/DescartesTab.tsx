import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileImage } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { ProcessStatCards } from '../components/ProcessStatCards'
import type { DescarteEstadoUi, DescarteVista } from '../types/inventoryUi'
import { DESCARTE_MOTIVO_LABEL } from '../types/inventoryUi'
import { descarteBadge } from '../utils/statusBadges'

type FiltroEstado = DescarteEstadoUi | 'todos'

interface Props {
  descartes: DescarteVista[]
}

export function DescartesTab({ descartes }: Props) {
  const navigate = useNavigate()
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [filtroMotivo, setFiltroMotivo] = useState('all')

  const metrics = useMemo(() => {
    return {
      solicitado: descartes.filter((d) => d.estado === 'solicitado').length,
      aprobado: descartes.filter((d) => d.estado === 'aprobado').length,
      aplicado: descartes.filter((d) => d.estado === 'aplicado').length,
    }
  }, [descartes])

  const filtered = useMemo(() => {
    return descartes.filter((d) => {
      const matchEstado = filtroEstado === 'todos' || d.estado === filtroEstado
      const matchMotivo = filtroMotivo === 'all' || d.motivo === filtroMotivo
      return matchEstado && matchMotivo
    })
  }, [descartes, filtroEstado, filtroMotivo])

  return (
    <Card>
      <CardHeader title="Descartes" />
      <CardBody className="!p-0">
        <div className="space-y-3 p-4 pb-0">
          <ProcessStatCards
            items={[
              {
                id: 'solicitado',
                label: 'Solicitados',
                value: metrics.solicitado,
                accent: 'border-l-amber-500',
                active: filtroEstado === 'solicitado',
                onClick: () => setFiltroEstado('solicitado'),
              },
              {
                id: 'aprobado',
                label: 'Aprobados',
                value: metrics.aprobado,
                accent: 'border-l-blue-500',
                active: filtroEstado === 'aprobado',
                onClick: () => setFiltroEstado('aprobado'),
              },
              {
                id: 'aplicado',
                label: 'Aplicados',
                value: metrics.aplicado,
                accent: 'border-l-emerald-500',
                active: filtroEstado === 'aplicado',
                onClick: () => setFiltroEstado('aplicado'),
              },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <MotivoChip active={filtroEstado === 'todos'} onClick={() => setFiltroEstado('todos')} label="Todos" />
            <MotivoChip
              active={filtroMotivo === 'all'}
              onClick={() => setFiltroMotivo('all')}
              label="Todos los motivos"
            />
            {(Object.keys(DESCARTE_MOTIVO_LABEL) as (keyof typeof DESCARTE_MOTIVO_LABEL)[]).map((m) => (
              <MotivoChip
                key={m}
                active={filtroMotivo === m}
                onClick={() => setFiltroMotivo(m)}
                label={DESCARTE_MOTIVO_LABEL[m]}
              />
            ))}
          </div>
        </div>

        <Table
          keyField="id"
          data={filtered}
          columns={[
            {
              key: 'codigo',
              header: 'Código',
              render: (d) => <span className="font-mono text-xs text-corporate">{d.codigo}</span>,
            },
            {
              key: 'producto',
              header: 'Producto',
              render: (d) => <span className="font-medium">{d.producto}</span>,
            },
            { key: 'almacen', header: 'Almacén', className: 'text-xs text-slate-500' },
            {
              key: 'motivo',
              header: 'Motivo',
              render: (d) => <span className="text-xs">{DESCARTE_MOTIVO_LABEL[d.motivo]}</span>,
            },
            {
              key: 'cantidad',
              header: 'Cant.',
              render: (d) => <span className="font-semibold tabular-nums text-red-600">−{d.cantidad}</span>,
            },
            {
              key: 'estado',
              header: 'Estado',
              render: (d) => <Badge variant={descarteBadge(d.estado)}>{d.estado}</Badge>,
            },
            {
              key: 'evidencia',
              header: 'Evidencia',
              render: (d) =>
                d.evidencia ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                    <FileImage size={12} /> Sí
                  </span>
                ) : (
                  <span className="text-xs text-amber-600">Pendiente</span>
                ),
            },
            {
              key: 'aprobador',
              header: 'Aprobación',
              render: (d) => <span className="text-xs text-slate-500">{d.aprobador ?? '—'}</span>,
            },
            { key: 'fecha', header: 'Fecha', className: 'text-xs text-slate-500' },
            {
              key: 'actions',
              header: '',
              render: (d) => (
                <Button size="sm" variant="outline" onClick={() => navigate(`/inventario/descartes/${d.id}`)}>
                  Gestionar
                </Button>
              ),
            },
          ]}
        />
      </CardBody>
    </Card>
  )
}

function MotivoChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
        active ? 'border-corporate bg-corporate text-white' : 'border-slate-200 bg-white text-slate-600'
      }`}
    >
      {label}
    </button>
  )
}
