<?php
require_once __DIR__ . '/../../includes/admin_crud.php';

renderAdminCrud([
    'file' => 'editoriales.php', 'module' => 'admin-editoriales', 'entity' => 'editorial',
    'listTitle' => 'Editoriales (Catálogo)', 'createTitle' => 'Registrar Editorial', 'editTitle' => 'Editar Editorial',
    'viewTitle' => 'Detalle de Editorial', 'deleteTitle' => 'Eliminar Editorial',
    'subtitle' => 'Catálogo maestro de editoriales', 'data' => fn() => MockData::publishers(),
    'columns' => [
        ['key' => 'id', 'header' => 'ID'], ['key' => 'name', 'header' => 'Nombre', 'bold' => true],
        ['key' => 'country', 'header' => 'País'], ['key' => 'contact', 'header' => 'Contacto'],
        ['key' => 'contractType', 'header' => 'Contrato'], ['key' => 'status', 'header' => 'Estado', 'badge' => true],
    ],
    'fields' => [
        ['label' => 'Nombre', 'name' => 'name', 'required' => true],
        ['label' => 'País', 'name' => 'country'], ['label' => 'Contacto', 'name' => 'contact'],
        ['label' => 'Tipo de contrato', 'name' => 'contractType'],
        ['label' => 'Estado', 'name' => 'status', 'type' => 'select'],
    ],
]);
