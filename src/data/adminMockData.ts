export const adminProducts = [
  { id: 'P-001', code: 'LJS-001', isbn: '978-0307474728', title: 'Cien años de soledad', category: 'Literatura', publisher: 'Editorial Sudamericana', price: 399, currency: 'MXN', status: 'active' },
  { id: 'P-002', code: 'LJS-002', isbn: '978-0156012195', title: 'El principito', category: 'Infantil', publisher: 'Salamandra', price: 249, currency: 'MXN', status: 'active' },
  { id: 'P-003', code: 'LJS-003', isbn: '978-0451524935', title: '1984', category: 'Literatura', publisher: 'Debolsillo', price: 189, currency: 'MXN', status: 'active' },
  { id: 'P-004', code: 'LJS-004', isbn: '978-8491050675', title: 'Don Quijote de la Mancha', category: 'Literatura', publisher: 'Real Academia Española', price: 599, currency: 'MXN', status: 'active' },
  { id: 'P-005', code: 'LJS-005', isbn: '978-8498384453', title: 'Harry Potter y la piedra filosofal', category: 'Infantil', publisher: 'Salamandra', price: 449, currency: 'MXN', status: 'active' },
  { id: 'P-006', code: 'LJS-006', isbn: '978-6073159015', title: 'Sapiens', category: 'Académico', publisher: 'Debate', price: 299, currency: 'MXN', status: 'active' },
  { id: 'P-007', code: 'LJS-007', isbn: '978-8497592432', title: 'La sombra del viento', category: 'Literatura', publisher: 'Planeta', price: 349, currency: 'MXN', status: 'inactive' },
  { id: 'P-008', code: 'LJS-008', isbn: '978-8497592463', title: 'Dune', category: 'Literatura', publisher: 'Debolsillo', price: 349, currency: 'MXN', status: 'active' },
  { id: 'P-009', code: 'LJS-009', isbn: '978-8499897544', title: 'El nombre del viento', category: 'Literatura', publisher: 'Plaza & Janés', price: 429, currency: 'MXN', status: 'active' },
  { id: 'P-010', code: 'LJS-010', isbn: '978-8491050676', title: 'Rayuela', category: 'Literatura', publisher: 'Alfaguara', price: 319, currency: 'MXN', status: 'active' },
]

export const adminCategories = [
  { id: 'CAT-01', name: 'Literatura', description: 'Novelas, poesía y narrativa general', status: 'active', productCount: 4200 },
  { id: 'CAT-02', name: 'Infantil', description: 'Libros para niños y jóvenes', status: 'active', productCount: 2800 },
  { id: 'CAT-03', name: 'Académico', description: 'Textos universitarios y de investigación', status: 'active', productCount: 3100 },
  { id: 'CAT-04', name: 'Cómics', description: 'Cómics, manga y novelas gráficas', status: 'active', productCount: 1500 },
  { id: 'CAT-05', name: 'Otros', description: 'Material misceláneo y accesorios', status: 'active', productCount: 870 },
  { id: 'CAT-06', name: 'Biografías', description: 'Biografías y memorias', status: 'inactive', productCount: 0 },
]

export const adminPublishers = [
  { id: 'ED-01', name: 'Planeta', country: 'España', contact: 'comercial@planeta.es', contractType: 'Distribución exclusiva', status: 'active', productCount: 342 },
  { id: 'ED-02', name: 'Penguin Random House', country: 'Estados Unidos', contact: 'latam@penguinrandom.com', contractType: 'Distribución regional', status: 'active', productCount: 289 },
  { id: 'ED-03', name: 'Salamandra', country: 'España', contact: 'ventas@salamandra.es', contractType: 'Distribución exclusiva', status: 'active', productCount: 156 },
  { id: 'ED-04', name: 'Debolsillo', country: 'México', contact: 'distribucion@debolsillo.mx', contractType: 'Distribución nacional', status: 'active', productCount: 198 },
  { id: 'ED-05', name: 'Fondo de Cultura Económica', country: 'México', contact: 'comercial@fce.com.mx', contractType: 'Convenio institucional', status: 'active', productCount: 421 },
  { id: 'ED-06', name: 'Alfaguara', country: 'España', contact: 'ventas@alfaguara.es', contractType: 'Distribución exclusiva', status: 'inactive', productCount: 134 },
]

export const adminBranches = [
  { id: 'central', name: 'Almacén Central', address: 'Av. Insurgentes Sur 1234, CDMX', phone: '+52 55 1234 5678', manager: 'Roberto Sánchez', status: 'active', inventory: 12450 },
  { id: 'suc-1', name: 'Sucursal Centro', address: 'Calle Madero 45, CDMX Centro', phone: '+52 55 2345 6789', manager: 'Laura Méndez', status: 'active', inventory: 3240 },
  { id: 'suc-2', name: 'Sucursal Polanco', address: 'Av. Presidente Masaryk 200, Polanco', phone: '+52 55 3456 7890', manager: 'Carlos Ruiz', status: 'active', inventory: 2890 },
  { id: 'suc-3', name: 'Sucursal Coyoacán', address: 'Av. Francisco Sosa 78, Coyoacán', phone: '+52 55 4567 8901', manager: 'Ana Martínez', status: 'active', inventory: 2150 },
  { id: 'suc-4', name: 'Sucursal Guadalajara', address: 'Av. Chapultepec 300, Guadalajara', phone: '+52 33 5678 9012', manager: 'Luis Hernández', status: 'active', inventory: 1980 },
  { id: 'suc-5', name: 'Sucursal Monterrey', address: 'Av. Constitución 150, Monterrey', phone: '+52 81 6789 0123', manager: 'Patricia Vega', status: 'active', inventory: 1760 },
]

export const adminSuppliers = [
  { id: 'PRV-01', name: 'Distribuidora Nacional del Libro', contact: 'Jorge Ramírez', email: 'ventas@dnl.com.mx', phone: '+52 55 1111 2222', supplierType: 'Distribuidor', purchasesCount: 156 },
  { id: 'PRV-02', name: 'Papelera Industrial SA', contact: 'Marta López', email: 'compras@papelera.com', phone: '+52 55 2222 3333', supplierType: 'Material de oficina', purchasesCount: 89 },
  { id: 'PRV-03', name: 'Transportes Joselito', contact: 'Pedro Gómez', email: 'logistica@transportes-joselito.mx', phone: '+52 55 3333 4444', supplierType: 'Logística', purchasesCount: 234 },
  { id: 'PRV-04', name: 'Editorial Porrúa', contact: 'Sofía Castro', email: 'distribucion@porrua.mx', phone: '+52 55 4444 5555', supplierType: 'Editorial', purchasesCount: 67 },
  { id: 'PRV-05', name: 'Tech Solutions MX', contact: 'Diego Morales', email: 'soporte@techsolutions.mx', phone: '+52 55 5555 6666', supplierType: 'Tecnología', purchasesCount: 23 },
]

export const adminCurrencies = [
  { id: 'CUR-01', code: 'MXN', name: 'Peso Mexicano', symbol: '$', status: 'active' },
  { id: 'CUR-02', code: 'USD', name: 'Dólar Estadounidense', symbol: 'US$', status: 'active' },
  { id: 'CUR-03', code: 'EUR', name: 'Euro', symbol: '€', status: 'active' },
  { id: 'CUR-04', code: 'DOP', name: 'Peso Dominicano', symbol: 'RD$', status: 'active' },
  { id: 'CUR-05', code: 'GBP', name: 'Libra Esterlina', symbol: '£', status: 'inactive' },
]

export const adminExchangeRates = [
  { id: 'TC-01', fromCurrency: 'USD', toCurrency: 'MXN', value: 17.45, date: '2026-06-06', updatedBy: 'María González' },
  { id: 'TC-02', fromCurrency: 'EUR', toCurrency: 'MXN', value: 18.92, date: '2026-06-06', updatedBy: 'María González' },
  { id: 'TC-03', fromCurrency: 'DOP', toCurrency: 'MXN', value: 0.29, date: '2026-06-06', updatedBy: 'Carlos Ruiz' },
  { id: 'TC-04', fromCurrency: 'USD', toCurrency: 'DOP', value: 60.15, date: '2026-06-05', updatedBy: 'Ana Martínez' },
]

export const exchangeRateHistory = [
  { id: 1, fromCurrency: 'USD', toCurrency: 'MXN', value: 17.45, date: '2026-06-06 08:00', updatedBy: 'María González' },
  { id: 2, fromCurrency: 'USD', toCurrency: 'MXN', value: 17.38, date: '2026-06-05 08:00', updatedBy: 'María González' },
  { id: 3, fromCurrency: 'EUR', toCurrency: 'MXN', value: 18.92, date: '2026-06-06 08:00', updatedBy: 'María González' },
  { id: 4, fromCurrency: 'EUR', toCurrency: 'MXN', value: 18.85, date: '2026-06-05 08:00', updatedBy: 'Carlos Ruiz' },
  { id: 5, fromCurrency: 'DOP', toCurrency: 'MXN', value: 0.29, date: '2026-06-06 08:00', updatedBy: 'Carlos Ruiz' },
  { id: 6, fromCurrency: 'USD', toCurrency: 'DOP', value: 60.15, date: '2026-06-05 14:30', updatedBy: 'Ana Martínez' },
]

export const adminStats = {
  totalProducts: 12470,
  totalCategories: 5,
  totalPublishers: 6,
  totalBranches: 6,
  totalSuppliers: 5,
  activeCurrencies: 4,
  lastRateUpdate: '2026-06-06 08:00',
}
