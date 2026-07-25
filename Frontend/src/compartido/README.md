# Compartido

Codigo usado por **2 o mas modulos**. Visible via junction `Frontend/src/compartido`.

## Contenido actual

| Ruta | Consumidores |
|------|----------------|
| `Components/DetailPageShell.tsx` | Inventario, Ventas |
| `hooks/useProductosMaestro.ts` | Inventario, Ventas, Eventos |
| `business-rules/validators.ts` | Compras, Importaciones, Inventario, Eventos (+ servicios ERP) |
| `constants/stateMachines.ts` | Compras, Importaciones, Eventos, Inventario (transferencias) |

Importes preferidos: `@/compartido/...` (tambien existen shims en `Frontend/src` para rutas legacy `@/hooks`, `@/business-rules/validators`, `@/constants/stateMachines`).
