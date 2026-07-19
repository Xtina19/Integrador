# FASE GLOBAL — Estandarización monetaria del ERP

**Fecha:** 2026-07-19  
**Estándar único confirmado**

| Concepto | Tipo |
|----------|------|
| Importes / totales / precios | `DECIMAL(18,2)` |
| Costos unitarios / costeo | `DECIMAL(18,4)` |
| Tasas de cambio | `DECIMAL(18,6)` |

Prohibido: `INT`, `FLOAT`/`DOUBLE`, `DECIMAL(...,0)`, `DECIMAL(12,2)` ad-hoc.

Fuente de FX: tablas `monedas` + `tasas_cambio` (sin tasas hardcodeadas en services).

---

## 1. Campos / tablas corregidos (SQL)

| Tabla | Columnas | Antes | Después |
|-------|----------|-------|---------|
| `productos` | `costo` | `DECIMAL(12,2)` / `18,0` | **`DECIMAL(18,4)`** |
| `productos` | `precio` | `DECIMAL(12,2)` / `18,0` | **`DECIMAL(18,2)`** |
| `ventas` | `subtotal`, `total_descuentos`, `total` | `DECIMAL(18,0)` | **`DECIMAL(18,2)`** |
| `venta_lineas` | `precio_unitario`, `importe_neto` | `DECIMAL(18,0)` | **`DECIMAL(18,2)`** |
| `pagos` | `monto`, `vuelto` | `DECIMAL(18,0)` | **`DECIMAL(18,2)`** |
| `cambios` | `diferencia_monto` | `DECIMAL(18,0)` | **`DECIMAL(18,2)`** |
| `cambio_lineas` | `precio_unitario` | `DECIMAL(18,0)` | **`DECIMAL(18,2)`** |
| `devoluciones` | `monto_compensacion` | `DECIMAL(18,0)` | **`DECIMAL(18,2)`** |
| `notas_credito` | `monto`, `monto_aplicado` | `DECIMAL(18,0)` | **`DECIMAL(18,2)`** |
| `nota_credito_aplicaciones` | `monto_aplicado` | `DECIMAL(18,0)` | **`DECIMAL(18,2)`** |
| `snapshot_conteo` | `costo_referencia` | `DECIMAL(18,0)` | **`DECIMAL(18,4)`** |
| `descarte_detalle` | `costo` | `DECIMAL(18,0)` | **`DECIMAL(18,4)`** |
| Funciones/procs Inventario | `fn_inv_valor_existencia`, `v_costo` | `18,0` | **`18,2` / `18,4`** |

**Ya alineados (sin cambio de tipo):** Compras (`orden_compra`, detalles, `factura_proveedor`, recepciones), Importaciones (`factura_internacional`, `costos_embarque`, `costeo_libro`), `tasas_cambio.tasa`.

**Migración runtime:** `database/mysql/estandar_monetario/01_migrate_money_types.sql` (aplicada en BD local: `productos.costo/precio` verificados).

---

## 2. Models / domain actualizados

| Artefacto | Cambio |
|-----------|--------|
| `backend/src/modules/ventas/domain/value-objects/Dinero.ts` | Deja de exigir DOP entero; redondea a **2 decimales** (`roundMoney`) |
| Packs SQL `ventas_definitivo/*`, `inventario_definitivo/*` | DDL alineado al estándar |
| `maestros/00_bootstrap_local.sql` | `productos` `18,4` / `18,2` |

---

## 3. DTOs / API / Services

| Área | Cambio |
|------|--------|
| `backend/services/compras/tasaCambio.resolve.js` | **Nuevo** — resuelve tasa desde `tasas_cambio` |
| `ordenCompra.service.js` / `facturaProveedor.service.js` | Ya no usan `tasaCambio ?? 1`; consultan catálogo |
| Validators OC / FP | `tasaCambio` opcional (undefined → resolve en service) |
| APIs afectadas | `POST/PUT /api/compras/ordenes`, `POST/PUT /api/compras/facturas` |
| Seed tasas | EUR→DOP `63.2`, COP→DOP si faltaban |

**Evidencia resolve:** `DOP→1`, `USD→58.5`, `EUR→63.2`.

---

## 4. Frontend / formularios

| Archivo | Ajuste |
|---------|--------|
| `Frontend/src/lib/money.ts` | **Nuevo** — `roundMoney`, `loadMonedas`, `monedaIdFromCode`, `resolveTasaCambio` vía API |
| `comprasMappers.ts` | Deja de hardcodear IDs 1/2/3 como única fuente |
| `ERPProvider.tsx` | Envía `tasaCambio` resuelta desde `tasas_cambio` |
| `ventasUi.formatDop` | Muestra 2 decimales |
| `POSPage.tsx` | `roundMoney` en montos; input monto `step=0.01` |
| Factura proveedor, FI importaciones, productos admin/inventario, presupuesto eventos | `step=0.01` / `0.0001` en costos |

---

## 5. Inconsistencias que existían

1. **Split Ventas/Inventario `DECIMAL(18,0)` vs Compras `DECIMAL(18,2)`** — unificado a `18,2` / `18,4`.
2. **`productos` en bootstrap `DECIMAL(12,2)`** — corregido.
3. **Compras internacional con `tasaCambio = 1` silencioso** — corregido (lookup + error si no hay tasa).
4. **IDs de moneda hardcodeados en FE** — sustituidos por catálogo `monedas` (+ fallback temporal).
5. **Formularios sin `step` decimal** — ajustados.
6. **FLOAT/DOUBLE / INT para dinero** — no había en SQL activo; confirmado ausente.

---

## 6. Confirmación

El ERP queda con **un único estándar monetario** documentado en:

- `database/mysql/estandar_monetario/00_ESTANDAR.md`
- Packs DDL Ventas / Inventario / Compras / maestros alineados
- Dominio Ventas (`Dinero`) y UI Ventas/Compras coherentes con 2 decimales
- Conversiones de moneda obtenidas del sistema de monedas del ERP (`/api/monedas`, `/api/tasas-cambio`)

**Nota operativa:** reiniciar el Backend (`cd backend && npm run start`) para cargar los services actualizados de tasa de cambio.
