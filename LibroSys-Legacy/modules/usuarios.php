<?php
require_once __DIR__ . '/../includes/init.php';
require_once __DIR__ . '/../includes/crud.php';

$baseUrl = url('modules/usuarios.php');
$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? '';
$roles = MockData::roles();
$item = $id ? MockData::findById($roles, $id) : null;

handleCrudPost('usuario/rol', $baseUrl);

$currentModule = 'usuarios';
$pageTitle = match($action) {
    'create' => 'Nuevo Usuario',
    'edit' => 'Editar Usuario',
    'view' => 'Detalle de Usuario',
    'delete' => 'Eliminar Usuario',
    default => 'Usuarios y Permisos',
};
$pageSubtitle = 'Roles, accesos y seguridad';

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';

if ($action === 'list'): ?>
  <div class="row g-3 mb-4">
    <div class="col-md-4"><div class="stat-card"><div class="stat-value"><?= array_sum(array_column($roles, 'users')) ?></div><div class="stat-label">Usuarios activos</div></div></div>
    <div class="col-md-4"><div class="stat-card"><div class="stat-value"><?= count($roles) ?></div><div class="stat-label">Roles</div></div></div>
    <div class="col-md-4"><div class="stat-card"><div class="stat-value">3</div><div class="stat-label">Sesiones activas</div></div></div>
  </div>
  <?php crudToolbar($baseUrl, 'roles'); ?>
  <div class="card">
    <div class="card-header">Roles del Sistema</div>
    <div class="table-responsive">
      <table class="table table-hover mb-0 data-table">
        <thead><tr><th>Rol</th><th>Usuarios</th><th>Permisos</th><th>Acciones</th></tr></thead>
        <tbody>
          <?php foreach ($roles as $r): ?>
            <tr>
              <td class="fw-medium"><i class="bi bi-shield me-2 text-corporate"></i><?= e($r['name']) ?></td>
              <td class="text-corporate fw-semibold"><?= e((string)$r['users']) ?></td>
              <td>
                <?php foreach ($r['permissions'] as $perm): ?>
                  <span class="badge <?= $perm === 'all' ? 'bg-warning text-dark' : 'bg-secondary' ?> me-1"><?= e($perm === 'all' ? 'Acceso total' : $perm) ?></span>
                <?php endforeach; ?>
              </td>
              <td><?= crudActions($baseUrl, $r['id']) ?></td>
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
          renderFormField('Nombre del rol', 'name', $item['name'] ?? '', 'text', true);
          renderFormField('Usuarios asignados', 'users', (string)($item['users'] ?? ''), 'number');
        ?>
      </div>
      <button type="submit" class="btn btn-corporate mt-3">Guardar</button>
      <a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary mt-3">Cancelar</a>
    </form>
  </div></div>

<?php elseif ($action === 'view' && $item): ?>
  <div class="card"><div class="card-body">
    <h5><?= e($item['name']) ?></h5>
    <p>Usuarios asignados: <strong class="text-corporate"><?= e((string)$item['users']) ?></strong></p>
    <a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary btn-sm mt-3">← Volver</a>
  </div></div>

<?php elseif ($action === 'delete' && $item): ?>
  <div class="card border-danger"><div class="card-body">
    <p>¿Eliminar rol <strong><?= e($item['name']) ?></strong>?</p>
    <form method="post"><input type="hidden" name="crud_action" value="delete">
      <button class="btn btn-danger">Confirmar</button>
      <a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary">Cancelar</a>
    </form>
  </div></div>
<?php else: ?>
  <div class="alert alert-warning">Registro no encontrado.</div>
<?php endif;

require_once __DIR__ . '/../includes/footer.php';
