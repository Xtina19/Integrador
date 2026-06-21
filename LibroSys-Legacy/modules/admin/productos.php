<?php
require_once __DIR__ . '/../../includes/admin_crud.php';

renderAdminCrud([
    'file' => 'productos.php',
    'module' => 'admin-productos',
    'entity' => 'producto',
    'listTitle' => 'Productos',
    'createTitle' => 'Registrar Producto',
    'editTitle' => 'Editar Producto',
    'viewTitle' => 'Detalle de Producto',
    'deleteTitle' => 'Eliminar Producto',
    'subtitle' => 'Catálogo maestro de productos',
    'data' => fn() => MockData::products(),
    'nameKey' => 'title',
    'columns' => [
        ['key' => 'id', 'header' => 'Código'],
        ['key' => 'isbn', 'header' => 'ISBN'],
        ['key' => 'title', 'header' => 'Título', 'bold' => true],
        ['key' => 'category', 'header' => 'Categoría'],
        ['key' => 'publisher', 'header' => 'Editorial'],
        ['key' => 'status', 'header' => 'Estado', 'badge' => true],
    ],
    'fields' => [
        ['label' => 'ISBN', 'name' => 'isbn', 'required' => true],
        ['label' => 'Título', 'name' => 'title', 'required' => true],
        ['label' => 'Autor', 'name' => 'author'],
        ['label' => 'Categoría', 'name' => 'category'],
        ['label' => 'Editorial', 'name' => 'publisher'],
        ['label' => 'Estado', 'name' => 'status', 'type' => 'select'],
    ],
]);
