/** OpenAPI 3.0.3 — módulo Ventas (VEN-API). Documento estático; sin deps npm. */
export const ventasOpenApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'LibroSys Ventas API',
    version: '1.0.0',
    description:
      'API REST del módulo Ventas (factura central). Controllers delegan en Application Handlers; sin lógica de negocio. Alineado a VEN-ARCH / VEN-UC-2.0.0.',
  },
  servers: [
    { url: '/', description: 'Local' },
    { url: '/api/v1', description: 'API v1' },
  ],
  components: {
    securitySchemes: {
      UserIdHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'x-user-id',
        description: 'ID de usuario del seed (usr-cajero | usr-supervisor | usr-admin)',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
      SuccessEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {},
          replayed: { type: 'boolean' },
        },
      },
      LineaEmision: {
        type: 'object',
        required: ['productoId', 'cantidad'],
        properties: {
          productoId: { type: 'string', example: 'prod-cien' },
          cantidad: { type: 'integer', minimum: 1 },
          precioUnitario: { type: 'number' },
          descuentoPorcentaje: { type: 'number' },
          descuentoMonto: { type: 'number' },
        },
      },
      PagoEmision: {
        type: 'object',
        required: ['formaPago', 'monto'],
        properties: {
          formaPago: {
            type: 'string',
            enum: ['efectivo', 'tarjeta', 'transferencia', 'nota_credito'],
          },
          monto: { type: 'number', exclusiveMinimum: 0 },
          notaCreditoId: {
            type: 'string',
            description: 'Obligatorio si formaPago = nota_credito (ID interno de la NC).',
          },
          montoEntregadoEfectivo: { type: 'number' },
        },
      },
      EmitirVentaRequest: {
        type: 'object',
        required: [
          'tipoVenta',
          'sucursalId',
          'almacenId',
          'moneda',
          'lineas',
          'pagos',
          'idempotencyKey',
        ],
        properties: {
          tipoVenta: {
            type: 'string',
            enum: ['consumidor_final', 'cliente_registrado'],
          },
          clienteId: { type: 'string', example: 'cli-pucmm' },
          sucursalId: { type: 'string', example: 'suc-central' },
          almacenId: { type: 'string', example: 'alm-central' },
          moneda: { type: 'string', enum: ['DOP', 'USD', 'COP'] },
          lineas: { type: 'array', items: { $ref: '#/components/schemas/LineaEmision' } },
          pagos: { type: 'array', items: { $ref: '#/components/schemas/PagoEmision' } },
          idempotencyKey: { type: 'string' },
        },
      },
      RegistrarCambioRequest: {
        type: 'object',
        required: ['lineasDevueltas', 'lineasNuevas', 'idempotencyKey'],
        properties: {
          lineasDevueltas: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productoId', 'cantidad'],
              properties: {
                productoId: { type: 'string' },
                cantidad: { type: 'integer' },
              },
            },
          },
          lineasNuevas: {
            type: 'array',
            description:
              'Productos entregados. Vacío = solo devolución física (sin producto de salida).',
            items: {
              type: 'object',
              required: ['productoId', 'cantidad'],
              properties: {
                productoId: { type: 'string' },
                cantidad: { type: 'integer' },
                precioUnitario: { type: 'number' },
              },
            },
          },
          compensacionCliente: {
            type: 'string',
            enum: ['devolucion_dinero', 'nota_credito'],
            description:
              'Obligatorio si valorNuevo < valorDevuelto. nota_credito emite NC por la diferencia.',
          },
          pagoDiferencia: {
            type: 'object',
            description:
              'Obligatorio si valorNuevo > valorDevuelto. Monto debe igualar la diferencia calculada.',
            properties: {
              formaPago: { type: 'string', enum: ['efectivo', 'tarjeta', 'transferencia'] },
              monto: { type: 'number' },
              montoEntregadoEfectivo: { type: 'number' },
            },
          },
          idempotencyKey: { type: 'string' },
          expectedVersion: { type: 'integer' },
        },
      },
      EmitirNotaCreditoRequest: {
        type: 'object',
        required: ['monto', 'motivo'],
        properties: {
          monto: { type: 'number' },
          motivo: { type: 'string' },
          expectedVersion: { type: 'integer' },
        },
      },
      AnularVentaRequest: {
        type: 'object',
        required: ['motivo', 'idempotencyKey'],
        properties: {
          motivo: { type: 'string' },
          idempotencyKey: { type: 'string' },
          expectedVersion: { type: 'integer' },
        },
      },
    },
  },
  security: [{ UserIdHeader: [] }],
  paths: {
    '/api/v1/ventas': {
      post: {
        tags: ['Emisión'],
        summary: 'Emitir venta (CU-VEN-01/02/03)',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/EmitirVentaRequest' } },
          },
        },
        responses: {
          '201': { description: 'Factura emitida' },
          '400': { description: 'Validación', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
      get: {
        tags: ['Consulta'],
        summary: 'Listar ventas (CU-VEN-04)',
        parameters: [
          { name: 'sucursalId', in: 'query', schema: { type: 'string' } },
          { name: 'estado', in: 'query', schema: { type: 'string', enum: ['emitida', 'anulada'] } },
          { name: 'clienteId', in: 'query', schema: { type: 'string' } },
          { name: 'desde', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'hasta', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'numeroFactura', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'offset', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Listado resumido' } },
      },
    },
    '/api/v1/ventas/pago': {
      post: {
        tags: ['Emisión'],
        summary: 'Registrar pago (emisión con exactamente 1 pago)',
        description: 'Azúcar sintáctico sobre EmitirVentaHandler.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/EmitirVentaRequest' } },
          },
        },
        responses: { '201': { description: 'Factura emitida con un pago' } },
      },
    },
    '/api/v1/ventas/pago-mixto': {
      post: {
        tags: ['Emisión'],
        summary: 'Pago mixto (emisión con ≥2 pagos)',
        description: 'Azúcar sintáctico sobre EmitirVentaHandler.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/EmitirVentaRequest' } },
          },
        },
        responses: { '201': { description: 'Factura emitida con pago mixto' } },
      },
    },
    '/api/v1/ventas/clientes/buscar': {
      get: {
        tags: ['Clientes'],
        summary: 'Buscar cliente (CU-VEN-08)',
        parameters: [
          { name: 'texto', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Coincidencias' } },
      },
    },
    '/api/v1/ventas/por-numero/{numero}': {
      get: {
        tags: ['Consulta'],
        summary: 'Detalle por número de factura',
        parameters: [
          { name: 'numero', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Detalle' }, '404': { description: 'No encontrada' } },
      },
    },
    '/api/v1/ventas/{id}': {
      get: {
        tags: ['Consulta'],
        summary: 'Consultar detalle (CU-VEN-05)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Detalle factura' }, '404': { description: 'No encontrada' } },
      },
    },
    '/api/v1/ventas/{id}/historial': {
      get: {
        tags: ['Consulta'],
        summary: 'Consultar historial (CU-VEN-07)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Eventos' } },
      },
    },
    '/api/v1/ventas/{id}/reimprimir': {
      post: {
        tags: ['Consulta'],
        summary: 'Reimprimir (CU-VEN-06)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Factura (reimpresión registrada en historial)' } },
      },
    },
    '/api/v1/ventas/{id}/cambios': {
      post: {
        tags: ['Postventa'],
        summary: 'Registrar cambio (CU-VEN-11) — incluye devolución física sin producto de salida',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegistrarCambioRequest' },
            },
          },
        },
        responses: { '200': { description: 'Venta actualizada' } },
      },
    },
    '/api/v1/ventas/{id}/notas-credito': {
      post: {
        tags: ['Postventa'],
        summary: 'Emitir nota de crédito (CU-VEN-13)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/EmitirNotaCreditoRequest' },
            },
          },
        },
        responses: { '200': { description: 'Venta con NC' } },
      },
    },
    '/api/v1/ventas/{id}/anular': {
      post: {
        tags: ['Anulación'],
        summary: 'Anular / cancelar venta (CU-VEN-14)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AnularVentaRequest' } },
          },
        },
        responses: {
          '200': { description: 'Factura anulada' },
          '403': { description: 'Rol insuficiente (cajero)' },
        },
      },
    },
    '/api/v1/ventas/{id}/cancelar': {
      post: {
        tags: ['Anulación'],
        summary: 'Alias de anular',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AnularVentaRequest' } },
          },
        },
        responses: { '200': { description: 'Factura anulada' } },
      },
    },
  },
} as const
