<?php
require_once __DIR__ . '/../includes/init.php';
require_once __DIR__ . '/../includes/crud.php';

$baseUrl = url('modules/transferencias.php');
$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? '';
$transfers = MockData::transfers();
$history = MockData::transferHistory();
$item = $id ? MockData::findById($transfers, $id) : null;

handleCrudPost('transferencia', $baseUrl);

$currentModule = 'transferencias';
$pageTitle = match($action) {
    'create' => 'Nueva Transferencia',
    'edit' => 'Editar Transferencia',
    'view' => 'Detalle de Transferencia',
    'delete' => 'Eliminar Transferencia',
    default => 'Transferencias',
};
$pageSubtitle = 'Movimientos entre sucursales';

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';

if ($action === 'list'): ?>
  <?php crudToolbar($baseUrl, 'transferencias'); ?>
  <div class="row g-3 mb-4">
    <div class="col-md-4"><div class="stat-card text-center"><div class="stat-value"><?= count($transfers) ?></div><div class="stat-label">Activas</div></div></div>
    <div class="col-md-4"><div class="stat-card text-center"><div class="stat-value"><?= count(array_filter($transfers, fn($t) => $t['status'] === 'in_transit')) ?></div><div class="stat-label">En tránsito</div></div></div>
    <div class="col-md-4"><div class="stat-card text-center"><div class="stat-value"><?= count($history) ?></div><div class="stat-label">Completadas</div></div></div>
  </div>
  <div class="card mb-4">
    <div class="card-header">Transferencias Activas</div>
    <div class="table-responsive">
      <table class="table table-hover mb-0 data-table">
        <thead><tr><th>ID</th><th>Origen → Destino</th><th>Producto</th><th>Cant.</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
        <tbody>
          <?php foreach ($transfers as $t): ?>
            <tr>
              <td class="font-monospace small text-corporate"><?= e($t['id']) ?></td>
              <td><?= e($t['origin']) ?> → <strong><?= e($t['destination']) ?></strong></td>
              <td><?= e($t['product']) ?></td>
              <td class="fw-semibold"><?= e((string)$t['qty']) ?></td>
              <td><?= statusBadge($t['status']) ?></td>
              <td class="small text-muted"><?= e($t['date']) ?></td>
              <td><?= crudActions($baseUrl, $t['id']) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
  <div class="card">
    <div class="card-header">Historial</div>
    <div class="table-responsive">
      <table class="table table-hover mb-0">
        <thead><tr><th>ID</th><th>Ruta</th><th>Producto</th><th>Cant.</th><th>Fecha</th></tr></thead>
        <tbody>
          <?php foreach ($history as $h): ?>
            <tr>
              <td class="small text-muted"><?= e($h['id']) ?></td>
              <td><?= e($h['origin']) ?> → <?= e($h['destination']) ?></td>
              <td><?= e($h['product']) ?></td>
              <td><?= e((string)$h['qty']) ?></td>
              <td class="small"><?= e($h['date']) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>

<?php elseif ($action === 'create' || ($action === 'edit' && $item)): ?>
  <div class="card"><div class="card-body">
    <form method="post" class="needs-validation" novalidate>
      <input type="hidden" name="crud_action" value="save">
      <div class="row">
        <?php
          renderFormField('Sucursal origen', 'origin', $item['origin'] ?? 'Almacén Central', 'text', true);
          renderFormField('Sucursal destino', 'destination', $item['destination'] ?? '', 'text', true);
          renderFormField('Producto', 'product', $item['product'] ?? '', 'text', true);
          renderFormField('Cantidad', 'qty', (string)($item['qty'] ?? ''), 'number', true);
        ?>
      </div>
      <button type="submit" class="btn btn-corporate mt-3">Guardar</button>
      <a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary mt-3">Cancelar</a>
    </form>
  </div></div>

<?php elseif ($action === 'view' && $item): ?>
  <div class="card"><div class="card-body">
    <div class="row g-3">
      <div class="col-md-6"><div class="detail-label">ID</div><div class="detail-value"><?= e($item['id']) ?></div></div>
      <div class="col-md-6"><div class="detail-label">Estado</div><div><?= statusBadge($item['status']) ?></div></div>
      <div class="col-md-6"><div class="detail-label">Origen</div><div class="detail-value"><?= e($item['origin']) ?></div></div>
      <div class="col-md-6"><div class="detail-label">Destino</div><div class="detail-value"><?= e($item['destination']) ?></div></div>
      <div class="col-md-6"><div class="detail-label">Producto</div><div class="detail-value"><?= e($item['product']) ?></div></div>
      <div class="col-md-6"><div class="detail-label">Transporte</div><div class="detail-value"><?= e($item['transport']) ?></div></div>
    </div>
    <a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary btn-sm mt-4">← Volver</a>
  </div></div>

<?php elseif ($action === 'delete' && $item): ?>
  <div class="card border-danger"><div class="card-body">
    <p>¿Eliminar transferencia <strong><?= e($item['id']) ?></strong>?</p>
    <form method="post"><input type="hidden" name="crud_action" value="delete">
      <button class="btn btn-danger">Confirmar</button>
      <a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary">Cancelar</a>
    </form>
  </div></div>
<?php else: ?>
  <div class="alert alert-warning">Registro no encontrado.</div>
<?php endif;

require_once __DIR__ . '/../includes/footer.php';
