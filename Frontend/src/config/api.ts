/** Configuración central de integración con el backend Express. */

const envFlag = (key: string, fallback = false) =>
  String(import.meta.env[key] ?? '').toLowerCase() === 'true' || fallback

export const apiConfig = {
  baseUrl: (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3001',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT ?? 15000),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const

/** Flags por módulo: cuando es false, el frontend sigue usando Mock Data. */
export const dataSourceConfig = {
  inventario: envFlag('VITE_USE_API_INVENTARIO'),
  ventas: envFlag('VITE_USE_API_VENTAS'),
  compras: envFlag('VITE_USE_API_COMPRAS'),
  importaciones: envFlag('VITE_USE_API_IMPORTACIONES'),
  eventos: envFlag('VITE_USE_API_EVENTOS'),
  editoriales: envFlag('VITE_USE_API_EDITORIALES'),
  usuarios: envFlag('VITE_USE_API_USUARIOS'),
  transferencias: envFlag('VITE_USE_API_TRANSFERENCIAS'),
  reportes: envFlag('VITE_USE_API_REPORTES'),
  configuracion: envFlag('VITE_USE_API_CONFIGURACION'),
  auditoria: envFlag('VITE_USE_API_AUDITORIA'),
} as const

export type DataSourceModule = keyof typeof dataSourceConfig

export function isApiEnabled(module: DataSourceModule): boolean {
  return dataSourceConfig[module]
}
