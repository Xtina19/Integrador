# 01 — Introducción al módulo Inventario

**Proyecto:** LibroSys (ERP Librería Joselito)  
**Módulo:** Inventario  
**Estado:** Cerrado funcionalmente — documentación oficial  
**Audiencia:** desarrolladores, analistas funcionales, QA

---

## 1. Propósito

Inventario es el **módulo de referencia** del ERP LibroSys. Concentra el control de existencias por producto y almacén, y es el único lugar donde el stock se modifica de forma controlada (a través del *Inventory Engine* en dominio y de `sp_inv_registrar_movimiento` en MySQL).

Opera en el contexto de **Librería Joselito** (República Dominicana): moneda **DOP sin centavos**, catálogo de libros y papelería, múltiples almacenes/sucursales.

---

## 2. Alcance funcional implementado

| Área | Qué incluye |
|------|-------------|
| Inventario general | Vista de productos, stock consolidado y por almacén, ficha de producto |
| Movimientos | Ledger de entradas/salidas con documento origen |
| Transferencias | Documento interno entre almacenes (subproceso de Inventario, **no** módulo aparte) |
| Conteos físicos | Ciclo completo: crear → abrir → captura → reconteo → revisión → clasificación → regularización → cerrar |
| Ajustes | Corrección de saldos con aprobación y aplicación vía Engine |
| Descartes | Baja de mercadería con evidencias, aprobación y aplicación |
| Kardex | Proyección del ledger por producto/almacén |
| Auditoría | Trazabilidad de movimientos y cambios de estado + export CSV/JSON |
| Costeo | Pantalla existente; persistencia provisional en `localStorage` (no es caso de uso de dominio) |

**Fuera de alcance de este módulo (por decisión de cierre):** Compras, Ventas e Importaciones como desarrollo nuevo. Inventario solo deja preparados tipos de movimiento (`recepcion`, `venta`, etc.) para integraciones futuras.

---

## 3. Ubicación en el repositorio

| Capa | Ruta |
|------|------|
| Frontend | `Frontend/src/modules/inventario/` |
| Rutas UI | `Frontend/src/routes/index.tsx` → `/inventario/*` |
| Backend DDD | `backend/src/modules/inventario/` |
| Montaje HTTP | `backend/src/modules/inventario/infrastructure/bootstrap/mountInventarioModule.ts` sobre Express (`backend/server.js`) |
| API base | `/api/inventario` |
| MySQL definitivo | `database/mysql/inventario_definitivo/` (versión **INV-DB-1.0.0**) |
| Docs BD / cierre | `database/docs/INVENTARIO_BD_DEFINITIVA.md`, `database/docs/INVENTARIO_CIERRE_ENTREGA.md` |

---

## 4. Principios de diseño (decisiones reales)

1. **Stock = producto × almacén.** No hay stock “global” mutable; el consolidado es suma de existencias.
2. **Solo el Inventory Engine mueve stock** en el dominio TypeScript. Crear un conteo o un descarte en borrador **no** altera existencias.
3. **Transferencias son subproceso de Inventario**, no un módulo de menú independiente.
4. **Procesos principales en páginas propias**, no en modales (crear/detalle/fases).
5. **Dominio aprobado congelado** al cierre: no se agregan estados a Transferencia fuera de `borrador | solicitada | en_transito | recibida_parcial | recibida | cancelada`.
6. **Puente MySQL ↔ dominio:** tablas con PK `INT` del ERP + columna `dominio_id CHAR(36)` para mapear UUIDs de Application Services.
7. **Runtime actual del backend Inventario:** composición in-memory + snapshot/stores JSON durables; MySQL INV-DB-1.0.0 es el esquema relacional de producción alineado al mismo modelo.

---

## 5. Cómo leer esta documentación

Orden recomendado:

1. Esta introducción  
2. Arquitectura → Modelo de dominio → Reglas de negocio  
3. Casos de uso y flujos  
4. Pantallas y API  
5. Base de datos, procedimientos, funciones/triggers/vistas, seeders  
6. Pruebas y manuales técnico/usuario  

Índice general: [`README.md`](./README.md).
