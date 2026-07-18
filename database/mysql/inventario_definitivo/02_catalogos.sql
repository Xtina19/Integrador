-- =============================================================================
-- LibroSys — Inventario DEFINITIVO
-- Archivo: 02_catalogos.sql
-- Versión: INV-DB-1.0.0  |  Fecha: 2026-07-18
--
-- Catálogos de motivos y clasificaciones tipificadas usadas por Ajuste,
-- Descarte y ConteoFisico. Se crean ANTES de las tablas documento (03-07)
-- porque `ajuste_detalle.motivo_codigo` y `descarte_detalle.motivo_codigo`
-- referencian estas tablas por FK.
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- cat_motivo_descarte
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cat_motivo_descarte (
  codigo        VARCHAR(40)  NOT NULL,
  nombre        VARCHAR(150) NOT NULL,
  descripcion   VARCHAR(255) NULL,
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO cat_motivo_descarte (codigo, nombre, descripcion) VALUES
('DANO_FISICO',      'Daño físico',              'Producto dañado por manipulación, caída o transporte'),
('VENCIDO',          'Vencido / obsoleto',       'Edición descontinuada o material perecedero vencido'),
('HUMEDAD',          'Humedad / agua',           'Daño por humedad, agua o condiciones de almacenamiento'),
('DEFECTO_FABRICA',  'Defecto de fábrica',       'Defecto de impresión, encuadernación u origen'),
('ROBO_MERMA',       'Robo o merma',             'Faltante no explicado detectado en conteo físico'),
('DEVOLUCION_NO_APTA','Devolución no apta reventa','Devolución de cliente que no puede reingresar a venta'),
('OTRO',             'Otro',                     'Motivo no tipificado; ver observación de la línea')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion);

-- -----------------------------------------------------------------------------
-- cat_motivo_ajuste
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cat_motivo_ajuste (
  codigo        VARCHAR(40)  NOT NULL,
  nombre        VARCHAR(150) NOT NULL,
  descripcion   VARCHAR(255) NULL,
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO cat_motivo_ajuste (codigo, nombre, descripcion) VALUES
('CONTEO_FISICO',      'Regularización de conteo físico', 'Diferencia detectada y regularizada desde un conteo'),
('ERROR_DIGITACION',   'Error de digitación',             'Corrección de cantidad mal capturada en el sistema'),
('MERMA_OPERATIVA',    'Merma operativa',                 'Pérdida menor no atribuible a descarte formal'),
('ERROR_DOCUMENTAL',   'Error documental',                'Corrección por documento de origen mal referenciado'),
('CORRECCION_SISTEMA', 'Corrección de sistema',            'Ajuste técnico por migración o incidente de datos'),
('REVERSION_AJUSTE',   'Reversión de ajuste aplicado',     'Movimiento generado al revertir un ajuste aplicado'),
('REVERSION_DESCARTE', 'Reversión de descarte aplicado',   'Movimiento generado al revertir un descarte aplicado')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion);

-- -----------------------------------------------------------------------------
-- cat_clasificacion_conteo
-- Espejo descriptivo de ClasificacionDiferencia del dominio (ConteoFisico.ts).
-- No se referencia por FK física desde linea_conteo.clasificacion (columna
-- ENUM) porque MySQL no permite FK entre tipos ENUM y VARCHAR; se mantiene
-- como catálogo de apoyo para UI/reportes.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cat_clasificacion_conteo (
  codigo        VARCHAR(30)  NOT NULL,
  nombre        VARCHAR(100) NOT NULL,
  descripcion   VARCHAR(255) NULL,
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO cat_clasificacion_conteo (codigo, nombre, descripcion) VALUES
('cuadra',        'Cuadra',        'La cantidad contada coincide con la existencia teórica'),
('sobrante',      'Sobrante',      'La cantidad contada es mayor que la existencia teórica'),
('faltante',      'Faltante',      'La cantidad contada es menor que la existencia teórica'),
('dano',          'Daño',          'La diferencia corresponde a producto dañado detectado en conteo'),
('investigacion', 'En investigación', 'Diferencia pendiente de determinar causa antes de regularizar')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion);

INSERT INTO inventario_schema_version (version, script_name)
VALUES ('1.0.0', '02_catalogos.sql')
ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP;

SELECT 'INV-DB-1.0.0 :: 02_catalogos.sql aplicado.' AS resultado;
