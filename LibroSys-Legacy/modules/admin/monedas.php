<?php
require_once __DIR__ . '/../../includes/admin_crud.php';

renderAdminCrud([
    'file' => 'monedas.php', 'module' => 'admin-monedas', 'entity' => 'moneda',
    'listTitle' => 'Monedas', 'createTitle' => 'Registrar Moneda', 'editTitle' => 'Editar Moneda',
    'viewTitle' => 'Detalle de Moneda', 'deleteTitle' => 'Eliminar Moneda',
    'subtitle' => 'Monedas habilitadas en el sistema', 'data' => fn() => MockData::currencies(),
    'columns' => [
        ['key' => 'code', 'header' => 'Código', 'bold' => true], ['key' => 'name', 'header' => 'Nombre'],
        ['key' => 'symbol', 'header' => 'Símbolo'], ['key' => 'status', 'header' => 'Estado', 'badge' => true],
    ],
    'fields' => [
        ['label' => 'Código', 'name' => 'code', 'required' => true],
        ['label' => 'Nombre', 'name' => 'name', 'required' => true],
        ['label' => 'Símbolo', 'name' => 'symbol'],
        ['label' => 'Estado', 'name' => 'status', 'type' => 'select'],
    ],
]);
