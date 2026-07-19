-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: install_ventas_definitivo.sql
-- Versión: VEN-DB-1.0.0  |  Fecha: 2026-07-18
--
-- USO (desde database/mysql):
--   mysql -u root -p librosys < install_ventas_definitivo.sql
--
-- Prerrequisito: install_all.sql base (01-21) o al menos
-- sucursales, almacenes, usuarios, productos.
-- =============================================================================

USE librosys;

SOURCE ventas_definitivo/00_VERSION.sql;
SOURCE ventas_definitivo/01_clientes.sql;
SOURCE ventas_definitivo/01b_refs_secuencia.sql;
SOURCE ventas_definitivo/02_ventas.sql;
SOURCE ventas_definitivo/03_venta_lineas.sql;
SOURCE ventas_definitivo/04_pagos.sql;
SOURCE ventas_definitivo/05_cambios.sql;
SOURCE ventas_definitivo/06_devoluciones.sql;
SOURCE ventas_definitivo/07_notas_credito.sql;
SOURCE ventas_definitivo/08_historial_ventas.sql;
SOURCE ventas_definitivo/09_indices.sql;
SOURCE ventas_definitivo/10_seed_joselito.sql;
SOURCE ventas_definitivo/11_pagos_nota_credito_id.sql;
SOURCE ventas_definitivo/12_pagos_drop_referencia.sql;

SELECT 'VEN-DB-1.0.0 :: Paquete Ventas DEFINITIVO instalado correctamente.' AS resultado;
