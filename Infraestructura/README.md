# Infraestructura

Puertas de entrada del sistema (sin logica de negocio de dominio).

## Frontend (`Frontend/`)

Cascaron de ejecucion Vite/React:

- `package.json`, `vite.config.ts`, `tsconfig.json`
- `src/main.tsx`, `src/App.tsx`, `src/routes/`
- `src/components/layout/` y design system (`components/ui`, cards, dialogs, tables)
- Providers de aplicacion: `src/context/ToastContext`, `GlobalSearchNavigationContext`
- Store ERP: `src/store/`
- HTTP genérico: `src/services/http.ts`, `activityService`, `dashboardService`, `globalSearchService`
- Shims de compatibilidad (`pages/`, `layouts/`, `services/api/*`, y reexports hacia `Modulos/` / `Compartido/`)

El codigo de negocio vive en `Modulos/*/Frontend` (junctions en `src/modules/*`).

## Backend (`backend/`)

Cascaron Express:

- `package.json`, `server.js`, `register-paths.js`
- `db.js`, `middlewares/`, `lib/`, `helpers/`, `errors/`
- Inventario/Ventas DDD: junctions `src/modules/{inventario,ventas}` → `Modulos/*/Backend`
- Express clasico (Compras, Editoriales, Admin, Usuarios, Configuracion): permanece en `backend/` hasta migracion futura

## Compartido

`Compartido/` (junction `Frontend/src/compartido`) — UI/utilidades multi-modulo.

## Database

Instalador oficial: `database/sqlserver/`. Ver `database/Shared/README.md`.
