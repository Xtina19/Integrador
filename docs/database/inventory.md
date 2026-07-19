# Base de datos — Inventario (INV-DB)

**Pack:** `database/mysql/inventario_definitivo/`  
**Detalle ampliado en módulo:** [../inventory/09-base-datos.md](../inventory/09-base-datos.md) · procedimientos [../inventory/10-procedimientos-almacenados.md](../inventory/10-procedimientos-almacenados.md)

---

## Tablas núcleo (ERP alteradas)

| Tabla | Rol |
|-------|-----|
| `productos` | Catálogo; costo/precio enteros |
| `inventario` | Existencia producto×almacén + `version` |
| `almacenes` | Maestro; bloqueo por conteo |
| `movimiento_inventario` | Ledger / kardex físico |
| `transferencia` / `detalle_transferencia` | Documento TRF |

---

## Tablas de documentos (creadas por pack)

| Área | Tablas |
|------|--------|
| Ajustes | `ajuste`, `ajuste_detalle` |
| Conteos | `conteo_fisico`, `conteo_alcance_producto`, `snapshot_conteo`, `linea_conteo`, `auditoria_conteo_fisico` |
| Descartes | `descarte`, `descarte_detalle`, `descarte_evidencia` |
| Soporte | tablas de auditoría/idempotencia del pack; `inventario_schema_version` |

---

## Principios

- PK `INT UNSIGNED` + `dominio_id CHAR(36)` para UUID de aplicación.  
- FKs a catálogos ERP.  
- Un solo ledger de movimientos.  
- Scripts versionados en el pack (`00_VERSION` … `13_seed`).
