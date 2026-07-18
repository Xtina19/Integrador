# Reporte de arquitectura — Módulo Inventario

## Capas

```text
HTTP (adapters/api)
  → Application Services (use cases)
    → Domain (aggregates + InventoryEngine)
      → Outbound Ports
        → Infrastructure (DB/Outbox/Auth/Clock)
```

## Dependencias permitidas

- Infrastructure → Application → Domain
- Domain no depende de Infrastructure ni HTTP
- Application no conoce Express/SQL

## Componentes clave

| Componente | Ubicación | Rol |
|---|---|---|
| InventoryEngine | `domain/services` | Único mutador de existencias |
| Application Services | `application/services` | Orquestación / UoW / idempotencia |
| Repositories | `infrastructure/persistence` | Persistencia vía puertos |
| OutboxProcessor | `infrastructure/adapters` | Publicación confiable |
| Observability | `infrastructure/observability` | Logs, correlation, métricas |

## Controles de calidad arquitectónica

- Sin reglas de negocio en controladores.
- Sin acceso a DB desde Domain.
- Commands instrumentados en HTTP (`traceCommand`).
- Health: `/live`, `/ready`, `/health`.

## Riesgos residuales

- Driver SQL real pendiente.
- Auth productiva pendiente.
- Observabilidad aún local (no APM externo).
