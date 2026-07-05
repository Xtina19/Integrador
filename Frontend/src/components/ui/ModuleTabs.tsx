import { NavLink } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

export interface ModuleTab {
  to: string
  label: string
  icon?: LucideIcon
  end?: boolean
}

interface ModuleTabsProps {
  tabs: ModuleTab[]
}

export function ModuleTabs({ tabs }: ModuleTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              isActive ? 'bg-corporate text-white' : 'text-gray-600 hover:bg-gray-50'
            }`
          }
        >
          {tab.icon && <tab.icon size={16} />}
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
