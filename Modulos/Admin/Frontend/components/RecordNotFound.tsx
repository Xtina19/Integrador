import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

interface RecordNotFoundProps {
  moduleLabel: string
  listPath: string
}

export function RecordNotFound({ moduleLabel, listPath }: RecordNotFoundProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="text-center py-12">
          <p className="text-6xl font-bold text-gray-200">404</p>
          <h2 className="text-lg font-semibold text-gray-900 mt-4">Registro no encontrado</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            El {moduleLabel.toLowerCase()} solicitado no existe en el catálogo maestro o fue eliminado previamente.
          </p>
          <div className="mt-6">
            <Link to={listPath}>
              <Button variant="secondary" icon={ArrowLeft}>
                Volver al listado
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
