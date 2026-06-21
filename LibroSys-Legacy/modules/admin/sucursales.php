<?php
require_once __DIR__ . '/../../includes/admin_crud.php';

renderAdminCrud([
    'file' => 'sucursales.php', 'module' => 'admin-sucursales', 'entity' => 'sucursal',
    'listTitle' => 'Sucursales', 'createTitle' => 'Registrar Sucursal', 'editTitle' => 'Editar Sucursal',
    'viewTitle' => 'Detalle de Sucursal', 'deleteTitle' => 'Eliminar Sucursal',
    'subtitle' => 'Puntos de venta y almacén central', 'data' => fn() => MockData::branches(),
    'columns' => [
        ['key' => 'id', 'header' => 'ID'], ['key' => 'name', 'header' => 'Nombre', 'bold' => true],
        ['key' => 'city', 'header' => 'Ciudad'], ['key' => 'stock', 'header' => 'Stock'],
    ],
    'fields' => [
        ['label' => 'Nombre', 'name' => 'name', 'required' => true],
        ['label' => 'Ciudad', 'name' => 'city'],
        ['label' => 'Stock', 'name' => 'stock', 'type' => 'number'],
    ],
]);
