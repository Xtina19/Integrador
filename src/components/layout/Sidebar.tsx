import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Building2,
  CalendarDays,
  Users,
  Truck,
  Warehouse,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Tag,
  Store,
  Coins,
  TrendingUp,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventario', icon: Package, label: 'Inventario' },
  { to: '/transferencias', icon: ArrowLeftRight, label: 'Transferencias' },
  { to: '/editoriales', icon: Building2, label: 'Editoriales' },
  { to: '/eventos', icon: CalendarDays, label: 'Eventos y Ferias' },
  { to: '/usuarios', icon: Users, label: 'Usuarios' },
]

const adminSubItems = [
  { to: '/administracion/productos', icon: BookOpen, label: 'Productos' },
  { to: '/administracion/categorias', icon: Tag, label: 'Categorías' },
  { to: '/administracion/editoriales', icon: Building2, label: 'Editoriales' },
  { to: '/administracion/sucursales', icon: Store, label: 'Sucursales' },
  { to: '/administracion/proveedores', icon: Truck, label: 'Proveedores' },
  { to: '/administracion/monedas', icon: Coins, label: 'Monedas' },
  { to: '/administracion/tasas-cambio', icon: TrendingUp, label: 'Tasas de Cambio' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const isAdminActive = location.pathname.startsWith('/administracion')
  const [adminExpanded, setAdminExpanded] = useState(isAdminActive)

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-corporate text-white transition-all duration-300 flex flex-col ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gold shrink-0">
          <BookOpen size={20} className="text-corporate" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold leading-tight truncate">LibroSys</p>
            <p className="text-[10px] text-white/60 leading-tight truncate">Librería Joselito</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gold text-corporate'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        <div className="pt-2 mt-2 border-t border-white/10">
          {collapsed ? (
            <NavLink
              to="/administracion"
              className={({ isActive }) =>
                `flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive || isAdminActive
                    ? 'bg-gold text-corporate'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
              title="Administración"
            >
              <Settings size={20} />
            </NavLink>
          ) : (
            <>
              <button
                onClick={() => setAdminExpanded(!adminExpanded)}
                className={`flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isAdminActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings size={20} className="shrink-0" />
                  <span>Administración</span>
                </div>
                <ChevronDown
                  size={16}
                  className={`shrink-0 transition-transform duration-200 ${adminExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {adminExpanded && (
                <div className="mt-1 ml-3 pl-3 border-l border-white/10 space-y-0.5">
                  <NavLink
                    to="/administracion"
                    end
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-gold text-corporate'
                          : 'text-white/60 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                    General
                  </NavLink>
                  {adminSubItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-gold text-corporate'
                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                        }`
                      }
                    >
                      <item.icon size={14} className="shrink-0" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Warehouse size={14} />
              <span>Almacén Central</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
              <Truck size={14} />
              <span>5 Sucursales activas</span>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full gap-2 px-3 py-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors text-sm"
        >
          {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /> <span>Colapsar</span></>}
        </button>
      </div>
    </aside>
  )
}
