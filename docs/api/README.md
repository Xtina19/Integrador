# API HTTP — índice

| Módulo | Base | Documento |
|--------|------|-----------|
| Inventario | `/api/inventario` | [inventory.md](./inventory.md) · detalle [../inventory/08-api.md](../inventory/08-api.md) |
| Ventas | `/api/v1/ventas` | [sales.md](./sales.md) |

Auth común de módulos DDD: header `x-user-id` (y roles según middleware de cada módulo).

OpenAPI:

- Inventario: `GET /api/inventario/openapi.json` · UI `/api/inventario/docs`
- Ventas: montaje docs en composition Ventas (`/api/v1/ventas/docs` si habilitado)
