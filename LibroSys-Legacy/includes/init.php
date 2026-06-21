<?php
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/MockData.php';

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function url(string $path): string
{
    return BASE_URL . '/' . ltrim($path, '/');
}

function statusBadge(string $status): string
{
    $map = [
        'normal' => 'success', 'active' => 'success', 'completed' => 'success', 'paid' => 'success',
        'low' => 'warning', 'pending' => 'warning', 'expiring' => 'warning', 'warning' => 'warning',
        'out' => 'danger', 'danger' => 'danger', 'inactive' => 'secondary', 'cancelled' => 'danger',
        'in_transit' => 'info', 'info' => 'info', 'upcoming' => 'info', 'planned' => 'secondary',
        'pending_receipt' => 'warning',
    ];
    $variant = $map[$status] ?? 'secondary';
    $labels = [
        'normal' => 'Normal', 'low' => 'Bajo stock', 'out' => 'Agotado', 'active' => 'Activo',
        'inactive' => 'Inactivo', 'pending' => 'Pendiente', 'in_transit' => 'En tránsito',
        'pending_receipt' => 'Por recibir', 'completed' => 'Completada', 'upcoming' => 'Próximo',
        'planned' => 'Planificado',
    ];
    $label = $labels[$status] ?? ucfirst($status);
    return "<span class=\"badge bg-{$variant}\">" . e($label) . "</span>";
}

function flashMessage(): void
{
    if (!empty($_SESSION['flash'])) {
        $type = $_SESSION['flash_type'] ?? 'success';
        echo '<div class="alert alert-' . e($type) . ' alert-dismissible fade show" role="alert">'
            . e($_SESSION['flash'])
            . '<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>';
        unset($_SESSION['flash'], $_SESSION['flash_type']);
    }
}

function setFlash(string $message, string $type = 'success'): void
{
    $_SESSION['flash'] = $message;
    $_SESSION['flash_type'] = $type;
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
