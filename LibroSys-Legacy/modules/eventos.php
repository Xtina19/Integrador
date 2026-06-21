<?php
require_once __DIR__ . '/../includes/init.php';
require_once __DIR__ . '/../includes/crud.php';

$baseUrl = url('modules/eventos.php');
$action = $_GET['action'] ?? 'list';
$id = $_GET['id'] ?? '';
$events = MockData::events();
$item = $id ? MockData::findById($events, $id) : null;

handleCrudPost('evento', $baseUrl);

$currentModule = 'eventos';
$pageTitle = match($action) {
    'create' => 'Nuevo Evento',
    'edit' => 'Editar Evento',
    'view' => 'Detalle de Evento',
    'delete' => 'Eliminar Evento',
    default => 'Eventos y Ferias',
};
$pageSubtitle = 'Calendario y reservaciones';

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';

if ($action === 'list'): ?>
  <div class="row g-3 mb-4">
    <div class="col-md-4"><div class="stat-card"><div class="stat-value"><?= count(array_filter($events, fn($e) => $e['status'] === 'active')) ?></div><div class="stat-label">Eventos activos</div></div></div>
    <div class="col-md-4"><div class="stat-card"><div class="stat-value"><?= array_sum(array_column($events, 'reservations')) ?></div><div class="stat-label">Reservaciones</div></div></div>
    <div class="col-md-4"><div class="stat-card"><div class="stat-value"><?= array_sum(array_column($events, 'participants')) ?></div><div class="stat-label">Participantes</div></div></div>
  </div>
  <?php crudToolbar($baseUrl, 'eventos'); ?>
  <div class="card">
    <div class="card-header">Eventos y Ferias</div>
    <div class="table-responsive">
      <table class="table table-hover mb-0 data-table">
        <thead><tr><th>Nombre</th><th>Tipo</th><th>Ubicación</th><th>Fechas</th><th>Estado</th><th>Reservas</th><th>Acciones</th></tr></thead>
        <tbody>
          <?php foreach ($events as $ev): ?>
            <tr>
              <td class="fw-medium"><?= e($ev['name']) ?></td>
              <td><span class="badge <?= $ev['type'] === 'feria' ? 'bg-warning text-dark' : 'bg-info' ?>"><?= e(ucfirst($ev['type'])) ?></span></td>
              <td class="small"><?= e($ev['location']) ?></td>
              <td class="small"><?= e($ev['startDate']) ?> — <?= e($ev['endDate']) ?></td>
              <td><?= statusBadge($ev['status']) ?></td>
              <td class="text-corporate fw-semibold"><?= e((string)$ev['reservations']) ?></td>
              <td><?= crudActions($baseUrl, $ev['id']) ?></td>
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
          renderFormField('Nombre', 'name', $item['name'] ?? '', 'text', true);
          renderFormField('Ubicación', 'location', $item['location'] ?? '');
          renderFormField('Fecha inicio', 'startDate', $item['startDate'] ?? '', 'date');
          renderFormField('Fecha fin', 'endDate', $item['endDate'] ?? '', 'date');
        ?>
      </div>
      <button type="submit" class="btn btn-corporate mt-3">Guardar</button>
      <a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary mt-3">Cancelar</a>
    </form>
  </div></div>

<?php elseif ($action === 'view' && $item): ?>
  <div class="card"><div class="card-body">
    <h5><?= e($item['name']) ?></h5>
    <p class="text-muted"><i class="bi bi-geo-alt"></i> <?= e($item['location']) ?></p>
    <div class="row g-3">
      <div class="col-md-4"><div class="detail-label">Fechas</div><div><?= e($item['startDate']) ?> — <?= e($item['endDate']) ?></div></div>
      <div class="col-md-4"><div class="detail-label">Participantes</div><div><?= e((string)$item['participants']) ?></div></div>
      <div class="col-md-4"><div class="detail-label">Reservaciones</div><div class="text-corporate fw-bold"><?= e((string)$item['reservations']) ?></div></div>
    </div>
    <a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary btn-sm mt-4">← Volver</a>
  </div></div>

<?php elseif ($action === 'delete' && $item): ?>
  <div class="card border-danger"><div class="card-body">
    <p>¿Eliminar evento <strong><?= e($item['name']) ?></strong>?</p>
    <form method="post"><input type="hidden" name="crud_action" value="delete">
      <button class="btn btn-danger">Confirmar</button>
      <a href="<?= e($baseUrl) ?>" class="btn btn-outline-secondary">Cancelar</a>
    </form>
  </div></div>
<?php else: ?>
  <div class="alert alert-warning">Registro no encontrado.</div>
<?php endif;

require_once __DIR__ . '/../includes/footer.php';
