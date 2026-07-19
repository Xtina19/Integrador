-- Seed idempotente: COP si no existe (sin recrear tabla monedas).
INSERT INTO monedas (codigo, nombre, simbolo, es_principal, estado)
SELECT 'COP', 'Peso Colombiano', 'COL$', 0, 'activa'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM monedas WHERE codigo = 'COP');
