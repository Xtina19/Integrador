import { useState } from 'react'
import { Mail, Phone, Clock, MapPin, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { helpSections, supportContact } from '../../data/helpMockData'

export function AyudaPage() {
  const [expanded, setExpanded] = useState<string | null>(helpSections[0]?.id ?? null)

  const toggle = (id: string) => {
    setExpanded((current) => (current === id ? null : id))
  }

  return (
    <div className="space-y-6">
      {helpSections.map((section) => {
        const isOpen = expanded === section.id
        return (
          <Card key={section.id}>
            <button
              type="button"
              onClick={() => toggle(section.id)}
              className="w-full text-left"
            >
              <CardHeader
                title={section.title}
                subtitle={section.description}
                action={
                  isOpen ? (
                    <ChevronUp size={18} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400" />
                  )
                }
              />
            </button>
            {isOpen && (
              <CardBody className="border-t border-gray-100">
                <div className="space-y-4">
                  {section.articles.map((article) => (
                    <div key={article.title} className="rounded-lg bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-900">{article.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{article.content}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            )}
          </Card>
        )
      })}

      <Card className="border-corporate/20">
        <CardHeader title="Contacto de Soporte" subtitle="Estamos disponibles para ayudarle" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-corporate/10 text-corporate shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Correo electrónico</p>
                <p className="text-sm font-medium text-gray-900">{supportContact.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-corporate/10 text-corporate shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Teléfono</p>
                <p className="text-sm font-medium text-gray-900">{supportContact.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-corporate/10 text-corporate shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Horario de atención</p>
                <p className="text-sm font-medium text-gray-900">{supportContact.hours}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-corporate/10 text-corporate shrink-0">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Dirección</p>
                <p className="text-sm font-medium text-gray-900">{supportContact.address}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
            <HelpCircle size={16} />
            <span>Para incidencias urgentes, indique su usuario y el módulo afectado.</span>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
