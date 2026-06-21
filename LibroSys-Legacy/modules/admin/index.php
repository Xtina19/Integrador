<?php
require_once __DIR__ . '/../../includes/init.php';

$currentModule = 'admin';
$pageTitle = 'Administración General';
$pageSubtitle = 'Gestión de Catálogos Maestros';
$stats = MockData::adminStats();

require_once __DIR__ . '/../../includes/header.php';
require_once __DIR__ . '/../../includes/sidebar.php';
?>

<div class="row g-3 mb-4">
  <div class="col-sm-6 col-xl-4"><div class="stat-card"><div class="stat-label">Productos</div><div class="stat-value"><?= number_format($stats['totalProducts']) ?></div></div></div>
  <div class="col-sm-6 col-xl-4"><div class="stat-card"><div class="stat-label">Categorías</div><div class="stat-value"><?= $stats['totalCategories'] ?></div></div></div>
  <div class="col-sm-6 col-xl-4"><div class="stat-card"><div class="stat-label">Editoriales</div><div class="stat-value"><?= $stats['totalPublishers'] ?></div></div></div>
  <div class="col-sm-6 col-xl-4"><div class="stat-card"><div class="stat-label">Sucursales</div><div class="stat-value"><?= $stats['totalBranches'] ?></div></div></div>
  <div class="col-sm-6 col-xl-4"><div class="stat-card"><div class="stat-label">Proveedores</div><div class="stat-value"><?= $stats['totalSuppliers'] ?></div></div></div>
  <div class="col-sm-6 col-xl-4"><div class="stat-card"><div class="stat-label">Monedas</div><div class="stat-value"><?= $stats['activeCurrencies'] ?></div></div></div>
</div>

<div class="row g-3">
  <?php
  $links = [
    ['url' => 'productos.php', 'icon' => 'bi-book', 'label' => 'Productos', 'desc' => 'Catálogo maestro'],
    ['url' => 'categorias.php', 'icon' => 'bi-tag', 'label' => 'Categorías', 'desc' => 'Clasificación'],
    ['url' => 'editoriales.php', 'icon' => 'bi-building', 'label' => 'Editoriales', 'desc' => 'Contratos'],
    ['url' => 'sucursales.php', 'icon' => 'bi-shop', 'label' => 'Sucursales', 'desc' => 'Puntos de venta'],
    ['url' => 'proveedores.php', 'icon' => 'bi-truck', 'label' => 'Proveedores', 'desc' => 'Distribuidores'],
    ['url' => 'monedas.php', 'icon' => 'bi-currency-exchange', 'label' => 'Monedas', 'desc' => 'Divisas'],
    ['url' => 'tasas-cambio.php', 'icon' => 'bi-graph-up', 'label' => 'Tasas de Cambio', 'desc' => 'Tipos de cambio'],
  ];
  foreach ($links as $link): ?>
    <div class="col-sm-6 col-lg-4">
      <a href="<?= e(url('modules/admin/' . $link['url'])) ?>" class="card text-decoration-none h-100 hover-shadow">
        <div class="card-body d-flex align-items-center gap-3">
          <div class="stat-icon"><i class="bi <?= e($link['icon']) ?>"></i></div>
          <div>
            <div class="fw-semibold text-corporate"><?= e($link['label']) ?></div>
            <div class="small text-muted"><?= e($link['desc']) ?></div>
          </div>
        </div>
      </a>
    </div>
  <?php endforeach; ?>
</div>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>
