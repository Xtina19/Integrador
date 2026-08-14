export const helpSections = [
  {
    id: 'vision',
    title: 'Visión funcional de LibroSys',
    description: 'Cómo se integran los módulos del ERP y la cadena de valor del negocio',
    articles: [
      {
        title: 'Integración entre módulos',
        content:
          'Compras e Importaciones abastecen Inventario; Ventas descuenta stock y genera kardex; Editoriales y Administración alimentan los catálogos maestros compartidos por todo el sistema.',
      },
      {
        title: 'Cadena de abastecimiento',
        content:
          'Orden de compra → Recepción o Consolidación → Entrada a inventario → Disponible para venta en POS.',
      },
      {
        title: 'Primeros pasos',
        content:
          'Revise el Dashboard, navegue por el menú lateral y use la búsqueda global para localizar productos, clientes, embarques u órdenes.',
      },
    ],
  },
  {
    id: 'manual',
    title: 'Manual de Usuario',
    description: 'Guía funcional por módulo — consulte el documento completo en Documentación',
    articles: [
      {
        title: 'Ventas — flujo POS',
        content:
          'Cliente → Productos → Carrito → Pago → Factura → Inventario → Historial. Incluye devoluciones, cambios y notas de crédito desde la factura origen.',
      },
      {
        title: 'Compras — ciclo nacional',
        content:
          'Orden → Aprobación → Recepción → Factura proveedor (pago) → Cuentas por pagar (consulta) → Entrada a inventario.',
      },
      {
        title: 'Importaciones — ciclo internacional',
        content:
          'Proveedor internacional → Factura internacional → Embarque → Costos de flete → Consolidación → Costeo por libro → Entrada a inventario.',
      },
      {
        title: 'Inventario — control de stock',
        content:
          'Recepciones, transferencias, conteos físicos, ajustes, descartes, existencias y kardex (MovimientoInventario) con trazabilidad completa.',
      },
      {
        title: 'Eventos y ferias',
        content:
          'Crear evento → Asignar personal → Editoriales y stands → Proveedores y materiales → Ventas en POS de la sucursal → Cierre con costo real.',
      },
      {
        title: 'Editoriales y administración',
        content:
          'Contratos, renovaciones, productos por sello editorial. Catálogos maestros: productos, clientes, proveedores, almacenes, usuarios y roles.',
      },
    ],
  },
  {
    id: 'faq',
    title: 'Preguntas Frecuentes',
    articles: [
      {
        title: '¿Cuál es la diferencia entre Compras e Importaciones?',
        content:
          'Compras gestiona proveedores nacionales. Importaciones gestiona el ciclo internacional: embarque, costos de flete, consolidación y costeo por libro.',
      },
      {
        title: '¿Qué es el costeo por libro?',
        content:
          'Distribución proporcional de costos de importación al costo unitario de cada título. Al aplicar, actualiza el costo de referencia del producto.',
      },
      {
        title: '¿Cómo funcionan las transferencias?',
        content:
          'Solicitud → aprobación → despacho (baja origen) → recepción (alta destino) → finalización.',
      },
      {
        title: '¿Dónde se emiten las notas de crédito?',
        content: 'Desde el detalle de la factura origen del cliente, no desde el listado general.',
      },
      {
        title: '¿Puedo vender sin registrar cliente?',
        content: 'Sí, seleccionando Consumidor final en el POS.',
      },
      {
        title: '¿Qué hacer si un producto no aparece en POS?',
        content:
          'Verifique que esté Activo, con existencia en el almacén de la sucursal y stock mayor a cero.',
      },
      {
        title: '¿Cómo registrar documentos de flete?',
        content:
          'Importaciones → Costos de Flete. Registre factura, BL o guía vinculada al embarque, con archivo adjunto para auditoría.',
      },
      {
        title: '¿Cómo exportar reportes?',
        content: 'Reportes → seleccione módulo y rango de fechas → Exportar PDF o Excel.',
      },
    ],
  },
  {
    id: 'tutorials',
    title: 'Tutoriales',
    articles: [
      {
        title: 'Venta completa en POS',
        content:
          'Ventas → POS → seleccione cliente → agregue productos → aplique descuentos o NC → registre pago → emita factura.',
      },
      {
        title: 'Orden de compra nacional',
        content: 'Compras → Nueva orden → apruebe → recepcione mercancía → registre factura proveedor → registre pago.',
      },
      {
        title: 'Importación internacional completa',
        content:
          'OC Internacional → Factura internacional → Embarque → Documentos de flete → Consolidación → Costeo por libro → Aplicar a inventario → Recepción OC.',
      },
      {
        title: 'Transferencia entre almacenes',
        content:
          'Inventario → Transferencias → Nueva → apruebe → despache → recepcione en destino → finalice.',
      },
      {
        title: 'Conteo físico de inventario',
        content:
          'Inventario → Conteos → Nuevo → capture cantidades → reconteo si hay diferencias → regularice.',
      },
      {
        title: 'Planificar un evento',
        content:
          'Eventos → Nuevo → asigne personal, editoriales y proveedores → controle materiales → venda desde POS de la sucursal → cierre con costo real.',
      },
    ],
  },
]

export const supportContact = {
  email: 'soporte@joselito.com',
  phone: '+1 809 555 0199',
  hours: 'Lunes a Viernes, 8:00 AM – 6:00 PM',
  address: 'Av. Winston Churchill, Santo Domingo, RD',
}
