/**
 * Frontend módulo Ventas — LibroSys
 *
 * Alineación: VEN-ARCH · VEN-DATA · VEN-UC-2.0.0 · Design System · API `/api/v1/ventas`
 *
 * ## Menú (VEN-ARCH)
 *
 * | Entrada | Ruta | Contenido |
 * |---------|------|-----------|
 * | Dashboard | `/ventas` | KPIs comerciales (API) |
 * | Punto de Venta | `/ventas/pos` | Emisión + pago / pago mixto |
 * | Ventas | `/ventas/facturas` | Listado de facturas |
 * | Detalle | `/ventas/facturas/:id` | Expediente de factura (secciones) |
 *
 * ## Expediente de factura (Fase 1)
 *
 * Secciones (`?tab=`): Información General · Productos · Pagos · Cambios ·
 * Devoluciones · Notas de Crédito · Historial · Inventario Relacionado · Auditoría.
 *
 * Toda la postventa se inicia desde el detalle. No hay menús independientes
 * para Cambios / Historial / NC / Devoluciones (rutas legacy redirigen al listado).
 *
 * ## API
 *
 * - Flag: `VITE_USE_API_VENTAS=true`
 * - Base: `VITE_API_URL` (default `http://localhost:3001`)
 * - Cliente: `src/services/api/ventasApi.ts`
 * - Auth: header `x-user-id` (selector cajero / supervisor / admin)
 *
 * ## Reglas
 *
 * - Sin lógica de negocio en UI: solo presentación y consumo REST.
 * - Estados visuales: `emitida` | `anulada` (VEN-DOM).
 * - Errores HTTP mapeados en `getFriendlyErrorMessage` (400–404, 409, 422, 502).
 *
 * ## E2E
 *
 * Ver `docs/ventas/FRONTEND.md` y tests `backend/.../controllers.http.test.ts` +
 * `backend/.../ventas.flow.e2e.test.ts`.
 */
export {}
