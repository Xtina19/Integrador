# LibroSys

ERP para librería (universo Joselito). Monorepo con frontend React y backend Express.

```
Proyecto/
├── Frontend/          # React + TypeScript + Vite
├── backend/           # Express + módulos DDD (Inventario, Ventas)
├── database/mysql/    # Packs MySQL definitivos
├── docs/              # Documentación oficial (fuente de verdad)
└── README.md
```

---

## Estado de módulos

| Módulo | Estado |
|--------|--------|
| **Inventario** | Terminado / operativo (Engine, TRF, ajustes, conteos, descartes) |
| **Ventas** | Terminado / operativo (POS, Facturas, NC consulta, postventa cambios) |
| Administración (maestros) | Operativo (clientes, productos, etc. en UI) |
| **Compras** | Pendiente (no documentado como cerrado) |
| Importaciones / Editoriales / Eventos | Prototipo UI — fuera de docs oficiales |

Documentación: [`docs/README.md`](./docs/README.md) · Guía de onboarding: [`guia/README.md`](./guia/README.md)

---

## Requisitos

- Node.js 18+
- npm
- MySQL (`librosys`) para packs Inventario/Ventas
- SQL Server opcional/legacy para `/api/productos` y health `GETDATE`

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

App: `http://localhost:5173`

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
