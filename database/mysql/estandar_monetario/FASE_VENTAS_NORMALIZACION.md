# FASE GLOBAL — Normalización monetaria, datos reales y limpieza UI (Ventas)

**Fecha:** 2026-07-19  
**Alcance:** Ventas (+ textos técnicos Compras visibles) · Sin cambios de reglas de negocio.

---

## 1. Estándar monetario (mismo que Compras)

| Capa | Estándar |
|------|----------|
| BD | `DECIMAL(18,2)` importes · `DECIMAL(18,4)` costos · `DECIMAL(18,6)` tasas |
| Backend | `Dinero` con 2 decimales; tasas vía `tasas_cambio` |
| Frontend | **`formatMoney` / `formatDop`** en `@/lib/money.ts` — siempre 2 decimales |

Ejemplos: `RD$ 15,250.50` · `US$ 350.75` · `€ 1,280.00`

---

## 2. Helpers centralizados

| Helper | Ubicación |
|--------|-----------|
| `formatMoney(amount, currency)` | `Frontend/src/lib/money.ts` |
| `formatDop(amount)` | reexporta `formatMoney(..., 'DOP')` |
| `roundMoney` | mismo archivo |
| `ventasUi.formatDop` | delega al helper central |
| Admin `clientesUi.formatDop` | 2 decimales (antes 0) |

---

## 3. Componentes actualizados (formateo)

- `VentasCommercialDashboard`
- `SaleRecordDialog`, `CreditNoteRecordDialog`, `SaleExchangeDialog`
- POS / listados / detalle / NC (ya usaban `formatDop`; ahora centralizado)
- Eliminado `toLocaleString()` crudo en diálogos legacy

---

## 4. Lugares con inconsistencias (antes)

| Problema | Dónde | Estado |
|----------|-------|--------|
| Sin 2 decimales fijos / `toLocaleString` | Diálogos Sale/NC/Exchange | Corregido |
| Admin clientes `maximumFractionDigits: 0` | `clientesUi.ts` | Corregido → 2 |
| Ticket promedio con `Math.round` | Dashboard | `roundMoney` |
| Textos “quemados” en Ventas services | — | N/A (Ventas no convierte FX en services) |

No se hallaron importes con **tres** decimales visibles en UI Ventas; el riesgo era formato inconsistente (0 / variable).

---

## 5. Textos técnicos eliminados

| Antes | Después |
|-------|---------|
| Acumulado mes en curso **(BD)** | Acumulado del mes |
| Cargando… desde la **base de datos** | Cargando datos de Compras… |
| Datos desde **base de datos** | Registro de facturas |
| Error en **API** de ventas/compras | No se pudo completar la operación… |
| **Inventory Engine** | Movimientos de inventario… |
| `tipo:id` en documento | Etiqueta legible (Factura / Cambio / NC) |
| Orden no sincronizada con la **base de datos** | Orden no sincronizada. Recargue… |

---

## 6. Datos reales insertados (seed in-memory + SQL catálogo)

### Clientes
Colegio La Salle, Instituto Iberia, PUCMM, UTESA, Colegio Sagrado Corazón, Librería Universitaria, Fundación Madre y Maestra, Cliente de Mostrador.

### Productos (mismo catálogo Compras — no duplicados)
Cien años de soledad, La sombra del viento, Don Quijote, El Principito, Hábitos Atómicos, Padre Rico Padre Pobre, Clean Code, Harry Potter, One Piece, Naruto, Jujutsu Kaisen, 1984 — **precios DOP del maestro Compras**.

### Ventas sembradas (runtime in-memory)
| Escenario | Pago | Estado |
|-----------|------|--------|
| Mostrador hoy | Efectivo (+ vuelto) | Emitida |
| PUCMM hoy | Mixto transferencia+tarjeta | Emitida |
| La Salle | Transferencia | Emitida |
| Santiago manga | Tarjeta | Emitida |
| Clean Code | Tarjeta | **Anulada** |
| Fundación | Efectivo | Emitida |
| Instituto Iberia | Transferencia **USD** | Emitida |

Archivos: `seedVentasJoselito.ts`, `posCatalog.ts`, `ensureVentasStockCatalog.ts`, `ventas_definitivo/10_seed_joselito.sql`.

---

## 7. Dashboard

KPIs de negocio (sin jerga técnica):

- Ventas hoy  
- Ventas del mes  
- Ticket promedio  
- Clientes atendidos  
- Ventas por sucursal  
- Ventas por moneda  

---

## 8. Integración con Compras

- POS e Inventario Engine usan los **mismos títulos/precios** del maestro productos Compras.  
- SQL `ventas_ref_catalogo` mapea `prod-*` → `productos.id` ERP (PRD-001…).  
- No se crearon productos distintos solo para Ventas.

---

## 9. Confirmación

Ventas utiliza el **mismo estándar monetario** que Compras (`DECIMAL(18,2)` + formateo central a 2 decimales + monedas DOP/USD/EUR preparadas).

**Importante:** reiniciar el Backend (`cd backend && npm run start`) para cargar el seed de ventas actualizado en memoria.
