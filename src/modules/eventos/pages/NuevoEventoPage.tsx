import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/** Redirige a la lista de eventos y abre el modal de nuevo evento */
export function NuevoEventoPage() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/eventos', { replace: true, state: { openNewEvent: true } })
  }, [navigate])

  return null
}
