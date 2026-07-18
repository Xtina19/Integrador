-- LibroSys Schema Completo v2.0


-- >>> 01_database.sql <<<

-- =============================================================================
-- LibroSys — Base de datos MySQL
-- Archivo: 01_database.sql
-- Descripción: Creación de la base de datos y configuración inicial
-- NOTA: Este script es independiente del frontend/backend actual.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS librosys
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE librosys;

-- Configuración de sesión recomendada para integridad referencial
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_MODE = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';


-- >>> 02_seguridad.sql <<<

-- =============================================================================
-- LibroSys — Seguridad
-- Archivo: 02_seguridad.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- roles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(30)  NOT NULL,
  nombre          VARCHAR(100) NOT NULL,
  descripcion     VARCHAR(255) NULL,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_codigo (codigo),
  KEY idx_roles_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- permisos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permisos (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(60)  NOT NULL,
  nombre          VARCHAR(120) NOT NULL,
  modulo          VARCHAR(50)  NOT NULL,
  descripcion     VARCHAR(255) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_permisos_codigo (codigo),
  KEY idx_permisos_modulo (modulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- rol_permiso
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rol_permiso (
  rol_id          INT UNSIGNED NOT NULL,
  permiso_id      INT UNSIGNED NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (rol_id, permiso_id),
  CONSTRAINT fk_rol_permiso_rol
    FOREIGN KEY (rol_id) REFERENCES roles (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_rol_permiso_permiso
    FOREIGN KEY (permiso_id) REFERENCES permisos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- usuarios
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  rol_id          INT UNSIGNED NOT NULL,
  codigo          VARCHAR(20)  NOT NULL,
  nombre          VARCHAR(150) NOT NULL,
  apellido        VARCHAR(150) NULL,
  email           VARCHAR(150) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  telefono        VARCHAR(30)  NULL,
  estado          ENUM('activo','inactivo','bloqueado') NOT NULL DEFAULT 'activo',
  ultimo_acceso   DATETIME NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_codigo (codigo),
  UNIQUE KEY uk_usuarios_email (email),
  KEY idx_usuarios_rol (rol_id),
  KEY idx_usuarios_estado (estado),
  CONSTRAINT fk_usuarios_rol
    FOREIGN KEY (rol_id) REFERENCES roles (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_usuarios_email
    CHECK (email LIKE '%@%.%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- >>> 03_administracion.sql <<<

-- =============================================================================
-- LibroSys — Administración
-- Archivo: 03_administracion.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- categorias
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(20)  NOT NULL,
  nombre          VARCHAR(100) NOT NULL,
  descripcion     TEXT NULL,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_categorias_codigo (codigo),
  UNIQUE KEY uk_categorias_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- editoriales
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editoriales (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(20)  NOT NULL,
  nombre          VARCHAR(200) NOT NULL,
  pais            VARCHAR(100) NULL,
  contacto        VARCHAR(150) NULL,
  email           VARCHAR(150) NULL,
  telefono        VARCHAR(30)  NULL,
  tipo_contrato   VARCHAR(100) NULL,
  fecha_vencimiento DATE NULL,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_editoriales_codigo (codigo),
  KEY idx_editoriales_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- proveedores
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proveedores (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(20)  NOT NULL,
  nombre          VARCHAR(200) NOT NULL,
  contacto        VARCHAR(150) NULL,
  email           VARCHAR(150) NULL,
  telefono        VARCHAR(30)  NULL,
  pais            VARCHAR(100) NULL,
  tipo            ENUM('nacional','internacional','mixto') NOT NULL DEFAULT 'nacional',
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_proveedores_codigo (codigo),
  KEY idx_proveedores_tipo (tipo),
  KEY idx_proveedores_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- sucursales
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sucursales (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(20)  NOT NULL,
  nombre          VARCHAR(150) NOT NULL,
  ciudad          VARCHAR(100) NULL,
  direccion       VARCHAR(255) NULL,
  telefono        VARCHAR(30)  NULL,
  estado          ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sucursales_codigo (codigo),
  KEY idx_sucursales_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- almacenes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS almacenes (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sucursal_id     INT UNSIGNED NULL,
  codigo          VARCHAR(20)  NOT NULL,
  nombre          VARCHAR(150) NOT NULL,
  tipo            ENUM('central','sucursal','transito','evento') NOT NULL DEFAULT 'central',
  capacidad       INT UNSIGNED NULL,
  estado          ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_almacenes_codigo (codigo),
  KEY idx_almacenes_sucursal (sucursal_id),
  KEY idx_almacenes_tipo (tipo),
  CONSTRAINT fk_almacenes_sucursal
    FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- monedas
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS monedas (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(5)   NOT NULL,
  nombre          VARCHAR(100) NOT NULL,
  simbolo         VARCHAR(10)  NOT NULL,
  es_principal    TINYINT(1)   NOT NULL DEFAULT 0,
  estado          ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_monedas_codigo (codigo),
  KEY idx_monedas_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- tasas_cambio
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasas_cambio (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  moneda_origen_id    INT UNSIGNED NOT NULL,
  moneda_destino_id   INT UNSIGNED NOT NULL,
  tasa                DECIMAL(18,6) NOT NULL,
  vigente_desde       DATETIME NOT NULL,
  vigente_hasta       DATETIME NULL,
  actualizado_por_id  INT UNSIGNED NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasas_monedas (moneda_origen_id, moneda_destino_id),
  KEY idx_tasas_vigencia (vigente_desde, vigente_hasta),
  CONSTRAINT fk_tasas_origen
    FOREIGN KEY (moneda_origen_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_tasas_destino
    FOREIGN KEY (moneda_destino_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_tasas_usuario
    FOREIGN KEY (actualizado_por_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_tasas_positiva
    CHECK (tasa > 0),
  CONSTRAINT chk_tasas_monedas_distintas
    CHECK (moneda_origen_id <> moneda_destino_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- >>> 04_compras.sql <<<

-- =============================================================================
-- LibroSys — Compras
-- Archivo: 04_compras.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- orden_compra
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orden_compra (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  proveedor_id        INT UNSIGNED NOT NULL,
  moneda_id           INT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  tipo_compra         ENUM('nacional','internacional') NOT NULL DEFAULT 'nacional',
  fecha_orden         DATE NOT NULL,
  fecha_entrega_est   DATE NULL,
  subtotal            DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  impuestos           DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  total               DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  cantidad_items      INT UNSIGNED NOT NULL DEFAULT 0,
  estado              ENUM('borrador','pendiente','aprobada','recibida','finalizada','cancelada') NOT NULL DEFAULT 'borrador',
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orden_compra_codigo (codigo),
  KEY idx_orden_compra_proveedor (proveedor_id),
  KEY idx_orden_compra_estado (estado),
  KEY idx_orden_compra_fecha (fecha_orden),
  KEY idx_orden_compra_tipo (tipo_compra),
  CONSTRAINT fk_orden_compra_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orden_compra_moneda
    FOREIGN KEY (moneda_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_orden_compra_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_orden_compra_totales
    CHECK (subtotal >= 0 AND impuestos >= 0 AND total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- detalle_orden_compra
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_orden_compra (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  orden_compra_id     INT UNSIGNED NOT NULL,
  producto_id         INT UNSIGNED NOT NULL,
  cantidad            INT UNSIGNED NOT NULL,
  costo_unitario      DECIMAL(18,4) NOT NULL,
  subtotal            DECIMAL(18,2) NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_detalle_orden_producto (orden_compra_id, producto_id),
  KEY idx_detalle_orden_producto (producto_id),
  CONSTRAINT fk_detalle_orden_compra
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_detalle_orden_cantidad
    CHECK (cantidad > 0),
  CONSTRAINT chk_detalle_orden_costo
    CHECK (costo_unitario >= 0 AND subtotal >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- factura_proveedor (compras nacionales)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS factura_proveedor (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  orden_compra_id     INT UNSIGNED NOT NULL,
  proveedor_id        INT UNSIGNED NOT NULL,
  moneda_id           INT UNSIGNED NOT NULL,
  numero_factura      VARCHAR(50)  NOT NULL,
  fecha_factura       DATE NOT NULL,
  monto               DECIMAL(18,2) NOT NULL,
  estado_pago         ENUM('pendiente','pagada','anulada') NOT NULL DEFAULT 'pendiente',
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_factura_proveedor_codigo (codigo),
  UNIQUE KEY uk_factura_proveedor_numero (proveedor_id, numero_factura),
  KEY idx_factura_proveedor_orden (orden_compra_id),
  CONSTRAINT fk_factura_proveedor_orden
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_factura_proveedor_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_factura_proveedor_moneda
    FOREIGN KEY (moneda_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_factura_proveedor_monto
    CHECK (monto >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- recepcion
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recepcion (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                  VARCHAR(30)  NOT NULL,
  orden_compra_id         INT UNSIGNED NOT NULL,
  proveedor_id            INT UNSIGNED NOT NULL,
  usuario_id              INT UNSIGNED NOT NULL,
  tipo_compra             ENUM('nacional','internacional') NOT NULL DEFAULT 'nacional',
  fecha_recepcion         DATE NOT NULL,
  estado                  ENUM('pendiente','parcial','completa','anulada') NOT NULL DEFAULT 'pendiente',
  total_items_esperados   INT UNSIGNED NOT NULL DEFAULT 0,
  total_items_recibidos   INT UNSIGNED NOT NULL DEFAULT 0,
  observaciones           TEXT NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_recepcion_codigo (codigo),
  KEY idx_recepcion_orden (orden_compra_id),
  KEY idx_recepcion_estado (estado),
  CONSTRAINT fk_recepcion_orden
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_recepcion_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_recepcion_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- detalle_recepcion
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_recepcion (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  recepcion_id            INT UNSIGNED NOT NULL,
  producto_id             INT UNSIGNED NOT NULL,
  cantidad_esperada       INT UNSIGNED NOT NULL,
  cantidad_recibida       INT UNSIGNED NOT NULL DEFAULT 0,
  costo_unitario          DECIMAL(18,4) NOT NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_detalle_recepcion_producto (recepcion_id, producto_id),
  KEY idx_detalle_recepcion_producto (producto_id),
  CONSTRAINT fk_detalle_recepcion
    FOREIGN KEY (recepcion_id) REFERENCES recepcion (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_detalle_recepcion_cantidades
    CHECK (cantidad_esperada > 0 AND cantidad_recibida <= cantidad_esperada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FK de detalle_orden_compra → productos (tabla creada en 05_inventario.sql)
-- Se añade al final de 05_inventario.sql para respetar orden de dependencias.


-- >>> 05_inventario.sql <<<

-- =============================================================================
-- LibroSys — Inventario
-- Archivo: 05_inventario.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- productos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(20)  NOT NULL,
  isbn                VARCHAR(20)  NOT NULL,
  titulo              VARCHAR(255) NOT NULL,
  autor               VARCHAR(255) NULL,
  categoria_id        INT UNSIGNED NOT NULL,
  editorial_id        INT UNSIGNED NOT NULL,
  costo               DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
  precio              DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  estado              ENUM('activo','inactivo','descontinuado') NOT NULL DEFAULT 'activo',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_productos_codigo (codigo),
  UNIQUE KEY uk_productos_isbn (isbn),
  KEY idx_productos_categoria (categoria_id),
  KEY idx_productos_editorial (editorial_id),
  KEY idx_productos_titulo (titulo),
  CONSTRAINT fk_productos_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_productos_editorial
    FOREIGN KEY (editorial_id) REFERENCES editoriales (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_productos_precios
    CHECK (costo >= 0 AND precio >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- inventario (stock por almacén)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id         INT UNSIGNED NOT NULL,
  almacen_id          INT UNSIGNED NOT NULL,
  stock               INT NOT NULL DEFAULT 0,
  stock_minimo        INT UNSIGNED NOT NULL DEFAULT 10,
  ubicacion           VARCHAR(150) NULL,
  estado_stock        ENUM('normal','bajo','agotado') NOT NULL DEFAULT 'normal',
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_inventario_producto_almacen (producto_id, almacen_id),
  KEY idx_inventario_almacen (almacen_id),
  KEY idx_inventario_estado (estado_stock),
  CONSTRAINT fk_inventario_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_inventario_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_inventario_stock
    CHECK (stock >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- movimiento_inventario (kardex)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimiento_inventario (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id         INT UNSIGNED NOT NULL,
  almacen_id          INT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NULL,
  tipo_movimiento     ENUM('entrada','salida','ajuste','transferencia_entrada','transferencia_salida','venta','recepcion') NOT NULL,
  cantidad            INT NOT NULL,
  saldo_posterior     INT NOT NULL,
  referencia          VARCHAR(50)  NULL,
  referencia_tipo     VARCHAR(50)  NULL,
  observaciones       VARCHAR(255) NULL,
  fecha_movimiento    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_movimiento_producto (producto_id),
  KEY idx_movimiento_almacen (almacen_id),
  KEY idx_movimiento_fecha (fecha_movimiento),
  KEY idx_movimiento_referencia (referencia_tipo, referencia),
  CONSTRAINT fk_movimiento_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_movimiento_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_movimiento_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_movimiento_cantidad
    CHECK (cantidad <> 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- ajuste_inventario
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ajuste_inventario (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  producto_id         INT UNSIGNED NOT NULL,
  almacen_id          INT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  tipo                ENUM('incremento','decremento','correccion') NOT NULL,
  cantidad            INT UNSIGNED NOT NULL,
  motivo              VARCHAR(255) NOT NULL,
  estado              ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
  observaciones       TEXT NULL,
  fecha_ajuste        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ajuste_codigo (codigo),
  KEY idx_ajuste_producto (producto_id),
  KEY idx_ajuste_estado (estado),
  CONSTRAINT fk_ajuste_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ajuste_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ajuste_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_ajuste_cantidad
    CHECK (cantidad > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- FKs diferidas desde Compras → Productos
-- -----------------------------------------------------------------------------
ALTER TABLE detalle_orden_compra
  ADD CONSTRAINT fk_detalle_orden_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE detalle_recepcion
  ADD CONSTRAINT fk_detalle_recepcion_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;


-- >>> 06_importaciones.sql <<<

-- =============================================================================
-- LibroSys — Importaciones
-- Archivo: 06_importaciones.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- factura_internacional
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS factura_internacional (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  orden_compra_id     INT UNSIGNED NOT NULL,
  proveedor_id        INT UNSIGNED NOT NULL,
  moneda_id           INT UNSIGNED NOT NULL,
  fecha_factura       DATE NOT NULL,
  monto               DECIMAL(18,2) NOT NULL,
  estado_pago         ENUM('pendiente','pagada','anulada') NOT NULL DEFAULT 'pendiente',
  etapa_importacion   ENUM(
    'factura_internacional',
    'embarque_registrado',
    'consolidacion',
    'costos_flete',
    'costeo_libro',
    'recepcion',
    'completado'
  ) NOT NULL DEFAULT 'factura_internacional',
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_factura_internacional_codigo (codigo),
  UNIQUE KEY uk_factura_internacional_orden (orden_compra_id),
  KEY idx_factura_internacional_proveedor (proveedor_id),
  KEY idx_factura_internacional_etapa (etapa_importacion),
  CONSTRAINT fk_factura_int_orden
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_factura_int_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_factura_int_moneda
    FOREIGN KEY (moneda_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_factura_int_monto
    CHECK (monto >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- consolidacion
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consolidacion (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  nombre              VARCHAR(200) NOT NULL,
  estado              ENUM('activa','cerrada','anulada') NOT NULL DEFAULT 'activa',
  total_cajas         INT UNSIGNED NOT NULL DEFAULT 0,
  observaciones       TEXT NULL,
  fecha_creacion      DATE NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_consolidacion_codigo (codigo),
  KEY idx_consolidacion_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- embarque
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS embarque (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                  VARCHAR(30)  NOT NULL,
  factura_internacional_id INT UNSIGNED NOT NULL,
  orden_compra_id         INT UNSIGNED NOT NULL,
  proveedor_id            INT UNSIGNED NOT NULL,
  consolidacion_id        INT UNSIGNED NULL,
  tipo_transporte         ENUM('maritimo','aereo','courier') NOT NULL,
  origen                  VARCHAR(150) NOT NULL,
  destino                 VARCHAR(150) NOT NULL,
  fecha_salida            DATE NOT NULL,
  fecha_llegada_estimada  DATE NOT NULL,
  cantidad_cajas          INT UNSIGNED NOT NULL,
  estado                  ENUM('registrado','en_transito','en_aduana','recibido','costeado','finalizado') NOT NULL DEFAULT 'registrado',
  observaciones           TEXT NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_embarque_codigo (codigo),
  UNIQUE KEY uk_embarque_factura (factura_internacional_id),
  KEY idx_embarque_orden (orden_compra_id),
  KEY idx_embarque_estado (estado),
  KEY idx_embarque_consolidacion (consolidacion_id),
  CONSTRAINT fk_embarque_factura
    FOREIGN KEY (factura_internacional_id) REFERENCES factura_internacional (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_embarque_orden
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_embarque_proveedor
    FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_embarque_consolidacion
    FOREIGN KEY (consolidacion_id) REFERENCES consolidacion (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_embarque_cajas
    CHECK (cantidad_cajas > 0),
  CONSTRAINT chk_embarque_fechas
    CHECK (fecha_llegada_estimada >= fecha_salida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- consolidacion_embarque (relación N:M)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consolidacion_embarque (
  consolidacion_id    INT UNSIGNED NOT NULL,
  embarque_id         INT UNSIGNED NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (consolidacion_id, embarque_id),
  KEY idx_consolidacion_embarque_embarque (embarque_id),
  CONSTRAINT fk_consolidacion_embarque_consolidacion
    FOREIGN KEY (consolidacion_id) REFERENCES consolidacion (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_consolidacion_embarque_embarque
    FOREIGN KEY (embarque_id) REFERENCES embarque (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- costos_embarque
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS costos_embarque (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  embarque_id             INT UNSIGNED NOT NULL,
  moneda_id               INT UNSIGNED NOT NULL,
  flete_internacional     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  seguro                  DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  aduana                  DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  transporte_local        DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  gastos_portuarios       DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  manipulacion            DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  otros                   DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  total_costos            DECIMAL(18,2) GENERATED ALWAYS AS (
    flete_internacional + seguro + aduana + transporte_local +
    gastos_portuarios + manipulacion + otros
  ) STORED,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_costos_embarque (embarque_id),
  CONSTRAINT fk_costos_embarque
    FOREIGN KEY (embarque_id) REFERENCES embarque (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_costos_embarque_moneda
    FOREIGN KEY (moneda_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- costeo_libro
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS costeo_libro (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  embarque_id             INT UNSIGNED NOT NULL,
  producto_id             INT UNSIGNED NOT NULL,
  orden_compra_id         INT UNSIGNED NOT NULL,
  detalle_orden_id        INT UNSIGNED NULL,
  costo_producto          DECIMAL(18,4) NOT NULL,
  flete_asignado          DECIMAL(18,4) NOT NULL,
  costo_final             DECIMAL(18,4) GENERATED ALWAYS AS (costo_producto + flete_asignado) STORED,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_costeo_embarque_producto (embarque_id, producto_id),
  KEY idx_costeo_orden (orden_compra_id),
  CONSTRAINT fk_costeo_embarque
    FOREIGN KEY (embarque_id) REFERENCES embarque (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_costeo_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_costeo_orden
    FOREIGN KEY (orden_compra_id) REFERENCES orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_costeo_detalle_orden
    FOREIGN KEY (detalle_orden_id) REFERENCES detalle_orden_compra (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_costeo_valores
    CHECK (costo_producto >= 0 AND flete_asignado >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- pallet
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pallet (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  embarque_id         INT UNSIGNED NOT NULL,
  cantidad_cajas      INT UNSIGNED NOT NULL DEFAULT 0,
  peso_kg             DECIMAL(10,2) NULL,
  ubicacion           VARCHAR(200) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pallet_codigo (codigo),
  KEY idx_pallet_embarque (embarque_id),
  CONSTRAINT fk_pallet_embarque
    FOREIGN KEY (embarque_id) REFERENCES embarque (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_pallet_cajas
    CHECK (cantidad_cajas >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- caja
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS caja (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  pallet_id           INT UNSIGNED NOT NULL,
  embarque_id         INT UNSIGNED NOT NULL,
  peso_kg             DECIMAL(10,2) NULL,
  ubicacion           VARCHAR(200) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_caja_codigo (codigo),
  KEY idx_caja_pallet (pallet_id),
  KEY idx_caja_embarque (embarque_id),
  CONSTRAINT fk_caja_pallet
    FOREIGN KEY (pallet_id) REFERENCES pallet (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_caja_embarque
    FOREIGN KEY (embarque_id) REFERENCES embarque (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- FK recepción internacional → embarque / factura (opcional, diferida)
-- -----------------------------------------------------------------------------
ALTER TABLE recepcion
  ADD COLUMN factura_internacional_id INT UNSIGNED NULL AFTER orden_compra_id,
  ADD COLUMN embarque_id INT UNSIGNED NULL AFTER factura_internacional_id,
  ADD KEY idx_recepcion_embarque (embarque_id),
  ADD KEY idx_recepcion_factura_int (factura_internacional_id),
  ADD CONSTRAINT fk_recepcion_factura_int
    FOREIGN KEY (factura_internacional_id) REFERENCES factura_internacional (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT fk_recepcion_embarque
    FOREIGN KEY (embarque_id) REFERENCES embarque (id)
    ON UPDATE CASCADE ON DELETE RESTRICT;


-- >>> 07_ventas.sql <<<

-- =============================================================================
-- LibroSys — Ventas
-- Archivo: 07_ventas.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- venta
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS venta (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  sucursal_id         INT UNSIGNED NOT NULL,
  almacen_id          INT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  moneda_id           INT UNSIGNED NOT NULL,
  cliente_nombre      VARCHAR(200) NULL,
  cliente_documento   VARCHAR(50)  NULL,
  fecha_venta         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal            DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  descuento           DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  impuestos           DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  total               DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  estado              ENUM('borrador','confirmada','anulada') NOT NULL DEFAULT 'confirmada',
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_venta_codigo (codigo),
  KEY idx_venta_sucursal (sucursal_id),
  KEY idx_venta_fecha (fecha_venta),
  KEY idx_venta_estado (estado),
  CONSTRAINT fk_venta_sucursal
    FOREIGN KEY (sucursal_id) REFERENCES sucursales (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_venta_almacen
    FOREIGN KEY (almacen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_venta_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_venta_moneda
    FOREIGN KEY (moneda_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_venta_totales
    CHECK (subtotal >= 0 AND descuento >= 0 AND impuestos >= 0 AND total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- detalle_venta
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_venta (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  venta_id            INT UNSIGNED NOT NULL,
  producto_id         INT UNSIGNED NOT NULL,
  cantidad            INT UNSIGNED NOT NULL,
  precio_unitario     DECIMAL(18,2) NOT NULL,
  descuento_linea     DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  subtotal            DECIMAL(18,2) NOT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_detalle_venta_producto (venta_id, producto_id),
  KEY idx_detalle_venta_producto (producto_id),
  CONSTRAINT fk_detalle_venta
    FOREIGN KEY (venta_id) REFERENCES venta (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_detalle_venta_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_detalle_venta_cantidad
    CHECK (cantidad > 0),
  CONSTRAINT chk_detalle_venta_precio
    CHECK (precio_unitario >= 0 AND subtotal >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- >>> 08_transferencias.sql <<<

-- =============================================================================
-- LibroSys — Transferencias
-- Archivo: 08_transferencias.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- transferencia
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transferencia (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                  VARCHAR(30)  NOT NULL,
  almacen_origen_id       INT UNSIGNED NOT NULL,
  almacen_destino_id      INT UNSIGNED NOT NULL,
  usuario_solicita_id     INT UNSIGNED NOT NULL,
  usuario_aprueba_id      INT UNSIGNED NULL,
  fecha_solicitud         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_envio             DATETIME NULL,
  fecha_recepcion         DATETIME NULL,
  transporte              VARCHAR(100) NULL,
  estado                  ENUM('solicitada','aprobada','en_transito','recibida','finalizada','cancelada') NOT NULL DEFAULT 'solicitada',
  observaciones           TEXT NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_transferencia_codigo (codigo),
  KEY idx_transferencia_estado (estado),
  KEY idx_transferencia_origen (almacen_origen_id),
  KEY idx_transferencia_destino (almacen_destino_id),
  CONSTRAINT fk_transferencia_origen
    FOREIGN KEY (almacen_origen_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_transferencia_destino
    FOREIGN KEY (almacen_destino_id) REFERENCES almacenes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_transferencia_solicita
    FOREIGN KEY (usuario_solicita_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_transferencia_aprueba
    FOREIGN KEY (usuario_aprueba_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_transferencia_almacenes
    CHECK (almacen_origen_id <> almacen_destino_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- detalle_transferencia
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_transferencia (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  transferencia_id        INT UNSIGNED NOT NULL,
  producto_id             INT UNSIGNED NOT NULL,
  cantidad_solicitada     INT UNSIGNED NOT NULL,
  cantidad_enviada        INT UNSIGNED NOT NULL DEFAULT 0,
  cantidad_recibida       INT UNSIGNED NOT NULL DEFAULT 0,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_detalle_transferencia_producto (transferencia_id, producto_id),
  KEY idx_detalle_transferencia_producto (producto_id),
  CONSTRAINT fk_detalle_transferencia
    FOREIGN KEY (transferencia_id) REFERENCES transferencia (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_detalle_transferencia_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_detalle_transferencia_cantidades
    CHECK (
      cantidad_solicitada > 0 AND
      cantidad_enviada <= cantidad_solicitada AND
      cantidad_recibida <= cantidad_enviada
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- >>> 09_eventos.sql <<<

-- =============================================================================
-- LibroSys — Eventos
-- Archivo: 09_eventos.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- eventos
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eventos (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                  VARCHAR(30)  NOT NULL,
  nombre                  VARCHAR(200) NOT NULL,
  tipo                    VARCHAR(100) NOT NULL,
  fecha_inicio            DATE NOT NULL,
  fecha_fin               DATE NOT NULL,
  ubicacion               VARCHAR(200) NOT NULL,
  editorial_id            INT UNSIGNED NULL,
  responsable_id          INT UNSIGNED NULL,
  estado                  ENUM('programado','personal_asignado','en_curso','finalizado','cancelado') NOT NULL DEFAULT 'programado',
  participantes_estimados INT UNSIGNED NOT NULL DEFAULT 0,
  reservas                INT UNSIGNED NOT NULL DEFAULT 0,
  observaciones           TEXT NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_eventos_codigo (codigo),
  KEY idx_eventos_estado (estado),
  KEY idx_eventos_fechas (fecha_inicio, fecha_fin),
  CONSTRAINT fk_eventos_editorial
    FOREIGN KEY (editorial_id) REFERENCES editoriales (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_eventos_responsable
    FOREIGN KEY (responsable_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_eventos_fechas
    CHECK (fecha_fin >= fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- asignacion_evento (personal asignado)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asignacion_evento (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  evento_id           INT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  rol_evento          VARCHAR(100) NOT NULL,
  horas_asignadas     DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  estado              ENUM('asignado','confirmado','completado','cancelado') NOT NULL DEFAULT 'asignado',
  observaciones       VARCHAR(255) NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_asignacion_evento_usuario (evento_id, usuario_id),
  KEY idx_asignacion_usuario (usuario_id),
  CONSTRAINT fk_asignacion_evento
    FOREIGN KEY (evento_id) REFERENCES eventos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_asignacion_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_asignacion_horas
    CHECK (horas_asignadas >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- presupuestos_evento
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS presupuestos_evento (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  evento_id               INT UNSIGNED NOT NULL,
  moneda_id               INT UNSIGNED NOT NULL,
  concepto                VARCHAR(150) NOT NULL,
  monto_presupuestado     DECIMAL(18,2) NOT NULL,
  monto_utilizado         DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_presupuesto_evento (evento_id),
  CONSTRAINT fk_presupuesto_evento
    FOREIGN KEY (evento_id) REFERENCES eventos (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_presupuesto_moneda
    FOREIGN KEY (moneda_id) REFERENCES monedas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_presupuesto_montos
    CHECK (monto_presupuestado >= 0 AND monto_utilizado >= 0 AND monto_utilizado <= monto_presupuestado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- >>> 10_configuracion.sql <<<

-- =============================================================================
-- LibroSys — Configuración
-- Archivo: 10_configuracion.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- configuracion
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracion (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  clave               VARCHAR(100) NOT NULL,
  valor               TEXT NOT NULL,
  tipo_dato           ENUM('texto','numero','booleano','json','fecha') NOT NULL DEFAULT 'texto',
  modulo              VARCHAR(50)  NOT NULL,
  descripcion         VARCHAR(255) NULL,
  editable            TINYINT(1)   NOT NULL DEFAULT 1,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_configuracion_clave (clave),
  KEY idx_configuracion_modulo (modulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- notificaciones
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notificaciones (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id          INT UNSIGNED NULL,
  tipo                ENUM('info','warning','danger','success') NOT NULL DEFAULT 'info',
  titulo              VARCHAR(150) NOT NULL,
  mensaje             TEXT NOT NULL,
  modulo              VARCHAR(50)  NOT NULL,
  leida               TINYINT(1)   NOT NULL DEFAULT 0,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notificaciones_usuario (usuario_id),
  KEY idx_notificaciones_leida (leida),
  KEY idx_notificaciones_modulo (modulo),
  CONSTRAINT fk_notificaciones_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- correo_notificacion
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS correo_notificacion (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  notificacion_id     INT UNSIGNED NOT NULL,
  destinatario_email  VARCHAR(150) NOT NULL,
  asunto              VARCHAR(200) NOT NULL,
  cuerpo              TEXT NOT NULL,
  estado_envio        ENUM('pendiente','enviado','fallido') NOT NULL DEFAULT 'pendiente',
  intentos            TINYINT UNSIGNED NOT NULL DEFAULT 0,
  fecha_envio         DATETIME NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_correo_notificacion (notificacion_id),
  KEY idx_correo_estado (estado_envio),
  CONSTRAINT fk_correo_notificacion
    FOREIGN KEY (notificacion_id) REFERENCES notificaciones (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_correo_email
    CHECK (destinatario_email LIKE '%@%.%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- >>> 11_auditoria.sql <<<

-- =============================================================================
-- LibroSys — Auditoría
-- Archivo: 11_auditoria.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- auditoria (registro principal)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  modulo              VARCHAR(50)  NOT NULL,
  entidad             VARCHAR(80)  NOT NULL,
  entidad_id          VARCHAR(50)  NOT NULL,
  accion              ENUM('crear','actualizar','eliminar','consultar','acceso','otro') NOT NULL,
  usuario_id          INT UNSIGNED NULL,
  ip_address          VARCHAR(45)  NULL,
  user_agent          VARCHAR(255) NULL,
  descripcion         VARCHAR(500) NULL,
  fecha_evento        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_auditoria_modulo (modulo),
  KEY idx_auditoria_entidad (entidad, entidad_id),
  KEY idx_auditoria_usuario (usuario_id),
  KEY idx_auditoria_fecha (fecha_evento),
  CONSTRAINT fk_auditoria_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- auditoria_cambio (detalle de campos modificados)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_cambio (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  auditoria_id        BIGINT UNSIGNED NOT NULL,
  campo               VARCHAR(100) NOT NULL,
  valor_anterior      TEXT NULL,
  valor_nuevo         TEXT NULL,
  PRIMARY KEY (id),
  KEY idx_auditoria_cambio_auditoria (auditoria_id),
  CONSTRAINT fk_auditoria_cambio
    FOREIGN KEY (auditoria_id) REFERENCES auditoria (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- auditoria_acceso
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_acceso (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  auditoria_id        BIGINT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  tipo_acceso         ENUM('login','logout','intento_fallido','sesion_expirada') NOT NULL,
  ip_address          VARCHAR(45)  NULL,
  fecha_acceso        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_auditoria_acceso_usuario (usuario_id),
  KEY idx_auditoria_acceso_fecha (fecha_acceso),
  CONSTRAINT fk_auditoria_acceso_auditoria
    FOREIGN KEY (auditoria_id) REFERENCES auditoria (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_auditoria_acceso_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- auditoria_eliminacion
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria_eliminacion (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  auditoria_id        BIGINT UNSIGNED NOT NULL,
  entidad             VARCHAR(80)  NOT NULL,
  entidad_id          VARCHAR(50)  NOT NULL,
  motivo              VARCHAR(255) NULL,
  datos_eliminados    JSON NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  fecha_eliminacion   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_auditoria_eliminacion_entidad (entidad, entidad_id),
  CONSTRAINT fk_auditoria_eliminacion_auditoria
    FOREIGN KEY (auditoria_id) REFERENCES auditoria (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_auditoria_eliminacion_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- >>> 12_seed.sql <<<

-- =============================================================================
-- LibroSys — Datos de prueba (seed)
-- Archivo: 12_seed.sql
-- Descripción: Datos mínimos relacionados para pruebas funcionales
-- =============================================================================

USE librosys;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- SEGURIDAD
-- =============================================================================

INSERT INTO roles (id, codigo, nombre, descripcion, estado) VALUES
(1, 'ADMIN',      'Administrador',     'Acceso total al sistema',           'activo'),
(2, 'COMPRAS',    'Compras',           'Gestión de órdenes y recepciones',  'activo'),
(3, 'IMPORT',     'Importaciones',     'Gestión de importaciones',          'activo');

INSERT INTO permisos (id, codigo, nombre, modulo, descripcion) VALUES
(1,  'compras.ver',           'Ver compras',              'compras',        'Consultar órdenes de compra'),
(2,  'compras.crear',         'Crear compras',            'compras',        'Registrar órdenes de compra'),
(3,  'inventario.ver',        'Ver inventario',           'inventario',     'Consultar stock'),
(4,  'inventario.ajustar',    'Ajustar inventario',       'inventario',     'Registrar ajustes'),
(5,  'importaciones.ver',     'Ver importaciones',        'importaciones',  'Consultar embarques'),
(6,  'importaciones.gestionar','Gestionar importaciones', 'importaciones',  'Registrar embarques y costos'),
(7,  'ventas.crear',          'Registrar ventas',         'ventas',         'Crear ventas'),
(8,  'eventos.gestionar',     'Gestionar eventos',        'eventos',        'Administrar eventos'),
(9,  'auditoria.ver',         'Ver auditoría',            'auditoria',      'Consultar registros de auditoría');

INSERT INTO rol_permiso (rol_id, permiso_id) VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),
(2,1),(2,2),(2,3),
(3,5),(3,6),(3,3);

-- password: LibroSys2026! (hash bcrypt de ejemplo)
INSERT INTO usuarios (id, rol_id, codigo, nombre, apellido, email, password_hash, telefono, estado) VALUES
(1, 1, 'USR-001', 'Ana',   'García',    'ana.garcia@librosys.com',    '$2y$10$LibroSysSeedHashAdmin000000000000000001', '809-555-0101', 'activo'),
(2, 2, 'USR-002', 'Luis',  'Martínez',  'luis.martinez@librosys.com', '$2y$10$LibroSysSeedHashCompras00000000000000002', '809-555-0102', 'activo'),
(3, 3, 'USR-003', 'María', 'Rodríguez', 'maria.rodriguez@librosys.com','$2y$10$LibroSysSeedHashImport00000000000000003', '809-555-0103', 'activo');

-- =============================================================================
-- ADMINISTRACIÓN
-- =============================================================================

INSERT INTO categorias (id, codigo, nombre, descripcion, estado) VALUES
(1, 'CAT-FIC',  'Ficción',        'Novelas y narrativa',              'activo'),
(2, 'CAT-INF',  'Infantil',       'Literatura infantil y juvenil',    'activo'),
(3, 'CAT-ACA',  'Académico',      'Textos académicos y técnicos',     'activo'),
(4, 'CAT-COM',  'Comics',         'Cómics y novelas gráficas',        'activo');

INSERT INTO editoriales (id, codigo, nombre, pais, contacto, email, tipo_contrato, estado) VALUES
(1, 'ED-PLAN',  'Planeta',              'España',    'Carlos Ruiz',    'contacto@planeta.com',    'Distribución', 'activo'),
(2, 'ED-SANT',  'Santillana',           'España',    'Laura Pérez',    'ventas@santillana.com',   'Distribución', 'activo'),
(3, 'ED-PRH',   'Penguin Random House', 'USA',       'John Smith',     'sales@prh.com',           'Importación',  'activo'),
(4, 'ED-ALF',   'Alfaguara',            'España',    'Elena Torres',   'export@alfaguara.com',    'Importación',  'activo');

INSERT INTO proveedores (id, codigo, nombre, contacto, email, telefono, pais, tipo, estado) VALUES
(1, 'PROV-001', 'Distribuidora Nacional RD',  'Pedro Díaz',    'pedro@distnacional.com',   '809-555-1001', 'República Dominicana', 'nacional',       'activo'),
(2, 'PROV-002', 'Planeta Internacional',      'Carlos Ruiz',   'intl@planeta.com',         '+34-555-2001', 'España',               'internacional',  'activo'),
(3, 'PROV-003', 'Alfaguara Export',           'Elena Torres',  'export@alfaguara.com',     '+34-555-2002', 'España',               'internacional',  'activo'),
(4, 'PROV-004', 'Penguin Random House',       'John Smith',    'intl@prh.com',             '+1-555-2003',  'USA',                  'internacional',  'activo'),
(5, 'PROV-005', 'Editorial Caribe',           'Rosa Méndez',   'compras@caribe.com',       '809-555-1005', 'República Dominicana', 'nacional',       'activo');

INSERT INTO sucursales (id, codigo, nombre, ciudad, direccion, telefono, estado) VALUES
(1, 'SUC-CTR', 'Sucursal Central',    'Santo Domingo', 'Av. Winston Churchill 123', '809-555-3001', 'activa'),
(2, 'SUC-STI', 'Sucursal Santiago',     'Santiago',      'Calle del Sol 45',          '809-555-3002', 'activa'),
(3, 'SUC-LRM', 'Sucursal La Romana',    'La Romana',     'Calle Principal 8',         '809-555-3003', 'activa');

INSERT INTO almacenes (id, sucursal_id, codigo, nombre, tipo, capacidad, estado) VALUES
(1, 1, 'ALM-CTR', 'Almacén Central',         'central',  50000, 'activo'),
(2, 2, 'ALM-STI', 'Almacén Santiago',        'sucursal', 15000, 'activo'),
(3, 3, 'ALM-LRM', 'Almacén La Romana',       'sucursal', 10000, 'activo'),
(4, NULL, 'ALM-TRN', 'Almacén en Tránsito',  'transito',  8000, 'activo');

INSERT INTO monedas (id, codigo, nombre, simbolo, es_principal, estado) VALUES
(1, 'DOP', 'Peso Dominicano', 'RD$', 1, 'activa'),
(2, 'USD', 'Dólar Estadounidense', '$', 0, 'activa'),
(3, 'EUR', 'Euro', '€', 0, 'activa');

INSERT INTO tasas_cambio (id, moneda_origen_id, moneda_destino_id, tasa, vigente_desde, actualizado_por_id) VALUES
(1, 2, 1, 58.500000, '2026-01-01 00:00:00', 1),
(2, 3, 1, 63.200000, '2026-01-01 00:00:00', 1),
(3, 3, 2, 1.080000,  '2026-01-01 00:00:00', 1);

-- =============================================================================
-- PRODUCTOS E INVENTARIO
-- =============================================================================

INSERT INTO productos (id, codigo, isbn, titulo, autor, categoria_id, editorial_id, costo, precio, estado) VALUES
(1,  'PRD-001', '978-0307474728', 'Cien años de soledad',           'Gabriel García Márquez', 1, 1,  8.50,  18.99, 'activo'),
(2,  'PRD-002', '978-8497592432', 'La sombra del viento',           'Carlos Ruiz Zafón',      1, 1,  6.80,  15.50, 'activo'),
(3,  'PRD-003', '978-8498384453', 'Harry Potter y la piedra filosofal','J.K. Rowling',        2, 4,  9.20,  19.99, 'activo'),
(4,  'PRD-004', '978-0451524935', '1984',                           'George Orwell',          1, 3,  4.50,  12.00, 'activo'),
(5,  'PRD-005', '978-9584202952', 'El amor en los tiempos del cólera','Gabriel García Márquez',1, 1,  7.90,  16.50, 'activo'),
(6,  'PRD-006', '978-6073137125', 'Rayuela',                        'Julio Cortázar',         1, 2,  8.10,  17.25, 'activo'),
(7,  'PRD-007', '978-8466331917', 'El código Da Vinci',             'Dan Brown',              1, 1,  6.50,  14.99, 'activo'),
(8,  'PRD-008', '978-8491050675', 'Don Quijote de la Mancha',       'Miguel de Cervantes',    3, 2, 10.00,  22.00, 'activo'),
(9,  'PRD-009', '978-8497598208', 'El principito',                  'Antoine de Saint-Exupéry',2,1, 5.20,  11.50, 'activo'),
(10, 'PRD-010', '978-6075273777', 'Sapiens',                        'Yuval Noah Harari',      3, 3, 12.00,  24.99, 'activo');

INSERT INTO inventario (id, producto_id, almacen_id, stock, stock_minimo, ubicacion, estado_stock) VALUES
(1,  1, 1, 120, 20, 'Pasillo A - Estante 1', 'normal'),
(2,  2, 1,  85, 15, 'Pasillo A - Estante 2', 'normal'),
(3,  3, 1,  45, 10, 'Pasillo B - Estante 1', 'normal'),
(4,  4, 1, 200, 25, 'Pasillo A - Estante 3', 'normal'),
(5,  5, 1,  30, 10, 'Pasillo C - Estante 1', 'normal'),
(6,  6, 2,  60, 10, 'Zona A - Rack 1',       'normal'),
(7,  7, 2,  15, 10, 'Zona A - Rack 2',       'bajo'),
(8,  8, 1,  40,  8, 'Pasillo D - Estante 1', 'normal'),
(9,  9, 3,  25,  5, 'Estante Infantil 1',    'normal'),
(10, 10, 1,  55, 10, 'Pasillo E - Estante 1','normal');

-- =============================================================================
-- COMPRAS
-- =============================================================================

-- OC Nacional
INSERT INTO orden_compra (id, codigo, proveedor_id, moneda_id, usuario_id, tipo_compra, fecha_orden, subtotal, impuestos, total, cantidad_items, estado) VALUES
(1, 'OC-2026-001', 1, 1, 2, 'nacional',       '2026-05-10', 1850.00, 333.00, 2183.00, 150, 'recibida'),
(2, 'OC-INT-2026-091', 2, 3, 2, 'internacional','2026-05-20', 45200.00, 0.00, 45200.00, 840, 'aprobada'),
(3, 'OC-INT-2026-090', 3, 3, 2, 'internacional','2026-06-05', 12800.00, 0.00, 12800.00, 240, 'aprobada');

INSERT INTO detalle_orden_compra (id, orden_compra_id, producto_id, cantidad, costo_unitario, subtotal) VALUES
(1, 1, 4, 100, 4.50, 450.00),
(2, 1, 9,  50, 5.20, 260.00),
(3, 2, 1, 200, 8.50, 1700.00),
(4, 2, 2, 300, 6.80, 2040.00),
(5, 2, 4, 340, 4.50, 1530.00),
(6, 3, 3, 240, 53.33, 12800.00);

INSERT INTO factura_proveedor (id, codigo, orden_compra_id, proveedor_id, moneda_id, numero_factura, fecha_factura, monto, estado_pago) VALUES
(1, 'FP-2026-001', 1, 1, 1, 'FAC-DN-4587', '2026-05-12', 2183.00, 'pagada');

INSERT INTO recepcion (id, codigo, orden_compra_id, proveedor_id, usuario_id, tipo_compra, fecha_recepcion, estado, total_items_esperados, total_items_recibidos) VALUES
(1, 'REC-2026-001', 1, 1, 2, 'nacional', '2026-05-15', 'completa', 150, 150);

INSERT INTO detalle_recepcion (id, recepcion_id, producto_id, cantidad_esperada, cantidad_recibida, costo_unitario) VALUES
(1, 1, 4, 100, 100, 4.50),
(2, 1, 9,  50,  50,  5.20);

-- =============================================================================
-- IMPORTACIONES
-- =============================================================================

INSERT INTO factura_internacional (id, codigo, orden_compra_id, proveedor_id, moneda_id, fecha_factura, monto, estado_pago, etapa_importacion) VALUES
(1, 'FI-2026-045', 2, 2, 3, '2026-05-25', 45200.00, 'pendiente', 'costos_flete'),
(2, 'FI-2026-044', 3, 3, 3, '2026-06-08', 12800.00, 'pagada',    'costeo_libro');

INSERT INTO consolidacion (id, codigo, nombre, estado, total_cajas, observaciones, fecha_creacion) VALUES
(1, 'CON-2026-008', 'Consolidación España Q2 2026', 'activa', 84, 'Consolidación marítima desde España', '2026-05-28'),
(2, 'CON-2026-007', 'Consolidación Alfaguara Junio', 'cerrada', 12, 'Embarque aéreo cerrado',            '2026-06-10');

INSERT INTO embarque (id, codigo, factura_internacional_id, orden_compra_id, proveedor_id, consolidacion_id, tipo_transporte, origen, destino, fecha_salida, fecha_llegada_estimada, cantidad_cajas, estado, observaciones) VALUES
(1, 'EMB-012', 1, 2, 2, 1, 'maritimo', 'Barcelona, ES', 'Santo Domingo, RD', '2026-05-28', '2026-06-25', 84, 'costeado', 'Contenedor refrigerado — prioridad alta'),
(2, 'EMB-011', 2, 3, 3, 2, 'aereo',    'Madrid, ES',    'Santo Domingo, RD', '2026-06-10', '2026-06-12', 12, 'recibido', 'Envío urgente de novedades editoriales');

INSERT INTO consolidacion_embarque (consolidacion_id, embarque_id) VALUES
(1, 1),
(2, 2);

INSERT INTO costos_embarque (id, embarque_id, moneda_id, flete_internacional, seguro, aduana, transporte_local, gastos_portuarios, manipulacion, otros) VALUES
(1, 1, 1, 12400.00, 2100.00, 8900.00, 800.00, 450.00, 250.00, 0.00),
(2, 2, 1,  3200.00,  450.00, 1800.00, 120.00,  50.00,  30.00, 0.00);

INSERT INTO costeo_libro (id, embarque_id, producto_id, orden_compra_id, detalle_orden_id, costo_producto, flete_asignado) VALUES
(1, 1, 1, 2, 3, 8.5000, 1.2000),
(2, 1, 2, 2, 4, 6.8000, 0.9500),
(3, 1, 4, 2, 5, 4.5000, 0.6500),
(4, 2, 3, 3, 6, 9.2000, 1.3500);

INSERT INTO pallet (id, codigo, embarque_id, cantidad_cajas, peso_kg, ubicacion) VALUES
(1, 'PAL-012-A', 1, 42, 680.00, 'Puerto SD — Muelle 3'),
(2, 'PAL-012-B', 1, 42, 695.00, 'Puerto SD — Muelle 3'),
(3, 'PAL-011-A', 2, 12, 216.00, 'Almacén Central — Zona A');

INSERT INTO caja (id, codigo, pallet_id, embarque_id, peso_kg, ubicacion) VALUES
(1, 'CAJ-012-01', 1, 1, 16.20, 'Puerto SD — Muelle 3'),
(2, 'CAJ-012-02', 1, 1, 16.50, 'Puerto SD — Muelle 3'),
(3, 'CAJ-011-01', 3, 2, 18.00, 'Almacén Central — Zona A');

-- Recepción internacional pendiente (embarque finalizado)
INSERT INTO recepcion (id, codigo, orden_compra_id, factura_internacional_id, embarque_id, proveedor_id, usuario_id, tipo_compra, fecha_recepcion, estado, total_items_esperados, total_items_recibidos) VALUES
(2, 'REC-INT-2026-001', 3, 2, 2, 3, 3, 'internacional', '2026-06-13', 'pendiente', 240, 0);

INSERT INTO detalle_recepcion (id, recepcion_id, producto_id, cantidad_esperada, cantidad_recibida, costo_unitario) VALUES
(3, 2, 3, 240, 0, 53.33);

-- =============================================================================
-- VENTAS
-- =============================================================================

INSERT INTO venta (id, codigo, sucursal_id, almacen_id, usuario_id, moneda_id, cliente_nombre, fecha_venta, subtotal, descuento, impuestos, total, estado) VALUES
(1, 'VTA-2026-001', 1, 1, 1, 1, 'Cliente General',     '2026-06-01 10:30:00',  37.98, 0.00,  6.84,  44.82, 'confirmada'),
(2, 'VTA-2026-002', 1, 1, 1, 1, 'Juan Pérez',          '2026-06-02 14:15:00',  31.00, 0.00,  5.58,  36.58, 'confirmada'),
(3, 'VTA-2026-003', 2, 2, 1, 1, 'María López',         '2026-06-03 11:00:00',  14.99, 0.00,  2.70,  17.69, 'confirmada'),
(4, 'VTA-2026-004', 1, 1, 1, 1, 'Colegio San José',    '2026-06-04 09:45:00',  59.97, 5.00,  9.89,  64.86, 'confirmada'),
(5, 'VTA-2026-005', 3, 3, 1, 1, 'Cliente General',     '2026-06-05 16:20:00',  11.50, 0.00,  2.07,  13.57, 'confirmada');

INSERT INTO detalle_venta (id, venta_id, producto_id, cantidad, precio_unitario, descuento_linea, subtotal) VALUES
(1, 1, 1, 1, 18.99, 0.00, 18.99),
(2, 1, 4, 1, 12.00, 0.00, 12.00),
(3, 1, 9, 1,  6.99, 0.00,  6.99),
(4, 2, 2, 2, 15.50, 0.00, 31.00),
(5, 3, 7, 1, 14.99, 0.00, 14.99),
(6, 4, 3, 3, 19.99, 5.00, 59.97),
(7, 5, 9, 1, 11.50, 0.00, 11.50);

-- =============================================================================
-- TRANSFERENCIAS
-- =============================================================================

INSERT INTO transferencia (id, codigo, almacen_origen_id, almacen_destino_id, usuario_solicita_id, usuario_aprueba_id, fecha_solicitud, fecha_envio, estado, transporte) VALUES
(1, 'TRF-2026-001', 1, 2, 2, 1, '2026-06-08 08:00:00', '2026-06-08 14:00:00', 'en_transito', 'Camión refrigerado');

INSERT INTO detalle_transferencia (id, transferencia_id, producto_id, cantidad_solicitada, cantidad_enviada, cantidad_recibida) VALUES
(1, 1, 6, 20, 20, 0),
(2, 1, 7, 10, 10, 0);

-- =============================================================================
-- EVENTOS
-- =============================================================================

INSERT INTO eventos (id, codigo, nombre, tipo, fecha_inicio, fecha_fin, ubicacion, editorial_id, responsable_id, estado, participantes_estimados, reservas) VALUES
(1, 'EVT-2026-001', 'Feria del Libro SD 2026',     'Feria',        '2026-07-15', '2026-07-20', 'Plaza de la Cultura, Santo Domingo', 1, 1, 'programado',          5000, 1200),
(2, 'EVT-2026-002', 'Presentación Harry Potter',   'Presentación', '2026-06-25', '2026-06-25', 'Sucursal Central',                   4, 3, 'personal_asignado',    150,   85);

INSERT INTO asignacion_evento (id, evento_id, usuario_id, rol_evento, horas_asignadas, estado) VALUES
(1, 2, 1, 'Coordinador', 8.00, 'confirmado'),
(2, 2, 3, 'Logística',   6.00, 'asignado');

INSERT INTO presupuestos_evento (id, evento_id, moneda_id, concepto, monto_presupuestado, monto_utilizado) VALUES
(1, 1, 1, 'Stand y decoración',  150000.00, 45000.00),
(2, 1, 1, 'Material promocional', 35000.00, 12000.00),
(3, 2, 1, 'Merchandising',        15000.00,  8500.00);

-- =============================================================================
-- CONFIGURACIÓN
-- =============================================================================

INSERT INTO configuracion (id, clave, valor, tipo_dato, modulo, descripcion) VALUES
(1, 'empresa.nombre',           'LibroSys',              'texto',    'general',       'Nombre de la empresa'),
(2, 'inventario.stock_minimo',  '10',                    'numero',   'inventario',    'Stock mínimo por defecto'),
(3, 'ventas.itbis',             '0.18',                  'numero',   'ventas',        'Tasa ITBIS aplicable'),
(4, 'importaciones.moneda_costos','DOP',                  'texto',    'importaciones', 'Moneda para costos de flete'),
(5, 'notificaciones.email_activo','true',                 'booleano', 'configuracion', 'Habilitar correos de notificación');

INSERT INTO notificaciones (id, usuario_id, tipo, titulo, mensaje, modulo, leida) VALUES
(1, 3, 'info',    'Nuevo Embarque',        'EMB-012 registrado con costos asociados', 'importaciones', 0),
(2, 2, 'success', 'Orden Aprobada',        'OC-INT-2026-091 lista para embarque',     'compras',       1),
(3, 1, 'warning', 'Stock Bajo',            'El código Da Vinci bajo mínimo en Santiago','inventario',   0);

INSERT INTO correo_notificacion (id, notificacion_id, destinatario_email, asunto, cuerpo, estado_envio, fecha_envio) VALUES
(1, 1, 'maria.rodriguez@librosys.com', 'Nuevo Embarque EMB-012', 'Se registró el embarque EMB-012 con factura FI-2026-045.', 'enviado', '2026-05-28 09:15:00');

-- =============================================================================
-- AUDITORÍA (muestras iniciales)
-- =============================================================================

INSERT INTO auditoria (id, modulo, entidad, entidad_id, accion, usuario_id, ip_address, descripcion, fecha_evento) VALUES
(1, 'compras',       'orden_compra',        '2',         'crear',      2, '192.168.1.10', 'Orden internacional OC-INT-2026-091 creada',       '2026-05-20 09:00:00'),
(2, 'importaciones', 'embarque',            '1',         'crear',      3, '192.168.1.12', 'Embarque EMB-012 registrado',                    '2026-05-28 09:10:00'),
(3, 'ventas',        'venta',               '1',         'crear',      1, '192.168.1.5',  'Venta VTA-2026-001 confirmada',                  '2026-06-01 10:30:00');

INSERT INTO auditoria_cambio (id, auditoria_id, campo, valor_anterior, valor_nuevo) VALUES
(1, 2, 'estado', 'registrado', 'en_transito');

INSERT INTO auditoria_acceso (id, auditoria_id, usuario_id, tipo_acceso, ip_address, fecha_acceso) VALUES
(1, 1, 2, 'login', '192.168.1.10', '2026-05-20 08:55:00');

SET FOREIGN_KEY_CHECKS = 1;


-- >>> 13_views.sql <<<

-- =============================================================================
-- LibroSys — Vistas para dashboards
-- Archivo: 13_views.sql
-- =============================================================================

USE librosys;

-- -----------------------------------------------------------------------------
-- Dashboard Inventario
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_dashboard_inventario AS
SELECT
  COUNT(DISTINCT p.id)                                              AS total_productos,
  COUNT(DISTINCT i.id)                                              AS registros_inventario,
  COALESCE(SUM(i.stock), 0)                                         AS stock_total_unidades,
  SUM(CASE WHEN i.estado_stock = 'bajo'    THEN 1 ELSE 0 END)       AS productos_stock_bajo,
  SUM(CASE WHEN i.estado_stock = 'agotado' THEN 1 ELSE 0 END)       AS productos_agotados,
  COUNT(DISTINCT i.almacen_id)                                      AS almacenes_con_stock,
  (
    SELECT COUNT(*)
    FROM ajuste_inventario aj
    WHERE aj.estado = 'pendiente'
  )                                                                 AS ajustes_pendientes,
  (
    SELECT COUNT(*)
    FROM movimiento_inventario mi
    WHERE mi.fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  )                                                                 AS movimientos_ultimos_30_dias
FROM productos p
LEFT JOIN inventario i ON i.producto_id = p.id
WHERE p.estado = 'activo';

-- -----------------------------------------------------------------------------
-- Dashboard Compras
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_dashboard_compras AS
SELECT
  COUNT(*)                                                          AS total_ordenes,
  SUM(CASE WHEN oc.estado = 'pendiente'  THEN 1 ELSE 0 END)         AS ordenes_pendientes,
  SUM(CASE WHEN oc.estado = 'aprobada'   THEN 1 ELSE 0 END)         AS ordenes_aprobadas,
  SUM(CASE WHEN oc.estado = 'recibida'   THEN 1 ELSE 0 END)         AS ordenes_recibidas,
  SUM(CASE WHEN oc.tipo_compra = 'internacional' THEN 1 ELSE 0 END) AS ordenes_internacionales,
  COALESCE(SUM(oc.total), 0)                                        AS monto_total_ordenes,
  (
    SELECT COUNT(*) FROM recepcion r WHERE r.estado = 'pendiente'
  )                                                                 AS recepciones_pendientes,
  (
    SELECT COUNT(*) FROM factura_proveedor fp WHERE fp.estado_pago = 'pendiente'
  )                                                                 AS facturas_pendientes_pago
FROM orden_compra oc;

-- -----------------------------------------------------------------------------
-- Dashboard Importaciones
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_dashboard_importaciones AS
SELECT
  (
    SELECT COUNT(*)
    FROM embarque e
    WHERE e.estado IN ('registrado', 'en_transito', 'en_aduana')
  )                                                                 AS embarques_activos,
  (
    SELECT COALESCE(SUM(e.cantidad_cajas), 0)
    FROM embarque e
    WHERE e.estado IN ('registrado', 'en_transito', 'en_aduana')
  )                                                                 AS cajas_en_transito,
  (
    SELECT COALESCE(ROUND(AVG(cl.costo_final), 2), 0)
    FROM costeo_libro cl
  )                                                                 AS costo_promedio_libro,
  (
    SELECT COUNT(*)
    FROM embarque e
    WHERE YEAR(e.created_at) = YEAR(CURDATE())
  )                                                                 AS importaciones_anio,
  (
    SELECT COUNT(*) FROM factura_internacional fi
    WHERE fi.estado_pago = 'pendiente'
  )                                                                 AS facturas_int_pendientes,
  (
    SELECT COUNT(*) FROM consolidacion c WHERE c.estado = 'activa'
  )                                                                 AS consolidaciones_activas,
  (
    SELECT COALESCE(SUM(ce.total_costos), 0)
    FROM costos_embarque ce
  )                                                                 AS total_costos_flete_registrados;

-- -----------------------------------------------------------------------------
-- Dashboard Eventos
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_dashboard_eventos AS
SELECT
  COUNT(*)                                                          AS total_eventos,
  SUM(CASE WHEN ev.estado IN ('programado','personal_asignado') THEN 1 ELSE 0 END) AS eventos_proximos,
  SUM(CASE WHEN ev.estado = 'en_curso' THEN 1 ELSE 0 END)           AS eventos_en_curso,
  COALESCE(SUM(ev.participantes_estimados), 0)                      AS participantes_estimados_total,
  COALESCE(SUM(ev.reservas), 0)                                     AS reservas_total,
  (
    SELECT COALESCE(SUM(pe.monto_presupuestado), 0)
    FROM presupuestos_evento pe
  )                                                                 AS presupuesto_total,
  (
    SELECT COALESCE(SUM(pe.monto_utilizado), 0)
    FROM presupuestos_evento pe
  )                                                                 AS presupuesto_utilizado,
  (
    SELECT COUNT(DISTINCT ae.usuario_id)
    FROM asignacion_evento ae
    WHERE ae.estado IN ('asignado','confirmado')
  )                                                                 AS personal_asignado_activo
FROM eventos ev;

-- -----------------------------------------------------------------------------
-- Dashboard Ventas
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_dashboard_ventas AS
SELECT
  COUNT(*)                                                          AS total_ventas,
  SUM(CASE WHEN v.estado = 'confirmada' THEN 1 ELSE 0 END)          AS ventas_confirmadas,
  COALESCE(SUM(CASE WHEN v.estado = 'confirmada' THEN v.total ELSE 0 END), 0) AS monto_total_ventas,
  COALESCE(ROUND(AVG(CASE WHEN v.estado = 'confirmada' THEN v.total END), 2), 0) AS ticket_promedio,
  (
    SELECT COALESCE(SUM(dv.cantidad), 0)
    FROM detalle_venta dv
    INNER JOIN venta vx ON vx.id = dv.venta_id AND vx.estado = 'confirmada'
  )                                                                 AS unidades_vendidas,
  (
    SELECT COUNT(*)
    FROM venta v2
    WHERE v2.estado = 'confirmada'
      AND v2.fecha_venta >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
  )                                                                 AS ventas_mes_actual,
  (
    SELECT COALESCE(SUM(v3.total), 0)
    FROM venta v3
    WHERE v3.estado = 'confirmada'
      AND v3.fecha_venta >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
  )                                                                 AS monto_ventas_mes_actual
FROM venta v;

-- -----------------------------------------------------------------------------
-- Vista auxiliar: embarques en tránsito (detalle)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_embarques_en_transito AS
SELECT
  e.id,
  e.codigo,
  e.tipo_transporte,
  e.origen,
  e.destino,
  e.fecha_llegada_estimada,
  e.cantidad_cajas,
  e.estado,
  fi.codigo AS factura_codigo,
  oc.codigo AS orden_compra_codigo,
  p.nombre  AS proveedor
FROM embarque e
INNER JOIN factura_internacional fi ON fi.id = e.factura_internacional_id
INNER JOIN orden_compra oc ON oc.id = e.orden_compra_id
INNER JOIN proveedores p ON p.id = e.proveedor_id
WHERE e.estado IN ('registrado', 'en_transito', 'en_aduana');


-- >>> 14_procedimientos.sql <<<

-- =============================================================================
-- LibroSys — Procedimientos almacenados
-- Archivo: 14_procedimientos.sql
-- =============================================================================

USE librosys;

DELIMITER $$

-- -----------------------------------------------------------------------------
-- sp_actualizar_inventario
-- Actualiza stock y registra movimiento de kardex
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_actualizar_inventario$$
CREATE PROCEDURE sp_actualizar_inventario(
  IN p_producto_id      INT UNSIGNED,
  IN p_almacen_id     INT UNSIGNED,
  IN p_cantidad       INT,
  IN p_tipo_movimiento ENUM('entrada','salida','ajuste','transferencia_entrada','transferencia_salida','venta','recepcion'),
  IN p_referencia     VARCHAR(50),
  IN p_referencia_tipo VARCHAR(50),
  IN p_usuario_id     INT UNSIGNED,
  IN p_observaciones  VARCHAR(255)
)
BEGIN
  DECLARE v_stock_actual INT DEFAULT 0;
  DECLARE v_stock_nuevo  INT DEFAULT 0;
  DECLARE v_minimo       INT DEFAULT 10;

  START TRANSACTION;

  SELECT stock, stock_minimo INTO v_stock_actual, v_minimo
  FROM inventario
  WHERE producto_id = p_producto_id AND almacen_id = p_almacen_id
  FOR UPDATE;

  IF v_stock_actual IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Registro de inventario no encontrado.';
  END IF;

  SET v_stock_nuevo = v_stock_actual + p_cantidad;

  IF v_stock_nuevo < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stock insuficiente para la operación.';
  END IF;

  UPDATE inventario
  SET stock = v_stock_nuevo,
      estado_stock = CASE
        WHEN v_stock_nuevo = 0 THEN 'agotado'
        WHEN v_stock_nuevo <= v_minimo THEN 'bajo'
        ELSE 'normal'
      END
  WHERE producto_id = p_producto_id AND almacen_id = p_almacen_id;

  INSERT INTO movimiento_inventario (
    producto_id, almacen_id, usuario_id, tipo_movimiento,
    cantidad, saldo_posterior, referencia, referencia_tipo, observaciones
  ) VALUES (
    p_producto_id, p_almacen_id, p_usuario_id, p_tipo_movimiento,
    p_cantidad, v_stock_nuevo, p_referencia, p_referencia_tipo, p_observaciones
  );

  COMMIT;
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_movimiento
-- Wrapper simplificado para movimientos
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_movimiento$$
CREATE PROCEDURE sp_registrar_movimiento(
  IN p_producto_id      INT UNSIGNED,
  IN p_almacen_id       INT UNSIGNED,
  IN p_cantidad         INT,
  IN p_tipo_movimiento  VARCHAR(30),
  IN p_referencia       VARCHAR(50),
  IN p_usuario_id       INT UNSIGNED
)
BEGIN
  CALL sp_actualizar_inventario(
    p_producto_id, p_almacen_id, p_cantidad,
    p_tipo_movimiento, p_referencia, 'manual', p_usuario_id, 'Movimiento manual'
  );
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_compra
-- Crea orden de compra con detalle
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_compra$$
CREATE PROCEDURE sp_registrar_compra(
  IN p_codigo           VARCHAR(30),
  IN p_proveedor_id     INT UNSIGNED,
  IN p_moneda_id        INT UNSIGNED,
  IN p_usuario_id       INT UNSIGNED,
  IN p_tipo_compra      ENUM('nacional','internacional'),
  IN p_fecha_orden      DATE,
  IN p_detalle_json     JSON,
  OUT p_orden_id        INT UNSIGNED
)
BEGIN
  DECLARE v_subtotal DECIMAL(18,2) DEFAULT 0;
  DECLARE v_items    INT UNSIGNED DEFAULT 0;
  DECLARE v_idx      INT DEFAULT 0;
  DECLARE v_len      INT DEFAULT 0;

  SET @librosys_from_proc = 1;
  START TRANSACTION;

  SET v_len = JSON_LENGTH(p_detalle_json);

  WHILE v_idx < v_len DO
    SET v_subtotal = v_subtotal + (
      JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].cantidad'))) *
      JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].costo_unitario')))
    );
    SET v_items = v_items + JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].cantidad')));
    SET v_idx = v_idx + 1;
  END WHILE;

  INSERT INTO orden_compra (
    codigo, proveedor_id, moneda_id, usuario_id, tipo_compra,
    fecha_orden, subtotal, impuestos, total, cantidad_items, estado
  ) VALUES (
    p_codigo, p_proveedor_id, p_moneda_id, p_usuario_id, p_tipo_compra,
    p_fecha_orden, v_subtotal, 0, v_subtotal, v_items, 'pendiente'
  );

  SET p_orden_id = LAST_INSERT_ID();
  SET v_idx = 0;

  WHILE v_idx < v_len DO
    INSERT INTO detalle_orden_compra (orden_compra_id, producto_id, cantidad, costo_unitario, subtotal)
    VALUES (
      p_orden_id,
      JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].producto_id'))),
      JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].cantidad'))),
      JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].costo_unitario'))),
      JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].cantidad'))) *
      JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].costo_unitario')))
    );
    SET v_idx = v_idx + 1;
  END WHILE;

  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
  VALUES ('compras', 'orden_compra', p_orden_id, 'crear', p_usuario_id, CONCAT('Orden ', p_codigo, ' registrada'));

  COMMIT;
  SET @librosys_from_proc = NULL;
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_factura_internacional
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_factura_internacional$$
CREATE PROCEDURE sp_registrar_factura_internacional(
  IN p_codigo           VARCHAR(30),
  IN p_orden_compra_id  INT UNSIGNED,
  IN p_fecha_factura    DATE,
  IN p_usuario_id       INT UNSIGNED,
  OUT p_factura_id      INT UNSIGNED
)
BEGIN
  DECLARE v_proveedor_id INT UNSIGNED;
  DECLARE v_moneda_id    INT UNSIGNED;
  DECLARE v_monto        DECIMAL(18,2);
  DECLARE v_tipo         VARCHAR(20);

  SELECT proveedor_id, moneda_id, total, tipo_compra
  INTO v_proveedor_id, v_moneda_id, v_monto, v_tipo
  FROM orden_compra
  WHERE id = p_orden_compra_id;

  IF v_tipo <> 'internacional' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La orden debe ser de tipo internacional.';
  END IF;

  START TRANSACTION;

  INSERT INTO factura_internacional (
    codigo, orden_compra_id, proveedor_id, moneda_id,
    fecha_factura, monto, estado_pago, etapa_importacion
  ) VALUES (
    p_codigo, p_orden_compra_id, v_proveedor_id, v_moneda_id,
    p_fecha_factura, v_monto, 'pendiente', 'factura_internacional'
  );

  SET p_factura_id = LAST_INSERT_ID();

  UPDATE orden_compra SET estado = 'aprobada' WHERE id = p_orden_compra_id;

  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
  VALUES ('importaciones', 'factura_internacional', p_factura_id, 'crear', p_usuario_id,
          CONCAT('Factura internacional ', p_codigo, ' generada'));

  COMMIT;
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_embarque
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_embarque$$
CREATE PROCEDURE sp_registrar_embarque(
  IN p_codigo                   VARCHAR(30),
  IN p_factura_internacional_id INT UNSIGNED,
  IN p_tipo_transporte          ENUM('maritimo','aereo','courier'),
  IN p_origen                   VARCHAR(150),
  IN p_destino                  VARCHAR(150),
  IN p_fecha_salida             DATE,
  IN p_fecha_llegada            DATE,
  IN p_cantidad_cajas           INT UNSIGNED,
  IN p_usuario_id               INT UNSIGNED,
  IN p_costos_json              JSON,
  OUT p_embarque_id             INT UNSIGNED
)
BEGIN
  DECLARE v_orden_id     INT UNSIGNED;
  DECLARE v_proveedor_id INT UNSIGNED;
  DECLARE v_moneda_dop   INT UNSIGNED;

  SELECT orden_compra_id, proveedor_id
  INTO v_orden_id, v_proveedor_id
  FROM factura_internacional
  WHERE id = p_factura_internacional_id;

  SELECT id INTO v_moneda_dop FROM monedas WHERE codigo = 'DOP' LIMIT 1;

  START TRANSACTION;

  INSERT INTO embarque (
    codigo, factura_internacional_id, orden_compra_id, proveedor_id,
    tipo_transporte, origen, destino, fecha_salida, fecha_llegada_estimada,
    cantidad_cajas, estado
  ) VALUES (
    p_codigo, p_factura_internacional_id, v_orden_id, v_proveedor_id,
    p_tipo_transporte, p_origen, p_destino, p_fecha_salida, p_fecha_llegada,
    p_cantidad_cajas, 'registrado'
  );

  SET p_embarque_id = LAST_INSERT_ID();

  INSERT INTO costos_embarque (
    embarque_id, moneda_id,
    flete_internacional, seguro, aduana, transporte_local,
    gastos_portuarios, manipulacion, otros
  ) VALUES (
    p_embarque_id, v_moneda_dop,
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_costos_json, '$.flete_internacional')), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_costos_json, '$.seguro')), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_costos_json, '$.aduana')), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_costos_json, '$.transporte_local')), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_costos_json, '$.gastos_portuarios')), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_costos_json, '$.manipulacion')), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_costos_json, '$.otros')), 0)
  );

  UPDATE factura_internacional
  SET etapa_importacion = 'embarque_registrado'
  WHERE id = p_factura_internacional_id;

  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
  VALUES ('importaciones', 'embarque', p_embarque_id, 'crear', p_usuario_id,
          CONCAT('Embarque ', p_codigo, ' registrado'));

  COMMIT;
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_recepcion
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_recepcion$$
CREATE PROCEDURE sp_registrar_recepcion(
  IN p_codigo           VARCHAR(30),
  IN p_orden_compra_id  INT UNSIGNED,
  IN p_usuario_id       INT UNSIGNED,
  IN p_almacen_id       INT UNSIGNED,
  IN p_detalle_json     JSON,
  OUT p_recepcion_id    INT UNSIGNED
)
BEGIN
  DECLARE v_proveedor_id INT UNSIGNED;
  DECLARE v_tipo         VARCHAR(20);
  DECLARE v_idx          INT DEFAULT 0;
  DECLARE v_len          INT DEFAULT 0;
  DECLARE v_producto_id  INT UNSIGNED;
  DECLARE v_esperada     INT UNSIGNED;
  DECLARE v_recibida     INT UNSIGNED;
  DECLARE v_costo        DECIMAL(18,4);
  DECLARE v_total_rec    INT UNSIGNED DEFAULT 0;
  DECLARE v_total_esp    INT UNSIGNED DEFAULT 0;

  SELECT proveedor_id, tipo_compra INTO v_proveedor_id, v_tipo
  FROM orden_compra WHERE id = p_orden_compra_id;

  SET @librosys_from_proc = 1;
  START TRANSACTION;

  SET v_len = JSON_LENGTH(p_detalle_json);

  WHILE v_idx < v_len DO
    SET v_esperada = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].cantidad_esperada')));
    SET v_total_esp = v_total_esp + v_esperada;
    SET v_idx = v_idx + 1;
  END WHILE;

  INSERT INTO recepcion (
    codigo, orden_compra_id, proveedor_id, usuario_id, tipo_compra,
    fecha_recepcion, estado, total_items_esperados, total_items_recibidos
  ) VALUES (
    p_codigo, p_orden_compra_id, v_proveedor_id, p_usuario_id, v_tipo,
    CURDATE(), 'pendiente', v_total_esp, 0
  );

  SET p_recepcion_id = LAST_INSERT_ID();
  SET v_idx = 0;

  WHILE v_idx < v_len DO
    SET v_producto_id = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].producto_id')));
    SET v_esperada    = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].cantidad_esperada')));
    SET v_recibida    = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].cantidad_recibida')));
    SET v_costo       = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].costo_unitario')));

    INSERT INTO detalle_recepcion (recepcion_id, producto_id, cantidad_esperada, cantidad_recibida, costo_unitario)
    VALUES (p_recepcion_id, v_producto_id, v_esperada, v_recibida, v_costo);

    IF v_recibida > 0 THEN
      CALL sp_actualizar_inventario(
        v_producto_id, p_almacen_id, v_recibida, 'recepcion',
        p_codigo, 'recepcion', p_usuario_id, 'Recepción de mercancía'
      );
      SET v_total_rec = v_total_rec + v_recibida;
    END IF;

    SET v_idx = v_idx + 1;
  END WHILE;

  UPDATE recepcion
  SET total_items_recibidos = v_total_rec,
      estado = CASE
        WHEN v_total_rec = 0 THEN 'pendiente'
        WHEN v_total_rec < total_items_esperados THEN 'parcial'
        ELSE 'completa'
      END
  WHERE id = p_recepcion_id;

  IF v_total_rec >= v_total_esp THEN
    UPDATE orden_compra SET estado = 'recibida' WHERE id = p_orden_compra_id;
  END IF;

  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
  VALUES ('compras', 'recepcion', p_recepcion_id, 'crear', p_usuario_id,
          CONCAT('Recepción ', p_codigo, ' registrada'));

  COMMIT;
  SET @librosys_from_proc = NULL;
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_venta
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_venta$$
CREATE PROCEDURE sp_registrar_venta(
  IN p_codigo           VARCHAR(30),
  IN p_sucursal_id      INT UNSIGNED,
  IN p_almacen_id       INT UNSIGNED,
  IN p_usuario_id       INT UNSIGNED,
  IN p_moneda_id        INT UNSIGNED,
  IN p_cliente_nombre   VARCHAR(200),
  IN p_detalle_json     JSON,
  OUT p_venta_id        INT UNSIGNED
)
BEGIN
  DECLARE v_subtotal  DECIMAL(18,2) DEFAULT 0;
  DECLARE v_idx       INT DEFAULT 0;
  DECLARE v_len       INT DEFAULT 0;
  DECLARE v_producto  INT UNSIGNED;
  DECLARE v_cantidad  INT UNSIGNED;
  DECLARE v_precio    DECIMAL(18,2);

  SET @librosys_from_proc = 1;
  START TRANSACTION;

  SET v_len = JSON_LENGTH(p_detalle_json);
  WHILE v_idx < v_len DO
    SET v_subtotal = v_subtotal + (
      JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].cantidad'))) *
      JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].precio_unitario')))
    );
    SET v_idx = v_idx + 1;
  END WHILE;

  INSERT INTO venta (
    codigo, sucursal_id, almacen_id, usuario_id, moneda_id,
    cliente_nombre, subtotal, impuestos, total, estado
  ) VALUES (
    p_codigo, p_sucursal_id, p_almacen_id, p_usuario_id, p_moneda_id,
    p_cliente_nombre, v_subtotal, ROUND(v_subtotal * 0.18, 2), ROUND(v_subtotal * 1.18, 2), 'confirmada'
  );

  SET p_venta_id = LAST_INSERT_ID();
  SET v_idx = 0;

  WHILE v_idx < v_len DO
    SET v_producto = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].producto_id')));
    SET v_cantidad = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].cantidad')));
    SET v_precio   = JSON_UNQUOTE(JSON_EXTRACT(p_detalle_json, CONCAT('$[', v_idx, '].precio_unitario')));

    INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal)
    VALUES (p_venta_id, v_producto, v_cantidad, v_precio, v_cantidad * v_precio);

    CALL sp_actualizar_inventario(
      v_producto, p_almacen_id, -v_cantidad, 'venta',
      p_codigo, 'venta', p_usuario_id, 'Venta de mercancía'
    );

    SET v_idx = v_idx + 1;
  END WHILE;

  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
  VALUES ('ventas', 'venta', p_venta_id, 'crear', p_usuario_id, CONCAT('Venta ', p_codigo, ' registrada'));

  COMMIT;
  SET @librosys_from_proc = NULL;
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_evento
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_evento$$
CREATE PROCEDURE sp_registrar_evento(
  IN p_codigo           VARCHAR(30),
  IN p_nombre           VARCHAR(200),
  IN p_tipo             VARCHAR(100),
  IN p_fecha_inicio     DATE,
  IN p_fecha_fin        DATE,
  IN p_ubicacion        VARCHAR(200),
  IN p_editorial_id     INT UNSIGNED,
  IN p_responsable_id   INT UNSIGNED,
  IN p_usuario_id       INT UNSIGNED,
  OUT p_evento_id       INT UNSIGNED
)
BEGIN
  START TRANSACTION;

  INSERT INTO eventos (
    codigo, nombre, tipo, fecha_inicio, fecha_fin, ubicacion,
    editorial_id, responsable_id, estado
  ) VALUES (
    p_codigo, p_nombre, p_tipo, p_fecha_inicio, p_fecha_fin, p_ubicacion,
    p_editorial_id, p_responsable_id, 'programado'
  );

  SET p_evento_id = LAST_INSERT_ID();

  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
  VALUES ('eventos', 'eventos', p_evento_id, 'crear', p_usuario_id, CONCAT('Evento ', p_codigo, ' registrado'));

  COMMIT;
END$$

-- -----------------------------------------------------------------------------
-- sp_asignar_personal
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_asignar_personal$$
CREATE PROCEDURE sp_asignar_personal(
  IN p_evento_id        INT UNSIGNED,
  IN p_usuario_id       INT UNSIGNED,
  IN p_rol_evento       VARCHAR(100),
  IN p_horas_asignadas  DECIMAL(8,2),
  IN p_asignado_por     INT UNSIGNED
)
BEGIN
  START TRANSACTION;

  INSERT INTO asignacion_evento (evento_id, usuario_id, rol_evento, horas_asignadas, estado)
  VALUES (p_evento_id, p_usuario_id, p_rol_evento, p_horas_asignadas, 'asignado')
  ON DUPLICATE KEY UPDATE
    rol_evento = p_rol_evento,
    horas_asignadas = p_horas_asignadas,
    estado = 'asignado';

  UPDATE eventos
  SET estado = CASE WHEN estado = 'programado' THEN 'personal_asignado' ELSE estado END
  WHERE id = p_evento_id;

  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
  VALUES ('eventos', 'asignacion_evento', p_evento_id, 'crear', p_asignado_por,
          CONCAT('Personal asignado al evento ', p_evento_id));

  COMMIT;
END$$

-- -----------------------------------------------------------------------------
-- sp_registrar_costeo
-- Distribuye costos de flete proporcionalmente por línea de OC
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_registrar_costeo$$
CREATE PROCEDURE sp_registrar_costeo(
  IN p_embarque_id      INT UNSIGNED,
  IN p_usuario_id       INT UNSIGNED
)
BEGIN
  DECLARE v_orden_id      INT UNSIGNED;
  DECLARE v_freight_total DECIMAL(18,2) DEFAULT 0;
  DECLARE v_subtotal_oc   DECIMAL(18,2) DEFAULT 0;
  DECLARE v_done          INT DEFAULT 0;

  DECLARE cur_lineas CURSOR FOR
    SELECT id, producto_id, cantidad, costo_unitario, subtotal
    FROM detalle_orden_compra
    WHERE orden_compra_id = v_orden_id;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  SELECT orden_compra_id INTO v_orden_id FROM embarque WHERE id = p_embarque_id;

  SELECT COALESCE(total_costos, 0) INTO v_freight_total
  FROM costos_embarque WHERE embarque_id = p_embarque_id;

  IF v_freight_total <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El embarque no tiene costos registrados.';
  END IF;

  SELECT COALESCE(SUM(subtotal), 0) INTO v_subtotal_oc
  FROM detalle_orden_compra WHERE orden_compra_id = v_orden_id;

  START TRANSACTION;

  DELETE FROM costeo_libro WHERE embarque_id = p_embarque_id;

  OPEN cur_lineas;
  read_loop: LOOP
    FETCH cur_lineas INTO @det_id, @prod_id, @qty, @unit_cost, @line_sub;
    IF v_done = 1 THEN
      LEAVE read_loop;
    END IF;

    SET @line_share = IF(v_subtotal_oc > 0, @line_sub / v_subtotal_oc, 0);
    SET @freight_alloc = ROUND((v_freight_total * @line_share) / GREATEST(@qty, 1), 4);

    INSERT INTO costeo_libro (
      embarque_id, producto_id, orden_compra_id, detalle_orden_id,
      costo_producto, flete_asignado
    ) VALUES (
      p_embarque_id, @prod_id, v_orden_id, @det_id,
      @unit_cost, @freight_alloc
    );
  END LOOP;
  CLOSE cur_lineas;

  UPDATE embarque SET estado = 'costeado' WHERE id = p_embarque_id;

  UPDATE factura_internacional fi
  INNER JOIN embarque e ON e.factura_internacional_id = fi.id
  SET fi.etapa_importacion = 'costeo_libro'
  WHERE e.id = p_embarque_id;

  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
  VALUES ('importaciones', 'costeo_libro', p_embarque_id, 'crear', p_usuario_id,
          CONCAT('Costeo registrado para embarque ', p_embarque_id));

  COMMIT;
END$$

DELIMITER ;


-- >>> 15_triggers.sql <<<

-- =============================================================================
-- LibroSys — Triggers
-- Archivo: 15_triggers.sql
-- Nota: Los procedimientos almacenados setean @librosys_from_proc = 1
--       para evitar doble ejecución de triggers de inventario.
-- =============================================================================

USE librosys;

DELIMITER $$

-- =============================================================================
-- AUDITORÍA AUTOMÁTICA
-- =============================================================================

DROP TRIGGER IF EXISTS trg_aud_orden_compra_insert$$
CREATE TRIGGER trg_aud_orden_compra_insert
AFTER INSERT ON orden_compra
FOR EACH ROW
BEGIN
  IF @librosys_from_proc IS NULL THEN
    INSERT INTO auditoria (modulo, entidad, entidad_id, accion, descripcion)
    VALUES ('compras', 'orden_compra', NEW.id, 'crear', CONCAT('Orden ', NEW.codigo, ' creada (trigger)'));
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_aud_embarque_update$$
CREATE TRIGGER trg_aud_embarque_update
AFTER UPDATE ON embarque
FOR EACH ROW
BEGIN
  IF OLD.estado <> NEW.estado THEN
    INSERT INTO auditoria (modulo, entidad, entidad_id, accion, descripcion)
    VALUES ('importaciones', 'embarque', NEW.id, 'actualizar', CONCAT('Estado: ', OLD.estado, ' → ', NEW.estado));

    INSERT INTO auditoria_cambio (auditoria_id, campo, valor_anterior, valor_nuevo)
    VALUES (LAST_INSERT_ID(), 'estado', OLD.estado, NEW.estado);
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_aud_venta_insert$$
CREATE TRIGGER trg_aud_venta_insert
AFTER INSERT ON venta
FOR EACH ROW
BEGIN
  IF @librosys_from_proc IS NULL THEN
    INSERT INTO auditoria (modulo, entidad, entidad_id, accion, usuario_id, descripcion)
    VALUES ('ventas', 'venta', NEW.id, 'crear', NEW.usuario_id, CONCAT('Venta ', NEW.codigo, ' creada (trigger)'));
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_aud_producto_delete$$
CREATE TRIGGER trg_aud_producto_delete
BEFORE DELETE ON productos
FOR EACH ROW
BEGIN
  INSERT INTO auditoria (modulo, entidad, entidad_id, accion, descripcion)
  VALUES ('inventario', 'productos', OLD.id, 'eliminar', CONCAT('Producto ', OLD.codigo, ' eliminado'));

  INSERT INTO auditoria_eliminacion (auditoria_id, entidad, entidad_id, motivo, datos_eliminados, usuario_id)
  VALUES (
    LAST_INSERT_ID(), 'productos', OLD.id, 'Eliminación de producto',
    JSON_OBJECT('codigo', OLD.codigo, 'isbn', OLD.isbn, 'titulo', OLD.titulo),
    NULL
  );
END$$

-- =============================================================================
-- INVENTARIO — VENTAS
-- =============================================================================

DROP TRIGGER IF EXISTS trg_inventario_despues_venta$$
CREATE TRIGGER trg_inventario_despues_venta
AFTER INSERT ON detalle_venta
FOR EACH ROW
BEGIN
  DECLARE v_almacen_id INT UNSIGNED;
  DECLARE v_usuario_id INT UNSIGNED;
  DECLARE v_codigo     VARCHAR(30);

  IF @librosys_from_proc IS NULL THEN
    SELECT v.almacen_id, v.usuario_id, v.codigo
    INTO v_almacen_id, v_usuario_id, v_codigo
    FROM venta v WHERE v.id = NEW.venta_id;

    CALL sp_actualizar_inventario(
      NEW.producto_id, v_almacen_id, -NEW.cantidad, 'venta',
      v_codigo, 'venta', v_usuario_id, 'Salida por venta (trigger)'
    );
  END IF;
END$$

-- =============================================================================
-- INVENTARIO — RECEPCIÓN DE MERCANCÍA
-- =============================================================================

DROP TRIGGER IF EXISTS trg_inventario_despues_recepcion$$
CREATE TRIGGER trg_inventario_despues_recepcion
AFTER UPDATE ON detalle_recepcion
FOR EACH ROW
BEGIN
  DECLARE v_delta        INT;
  DECLARE v_almacen_id   INT UNSIGNED DEFAULT 1;
  DECLARE v_usuario_id   INT UNSIGNED;
  DECLARE v_codigo       VARCHAR(30);

  IF NEW.cantidad_recibida > OLD.cantidad_recibida AND @librosys_from_proc IS NULL THEN
    SET v_delta = NEW.cantidad_recibida - OLD.cantidad_recibida;

    SELECT r.usuario_id, r.codigo
    INTO v_usuario_id, v_codigo
    FROM recepcion r WHERE r.id = NEW.recepcion_id;

    CALL sp_actualizar_inventario(
      NEW.producto_id, v_almacen_id, v_delta, 'recepcion',
      v_codigo, 'recepcion', v_usuario_id, 'Entrada por recepción (trigger)'
    );

    UPDATE recepcion r
    SET r.total_items_recibidos = (
          SELECT COALESCE(SUM(dr.cantidad_recibida), 0)
          FROM detalle_recepcion dr WHERE dr.recepcion_id = r.id
        ),
        r.estado = CASE
          WHEN (SELECT SUM(dr.cantidad_recibida) FROM detalle_recepcion dr WHERE dr.recepcion_id = r.id) = 0 THEN 'pendiente'
          WHEN (SELECT SUM(dr.cantidad_recibida) FROM detalle_recepcion dr WHERE dr.recepcion_id = r.id) < r.total_items_esperados THEN 'parcial'
          ELSE 'completa'
        END
    WHERE r.id = NEW.recepcion_id;
  END IF;
END$$

-- =============================================================================
-- IMPORTACIONES — ESTADOS DE EMBARQUE
-- =============================================================================

DROP TRIGGER IF EXISTS trg_embarque_costos_insert$$
CREATE TRIGGER trg_embarque_costos_insert
AFTER INSERT ON costos_embarque
FOR EACH ROW
BEGIN
  UPDATE factura_internacional fi
  INNER JOIN embarque e ON e.factura_internacional_id = fi.id
  SET fi.etapa_importacion = 'costos_flete'
  WHERE e.id = NEW.embarque_id
    AND fi.etapa_importacion IN ('factura_internacional', 'embarque_registrado');
END$$

DROP TRIGGER IF EXISTS trg_costeo_libro_insert$$
CREATE TRIGGER trg_costeo_libro_insert
AFTER INSERT ON costeo_libro
FOR EACH ROW
BEGIN
  UPDATE embarque
  SET estado = 'costeado'
  WHERE id = NEW.embarque_id AND estado IN ('recibido', 'en_aduana', 'en_transito', 'registrado');

  UPDATE factura_internacional fi
  INNER JOIN embarque e ON e.factura_internacional_id = fi.id
  SET fi.etapa_importacion = 'costeo_libro'
  WHERE e.id = NEW.embarque_id;
END$$

DROP TRIGGER IF EXISTS trg_consolidacion_embarque_insert$$
CREATE TRIGGER trg_consolidacion_embarque_insert
AFTER INSERT ON consolidacion_embarque
FOR EACH ROW
BEGIN
  DECLARE v_cajas INT UNSIGNED;

  SELECT cantidad_cajas INTO v_cajas FROM embarque WHERE id = NEW.embarque_id;

  UPDATE consolidacion
  SET total_cajas = total_cajas + COALESCE(v_cajas, 0)
  WHERE id = NEW.consolidacion_id;

  UPDATE embarque
  SET consolidacion_id = NEW.consolidacion_id,
      estado = CASE WHEN estado = 'en_transito' THEN 'en_aduana' ELSE estado END
  WHERE id = NEW.embarque_id;
END$$

-- =============================================================================
-- EVENTOS — PRESUPUESTO UTILIZADO
-- =============================================================================

DROP TRIGGER IF EXISTS trg_presupuesto_evento_update$$
CREATE TRIGGER trg_presupuesto_evento_update
BEFORE UPDATE ON presupuestos_evento
FOR EACH ROW
BEGIN
  IF NEW.monto_utilizado > NEW.monto_presupuestado THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'El monto utilizado no puede superar el presupuesto asignado.';
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_presupuesto_evento_after_update$$
CREATE TRIGGER trg_presupuesto_evento_after_update
AFTER UPDATE ON presupuestos_evento
FOR EACH ROW
BEGIN
  IF OLD.monto_utilizado <> NEW.monto_utilizado THEN
    INSERT INTO auditoria (modulo, entidad, entidad_id, accion, descripcion)
    VALUES ('eventos', 'presupuestos_evento', NEW.id, 'actualizar',
            CONCAT('Presupuesto utilizado: ', OLD.monto_utilizado, ' → ', NEW.monto_utilizado));

    INSERT INTO auditoria_cambio (auditoria_id, campo, valor_anterior, valor_nuevo)
    VALUES (LAST_INSERT_ID(), 'monto_utilizado', OLD.monto_utilizado, NEW.monto_utilizado);

    IF NEW.monto_utilizado >= NEW.monto_presupuestado THEN
      UPDATE eventos
      SET estado = CASE WHEN estado IN ('programado','personal_asignado') THEN 'en_curso' ELSE estado END
      WHERE id = NEW.evento_id;
    END IF;
  END IF;
END$$

-- =============================================================================
-- INVENTARIO — ESTADO DE STOCK AUTOMÁTICO
-- =============================================================================

DROP TRIGGER IF EXISTS trg_inventario_estado_stock$$
CREATE TRIGGER trg_inventario_estado_stock
BEFORE UPDATE ON inventario
FOR EACH ROW
BEGIN
  SET NEW.estado_stock = CASE
    WHEN NEW.stock = 0 THEN 'agotado'
    WHEN NEW.stock <= NEW.stock_minimo THEN 'bajo'
    ELSE 'normal'
  END;
END$$

DELIMITER ;

-- Variable de sesión usada por procedimientos almacenados
-- SET @librosys_from_proc = 1;  -- dentro de SPs antes de operaciones
-- SET @librosys_from_proc = NULL; -- al finalizar


-- >>> 16_indices.sql <<<

-- =============================================================================
-- LibroSys — Índices adicionales
-- Archivo: 16_indices.sql
-- Descripción: Índices compuestos y de rendimiento complementarios
-- =============================================================================

USE librosys;

-- Compras
CREATE INDEX idx_orden_compra_proveedor_estado
  ON orden_compra (proveedor_id, estado);

CREATE INDEX idx_orden_compra_fecha_estado
  ON orden_compra (fecha_orden, estado);

CREATE INDEX idx_detalle_orden_subtotal
  ON detalle_orden_compra (orden_compra_id, subtotal);

CREATE INDEX idx_recepcion_tipo_estado
  ON recepcion (tipo_compra, estado);

CREATE INDEX idx_factura_proveedor_estado_fecha
  ON factura_proveedor (estado_pago, fecha_factura);

-- Inventario
CREATE INDEX idx_inventario_estado_stock_almacen
  ON inventario (estado_stock, almacen_id);

CREATE INDEX idx_movimiento_tipo_fecha
  ON movimiento_inventario (tipo_movimiento, fecha_movimiento);

CREATE INDEX idx_productos_editorial_categoria
  ON productos (editorial_id, categoria_id);

CREATE INDEX idx_ajuste_fecha_estado
  ON ajuste_inventario (fecha_ajuste, estado);

-- Importaciones
CREATE INDEX idx_factura_int_etapa_estado
  ON factura_internacional (etapa_importacion, estado_pago);

CREATE INDEX idx_embarque_estado_fechas
  ON embarque (estado, fecha_salida, fecha_llegada_estimada);

CREATE INDEX idx_embarque_proveedor_estado
  ON embarque (proveedor_id, estado);

CREATE INDEX idx_costeo_embarque_orden
  ON costeo_libro (embarque_id, orden_compra_id);

CREATE INDEX idx_pallet_embarque_ubicacion
  ON pallet (embarque_id, ubicacion);

CREATE INDEX idx_caja_embarque_pallet
  ON caja (embarque_id, pallet_id);

-- Ventas
CREATE INDEX idx_venta_sucursal_fecha_estado
  ON venta (sucursal_id, fecha_venta, estado);

CREATE INDEX idx_venta_usuario_fecha
  ON venta (usuario_id, fecha_venta);

CREATE INDEX idx_detalle_venta_producto_cantidad
  ON detalle_venta (producto_id, cantidad);

-- Transferencias
CREATE INDEX idx_transferencia_estado_fechas
  ON transferencia (estado, fecha_solicitud, fecha_envio);

CREATE INDEX idx_detalle_transferencia_estado_cantidades
  ON detalle_transferencia (transferencia_id, cantidad_recibida, cantidad_enviada);

-- Eventos
CREATE INDEX idx_eventos_estado_fecha_inicio
  ON eventos (estado, fecha_inicio);

CREATE INDEX idx_asignacion_evento_estado
  ON asignacion_evento (evento_id, estado);

CREATE INDEX idx_presupuesto_evento_utilizacion
  ON presupuestos_evento (evento_id, monto_utilizado, monto_presupuestado);

-- Configuración y notificaciones
CREATE INDEX idx_notificaciones_usuario_leida_fecha
  ON notificaciones (usuario_id, leida, created_at);

CREATE INDEX idx_correo_pendiente
  ON correo_notificacion (estado_envio, created_at);

-- Auditoría
CREATE INDEX idx_auditoria_modulo_accion_fecha
  ON auditoria (modulo, accion, fecha_evento);

CREATE INDEX idx_auditoria_cambio_campo
  ON auditoria_cambio (auditoria_id, campo);

CREATE INDEX idx_auditoria_acceso_tipo_fecha
  ON auditoria_acceso (tipo_acceso, fecha_acceso);

-- Seguridad
CREATE INDEX idx_usuarios_rol_estado
  ON usuarios (rol_id, estado);

CREATE INDEX idx_tasas_vigencia_actual
  ON tasas_cambio (moneda_origen_id, moneda_destino_id, vigente_desde DESC);

-- Administración
CREATE INDEX idx_proveedores_pais_tipo
  ON proveedores (pais, tipo, estado);

CREATE INDEX idx_almacenes_sucursal_tipo
  ON almacenes (sucursal_id, tipo, estado);


-- >>> 17_eventos_facturacion.sql <<<

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


-- >>> 18_modulos_extendidos.sql <<<

-- =============================================================================
-- LibroSys — Módulos extendidos
-- Archivo: 18_modulos_extendidos.sql
-- =============================================================================

USE librosys;

CREATE TABLE IF NOT EXISTS contrato_editorial (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  editorial_id        INT UNSIGNED NOT NULL,
  nombre              VARCHAR(200) NOT NULL,
  tipo_contrato       VARCHAR(100) NOT NULL,
  fecha_inicio        DATE NOT NULL,
  fecha_fin           DATE NOT NULL,
  estado              ENUM('activo','por_vencer','vencido','cancelado') NOT NULL DEFAULT 'activo',
  responsable_id      INT UNSIGNED NULL,
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_contrato_codigo (codigo),
  CONSTRAINT fk_contrato_editorial FOREIGN KEY (editorial_id) REFERENCES editoriales (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_contrato_responsable FOREIGN KEY (responsable_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS renovacion_contrato (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  contrato_id         INT UNSIGNED NOT NULL,
  fecha_vencimiento_anterior DATE NOT NULL,
  fecha_vencimiento_nueva    DATE NOT NULL,
  fecha_renovacion    DATE NOT NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_renovacion_contrato FOREIGN KEY (contrato_id) REFERENCES contrato_editorial (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_renovacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS condicion_comercial (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  editorial_id        INT UNSIGNED NOT NULL,
  descuento_pct       DECIMAL(5,2) NULL,
  plazo_credito_dias  INT UNSIGNED NULL,
  moneda_id           INT UNSIGNED NOT NULL,
  contacto            VARCHAR(150) NULL,
  observaciones       TEXT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_condicion_editorial (editorial_id),
  CONSTRAINT fk_condicion_editorial FOREIGN KEY (editorial_id) REFERENCES editoriales (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_condicion_moneda FOREIGN KEY (moneda_id) REFERENCES monedas (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS historial_tasa_cambio (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tasa_cambio_id      INT UNSIGNED NOT NULL,
  tasa                DECIMAL(18,6) NOT NULL,
  fecha_registro      DATETIME NOT NULL,
  actualizado_por_id  INT UNSIGNED NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_historial_tasa FOREIGN KEY (tasa_cambio_id) REFERENCES tasas_cambio (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_historial_tasa_usuario FOREIGN KEY (actualizado_por_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE inventario
  ADD COLUMN pasillo VARCHAR(20) NULL AFTER ubicacion,
  ADD COLUMN estante VARCHAR(20) NULL AFTER pasillo,
  ADD COLUMN seccion  VARCHAR(50) NULL AFTER estante;

CREATE TABLE IF NOT EXISTS conteo_fisico (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  almacen_id          INT UNSIGNED NOT NULL,
  usuario_id          INT UNSIGNED NOT NULL,
  fecha_conteo        DATE NOT NULL,
  total_productos     INT UNSIGNED NOT NULL DEFAULT 0,
  total_discrepancias INT UNSIGNED NOT NULL DEFAULT 0,
  estado              ENUM('en_progreso','completado','anulado') NOT NULL DEFAULT 'en_progreso',
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_conteo_codigo (codigo),
  CONSTRAINT fk_conteo_almacen FOREIGN KEY (almacen_id) REFERENCES almacenes (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_conteo_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detalle_conteo_fisico (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  conteo_id           INT UNSIGNED NOT NULL,
  producto_id         INT UNSIGNED NOT NULL,
  stock_sistema       INT NOT NULL,
  stock_contado       INT NOT NULL,
  diferencia          INT GENERATED ALWAYS AS (stock_contado - stock_sistema) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uk_conteo_producto (conteo_id, producto_id),
  CONSTRAINT fk_detalle_conteo FOREIGN KEY (conteo_id) REFERENCES conteo_fisico (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_detalle_conteo_producto FOREIGN KEY (producto_id) REFERENCES productos (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cambio_producto (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                  VARCHAR(30)  NOT NULL,
  venta_id                INT UNSIGNED NOT NULL,
  producto_original_id    INT UNSIGNED NOT NULL,
  producto_nuevo_id       INT UNSIGNED NOT NULL,
  cantidad                INT UNSIGNED NOT NULL DEFAULT 1,
  diferencia_precio       DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  motivo                  VARCHAR(255) NOT NULL,
  usuario_id              INT UNSIGNED NOT NULL,
  fecha_cambio            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cambio_codigo (codigo),
  CONSTRAINT fk_cambio_venta FOREIGN KEY (venta_id) REFERENCES venta (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_cambio_producto_orig FOREIGN KEY (producto_original_id) REFERENCES productos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_cambio_producto_nuevo FOREIGN KEY (producto_nuevo_id) REFERENCES productos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_cambio_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nota_credito (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo              VARCHAR(30)  NOT NULL,
  venta_id            INT UNSIGNED NOT NULL,
  cambio_producto_id  INT UNSIGNED NULL,
  fecha_emision       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  motivo              VARCHAR(255) NOT NULL,
  monto               DECIMAL(18,2) NOT NULL,
  estado              ENUM('activa','utilizada','expirada','anulada') NOT NULL DEFAULT 'activa',
  PRIMARY KEY (id),
  UNIQUE KEY uk_nota_credito_codigo (codigo),
  CONSTRAINT fk_nota_credito_venta FOREIGN KEY (venta_id) REFERENCES venta (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_nota_credito_cambio FOREIGN KEY (cambio_producto_id) REFERENCES cambio_producto (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sesion_usuario (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id          INT UNSIGNED NOT NULL,
  token_sesion        VARCHAR(255) NOT NULL,
  dispositivo         VARCHAR(150) NULL,
  ip_address          VARCHAR(45)  NULL,
  fecha_inicio        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actividad    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado              ENUM('activa','expirada','cerrada') NOT NULL DEFAULT 'activa',
  PRIMARY KEY (id),
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mfa_usuario (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id          INT UNSIGNED NOT NULL,
  habilitado          TINYINT(1)   NOT NULL DEFAULT 0,
  metodo              ENUM('app','sms','email') NOT NULL DEFAULT 'app',
  ultima_verificacion DATETIME NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_mfa_usuario (usuario_id),
  CONSTRAINT fk_mfa_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS intento_acceso_fallido (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email_intento       VARCHAR(150) NOT NULL,
  ip_address          VARCHAR(45)  NULL,
  motivo              VARCHAR(255) NULL,
  fecha_intento       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- >>> 19_vistas_eventos.sql <<<

-- =============================================================================
-- LibroSys — Vistas Eventos y Facturación
-- Archivo: 19_vistas_eventos.sql
-- =============================================================================

USE librosys;

CREATE OR REPLACE VIEW vw_dashboard_evento_facturacion AS
SELECT
  e.id AS evento_id,
  e.codigo AS evento_codigo,
  e.nombre AS evento_nombre,
  e.estado AS evento_estado,
  e.presupuesto_asignado,
  e.total_ingresos,
  e.total_gastos,
  e.presupuesto_disponible,
  e.estado_presupuesto,
  COUNT(DISTINCT ce.id) AS cajas_abiertas,
  COUNT(DISTINCT fe.id) AS facturas_emitidas,
  COALESCE(SUM(CASE WHEN fe.estado = 'emitida' THEN fe.total END), 0) AS total_facturado
FROM eventos e
LEFT JOIN caja_evento ce ON ce.evento_id = e.id AND ce.estado = 'abierta'
LEFT JOIN factura_evento fe ON fe.evento_id = e.id
GROUP BY e.id;

CREATE OR REPLACE VIEW vw_ventas_por_evento AS
SELECT
  e.id AS evento_id,
  e.codigo AS evento_codigo,
  e.nombre AS evento_nombre,
  v.id AS venta_id,
  v.codigo AS venta_codigo,
  v.tipo_venta,
  v.fecha_venta,
  v.cliente_nombre,
  v.subtotal,
  v.impuestos AS itbis,
  v.total,
  v.estado AS estado_venta,
  u.nombre AS cajero,
  fe.codigo AS factura_evento_codigo
FROM venta v
INNER JOIN eventos e ON e.id = v.evento_id
LEFT JOIN factura_evento fe ON fe.venta_id = v.id
LEFT JOIN usuarios u ON u.id = v.usuario_id
WHERE v.tipo_venta IN ('evento', 'feria');

CREATE OR REPLACE VIEW vw_ventas_por_editorial_evento AS
SELECT
  e.id AS evento_id,
  e.codigo AS evento_codigo,
  ed.id AS editorial_id,
  ed.nombre AS editorial_nombre,
  COUNT(DISTINCT v.id) AS cantidad_ventas,
  COALESCE(SUM(dv.cantidad), 0) AS unidades_vendidas,
  COALESCE(SUM(dv.subtotal), 0) AS subtotal_vendido
FROM eventos e
INNER JOIN venta v ON v.evento_id = e.id AND v.estado = 'confirmada'
INNER JOIN detalle_venta dv ON dv.venta_id = v.id
INNER JOIN productos p ON p.id = dv.producto_id
INNER JOIN editoriales ed ON ed.id = p.editorial_id
GROUP BY e.id, ed.id;

CREATE OR REPLACE VIEW vw_productos_mas_vendidos_evento AS
SELECT
  e.id AS evento_id,
  e.codigo AS evento_codigo,
  p.id AS producto_id,
  p.codigo AS producto_codigo,
  p.titulo AS producto_titulo,
  SUM(dv.cantidad) AS cantidad_vendida,
  SUM(dv.subtotal) AS monto_vendido
FROM eventos e
INNER JOIN venta v ON v.evento_id = e.id AND v.estado = 'confirmada'
INNER JOIN detalle_venta dv ON dv.venta_id = v.id
INNER JOIN productos p ON p.id = dv.producto_id
GROUP BY e.id, p.id
ORDER BY cantidad_vendida DESC;

CREATE OR REPLACE VIEW vw_historial_ventas_unificado AS
SELECT
  v.id,
  v.codigo,
  v.tipo_venta,
  v.fecha_venta,
  v.cliente_nombre,
  v.total,
  v.estado,
  s.nombre AS sucursal,
  e.codigo AS evento_codigo,
  e.nombre AS evento_nombre,
  e.fecha_inicio AS evento_fecha_inicio,
  e.fecha_fin AS evento_fecha_fin
FROM venta v
INNER JOIN sucursales s ON s.id = v.sucursal_id
LEFT JOIN eventos e ON e.id = v.evento_id;


-- >>> 20_triggers_eventos.sql <<<

-- =============================================================================
-- LibroSys — Triggers Eventos / Facturación / Presupuesto
-- Archivo: 20_triggers_eventos.sql
-- =============================================================================

USE librosys;

DELIMITER $$

DROP TRIGGER IF EXISTS trg_evento_gasto_after_insert$$
CREATE TRIGGER trg_evento_gasto_after_insert
AFTER INSERT ON evento_gasto
FOR EACH ROW
BEGIN
  UPDATE eventos
  SET total_gastos = total_gastos + NEW.monto,
      estado_presupuesto = CASE
        WHEN presupuesto_asignado + total_ingresos - (total_gastos + NEW.monto) <= 0 THEN 'agotado'
        ELSE 'activo'
      END
  WHERE id = NEW.evento_id;
END$$

DROP TRIGGER IF EXISTS trg_factura_evento_after_insert$$
CREATE TRIGGER trg_factura_evento_after_insert
AFTER INSERT ON factura_evento
FOR EACH ROW
BEGIN
  IF NEW.estado = 'emitida' THEN
    UPDATE eventos SET total_ingresos = total_ingresos + NEW.total WHERE id = NEW.evento_id;
    UPDATE caja_evento SET total_ventas = total_ventas + NEW.total WHERE id = NEW.caja_evento_id;
  END IF;
END$$

DROP TRIGGER IF EXISTS trg_factura_evento_after_update$$
CREATE TRIGGER trg_factura_evento_after_update
AFTER UPDATE ON factura_evento
FOR EACH ROW
BEGIN
  IF OLD.estado = 'emitida' AND NEW.estado = 'anulada' THEN
    UPDATE eventos SET total_ingresos = total_ingresos - OLD.total WHERE id = OLD.evento_id;
    UPDATE caja_evento SET total_ventas = total_ventas - OLD.total WHERE id = OLD.caja_evento_id;
  END IF;
END$$

DELIMITER ;


-- >>> 21_seed_v2.sql <<<

-- =============================================================================
-- LibroSys — Datos de prueba v2 (Eventos, Facturación, Editoriales, Seguridad)
-- Archivo: 21_seed_v2.sql
-- Ejecutar DESPUÉS de 17-20 (requiere tablas ampliadas)
-- =============================================================================

USE librosys;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- EVENTOS v2 — Presupuesto resumen, personal, caja y facturación
-- =============================================================================

UPDATE eventos SET
  almacen_operativo_id = 1,
  presupuesto_asignado = 185000.00,
  total_ingresos       = 0.00,
  total_gastos         = 0.00,
  estado_presupuesto   = 'activo',
  estado               = 'en_curso'
WHERE id = 1;

UPDATE eventos SET
  almacen_operativo_id = 1,
  presupuesto_asignado = 15000.00,
  total_ingresos       = 0.00,
  total_gastos         = 0.00,
  estado_presupuesto   = 'activo'
WHERE id = 2;

INSERT INTO empleado (id, codigo, nombre, area, estado, disponible, eventos_participados) VALUES
(1, 'EMP-001', 'Carlos Mendoza',   'ventas',     'activo', 1, 12),
(2, 'EMP-002', 'Laura Fernández',  'caja',       'activo', 1,  8),
(3, 'EMP-003', 'Pedro Ramírez',    'logistica',  'activo', 0, 15),
(4, 'EMP-004', 'Sofía Herrera',    'inventario', 'activo', 1,  6);

INSERT INTO asignacion_personal_evento (id, evento_id, empleado_id, area, fecha_inicio, fecha_fin, estado) VALUES
(1, 1, 1, 'ventas',    '2026-07-15', '2026-07-20', 'confirmado'),
(2, 1, 2, 'caja',      '2026-07-15', '2026-07-20', 'confirmado'),
(3, 1, 3, 'logistica', '2026-07-14', '2026-07-21', 'confirmado'),
(4, 2, 1, 'ventas',    '2026-06-25', '2026-06-25', 'completado'),
(5, 2, 2, 'caja',      '2026-06-25', '2026-06-25', 'completado');

INSERT INTO evento_gasto (id, evento_id, concepto, monto, fecha_gasto, moneda_id) VALUES
(1, 1, 'Alquiler stand principal', 45000.00, '2026-07-01', 1),
(2, 1, 'Transporte logístico',       12000.00, '2026-07-10', 1),
(3, 2, 'Merchandising presentación',  8500.00, '2026-06-20', 1);

INSERT INTO evento_producto_planificado (id, evento_id, producto_id, cantidad_planificada, almacen_origen_id) VALUES
(1, 1, 1, 50, 1),
(2, 1, 3, 30, 1),
(3, 1, 9, 40, 1);

INSERT INTO evento_editorial (id, evento_id, editorial_id, stand, cantidad_productos) VALUES
(1, 1, 1, 'A-12', 120),
(2, 1, 4, 'B-05',  45);

INSERT INTO evento_historial (id, evento_id, usuario_id, fecha_evento, accion, detalle) VALUES
(1, 1, 1, '2026-06-01 09:00:00', 'Evento creado',           'Feria del Libro SD 2026 registrada'),
(2, 1, 1, '2026-06-15 10:30:00', 'Presupuesto asignado',    'RD$ 185,000.00 asignados'),
(3, 1, 1, '2026-07-15 08:00:00', 'Caja abierta',            'Caja CAJ-EVT-001 abierta con RD$ 5,000.00');

INSERT INTO caja_evento (id, codigo, evento_id, almacen_id, usuario_apertura_id, fecha_apertura, monto_inicial, total_ventas, estado) VALUES
(1, 'CAJ-EVT-001', 1, 1, 1, '2026-07-15 08:00:00', 5000.00, 0.00, 'abierta');

INSERT INTO venta (id, codigo, tipo_venta, sucursal_id, almacen_id, usuario_id, moneda_id, evento_id, caja_evento_id, cliente_nombre, metodo_pago, tipo_cliente, fecha_venta, subtotal, descuento, impuestos, total, estado) VALUES
(6, 'VTA-EVT-001', 'feria', 1, 1, 1, 1, 1, 1, 'Visitante Feria',   'efectivo',    'ocasional',     '2026-07-15 10:15:00', 37.98, 0.00, 6.84, 44.82, 'confirmada'),
(7, 'VTA-EVT-002', 'feria', 1, 1, 1, 1, 1, 1, 'Colegio San José',  'transferencia','institucional', '2026-07-15 11:30:00', 59.97, 0.00, 10.79, 70.76, 'confirmada');

INSERT INTO detalle_venta (id, venta_id, producto_id, cantidad, precio_unitario, descuento_linea, subtotal) VALUES
(8, 6, 1, 1, 18.99, 0.00, 18.99),
(9, 6, 4, 1, 12.00, 0.00, 12.00),
(10, 6, 9, 1,  6.99, 0.00,  6.99),
(11, 7, 3, 3, 19.99, 0.00, 59.97);

INSERT INTO factura_evento (id, codigo, evento_id, caja_evento_id, venta_id, fecha_factura, subtotal, itbis, total, estado, cliente_nombre) VALUES
(1, 'FE-EVT-001', 1, 1, 6, '2026-07-15 10:15:00', 37.98, 6.84, 44.82, 'emitida', 'Visitante Feria'),
(2, 'FE-EVT-002', 1, 1, 7, '2026-07-15 11:30:00', 59.97, 10.79, 70.76, 'emitida', 'Colegio San José');

-- =============================================================================
-- EDITORIALES — Contratos y condiciones comerciales
-- =============================================================================

INSERT INTO contrato_editorial (id, codigo, editorial_id, nombre, tipo_contrato, fecha_inicio, fecha_fin, estado, responsable_id) VALUES
(1, 'CTR-PLAN-2026', 1, 'Contrato Distribución Planeta 2026', 'Distribución exclusiva', '2026-01-01', '2026-12-31', 'activo', 1),
(2, 'CTR-PRH-2026',  3, 'Contrato Importación PRH 2026',      'Importación',            '2026-01-01', '2026-12-31', 'activo', 1);

INSERT INTO renovacion_contrato (id, contrato_id, fecha_vencimiento_anterior, fecha_vencimiento_nueva, fecha_renovacion, usuario_id) VALUES
(1, 1, '2025-12-31', '2026-12-31', '2026-01-05', 1);

INSERT INTO condicion_comercial (id, editorial_id, descuento_pct, plazo_credito_dias, moneda_id, contacto) VALUES
(1, 1, 12.50, 30, 1, 'Carlos Ruiz'),
(2, 3,  8.00, 45, 2, 'John Smith');

INSERT INTO historial_tasa_cambio (id, tasa_cambio_id, tasa, fecha_registro, actualizado_por_id) VALUES
(1, 1, 58.500000, '2026-01-01 00:00:00', 1),
(2, 1, 59.100000, '2026-03-01 00:00:00', 1);

-- =============================================================================
-- VENTAS — Notas de crédito y cambios
-- =============================================================================

INSERT INTO cambio_producto (id, codigo, venta_id, producto_original_id, producto_nuevo_id, cantidad, diferencia_precio, motivo, usuario_id) VALUES
(1, 'CAM-2026-001', 2, 2, 7, 1, -0.51, 'Cliente prefirió otro título', 1);

INSERT INTO nota_credito (id, codigo, venta_id, cambio_producto_id, motivo, monto, estado) VALUES
(1, 'NC-2026-001', 2, 1, 'Diferencia por cambio de producto', 0.51, 'activa');

-- =============================================================================
-- INVENTARIO — Conteo físico de muestra
-- =============================================================================

INSERT INTO conteo_fisico (id, codigo, almacen_id, usuario_id, fecha_conteo, total_productos, total_discrepancias, estado) VALUES
(1, 'CNT-2026-001', 1, 1, '2026-06-20', 3, 1, 'completado');

INSERT INTO detalle_conteo_fisico (id, conteo_id, producto_id, stock_sistema, stock_contado) VALUES
(1, 1, 1, 120, 120),
(2, 1, 4, 200, 198),
(3, 1, 7,  15,  15);

-- =============================================================================
-- SEGURIDAD — Sesiones y MFA
-- =============================================================================

INSERT INTO sesion_usuario (id, usuario_id, token_sesion, dispositivo, ip_address, fecha_inicio, ultima_actividad, estado) VALUES
(1, 1, 'sess_ana_garcia_active_001', 'Chrome / Windows', '192.168.1.5',  '2026-07-14 08:00:00', '2026-07-14 11:00:00', 'activa'),
(2, 2, 'sess_luis_martinez_002',     'Firefox / Windows','192.168.1.10', '2026-07-14 07:30:00', '2026-07-14 10:45:00', 'activa');

INSERT INTO mfa_usuario (id, usuario_id, habilitado, metodo, ultima_verificacion) VALUES
(1, 1, 1, 'app', '2026-07-14 08:01:00');

INSERT INTO intento_acceso_fallido (id, email_intento, ip_address, motivo) VALUES
(1, 'admin@librosys.com', '203.0.113.45', 'Contraseña incorrecta');

SET FOREIGN_KEY_CHECKS = 1;

