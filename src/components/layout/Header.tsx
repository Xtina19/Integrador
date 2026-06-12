import { Bell, Search, User, BookOpen } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  sidebarCollapsed: boolean
}

export function Header({ title, subtitle, sidebarCollapsed }: HeaderProps) {
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
        <div className="hidden sm:flex items-center relative">
          <Search size={16} className="absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en LibroSys..."
            className="w-64 pl-9 pr-4 py-2 text-sm bg-surface border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate/20 focus:border-corporate"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold rounded-full border border-white" />
        </button>

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
