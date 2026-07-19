-- Bootstrap mínimo de maestros para desarrollo local (idempotente)
USE librosys;

CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(30) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) NULL,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  rol_id INT UNSIGNED NOT NULL,
  codigo VARCHAR(20) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  apellido VARCHAR(150) NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(30) NULL,
  estado ENUM('activo','inactivo','bloqueado') NOT NULL DEFAULT 'activo',
  ultimo_acceso DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_codigo (codigo),
  UNIQUE KEY uk_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categorias (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(20) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_categorias_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS editoriales (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(20) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  pais VARCHAR(100) NULL,
  contacto VARCHAR(150) NULL,
  email VARCHAR(150) NULL,
  telefono VARCHAR(30) NULL,
  tipo_contrato VARCHAR(100) NULL,
  fecha_vencimiento DATE NULL,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_editoriales_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS proveedores (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(20) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  contacto VARCHAR(150) NULL,
  email VARCHAR(150) NULL,
  telefono VARCHAR(30) NULL,
  pais VARCHAR(100) NULL,
  tipo ENUM('nacional','internacional','mixto') NOT NULL DEFAULT 'nacional',
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_proveedores_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sucursales (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(20) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  ciudad VARCHAR(100) NULL,
  direccion VARCHAR(255) NULL,
  telefono VARCHAR(30) NULL,
  estado ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sucursales_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS almacenes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sucursal_id INT UNSIGNED NULL,
  codigo VARCHAR(20) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  tipo ENUM('central','sucursal','transito','evento') NOT NULL DEFAULT 'central',
  capacidad INT UNSIGNED NULL,
  estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_almacenes_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS productos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(30) NOT NULL,
  isbn VARCHAR(30) NULL,
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(200) NULL,
  categoria_id INT UNSIGNED NULL,
  editorial_id INT UNSIGNED NULL,
  costo DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
  precio DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  estado ENUM('activo','inactivo','descontinuado') NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_productos_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS venta_clientes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dominio_id VARCHAR(64) NOT NULL,
  codigo VARCHAR(30) NULL,
  nombre VARCHAR(200) NOT NULL,
  documento VARCHAR(50) NULL,
  email VARCHAR(150) NULL,
  telefono VARCHAR(30) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_venta_clientes_dominio (dominio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS formas_pago (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(30) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  estado ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_formas_pago_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auditoria (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  modulo VARCHAR(50) NOT NULL,
  entidad VARCHAR(80) NOT NULL,
  entidad_id VARCHAR(50) NOT NULL,
  accion ENUM('crear','actualizar','eliminar','consultar','acceso','otro') NOT NULL,
  usuario_id INT UNSIGNED NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  descripcion VARCHAR(500) NULL,
  fecha_evento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- estado en tasas si falta
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasas_cambio' AND COLUMN_NAME = 'estado');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE tasas_cambio ADD COLUMN estado ENUM(''activa'',''inactiva'') NOT NULL DEFAULT ''activa''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO roles (id, codigo, nombre, descripcion, estado) VALUES
(1,'ADMIN','Administrador','Acceso total','activo'),
(2,'COMPRAS','Compras','Módulo compras','activo'),
(3,'VENTAS','Ventas','Módulo ventas','activo');

INSERT IGNORE INTO usuarios (id, rol_id, codigo, nombre, apellido, email, password_hash, estado) VALUES
(1,1,'USR-001','Ana','Pérez','ana@librosys.local','hash','activo'),
(2,2,'USR-002','Luis','Gómez','luis@librosys.local','hash','activo');

INSERT IGNORE INTO categorias (id, codigo, nombre, descripcion, estado) VALUES
(1,'CAT-LIT','Literatura','Narrativa','activo'),
(2,'CAT-INF','Infantil','Niños','activo'),
(3,'CAT-ACA','Académico','Universidad','activo');

INSERT IGNORE INTO editoriales (id, codigo, nombre, pais, estado) VALUES
(1,'ED-01','Alfaguara','España','activo'),
(2,'ED-02','Planeta','España','activo');

INSERT IGNORE INTO proveedores (id, codigo, nombre, tipo, estado) VALUES
(1,'PRV-01','Distribuidora Caribeña','nacional','activo'),
(2,'PRV-02','Planeta Internacional','internacional','activo');

INSERT IGNORE INTO sucursales (id, codigo, nombre, ciudad, estado) VALUES
(1,'SUC-SD','Santo Domingo','Santo Domingo','activa'),
(2,'SUC-STG','Santiago','Santiago','activa');

INSERT IGNORE INTO almacenes (id, sucursal_id, codigo, nombre, tipo, capacidad, estado) VALUES
(1,1,'ALM-CTR','Almacén Central','central',50000,'activo'),
(2,2,'ALM-STI','Almacén Santiago','sucursal',15000,'activo');

INSERT IGNORE INTO productos (id, codigo, isbn, titulo, autor, categoria_id, editorial_id, costo, precio, estado) VALUES
(1,'PRD-001','978-0307474728','Cien años de soledad','Gabriel García Márquez',1,1,8.50,18.99,'activo'),
(2,'PRD-002','978-8497592432','La sombra del viento','Carlos Ruiz Zafón',1,2,6.80,15.50,'activo');

INSERT IGNORE INTO venta_clientes (id, dominio_id, codigo, nombre, documento, email, activo) VALUES
(1,'CLI-001','CLI-001','María González','001-0000000-1','maria@example.com',1),
(2,'CLI-002','CLI-002','Universidad PUCMM','101-00000','compras@pucmm.edu.do',1);

INSERT IGNORE INTO formas_pago (codigo, nombre, estado) VALUES
('efectivo','Efectivo','activa'),
('tarjeta','Tarjeta','activa'),
('transferencia','Transferencia','activa'),
('nota_credito','Nota de Crédito','activa');

INSERT IGNORE INTO monedas (id, codigo, nombre, simbolo, es_principal, estado) VALUES
(1,'DOP','Peso Dominicano','RD$',1,'activa'),
(2,'USD','Dólar Estadounidense','$',0,'activa'),
(3,'EUR','Euro','€',0,'activa'),
(4,'COP','Peso Colombiano','COL$',0,'activa');
