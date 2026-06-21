<?php
require_once __DIR__ . '/../../includes/admin_crud.php';

renderAdminCrud([
    'file' => 'categorias.php', 'module' => 'admin-categorias', 'entity' => 'categoría',
    'listTitle' => 'Categorías', 'createTitle' => 'Registrar Categoría', 'editTitle' => 'Editar Categoría',
    'viewTitle' => 'Detalle de Categoría', 'deleteTitle' => 'Eliminar Categoría',
    'subtitle' => 'Clasificación de productos', 'data' => fn() => MockData::categories(),
    'columns' => [
        ['key' => 'id', 'header' => 'ID'], ['key' => 'name', 'header' => 'Nombre', 'bold' => true],
        ['key' => 'description', 'header' => 'Descripción'], ['key' => 'products', 'header' => 'Productos'],
        ['key' => 'status', 'header' => 'Estado', 'badge' => true],
    ],
    'fields' => [
        ['label' => 'Nombre', 'name' => 'name', 'required' => true],
        ['label' => 'Descripción', 'name' => 'description', 'type' => 'textarea'],
        ['label' => 'Estado', 'name' => 'status', 'type' => 'select'],
    ],
]);
