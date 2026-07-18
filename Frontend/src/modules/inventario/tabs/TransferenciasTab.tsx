import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { ProcessStatCards } from '../components/ProcessStatCards'
import type { TransferenciaVista } from '../types/inventoryUi'
import { TRANSFERENCIA_ESTADO_LABEL } from '../types/inventoryUi'
import { transferenciaBadge } from '../utils/statusBadges'

type ProcesoId = 'pendientes' | 'transito' | 'recibidas' | 'canceladas' | 'todas'

interface Props {
  transferencias: TransferenciaVista[]
}

export function TransferenciasTab({ transferencias }: Props) {
  const navigate = useNavigate()
  const [proceso, setProceso] = useState<ProcesoId>('pendientes')

  const metrics = useMemo(() => {
    return {
      pendientes: transferencias.filter((t) => t.estado === 'borrador' || t.estado === 'solicitada').length,
      enTransito: transferencias.filter(
        (t) => t.estado === 'en_transito' || t.estado === 'recibida_parcial',
      ).length,
      recibidas: transferencias.filter((t) => t.estado === 'recibida').length,
      canceladas: transferencias.filter((t) => t.estado === 'cancelada').length,
    }
  }, [transferencias])

  const filtered = useMemo(() => {
    switch (proceso) {
      case 'pendientes':
        return transferencias.filter((t) => t.estado === 'borrador' || t.estado === 'solicitada')
      case 'transito':
        return transferencias.filter((t) => t.estado === 'en_transito' || t.estado === 'recibida_parcial')
      case 'recibidas':
        return transferencias.filter((t) => t.estado === 'recibida')
      case 'canceladas':
        return transferencias.filter((t) => t.estado === 'cancelada')
      default:
        return transferencias
    }
  }, [transferencias, proceso])

  return (
    <Card>
      <CardHeader title="Transferencias" />
      <CardBody className="!p-0">
        <div className="space-y-3 p-4 pb-0">
          <ProcessStatCards
            items={[
              {
                id: 'pendientes',
                label: 'Pendientes',
                value: metrics.pendientes,
                accent: 'border-l-amber-500',
                active: proceso === 'pendientes',
                onClick: () => setProceso('pendientes'),
              },
              {
                id: 'transito',
                label: 'En tránsito',
                value: metrics.enTransito,
                accent: 'border-l-gold',
                active: proceso === 'transito',
                onClick: () => setProceso('transito'),
              },
              {
                id: 'recibidas',
                label: 'Recibidas',
                value: metrics.recibidas,
                accent: 'border-l-emerald-500',
                active: proceso === 'recibidas',
                onClick: () => setProceso('recibidas'),
              },
              {
                id: 'canceladas',
                label: 'Canceladas',
                value: metrics.canceladas,
                accent: 'border-l-slate-400',
                active: proceso === 'canceladas',
                onClick: () => setProceso('canceladas'),
              },
            ]}
          />
          <button
            type="button"
            onClick={() => setProceso('todas')}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
              proceso === 'todas'
                ? 'border-corporate bg-corporate text-white'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            Ver todas
          </button>
        </div>

        <Table
          keyField="id"
          data={filtered}
          columns={[
            {
              key: 'codigo',
              header: 'Código',
              render: (t) => <span className="font-mono text-xs font-medium text-corporate">{t.codigo}</span>,
            },
            {
              key: 'origen',
              header: 'Origen → Destino',
              render: (t) => (
                <span className="text-sm">
                  <span className="text-slate-700">{t.origen}</span>
                  <span className="mx-1 text-slate-300">→</span>
                  <span className="text-slate-700">{t.destino}</span>
                </span>
              ),
            },
            { key: 'productoResumen', header: 'Producto' },
            {
              key: 'cantidadTotal',
              header: 'Cant.',
              render: (t) => <span className="font-semibold tabular-nums">{t.cantidadTotal}</span>,
            },
            {
              key: 'estado',
              header: 'Estado',
              render: (t) => (
                <Badge variant={transferenciaBadge(t.estado)}>{TRANSFERENCIA_ESTADO_LABEL[t.estado]}</Badge>
              ),
            },
            { key: 'fecha', header: 'Fecha', className: 'text-xs text-slate-500' },
            { key: 'solicitante', header: 'Solicitante', className: 'text-xs text-slate-500' },
            {
              key: 'actions',
              header: '',
              render: (t) => (
                <Button size="sm" variant="outline" onClick={() => navigate(`/inventario/transferencias/${t.id}`)}>
                  Detalle
                </Button>
              ),
            },
          ]}
        />
      </CardBody>
    </Card>
  )
}
