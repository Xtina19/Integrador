# LibroSys — Compras DEFINITIVO (COM-DB-1.0.0)

Paquete MySQL 8 del módulo **Compras**, alineado a `backend/models/compras`.

## Prerrequisitos

1. Base LibroSys instalada (`database/mysql/install_all.sql` o scripts `01`–`12`).
2. Tabla `productos` disponible (`05_inventario.sql`).
3. Usuarios, monedas, sucursales, almacenes y proveedores del seed base.

## Instalación

**Opción A** — desde `database/mysql/compras_definitivo`:

```bash
cd database/mysql/compras_definitivo
mysql -u root -p librosys < install.sql
```

**Opción B** — desde `database/mysql`:

```bash
mysql -u root -p librosys < install_compras_definitivo.sql
```

## Contenido

| Script | Descripción |
|--------|-------------|
| `00_VERSION.sql` | Registro de versión COM-DB-1.0.0 |
| `01_cleanup.sql` | Elimina tablas legado de Compras (no toca Importaciones) |
| `02`–`09` | DDL tablas alineadas al backend Express |
| `10_indices.sql` | Índices compuestos |
| `11_seed_joselito.sql` | Datos demo Librería Joselito (OC → REC → FP) |
| `12_seed_importaciones_bridge.sql` | FI / embarque / recepción INT (tras seed Compras) |

## Instalación en `install_all.sql`

Orden canónico:

1. `install_compras_schema.sql` (esquema, sin seed) — después de `05_inventario.sql`
2. `12_seed.sql` (maestros / productos; sin documentos Compras legacy)
3. `11_seed_joselito.sql`
4. `12_seed_importaciones_bridge.sql`

## Notas

- `01_cleanup.sql` **reemplaza** el esquema de `04_compras.sql` (stub DEPRECATED).
- La tabla `recepcion` incluye columnas `factura_internacional_id` y `embarque_id` (nullable) para compatibilidad con Importaciones; las FKs las añade `06_importaciones.sql` si aplica.
- Órdenes **internacionales** no llevan `factura_proveedor` en Compras; ese flujo lo gestiona Importaciones.
- Inventario por recepción: `backend/services/compras/_inventoryPort.js` (no trigger legacy).

## FASE 8 — Integridad y autorización

- CHECK: `tasa_cambio > 0`, numeración año/último, `dias_credito >= 0` (`13_integridad_fase8.sql`).
- Auditoría: `created_by` / `updated_by` / timestamps en mutaciones (incl. anular FP y setEstado condición).
- Auth crítica: `middlewares/comprasAuth.js` (roles ADMIN | COMPRAS).
- Bridge Importaciones: documentado en `backend/services/compras/_importacionesBridge.js`; FKs FI/embarque siguen en `06_importaciones.sql`.

## Verificación

```sql
USE librosys;
SELECT * FROM compras_schema_version ORDER BY applied_at;
SELECT codigo, estado, total FROM orden_compra ORDER BY id;
SELECT codigo, estado FROM recepcion ORDER BY id;
SELECT codigo, estado_pago, total FROM factura_proveedor ORDER BY id;
```

Flujo documental esperado en seed:

- `OC-2026-000001` (recibida) → `REC-2026-000001` (confirmada) → `FP-2026-000001` (pagada)
- `OC-INT-2026-000004` (aprobada) → FI/embarque vía Importaciones → `REC-INT-2026-000002` (borrador)
