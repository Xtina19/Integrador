# 08 — API HTTP de Inventario

**Base URL:** `/api/inventario`  
**Router:** `backend/src/modules/inventario/infrastructure/api/http/routes/inventarioRoutes.ts`  
**OpenAPI:** `GET /api/inventario/openapi.json`

---

## 1. Autenticación

| Header | Obligatorio | Descripción |
|--------|-------------|-------------|
| `x-user-id` | Sí | Identificador de actor (401 si falta) |
| `x-user-roles` | Recomendado | Roles separados por coma (ej. `admin`) |

Respuestas de error típicas: `400 VALIDATION`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`, más códigos de dominio mapeados por `sendApplicationResult`.

Clientes FE (`Frontend/src/services/api/*`): suelen enviar `x-user-id: inventario` y `x-user-roles: admin`.

---

## 2. Transferencias

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/transferencias` | Crear (`solicitar?: boolean`) |
| GET | `/transferencias` | Listar |
| GET | `/transferencias/:id` | Detalle |
| POST | `/transferencias/:id/solicitar` | Borrador → solicitada |
| POST | `/transferencias/:id/cancelar` | Cancelar |
| POST | `/transferencias/:id/despachar` | Despachar (+ Engine) — body: `expectedVersion`, `idempotencyKey` |
| POST | `/transferencias/:id/recibir` | Recibir — body: `expectedVersion`, `idempotencyKey`, `recepciones[]` |

---

## 3. Ajustes

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/ajustes` | Crear (`solicitar?: boolean`) |
| GET | `/ajustes` | Listar |
| GET | `/ajustes/:id` | Detalle |
| POST | `/ajustes/:id/solicitar` | Solicitar |
| POST | `/ajustes/:id/aprobar` | Aprobar |
| POST | `/ajustes/:id/aplicar` | Aplicar (+ Engine) |
| POST | `/ajustes/:id/rechazar` | Rechazar |
| POST | `/ajustes/:id/cancelar` | Cancelar |
| POST | `/ajustes/:id/revertir` | Revertir (+ Engine) |

---

## 4. Descartes

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/descartes` | Crear completo (handler) o legacy (service) según body |
| GET | `/descartes` | Listado (create-store) |
| GET | `/descartes/:id` | Aggregate + `meta` |
| POST | `/descartes/:id/evidencias` | Adjuntar evidencia |
| POST | `/descartes/:id/solicitar` | Solicitar |
| POST | `/descartes/:id/aprobar` | Aprobar |
| POST | `/descartes/:id/aplicar` | Aplicar (+ Engine) |
| POST | `/descartes/:id/rechazar` | Rechazar |
| POST | `/descartes/:id/cancelar` | Cancelar |
| POST | `/descartes/:id/revertir` | Revertir (+ Engine) |

**Detección create completo:** body con `motivoCodigo` (string), `lineas` (array) y `sucursalId`.

---

## 5. Conteos

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/conteos` | Crear completo (nombre + productos[]) o legacy |
| GET | `/conteos` | Listar |
| GET | `/conteos/:id` | Detalle + meta |
| POST | `/conteos/:id/abrir` | Abrir + snapshot |
| POST | `/conteos/:id/lineas/:lineaId` | Registrar cantidad |
| POST | `/conteos/:id/revision` | Enviar a revisión |
| POST | `/conteos/:id/lineas/:lineaId/clasificar` | Clasificar |
| POST | `/conteos/:id/cerrar` | Cerrar |
| POST | `/conteos/:id/reconteo` | Iniciar reconteo (`lineaIds?`) |
| POST | `/conteos/:id/cancelar` | Cancelar |

---

## 6. Consultas transversales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/productos` | Vista existencias |
| GET | `/movimientos` | Listado ledger |
| GET | `/movimientos/:id` | Detalle |
| GET | `/kardex` | Kardex; query `productoId` |
| GET | `/auditoria` | Filtros: `usuarioId`, `documento`, `accion`, `resultado`, `from`, `to` |
| GET | `/auditoria/export` | `format=json` (default) o `format=csv` |
| GET | `/dashboard` | KPIs |
| POST | `/outbox/process` | Drain outbox |

---

## 7. Clientes frontend

| Archivo | Cobertura |
|---------|-----------|
| `transferenciasApi.ts` | CRUD/transiciones TRF |
| `ajustesApi.ts` | Ajustes |
| `descartesApi.ts` | Descartes |
| `conteosApi.ts` | Conteos |
| `movimientosApi.ts` | Movimientos |
| `kardexApi.ts` | Kardex |
| `auditoriaInventarioApi.ts` | Auditoría + export |
| `inventarioQueryApi.ts` | Productos / dashboard |
| `inventarioApi.ts` | Utilidades producto legacy |

---

## 8. Concurrencia e idempotencia

En operaciones que mueven stock (despachar, recibir, aplicar, revertir) el body incluye:

- `expectedVersion` — versión del documento
- `idempotencyKey` — clave única de operación

El Engine/Application Service garantiza replay seguro.
