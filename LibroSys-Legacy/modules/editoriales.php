<?php
require_once __DIR__ . '/../includes/init.php';
require_once __DIR__ . '/../includes/crud.php';

$baseUrl = url('modules/editoriales.php');
$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? '';
$publishers = MockData::publishers();
$item = $id ? MockData::findById($publishers, $id) : null;

handleCrudPost('editorial', $baseUrl);

$currentModule = 'editoriales';
$pageTitle = match($action) {
    'create' => 'Registrar Editorial',
    'edit' => 'Editar Editorial',
    'view' => 'Detalle de Editorial',
    'delete' => 'Eliminar Editorial',
    default => 'Editoriales',
};
$pageSubtitle = match($action) {
    default => 'Catálogo de editoriales y contratos',
    'create', 'edit' => 'Formulario de editorial',
};

$expiring = array_filter($publishers, fn($p) => strtotime($p['contractExpiry']) < strtotime('+30 days'));

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';

if ($action === 'list'): ?>
  <div class="row g-3 mb-4">
    <div class="col-sm-6 col-xl-3"><div class="stat-card"><div class="stat-label">Editoriales</div><div class="stat-value"><?= count($publishers) ?></div></div></div>
    <div class="col-sm-6 col-xl-3"><div class="stat-card"><div class="stat-label">Productos</div><div class="stat-value"><?= array_sum(array_column($publishers, 'productCount')) ?></div></div></div>
    <div class="col-sm-6 col-xl-3"><div class="stat-card"><div class="stat-label">Contratos Vigentes</div><div class="stat-value"><?= count($publishers) - count($expiring) ?></div></div></div>
    <div class="col-sm-6 col-xl-3"><div class="stat-card"><div class="stat-label">Por Vencer</div><div class="stat-value text-warning"><?= count($expiring) ?></div></div></div>
  </div>
  <?php crudToolbar($baseUrl, 'editoriales'); ?>
  <div class="card mb-4">
    <div class="card-header">Listado de Editoriales</div>
    <div class="table-responsive">
      <table class="table table-hover mb-0 data-table">
        <thead><tr><th>Editorial</th><th>Correo</th><th>País</th><th>Tipo Contrato</th><th>Productos</th><th>Vencimiento</th><th>Acciones</th></tr></thead>
        <tbody>
          <?php foreach ($publishers as $p): ?>
            <tr>
              <td class="fw-medium"><?= e($p['name']) ?></td>
              <td class="small text-muted"><?= e($p['contact']) ?></td>
              <td><?= e($p['country']) ?></td>
              <td><?= e($p['contractType']) ?></td>
              <td class="text-corporate fw-semibold"><?= e((string)$p['productCount']) ?></td>
              <td class="<?= strtotime($p['contractExpiry']) < strtotime('+30 days') ? 'text-warning fw-medium' : '' ?>"><?= e($p['contractExpiry']) ?></td>
              <td><?= crudActions($baseUrl, $p['id']) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
  <?php if ($expiring): ?>
  <div class="card border-warning">
    <div class="card-header text-warning">Contratos Próximos a Vencer</div>
    <div class="table-responsive">
      <table class="table mb-0">
        <thead><tr><th>Editorial</th><th>Vencimiento</th><th></th></tr></thead>
        <tbody>
          <?php foreach ($expiring as $p): ?>
            <tr>
              <td><?= e($p['name']) ?></td>
              <td class="text-warning fw-medium"><?= e($p['contractExpiry']) ?></td>
              <td><a href="<?= e($baseUrl) ?>?action=edit&id=<?= e($p['id']) ?>" class="btn btn-sm btn-outline-warning">Renovar</a></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
  <?php endif; ?>

<?php elseif ($action === 'create' || ($action === 'edit' && $item)): ?>
  <div class="card"><div class="card-body">
    <form method="post" class="needs-validation" novalidate>
      <input type="hidden" name="crud_action" value="save">
      <div class="row">
        <?php
          renderFormField('Nombre', 'name', $item['name'] ?? '', 'text', true);
          renderFormField('País', 'country', $item['country'] ?? '');
          renderFormField('Correo', 'contact', $item['contact'] ?? '', 'email');
          renderFormField('Tipo de contrato', 'contractType', $item['contractType'] ?? '');
          renderFormField('Vencimiento', 'contractExpiry', $item['contractExpiry'] ?? '', 'date');
          renderFormField('Estado', 'status', $item['status'] ?? 'active', 'select');
        ?>
      </div>
      <button type="submit" class="btn btn-corporate mt-3">Guardar</button>
      <a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary mt-3">Cancelar</a>
    </form>
  </div></div>

<?php elseif ($action === 'view' && $item): ?>
  <div class="card"><div class="card-body">
    <h5><?= e($item['name']) ?></h5>
    <div class="row g-3 mt-2">
      <div class="col-md-6"><div class="detail-label">País</div><div><?= e($item['country']) ?></div></div>
      <div class="col-md-6"><div class="detail-label">Contacto</div><div><?= e($item['contact']) ?></div></div>
      <div class="col-md-6"><div class="detail-label">Tipo de contrato</div><div><?= e($item['contractType']) ?></div></div>
      <div class="col-md-6"><div class="detail-label">Vencimiento</div><div><?= e($item['contractExpiry']) ?></div></div>
      <div class="col-md-6"><div class="detail-label">Productos asociados</div><div class="text-corporate fw-bold"><?= e((string)$item['productCount']) ?></div></div>
    </div>
    <a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary btn-sm mt-4">← Volver</a>
  </div></div>

<?php elseif ($action === 'delete' && $item): ?>
  <div class="card border-danger"><div class="card-body">
    <p>¿Eliminar editorial <strong><?= e($item['name']) ?></strong>?</p>
    <form method="post"><input type="hidden" name="crud_action" value="delete">
      <button class="btn btn-danger">Confirmar</button>
      <a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary">Cancelar</a>
    </form>
  </div></div>
<?php else: ?>
  <div class="alert alert-warning">Registro no encontrado.</div>
<?php endif;

require_once __DIR__ . '/../includes/footer.php';
