# Backend Eventos — ubicacion runtime

No existe un modulo DDD/Express dedicado de Eventos bajo `backend/src/modules` ni controllers exclusivos.

| Pieza | Estado |
|-------|--------|
| API FE | `Modulos/Eventos/Frontend/services/eventosApi.ts` |
| Backend HTTP | Sin capa propia; el cliente apunta a endpoints/mocks segun flags |

Si en el futuro se agrega backend, el codigo debe vivir en esta carpeta `Backend/`.
