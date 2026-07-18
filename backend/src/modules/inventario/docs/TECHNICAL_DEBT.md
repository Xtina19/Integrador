# Deuda técnica — Módulo Inventario (Fase 4)

## Alta prioridad

1. **Persistencia en memoria**: no apta para multi-instancia ni reinicios. Requiere adaptador MySQL/PostgreSQL.
2. **Auth por headers**: útil para desarrollo; producción necesita JWT/OIDC integrado al módulo Seguridad.
3. **Métricas en memoria**: se pierden al reiniciar; falta export Prometheus/OTLP.
4. **OpenAPI parcial**: documenta endpoints principales; completar queries de consulta cuando existan.

## Media prioridad

5. Duplicación leve entre fakes de application/testing y repos de infrastructure (aceptable por capas; unificar fixtures de seed).
6. Worker Outbox no daemonizado (solo endpoint `/outbox/process`).
7. Rate limiting / circuit breaker no implementados.
8. Particionado/archivado de Kardex no implementado (solo diseñado).

## Baja prioridad

9. Swagger UI carga CDN externa (air-gapped: empaquetar estáticos).
10. Legacy `server.js` + mssql convive con el nuevo módulo TS (separar procesos/puertos).

## No es deuda

- Separación Domain / Application / Infrastructure.
- Inventory Engine como único mutador de stock.
- Outbox + idempotencia + UoW.
