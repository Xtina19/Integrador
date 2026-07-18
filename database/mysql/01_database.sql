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
