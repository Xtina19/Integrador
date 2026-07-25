# Convenciones de documentación — `guia/`

## Rol de esta carpeta

`guia/` es la **documentación oficial** de LibroSys. Todo cambio de arquitectura, API, reglas o estructura de módulos debe reflejarse aquí.

## Cuándo actualizar

Actualizar la documentación del módulo **en el mismo cambio** (o inmediatamente después) cuando:

- Se añaden/quitan páginas, servicios, hooks o contextos en el Frontend.
- Se modifican rutas HTTP, handlers o capas del Backend.
- Cambian scripts SQL oficiales o copias de navegación en `Modulos/*/Database`.
- Se alteran reglas de negocio, máquinas de estado o dependencias entre módulos.
- Se mueven archivos entre `Modulos/`, `Compartido/` o el shell.

## Dónde documentar

| Cambio en… | Actualizar… |
|------------|-------------|
| `Modulos/Inventario/**` | `guia/modulos/Inventario/README.md` |
| `Modulos/Compras/**` o `backend/**/compras/**` | `guia/modulos/Compras/README.md` |
| `Modulos/Ventas/**` | `guia/modulos/Ventas/README.md` |
| `Modulos/Editoriales/**` o `backend/**/editoriales*` | `guia/modulos/Editoriales/README.md` |
| Reglas transversales | `guia/03_reglas_de_negocio.md` |
| Arquitectura / shells | `guia/02_arquitectura_general.md` |
| Pack SQL Server | `guia/04_base_de_datos.md` |
| Decisiones de diseño | nuevo ADR en `guia/06_decisiones/` |
| Flujo end-to-end | `guia/07_flujos/` |

## Formato mínimo por módulo

Cada `guia/modulos/<Nombre>/README.md` debe cubrir:

Objetivo · Responsabilidades · Arquitectura · Estructura · Frontend · Backend · Database · Componentes · Hooks · Contextos · Servicios · APIs · Modelos · Flujo · Dependencias · Reglas · Extensión · Buenas prácticas · Mejoras futuras.

## Reglas

- No documentar código que ya no exista.
- No dejar rutas antiguas (`Frontend/src/modules` como “ubicación física”): aclarar que son **junctions** hacia `Modulos/`.
- El instalador oficial de BD es `database/sqlserver/`; las copias en `Modulos/*/Database` son de navegación.
- `docs/` puede existir como material histórico o complementario; **`guia/` prevalece** como referencia oficial.
