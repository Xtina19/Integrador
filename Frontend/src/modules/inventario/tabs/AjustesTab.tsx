import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { ProcessStatCards } from '../components/ProcessStatCards'
import type { AjusteVista } from '../types/inventoryUi'
import { ajusteBadge } from '../utils/statusBadges'

type BucketId = 'pendientes' | 'aplicado' | 'revertido' | 'todas'

interface Props {
  ajustes: AjusteVista[]
}

export function AjustesTab({ ajustes }: Props) {
  const navigate = useNavigate()
  const [bucket, setBucket] = useState<BucketId>('pendientes')

  const metrics = useMemo(() => {
    return {
      pendientes: ajustes.filter(
        (a) => a.estado === 'borrador' || a.estado === 'solicitado' || a.estado === 'aprobado',
      ).length,
      aplicados: ajustes.filter((a) => a.estado === 'aplicado').length,
      revertidos: ajustes.filter((a) => a.estado === 'revertido').length,
    }
  }, [ajustes])

  const filtered = useMemo(() => {
    switch (bucket) {
      case 'pendientes':
        return ajustes.filter(
          (a) => a.estado === 'borrador' || a.estado === 'solicitado' || a.estado === 'aprobado',
        )
      case 'aplicado':
        return ajustes.filter((a) => a.estado === 'aplicado')
      case 'revertido':
        return ajustes.filter((a) => a.estado === 'revertido')
      case 'todas':
        return ajustes
      default:
        return ajustes
    }
  }, [ajustes, bucket])

  return (
    <Card>
      <CardHeader title="Ajustes" />
      <CardBody className="!p-0">
        <div className="p-4 pb-0">
          <ProcessStatCards
            items={[
              {
                id: 'pendientes',
                label: 'Pendientes',
                value: metrics.pendientes,
                accent: 'border-l-amber-500',
                active: bucket === 'pendientes',
                onClick: () => setBucket('pendientes'),
              },
              {
                id: 'aplicado',
                label: 'Aplicados',
                value: metrics.aplicados,
                accent: 'border-l-emerald-500',
                active: bucket === 'aplicado',
                onClick: () => setBucket('aplicado'),
              },
              {
                id: 'revertido',
                label: 'Revertidos',
                value: metrics.revertidos,
                accent: 'border-l-slate-400',
                active: bucket === 'revertido',
                onClick: () => setBucket('revertido'),
              },
            ]}
          />
          <button
            type="button"
            onClick={() => setBucket('todas')}
            className={`mt-3 rounded-md border px-2.5 py-1 text-xs font-medium ${
              bucket === 'todas' ? 'border-corporate bg-corporate text-white' : 'border-slate-200 bg-white text-slate-600'
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
              render: (a) => <span className="font-mono text-xs text-corporate">{a.codigo}</span>,
            },
            {
              key: 'producto',
              header: 'Producto',
              render: (a) => <span className="font-medium">{a.producto}</span>,
            },
            { key: 'almacen', header: 'Almacén', className: 'text-xs text-slate-500' },
            { key: 'tipo', header: 'Tipo', className: 'text-xs text-slate-600' },
            {
              key: 'diferencia',
              header: 'Δ / Objetivo',
              render: (a) => (
                <span className="text-sm tabular-nums">
                  <span className={a.diferencia < 0 ? 'text-red-600' : 'text-emerald-700'}>
                    {a.diferencia > 0 ? `+${a.diferencia}` : a.diferencia}
                  </span>
                  <span className="text-slate-400"> → {a.objetivo}</span>
                </span>
              ),
            },
            {
              key: 'estado',
              header: 'Estado',
              render: (a) => <Badge variant={ajusteBadge(a.estado)}>{a.estado}</Badge>,
            },
            { key: 'fecha', header: 'Fecha', className: 'text-xs text-slate-500' },
            {
              key: 'actions',
              header: '',
              render: (a) => (
                <Button size="sm" variant="outline" onClick={() => navigate(`/inventario/ajustes/${a.id}`)}>
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
