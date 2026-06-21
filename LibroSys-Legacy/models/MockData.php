<?php
/**
 * Datos simulados — réplica de mockData.ts y adminMockData.ts
 */
class MockData
{
    public static function branches(): array
    {
        return [
            ['id' => 'central', 'name' => 'Almacén Central', 'city' => 'Santo Domingo', 'stock' => 12450],
            ['id' => 'suc-1', 'name' => 'Sucursal Centro', 'city' => 'SD Centro', 'stock' => 3240],
            ['id' => 'suc-2', 'name' => 'Sucursal Polanco', 'city' => 'SD Norte', 'stock' => 2890],
            ['id' => 'suc-3', 'name' => 'Sucursal Coyoacán', 'city' => 'SD Este', 'stock' => 2150],
            ['id' => 'suc-4', 'name' => 'Sucursal Guadalajara', 'city' => 'Guadalajara', 'stock' => 1980],
            ['id' => 'suc-5', 'name' => 'Sucursal Monterrey', 'city' => 'Monterrey', 'stock' => 1760],
        ];
    }

    public static function products(): array
    {
        return [
            ['id' => 'P-001', 'isbn' => '978-0307474728', 'title' => 'Cien años de soledad', 'author' => 'Gabriel García Márquez', 'category' => 'Literatura', 'publisher' => 'Alfaguara', 'stock' => 145, 'location' => 'Almacén Central - A-12', 'status' => 'normal'],
            ['id' => 'P-002', 'isbn' => '978-0156012195', 'title' => 'El principito', 'author' => 'Antoine de Saint-Exupéry', 'category' => 'Infantil', 'publisher' => 'Salvat', 'stock' => 89, 'location' => 'Sucursal Polanco - B-03', 'status' => 'normal'],
            ['id' => 'P-003', 'isbn' => '978-0451524935', 'title' => '1984', 'author' => 'George Orwell', 'category' => 'Literatura', 'publisher' => 'Debolsillo', 'stock' => 3, 'location' => 'Sucursal Centro - C-07', 'status' => 'low'],
            ['id' => 'P-004', 'isbn' => '978-8491050675', 'title' => 'Don Quijote de la Mancha', 'author' => 'Miguel de Cervantes', 'category' => 'Literatura', 'publisher' => 'Real Academia Española', 'stock' => 67, 'location' => 'Almacén Central - A-05', 'status' => 'normal'],
            ['id' => 'P-005', 'isbn' => '978-8498384453', 'title' => 'Harry Potter y la piedra filosofal', 'author' => 'J.K. Rowling', 'category' => 'Infantil', 'publisher' => 'Salamandra', 'stock' => 6, 'location' => 'Sucursal Guadalajara', 'status' => 'low'],
        ];
    }

    public static function lowStockProducts(): array
    {
        return [
            ['id' => 'P-003', 'title' => '1984', 'isbn' => '978-0451524935', 'stock' => 3, 'minStock' => 15, 'branch' => 'Sucursal Centro'],
            ['id' => 'P-005', 'title' => 'Harry Potter y la piedra filosofal', 'isbn' => '978-8498384453', 'stock' => 6, 'minStock' => 25, 'branch' => 'Sucursal Guadalajara'],
        ];
    }

    public static function recentSales(): array
    {
        return [
            ['id' => 'V-1042', 'product' => 'Sapiens', 'branch' => 'Sucursal Polanco', 'qty' => 2, 'total' => 598, 'date' => '2026-06-06 10:32'],
            ['id' => 'V-1041', 'product' => 'El arte de la guerra', 'branch' => 'Sucursal Centro', 'qty' => 1, 'total' => 189, 'date' => '2026-06-06 10:15'],
            ['id' => 'V-1040', 'product' => 'Crónica de una muerte anunciada', 'branch' => 'Sucursal Coyoacán', 'qty' => 3, 'total' => 447, 'date' => '2026-06-06 09:48'],
        ];
    }

    public static function logisticsAlerts(): array
    {
        return [
            ['id' => 1, 'type' => 'warning', 'message' => 'Transferencia TR-089 pendiente de recepción en Sucursal Monterrey', 'time' => 'Hace 2 horas'],
            ['id' => 2, 'type' => 'danger', 'message' => 'Stock crítico: 5 productos bajo mínimo en Sucursal Centro', 'time' => 'Hace 3 horas'],
            ['id' => 3, 'type' => 'info', 'message' => 'Envío de transporte propio #TP-234 en ruta a Guadalajara', 'time' => 'Hace 5 horas'],
        ];
    }

    public static function stockByCategory(): array
    {
        return [
            ['name' => 'Literatura', 'value' => 4200, 'color' => '#1E2D86'],
            ['name' => 'Infantil', 'value' => 2800, 'color' => '#F4D22E'],
            ['name' => 'Académico', 'value' => 3100, 'color' => '#2a3da0'],
            ['name' => 'Cómics', 'value' => 1500, 'color' => '#d4b520'],
            ['name' => 'Otros', 'value' => 870, 'color' => '#6b7280'],
        ];
    }

    public static function inventoryChartData(): array
    {
        return [
            ['month' => 'Ene', 'central' => 11200, 'sucursales' => 9800],
            ['month' => 'Feb', 'central' => 11800, 'sucursales' => 10200],
            ['month' => 'Mar', 'central' => 12100, 'sucursales' => 10800],
            ['month' => 'Abr', 'central' => 11900, 'sucursales' => 11200],
            ['month' => 'May', 'central' => 12450, 'sucursales' => 12020],
            ['month' => 'Jun', 'central' => 12450, 'sucursales' => 12020],
        ];
    }

    public static function transfers(): array
    {
        return [
            ['id' => 'TR-089', 'origin' => 'Almacén Central', 'destination' => 'Sucursal Monterrey', 'product' => 'Harry Potter y la piedra filosofal', 'qty' => 10, 'status' => 'pending_receipt', 'transport' => 'Transporte propio', 'date' => '2026-06-19'],
            ['id' => 'TR-088', 'origin' => 'Sucursal Polanco', 'destination' => 'Sucursal Guadalajara', 'product' => 'Dune', 'qty' => 5, 'status' => 'in_transit', 'transport' => 'Distribución interna', 'date' => '2026-06-18'],
            ['id' => 'TR-087', 'origin' => 'Almacén Central', 'destination' => 'Sucursal Centro', 'product' => 'Cien años de soledad', 'qty' => 20, 'status' => 'pending', 'transport' => 'Distribución interna', 'date' => '2026-06-17'],
        ];
    }

    public static function transferHistory(): array
    {
        return [
            ['id' => 'TR-086', 'origin' => 'Almacén Central', 'destination' => 'Sucursal Polanco', 'product' => 'El principito', 'qty' => 15, 'date' => '2026-06-14'],
            ['id' => 'TR-085', 'origin' => 'Sucursal Centro', 'destination' => 'Sucursal Coyoacán', 'product' => '1984', 'qty' => 8, 'date' => '2026-06-12'],
        ];
    }

    public static function publishers(): array
    {
        return [
            ['id' => 'ED-01', 'name' => 'Penguin Random House', 'country' => 'Estados Unidos', 'contact' => 'latam@penguinrandom.com', 'contractType' => 'Distribución regional', 'productCount' => 289, 'contractExpiry' => '2027-03-15', 'status' => 'active'],
            ['id' => 'ED-02', 'name' => 'Planeta', 'country' => 'España', 'contact' => 'comercial@planeta.es', 'contractType' => 'Distribución exclusiva', 'productCount' => 342, 'contractExpiry' => '2026-12-31', 'status' => 'active'],
            ['id' => 'ED-03', 'name' => 'Alfaguara', 'country' => 'España', 'contact' => 'ventas@alfaguara.es', 'contractType' => 'Distribución exclusiva', 'productCount' => 198, 'contractExpiry' => '2026-06-21', 'status' => 'active'],
            ['id' => 'ED-04', 'name' => 'Anaya', 'country' => 'España', 'contact' => 'distribucion@anaya.es', 'contractType' => 'Distribución nacional', 'productCount' => 156, 'contractExpiry' => '2026-09-20', 'status' => 'active'],
        ];
    }

    public static function events(): array
    {
        return [
            ['id' => 'EV-001', 'name' => 'Feria del Libro SD 2026', 'location' => 'Centro de Convenciones', 'type' => 'feria', 'startDate' => '2026-06-01', 'endDate' => '2026-06-10', 'status' => 'active', 'participants' => 12, 'reservations' => 245],
            ['id' => 'EV-002', 'name' => 'Noche de Poesía', 'location' => 'Sucursal Centro', 'type' => 'evento', 'startDate' => '2026-06-15', 'endDate' => '2026-06-15', 'status' => 'upcoming', 'participants' => 4, 'reservations' => 38],
            ['id' => 'EV-003', 'name' => 'Feria Infantil', 'location' => 'Sucursal Polanco', 'type' => 'feria', 'startDate' => '2026-07-05', 'endDate' => '2026-07-12', 'status' => 'planned', 'participants' => 8, 'reservations' => 0],
        ];
    }

    public static function roles(): array
    {
        return [
            ['id' => 'R-01', 'name' => 'Administrador', 'users' => 2, 'permissions' => ['all']],
            ['id' => 'R-02', 'name' => 'Gerente de Sucursal', 'users' => 5, 'permissions' => ['inventario', 'ventas', 'transferencias']],
            ['id' => 'R-03', 'name' => 'Vendedor', 'users' => 18, 'permissions' => ['ventas', 'inventario_view']],
            ['id' => 'R-04', 'name' => 'Almacén', 'users' => 8, 'permissions' => ['inventario', 'transferencias']],
        ];
    }

    public static function categories(): array
    {
        return [
            ['id' => 'CAT-01', 'name' => 'Literatura', 'description' => 'Narrativa y clásicos', 'products' => 4200, 'status' => 'active'],
            ['id' => 'CAT-02', 'name' => 'Infantil', 'description' => 'Libros para niños', 'products' => 2800, 'status' => 'active'],
            ['id' => 'CAT-03', 'name' => 'Académico', 'description' => 'Textos universitarios', 'products' => 3100, 'status' => 'active'],
            ['id' => 'CAT-04', 'name' => 'Cómics', 'description' => 'Novela gráfica', 'products' => 1500, 'status' => 'active'],
        ];
    }

    public static function suppliers(): array
    {
        return [
            ['id' => 'PR-01', 'name' => 'Distribuidora Continental', 'contact' => 'Carlos Méndez', 'email' => 'compras@continental.com', 'phone' => '+1 809 555 0100', 'supplierType' => 'Distribuidor', 'purchasesCount' => 156],
            ['id' => 'PR-02', 'name' => 'Importadora del Caribe', 'contact' => 'Ana Rodríguez', 'email' => 'ventas@importcaribe.com', 'phone' => '+1 809 555 0200', 'supplierType' => 'Importador', 'purchasesCount' => 89],
        ];
    }

    public static function currencies(): array
    {
        return [
            ['id' => 'MN-01', 'code' => 'DOP', 'name' => 'Peso Dominicano', 'symbol' => 'RD$', 'status' => 'active'],
            ['id' => 'MN-02', 'code' => 'USD', 'name' => 'Dólar Estadounidense', 'symbol' => '$', 'status' => 'active'],
            ['id' => 'MN-03', 'code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'status' => 'active'],
        ];
    }

    public static function exchangeRates(): array
    {
        return [
            ['id' => 'TC-01', 'fromCurrency' => 'USD', 'toCurrency' => 'DOP', 'rate' => 58.75, 'date' => '2026-06-06 08:00', 'updatedBy' => 'María González'],
            ['id' => 'TC-02', 'fromCurrency' => 'EUR', 'toCurrency' => 'DOP', 'rate' => 63.20, 'date' => '2026-06-06 08:00', 'updatedBy' => 'María González'],
            ['id' => 'TC-03', 'fromCurrency' => 'USD', 'toCurrency' => 'EUR', 'rate' => 0.93, 'date' => '2026-06-05 14:30', 'updatedBy' => 'Ana Martínez'],
        ];
    }

    public static function adminStats(): array
    {
        return [
            'totalProducts' => 12470,
            'totalCategories' => 5,
            'totalPublishers' => 7,
            'totalBranches' => 5,
            'totalSuppliers' => 5,
            'activeCurrencies' => 3,
        ];
    }

    public static function findById(array $items, string $id, string $key = 'id'): ?array
    {
        foreach ($items as $item) {
            if (($item[$key] ?? '') === $id) {
                return $item;
            }
        }
        return null;
    }
}
