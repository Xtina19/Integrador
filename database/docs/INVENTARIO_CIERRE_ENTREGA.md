# Informe de entrega — Cierre definitivo del módulo Inventario

**Fecha:** 2026-07-18  
**Alcance:** Solo Inventario. No se inició Compras, Ventas ni Importaciones.  
**Restricciones respetadas:** dominio aprobado sin nuevos estados en Transferencia; Inventory Engine sin cambios; Application Services compatibles.

---

## Veredicto

El módulo Inventario queda operativo para pruebas funcionales intensivas como módulo de referencia del ERP: pantallas de proceso completas (sin modales), APIs de listado/detalle/transición, persistencia durable en runtime, seeder Joselito (DOP enteros) y esquema SQL de soporte.

**Verificación automática**
- Backend Inventario: **69 tests OK**
- Frontend: **`npm run build` OK**

---

## 1. Procesos completados

| Proceso | Crear | Detalle | Transiciones | Persistencia | Auditoría/eventos |
|---------|-------|---------|--------------|--------------|-------------------|
| Inventario General / Ficha producto | Sí | `/inventario/productos/:id` | — | Query API + snapshot | — |
| Movimientos | — | `/inventario/movimientos/:id` | — | Query API | Engine/auditoría |
| Transferencias | Página | Detalle + recepción | solicitar, cancelar, despachar, recibir | Repo + snapshot | Outbox eventos |
| Conteos | Página | Detalle + captura/reconteo/revisión/clasificación/regularización | abrir, captura, reconteo, revisión, clasificar, cerrar, cancelar | Durable conteo + snapshot | Sí |
| Ajustes | Página (API real) | Detalle | solicitar, aprobar, aplicar, rechazar, cancelar, revertir | Repo + snapshot | Sí + Engine |
| Descartes | Página | Detalle | evidencias, solicitar, aprobar/rechazar, aplicar, cancelar, revertir | Durable descarte + snapshot | Sí + Engine |
| Kardex | Tab + detalle producto | Navegación a documento origen | — | Query API | — |
| Auditoría | Tab + detalle | Filtros + export CSV/JSON | — | Query API | — |
| Costeo | Página | — | — | `localStorage` provisional | — |

### Máquina de estados Transferencia (dominio aprobado)

`borrador → solicitada → en_transito → recibida_parcial|recibida` (+ `cancelada` desde borrador/solicitada).

> La UI anterior listaba `aprobada` / `despachada` / `revertida`; **no forman parte del dominio Transferencia aprobado**. La UI se alineó al dominio.

---

## 2. Pantallas creadas / reescritas

### Crear
- Nuevo Producto, Nueva Transferencia, Nuevo Ajuste, Nuevo Conteo, Nuevo Descarte, Nuevo Costeo

### Detalle / flujo
- Detalle Transferencia, Recepción Transferencia
- Detalle Conteo + Captura, Reconteo, Revisión, Clasificación, Regularización
- Detalle Ajuste, Detalle Descarte
- Ficha Producto, Detalle Movimiento, Detalle Kardex, Detalle Auditoría

### Shell
- Inventory (tabs General → Auditoría) con carga API paralela; mocks solo como fallback si falla la API

---

## 3. APIs agregadas / extendidas

Base: `/api/inventario`

**Escritura / transiciones:** transferencias (crear, solicitar, cancelar, despachar, recibir), ajustes (crear, solicitar, aprobar, aplicar, rechazar, cancelar, revertir), descartes (crear, evidencias, solicitar, aprobar, rechazar, aplicar, cancelar, revertir), conteos (crear, abrir, línea, revisión, clasificar, cerrar, reconteo, cancelar).

**Lectura:** `GET` transferencias/ajustes/conteos/descartes (+ `/:id`), productos, movimientos (+ `/:id`), kardex, auditoria (+ export), dashboard.

Clientes FE: `transferenciasApi`, `ajustesApi`, `movimientosApi`, `kardexApi`, `auditoriaInventarioApi`, `inventarioQueryApi`, + extensiones `conteosApi` / `descartesApi`.

Detalle técnico: `backend/src/modules/inventario/INVENTARIO_CIERRE_BACKEND.md`.

---

## 4. Base de datos (MySQL)

| Archivo | Cambio |
|---------|--------|
| `23_descarte_dominio.sql` | Tabla documento `descarte` (ya no `descarte_sesion`) |
| `24_descarte_documento.sql` | Migración rename + columnas origen: `conteo_origen_id`, `ajuste_origen_id`, `transferencia_origen_id`, `movimiento_origen_id`, `kardex_origen_id` |
| `25_inventario_seed_joselito.sql` | Extensión seed catálogo Joselito / notas |
| `26_inventario_views_procs.sql` | Vistas/índices de soporte Inventario |
| `install_all.sql` | Incluye 22–26 |

**Runtime (Node):** snapshot durable `data/inventario/inventario_snapshot.json` + `conteo_fisico_store.json` + `descarte_store.json`.

---

## 5. Dominio / Application Services (sin romper contratos)

Métodos nuevos en agregados existentes (solo estados ya aprobados): solicitar/cancelar (TRF), solicitar/rechazar/cancelar/marcarRevertido (Ajuste/Descarte), iniciarReconteo/cancelar (Conteo).

`InventoryQueryService` nuevo para lecturas ERP.

`InventoryEngine.ts`: **sin cambios**.

---

## 6. Seeder Joselito (runtime)

Costos DOP enteros: 650, 895, 1200, 1500, 2500, 3500 (sin centavos).

| Entidad | Registros generados |
|---------|---------------------|
| Productos | 50 |
| Existencias | 295 |
| Almacenes | 8 |
| Transferencias | 3 |
| Ajustes | 2 |
| Descartes | 2 |
| Conteos | 2 |
| Movimientos | 4 |
| Kardex | 4 |
| Auditorías | 4 |

---

## 7. Tests / build

- Vitest Inventario: 9 archivos / **69 tests passed**
- Frontend production build: **OK**

---

## 8. Limitaciones conocidas (para revisión)

1. Costeo aún provisional (`localStorage`); no hay endpoint de costeo en el dominio Inventario.
2. Transferencia no tiene estados `aprobada`/`despachada`/`revertida` en el modelo aprobado.
3. Adaptador MySQL live completo del DDD sigue siendo secundario al runtime in-memory + snapshot JSON (DDL listo para instalación).
4. Algunos KPIs UI-only (`recepcionesDelDia`, etc.) pueden quedar en 0 si no se calculan en `dashboardKpis`.
5. Scripts SQL no ejecutados contra un MySQL live en este entorno (no había cliente/servidor disponible).

---

## 9. Detención

**Inventario cerrado para revisión funcional.**  
No se iniciará Compras / Ventas / Importaciones hasta nueva instrucción.
