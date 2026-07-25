# Backend Compras — ubicacion runtime

El codigo Express de Compras permanece en `backend/` porque usa `require` relativos
hacia middlewares/errors/lib compartidos. Moverlo a esta carpeta rompe Node al seguir
la ruta real (fuera de `backend/`).

## Donde esta el codigo

| Capa | Ruta |
|------|------|
| Controllers | `backend/controllers/compras/` |
| Services | `backend/services/compras/` |
| Repositories | `backend/repositories/compras/` |
| Routes | `backend/routes/compras/` |
| Validators | `backend/validators/compras/` |
| Models | `backend/models/compras/` |
| Auth | `backend/middlewares/comprasAuth.js` |
| Errors | `backend/errors/PurchaseError.js` |

Frontend del modulo: `Modulos/Compras/Frontend/` (activo via junction).
