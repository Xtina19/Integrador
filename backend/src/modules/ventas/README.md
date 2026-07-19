# Módulo Ventas — Backend

**Alineación:** VEN-ARCH · VEN-DATA · VEN-RULES-2.0.0 · VEN-UC-2.0.0 · VEN-DOM-2.0.0 · Design System  
**Namespace:** `LibroSys.Ventas`

## Capas

| Capa | Estado |
|------|--------|
| Dominio | Listo (sin cambios) |
| Aplicación | Listo (sin cambios) |
| Infraestructura / persistencia | Listo |
| **API REST / Controllers** | **Listo** (`/api/v1/ventas`) |
| Frontend | **Listo** — `docs/ventas/FRONTEND.md` |

## API HTTP

Base: `/api/v1/ventas`  
Docs: `/api/v1/ventas/docs` · OpenAPI: `/api/v1/ventas/openapi.json`  
Auth: header `x-user-id` → `UsuarioPermisosPort` (roles cajero / supervisor / administrador).

| Método | Ruta | Handler | CU |
|--------|------|---------|-----|
| POST | `/` | emitirVenta | 01–03 |
| POST | `/pago` | emitirVenta (1 pago) | pago |
| POST | `/pago-mixto` | emitirVenta (≥2 pagos) | pago mixto |
| GET | `/` | listarVentas | 04 |
| GET | `/:id` | obtenerVenta | 05 |
| GET | `/por-numero/:numero` | obtenerVenta | 05 |
| POST | `/:id/reimprimir` | reimprimir | 06 |
| GET | `/:id/historial` | obtenerHistorial | 07 |
| GET | `/clientes/buscar?texto=` | buscarCliente | 08 |
| POST | `/:id/cambios` | registrarCambio | 11 (incluye devolución física sin salida) |
| POST | `/:id/notas-credito` | emitirNotaCredito | 13 |
| POST | `/:id/anular` · `/cancelar` | anularVenta | 14 |

Envelope: `{ success, data }` / `{ success: false, error: { code, message } }`.  
Códigos: 400 VALIDATION · 401 · 403 · 404 · 409 · 422 DOMAIN_RULE · 502 INVENTORY_FAILURE.

### Estructura HTTP

```
infrastructure/api/
  http/
    controllers/VentasController.ts
    routes/ventasRoutes.ts
    middleware/authMiddleware.ts
    validators/ventaHttpValidators.ts
    errorHandler.ts
    createVentasHttpApp.ts
  openapi/ventasOpenApi.ts
bootstrap/mountVentasModule.ts
```

Controllers **no** contienen lógica de negocio ni acceden a persistencia: solo validan HTTP y delegan en handlers.

## Persistencia

Ver `database/docs/VENTAS_BD_DEFINITIVA.md`. In-memory por defecto; MySQL vía `createVentasComposition({ sql })`.

## Siguiente fase (bloqueada — revisión)

Siguiente módulo del ERP (fuera de Ventas).
