import { createContext, useCallback, useContext, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { GlobalSearchRecordType, GlobalSearchResult } from '../services/globalSearchService'

export interface GlobalSearchTarget {
  recordId: string
  recordType: GlobalSearchRecordType
  mode: 'view' | 'highlight'
}

interface GlobalSearchNavigationContextValue {
  navigateToResult: (result: GlobalSearchResult) => void
}

const GlobalSearchNavigationContext = createContext<GlobalSearchNavigationContextValue | null>(null)

export function GlobalSearchNavigationProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  const navigateToResult = useCallback(
    (result: GlobalSearchResult) => {
      let globalSearch: GlobalSearchTarget | undefined
      if (result.openInDialog) {
        globalSearch = { recordId: result.id, recordType: result.recordType, mode: 'view' }
      } else if (!result.path.includes('/ver/')) {
        globalSearch = { recordId: result.id, recordType: result.recordType, mode: 'highlight' }
      }
      navigate(result.path, { state: globalSearch ? { globalSearch } : {} })
    },
    [navigate]
  )

  const value = useMemo(() => ({ navigateToResult }), [navigateToResult])

  return (
    <GlobalSearchNavigationContext.Provider value={value}>{children}</GlobalSearchNavigationContext.Provider>
  )
}

export function useGlobalSearchNavigation() {
  const ctx = useContext(GlobalSearchNavigationContext)
  if (!ctx) throw new Error('useGlobalSearchNavigation debe usarse dentro de GlobalSearchNavigationProvider')
  return ctx
}

export function useGlobalSearchRecordEffect(
  recordType: GlobalSearchRecordType,
  handlers: {
    onView?: (recordId: string) => void
    onHighlight?: (recordId: string) => void
  }
) {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const gs = (location.state as { globalSearch?: GlobalSearchTarget } | null)?.globalSearch
    if (!gs || gs.recordType !== recordType) return
    if (gs.mode === 'view') handlers.onView?.(gs.recordId)
    else handlers.onHighlight?.(gs.recordId)
    navigate(location.pathname, { replace: true, state: {} })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, location.pathname, recordType])
}

export function useRecordHighlightScroll(highlightId: string | null) {
  useEffect(() => {
    if (!highlightId) return
    const timer = window.setTimeout(() => {
      document.getElementById(`highlight-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
    return () => window.clearTimeout(timer)
  }, [highlightId])
}
