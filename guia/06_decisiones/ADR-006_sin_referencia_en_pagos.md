# ADR-006 — Referencias manuales eliminadas de pagos

## Qué se decidió

El campo **Referencia** se eliminó de UI, API, dominio y BD de pagos.  
Para Nota de Crédito se usa **`notaCreditoId`** vía selector de NC disponibles.

## Por qué

Evitar códigos tipeados a mano (`NC-00015`), errores de tipografía y ambigüedad; la relación debe ser por ID interno.

## Problema que resolvió

Usuarios escribiendo referencias libres; mezcla de “código NC” en el mismo campo que voucher de tarjeta.

## Impacto

Formulario POS: Forma + Monto (+ selector NC). Columna `pagos.referencia` dropeada (`12_pagos_drop_referencia.sql`).
