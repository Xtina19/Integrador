<?php
require_once __DIR__ . '/../includes/init.php';
require_once __DIR__ . '/../includes/crud.php';

$baseUrl = url('modules/inventario.php');
$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? '';
$products = MockData::products();
$item = $id ? MockData::findById($products, $id) : null;

handleCrudPost('producto', $baseUrl);

$currentModule = 'inventario';
$pageTitle = match($action) {
    'create' => 'Registrar Producto',
    'edit' => 'Editar Producto',
    'view' => 'Detalle de Producto',
    'delete' => 'Eliminar Producto',
    default => 'Gestión de Inventario',
};
$pageSubtitle = match($action) {
    'create', 'edit' => 'Formulario de producto',
    'view' => 'Consulta de ficha',
    'delete' => 'Confirmación de eliminación',
    default => 'Control de productos y stock',
};

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';

if ($action === 'list'): ?>
  <?php crudToolbar($baseUrl, 'productos'); ?>
  <div class="card">
    <div class="card-header d-flex justify-content-between">
      <span>Catálogo de Productos</span>
      <select class="form-select form-select-sm filter-select" style="width:auto" data-target="#productTable">
        <option value="all">Todos los estados</option>
        <option value="normal">Normal</option>
        <option value="low">Bajo stock</option>
        <option value="out">Agotado</option>
      </select>
    </div>
    <div class="table-responsive">
      <table class="table table-hover mb-0 data-table" id="productTable">
        <thead><tr><th>ISBN</th><th>Título</th><th>Categoría</th><th>Editorial</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          <?php foreach ($products as $p): ?>
            <tr data-status="<?= e($p['status']) ?>">
              <td class="font-monospace small text-muted"><?= e($p['isbn']) ?></td>
              <td><div class="fw-medium"><?= e($p['title']) ?></div><div class="text-muted small"><?= e($p['author']) ?></div></td>
              <td><span class="badge bg-secondary"><?= e($p['category']) ?></span></td>
              <td><?= e($p['publisher']) ?></td>
              <td class="text-corporate fw-semibold"><?= e((string)$p['stock']) ?></td>
              <td><?= statusBadge($p['status']) ?></td>
              <td><?= crudActions($baseUrl, $p['id']) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>

<?php elseif ($action === 'view' && $item): ?>
  <div class="card">
    <div class="card-body">
      <div class="row">
        <div class="col-md-8">
          <div class="row g-3">
            <div class="col-md-6"><div class="detail-label">ISBN</div><div class="detail-value font-monospace"><?= e($item['isbn']) ?></div></div>
            <div class="col-md-6"><div class="detail-label">Título</div><div class="detail-value"><?= e($item['title']) ?></div></div>
            <div class="col-md-6"><div class="detail-label">Autor</div><div class="detail-value"><?= e($item['author']) ?></div></div>
            <div class="col-md-6"><div class="detail-label">Ubicación</div><div class="detail-value"><?= e($item['location']) ?></div></div>
            <div class="col-md-6"><div class="detail-label">Stock</div><div class="detail-value text-corporate fw-bold"><?= e((string)$item['stock']) ?></div></div>
            <div class="col-md-6"><div class="detail-label">Estado</div><div><?= statusBadge($item['status']) ?></div></div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="barcode-container border">
            <svg class="barcode" data-code="<?= e($item['isbn']) ?>"></svg>
          </div>
        </div>
      </div>
      <div class="mt-4"><a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary btn-sm">← Volver</a></div>
    </div>
  </div>

<?php elseif (($action === 'create') || ($action === 'edit' && $item)): ?>
  <div class="card">
    <div class="card-body">
      <form method="post" class="needs-validation" novalidate>
        <input type="hidden" name="crud_action" value="save">
        <div class="row">
          <?php
            renderFormField('ISBN', 'isbn', $item['isbn'] ?? '', 'text', true);
            renderFormField('Título', 'title', $item['title'] ?? '', 'text', true);
            renderFormField('Autor', 'author', $item['author'] ?? '');
            renderFormField('Categoría', 'category', $item['category'] ?? '');
            renderFormField('Editorial', 'publisher', $item['publisher'] ?? '');
            renderFormField('Stock', 'stock', (string)($item['stock'] ?? ''), 'number', true);
            renderFormField('Ubicación', 'location', $item['location'] ?? '');
          ?>
        </div>
        <div class="d-flex gap-2 mt-3">
          <button type="submit" class="btn btn-corporate">Guardar</button>
          <a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary">Cancelar</a>
        </div>
      </form>
    </div>
  </div>

<?php elseif ($action === 'delete' && $item): ?>
  <div class="card border-danger">
    <div class="card-body">
      <h5 class="text-danger">¿Eliminar producto?</h5>
      <p>Se eliminará <strong><?= e($item['title']) ?></strong> (ISBN: <?= e($item['isbn']) ?>). Esta acción es simulada.</p>
      <form method="post">
        <input type="hidden" name="crud_action" value="delete">
        <button type="submit" class="btn btn-danger">Confirmar eliminación</button>
        <a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary">Cancelar</a>
      </form>
    </div>
  </div>
<?php else: ?>
  <div class="alert alert-warning">Registro no encontrado. <a href="<?= e($baseUrl) ?>">Volver al listado</a></div>
<?php endif;

require_once __DIR__ . '/../includes/footer.php';
