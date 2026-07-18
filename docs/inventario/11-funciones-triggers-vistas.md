# 11 — Funciones, triggers y vistas

Fuentes:

- Funciones: `inventario_definitivo/09_funciones.sql`
- Triggers: `inventario_definitivo/11_triggers.sql`
- Vistas e índices: `inventario_definitivo/12_vistas_indices.sql`

---

## 1. Funciones

| Función | Firma / rol |
|---------|-------------|
| `fn_inv_estado_stock(stock, minimo)` | Devuelve `normal` \| `bajo` \| `agotado` |
| `fn_inv_sentido_movimiento(tipo)` | Mapea `TipoMovimiento` → `entrada` \| `salida` |
| `fn_inv_valor_existencia(producto_id, almacen_id)` | `stock * costo` (DOP entero) |
| `fn_inv_uuid()` | Genera UUID para poblar `dominio_id` |

---

## 2. Triggers

### Existencias

| Trigger | Evento | Propósito |
|---------|--------|-----------|
| `trg_inventario_estado_stock_insert` | BEFORE INSERT `inventario` | Deriva `estado_stock` |
| `trg_inventario_estado_stock` | BEFORE UPDATE `inventario` | Recalcula `estado_stock` según `stock` y `stock_minimo` |

### Auditoría de cambio de estado (ligera)

| Trigger | Tabla | Propósito |
|---------|-------|-----------|
| `trg_ajuste_audit_estado` | `ajuste` | AFTER UPDATE si cambia `estado` → `auditoria_inventario` |
| `trg_transferencia_audit_estado` | `transferencia` | Idem |
| `trg_descarte_audit_estado` | `descarte` | Idem |
| `trg_conteo_audit_estado` | `conteo_fisico` | Idem |

**Decisión de diseño:** estos triggers **no** mueven stock. Evitan doble aplicación cuando el SP ya registró el movimiento. Solo aportan trazabilidad de workflow documental.

---

## 3. Vistas operativas

| Vista | Uso |
|-------|-----|
| `v_inv_existencias` | Inventario general: producto, almacén, stock, valor |
| `v_inv_kardex` | Ledger con documento origen y nombres |
| `v_inv_auditoria` | Línea de tiempo de auditoría Inventario |
| `v_inv_transferencias_activas` | TRF no terminales |
| `v_inv_conteos_abiertos` | Conteos en curso |
| `v_inv_ajustes_pendientes` | Ajustes pendientes de ciclo |
| `v_inv_descartes_pendientes` | Descartes pendientes |
| `v_inv_dashboard_kpis` | Totales / pendientes / actividad |

### Alias de compatibilidad

| Alias | Apunta a |
|-------|----------|
| `v_inventario_existencias` | `v_inv_existencias` |
| `v_kardex_documento` | `v_inv_kardex` |
| `v_auditoria_inventario` | `v_inv_auditoria` |

Equivalentes conceptuales en runtime Node: métodos de `InventoryQueryService`.

---

## 4. Índices de reporte (resumen)

Definidos/ampliados en `12_vistas_indices.sql`, orientados a:

- `(producto_id, almacen_id)` existencias
- `(almacen_id, estado)` documentos
- `(fecha_movimiento, tipo_movimiento)` kardex temporal
- `(documento_tipo, documento_id)` navegación origen
- `(usuario_id, fecha)` auditoría
- UNIQUE `idempotency_key`, `dominio_id`, códigos de documento

---

## 5. Qué no se implementó (a propósito)

- Triggers que vuelvan a llamar `sp_inv_registrar_movimiento` en INSERT de detalle (evitar bucles).
- Tabla física `kardex` duplicada (Kardex = vista/proyección).
- Tabla `descarte_aprobacion` (fusionada en cabecera).
