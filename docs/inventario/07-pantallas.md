# 07 — Pantallas

UI real del módulo en `Frontend/src/modules/inventario/` y rutas en `Frontend/src/routes/index.tsx`.

---

## 1. Shell principal

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/inventario` | `Inventory.tsx` | Dashboard + 8 tabs; query `?tab=` |

**Tabs:** `general`, `movimientos`, `transferencias`, `conteos`, `ajustes`, `descartes`, `kardex`, `auditoria`

**CTAs del header (implementados):** Nuevo producto, Nueva transferencia, Crear conteo, Nuevo descarte, Nuevo ajuste, Costeo.

---

## 2. Crear (páginas completas)

| Ruta | Página | Persistencia |
|------|--------|--------------|
| `/inventario/nuevo` | `NuevoProductoPage` | Flujo producto (ERP store / admin según implementación de la página) |
| `/inventario/transferencias/nuevo` | `NuevaTransferenciaPage` | `transferenciasApi.crear` |
| `/inventario/ajustes/nuevo` | `NuevoAjustePage` | `ajustesApi.crear` |
| `/inventario/conteos/nuevo` | `NuevoConteoPage` | `conteosApi.crear` |
| `/inventario/descartes/nuevo` | `NuevoDescartePage` | `descartesApi.crear` |
| `/inventario/costeo/nuevo` | `NuevoCosteoPage` | `localStorage` provisional |

---

## 3. Detalle y workflow

| Ruta | Página | Acciones típicas |
|------|--------|------------------|
| `/inventario/transferencias/:id` | `DetalleTransferenciaPage` | Solicitar, cancelar, despachar |
| `/inventario/transferencias/:id/recepcion` | `RecepcionTransferenciaPage` | Recibir parcial/completa |
| `/inventario/ajustes/:id` | `DetalleAjustePage` | Solicitar, aprobar, aplicar, rechazar, cancelar, revertir |
| `/inventario/descartes/:id` | `DetalleDescartePage` | Evidencias, solicitar, aprobar/rechazar, aplicar, cancelar, revertir |
| `/inventario/conteos/:id` | `DetalleConteoPage` | Abrir, navegar fases, cerrar/cancelar |
| `/inventario/conteos/:id/captura` | `CapturaConteoPage` | Registrar cantidades |
| `/inventario/conteos/:id/reconteo` | `ReconteoConteoPage` | Iniciar/capturar reconteo |
| `/inventario/conteos/:id/revision` | `RevisionConteoPage` | Enviar a revisión / ver diferencias |
| `/inventario/conteos/:id/clasificacion` | `ClasificacionConteoPage` | Clasificar líneas |
| `/inventario/conteos/:id/regularizacion` | `RegularizacionConteoPage` | Vincular ajuste/descarte |
| `/inventario/productos/:id` | `FichaProductoPage` | Stock por almacén, accesos |
| `/inventario/movimientos/:id` | `DetalleMovimientoPage` | Ver hecho + ir a documento |
| `/inventario/kardex/:productoId` | `DetalleKardexPage` | Líneas kardex del producto |
| `/inventario/auditoria/:id` | `DetalleAuditoriaPage` | Detalle de evento |

---

## 4. Comportamiento de tabs

| Tab | Origen de datos | Botones principales |
|-----|-----------------|---------------------|
| General | API productos (+ mock fallback) | Ficha, Kardex, último movimiento |
| Movimientos | API | Abrir detalle / documento |
| Transferencias | API | Nueva, Detalle |
| Conteos | API | Crear, Gestión (detalle/fases) |
| Ajustes | API | Nuevo, Historial/Detalle |
| Descartes | API | Crear, Gestionar/Detalle |
| Kardex | API | Abrir línea / documento |
| Auditoría | API | Filtros (usuario, documento, acción, IP, fecha, resultado) + Export CSV |

`openDocumento(tipo, id)` en el shell navega a la ruta de detalle correspondiente (ya no es solo toast).

---

## 5. Convenciones UI

- Estados de transferencia en UI = dominio (`borrador`, `solicitada`, `en_transito`, `recibida_parcial`, `recibida`, `cancelada`) — ver `types/inventoryUi.ts`.
- Badges: `utils/statusBadges.ts`.
- Layout de formularios: `FormPageLayout`; detalles: `DetailPageShell`.
