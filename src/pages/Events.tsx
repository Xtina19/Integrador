import { Plus, Calendar, MapPin, Users, Ticket } from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { events, calendarEvents } from '../data/mockData'

const eventStatus: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }> = {
  active: { label: 'Activo', variant: 'success' },
  upcoming: { label: 'Próximo', variant: 'info' },
  planned: { label: 'Planificado', variant: 'neutral' },
}

const eventType: Record<string, { label: string; variant: 'gold' | 'info' }> = {
  feria: { label: 'Feria', variant: 'gold' },
  evento: { label: 'Evento', variant: 'info' },
}

const daysInMonth = 30
const firstDayOffset = 6

export function Events() {
  const activeEvents = events.filter((e) => e.status === 'active').length
  const totalReservations = events.reduce((sum, e) => sum + e.reservations, 0)
  const totalParticipants = events.reduce((sum, e) => sum + e.participants, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Eventos Activos"
          value={activeEvents}
          detail={`${events.length} programados`}
          icon={<Calendar size={22} />}
        />
        <StatCard
          title="Reservaciones"
          value={totalReservations}
          detail="Total acumulado"
          icon={<Ticket size={22} />}
        />
        <StatCard
          title="Participantes"
          value={totalParticipants}
          detail="Personal asignado"
          icon={<Users size={22} />}
        />
      </div>

      <div className="flex justify-end">
        <Button icon={Plus}>Nuevo Evento</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader title="Calendario" subtitle="Junio 2026" />
          <CardBody>
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                <span key={d} className="font-semibold text-gray-400 py-1">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const calEvent = calendarEvents.find((e) => e.day === day)
                return (
                  <div
                    key={day}
                    className={`relative flex items-center justify-center h-9 rounded-lg text-xs font-medium transition-colors ${
                      calEvent
                        ? calEvent.type === 'feria'
                          ? 'bg-gold/20 text-corporate font-bold'
                          : 'bg-corporate/10 text-corporate'
                        : 'text-gray-600 hover:bg-gray-50'
                    } ${day === 6 ? 'ring-2 ring-corporate ring-offset-1' : ''}`}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gold/30" />
                <span>Feria</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-corporate/10" />
                <span>Evento</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Eventos y Ferias" subtitle="Programación actual" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={events}
              columns={[
                {
                  key: 'name',
                  header: 'Nombre',
                  render: (e) => (
                    <div>
                      <p className="font-medium text-gray-900">{e.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {e.location}
                      </p>
                    </div>
                  ),
                },
                {
                  key: 'type',
                  header: 'Tipo',
                  render: (e) => {
                    const t = eventType[e.type]
                    return <Badge variant={t.variant}>{t.label}</Badge>
                  },
                },
                {
                  key: 'startDate',
                  header: 'Fechas',
                  render: (e) => (
                    <span className="text-sm">
                      {e.startDate === e.endDate ? e.startDate : `${e.startDate} — ${e.endDate}`}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Estado',
                  render: (e) => {
                    const s = eventStatus[e.status]
                    return <Badge variant={s.variant}>{s.label}</Badge>
                  },
                },
                {
                  key: 'participants',
                  header: 'Participantes',
                  render: (e) => (
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-gray-400" />
                      <span>{e.participants}</span>
                    </div>
                  ),
                },
                {
                  key: 'reservations',
                  header: 'Reservaciones',
                  render: (e) => <span className="font-semibold text-corporate">{e.reservations}</span>,
                },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Reservaciones Recientes" subtitle="Últimas inscripciones a eventos" />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events
              .filter((e) => e.reservations > 0)
              .map((e) => (
                <div key={e.id} className="flex items-center justify-between p-4 rounded-lg bg-surface">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{e.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{e.startDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-corporate">{e.reservations}</p>
                    <p className="text-xs text-gold-dark">reservaciones</p>
                  </div>
                </div>
              ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
