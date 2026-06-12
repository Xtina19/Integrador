import { Plus, Globe, FileText, BookMarked, Mail } from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { publishers } from '../data/mockData'

const contractStatus: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  active: { label: 'Vigente', variant: 'success' },
  expiring: { label: 'Por vencer', variant: 'warning' },
  expired: { label: 'Vencido', variant: 'danger' },
}

export function Publishers() {
  const totalProducts = publishers.reduce((sum, p) => sum + p.products, 0)
  const activeContracts = publishers.filter((p) => p.contractStatus === 'active').length
  const expiringSoon = publishers.filter((p) => p.contractStatus === 'expiring').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Editoriales Registradas"
          value={publishers.length}
          detail="Proveedores activos"
          icon={<BookMarked size={22} />}
        />
        <StatCard
          title="Productos Asociados"
          value={totalProducts.toLocaleString()}
          detail="En catálogo"
          icon={<FileText size={22} />}
        />
        <StatCard
          title="Contratos Vigentes"
          value={activeContracts}
          detail={expiringSoon > 0 ? `${expiringSoon} por vencer pronto` : 'Todos al día'}
          icon={<Globe size={22} />}
        />
      </div>

      <div className="flex justify-end">
        <Button icon={Plus}>Registrar Editorial</Button>
      </div>

      <Card>
        <CardHeader title="Listado de Editoriales" subtitle="Gestión de contratos y proveedores" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={publishers}
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
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail size={10} /> {p.contact}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                key: 'country',
                header: 'País de origen',
                render: (p) => (
                  <div className="flex items-center gap-1.5">
                    <Globe size={14} className="text-gray-400" />
                    <span>{p.country}</span>
                  </div>
                ),
              },
              {
                key: 'products',
                header: 'Productos',
                render: (p) => <span className="font-semibold text-corporate">{p.products}</span>,
              },
              {
                key: 'contractStatus',
                header: 'Contrato',
                render: (p) => {
                  const s = contractStatus[p.contractStatus]
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              {
                key: 'contractExpiry',
                header: 'Vencimiento',
                render: (p) => (
                  <span className={`text-sm ${p.contractStatus === 'expiring' ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>
                    {p.contractExpiry}
                  </span>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {publishers
          .filter((p) => p.contractStatus === 'expiring')
          .map((p) => (
            <Card key={p.id} className="border-amber-200 bg-amber-50/30">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    <p className="text-sm text-gray-600 mt-1">Contrato próximo a vencer</p>
                    <p className="text-xs text-amber-600 font-medium mt-2">
                      Vence: {p.contractExpiry}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">Renovar</Button>
                </div>
              </CardBody>
            </Card>
          ))}
      </div>
    </div>
  )
}
