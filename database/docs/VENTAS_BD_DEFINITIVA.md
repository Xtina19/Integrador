# Base de Datos Definitiva — Módulo Ventas (VEN-DB-1.0.0)

**Fecha:** 2026-07-18  
**Versión de esquema:** `VEN-DB-1.0.0`  
**Alcance:** únicamente persistencia del BC Ventas. Sin Controllers, REST ni Frontend.  
**Alineación:** VEN-ARCH · VEN-DATA · VEN-RULES-2.0.0 · VEN-UC-2.0.0 · VEN-DOM-2.0.0 · Backend / Infraestructura aprobados · Design System (sin UI en esta fase).

---

## 1. Objetivo

Modelo físico MySQL definitivo para el Aggregate Root `Venta` (factura central), con hijos de línea, pago, cambio, devolución, nota de crédito e historial. La BD es **solo mecanismo de persistencia**: invariantes y reglas permanecen en el dominio TypeScript.

---

## 2. Modelo físico

```
venta_clientes
ventas_ref_catalogo          (dominio_id ↔ ERP INT)
ventas_secuencia_factura
ventas_schema_version

ventas  (= Aggregate Root / factura)
  ├── venta_lineas
  ├── pagos
  ├── cambios
  │     └── cambio_lineas (devuelta | nueva)
  ├── devoluciones
  │     └── devolucion_lineas
  ├── notas_credito
  │     └── nota_credito_aplicaciones
  └── historial_ventas
```

### 2.1 Identificadores

| Capa | Identificador |
|------|----------------|
| MySQL / ERP | `INT UNSIGNED AUTO_INCREMENT` + FKs |
| Dominio | `dominio_id` (UUID en documentos) + `*_dominio_id` en FKs lógicas |
| Puente | `ventas_ref_catalogo (tipo, dominio_id) → erp_id` |

### 2.2 Dinero

Montos operativos: **`DECIMAL(18,0)`** — DOP sin centavos (VEN-DATA).

### 2.3 Tablas pedidas (nombres conceptuales)

| Conceptual | Física |
|------------|--------|
| ventas | `ventas` |
| venta_lineas | `venta_lineas` |
| pagos | `pagos` |
| cambios | `cambios` + `cambio_lineas` |
| devoluciones | `devoluciones` + `devolucion_lineas` |
| notas_credito | `notas_credito` + `nota_credito_aplicaciones` |
| historial_ventas | `historial_ventas` |

Soportes: `venta_clientes`, `ventas_ref_catalogo`, `ventas_secuencia_factura`.

### 2.4 Restricciones

- **PK / UNIQUE:** `id`, `dominio_id`, `numero_factura`
- **FK:** sucursales, almacenes, usuarios, productos, venta_clientes, ventas
- **CHECK:** totales ≥ 0, cliente según tipo_venta, anulación con motivo, montos de línea/pago/NC
- **ENUM:** estados y formas alineados al dominio

### 2.5 Índices (VEN-UC)

- `idx_ventas_sucursal_estado_fecha`, `idx_ventas_estado_fecha`, prefijo de número
- `idx_pagos_venta_forma`, historial por venta+fecha
- Flags postventa (`tiene_cambios`, …)

---

## 3. Paquete de scripts

Ubicación: `database/mysql/ventas_definitivo/`

| Script | Contenido |
|--------|-----------|
| `00_VERSION.sql` | `ventas_schema_version` |
| `01_clientes.sql` | `venta_clientes` |
| `01b_refs_secuencia.sql` | puente + secuencia factura |
| `02_ventas.sql` | raíz `ventas` |
| `03_venta_lineas.sql` | líneas |
| `04_pagos.sql` | pagos |
| `05_cambios.sql` | cambios + líneas |
| `06_devoluciones.sql` | devoluciones + líneas |
| `07_notas_credito.sql` | NC + aplicaciones |
| `08_historial_ventas.sql` | historial |
| `09_indices.sql` | índices UC |
| `10_seed_joselito.sql` | seed Librería Joselito |

Instaladores:

- `database/mysql/install_ventas_definitivo.sql`
- `database/mysql/install_all.sql` (incluye el paquete)

**No** se usan las tablas legado `venta` / `detalle_venta` de `07_ventas.sql`.

---

## 4. Seed Joselito

- Clientes: Colegio La Salle, PUCMM, UTESA, María González
- Puente `prod-cien` → PRD-001, `usr-cajero` → USR-001, `suc-central` / `alm-central`, etc.
- Dos facturas de ejemplo (CF y cliente registrado) con pagos e historial
- Montos enteros DOP (p. ej. 1200, 895)

---

## 5. Repositorio TypeScript (infraestructura)

Sin tocar Dominio / Application / Aggregate:

| Pieza | Rol |
|-------|-----|
| `SqlExecutor` | Contrato SQL intercambiable |
| `MysqlSqlExecutor` | Adaptador `mysql2` |
| `VentasCatalogBridge` | dominio_id ↔ INT |
| `MysqlVentaRowMapper` | filas ↔ `VentaRecord` |
| `MysqlVentaRepository` | `VentaRepository` definitivo |
| Mappers existentes | `VentaRecord` ↔ dominio vía `VentaFactory` / `Venta.rehidratar` |

Composition:

```ts
const sql = new MysqlSqlExecutor({ host, user, password, database: 'librosys' })
const app = createVentasComposition({ sql, seedJoselito: true })
```

Existencias: **solo** `InventarioEfectosPort` (sin triggers de stock en este pack).

---

## 6. Fuera de alcance (siguiente fase)

- Controllers / APIs REST  
- Frontend  
- Sustitución del Engine de Inventario real (el adaptador actual puede seguir in-memory)

---

## 7. Criterios de aceptación

- [x] Modelo físico + PKs / FKs / CHECK / UNIQUE / índices  
- [x] Scripts de creación + seed Joselito  
- [x] `MysqlVentaRepository` + mappers fila↔record↔dominio  
- [x] Dominio / AR / Application sin cambios de invariantes  
- [x] Sin Controllers / REST / Frontend  
