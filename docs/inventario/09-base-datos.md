# 09 — Base de datos (MySQL INV-DB-1.0.0)

Documentación del esquema **definitivo** del módulo Inventario.

**Paquete:** `database/mysql/inventario_definitivo/`  
**Versión:** `INV-DB-1.0.0`  
**Documento ampliado:** `database/docs/INVENTARIO_BD_DEFINITIVA.md`  
**Instalación:** `install_inventario_definitivo.sql` o vía `install_all.sql`

---

## 1. Principios físicos

1. PK `INT UNSIGNED` + FKs al ERP (`productos`, `almacenes`, `usuarios`, `sucursales`).
2. Columna `dominio_id CHAR(36) NULL UNIQUE` para mapear UUIDs de Application Services.
3. Dinero DOP **sin centavos** (`DECIMAL(18,0)` en costo/precio).
4. Un solo ledger: `movimiento_inventario` (Kardex = vista).
5. Versionado de scripts en `inventario_schema_version`.

---

## 2. Tablas del núcleo (alteradas)

| Tabla | Rol | Cambios clave INV-DB |
|-------|-----|----------------------|
| `productos` | Catálogo | `costo`/`precio` DECIMAL(18,0) |
| `inventario` | Existencia producto×almacén | `version`, bloqueo conteo, `dominio_id` |
| `almacenes` | Maestro | espejo `bloqueado_por_conteo` |
| `movimiento_inventario` | Ledger | tipos dominio, `saldo_anterior`, `sentido`, `idempotency_key`, `documento_*` |
| `transferencia` / `detalle_transferencia` | Documento TRF | estados dominio; despachada/faltante/dañada |

---

## 3. Tablas de documentos (creadas)

### Ajustes
- `ajuste` — cabecera (estados y tipos del dominio)
- `ajuste_detalle` — líneas (`cantidad_objetivo`, `diferencia`, `motivo_codigo`, `linea_conteo_id`)

### Conteos
- `conteo_fisico` — cabecera (**no** “sesión”)
- `conteo_alcance_producto` — alcance en fase Crear
- `snapshot_conteo` — teórico al Abrir
- `linea_conteo` — captura/clasificación/regularización
- `auditoria_conteo_fisico` — bitácora del caso

### Descartes
- `descarte` — cabecera con `solicitante_id`/`aprobador_id` (sin tabla aprobación separada)
- `descarte_detalle` — líneas + `costo` entero + `motivo_codigo`
- `descarte_evidencia` — soporte documental
- Orígenes tipados: `conteo_origen_id`, `ajuste_origen_id`, `transferencia_origen_id`, `movimiento_origen_id`, `kardex_origen_id`

### Soporte
- `auditoria_inventario`
- `inventario_idempotencia`
- `cat_motivo_descarte`, `cat_motivo_ajuste`, `cat_clasificacion_conteo`
- `inventario_schema_version`

---

## 4. Tablas eliminadas (redundantes)

En `01_cleanup_redundante.sql`:

- Legado conteo 18: `detalle_conteo_fisico`, `conteo_fisico` (viejo)
- Transicional 22: `conteo_fisico_sesion` (+ satélites previos)
- `ajuste_inventario`
- `descarte_sesion`, `descarte_aprobacion` (y recreación limpia de descarte)

Scripts 22–26 quedan **DEPRECATED** / archivados en `database/mysql/archive/`.

---

## 5. Modelo lógico

```
productos ──┐
almacenes ──┼── inventario (existencia)
usuarios  ──┘
              │
              ├── movimiento_inventario ◄── auditoria_inventario
              │
              ├── transferencia ── detalle_transferencia
              ├── ajuste ── ajuste_detalle
              ├── conteo_fisico ── alcance / snapshot / linea
              └── descarte ── detalle / evidencia
```

---

## 6. Constraints destacados

- `inventario`: UNIQUE `(producto_id, almacen_id)`, `stock >= 0`, `version >= 1`
- `transferencia`: origen ≠ destino; estados dominio
- `detalle_transferencia`: despachada ≤ solicitada; recibida+faltante+dañada ≤ despachada
- `ajuste_detalle`: `diferencia <> 0`, `cantidad_objetivo >= 0`
- `descarte_detalle`: `cantidad > 0`, `costo >= 0`
- Códigos de documento UNIQUE; `dominio_id` UNIQUE cuando presente
- `inventario_idempotencia.key` PK

---

## 7. Orden de scripts

`00_VERSION` → `01_cleanup` → `02_catalogos` → `03_existencias_movimientos` → `04_transferencias` → `05_ajustes` → `06_conteos` → `07_descartes` → `08_auditoria_idempotencia` → `09_funciones` → `10_procedimientos` → `11_triggers` → `12_vistas_indices` → `13_seed_joselito`

---

## 8. Relación con el runtime Node

El servidor Inventario DDD opera hoy con **memoria + JSON durables**. El esquema MySQL es el modelo de producción alineado al dominio; no sustituye por sí solo el composition root TypeScript hasta que exista un adaptador MySQL cableado (fuera del alcance de esta documentación de cierre).
