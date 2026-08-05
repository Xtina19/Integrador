export const inventarioOpenApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'LibroSys Inventario API',
    version: '1.0.0',
    description:
      'API del módulo Inventario. Los controladores delegan en Application Services; no contienen reglas de negocio.',
  },
  servers: [{ url: '/', description: 'Local' }],
  components: {
    securitySchemes: {
      UserIdHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'x-user-id',
      },
      RolesHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'x-user-roles',
      },
    },
    parameters: {
      RequestId: {
        name: 'x-request-id',
        in: 'header',
        required: false,
        schema: { type: 'string', format: 'uuid' },
      },
      CorrelationId: {
        name: 'x-correlation-id',
        in: 'header',
        required: false,
        schema: { type: 'string' },
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
      CrearTransferenciaDto: {
        type: 'object',
        required: ['codigo', 'almacenOrigenId', 'almacenDestinoId', 'lineas'],
        properties: {
          codigo: { type: 'string' },
          almacenOrigenId: { type: 'string' },
          almacenDestinoId: { type: 'string' },
          observacion: { type: 'string' },
          lineas: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productoId', 'cantidadSolicitada'],
              properties: {
                productoId: { type: 'string' },
                cantidadSolicitada: { type: 'integer', minimum: 1 },
              },
            },
          },
        },
      },
      DespacharDto: {
        type: 'object',
        required: ['expectedVersion', 'idempotencyKey'],
        properties: {
          expectedVersion: { type: 'integer', minimum: 1 },
          idempotencyKey: { type: 'string' },
        },
      },
      RecibirDto: {
        type: 'object',
        required: ['expectedVersion', 'idempotencyKey', 'recepciones'],
        properties: {
          expectedVersion: { type: 'integer' },
          idempotencyKey: { type: 'string' },
          recepciones: {
            type: 'array',
            items: {
              type: 'object',
              required: ['lineaId', 'cantidadRecibida'],
              properties: {
                lineaId: { type: 'string' },
                cantidadRecibida: { type: 'integer', minimum: 0 },
                cantidadFaltante: { type: 'integer', minimum: 0 },
                cantidadDanada: { type: 'integer', minimum: 0 },
              },
            },
          },
        },
      },
      CrearDescarteDto: {
        type: 'object',
        required: ['codigo', 'almacenId', 'lineas'],
        properties: {
          codigo: { type: 'string' },
          almacenId: { type: 'string' },
          observacion: { type: 'string' },
          lineas: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productoId', 'cantidad', 'motivoCodigo'],
              properties: {
                productoId: { type: 'string' },
                cantidad: { type: 'integer', minimum: 1 },
                motivoCodigo: { type: 'string' },
                observacion: { type: 'string' },
              },
            },
          },
        },
      },
      CrearConteoDto: {
        type: 'object',
        required: ['codigo', 'almacenId', 'tipoConteo', 'descripcionAlcance'],
        properties: {
          codigo: { type: 'string' },
          almacenId: { type: 'string' },
          tipoConteo: {
            type: 'string',
            enum: ['general', 'parcial', 'ciclico', 'extraordinario'],
          },
          descripcionAlcance: { type: 'string' },
        },
      },
      CrearAjusteDto: {
        type: 'object',
        required: ['codigo', 'almacenId', 'tipoAjuste', 'lineas'],
        properties: {
          codigo: { type: 'string' },
          almacenId: { type: 'string' },
          tipoAjuste: {
            type: 'string',
            enum: [
              'positivo',
              'negativo',
              'digitacion',
              'conteo',
              'error_documental',
            ],
          },
          observacion: { type: 'string' },
          lineas: {
            type: 'array',
            items: {
              type: 'object',
              required: ['productoId', 'cantidadObjetivo', 'diferencia'],
              properties: {
                productoId: { type: 'string' },
                cantidadObjetivo: { type: 'integer', minimum: 0 },
                diferencia: { type: 'integer' },
                motivoCodigo: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  security: [{ UserIdHeader: [] }, { RolesHeader: [] }],
  paths: {
    '/api/inventario/transferencias': {
      post: {
        summary: 'Crear transferencia',
        tags: ['Transferencias'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CrearTransferenciaDto' },
            },
          },
        },
        responses: {
          '201': { description: 'Creada' },
          '400': {
            description: 'Validación',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/inventario/transferencias/{id}/despachar': {
      post: {
        summary: 'Despachar transferencia',
        tags: ['Transferencias'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DespacharDto' },
            },
          },
        },
        responses: { '200': { description: 'Despachada' } },
      },
    },
    '/api/inventario/transferencias/{id}/recibir': {
      post: {
        summary: 'Recibir transferencia',
        tags: ['Transferencias'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RecibirDto' },
            },
          },
        },
        responses: { '200': { description: 'Recibida' } },
      },
    },
    '/api/inventario/descartes': {
      post: {
        summary: 'Crear descarte',
        tags: ['Descartes'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CrearDescarteDto' },
            },
          },
        },
        responses: { '201': { description: 'Creado' } },
      },
    },
    '/api/inventario/descartes/{id}/aprobar': {
      post: {
        summary: 'Aprobar descarte',
        tags: ['Descartes'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Aprobado' } },
      },
    },
    '/api/inventario/descartes/{id}/aplicar': {
      post: {
        summary: 'Aplicar descarte',
        tags: ['Descartes'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Aplicado' } },
      },
    },
    '/api/inventario/conteos': {
      post: {
        summary: 'Crear conteo',
        tags: ['Conteos'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CrearConteoDto' },
            },
          },
        },
        responses: { '201': { description: 'Creado' } },
      },
    },
    '/api/inventario/ajustes': {
      post: {
        summary: 'Crear ajuste',
        tags: ['Ajustes'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CrearAjusteDto' },
            },
          },
        },
        responses: { '201': { description: 'Creado' } },
      },
    },
    '/api/inventario/outbox/process': {
      post: {
        summary: 'Procesar outbox pendiente',
        tags: ['Outbox'],
        responses: { '200': { description: 'Procesado' } },
      },
    },
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['Ops'],
        security: [],
        responses: { '200': { description: 'OK' } },
      },
    },
    '/ready': {
      get: {
        summary: 'Readiness',
        tags: ['Ops'],
        security: [],
        responses: { '200': { description: 'Ready' }, '503': { description: 'Not ready' } },
      },
    },
    '/live': {
      get: {
        summary: 'Liveness',
        tags: ['Ops'],
        security: [],
        responses: { '200': { description: 'Alive' } },
      },
    },
    '/metrics': {
      get: {
        summary: 'Snapshot de métricas en memoria',
        tags: ['Ops'],
        security: [],
        responses: { '200': { description: 'Metrics snapshot' } },
      },
    },
  },
} as const
