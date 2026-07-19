# ADR-002 — Clientes pertenecen a Administración

## Qué se decidió

El maestro editable de clientes vive en **Administración**. Ventas solo consulta identidad (id, nombre, activo) y puede disparar alta rápida reutilizando ese maestro.

## Por qué

Un solo SoT de cliente; evita catálogos duplicados y sync frágil.

## Problema que resolvió

Endpoints de sincronización de clientes y mocks paralelos en Ventas.

## Impacto

POS busca en catálogo FE / ACL; no hay CRUD de clientes dentro del menú Ventas.
