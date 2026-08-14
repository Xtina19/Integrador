# LibroSys

ERP para librería (universo Joselito). Monorepo con frontend React y backend Express.

```
Proyecto/
├── guia/                 # Documentación oficial (fuente de verdad)
├── Modulos/              # Código de negocio por dominio
├── Compartido/           # Código multi-módulo
├── Frontend/             # Shell Vite/React
├── backend/              # Shell Express (+ DDD Inventario/Ventas)
├── database/sqlserver/   # Instalador oficial SQL Server
└── README.md
```

---

## Estado de módulos

| Módulo | Estado |
|--------|--------|
| **Inventario** | Operativo (DDD + Engine) |
| **Ventas** | Operativo (DDD; POS, facturas, NC, postventa) |
| **Compras** | Operativo (Express + FE) |
| **Editoriales** | Operativo (Express + FE) |
| Administración / Usuarios / Configuración | Operativo (maestros UI + Express) |
| Importaciones / Eventos / Reportes / … | En `Modulos/`; docs pendientes en `guia/` |

**Documentación oficial:** [`guia/README.md`](./guia/README.md)

---

## Requisitos

- Node.js 18+ / npm
- SQL Server — pack oficial en `database/sqlserver/`

---

## Inicio rápido (recomendado)

**Un solo comando levanta backend + frontend juntos.** El frontend espera a que el backend responda antes de abrir.

Desde la **raíz** del proyecto:

```bash
npm install
npm start
```

O haga doble clic en **`INICIAR-LIBROSYS.cmd`** (Windows).

- Backend: `http://localhost:3001`
- App: `http://localhost:5173`

> **Importante:** no use solo `vite` ni `npm run dev:web`. Eso levanta únicamente la pantalla sin la base de datos. Use siempre `npm start` desde la raíz, `npm run dev` en `Frontend/`, o el archivo `.cmd`.

Al abrir el proyecto en **Cursor/VS Code**, la tarea **LibroSys: backend + frontend** puede iniciarse automáticamente (configurado en `.vscode/tasks.json`).

---

## Backend

```bash
cd backend
copy .env.example .env
npm install
npm start
```

Servidor: `http://localhost:3001`

### APIs relevantes

| Base | Módulo |
|------|--------|
| `/api/inventario` | Inventario DDD + Engine |
| `/api/v1/ventas` | Ventas DDD |
| `/api/productos` | Legacy catálogo |

Montaje: Inventario primero, luego Ventas con Engine compartido (`backend/server.js`).

---

## Frontend

```bash
cd Frontend
copy .env.example .env
npm install
npm run dev
```

`npm run dev` inicia también el backend en `localhost:3001`. App: `http://localhost:5173`

```env
VITE_API_URL=http://localhost:3001
VITE_USE_API_INVENTARIO=true
VITE_USE_API_VENTAS=true
```

### Menú Ventas (actual)

Dashboard · POS · Facturas · Notas de Crédito (consulta)

---

## Base de datos

```bash
# Desde database/mysql/
mysql -u root -p < install_all.sql
# o instaladores por módulo
```

Packs: `inventario_definitivo/`, `ventas_definitivo/`.

---

## Documentación

| Tema | Ruta |
|------|------|
| **Guía oficial (onboarding)** | [guia/README.md](./guia/README.md) |
| Índice docs técnicos | [docs/README.md](./docs/README.md) |
| Arquitectura | [docs/architecture/overview.md](./docs/architecture/overview.md) |
| Inventario | [docs/inventory/](./docs/inventory/) |
| Ventas | [docs/sales/](./docs/sales/) |
| Reglas | [docs/business-rules/](./docs/business-rules/) |
| BD | [docs/database/](./docs/database/) |

---

## Notas

- No mezclar mocks FE con API en producción de pruebas: activar flags `VITE_USE_API_*`.  
- Esperar aprobación documental antes de iniciar el módulo Compras.
