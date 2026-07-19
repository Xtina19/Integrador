# Ventas — Arquitectura

**Objetivo:** Capas y wiring del módulo Ventas tal como está montado.

---

## Descripción

Composition root: `createVentasComposition`  
HTTP: `mountVentasModule` → base `/api/v1/ventas`  
OpenAPI: `/api/v1/ventas/docs` (si montado)

**Dependencia obligatoria:** `InventarioComposition` (Engine). Sin ella el composition lanza error.

---

## Flujo de capas

```
HTTP (routes + auth middleware x-user-id)
  → Controllers
    → Handlers (commands/queries)
      → VentaApplicationService
        → Domain (Venta aggregate)
        → Ports: VentaRepository, InventarioEfectos/Consulta, ClienteConsulta, Permisos, Ids
```

Adaptadores relevantes:

| Puerto | Adaptador |
|--------|-----------|
| Inventario efectos/consulta | `EngineInventarioEfectosAdapter`, `EngineInventarioConsultaAdapter` |
| Clientes | ACL id/nombre/activo (maestro en FE Administración) |
| Permisos | `InMemoryUsuarioPermisosAdapter` |
| Persistencia | `MysqlVentaRepository` o `InMemoryVentaRepository` |

---

## Permisos HTTP (`authMiddleware`)

| Acción | Roles típicos |
|--------|----------------|
| `emitir` | cajero, supervisor, administrador |
| `consultar` | cajero, supervisor, administrador |
| `buscar_cliente` | idem |
| `reimprimir` | idem |
| `cambio` | supervisor, administrador (y política) |
| `nota_credito` | cajero+, según adapter |
| `anular` | supervisor, administrador |

Header: `x-user-id`.

---

## Frontend

| Pieza | Path |
|-------|------|
| Layout tabs | `Frontend/src/layouts/VentasLayout.tsx` |
| API client | `Frontend/src/services/api/ventasApi.ts` |
| POS | `modules/ventas/pages/POSPage.tsx` |
| Listado facturas | `VentasListPage.tsx` |
| Expediente | `VentaDetallePage.tsx` |
| Listado NC | `NotasCreditoListPage.tsx` |

---

## Notas

Auth de demo usa usuarios seed (`usr-cajero`, `usr-supervisor`, `usr-admin`).
