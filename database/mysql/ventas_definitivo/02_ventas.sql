-- =============================================================================
-- LibroSys — Ventas DEFINITIVO
-- Archivo: 02_ventas.sql
-- Tabla raíz: ventas (= Aggregate Root Venta / factura).
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS ventas (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dominio_id            CHAR(36)     NOT NULL,
  numero_factura        VARCHAR(40)  NOT NULL,
  estado                ENUM('emitida','anulada') NOT NULL,
  tipo_venta            ENUM('consumidor_final','cliente_registrado') NOT NULL,
  cliente_id            INT UNSIGNED NULL,
  cliente_dominio_id    VARCHAR(64)  NULL,
  sucursal_id           INT UNSIGNED NOT NULL,
  sucursal_dominio_id   VARCHAR(64)  NOT NULL,
  almacen_id            INT UNSIGNED NOT NULL,
  almacen_dominio_id    VARCHAR(64)  NOT NULL,
  usuario_emision_id    INT UNSIGNED NOT NULL,
  usuario_emision_dominio_id VARCHAR(64) NOT NULL,
  moneda_codigo         ENUM('DOP','USD','COP') NOT NULL DEFAULT 'DOP',
  fecha_emision         DATETIME     NOT NULL,
  subtotal              DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_descuentos      DECIMAL(18,2) NOT NULL DEFAULT 0,
  total                 DECIMAL(18,2) NOT NULL DEFAULT 0,
  version               INT UNSIGNED NOT NULL DEFAULT 1,
  tiene_cambios         TINYINT(1)   NOT NULL DEFAULT 0,
  tiene_devoluciones    TINYINT(1)   NOT NULL DEFAULT 0,
  tiene_notas_credito   TINYINT(1)   NOT NULL DEFAULT 0,
  motivo_anulacion      VARCHAR(500) NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ventas_dominio_id (dominio_id),
  UNIQUE KEY uk_ventas_numero_factura (numero_factura),
  KEY idx_ventas_sucursal_fecha (sucursal_id, fecha_emision),
  KEY idx_ventas_estado_fecha (estado, fecha_emision),
  KEY idx_ventas_cliente (cliente_id),
  KEY idx_ventas_cliente_dominio (cliente_dominio_id),
  KEY idx_ventas_usuario (usuario_emision_id),
  CONSTRAINT fk_ventas_cliente
    FOREIGN KEY (cliente_id) REFERENCES venta_clientes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ventas_sucursal
    FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ventas_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ventas_usuario
    FOREIGN KEY (usuario_emision_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_ventas_totales
    CHECK (subtotal >= 0 AND total_descuentos >= 0 AND total >= 0),
  CONSTRAINT chk_ventas_cliente_tipo
    CHECK (
      (tipo_venta = 'consumidor_final' AND cliente_id IS NULL)
      OR (tipo_venta = 'cliente_registrado' AND (cliente_id IS NOT NULL OR cliente_dominio_id IS NOT NULL))
    ),
  CONSTRAINT chk_ventas_anulacion
    CHECK (
      (estado = 'emitida' AND motivo_anulacion IS NULL)
      OR (estado = 'anulada' AND motivo_anulacion IS NOT NULL)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ventas_schema_version (version, script_name, checksum)
VALUES ('1.0.0', '02_ventas.sql', NULL)
ON DUPLICATE KEY UPDATE version = VALUES(version), applied_at = CURRENT_TIMESTAMP;

SELECT 'VEN-DB-1.0.0 :: 02_ventas.sql aplicado.' AS resultado;
