# Preparación para producción — Módulo Inventario

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NODE_ENV` | Ambiente | `production` |
| `PORT` | Puerto HTTP del API Inventario | `3002` |
| `LOG_LEVEL` | Nivel de log (`debug\|info\|warn\|error`) | `info` |
| `DB_DRIVER` | Driver de persistencia | `memory` (actual) / `mysql` / `postgres` |
| `DB_HOST` | Host RDBMS | `localhost` |
| `DB_PORT` | Puerto RDBMS | `3306` |
| `DB_NAME` | Base de datos | `librosys` |
| `DB_USER` / `DB_PASSWORD` | Credenciales | — |
| `OUTBOX_POLL_MS` | Intervalo del worker Outbox | `5000` |
| `CORS_ORIGIN` | Orígenes permitidos | `https://app.librosys.local` |

Archivo de referencia: copiar `.env.example` del backend y extender con las claves anteriores.

## Configuración actual

- Persistencia: adaptador **en memoria transaccional** (`InMemoryDatabaseAdapter`).
- API: Express bajo `/api/inventario`.
- Auth: headers `x-user-id` + `x-user-roles` (adaptador in-memory).
- Observabilidad: logs JSON, correlation/request id, métricas en memoria.

## Reemplazo Memory → MySQL/PostgreSQL

1. Implementar los mismos puertos (`I*Repository`, `IUnitOfWork`, `IOutbox`) con cliente SQL.
2. Mapear tablas del **Diseño Físico** aprobado (`inventario`, `movimiento_inventario`, `kardex`, `transferencia`, `descarte`, `conteo_fisico`, `ajuste_inventario`, outbox, idempotency).
3. Mantener Unit of Work = transacción SQL real (`BEGIN/COMMIT/ROLLBACK`).
4. No cambiar Dominio ni Application Services: solo el composition root intercambia adaptadores.
5. Validar con las mismas pruebas de integración (contratos de puertos).

## Migraciones

1. Versionar DDL a partir del diseño físico (`database/mysql/` existente como base).
2. Herramienta sugerida: migraciones numeradas (Flyway/Liquibase/knex/prisma migrate).
3. Separar: schema → seeds maestros (motivos, almacenes) → datos demo.
4. Prohibido: migraciones que borren Kardex/auditoría.

## Despliegue

1. Build TypeScript (`npm run build`).
2. Imagen/container con Node LTS.
3. Healthchecks K8s/Docker: `/live`, `/ready`.
4. Worker Outbox como proceso separado o cron interno (`OUTBOX_POLL_MS`).
5. Rolling update: primero migraciones, luego app.

## Rollback

1. Rollback de app a versión anterior (imagen previa).
2. Migraciones: solo forward-compatible; si hay rollback de schema, script inverso versionado.
3. No revertir movimientos de inventario ya aplicados; usar compensaciones de dominio.

## Backups

1. Backup diario RDBMS (full) + binlog/WAL continuo.
2. Retención mínima 30 días (ajustar a política institucional).
3. Probar restore trimestral en ambiente staging.
4. Outbox y auditoría incluidos en el mismo backup lógico.

## Recuperación ante fallos

| Fallo | Acción |
|---|---|
| App caída | Restart + `/ready` |
| DB no disponible | `/ready` → 503; no aceptar writes |
| Outbox con errores | Reintentos + alerta por métrica `outbox_failed` |
| Doble submit | Idempotency keys |
| Conflicto de versión | Cliente relee y reintenta |

## Observabilidad operativa

- Logs estructurados con `requestId` / `correlationId`.
- Endpoint `/metrics` (snapshot); exportar a Prometheus en fase posterior.
- Alertas sugeridas: tasa de `engine_errors`, `version_conflicts`, `outbox_failed`, latencia p95 de commands.
