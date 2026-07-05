import { useCallback, useEffect, useRef, useState } from 'react'
import { getFriendlyErrorMessage } from '@/services/http'

export interface UseApiRequestOptions<T> {
  /** Si es false, no ejecuta la petición. */
  enabled?: boolean
  /** Datos iniciales mientras no hay respuesta. */
  initialData?: T
  /** Callback al obtener datos exitosamente. */
  onSuccess?: (data: T) => void
  /** Callback de error (además del toast si se provee showError). */
  onError?: (message: string) => void
  /** Mostrar toast de error automáticamente. */
  showError?: (message: string) => void
}

export interface UseApiRequestResult<T> {
  data: T | undefined
  loading: boolean
  error: string | null
  retry: () => void
  refetch: () => Promise<void>
}

export function useApiRequest<T>(
  requestFn: () => Promise<T>,
  deps: unknown[] = [],
  options: UseApiRequestOptions<T> = {}
): UseApiRequestResult<T> {
  const { enabled = true, initialData, onSuccess, onError, showError } = options
  const [data, setData] = useState<T | undefined>(initialData)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const attemptRef = useRef(0)

  const execute = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    attemptRef.current += 1
    const attempt = attemptRef.current
    setLoading(true)
    setError(null)

    try {
      const result = await requestFn()
      if (attempt !== attemptRef.current) return
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      if (attempt !== attemptRef.current) return
      const message = getFriendlyErrorMessage(err)
      setError(message)
      onError?.(message)
      showError?.(message)
    } finally {
      if (attempt === attemptRef.current) setLoading(false)
    }
  }, [enabled, requestFn, onSuccess, onError, showError])

  useEffect(() => {
    void execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps controladas por el consumidor
  }, [execute, ...deps])

  const retry = useCallback(() => {
    void execute()
  }, [execute])

  return { data, loading, error, retry, refetch: execute }
}
