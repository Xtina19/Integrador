import { useState, useRef, useEffect, useMemo } from 'react'
import { Bell, Search, User, BookOpen, X } from 'lucide-react'
import { useERP } from '../../store/ERPProvider'
import { searchGlobal } from '../../services/globalSearchService'
import { useGlobalSearchNavigation } from '../../context/GlobalSearchNavigationContext'
import { GlobalSearchDropdown } from './GlobalSearchDropdown'

interface HeaderProps {
  title: string
  subtitle?: string
  sidebarCollapsed: boolean
}

export function Header({ title, subtitle, sidebarCollapsed }: HeaderProps) {
  const { state, notifications, unreadNotifications, markNotificationRead, markAllNotificationsRead } = useERP()
  const { navigateToResult } = useGlobalSearchNavigation()
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => searchGlobal(query, state), [query, state])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(result: Parameters<typeof navigateToResult>[0]) {
    navigateToResult(result)
    setQuery('')
    setSearchOpen(false)
  }

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 transition-all duration-300 ${
        sidebarCollapsed ? 'left-[72px]' : 'left-64'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-3 pr-4 border-r border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-corporate flex items-center justify-center">
              <BookOpen size={16} className="text-gold" />
            </div>
            <div>
              <p className="text-xs font-bold text-corporate leading-tight">Librería Joselito</p>
              <p className="text-[10px] text-gray-400 leading-tight">Desde 1952</p>
            </div>
          </div>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center relative" ref={searchRef}>
          <Search size={16} className="absolute left-3 text-gray-400 z-10" />
          <input
            type="text"
            placeholder="Buscar en LibroSys..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => query.trim() && setSearchOpen(true)}
            className="w-64 pl-9 pr-4 py-2 text-sm bg-surface border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate/20 focus:border-corporate"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSearchOpen(false)
              }}
              className="absolute right-2 p-1 rounded text-gray-400 hover:text-gray-600"
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
          <GlobalSearchDropdown
            open={searchOpen}
            query={query}
            results={results}
            onSelect={handleSelect}
          />
        </div>

        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Notificaciones"
          >
            <Bell size={20} className="text-gray-500" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-gold text-corporate text-[10px] font-bold rounded-full border border-white flex items-center justify-center">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Centro de Notificaciones</p>
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead()}
                  className="text-xs text-corporate hover:underline"
                >
                  Marcar todas
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Sin notificaciones</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-surface transition-colors ${
                        !n.read ? 'bg-corporate/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-gold shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{n.module}</p>
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-500 hover:bg-gray-50 rounded-b-lg"
              >
                <X size={12} /> Cerrar
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900">María González</p>
            <p className="text-xs text-gray-500">Administrador</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-corporate flex items-center justify-center">
            <User size={18} className="text-white" />
          </div>
        </div>
      </div>
    </header>
  )
}
