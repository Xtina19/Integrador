# 14 — Manual técnico

Guía para desarrolladores que deben mantener o integrar el módulo Inventario **sin reabrir el dominio**.

---

## 1. Arranque local (stack actual)

### Backend

1. Dependencias en `backend/` (`npm install` si aplica).
2. Servidor Express (`backend/server.js`) monta Inventario vía `tsx` + `mountInventarioModule`.
3. Verificar:

```http
GET /api/inventario/dashboard
x-user-id: inventario
x-user-roles: admin
```

4. Datos iniciales: seeder Joselito + opcionalmente JSON en `backend/data/inventario/`.

### Frontend

1. `Frontend/` → `npm run dev` (o build).
2. Navegar a `/inventario`.
3. Los clientes API ya envían headers de prueba `inventario` / `admin`.

### MySQL

```bash
cd database/mysql
mysql -u root -p < install_all.sql
```

Paquete Inventario: `inventario_definitivo/` versión **INV-DB-1.0.0**.

---

## 2. Mapa mental de cambios seguros vs prohibidos

| Permitido (mantenimiento) | Prohibido (módulo cerrado) |
|---------------------------|----------------------------|
| Bugs de UI/mapeo API | Nuevos estados de dominio |
| Docs | Modificar `InventoryEngine` salvo bug crítico autorizado |
| Corrección SQL derivada de pruebas | Nuevos módulos Compras/Ventas/Importaciones “dentro” de Inventario |
| Tests adicionales que no cambien contratos | Romper firmas de Application Services |

---

## 3. Dónde tocar cada preocupación

| Preocupación | Archivo(s) |
|--------------|------------|
| Regla de stock | `domain/services/InventoryEngine.ts` + VOs |
| Ciclo documental | `domain/aggregates/*.ts` + `application/services/*` |
| HTTP | `infrastructure/api/http/routes/inventarioRoutes.ts` |
| Composición / seed | `createInventarioComposition.ts`, `seedJoselito.ts`, `mountInventarioModule.ts` |
| UI listados | `pages/Inventory.tsx`, `tabs/*` |
| UI flujo | `pages/Detalle*.tsx`, `Nuevo*.tsx` |
| Clientes HTTP | `Frontend/src/services/api/*` |
| Esquema SQL | `database/mysql/inventario_definitivo/*` |

---

## 4. Contratos que no se deben romper

1. Estados de Transferencia aprobados (sin `aprobada`/`despachada`/`revertida`).
2. Crear conteo/descarte **sin** mutar stock.
3. Headers `x-user-id` / permisos en rutas.
4. Body de apply/despachar/recibir con `expectedVersion` + `idempotencyKey`.
5. Columna `dominio_id` y ENUM de movimientos en MySQL alineados a `TipoMovimiento`.

---

## 5. Observabilidad

- Logger estructurado + métricas en infrastructure/observability.
- Outbox: `POST /api/inventario/outbox/process`.
- OpenAPI: `/api/inventario/openapi.json`.

---

## 6. Persistencia dual (importante)

```
[UI] → [API Node DDD] → [InMemory + JSON durables]
                ↕ (alineación conceptual)
        [MySQL INV-DB-1.0.0 + sp_inv_*]
```

Hasta cablear un adaptador MySQL único, **no** asumir que un `POST` HTTP escribe automáticamente en MySQL. El esquema SQL es el modelo definitivo de BD; el runtime Node es el modelo operativo actual del módulo DDD.

---

## 7. Extensiones futuras (fuera de Inventario)

Cuando se habiliten Compras/Ventas/Importaciones, deben:

- Emitir movimientos tipados (`recepcion`, `venta`, …) **a través del Engine** (o `sp_inv_registrar_movimiento`), nunca actualizando `inventario.stock` a mano.
- Referenciar documentos con `DocumentoOrigenRef` / `documento_tipo`+`documento_id`.

---

## 8. Referencias internas

- Dominio: `docs/inventario/04-modelo-dominio.md`
- API: `docs/inventario/08-api.md`
- BD: `docs/inventario/09-base-datos.md` y `database/docs/INVENTARIO_BD_DEFINITIVA.md`
- Cierre funcional: `database/docs/INVENTARIO_CIERRE_ENTREGA.md`
- Backend cierre: `backend/src/modules/inventario/INVENTARIO_CIERRE_BACKEND.md` (si presente)
