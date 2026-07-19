# FASE 9 — Transacciones, concurrencia y rendimiento (Compras)

Fecha: 2026-07-19. Sin cambios de reglas de negocio.

## 1. Operaciones protegidas por transacción

Patrón: `withTransaction` en `backend/services/compras/_internal.js`
(`BEGIN` → trabajo + `audit(…, conn)` → `COMMIT` | `ROLLBACK`).

| Operación | Service | Tablas en la misma TX |
|-----------|---------|------------------------|
| Crear OC | `ordenCompra.crear` | numeracion, orden_compra, detalle_orden_compra, auditoría |
| Actualizar OC | `ordenCompra.actualizar` | orden_compra, detalle (replace), auditoría |
| Enviar / aprobar / cancelar / cerrar | `ordenCompra.*` | orden_compra (+ lectura recepciones en cancelar), auditoría |
| Crear recepción | `recepcion.crear` | numeracion, recepcion, detalle_recepcion, auditoría |
| Actualizar recepción | `recepcion.actualizar` | recepcion, detalle, auditoría |
| Confirmar recepción | `recepcion.confirmar` | recepcion, orden_compra (recalcular), inventario port, auditoría |
| Anular recepción | `recepcion.anular` | recepcion, orden_compra (recalcular), auditoría |
| Registrar FP | `facturaProveedor.registrar` | numeracion, factura_proveedor, detalle, auditoría |
| Actualizar / anular FP | `facturaProveedor.*` | factura (+ detalle en update), auditoría |
| Condiciones pago | `condicionesPago.*` | condiciones_pago, auditoría |

## 2. Concurrencia — numeración

Mecanismo en `numeracionDocumentos.repository.lockAndIncrement`:

1. `ensureRow` — INSERT si no existe; **tolera carrera** con UNIQUE `(tipo_documento, anio)`.
2. `SELECT … FOR UPDATE` — bloqueo de fila en la TX del caller.
3. `UPDATE ultimo_numero = ultimo_numero + 1`.
4. Formato de negocio en service: `TYPE-YYYY-######`.

Resultado: no se emiten códigos duplicados bajo solicitudes simultáneas.

## 3. Optimizaciones de rendimiento

| Área | Acción |
|------|--------|
| Backend listados | Sin cambio (ya cabecera + paginación LIMIT/OFFSET; sin N+1) |
| Índices | Sin cambio (cubiertos por `10_indices.sql` + FASE 8) |
| Numeración | Endurecimiento de carrera en `ensureRow` (FASE 9) |
| FE `comprasLoader` | Eliminado N+1 `getOrden`/`getRecepcion` por fila; 4 llamadas en paralelo |

## 4. Documentación técnica

- `guia/05_modulos/Compras.md` — arquitectura, endpoints, tablas, flujo, estados, integraciones.
- Este archivo — evidencia FASE 9.

## 5. Evidencia de no cambio funcional

- No se alteraron validators de dominio ni transiciones de estado.
- No se fusionaron documentos OC / REC / FP.
- No se cambió el contrato de negocio de Importaciones ni Inventario.
- Únicos cambios de código: resiliencia de numeración + hidratación FE más eficiente.
