# API — Inventario (resumen)

**Base:** `/api/inventario`  
**Router:** `backend/src/modules/inventario/infrastructure/api/http/routes/inventarioRoutes.ts`

Grupos principales:

| Área | Ejemplos |
|------|----------|
| Transferencias | `POST/GET /transferencias`, despachar, recibir, cancelar |
| Ajustes | crear → solicitar → aprobar → aplicar / rechazar / revertir |
| Descartes | crear, evidencias, aprobar, aplicar |
| Conteos | crear, abrir, capturar, clasificar, regularizar, cerrar |
| Consultas | existencias, movimientos / kardex |
| Outbox | `POST /outbox/process` |

Detalle completo de verbos y bodies: [../inventory/08-api.md](../inventory/08-api.md).
