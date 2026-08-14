import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

export type ImportacionesSearchTab = 'embarques' | 'facturas' | null

interface ImportacionesSearchContextValue {
  activeTab: ImportacionesSearchTab
  search: string
  setSearch: (value: string) => void
  placeholder: string
}

const ImportacionesSearchContext = createContext<ImportacionesSearchContextValue | null>(null)

function resolveTab(pathname: string): ImportacionesSearchTab {
  if (pathname.startsWith('/importaciones/embarques') && !pathname.includes('/nuevo')) return 'embarques'
  if (pathname.startsWith('/importaciones/consolidaciones')) return 'embarques'
  if (pathname.startsWith('/importaciones/facturas')) return 'facturas'
  return null
}

const placeholders: Record<Exclude<ImportacionesSearchTab, null>, string> = {
  embarques: 'Buscar embarque, consolidación, factura, OC...',
  facturas: 'Buscar factura, proveedor, OC o embarque...',
}

export function ImportacionesSearchProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const activeTab = resolveTab(pathname)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setSearch('')
  }, [activeTab])

  const value = useMemo(
    () => ({
      activeTab,
      search,
      setSearch,
      placeholder: activeTab ? placeholders[activeTab] : 'Buscar en LibroSys...',
    }),
    [activeTab, search]
  )

  return (
    <ImportacionesSearchContext.Provider value={value}>{children}</ImportacionesSearchContext.Provider>
  )
}

export function useImportacionesSearch() {
  const ctx = useContext(ImportacionesSearchContext)
  if (!ctx) throw new Error('useImportacionesSearch debe usarse dentro de ImportacionesSearchProvider')
  return ctx
}

export function useImportacionesSearchOptional() {
  return useContext(ImportacionesSearchContext)
}
