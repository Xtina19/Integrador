# MANUAL TÉCNICO OFICIAL
# Módulo de Inventario — LibroSys ERP

**Versión del documento:** 1.0  
**Estado:** Referencia estable (módulo cerrado)  
**Fecha:** 2026-07-18  
**Audiencia:** Desarrolladores, auditores, evaluadores académicos, mantenedores  

---

## 1. Resumen ejecutivo

El **Módulo de Inventario** de LibroSys es el componente responsable de conocer, con trazabilidad, **cuánto hay**, **dónde está** y **por qué cambió** cada unidad de mercancía.

Se diseñó e implementó bajo un enfoque **design-first** y arquitectura **DDD + Hexagonal / Clean Architecture**, con un núcleo inmutable de reglas: el **Inventory Engine** es el único autorizado a mutar existencias.

El módulo cubre:

- Transferencias internas  
- Descartes tipificados  
- Conteo físico  
- Ajustes y correcciones  
- Kardex y auditoría  
- API HTTP, Outbox, observabilidad y preparación operativa  

**Estado actual:** desarrollo **cerrado**. Solo se admiten correcciones de errores.  
**Nivel de preparación:** *Staging-Ready / Pre-Producción* (persistencia durable y auth productiva pendientes).

---

## 2. Objetivos del módulo

1. Mantener existencias confiables por **producto × almacén**.  
2. Garantizar que todo cambio de stock deje **documento + movimiento + Kardex + auditoría**.  
3. Separar causas de negocio: traslado ≠ merma ≠ error ≠ cuadre.  
4. Impedir stock negativo y doble aplicación (idempotencia).  
5. Ofrecer una base defendible académica y operativamente.  
6. Integrarse con Compras/Ventas solo vía contratos (ellos no mutan stock directamente).

---

## 3. Alcance

### 3.1 Dentro del alcance

| Capacidad | Descripción |
|---|---|
| Existencias | Saldo operativo por producto y almacén |
| Kardex | Historial inmutable de movimientos |
| Transferencias | Traslado interno entre almacenes |
| Descartes | Baja definitiva tipificada |
| Conteo físico | Contraste sistema vs realidad |
| Ajustes/correcciones | Regularización a saldo objetivo |
| Inventory Engine | Mutador único de stock |
| API / Outbox / Observabilidad | Exposición e operación del backend |

### 3.2 Fuera del alcance

- Compras / Importaciones / Recepciones de proveedor (solo efecto de stock vía Engine)  
- Ventas / POS / Devoluciones (idem)  
- Contabilidad financiera completa de mermas  
- Catálogo comercial completo de productos  
- Auth JWT/OIDC productiva (hoy: headers de desarrollo)  
- Persistencia MySQL/PostgreSQL en runtime (hoy: adaptador en memoria transaccional)

---

## 4. Arquitectura general

```text
Actor / Sistema
      ↓
Adaptador primario (HTTP API)
      ↓
Inbound Ports / Application Services
      ↓
Dominio (Agregados + Inventory Engine)
      ↓
Outbound Ports
      ↓
Adaptadores secundarios (DB, Outbox, Auth, Clock)
```

**Regla de dependencia:** Infrastructure → Application → Domain.  
El dominio no conoce HTTP, SQL ni frameworks.

Documentos de arquitectura aprobados (cadena):

1. DER / Reglas de Negocio / Blueprint  
2. Inventory Engine / Backend Architecture  
3. Transferencias, Descartes, Conteo, Ajustes  
4. Mapa General  
5. Modelo de Dominio  
6. Persistencia / Relacional Lógico / Diseño Físico  
7. Capa de Aplicación / Puertos y Adaptadores  
8. Implementación Fases 1–4  

---

## 5. Modelo del dominio

### 5.1 Entidades / agregados principales

| Agregado | Root | Responsabilidad |
|---|---|---|
| Existencia | `Existencia` | Saldo producto×almacén + versión |
| Transferencia | `Transferencia` | Ciclo de traslado |
| Descarte | `Descarte` | Baja tipificada |
| ConteoFisico | `ConteoFisico` | Snapshot, captura, clasificación, cierre |
| Ajuste | `Ajuste` | Regularización a objetivo |
| MovimientoInventario | hecho | Delta inmutable de stock |
| Kardex | proyección 1:1 | Consulta histórica |
| AuditoriaMovimiento | hecho | Control de hitos/efectos |

### 5.2 Value objects relevantes

`Cantidad`, `Saldo`, `Version`, `IdempotencyKey`, `DocumentoOrigenRef`, `TipoMovimiento`, `Motivo`, estados tipados.

### 5.3 Invariantes globales

1. No stock negativo.  
2. Solo el Engine muta `Existencia`.  
3. Todo movimiento tiene documento origen.  
4. Kardex/movimientos append-only.  
5. Reversión = compensación, no borrado.  
6. Conteo no muta stock al capturar.  
7. Descarte ≠ Ajuste ≠ Transferencia.

---

## 6. Modelo de persistencia

Estrategia conceptual:

| Tipo | Ejemplos | Política |
|---|---|---|
| Vivos | Existencias, flags de bloqueo | Update versionado |
| Transaccionales | Cabeceras/líneas de documentos | Máquina de estados |
| Históricos | Movimientos, Kardex, Snapshots | Inmutables |
| Control | Auditoría, Idempotency, Outbox | Append / retención máxima |

Verdad operativa: **Existencia**.  
Verdad histórica: **Movimiento/Kardex**.

---

## 7. Modelo relacional lógico

Entidades lógicas (agnósticas de motor): Producto, Almacén, Existencia, MovimientoInventario, Kardex, Transferencia/Líneas, Descarte/Líneas, Conteo/Snapshot/Líneas, Ajuste/Líneas, Auditoría, EventoDominio, IdempotencyKey, CatalogoMotivos, EvidenciaDocumento.

Cardinalidades clave:

- Producto 1—N Existencia N—1 Almacén  
- Documento 1—N Líneas (composición)  
- Movimiento 1—1 Kardex  
- Conteo 1—N Snapshot / Líneas  
- LíneaConteo N—0..1 Ajuste|Descarte (referencia)

Normalización: 1FN/2FN/3FN en datos mutables; redundancia controlada en hechos históricos (Kardex).

---

## 8. Diseño físico

Convención LibroSys: `snake_case`, nombres alineados al esquema (`inventario` = existencias, `movimiento_inventario`, `transferencia`, etc.).

Piezas nuevas/evolucionadas respecto al legado: `descarte`, `detalle_descarte`, `snapshot_conteo`, cabecera+detalle de ajuste, outbox, idempotency, catálogo de motivos, `saldo_anterior` e `idempotency_key` en movimientos, ampliación de tipos (`descarte`).

Cascadas: **RESTRICT** sobre hechos y maestros; sin borrar historia.

**Runtime actual del backend TS:** adaptador **en memoria transaccional** que implementa los mismos puertos; el mapeo a MySQL/PostgreSQL está documentado y pendiente de activación productiva.

---

## 9. Inventory Engine

Servicio de dominio congelado. Operaciones:

- `registrarEntrada`  
- `registrarSalida`  
- `aplicarDescarte`  
- `aplicarAjuste` (objetivo → diferencia)  
- `registrarCompensacion`  

Flujo interno:

```text
Command + Context
 → idempotencia (replay)
 → validaciones (actor, documento, producto, bloqueo, versión)
 → mutar Existencia
 → Movimiento + Kardex + Auditoría + eventos
 → EngineResult
```

Ubicación: `backend/src/modules/inventario/domain/services/InventoryEngine.ts`

---

## 10. Capa de Aplicación

Application Services (orquestación, sin reglas profundas):

| Servicio | Casos de uso |
|---|---|
| TransferenciaApplicationService | Crear, Despachar, Recibir |
| DescarteApplicationService | Crear, Aprobar, Aplicar |
| ConteoApplicationService | Crear, Abrir, RegistrarLinea, EnviarARevision, ClasificarLinea, Cerrar |
| AjusteApplicationService | Crear, Aprobar, Aplicar |

Responsabilidades transversales:

- Unit of Work  
- Idempotencia en impactos  
- Persistencia de resultado del Engine  
- Outbox de eventos  
- Traducción `InventoryDomainError` → `ApplicationResult`  

El Engine **solo** se invoca en: Despachar, Recibir, AplicarDescarte, AplicarAjuste.

---

## 11. Puertos y Adaptadores

### Inbound (consumidos por HTTP)

- Gestión Transferencias / Descartes / Conteos / Ajustes  
- Consultas (diseñadas; subset expuesto según API actual)

### Outbound (implementados por infraestructura)

Repositorios de agregados y stock, Kardex, Auditoría, Idempotencia, Outbox, Almacén, Producto (read), UnitOfWork, Clock, Auth, Publisher.

Dirección: adaptadores dependen del núcleo; el núcleo no depende de adaptadores.

---

## 12. Infraestructura

```text
infrastructure/
  persistence/     InMemoryDatabaseAdapter, UoW, repos, outbox
  adapters/        Clock, Auth, EventPublisher, Ids
  composition/     Wiring createInventarioComposition
  api/http/        Routes, DTO, validators, mappers, errors
  observability/   Logger, metrics, correlation
  docs/            Manuales Fase 4 + este documento
```

Composition root: único lugar que conecta puertos con implementaciones.

---

## 13. API

Base: `/api/inventario`

Principales rutas:

- `POST /transferencias`  
- `POST /transferencias/:id/despachar`  
- `POST /transferencias/:id/recibir`  
- `POST /descartes` (+ aprobar/aplicar)  
- `POST /conteos` (+ abrir/líneas/revisión/clasificar/cerrar)  
- `POST /ajustes` (+ aprobar/aplicar)  
- `POST /outbox/process`  

Ops:

- `GET /live` · `GET /ready` · `GET /health` · `GET /metrics`  
- OpenAPI: `/api/inventario/openapi.json`  
- Swagger UI: `/api/inventario/docs`  

Headers:

- `x-user-id` (obligatorio en comandos)  
- `x-user-roles`  
- `x-request-id` / `x-correlation-id` (observabilidad)

Los controladores **no** contienen reglas de negocio.

---

## 14. Seguridad

Estado actual (desarrollo/staging):

- Autorización por adaptador in-memory (permisos/roles).  
- Identidad vía headers.  
- Admin role bypass de grants.  

Pendiente producción:

- JWT/OIDC integrado al módulo Seguridad LibroSys.  
- Hardening CORS, rate limit, secretos fuera del código.  
- Auditoría de accesos denegados en stack central.

Principio mantenido: la seguridad técnica no vive en el dominio de inventario.

---

## 15. Observabilidad

| Capacidad | Implementación |
|---|---|
| Logs | JSON estructurado |
| Correlation / Request ID | Middleware + headers de respuesta |
| Tracing de commands | `command_started` / `command_finished` |
| Outbox | logs de publish/fail |
| Métricas | Registry en memoria + `/metrics` |
| Errores | logging en rutas y handler global |

Métricas clave: `command_duration_ms`, `version_conflicts`, `idempotency_replays`, `outbox_published`, `outbox_failed`, `engine_errors`, `infra_errors`.

---

## 16. Estrategia de pruebas

| Nivel | Qué cubre | Ubicación típica |
|---|---|---|
| Unitarias dominio | Inventory Engine, invariantes | `domain/**/*.test.ts` |
| Unitarias aplicación | Use cases con fakes de puertos | `application/**/*.test.ts` |
| Integración infra | UoW, repos, outbox, wiring | `infrastructure/**/*.test.ts` |
| HTTP | Controllers + validación + auth headers | `controllers.http.test.ts` |
| Observabilidad | health, correlation, métricas, OpenAPI | `observability.test.ts` |

Ejecución:

```bash
cd backend
npm test
npm run test:coverage
npm run quality
```

---

## 17. Cobertura

Medición (Vitest v8, módulo inventario):

| Métrica | Valor aproximado (Fase 4) |
|---|---:|
| Statements | ~74% |
| Lines | ~76% |
| Functions | ~82% |
| Branches | ~51% |

Motor de dominio (`InventoryEngine`) con cobertura alta (~88% statements).  
Ramas HTTP/validators parciales (muchos caminos de error aún no ejercitados).

---

## 18. Flujo completo de una operación de inventario

### Ejemplo: Despachar transferencia

```text
1. Cliente HTTP POST /transferencias/:id/despachar
2. Middleware: requestId + correlationId + log inicio
3. Auth adapter: permiso transferencias:despachar
4. Validator/DTO → Command
5. TransferenciaApplicationService.despacharTransferencia
6. UoW.begin
7. Idempotency lookup (replay si existe)
8. Cargar Transferencia + validar almacén no bloqueado
9. Dominio: transferencia.despachar()
10. Por cada línea:
      InventoryEngine.registrarSalida(...)
      persistir Existencia + Movimiento + Kardex + Auditoría + eventos Engine
11. Guardar Transferencia
12. Guardar Idempotency + evento TransferenciaDespachada (Outbox)
13. UoW.commit
14. Respuesta ApplicationResult → HTTP
15. (async/ops) POST /outbox/process → EventPublisher
```

### Ejemplo: Conteo → regularización

```text
AbrirConteo (snapshot + bloqueo, sin Engine)
 → RegistrarLineaConteo
 → EnviarConteoARevision
 → ClasificarLinea (Ajuste o Descarte)
 → AplicarAjuste/AplicarDescarte (Engine)
 → CerrarConteo (libera bloqueo)
```

---

## 19. Diagramas consolidados

### 19.1 Hexágono

```text
        [HTTP] [Worker] [Tests]
               \  |  /
            Inbound Ports
                  |
             Application
                  |
               Domain
                  |
            Outbound Ports
               /  |  \
        [DB] [Outbox] [Auth/Clock]
```

### 19.2 Procesos de negocio

```text
Transferencia ──faltante──► Descarte ──► Engine
Conteo ──sobrante/faltante──► Ajuste ──► Engine
Conteo ──daño/robo/pérdida──► Descarte ──► Engine
```

### 19.3 Engine

```text
Comando → Validar → Existencia± → Movimiento → Kardex → Auditoría → Eventos
```

### 19.4 Capas de código

```text
domain/ → application/ → infrastructure/
```

---

## 20. Guía para desarrolladores

### Arranque local

```bash
cd backend
npm install
npm test
npm run typecheck
```

Composition de demo:

```ts
import { createInventarioHttpApp } from './src/modules/inventario/infrastructure'
const { app } = createInventarioHttpApp()
```

### Reglas al contribuir

1. **No** modificar Dominio/Engine/Application salvo bugfix aprobado.  
2. Nueva persistencia = nuevo adaptador que implemente puertos existentes.  
3. Nueva exposición = adaptador inbound; no meter reglas en controllers.  
4. Todo impacto de stock pasa por Engine.  
5. Tests obligatorios en el nivel afectado.  

### Dónde mirar primero

| Necesidad | Ruta |
|---|---|
| Regla de stock | `domain/services/InventoryEngine.ts` |
| Caso de uso | `application/services/*` |
| Wiring | `infrastructure/composition/*` |
| HTTP | `infrastructure/api/http/*` |
| Docs ops | `docs/PRODUCTION.md` |

---

## 21. Guía para despliegue

Resumen (detalle en `docs/PRODUCTION.md`):

1. Definir `DB_DRIVER` y credenciales cuando exista adaptador SQL.  
2. Ejecutar migraciones del diseño físico **antes** de subir la app.  
3. Healthchecks: `/live`, `/ready`.  
4. Worker Outbox periódico (`OUTBOX_POLL_MS`) o job separado.  
5. Logs JSON a colector; métricas a Prometheus/OTLP (evolución).  
6. Rollback de app por imagen previa; no borrar Kardex.  
7. Backups RDBMS + prueba de restore.

**Hoy:** despliegue pleno a producción bloqueado por persistencia memory + auth de desarrollo.

---

## 22. Deuda técnica

### Alta

- Persistencia en memoria (no multi-instancia / no durable).  
- Auth por headers.  
- Métricas locales (no export durable).  

### Media

- Worker Outbox no daemonizado.  
- OpenAPI aún no cubre 100% de queries futuras.  
- Convivencia con legacy `server.js` + mssql.  

### Baja

- Swagger UI vía CDN.  
- Fixtures duplicadas entre fakes y seeds.

Fuente: `docs/TECHNICAL_DEBT.md`.

---

## 23. Mejoras futuras

1. Adaptador MySQL/PostgreSQL conforme al diseño físico.  
2. Integración real Compras/Ventas → Engine.  
3. Auth JWT/OIDC + RBAC del módulo Seguridad.  
4. Queries de Kardex/existencias expuestas y documentadas.  
5. Prometheus/OpenTelemetry.  
6. Particionado/archivado de Kardex.  
7. UI Frontend cableada a la API real (hoy el ERP frontend usa mocks en varios flujos).  
8. Evidencias binarias (storage) ligadas a metadatos de descarte.  

---

## 24. Conclusiones

El Módulo de Inventario de LibroSys queda como **referencia estable** del ERP:

- Diseñado de punta a punta (negocio → dominio → persistencia → aplicación → infra).  
- Implementado con Engine, use cases, API, Outbox y observabilidad.  
- Separación clara de procesos (Transferencia / Descarte / Conteo / Ajuste).  
- Trazabilidad defendible: documento → movimiento → Kardex → auditoría.  

Arquitectónicamente el módulo está **maduro**.  
Operativamente está listo para **staging y evaluación académica**.  
La entrada a producción plena depende de persistencia durable y seguridad productiva, no de reabrir el diseño de negocio.

---

## Anexos — Índice de documentación del módulo

| Documento | Ubicación |
|---|---|
| Producción / env / DR | `backend/src/modules/inventario/docs/PRODUCTION.md` |
| Deuda técnica | `.../docs/TECHNICAL_DEBT.md` |
| Arquitectura | `.../docs/ARCHITECTURE_REPORT.md` |
| Readiness Fase 4 | `.../docs/PHASE4_READINESS_REPORT.md` |
| Quality JSON | `.../docs/QUALITY_REPORT.json` (generado) |
| OpenAPI | `/api/inventario/openapi.json` |
| Código dominio | `backend/src/modules/inventario/domain/` |
| Código aplicación | `backend/src/modules/inventario/application/` |
| Código infra | `backend/src/modules/inventario/infrastructure/` |

---

**Fin del Manual Técnico Oficial del Módulo de Inventario.**  
Documento de referencia para mantenimiento, auditoría y evaluación académica.

---

## Detención

No se generó código de aplicación ni se modificaron componentes existentes (salvo la creación de este manual).

Quedo detenido esperando revisión antes de iniciar cualquier otro módulo del ERP.
