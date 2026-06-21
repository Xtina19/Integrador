<?php
require_once __DIR__ . '/../../includes/admin_crud.php';

renderAdminCrud([
    'file' => 'proveedores.php', 'module' => 'admin-proveedores', 'entity' => 'proveedor',
    'listTitle' => 'Proveedores', 'createTitle' => 'Registrar Proveedor', 'editTitle' => 'Editar Proveedor',
    'viewTitle' => 'Detalle de Proveedor', 'deleteTitle' => 'Eliminar Proveedor',
    'subtitle' => 'Proveedores y distribuidores', 'data' => fn() => MockData::suppliers(),
    'columns' => [
        ['key' => 'name', 'header' => 'Nombre', 'bold' => true], ['key' => 'contact', 'header' => 'Contacto'],
        ['key' => 'email', 'header' => 'Correo'], ['key' => 'supplierType', 'header' => 'Tipo'],
        ['key' => 'purchasesCount', 'header' => 'Compras'],
    ],
    'fields' => [
        ['label' => 'Nombre', 'name' => 'name', 'required' => true],
        ['label' => 'Contacto', 'name' => 'contact'], ['label' => 'Correo', 'name' => 'email', 'type' => 'email'],
        ['label' => 'Teléfono', 'name' => 'phone'], ['label' => 'Tipo', 'name' => 'supplierType'],
    ],
]);
