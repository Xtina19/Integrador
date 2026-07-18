import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { ProcessStatCards } from '../components/ProcessStatCards'
import type { ConteoVista } from '../types/inventoryUi'
import { conteoBadge } from '../utils/statusBadges'

type Filtro = 'todos' | 'borrador' | 'captura' | 'revision' | 'cerrados'

interface Props {
  conteos: ConteoVista[]
}

export function ConteosTab({ conteos }: Props) {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const metrics = useMemo(() => {
    return {
      borrador: conteos.filter((c) => c.estado === 'borrador').length,
      captura: conteos.filter((c) => c.estado === 'abierto' || c.estado === 'en_conteo').length,
      revision: conteos.filter((c) => c.estado === 'en_revision').length,
      cerrados: conteos.filter((c) => c.estado === 'cerrado').length,
    }
  }, [conteos])

  const filtered = useMemo(() => {
    switch (filtro) {
      case 'borrador':
        return conteos.filter((c) => c.estado === 'borrador')
      case 'captura':
        return conteos.filter((c) => c.estado === 'abierto' || c.estado === 'en_conteo')
      case 'revision':
        return conteos.filter((c) => c.estado === 'en_revision')
      case 'cerrados':
        return conteos.filter((c) => c.estado === 'cerrado')
      default:
        return conteos
    }
  }, [conteos, filtro])

  return (
    <Card>
      <CardHeader title="Conteos" />
      <CardBody className="!p-0">
        <div className="p-4 pb-0">
          <ProcessStatCards
            items={[
              {
                id: 'borrador',
                label: 'Borrador',
                value: metrics.borrador,
                accent: 'border-l-slate-400',
                active: filtro === 'borrador',
                onClick: () => setFiltro('borrador'),
              },
              {
                id: 'captura',
                label: 'Captura',
                value: metrics.captura,
                accent: 'border-l-violet-500',
                active: filtro === 'captura',
                onClick: () => setFiltro('captura'),
              },
              {
                id: 'revision',
                label: 'Revisión',
                value: metrics.revision,
                accent: 'border-l-amber-500',
                active: filtro === 'revision',
                onClick: () => setFiltro('revision'),
              },
              {
                id: 'cerrados',
                label: 'Cerrados',
                value: metrics.cerrados,
                accent: 'border-l-emerald-500',
                active: filtro === 'cerrados',
                onClick: () => setFiltro('cerrados'),
              },
            ]}
          />
          <button
            type="button"
            onClick={() => setFiltro('todos')}
            className={`mt-3 rounded-md border px-2.5 py-1 text-xs font-medium ${
              filtro === 'todos' ? 'border-corporate bg-corporate text-white' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            Ver todos
          </button>
        </div>

        <Table
          keyField="id"
          data={filtered}
          columns={[
            {
              key: 'codigo',
              header: 'Código',
              render: (c) => <span className="font-mono text-xs font-medium text-corporate">{c.codigo}</span>,
            },
            { key: 'almacen', header: 'Almacén' },
            {
              key: 'tipo',
              header: 'Tipo',
              render: (c) => <span className="text-xs capitalize text-slate-500">{c.tipo}</span>,
            },
            {
              key: 'faseVisible',
              header: 'Fase',
              render: (c) => (
                <span className="rounded bg-corporate/10 px-2 py-0.5 text-xs font-semibold text-corporate">
                  {c.faseVisible}
                </span>
              ),
            },
            {
              key: 'estado',
              header: 'Estado',
              render: (c) => <Badge variant={conteoBadge(c.estado)}>{c.estado.replace(/_/g, ' ')}</Badge>,
            },
            {
              key: 'productosAlcance',
              header: 'Alcance',
              render: (c) => <span className="tabular-nums">{c.productosAlcance}</span>,
            },
            {
              key: 'diferencias',
              header: 'Diferencias',
              render: (c) => <span className="font-semibold tabular-nums">{c.diferencias}</span>,
            },
            {
              key: 'bloqueoActivo',
              header: 'Bloqueo',
              render: (c) =>
                c.bloqueoActivo ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                    <Lock size={12} /> Activo
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Libre</span>
                ),
            },
            { key: 'responsable', header: 'Responsable', className: 'text-xs text-slate-500' },
            {
              key: 'actions',
              header: '',
              render: (c) => (
                <Button size="sm" variant="outline" onClick={() => navigate(`/inventario/conteos/${c.id}`)}>
                  Gestión
                </Button>
              ),
            },
          ]}
        />
      </CardBody>
    </Card>
  )
}
