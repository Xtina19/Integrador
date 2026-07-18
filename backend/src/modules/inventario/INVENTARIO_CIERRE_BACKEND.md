# Cierre del backend — Módulo Inventario (LibroSys)

Este documento resume el trabajo de cierre del módulo Inventario (dominio DDD,
`backend/src/modules/inventario`): transiciones de dominio faltantes, nuevos
métodos de Application Service, un servicio de lectura (`InventoryQueryService`),
nuevas rutas HTTP, snapshot durable de todas las tablas, un seeder rico de datos
de demo ("Joselito") y ajustes al esquema SQL relacional.

> Restricciones respetadas: `InventoryEngine.ts` no se modificó; no se rompió
> ninguna firma de Application Service usada por tests existentes; no se tocó
> Compras/Ventas/Importaciones; no se agregaron nuevos valores de `estado` a
> `Transferencia` (sigue: `borrador|solicitada|en_transito|recibida_parcial|recibida|cancelada`).

## 1. Dominio — nuevos métodos en agregados existentes

| Agregado | Método nuevo | Transición |
|---|---|---|
| `Transferencia` | `crear({ solicitar?: boolean })` | nace en `borrador` si `solicitar=false`, si no en `solicitada` |
| `Transferencia` | `solicitar(expectedVersion)` | `borrador` → `solicitada` |
| `Transferencia` | `cancelar(expectedVersion)` | `borrador\|solicitada` → `cancelada` |
| `Ajuste` | `solicitar(expectedVersion)` | `borrador` → `solicitado` |
| `Ajuste` | `rechazar(expectedVersion)` | `solicitado` → `rechazado` |
| `Ajuste` | `cancelar(expectedVersion)` | `borrador\|solicitado` → `cancelado` |
| `Ajuste` | `marcarRevertido(expectedVersion)` | `aplicado` → `revertido` |
| `Descarte` | `solicitar(expectedVersion)` | `borrador` → `solicitado` |
| `Descarte` | `rechazar(expectedVersion)` | `solicitado` → `rechazado` |
| `Descarte` | `cancelar(expectedVersion)` | `borrador\|solicitado` → `cancelado` |
| `Descarte` | `marcarRevertido(expectedVersion)` | `aplicado` → `revertido` |
| `ConteoFisico` | `iniciarReconteo(expectedVersion, lineaIds?)` | `en_conteo` → `en_conteo`, marca líneas objetivo (explícitas o con diferencia) como `en_reconteo` |
| `ConteoFisico` | `cancelar(expectedVersion)` | `borrador\|abierto` → `cancelado`, libera `bloqueoActivo` |

No se agregaron estados nuevos a ningún agregado; solo transiciones entre
estados ya aprobados. `InventoryEngine.ts` no fue tocado.

## 2. Application Services — nuevos métodos

**`TransferenciaApplicationService`**
- `crearTransferencia(...)`: ahora acepta `solicitar?: boolean`.
- `solicitarTransferencia({ transferenciaId, expectedVersion })` → evento `TransferenciaSolicitada`.
- `cancelarTransferencia({ transferenciaId, expectedVersion })` → evento `TransferenciaCancelada`.
- `listarTransferencias()`, `getTransferencia(id)`.

**`AjusteApplicationService`**
- `crearAjuste(...)`: ahora acepta `solicitar?: boolean` (default `true`).
- `solicitarAjuste`, `rechazarAjuste`, `cancelarAjuste` → eventos `AjusteSolicitado` / `AjusteRechazado` / `AjusteCancelado`.
- `revertirAjuste({ ajusteId, actorId, expectedVersion, idempotencyKey })`: por cada línea calcula
  `cantidadObjetivoRevertida = saldoActual - diferencia` y reutiliza
  `Engine.aplicarAjuste` para restaurar el stock al valor previo a la
  aplicación original; luego `marcarRevertido`. Idempotente (usa
  `idempotencyKey`) → evento `AjusteRevertido`.
- `listarAjustes()`, `getAjuste(id)`.

**`DescarteApplicationService`**
- `solicitarDescarte`, `rechazarDescarte`, `cancelarDescarte` → eventos `DescarteSolicitado` / `DescarteRechazado` / `DescarteCancelado`.
- `revertirDescarte({ descarteId, actorId, expectedVersion, idempotencyKey })`:
  registra una entrada compensatoria (`registrarEntrada`, tipo
  `devolucion_entrada`) por cada línea con la misma cantidad descartada, luego
  `marcarRevertido`. Idempotente → evento `DescarteRevertido`.
- `listarDescartes()`, `getDescarte(id)`.
- Todas las transiciones (`solicitar/rechazar/cancelar/revertir`) sincronizan el
  estado en `IDescarteCreateStore` (nuevo método opcional `updateEstado`) para
  que la metadata del caso "Crear Descarte" no quede desincronizada del
  agregado.

**`ConteoApplicationService`**
- `iniciarReconteo({ conteoId, expectedVersion, lineaIds? })` → evento `ConteoReconteoIniciado`.
- `cancelarConteo({ conteoId, expectedVersion })`: si el conteo tenía bloqueo
  activo, libera el almacén (`almacenes.updateBloqueo(..., false)`) → evento `ConteoCancelado`.
- `getConteo(id)`: retorna `ConteoFisicoProps & { meta: ConteoCreateMetadata | null }`.

Todas las firmas de métodos existentes se mantuvieron intactas; los tests
previos (`ApplicationServices.test.ts`) siguen pasando sin cambios de
expectativas.

## 3. `InventoryQueryService` (nuevo)

`backend/src/modules/inventario/application/services/InventoryQueryService.ts`
— servicio de solo lectura sobre las tablas en memoria
(`InMemoryDatabaseAdapter`), sin invocar Engine ni Application Services de
escritura:

- `listProductosVista()`: catálogo + existencias por almacén + total, con
  nombre comercial de almacén resuelto (`ALMACEN_NOMBRES`/`nombreAlmacen`).
- `listMovimientos()`, `getMovimiento(id)`.
- `listKardex(productoId?)`.
- `listAuditorias(filters?)`: filtros `usuarioId`, `documento`, `accion`,
  `resultado`, `from`, `to`.
- `exportAuditoriasCsv(filters?)`.
- `dashboardKpis()`: totales de productos/existencias/valor de inventario,
  almacenes bloqueados, pendientes de transferencias/ajustes/descartes,
  conteos activos, movimientos últimas 24h, desglose por almacén.

Expuesto en la composición como `composition.queryService`, junto con acceso
directo a los repositorios (`composition.transferencias`, `.ajustes`,
`.descartes`, `.conteos`, `.movimientos`, `.kardex`, `.auditorias`,
`.productos`).

## 4. Rutas HTTP nuevas (`inventarioRoutes.ts`)

Todas usan `ensurePermission(composition, req, res, '<permiso>')` (modelo
genérico de permisos por usuario/rol, sin cambios en
`InMemoryAuthorizationAdapter`; el rol `admin` sigue con bypass total y
`grant(userId, '*')` sigue habilitando todo para un usuario).

**Transferencias**
- `GET /transferencias` (`transferencias:crear`) · `GET /transferencias/:id`
- `POST /transferencias/:id/solicitar` (`transferencias:solicitar`)
- `POST /transferencias/:id/cancelar` (`transferencias:cancelar`)
- `POST /transferencias` ahora acepta `solicitar?: boolean` en el body.

**Ajustes**
- `GET /ajustes` (`ajustes:crear`) · `GET /ajustes/:id`
- `POST /ajustes/:id/solicitar` (`ajustes:solicitar`)
- `POST /ajustes/:id/rechazar` (`ajustes:rechazar`)
- `POST /ajustes/:id/cancelar` (`ajustes:cancelar`)
- `POST /ajustes/:id/revertir` (`ajustes:revertir`)
- `POST /ajustes` ahora acepta `solicitar?: boolean` en el body.

**Descartes**
- `GET /descartes/:id` (`descartes:crear`, lee desde `descarteCreateStore`)
- `POST /descartes/:id/solicitar` (`descartes:solicitar`)
- `POST /descartes/:id/rechazar` (`descartes:rechazar`)
- `POST /descartes/:id/cancelar` (`descartes:cancelar`)
- `POST /descartes/:id/revertir` (`descartes:revertir`)

**Conteos**
- `GET /conteos/:id` (`conteos:crear`)
- `POST /conteos/:id/reconteo` (`conteos:registrar`, body `{ expectedVersion, lineaIds? }`)
- `POST /conteos/:id/cancelar` (`conteos:abrir`)

**Catálogo / lectura transversal (`InventoryQueryService`)**
- `GET /productos` (`productos:leer`)
- `GET /movimientos` (`movimientos:leer`) · `GET /movimientos/:id`
- `GET /kardex?productoId=` (`kardex:leer`)
- `GET /auditoria?usuarioId=&documento=&accion=&resultado=&from=&to=` (`auditoria:leer`)
- `GET /auditoria/export?format=json|csv` (`auditoria:leer`): JSON por defecto,
  CSV (`text/csv`) con `format=csv`.
- `GET /dashboard` (`dashboard:leer`)

## 5. Snapshot durable de inventario

- **`InMemoryUnitOfWork`**: constructor ahora acepta un `onCommit?: () => void`
  opcional; se invoca únicamente al hacer commit de la transacción raíz (no en
  sub-transacciones anidadas), preservando el comportamiento previo cuando no
  se pasa callback.
- **`DurableInventorySnapshotStore`** (nuevo,
  `infrastructure/persistence/DurableInventorySnapshotStore.ts`): persiste
  todas las tablas de `InMemoryDatabaseAdapter` (productos, almacenes,
  existencias, transferencias, descartes, ajustes, conteos, metadata/auditoría
  de conteo, movimientos, kardex, auditorías, outbox — **excepto**
  `idempotency`) a `backend/data/inventario/inventario_snapshot.json`.
  `loadInto(db)` restaura el estado al iniciar el proceso; `persistFrom(db)`
  escribe el snapshot completo.
- **`createInventarioComposition`**: cuando `durableConteo: true` (usado por
  `mountInventarioModule`), se instancia el snapshot store, se carga antes de
  los stores específicos de conteo/descarte (que prevalecen para sus propias
  tablas), y se conecta como `onCommit` del `InMemoryUnitOfWork`.
- Verificado en runtime (smoke test manual): tras un `POST /transferencias`
  exitoso se genera `data/inventario/inventario_snapshot.json` con el estado
  completo de las tablas.

## 6. Seeder "Joselito" (catálogo rico de demo)

- **Nuevo archivo**: `infrastructure/composition/seedJoselito.ts` —
  `seedInventarioJoselito(repos)`: siembra 49 productos (libros + papelería)
  con editoriales reales (Alfaguara, Planeta, SM, Norma, Santillana, Penguin
  Random House, Ediciones de la UASD, Seix Barral, Salamandra, Larousse,
  Espasa, Alianza Editorial), autores dominicanos/latinoamericanos/universales,
  categorías (Literatura, Infantil, Texto escolar, Referencia, Papelería),
  costos enteros en DOP (650/895/1200/1500/2500/3500), existencias en 6
  almacenes (`central`, `suc-1..suc-5`), y documentos de ejemplo rehidratados
  (3 transferencias, 2 ajustes, 2 descartes, 2 conteos, 4 movimientos + kardex
  + auditorías) en distintos estados del ciclo de vida.
- **`seedInventarioJoselitoCompleto(composition)`** (en
  `createInventarioComposition.ts`): orquesta la siembra básica
  (`seedInventarioOperativo`, `prod-1`/`alm-a`/`alm-b`/almacenes operativos —
  usada por tests existentes) + el catálogo rico, **solo si la base está
  vacía** (`db.tables.productos.size === 0`). Si el snapshot durable ya
  restauró datos reales, no se re-siembra (evita pisar operaciones en curso).
  > **Bug corregido durante el cierre**: el chequeo de "¿ya hay datos?" se
  > evaluaba *después* de llamar a `seedInventarioOperativo` (que siembra
  > `prod-1` incondicionalmente), por lo que el catálogo rico nunca llegaba a
  > ejecutarse. Se movió el chequeo antes de sembrar nada; verificado con
  > pruebas y un smoke test end-to-end contra el módulo montado.
- Invocado desde `mountInventarioModule` en lugar de `seedInventarioOperativo`.

## 7. Ajustes SQL (`database/mysql/`)

- **`23_descarte_dominio.sql`** (reescrito): la cabecera pasa a llamarse
  `descarte` (antes `descarte_sesion`) para instalaciones nuevas; costos en
  `DECIMAL(18,4)` (ya lo estaban). `descarte_detalle` / `descarte_evidencia` /
  `descarte_aprobacion` actualizan sus FKs al nuevo nombre.
- **`24_descarte_documento.sql`** (nuevo):
  1. Migración idempotente vía procedimiento (`information_schema`):
     `RENAME TABLE descarte_sesion TO descarte` solo si la tabla legada existe
     y `descarte` todavía no (no-op en instalaciones nuevas, que ya usan `23`
     con el nombre correcto).
  2. Agrega columnas nullable de documento de origen: `conteo_origen_id`
     (`CHAR(36)`, con FK real a `conteo_fisico_sesion`), `ajuste_origen_id`,
     `transferencia_origen_id`, `movimiento_origen_id`, `kardex_origen_id`
     (`VARCHAR(64)`, referencias lógicas sin FK física porque esos agregados
     viven en el almacenamiento in-memory/durable del backend, no en tablas
     relacionales propias).
  3. Agrega `fase VARCHAR(40) DEFAULT 'Crear'` (espejo de
     `conteo_fisico_sesion.fase`).
- **`25_inventario_seed_joselito.sql`** (nuevo): extiende el catálogo
  **relacional** (`categorias`, `editoriales`, `productos`, `inventario`) de
  forma segura y FK-consistente (subqueries por `codigo`, sin hardcodear ids,
  guardas `WHERE NOT EXISTS` para poder re-ejecutarse) — 3 categorías, 8
  editoriales y 25 productos adicionales con existencias en los almacenes
  legados (`almacenes.id` 1-4 de `12_seed.sql`). El archivo documenta
  explícitamente que el backend Node **no** lee de este esquema MySQL: su
  catálogo de demo se genera en runtime vía `seedInventarioJoselitoCompleto()`
  y persiste en `backend/data/inventario/inventario_snapshot.json`; este
  script es el equivalente para quien trabaje directamente contra el esquema
  relacional (por ejemplo, para las vistas de `26`).
- **`26_inventario_views_procs.sql`** (nuevo): vistas
  `v_inventario_existencias`, `v_kardex_documento`, `v_auditoria_inventario`
  (esta última unifica `auditoria` filtrada por `modulo='inventario'` con
  `auditoria_conteo_fisico`) + índices de soporte
  (`movimiento_inventario(producto_id, almacen_id, fecha_movimiento)`,
  `descarte(estado, almacen_id)`, `conteo_fisico_sesion(estado, fase)`).
- **`install_all.sql`**: agrega `SOURCE 24_descarte_documento.sql`,
  `SOURCE 25_inventario_seed_joselito.sql`,
  `SOURCE 26_inventario_views_procs.sql` después de `23`.

> Nota: no se pudo ejecutar estos scripts contra un servidor MySQL real en
> este entorno (no hay `mysql`/`docker` disponibles); se validaron mediante
> revisión manual cuidadosa contra el esquema existente (nombres de columnas,
> tipos, FKs, convenciones de `DELIMITER`/procedimientos ya usadas en
> `14_procedimientos.sql`).

## 8. Tests

Se agregaron **25 tests nuevos** (44 → 69, todos en verde) sin modificar
ninguna aserción de los tests preexistentes:

- `domain/aggregates/AggregateTransitions.test.ts` (nuevo): 13 tests sobre las
  transiciones nuevas de `Transferencia`, `Ajuste`, `Descarte` y `ConteoFisico`
  (casos felices y de rechazo por estado inválido).
- `application/services/ApplicationServices.test.ts` (extendido): +7 tests —
  ciclo `crear(solicitar=false)→solicitar→cancelar` de Transferencia, ciclos
  `solicitar→rechazar`/`aplicar→revertir` de Ajuste y Descarte (verificando
  restauración exacta del saldo), `iniciarReconteo` y `cancelarConteo`.
- `infrastructure/composition/seedJoselito.test.ts` (nuevo): 5 tests —
  siembra completa desde una composición vacía, idempotencia de
  `seedInventarioJoselitoCompleto` (no duplica en una segunda llamada),
  coherencia de datos vía `InventoryQueryService`, y un flujo HTTP end-to-end
  (incluye `GET /productos`, `/dashboard`, `/transferencias`, `/ajustes`,
  `/movimientos`, `/kardex`, `/auditoria`, `/auditoria/export?format=csv`, y
  el ciclo `crear(borrador)→solicitar→cancelar` de una transferencia por HTTP).

```
Test Files  9 passed (9)
     Tests  69 passed (69)
```

`tsc --noEmit` sin errores. Adicionalmente se hizo un smoke test manual
(mount real + `fetch` contra 10 endpoints + verificación de escritura del
snapshot durable tras una mutación) — todo en verde; los artefactos generados
por esa prueba fueron limpiados y no quedan en el repositorio.

## 9. Archivos nuevos/modificados (resumen)

**Dominio**: `Transferencia.ts`, `Ajuste.ts`, `Descarte.ts`, `ConteoFisico.ts`.

**Application**: `TransferenciaApplicationService.ts`,
`AjusteApplicationService.ts`, `DescarteApplicationService.ts`,
`ConteoApplicationService.ts`, `InventoryQueryService.ts` (nuevo),
`ports/outbound.ts` (+`listAll()` en repos de Transferencia/Descarte/Ajuste),
`ports/descarteCreateStore.ts` (+`updateEstado?`), `testing/fakes.ts`,
`testing/InMemoryDescarteCreateStore.ts`, `application/index.ts`.

**Infraestructura**: `persistence/repositories.ts` (+`listAll()`),
`persistence/InMemoryUnitOfWork.ts` (+`onCommit`),
`persistence/DurableInventorySnapshotStore.ts` (nuevo),
`persistence/DurableDescarteCreateStore.ts` (+`updateEstado`),
`composition/createInventarioComposition.ts`,
`composition/seedJoselito.ts` (nuevo),
`bootstrap/mountInventarioModule.ts`,
`api/http/routes/inventarioRoutes.ts`,
`api/http/validators/inputValidators.ts`,
`api/http/dto/inventoryDtos.ts`, `infrastructure/index.ts`.

**Tests**: `domain/aggregates/AggregateTransitions.test.ts` (nuevo),
`application/services/ApplicationServices.test.ts` (extendido),
`infrastructure/composition/seedJoselito.test.ts` (nuevo).

**SQL**: `23_descarte_dominio.sql` (reescrito),
`24_descarte_documento.sql`, `25_inventario_seed_joselito.sql`,
`26_inventario_views_procs.sql` (nuevos), `install_all.sql` (actualizado).

## 10. Pendientes / fuera de alcance de este cierre

- No se agregaron migraciones de base de datos relacional para los agregados
  DDD `Transferencia`/`Ajuste` en sí mismos (solo existen sus contrapartes
  legadas `transferencia`/`ajuste_inventario`, de esquema distinto); esos
  agregados siguen viviendo en memoria/durable en el backend Node, tal como
  ya ocurría con `ConteoFisico`/`Descarte` antes de este cierre.
- Los scripts SQL no fueron ejecutados contra un servidor MySQL real (no
  disponible en este entorno); se recomienda correr `install_all.sql` en un
  entorno de staging antes de considerar el esquema relacional cerrado.
- Compras, Ventas e Importaciones no fueron tocados, conforme a las
  restricciones del encargo.
