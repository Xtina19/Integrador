/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_API_TIMEOUT?: string
  readonly VITE_USE_API_INVENTARIO?: string
  readonly VITE_USE_API_VENTAS?: string
  readonly VITE_USE_API_COMPRAS?: string
  readonly VITE_USE_API_IMPORTACIONES?: string
  readonly VITE_USE_API_EVENTOS?: string
  readonly VITE_USE_API_EDITORIALES?: string
  readonly VITE_USE_API_USUARIOS?: string
  readonly VITE_USE_API_TRANSFERENCIAS?: string
  readonly VITE_USE_API_REPORTES?: string
  readonly VITE_USE_API_CONFIGURACION?: string
  readonly VITE_USE_API_AUDITORIA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
