-- =============================================================================
-- LibroSys — Ventas DEFINITIVO — instalador interno
-- Ejecutar desde database/mysql/ventas_definitivo/ o vía install_ventas_definitivo.sql
-- =============================================================================

USE librosys;

SOURCE 00_VERSION.sql;
SOURCE 01_clientes.sql;
SOURCE 01b_refs_secuencia.sql;
SOURCE 02_ventas.sql;
SOURCE 03_venta_lineas.sql;
SOURCE 04_pagos.sql;
SOURCE 05_cambios.sql;
SOURCE 06_devoluciones.sql;
SOURCE 07_notas_credito.sql;
SOURCE 08_historial_ventas.sql;
SOURCE 09_indices.sql;
SOURCE 10_seed_joselito.sql;
SOURCE 11_pagos_nota_credito_id.sql;
SOURCE 12_pagos_drop_referencia.sql;

SELECT 'VEN-DB-1.2.0 :: Paquete Ventas DEFINITIVO instalado correctamente.' AS resultado;
