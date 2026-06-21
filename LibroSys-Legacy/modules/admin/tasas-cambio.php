<?php
require_once __DIR__ . '/../../includes/admin_crud.php';

renderAdminCrud([
    'file' => 'tasas-cambio.php', 'module' => 'admin-tasas', 'entity' => 'tasa de cambio',
    'listTitle' => 'Tasas de Cambio', 'createTitle' => 'Registrar Tasa', 'editTitle' => 'Editar Tasa',
    'viewTitle' => 'Detalle de Tasa', 'deleteTitle' => 'Eliminar Tasa',
    'subtitle' => 'Tipos de cambio vigentes', 'data' => fn() => MockData::exchangeRates(),
    'nameKey' => 'id',
    'columns' => [
        ['key' => 'id', 'header' => 'ID'], ['key' => 'fromCurrency', 'header' => 'De'],
        ['key' => 'toCurrency', 'header' => 'A'], ['key' => 'rate', 'header' => 'Tasa', 'bold' => true],
        ['key' => 'date', 'header' => 'Fecha'], ['key' => 'updatedBy', 'header' => 'Actualizado por'],
    ],
    'fields' => [
        ['label' => 'Moneda origen', 'name' => 'fromCurrency', 'required' => true],
        ['label' => 'Moneda destino', 'name' => 'toCurrency', 'required' => true],
        ['label' => 'Tasa', 'name' => 'rate', 'type' => 'number', 'required' => true],
    ],
]);
