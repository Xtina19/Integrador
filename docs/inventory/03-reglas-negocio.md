# 03 — Reglas de negocio

Reglas **implementadas** en dominio (`InventoryEngine`, agregados, value objects) y reforzadas en MySQL donde aplica. No son guías genéricas: corresponden a validaciones y errores reales del código.

---

## 1. Existencias y movimientos

| Regla | Comportamiento |
|-------|----------------|
| Stock no puede ser negativo | `Saldo.subtract` / Engine → error de stock insuficiente o saldo inválido |
| Saldo entero ≥ 0 | Value object `Saldo` |
| Cantidad de movimiento > 0 (entero) | Value object `Cantidad`; el sentido (`entrada`/`salida`) es explícito |
| Concurrencia optimista | `version` en existencia y documentos; desajuste → `VERSION_CONFLICT` |
| Idempotencia en mutaciones Engine | Misma `idempotencyKey` → replay del resultado; conflicto si payload distinto |
| Actor obligatorio | Todo movimiento exige `usuarioId` |
| Documento origen obligatorio | `DocumentoOrigenRef` (tipo + id [+ línea]) |
| Producto inactivo | No se permiten movimientos sobre productos inactivos |
| Almacén bloqueado por conteo | Movimientos rechazados salvo bypass explícito del conteo dueño (`permitirAlmacenBloqueadoPorConteoId`) |

---

## 2. Tipos de movimiento (`TipoMovimiento`)

Valores del dominio:

`transferencia_salida`, `transferencia_entrada`, `descarte`, `ajuste`, `recepcion`, `venta`, `devolucion_entrada`, `compensacion`

- Entrada por sentido: `transferencia_entrada`, `recepcion`, `devolucion_entrada`
- Salida por sentido: `transferencia_salida`, `descarte`, `venta`
- `ajuste` y `compensacion` requieren sentido/objetivo explícitos en el comando Engine

---

## 3. Transferencias

| Regla | Detalle |
|-------|---------|
| Origen ≠ destino | Validado en `Transferencia.crear` |
| Al menos una línea | Cantidad solicitada entera > 0 |
| Estados válidos | `borrador → solicitada → en_transito → recibida_parcial \| recibida` (+ `cancelada` desde borrador/solicitada) |
| Despacho | Solo desde `solicitada`; copia solicitada → despachada; Engine genera salidas en origen |
| Recepción | Solo `en_transito` o `recibida_parcial`; recibida+faltante+dañada ≤ pendiente |
| Cancelación | Solo `borrador` o `solicitada` (sin stock movido) |
| **No existen** estados `aprobada` / `despachada` / `revertida` en el dominio Transferencia | La UI se alineó a este conjunto |

---

## 4. Ajustes

| Regla | Detalle |
|-------|---------|
| Líneas con `cantidadObjetivo ≥ 0` y `diferencia ≠ 0` | `Ajuste.crear` / Engine |
| Engine exige objetivo **o** diferencia de forma coherente | No ambos contradictorios |
| Ciclo | borrador → solicitado → aprobado → aplicado; también rechazado / cancelado / revertido |
| Aplicar | Solo `aprobado`; mueve stock vía `Engine.aplicarAjuste` |
| Revertir | Desde `aplicado`; Engine restaura saldo (objetivo compensatorio) e idempotencia |
| Origen documental opcional | `documentoOrigenTipo` / `documentoOrigenId` (ej. conteo) |

**Nota:** A diferencia de Descarte, `Ajuste.aprobar` **no** exige que el aprobador sea distinto del solicitante.

---

## 5. Descartes

| Regla | Detalle |
|-------|---------|
| Cada línea: cantidad > 0 y `motivoCodigo` tipificado | Catálogo / motivo obligatorio |
| Crear (flujo ERP completo) | Nace en **borrador**; **no** mueve stock |
| Aprobador ≠ solicitante | `Descarte.aprobar` |
| Aplicar | Solo `aprobado`; Engine `aplicarDescarte` (salida) |
| Revertir | Compensación / entrada vía Engine + estado `revertido` |
| Evidencias | Adjuntables en borrador (`POST …/evidencias`); no mueven stock |

---

## 6. Conteos físicos

| Regla | Detalle |
|-------|---------|
| Crear | Borrador + alcance; **no** toma snapshot ni mueve stock |
| Abrir | Solo borrador; genera snapshot; `bloqueoActivo = true` (bloquea almacén) |
| Captura | Solo `abierto` / `en_conteo`; registra cantidades contadas |
| Enviar a revisión | Todas las líneas deben estar contadas (no pendientes) |
| Clasificación | Diferencia 0 → solo `cuadra`; diferencia ≠ 0 → no puede ser `cuadra` |
| Cierre estricto | No puede quedar `investigacion`; diferencias deben estar regularizadas (ajuste/descarte aplicado y vinculado) |
| Cancelar | Solo `borrador` o `abierto`; libera bloqueo |
| Política de concurrencia | Application Service impide otro conteo activo concurrente en el mismo almacén cuando la política lo exige |

**Importante:** abrir/capturar/cerrar **no** llaman al Engine. El stock solo cambia cuando se **aplican** ajustes/descartes de regularización.

---

## 7. Dinero (Joselito)

- Moneda operativa: **DOP**.
- Costos y precios en esquema definitivo: enteros (`DECIMAL(18,0)`), **sin centavos**.
- Seeders usan costos de referencia: 650, 895, 1200, 1500, 2500, 3500.

---

## 8. Auditoría

- Toda mutación Engine genera `AuditoriaMovimiento` (`OK` / `RECHAZADO` / `ERROR`).
- Cambios de estado de documentos en MySQL disparan triggers de auditoría ligera (`trg_*_audit_estado`).
- La pestaña Auditoría permite filtrar y exportar (`GET /auditoria`, `GET /auditoria/export`).
