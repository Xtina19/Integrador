# 10 — Procedimientos almacenados

Fuente: `database/mysql/inventario_definitivo/10_procedimientos.sql`  
Versión: **INV-DB-1.0.0**

Los `sp_inv_*` implementan en SQL los mismos casos de uso del módulo (máquina de estados + mutación de stock centralizada).

---

## 1. Núcleo de mutación

### `sp_inv_registrar_movimiento`

Responsabilidad análoga al Inventory Engine en SQL:

- Bloquea fila de `inventario` (`FOR UPDATE`)
- Valida stock / bloqueo de almacén
- Actualiza `stock` y `version`
- Inserta `movimiento_inventario` con `saldo_anterior` / `saldo_posterior` / `sentido`
- Registra `auditoria_inventario`
- Respeta `idempotency_key` vía `inventario_idempotencia`

### `sp_actualizar_inventario`

Wrapper de compatibilidad para triggers/procesos legados de Ventas/Recepciones (ENUM y columnas nuevas). **No** es la API preferida del módulo Inventario; usar `sp_inv_registrar_movimiento`.

---

## 2. Transferencias

| Procedimiento | Caso de uso |
|---------------|-------------|
| `sp_inv_crear_transferencia` | Alta documento + líneas |
| `sp_inv_solicitar_transferencia` | borrador → solicitada |
| `sp_inv_despachar_transferencia` | solicitada → en_transito + salidas Engine-SQL |
| `sp_inv_recibir_transferencia` | recepción (parcial/total) + entradas |
| `sp_inv_cancelar_transferencia` | cancelación sin stock movido |

---

## 3. Ajustes

| Procedimiento | Caso de uso |
|---------------|-------------|
| `sp_inv_crear_ajuste` | Cabecera + detalle JSON/líneas |
| `sp_inv_solicitar_ajuste` | borrador → solicitado |
| `sp_inv_rechazar_ajuste` | → rechazado |
| `sp_inv_cancelar_ajuste` | → cancelado |
| `sp_inv_aprobar_ajuste` | → aprobado |
| `sp_inv_aplicar_ajuste` | → aplicado + movimientos |
| `sp_inv_revertir_ajuste` | → revertido + compensación |

---

## 4. Descartes

| Procedimiento | Caso de uso |
|---------------|-------------|
| `sp_inv_crear_descarte` | Borrador / documento |
| `sp_inv_solicitar_descarte` | → solicitado |
| `sp_inv_rechazar_descarte` | → rechazado |
| `sp_inv_cancelar_descarte` | → cancelado |
| `sp_inv_aprobar_descarte` | → aprobado (reglas de actor) |
| `sp_inv_aplicar_descarte` | → aplicado + salida |
| `sp_inv_revertir_descarte` | → revertido + compensación |

---

## 5. Conteos

| Procedimiento | Caso de uso |
|---------------|-------------|
| `sp_inv_crear_conteo` | Borrador + alcance |
| `sp_inv_abrir_conteo` | Snapshot + bloqueo almacén |
| `sp_inv_registrar_linea_conteo` | Captura cantidad |
| `sp_inv_enviar_revision_conteo` | → en_revision |
| `sp_inv_clasificar_linea_conteo` | Clasificación diferencia |
| `sp_inv_cerrar_conteo` | Cierre estricto + liberar bloqueo |
| `sp_inv_cancelar_conteo` | Cancelar + liberar bloqueo |

Los conteos **no** deben alterar stock dentro de estos SPs de ciclo; el stock cambia al aplicar ajuste/descarte de regularización (vía `sp_inv_aplicar_*` / `sp_inv_registrar_movimiento`).

---

## 6. Convenciones de implementación

- Uso de `DELIMITER $$` en el script de instalación.
- Validación de estado actual antes de transicionar (señales `SQLSTATE '45000'`).
- Incremento de `version` en documentos.
- Preferencia por transacciones dentro del SP para operaciones multi-tabla.
- El seeder Joselito (`13_seed_joselito.sql`) invoca estos procedimientos para generar documentos de ejemplo (evidencia de punta a punta).

---

## 7. Relación con el backend TypeScript

| Capa | Mutación stock |
|------|----------------|
| Node DDD | `InventoryEngine` vía Application Services |
| MySQL | `sp_inv_registrar_movimiento` vía `sp_inv_*` de aplicación |

Ambas capas implementan la **misma política**; no deben usarse en paralelo sobre el mismo almacén sin un adaptador único (riesgo de doble fuente de verdad). En el despliegue actual de desarrollo Node, la fuente operativa del módulo DDD es memoria/JSON; MySQL es el esquema de producción documentado.
