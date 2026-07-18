-- =============================================================================
-- LibroSys — Eventos y Facturación (v2)
-- Archivo: 17_eventos_facturacion.sql
-- =============================================================================

USE librosys;

ALTER TABLE eventos
  ADD COLUMN almacen_operativo_id INT UNSIGNED NULL AFTER responsable_id,
  ADD COLUMN presupuesto_asignado DECIMAL(18,2) NOT NULL DEFAULT 0.00 AFTER reservas,
  ADD COLUMN total_ingresos DECIMAL(18,2) NOT NULL DEFAULT 0.00 AFTER presupuesto_asignado,
  ADD COLUMN total_gastos DECIMAL(18,2) NOT NULL DEFAULT 0.00 AFTER total_ingresos,
  ADD COLUMN presupuesto_disponible DECIMAL(18,2)
    GENERATED ALWAYS AS (presupuesto_asignado + total_ingresos - total_gastos) STORED
    AFTER total_gastos,
  ADD COLUMN estado_presupuesto ENUM('sin_asignar','activo','agotado','cerrado')
    NOT NULL DEFAULT 'sin_asignar' AFTER presupuesto_disponible;

ALTER TABLE eventos
  ADD CONSTRAINT fk_eventos_almacen_operativo
    FOREIGN KEY (almacen_operativo_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS empleado (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(20)  NOT NULL,
  nombre              VARCHAR(150) NOT NULL,
  area                ENUM('ventas','inventario','logistica','caja') NOT NULL,
  estado              ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  disponible          TINYINT(1)   NOT NULL DEFAULT 1,
  eventos_participados INT UNSIGNED NOT NULL DEFAULT 0,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_empleado_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asignacion_personal_evento (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  evento_id           INT UNSIGNED NOT NULL,
  empleado_id         INT UNSIGNED NOT NULL,
  area                ENUM('ventas','inventario','logistica','caja') NOT NULL,
  fecha_inicio        DATE NOT NULL,
  fecha_fin           DATE NOT NULL,
  estado              ENUM('propuesto','confirmado','completado','cancelado') NOT NULL DEFAULT 'propuesto',
  observaciones       VARCHAR(255) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_asignacion_empleado_evento (evento_id, empleado_id),
  CONSTRAINT fk_asignacion_personal_evento FOREIGN KEY (evento_id) REFERENCES eventos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_asignacion_personal_empleado FOREIGN KEY (empleado_id) REFERENCES empleado (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_asignacion_fechas CHECK (fecha_fin >= fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evento_gasto (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  evento_id           INT UNSIGNED NOT NULL,
  concepto            VARCHAR(200) NOT NULL,
  monto               DECIMAL(18,2) NOT NULL,
  fecha_gasto         DATE NOT NULL,
  moneda_id           INT UNSIGNED NOT NULL,
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_evento_gasto_evento FOREIGN KEY (evento_id) REFERENCES eventos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_evento_gasto_moneda FOREIGN KEY (moneda_id) REFERENCES monedas (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evento_producto_planificado (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  evento_id           INT UNSIGNED NOT NULL,
  producto_id         INT UNSIGNED NOT NULL,
  cantidad_planificada INT UNSIGNED NOT NULL,
  almacen_origen_id   INT UNSIGNED NULL,
  observaciones       VARCHAR(255) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_evento_producto_plan (evento_id, producto_id),
  CONSTRAINT fk_evento_prod_plan_evento FOREIGN KEY (evento_id) REFERENCES eventos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_evento_prod_plan_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_evento_prod_plan_almacen FOREIGN KEY (almacen_origen_id) REFERENCES almacenes (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evento_utensilio (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  evento_id           INT UNSIGNED NOT NULL,
  proveedor_id        INT UNSIGNED NULL,
  nombre_utensilio    VARCHAR(150) NOT NULL,
  cantidad            INT UNSIGNED NOT NULL,
  costo_unitario      DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_evento_utensilio_evento FOREIGN KEY (evento_id) REFERENCES eventos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_evento_utensilio_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evento_editorial (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  evento_id           INT UNSIGNED NOT NULL,
  editorial_id        INT UNSIGNED NOT NULL,
  stand               VARCHAR(50)  NULL,
  cantidad_productos  INT UNSIGNED NOT NULL DEFAULT 0,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_evento_editorial (evento_id, editorial_id),
  CONSTRAINT fk_evento_editorial_evento FOREIGN KEY (evento_id) REFERENCES eventos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_evento_editorial_editorial FOREIGN KEY (editorial_id) REFERENCES editoriales (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS evento_historial (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  evento_id           INT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NULL,
  fecha_evento        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accion              VARCHAR(150) NOT NULL,
  detalle             TEXT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_evento_historial_evento FOREIGN KEY (evento_id) REFERENCES eventos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_evento_historial_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS caja_evento (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  evento_id           INT UNSIGNED NOT NULL,
  almacen_id          INT UNSIGNED NOT NULL,
  usuario_apertura_id INT UNSIGNED NOT NULL,
  usuario_cierre_id   INT UNSIGNED NULL,
  fecha_apertura      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre        DATETIME NULL,
  monto_inicial       DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  monto_cierre        DECIMAL(18,2) NULL,
  total_ventas        DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  estado              ENUM('abierta','cerrada','anulada') NOT NULL DEFAULT 'abierta',
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_caja_evento_codigo (codigo),
  CONSTRAINT fk_caja_evento_evento FOREIGN KEY (evento_id) REFERENCES eventos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_caja_evento_almacen FOREIGN KEY (almacen_id) REFERENCES almacenes (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_caja_evento_apertura FOREIGN KEY (usuario_apertura_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_caja_evento_cierre FOREIGN KEY (usuario_cierre_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE venta
  ADD COLUMN tipo_venta ENUM('normal','evento','feria') NOT NULL DEFAULT 'normal' AFTER codigo,
  ADD COLUMN evento_id INT UNSIGNED NULL AFTER moneda_id,
  ADD COLUMN caja_evento_id INT UNSIGNED NULL AFTER evento_id,
  ADD COLUMN metodo_pago ENUM('efectivo','tarjeta','transferencia','mixto') NULL AFTER cliente_documento,
  ADD COLUMN tipo_cliente ENUM('general','institucional','ocasional') NULL DEFAULT 'general' AFTER metodo_pago;

ALTER TABLE venta
  ADD CONSTRAINT fk_venta_evento FOREIGN KEY (evento_id) REFERENCES eventos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_venta_caja_evento FOREIGN KEY (caja_evento_id) REFERENCES caja_evento (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT chk_venta_tipo_evento CHECK (
    (tipo_venta = 'normal' AND evento_id IS NULL AND caja_evento_id IS NULL) OR
    (tipo_venta IN ('evento','feria') AND evento_id IS NOT NULL AND caja_evento_id IS NOT NULL)
  );

CREATE TABLE IF NOT EXISTS factura_evento (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  evento_id           INT UNSIGNED NOT NULL,
  caja_evento_id      INT UNSIGNED NOT NULL,
  venta_id            INT UNSIGNED NOT NULL,
  fecha_factura       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal            DECIMAL(18,2) NOT NULL,
  itbis               DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  total               DECIMAL(18,2) NOT NULL,
  estado              ENUM('emitida','anulada') NOT NULL DEFAULT 'emitida',
  cliente_nombre      VARCHAR(200) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_factura_evento_codigo (codigo),
  UNIQUE KEY uk_factura_evento_venta (venta_id),
  CONSTRAINT fk_factura_evento_evento FOREIGN KEY (evento_id) REFERENCES eventos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_factura_evento_caja FOREIGN KEY (caja_evento_id) REFERENCES caja_evento (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_factura_evento_venta FOREIGN KEY (venta_id) REFERENCES venta (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
