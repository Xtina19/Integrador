import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Globe, BookMarked, Mail } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import { Pagination } from '@/components/ui/Pagination'
import { adminPath } from '@/lib/adminConfig'
import { formatEditorialDate } from '@/lib/editorialesDisplay'
import { contractStatusConfig, getContractVisualStatus } from '@/lib/publisherContractStatus'
import { editorialesApi, type EditorialRecord } from '@/services/api/editorialesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

const PAGE_SIZE = 10

export function EditorialesLista() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [publishers, setPublishers] = useState<EditorialRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await editorialesApi.list({ q: search || undefined })
      setPublishers(list)
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [search, showError])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    return publishers.filter((p) => {
      const visualStatus = getContractVisualStatus(p.contractExpiry)
      const matchStatus = statusFilter === 'all' || visualStatus === statusFilter
      return matchStatus
    })
  }, [publishers, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function toggle(p: EditorialRecord) {
    try {
      await editorialesApi.setEstado(p.id, p.status === 'active' ? 'inactive' : 'active')
      showSuccess(p.status === 'active' ? 'Editorial desactivada' : 'Editorial activada')
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button icon={Plus} onClick={() => navigate(adminPath('editoriales', 'nuevo'))}>
          Registrar Editorial
        </Button>
      </div>

      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            searchPlaceholder="Buscar por código, nombre, país o correo..."
            filters={
              <Select
                label="Estado contrato"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'active', label: 'Vigente' },
                  { value: 'expiring', label: 'Por vencer' },
                  { value: 'expired', label: 'Vencido' },
                  { value: 'none', label: 'Sin fecha' },
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [contractStatusConfig[statusFilter as keyof typeof contractStatusConfig]?.label ?? statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Editoriales" subtitle={loading ? 'Cargando…' : `${filtered.length} registros`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={paginated}
            columns={[
              {
                key: 'name',
                header: 'Editorial',
                render: (p) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <BookMarked size={16} className="text-corporate" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 block">{p.name}</span>
                      <span className="text-xs text-gray-400 font-mono">{p.code}</span>
                    </div>
                  </div>
                ),
              },
              {
                key: 'contact',
                header: 'Correo / Contacto',
                render: (p) => (
                  <span className="text-sm text-gray-600 flex items-center gap-1.5 min-w-0">
                    <Mail size={14} className="text-gray-400 shrink-0" />
                    <span className="truncate">{p.email || p.contact || '—'}</span>
                  </span>
                ),
              },
              {
                key: 'country',
                header: 'País',
                render: (p) => (
                  <div className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Globe size={14} className="text-gray-400 shrink-0" />
                    <span>{p.country || '—'}</span>
                  </div>
                ),
              },
              { key: 'contractType', header: 'Tipo de Contrato', render: (p) => p.contractType || '—' },
              {
                key: 'productCount',
                header: 'Productos',
                render: (p) => <span className="font-semibold text-corporate">{p.productCount}</span>,
              },
              {
                key: 'recordStatus',
                header: 'Estado',
                render: (p) => (
                  <Badge variant={p.status === 'active' ? 'success' : 'neutral'}>
                    {p.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                ),
              },
              {
                key: 'contractStatus',
                header: 'Contrato',
                render: (p) => {
                  const s = contractStatusConfig[getContractVisualStatus(p.contractExpiry)]
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              {
                key: 'contractExpiry',
                header: 'Vencimiento',
                render: (p) => (
                  <span className="text-sm tabular-nums text-gray-700">{formatEditorialDate(p.contractExpiry)}</span>
                ),
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (p) => (
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <button
                      type="button"
                      className="text-xs font-medium text-corporate hover:underline"
                      onClick={() => void toggle(p)}
                    >
                      {p.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                    <TableActions
                      onView={() => navigate(adminPath('editoriales', 'ver', p.id))}
                      onEdit={() => navigate(adminPath('editoriales', 'editar', p.id))}
                      onDelete={() => navigate(adminPath('editoriales', 'eliminar', p.id))}
                    />
                  </div>
                ),
              },
            ]}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>
    </div>
  )
}
