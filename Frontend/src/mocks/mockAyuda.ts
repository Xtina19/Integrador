export const helpSections = [
  {
    id: 'manual',
    title: 'Manual de Usuario',
    description: 'Guía completa de operación del sistema LibroSys',
    articles: [
      { title: 'Primeros pasos', content: 'Aprenda a navegar por el dashboard y los módulos principales.' },
      { title: 'Gestión de inventario', content: 'Cómo registrar productos, ubicaciones y realizar ajustes de stock.' },
      { title: 'Punto de venta', content: 'Proceso de cobro, descuentos y emisión de facturas.' },
      { title: 'Importaciones', content: 'Flujo completo desde embarque hasta costeo por libro.' },
    ],
  },
  {
    id: 'faq',
    title: 'Preguntas Frecuentes',
    articles: [
      { title: '¿Cómo crear una transferencia entre sucursales?', content: 'Vaya a Inventario > Transferencias > Nueva transferencia.' },
      { title: '¿Cómo renovar un contrato editorial?', content: 'En Editoriales > Contratos, seleccione Renovar en la acción correspondiente.' },
      { title: '¿Cómo exportar reportes?', content: 'En el módulo Reportes, seleccione el reporte y use Exportar PDF o Excel.' },
      { title: '¿Cómo configurar stock mínimo?', content: 'Vaya a Configuración > Inventario y ajuste el parámetro Stock mínimo global.' },
    ],
  },
  {
    id: 'tutorials',
    title: 'Tutoriales',
    articles: [
      { title: 'Registrar una orden de compra', content: 'Video tutorial: Compras > Órdenes de Compra > Nueva orden.' },
      { title: 'Recepción de mercancía importada', content: 'Video tutorial: Importaciones > Embarques > Registrar recepción.' },
      { title: 'Conteo físico de inventario', content: 'Video tutorial: Inventario > Conteos Físicos > Nuevo conteo.' },
    ],
  },
]

export const supportContact = {
  email: 'soporte@joselito.com',
  phone: '+1 809 555 0199',
  hours: 'Lunes a Viernes, 8:00 AM – 6:00 PM',
  address: 'Av. Winston Churchill, Santo Domingo, RD',
}
