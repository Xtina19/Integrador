import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface EventTabBarProps<T extends string> {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (tab: T) => void
}

export function EventTabBar<T extends string>({ tabs, active, onChange }: EventTabBarProps<T>) {
  return (
    <div className="flex items-center gap-1 bg-surface rounded-lg border border-gray-200 p-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            active === tab.id ? 'bg-corporate text-white' : 'text-gray-600 hover:bg-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

interface EventModalShellProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer: ReactNode
  maxWidth?: '3xl' | '4xl' | '5xl'
}

const widthClass = {
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
}

export function EventModalShell({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '5xl',
}: EventModalShellProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Cerrar" />
      <div
        className={`relative w-full ${widthClass[maxWidth]} max-h-[92vh] flex flex-col bg-white rounded-xl shadow-xl border border-gray-100`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
          {footer}
        </div>
      </div>
    </div>
  )
}
