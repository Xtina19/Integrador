# Modulos de negocio — LibroSys

**Plantilla uniforme de cada modulo** (igual que Inventario / Compras / Ventas / Editoriales):

```
Modulos/<Nombre>/
  README.md
  Frontend/
  Backend/     # codigo DDD/Express O README con ubicacion runtime
  Database/    # scripts SQL O README con referencia al pack
```

| Modulo | Frontend | Backend | Database |
|--------|----------|---------|----------|
| Inventario | activo | DDD en `Backend/` | copias SQL |
| Compras | activo | README → `backend/` | schema.sql |
| Ventas | activo | DDD en `Backend/` | schema.sql |
| Editoriales | activo | README → `backend/` | schema.sql |
| Admin | activo | README → `backend/` | nota |
| Usuarios | activo | README → `backend/` | nota |
| Configuracion | activo | README → `backend/` | nota |
| Eventos | activo | README (sin BE dedicado) | nota |
| Importaciones | activo | README (sin BE dedicado) | nota |
| Reportes | activo | README (sin BE dedicado) | nota |
| Auditoria | activo | README (sin BE dedicado) | nota |
| Dashboard | activo | README (sin BE dedicado) | nota |
| Ayuda | activo | README (sin BE dedicado) | nota |

## Arranque
- Apps: `Frontend/` y `backend/`
- Codigo de negocio: `Modulos/`
- Junctions: `Frontend/src/modules/<nombre>` → `Modulos/<Nombre>/Frontend`
- Compartido: `Compartido/`
- Infraestructura: `Infraestructura/README.md` + cascaras `Frontend/` / `backend/`
