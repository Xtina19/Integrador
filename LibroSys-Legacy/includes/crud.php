<?php
/**
 * Helper CRUD reutilizable para módulos Legacy
 */

function crudToolbar(string $baseUrl, string $entityLabel, bool $showCreate = true): void
{
    echo '<div class="d-flex justify-content-between align-items-center mb-4">';
    echo '<div class="search-box flex-grow-1 me-3" style="max-width:400px">';
    echo '<i class="bi bi-search"></i>';
    echo '<input type="text" class="form-control form-control-sm table-search" placeholder="Buscar en ' . e($entityLabel) . '...">';
    echo '</div>';
    if ($showCreate) {
        echo '<a href="' . e($baseUrl) . '?action=create" class="btn btn-corporate btn-sm"><i class="bi bi-plus-lg me-1"></i> Crear</a>';
    }
    echo '</div>';
}

function crudActions(string $baseUrl, string $id): string
{
    return '<div class="btn-group btn-group-sm">'
        . '<a href="' . e($baseUrl) . '?action=view&id=' . e($id) . '" class="btn btn-outline-secondary" title="Ver"><i class="bi bi-eye"></i></a>'
        . '<a href="' . e($baseUrl) . '?action=edit&id=' . e($id) . '" class="btn btn-outline-primary" title="Editar"><i class="bi bi-pencil"></i></a>'
        . '<a href="' . e($baseUrl) . '?action=delete&id=' . e($id) . '" class="btn btn-outline-danger" title="Eliminar"><i class="bi bi-trash"></i></a>'
        . '</div>';
}

function handleCrudPost(string $entityName, string $redirectUrl): void
{
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['crud_action'] ?? 'save';
        if ($action === 'delete') {
            setFlash("Registro de {$entityName} eliminado correctamente (simulado).", 'warning');
        } else {
            setFlash("Registro de {$entityName} guardado correctamente (simulado).");
        }
        header('Location: ' . $redirectUrl);
        exit;
    }
}

function renderFormField(string $label, string $name, string $value = '', string $type = 'text', bool $required = false): void
{
    $req = $required ? 'required' : '';
    echo '<div class="col-md-6 mb-3">';
    echo '<label class="form-label">' . e($label) . ($required ? ' *' : '') . '</label>';
    if ($type === 'textarea') {
        echo '<textarea class="form-control" name="' . e($name) . '" ' . $req . '>' . e($value) . '</textarea>';
    } elseif ($type === 'select') {
        echo '<select class="form-select" name="' . e($name) . '" ' . $req . '>';
        echo '<option value="active"' . ($value === 'active' ? ' selected' : '') . '>Activo</option>';
        echo '<option value="inactive"' . ($value === 'inactive' ? ' selected' : '') . '>Inactivo</option>';
        echo '</select>';
    } else {
        echo '<input type="' . e($type) . '" class="form-control" name="' . e($name) . '" value="' . e($value) . '" ' . $req . '>';
    }
    echo '</div>';
}
