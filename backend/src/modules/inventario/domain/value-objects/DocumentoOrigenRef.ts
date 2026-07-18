import { InventoryDomainError } from '../errors/InventoryDomainError'

export type TipoDocumentoOrigen =
  | 'transferencia'
  | 'descarte'
  | 'ajuste'
  | 'conteo'
  | 'recepcion'
  | 'venta'
  | 'devolucion'
  | 'compensacion'
  | 'sistema'

export class DocumentoOrigenRef {
  private constructor(
    readonly tipo: TipoDocumentoOrigen,
    readonly id: string,
    readonly lineaId?: string,
  ) {}

  static of(
    tipo: TipoDocumentoOrigen,
    id: string,
    lineaId?: string,
  ): DocumentoOrigenRef {
    const trimmedId = id.trim()
    if (!trimmedId) {
      throw new InventoryDomainError(
        'INVALID_DOCUMENT_REF',
        'El documento origen requiere un identificador.',
      )
    }
    return new DocumentoOrigenRef(
      tipo,
      trimmedId,
      lineaId?.trim() || undefined,
    )
  }
}
