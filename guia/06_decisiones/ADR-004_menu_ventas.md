# ADR-004 — Menú Ventas: Dashboard, POS, Facturas, Notas de Crédito

## Qué se decidió

Cuatro entradas de menú. **Notas de Crédito** = centro de consulta (buscar, ver, reimprimir, anular si aplica), no de emisión.

## Por qué

Separar operación de caja/facturación de la administración documental de NC, sin romper la regla de emisión desde factura.

## Problema que resolvió

Navegación que solo permitía ver NC “escondidas” en el expediente, dificultando consulta global.

## Impacto

Ruta `/ventas/notas-credito`, endpoint `GET /notas-credito`, breadcrumbs y layout actualizados.
