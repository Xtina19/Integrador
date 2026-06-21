-- LibroSys-Legacy — Esquema MySQL (XAMPP)
-- Ejecutar en phpMyAdmin para activar modo mysql

CREATE DATABASE IF NOT EXISTS librosys_legacy
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE librosys_legacy;

CREATE TABLE IF NOT EXISTS productos (
  id VARCHAR(10) PRIMARY KEY,
  isbn VARCHAR(20) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(255),
  categoria VARCHAR(100),
  editorial VARCHAR(150),
  stock INT DEFAULT 0,
  ubicacion VARCHAR(150),
  estado ENUM('normal','low','out') DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias (
  id VARCHAR(10) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  estado ENUM('active','inactive') DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS editoriales (
  id VARCHAR(10) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  pais VARCHAR(100),
  contacto VARCHAR(150),
  tipo_contrato VARCHAR(100),
  vencimiento DATE,
  productos INT DEFAULT 0,
  estado ENUM('active','inactive') DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS sucursales (
  id VARCHAR(10) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  ciudad VARCHAR(100),
  stock INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS proveedores (
  id VARCHAR(10) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  contacto VARCHAR(150),
  email VARCHAR(150),
  telefono VARCHAR(30),
  tipo VARCHAR(100),
  compras INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS monedas (
  id VARCHAR(10) PRIMARY KEY,
  codigo VARCHAR(5) NOT NULL,
  nombre VARCHAR(100),
  simbolo VARCHAR(5),
  estado ENUM('active','inactive') DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS tasas_cambio (
  id VARCHAR(10) PRIMARY KEY,
  moneda_origen VARCHAR(5),
  moneda_destino VARCHAR(5),
  tasa DECIMAL(12,4),
  fecha DATETIME,
  actualizado_por VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE,
  rol VARCHAR(50),
  estado ENUM('active','inactive') DEFAULT 'active'
);
