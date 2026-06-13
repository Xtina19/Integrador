export const adminProducts = [
  { id: 'P-001', code: 'LJS-001', isbn: '978-0307474728', title: 'Cien años de soledad', author: 'Gabriel García Márquez', category: 'Literatura', publisher: 'Alfaguara', price: 850, currency: 'DOP', status: 'active', createdAt: '2024-03-15', updatedAt: '2026-05-20' },
  { id: 'P-002', code: 'LJS-002', isbn: '978-0156012195', title: 'El principito', author: 'Antoine de Saint-Exupéry', category: 'Infantil', publisher: 'Salvat', price: 450, currency: 'DOP', status: 'active', createdAt: '2024-01-10', updatedAt: '2026-04-12' },
  { id: 'P-003', code: 'LJS-003', isbn: '978-045_DIPSETTING4935', title: '1984', author: 'George Orwell', category: 'Literatura', publisher: 'Debolsillo', price: 320, currency: 'DOP', status: 'active', createdAt: '2023-11-05', updatedAt: '2026-06-01' },
  { id: 'P-004', code: 'LJS-004', isbn: '978-8491050675', title: 'Don Quijote de la Mancha', author: 'Miguel de Cervantes', category: 'Literatura', publisher: 'Real Academia Española', price: 1200, currency: 'DOP', status: 'active', createdAt: '2023-08-22', updatedAt: '2026-03-18' },
  { id: 'P-005', code: 'LJS-005', isbn: '978-8498384453', title: 'Harry Potter y la piedra filosofal', author: 'J.K. Rowling', category: 'Infantil', publisher: 'Salamandra', price: 680, currency: 'DOP', status: 'active', createdAt: '2024-06-01', updatedAt: '2026-05-30' },
  { id: 'P-006', code: 'LJS-006', isbn: '978-6073159015', title: 'Sapiens', author: 'Yuval Noah Harari', category: 'Académico', publisher: 'Debate', price: 590, currency: 'DOP', status: 'active', createdAt: '2024-02-14', updatedAt: '2026-06-04' },
  { id: 'P-007', code: 'LJS-007', isbn: '978-8497592432', title: 'La sombra del viento', author: 'Carlos Ruiz Zafón', category: 'Literatura', publisher: 'Planeta', price: 520, currency: 'DOP', status: 'inactive', createdAt: '2023-05-10', updatedAt: '2026-01-15' },
  { id: 'P-008', code: 'LJS-008', isbn: '978-8497592463', title: 'Dune', author: 'Frank Herbert', category: 'Literatura', publisher: 'Debolsillo', price: 480, currency: 'DOP', status: 'active', createdAt: '2024-09-20', updatedAt: '2026-05-22' },
  { id: 'P-009', code: 'LJS-009', isbn: '978-8499897544', title: 'El nombre del viento', author: 'Patrick Rothfuss', category: 'Literatura', publisher: 'Plaza & Janés', price: 750, currency: 'DOP', status: 'active', createdAt: '2024-04-08', updatedAt: '2026-04-28' },
  { id: 'P-010', code: 'LJS-010', isbn: '978-8491050676', title: 'Rayuela', author: 'Julio Cortázar', category: 'Literatura', publisher: 'Alfaguara', price: 420, currency: 'DOP', status: 'active', createdAt: '2023-12-01', updatedAt: '2026-05-10' },
]

export const adminCategories = [
  { id: 'CAT-01', name: 'Literatura', description: 'Novelas, poesía y narrativa general de autores nacionales e internacionales.', status: 'active', productCount: 4200, createdAt: '2022-01-01' },
  { id: 'CAT-02', name: 'Infantil', description: 'Libros ilustrados, cuentos y material educativo para niños y jóvenes.', status: 'active', productCount: 2800, createdAt: '2022-01-01' },
  { id: 'CAT-03', name: 'Académico', description: 'Textos universitarios, manuales y material de investigación.', status: 'active', productCount: 2100, createdAt: '2022-06-15' },
  { id: 'CAT-04', name: 'Cómics', description: 'Cómics, manga y novelas gráficas de editoriales especializadas.', status: 'active', productCount: 1500, createdAt: '2023-03-10' },
  { id: 'CAT-05', name: 'Otros', description: 'Agendas, material de oficina y accesorios para lectura.', status: 'active', productCount: 870, createdAt: '2022-01-01' },
  { id: 'CAT-06', name: 'Biografías', description: 'Biografías, memorias y libros de no ficción sobre personajes históricos.', status: 'inactive', productCount: 0, createdAt: '2024-08-01' },
]

export const adminPublishers = [
  { id: 'ED-01', name: 'Penguin Random House', country: 'Estados Unidos', contact: 'latam@penguinrandom.com', phone: '+1 212 555 0100', contractType: 'Distribución regional', status: 'active', productCount: 289, contractExpiry: '2027-03-15', address: '375 Hudson Street, New York, NY' },
  { id: 'ED-02', name: 'Planeta', country: 'España', contact: 'comercial@planeta.es', phone: '+34 91 555 0200', contractType: 'Distribución exclusiva', status: 'active', productCount: 342, contractExpiry: '2026-12-31', address: 'Av. Diagonal 662, Barcelona' },
  { id: 'ED-03', name: 'Alfaguara', country: 'España', contact: 'ventas@alfaguara.es', phone: '+34 91 555 0300', contractType: 'Distribución exclusiva', status: 'active', productCount: 198, contractExpiry: '2026-09-20', address: 'Torre Picasso, Madrid' },
  { id: 'ED-04', name: 'Anaya', country: 'España', contact: 'distribucion@anaya.es', phone: '+34 91 555 0400', contractType: 'Distribución nacional', status: 'active', productCount: 156, contractExpiry: '2027-01-10', address: 'C/ Torrelaguna 58, Madrid' },
  { id: 'ED-05', name: 'Salvat', country: 'España', contact: 'ventas@salvat.es', phone: '+34 93 555 0100', contractType: 'Convenio institucional', status: 'active', productCount: 134, contractExpiry: '2026-11-30', address: 'Av. Diagonal 662, Barcelona' },
]

export const adminBranches = [
  { id: 'central', name: 'Almacén Central', address: 'Av. Winston Churchill 1100, Santo Domingo', phone: '+1 809 555 1000', manager: 'Roberto Sánchez', status: 'active', inventory: 12450, city: 'Santo Domingo' },
  { id: 'suc-1', name: 'Sucursal Santiago', address: 'Calle del Sol 45, Centro, Santiago', phone: '+1 809 555 2000', manager: 'Laura Méndez', status: 'active', inventory: 3240, city: 'Santiago' },
  { id: 'suc-2', name: 'Sucursal Santo Domingo', address: 'Av. 27 de Febrero 150, Santo Domingo', phone: '+1 809 555 3000', manager: 'Carlos Ruiz', status: 'active', inventory: 2890, city: 'Santo Domingo' },
  { id: 'suc-3', name: 'Sucursal La Vega', address: 'Calle Padre Adolfo 78, La Vega', phone: '+1 809 555 4000', manager: 'Ana Martínez', status: 'active', inventory: 2150, city: 'La Vega' },
  { id: 'suc-4', name: 'Sucursal Puerto Plata', address: 'Calle Beller 22, Puerto Plata', phone: '+1 809 555 5000', manager: 'Luis Hernández', status: 'active', inventory: 1980, city: 'Puerto Plata' },
]

export const adminSuppliers = [
  { id: 'PRV-01', name: 'Distribuidora Caribeña del Libro', contact: 'Jorge Ramírez', email: 'ventas@dcl.com.do', phone: '+1 809 555 6001', supplierType: 'Distribuidor', purchasesCount: 156, address: 'Zona Industrial, Santiago' },
  { id: 'PRV-02', name: 'Papelera del Cibao SA', contact: 'Marta López', email: 'compras@papelera-cibao.do', phone: '+1 809 555 6002', supplierType: 'Material de oficina', purchasesCount: 89, address: 'Av. Máximo Gómez, Santo Domingo' },
  { id: 'PRV-03', name: 'Transportes Joselito', contact: 'Pedro Gómez', email: 'logistica@transportes-joselito.do', phone: '+1 809 555 6003', supplierType: 'Logística', purchasesCount: 234, address: 'Carretera Duarte Km 12, Santo Domingo' },
  { id: 'PRV-04', name: 'Editorial Porrúa RD', contact: 'Sofía Castro', email: 'distribucion@porrua.do', phone: '+1 809 555 6004', supplierType: 'Editorial', purchasesCount: 67, address: 'Calle El Conde 15, Santo Domingo' },
  { id: 'PRV-05', name: 'Tech Solutions RD', contact: 'Diego Morales', email: 'soporte@techsolutions.do', phone: '+1 809 555 6005', supplierType: 'Tecnología', purchasesCount: 23, address: 'Piantini, Santo Domingo' },
]

export const adminCurrencies = [
  { id: 'CUR-01', code: 'DOP', name: 'Peso Dominicano', symbol: 'RD$', status: 'active', isDefault: true, decimalPlaces: 2 },
  { id: 'CUR-02', code: 'USD', name: 'Dólar Estadounidense', symbol: 'US$', status: 'active', isDefault: false, decimalPlaces: 2 },
  { id: 'CUR-03', code: 'EUR', name: 'Euro', symbol: '€', status: 'active', isDefault: false, decimalPlaces: 2 },
]

export const adminExchangeRates = [
  { id: 'TC-01', fromCurrency: 'USD', toCurrency: 'DOP', value: 60.15, date: '2026-06-06', updatedBy: 'María González', notes: 'Tasa oficial Banco Central' },
  { id: 'TC-02', fromCurrency: 'EUR', toCurrency: 'DOP', value: 65.42, date: '2026-06-06', updatedBy: 'María González', notes: 'Tasa oficial Banco Central' },
  { id: 'TC-03', fromCurrency: 'USD', toCurrency: 'EUR', value: 0.9185, date: '2026-06-06', updatedBy: 'Carlos Ruiz', notes: 'Referencia mercado internacional' },
  { id: 'TC-04', fromCurrency: 'EUR', toCurrency: 'USD', value: 1.0887, date: '2026-06-05', updatedBy: 'Ana Martínez', notes: 'Referencia mercado internacional' },
]

export const exchangeRateHistory = [
  { id: 1, rateId: 'TC-01', fromCurrency: 'USD', toCurrency: 'DOP', value: 60.15, date: '2026-06-06 08:00', updatedBy: 'María González' },
  { id: 2, rateId: 'TC-01', fromCurrency: 'USD', toCurrency: 'DOP', value: 60.02, date: '2026-06-05 08:00', updatedBy: 'María González' },
  { id: 3, rateId: 'TC-02', fromCurrency: 'EUR', toCurrency: 'DOP', value: 65.42, date: '2026-06-06 08:00', updatedBy: 'María González' },
  { id: 4, rateId: 'TC-02', fromCurrency: 'EUR', toCurrency: 'DOP', value: 65.18, date: '2026-06-05 08:00', updatedBy: 'Carlos Ruiz' },
  { id: 5, rateId: 'TC-03', fromCurrency: 'USD', toCurrency: 'EUR', value: 0.9185, date: '2026-06-06 08:00', updatedBy: 'Carlos Ruiz' },
  { id: 6, rateId: 'TC-04', fromCurrency: 'EUR', toCurrency: 'USD', value: 1.0887, date: '2026-06-05 14:30', updatedBy: 'Ana Martínez' },
]

export const productHistory = [
  { id: 1, productId: 'P-001', action: 'Precio actualizado', detail: 'RD$780 → RD$850', user: 'Carlos Ruiz', date: '2026-05-20 14:30' },
  { id: 2, productId: 'P-001', action: 'Registro creado', detail: 'Alta en catálogo maestro', user: 'María González', date: '2024-03-15 09:00' },
  { id: 3, productId: 'P-003', action: 'Estado modificado', detail: 'Inactivo → Activo', user: 'Ana Martínez', date: '2026-06-01 11:15' },
  { id: 4, productId: 'P-006', action: 'Editorial cambiada', detail: 'Debate confirmada', user: 'Luis Hernández', date: '2026-06-04 16:45' },
]

export const publisherContracts = [
  { id: 'CT-01', publisherId: 'ED-01', name: 'Contrato Distribución LATAM 2025-2027', startDate: '2025-03-15', endDate: '2027-03-15', status: 'active' },
  { id: 'CT-02', publisherId: 'ED-02', name: 'Convenio Exclusivo República Dominicana', startDate: '2024-01-01', endDate: '2026-12-31', status: 'active' },
  { id: 'CT-03', publisherId: 'ED-03', name: 'Acuerdo Alfaguara Caribe', startDate: '2023-06-01', endDate: '2026-09-20', status: 'active' },
]

export const adminStats = {
  totalProducts: 12470,
  totalCategories: 5,
  totalPublishers: 5,
  totalBranches: 5,
  totalSuppliers: 5,
  activeCurrencies: 3,
  lastRateUpdate: '2026-06-06 08:00',
}

export function getProductById(id: string) {
  return adminProducts.find((p) => p.id === id)
}

export function getCategoryById(id: string) {
  return adminCategories.find((c) => c.id === id)
}

export function getPublisherById(id: string) {
  return adminPublishers.find((p) => p.id === id)
}

export function getBranchById(id: string) {
  return adminBranches.find((b) => b.id === id)
}

export function getSupplierById(id: string) {
  return adminSuppliers.find((s) => s.id === id)
}

export function getCurrencyById(id: string) {
  return adminCurrencies.find((c) => c.id === id)
}

export function getExchangeRateById(id: string) {
  return adminExchangeRates.find((r) => r.id === id)
}

export function getProductHistory(productId: string) {
  return productHistory.filter((h) => h.productId === productId)
}

export function getPublisherContracts(publisherId: string) {
  return publisherContracts.filter((c) => c.publisherId === publisherId)
}

export function getPublisherProducts(publisherName: string) {
  return adminProducts.filter((p) => p.publisher === publisherName)
}

export function getCategoryProducts(categoryName: string) {
  return adminProducts.filter((p) => p.category === categoryName).slice(0, 5)
}

export function getRateHistory(rateId: string) {
  return exchangeRateHistory.filter((h) => h.rateId === rateId)
}

export function getSupplierPurchases(supplierId: string) {
  const supplier = getSupplierById(supplierId)
  if (!supplier) return []
  return [
    { id: 'OC-101', date: '2026-05-28', amount: 'RD$45,200', status: 'Completada' },
    { id: 'OC-098', date: '2026-05-15', amount: 'RD$12,800', status: 'Completada' },
    { id: 'OC-095', date: '2026-04-30', amount: 'RD$28,500', status: 'Completada' },
  ].slice(0, Math.min(3, Math.ceil(supplier.purchasesCount / 50)))
}

export const publisherNames = adminPublishers.map((p) => p.name)
export const categoryNames = adminCategories.filter((c) => c.status === 'active').map((c) => c.name)
export const currencyCodes = adminCurrencies.filter((c) => c.status === 'active').map((c) => c.code)
