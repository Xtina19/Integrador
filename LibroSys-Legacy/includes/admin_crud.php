<?php
/**
 * Plantilla CRUD genérica para módulos de Administración
 */
function renderAdminCrud(array $config): void
{
    require_once __DIR__ . '/../../includes/init.php';
    require_once __DIR__ . '/../../includes/crud.php';

    $baseUrl = url('modules/admin/' . $config['file']);
    $action = $_GET['action'] ?? 'list';
    $id = $_GET['id'] ?? '';
    $items = $config['data']();
    $item = $id ? MockData::findById($items, $id) : null;

    handleCrudPost($config['entity'], $baseUrl);

    $currentModule = $config['module'];
    $pageTitle = match($action) {
        'create' => $config['createTitle'],
        'edit' => $config['editTitle'],
        'view' => $config['viewTitle'],
        'delete' => $config['deleteTitle'],
        default => $config['listTitle'],
    };
    $pageSubtitle = $config['subtitle'] ?? 'Catálogo maestro';

    require_once __DIR__ . '/../../includes/header.php';
    require_once __DIR__ . '/../../includes/sidebar.php';

    if ($action === 'list') {
        crudToolbar($baseUrl, $config['entity']);
        echo '<div class="card"><div class="card-header">' . e($config['listTitle']) . '</div>';
        echo '<div class="table-responsive"><table class="table table-hover mb-0 data-table"><thead><tr>';
        foreach ($config['columns'] as $col) {
            echo '<th>' . e($col['header']) . '</th>';
        }
        echo '<th>Acciones</th></tr></thead><tbody>';
        foreach ($items as $row) {
            echo '<tr>';
            foreach ($config['columns'] as $col) {
                $val = $row[$col['key']] ?? '';
                if (isset($col['badge'])) {
                    echo '<td>' . statusBadge((string)$val) . '</td>';
                } elseif (isset($col['bold'])) {
                    echo '<td class="fw-medium">' . e((string)$val) . '</td>';
                } else {
                    echo '<td>' . e((string)$val) . '</td>';
                }
            }
            echo '<td>' . crudActions($baseUrl, $row['id']) . '</td></tr>';
        }
        echo '</tbody></table></div></div>';
    } elseif ($action === 'create' || ($action === 'edit' && $item)) {
        echo '<div class="card"><div class="card-body"><form method="post" class="needs-validation" novalidate>';
        echo '<input type="hidden" name="crud_action" value="save"><div class="row">';
        foreach ($config['fields'] as $field) {
            renderFormField($field['label'], $field['name'], (string)($item[$field['name']] ?? ''), $field['type'] ?? 'text', $field['required'] ?? false);
        }
        echo '</div><button type="submit" class="btn btn-corporate mt-3">Guardar</button>';
        echo ' <a href="' . e($baseUrl) . '" class="btn btn-outline-secondary mt-3">Cancelar</a></form></div></div>';
    } elseif ($action === 'view' && $item) {
        echo '<div class="card"><div class="card-body"><div class="row g-3">';
        foreach ($config['fields'] as $field) {
            echo '<div class="col-md-6"><div class="detail-label">' . e($field['label']) . '</div>';
            echo '<div class="detail-value">' . e((string)($item[$field['name']] ?? '')) . '</div></div>';
        }
        echo '</div><a href="' . e($baseUrl) . '" class="btn btn-outline-secondary btn-sm mt-4">← Volver</a></div></div>';
    } elseif ($action === 'delete' && $item) {
        $name = $item[$config['nameKey'] ?? 'name'] ?? $item['id'];
        echo '<div class="card border-danger"><div class="card-body">';
        echo '<p>¿Eliminar <strong>' . e((string)$name) . '</strong>?</p>';
        echo '<form method="post"><input type="hidden" name="crud_action" value="delete">';
        echo '<button class="btn btn-danger">Confirmar</button> <a href="' . e($baseUrl) . '" class="btn btn-outline-secondary">Cancelar</a></form></div></div>';
    } else {
        echo '<div class="alert alert-warning">Registro no encontrado.</div>';
    }

    require_once __DIR__ . '/../../includes/footer.php';
}
