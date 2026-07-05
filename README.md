# LibroSys

Sistema de gestión para librería (ERP). Proyecto dividido en dos aplicaciones independientes:

```
Proyecto/
├── frontend/     # React + TypeScript + Vite
├── backend/      # Node.js + Express + SQL Server
├── LibroSys-Legacy/
└── README.md
```

## Requisitos

- Node.js 18+
- SQL Server (para el backend)
- npm

## Backend

```bash
cd backend
copy .env.example .env
# Editar .env con credenciales de SQL Server
npm install
npm start
```

El servidor inicia en `http://localhost:3001` (o el puerto definido en `PORT`).

### Endpoints disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/api/test-db` | Prueba de conexión a base de datos |
| GET | `/api/productos` | Lista de productos |
| GET | `/api/productos/:id` | Producto por ID |

## Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

La aplicación inicia en `http://localhost:5173`.

### Comunicación frontend → backend

El frontend consume el backend mediante `VITE_API_URL` (por defecto `http://localhost:3001`).  
CORS está habilitado en el backend. No mezclar variables: el frontend usa prefijo `VITE_`, el backend usa `DB_*` y `PORT`.

### Migración progresiva Mock → API

Por módulo, activar en `frontend/.env`:

```env
VITE_USE_API_INVENTARIO=true
```

Mientras el flag esté en `false`, el módulo sigue usando Mock Data.

## Desarrollo simultáneo

1. Terminal 1: `cd backend && npm start`
2. Terminal 2: `cd frontend && npm run dev`

## Build de producción (frontend)

```bash
cd frontend
npm run build
npm run preview
```

## Notas

- `LibroSys-Legacy/` es una copia de referencia histórica; no forma parte de la ejecución principal.
- El backend usa **SQL Server** (`mssql`), no MySQL.
- No debe existir `node_modules` en la raíz del repo. Si aparece, detenga procesos de Vite/Node y elimínelo manualmente.
