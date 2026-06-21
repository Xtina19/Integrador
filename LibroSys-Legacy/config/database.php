<?php
/**
 * Conexión MySQL para XAMPP
 * Activar con DATA_MODE = 'mysql' en config/app.php
 */

$db_config = [
    'host'     => 'localhost',
    'dbname'   => 'librosys_legacy',
    'username' => 'root',
    'password' => '',
    'charset'  => 'utf8mb4',
];

function getDBConnection(): ?PDO
{
    global $db_config;

    if (DATA_MODE !== 'mysql') {
        return null;
    }

    try {
        $dsn = "mysql:host={$db_config['host']};dbname={$db_config['dbname']};charset={$db_config['charset']}";
        $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        error_log('LibroSys DB Error: ' . $e->getMessage());
        return null;
    }
}
