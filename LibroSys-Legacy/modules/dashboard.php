<?php
require_once __DIR__ . '/../includes/init.php';

$currentModule = 'dashboard';
$pageTitle = 'Dashboard';
$pageSubtitle = 'Resumen general del sistema';
$loadCharts = true;

$branches = MockData::branches();
$lowStock = MockData::lowStockProducts();
$alerts = MockData::logisticsAlerts();
$sales = MockData::recentSales();
$stats = MockData::adminStats();
$chartData = MockData::inventoryChartData();
$categories = MockData::stockByCategory();

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
?>

<div class="row g-3 mb-4">
  <div class="col-sm-6 col-xl-3">
    <div class="stat-card d-flex justify-content-between align-items-start">
      <div>
        <div class="stat-label">Total de Productos</div>
        <div class="stat-value"><?= number_format($stats['totalProducts']) ?></div>
        <div class="stat-detail">Catálogo activo</div>
      </div>
      <div class="stat-icon"><i class="bi bi-book"></i></div>
    </div>
  </div>
  <div class="col-sm-6 col-xl-3">
    <div class="stat-card d-flex justify-content-between align-items-start">
      <div>
        <div class="stat-label">Inventario Total</div>
        <div class="stat-value"><?= number_format(array_sum(array_column($branches, 'stock'))) ?></div>
        <div class="stat-detail">Unidades en sistema</div>
      </div>
      <div class="stat-icon"><i class="bi bi-box-seam"></i></div>
    </div>
  </div>
  <div class="col-sm-6 col-xl-3">
    <div class="stat-card d-flex justify-content-between align-items-start">
      <div>
        <div class="stat-label">Bajo Stock</div>
        <div class="stat-value"><?= count($lowStock) ?></div>
        <div class="stat-detail">Requieren reposición</div>
      </div>
      <div class="stat-icon"><i class="bi bi-exclamation-triangle"></i></div>
    </div>
  </div>
  <div class="col-sm-6 col-xl-3">
    <div class="stat-card d-flex justify-content-between align-items-start">
      <div>
        <div class="stat-label">Ventas Hoy</div>
        <div class="stat-value">RD$12,450</div>
        <div class="stat-detail">42 transacciones</div>
      </div>
      <div class="stat-icon"><i class="bi bi-graph-up-arrow"></i></div>
    </div>
  </div>
</div>

<div class="row g-4 mb-4">
  <div class="col-lg-8">
    <div class="card h-100">
      <div class="card-header">Evolución de Inventario</div>
      <div class="card-body"><canvas id="chartInventory" height="120"></canvas></div>
    </div>
  </div>
  <div class="col-lg-4">
    <div class="card h-100">
      <div class="card-header">Stock por Categoría</div>
      <div class="card-body"><canvas id="chartCategories" height="200"></canvas></div>
    </div>
  </div>
</div>

<div class="row g-4 mb-4">
  <div class="col-lg-6">
    <div class="card h-100">
      <div class="card-header">Inventario por Sucursal</div>
      <div class="card-body"><canvas id="chartBranches" height="180"></canvas></div>
    </div>
  </div>
  <div class="col-lg-6">
    <div class="card h-100">
      <div class="card-header">Ventas Mensuales</div>
      <div class="card-body"><canvas id="chartSales" height="180"></canvas></div>
    </div>
  </div>
</div>

<div class="row g-4">
  <div class="col-lg-6">
    <div class="card">
      <div class="card-header">Alertas Logísticas</div>
      <div class="card-body">
        <?php foreach ($alerts as $alert): ?>
          <?php
            $iconClass = match($alert['type']) {
              'danger' => 'bg-danger bg-opacity-10 text-danger',
              'info' => 'bg-info bg-opacity-10 text-info',
              default => 'bg-warning bg-opacity-10 text-warning',
            };
          ?>
          <div class="d-flex gap-3 alert-item mb-2">
            <div class="alert-icon <?= $iconClass ?>"><i class="bi bi-exclamation-triangle"></i></div>
            <div>
              <div class="small"><?= e($alert['message']) ?></div>
              <div class="text-muted" style="font-size:0.7rem"><?= e($alert['time']) ?></div>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
  <div class="col-lg-6">
    <div class="card">
      <div class="card-header">Ventas Recientes</div>
      <div class="table-responsive">
        <table class="table table-hover mb-0 data-table">
          <thead><tr><th>ID</th><th>Producto</th><th>Sucursal</th><th>Total</th></tr></thead>
          <tbody>
            <?php foreach ($sales as $s): ?>
              <tr>
                <td class="text-muted small"><?= e($s['id']) ?></td>
                <td class="fw-medium"><?= e($s['product']) ?></td>
                <td><?= e($s['branch']) ?></td>
                <td class="text-corporate fw-semibold">RD$<?= number_format($s['total']) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<script>
window.chartInventoryData = {
  labels: <?= json_encode(array_column($chartData, 'month')) ?>,
  central: <?= json_encode(array_column($chartData, 'central')) ?>,
  sucursales: <?= json_encode(array_column($chartData, 'sucursales')) ?>,
};
window.chartCategoriesData = {
  labels: <?= json_encode(array_column($categories, 'name')) ?>,
  values: <?= json_encode(array_column($categories, 'value')) ?>,
  colors: <?= json_encode(array_column($categories, 'color')) ?>,
};
window.chartBranchesData = {
  labels: <?= json_encode(array_column($branches, 'name')) ?>,
  values: <?= json_encode(array_column($branches, 'stock')) ?>,
};
window.chartSalesData = {
  labels: ['Ene','Feb','Mar','Abr','May','Jun'],
  values: [285000, 298000, 312000, 305000, 328000, 342800],
};
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
