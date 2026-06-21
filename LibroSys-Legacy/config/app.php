<?php
/**
 * LibroSys-Legacy — Configuración general
 * Versión experimental PHP + HTML5 + Bootstrap 5
 */

define('APP_NAME', 'LibroSys');
define('APP_SUBTITLE', 'Librería Joselito');
define('APP_VERSION', 'Legacy 1.0.0');
define('BASE_URL', '/LibroSys-Legacy');

// Colores corporativos (idénticos a la versión React)
define('COLOR_CORPORATE', '#1E2D86');
define('COLOR_GOLD', '#F4D22E');
define('COLOR_WHITE', '#FFFFFF');
define('COLOR_SURFACE', '#F5F5F5');

// Modo de datos: 'mock' usa arrays PHP | 'mysql' usa base de datos
define('DATA_MODE', 'mock');

date_default_timezone_set('America/Santo_Domingo');
