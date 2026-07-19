# ADR-005 — No existe un módulo independiente de Devoluciones

## Qué se decidió

La devolución física se modela como **Cambio** (incluso con `lineasNuevas` vacío). No hay menú ni flujo HTTP de “Devoluciones” nuevo.

## Por qué

Unificar postventa de mercancía y evitar dos caminos que mueven stock de formas distintas.

## Problema que resolvió

Duplicidad Devoluciones vs Cambios y pestañas/confusión operativa.

## Impacto

`POST /:id/cambios` cubre los casos; historial etiqueta cambios; entidad `Devolucion` solo legacy de rehidratación.
