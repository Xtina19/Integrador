import { InventoryDomainError } from '../errors/InventoryDomainError'
import { Cantidad } from '../value-objects/Cantidad'
import { Saldo } from '../value-objects/Saldo'
import { Version } from '../value-objects/Version'

export interface ExistenciaProps {
  id: string
  productoId: string
  almacenId: string
  saldo: number
  version: number
}

/**
 * Agregado de saldo producto × almacén.
 * Solo el Inventory Engine debe mutarlo.
 */
export class Existencia {
  private constructor(
    readonly id: string,
    readonly productoId: string,
    readonly almacenId: string,
    private _saldo: Saldo,
    private _version: Version,
  ) {}

  static crear(props: ExistenciaProps): Existencia {
    return new Existencia(
      props.id,
      props.productoId,
      props.almacenId,
      Saldo.of(props.saldo),
      Version.of(props.version),
    )
  }

  get saldo(): Saldo {
    return this._saldo
  }

  get version(): Version {
    return this._version
  }

  assertVersion(expected: Version): void {
    if (!this._version.equals(expected)) {
      throw new InventoryDomainError(
        'VERSION_CONFLICT',
        'Conflicto de concurrencia sobre la existencia.',
        {
          expected: expected.value,
          actual: this._version.value,
          productoId: this.productoId,
          almacenId: this.almacenId,
        },
      )
    }
  }

  incrementar(cantidad: Cantidad, expectedVersion: Version): {
    saldoAnterior: Saldo
    saldoPosterior: Saldo
  } {
    this.assertVersion(expectedVersion)
    const saldoAnterior = this._saldo
    this._saldo = this._saldo.add(cantidad)
    this._version = this._version.next()
    return { saldoAnterior, saldoPosterior: this._saldo }
  }

  decrementar(cantidad: Cantidad, expectedVersion: Version): {
    saldoAnterior: Saldo
    saldoPosterior: Saldo
  } {
    this.assertVersion(expectedVersion)
    const saldoAnterior = this._saldo
    this._saldo = this._saldo.subtract(cantidad)
    this._version = this._version.next()
    return { saldoAnterior, saldoPosterior: this._saldo }
  }

  toSnapshot(): ExistenciaProps {
    return {
      id: this.id,
      productoId: this.productoId,
      almacenId: this.almacenId,
      saldo: this._saldo.value,
      version: this._version.value,
    }
  }
}
