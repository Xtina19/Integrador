# ADR-003 — Notas de Crédito nacen únicamente desde Facturas

## Qué se decidió

Toda NC se emite desde el expediente de una factura (`POST /api/v1/ventas/:id/notas-credito`). El menú **Notas de Crédito** es solo consulta administrativa.

## Por qué

La factura es el documento padre; impide NC huérfanas o manuales sin origen.

## Problema que resolvió

Riesgo de un “módulo NC” de emisión independiente y NC sin traza a factura.

## Impacto

UI de listado sin botón Crear; selector de NC en POS usa IDs de NC existentes; `pagos.nota_credito_id`.
