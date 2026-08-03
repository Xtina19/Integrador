import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Plus } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import type {
  TransferenciaEstadoUi,
  TransferenciaVista,
} from '../types/inventoryUi'
import { TRANSFERENCIA_ESTADO_LABEL } from '../types/inventoryUi'
import { transferenciaBadge } from '../utils/statusBadges'

interface Props {
  transferencias: TransferenciaVista[]
}

function formatFecha(value: string): string {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TransferenciasTab({
  transferencias,
}: Props) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('all')

  const filtered = useMemo(() => {
    const query =
      search.trim().toLowerCase()

    return transferencias.filter(
      (transferencia) => {
        const matchSearch =
          !query ||
          transferencia.codigo
            .toLowerCase()
            .includes(query) ||
          transferencia.origen
            .toLowerCase()
            .includes(query) ||
          transferencia.destino
            .toLowerCase()
            .includes(query) ||
          transferencia.solicitante
            .toLowerCase()
            .includes(query)

        const matchEstado =
          estado === 'all' ||
          transferencia.estado === estado

        return matchSearch && matchEstado
      },
    )
  }, [transferencias, search, estado])

  return (
    <Card>
      <CardHeader
        title="Transferencias"
        subtitle="Traslados de existencias entre almacenes"
        action={
          <Button
            size="sm"
            icon={Plus}
            onClick={() =>
              navigate(
                '/inventario/transferencias/nuevo',
              )
            }
          >
            Nueva transferencia
          </Button>
        }
      />

      <CardBody className="!p-0">
        <div className="p-4 pb-0">
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Código, almacén o solicitante..."
            filters={
              <Select
                label="Estado"
                value={estado}
                onChange={(event) =>
                  setEstado(event.target.value)
                }
                options={[
                  {
                    value: 'all',
                    label: 'Todos',
                  },
                  {
                    value: 'borrador',
                    label: 'Borrador',
                  },
                  {
                    value: 'solicitada',
                    label: 'Solicitada',
                  },
                  {
                    value: 'en_transito',
                    label: 'En tránsito',
                  },
                  {
                    value: 'recibida_parcial',
                    label: 'Recibida parcial',
                  },
                  {
                    value: 'recibida',
                    label: 'Recibida',
                  },
                  {
                    value: 'cancelada',
                    label: 'Cancelada',
                  },
                ]}
              />
            }
          />
        </div>

        <Table
          keyField="id"
          data={filtered}
          columns={[
            {
              key: 'codigo',
              header: 'Código',
              render: (transferencia) => (
                <span className="font-mono text-xs font-semibold text-corporate">
                  {transferencia.codigo}
                </span>
              ),
            },
            {
              key: 'fecha',
              header: 'Fecha',
              render: (transferencia) => (
                <span className="whitespace-nowrap text-xs text-slate-500">
                  {formatFecha(
                    transferencia.fecha,
                  )}
                </span>
              ),
            },
            {
              key: 'origen',
              header: 'Origen',
            },
            {
              key: 'destino',
              header: 'Destino',
            },
            {
              key: 'productoResumen',
              header: 'Productos',
            },
            {
              key: 'cantidadTotal',
              header: 'Cantidad',
              render: (transferencia) => (
                <span className="font-semibold tabular-nums">
                  {
                    transferencia.cantidadTotal
                  }
                </span>
              ),
            },
            {
              key: 'solicitante',
              header: 'Solicitante',
              className:
                'text-xs text-slate-500',
            },
            {
              key: 'estado',
              header: 'Estado',
              render: (transferencia) => (
                <Badge
                  variant={transferenciaBadge(
                    transferencia.estado,
                  )}
                >
                  {
                    TRANSFERENCIA_ESTADO_LABEL[
                      transferencia.estado
                    ]
                  }
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (transferencia) => (
                <Button
                  size="sm"
                  variant="outline"
                  icon={Eye}
                  onClick={() =>
                    navigate(
                      `/inventario/transferencias/${transferencia.id}`,
                    )
                  }
                >
                  Detalle
                </Button>
              ),
            },
          ]}
        />

        {filtered.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No hay transferencias registradas.
          </div>
        )}
      </CardBody>
    </Card>
  )
}