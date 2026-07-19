# Base de datos — Ventas (VEN-DB)

**Pack:** `database/mysql/ventas_definitivo/`  
**Versión scripts:** incluye `11_pagos_nota_credito_id.sql`, `12_pagos_drop_referencia.sql`

Las tablas legacy `venta` / `detalle_venta` **no** son usadas por este pack.

---

## Tablas

| Tabla | Rol | PK / claves |
|-------|-----|-------------|
| `venta_clientes` | ACL identidad clientes para Ventas | `id`, `dominio_id` |
| `ventas` | Factura / Aggregate Root | `id`, UK `dominio_id`, UK `numero_factura` |
| `venta_lineas` | Líneas | FK `venta_id` |
| `pagos` | Pagos de la factura | FK `venta_id`; `forma_pago`; `nota_credito_id` opcional |
| `cambios` + detalles | Postventa | FK `venta_id` |
| `devoluciones` | Legacy rehidratación; **no** flujo nuevo | FK `venta_id` |
| `notas_credito` | NC de una factura | FK `venta_id`, `cliente_id` |
| `nota_credito_aplicaciones` | Aplicaciones a ventas destino | FK `nota_credito_id` |
| `historial_ventas` | Bitácora | FK `venta_id` |
| `venta_refs_secuencia` | Numeración | — |
| `ventas_schema_version` | Versionado scripts | — |

---

## `pagos` (estado actual)

```
forma_pago ENUM('efectivo','tarjeta','transferencia','nota_credito')
monto DECIMAL(18,0)
nota_credito_id VARCHAR(64) NULL   -- dominio_id NC
vuelto DECIMAL(18,0) NULL
```

**No existe** columna `referencia` (eliminada en script 12).

---

## `notas_credito.estado`

`emitida` | `parcialmente_aplicada` | `aplicada` | `anulada`

CHECK: `monto_aplicado <= monto`.

---

## `ventas.estado`

`emitida` | `anulada`

Flags: `tiene_cambios`, `tiene_devoluciones`, `tiene_notas_credito`, `version`.

---

## Relaciones principales

```
ventas 1──* venta_lineas
ventas 1──* pagos
ventas 1──* cambios
ventas 1──* notas_credito
notas_credito 1──* nota_credito_aplicaciones
ventas 1──* historial_ventas
```

Integración stock: **no** hay FK a `movimiento_inventario`; el vínculo es lógico vía Engine (`documento_id` / dominio venta).
