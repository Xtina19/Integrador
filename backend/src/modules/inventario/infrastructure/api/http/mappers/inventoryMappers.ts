/**
 * Mappers DTO → comandos de aplicación.
 * Sin reglas de negocio: solo transformación de forma.
 */

import {
  validateAbrirConteo,
  validateAplicar,
  validateAprobar,
  validateClasificar,
  validateCrearAjuste,
  validateCrearConteo,
  validateCrearDescarte,
  validateCrearTransferencia,
  validateDespachar,
  validateRecibir,
  validateRegistrarLinea,
} from '../validators/inputValidators'

export const InventoryHttpMappers = {
  toCrearTransferenciaCommand: (body: unknown, solicitanteId: string) => ({
    ...validateCrearTransferencia(body),
    solicitanteId,
  }),
  toDespacharCommand: (body: unknown, transferenciaId: string, actorId: string) => ({
    ...validateDespachar(body),
    transferenciaId,
    actorId,
  }),
  toRecibirCommand: (body: unknown, transferenciaId: string, actorId: string) => ({
    ...validateRecibir(body),
    transferenciaId,
    actorId,
  }),
  toCrearDescarteCommand: (body: unknown, solicitanteId: string) => ({
    ...validateCrearDescarte(body),
    solicitanteId,
  }),
  toAprobarDescarteCommand: (body: unknown, descarteId: string, aprobadorId: string) => ({
    ...validateAprobar(body),
    descarteId,
    aprobadorId,
  }),
  toAplicarDescarteCommand: (body: unknown, descarteId: string, actorId: string) => ({
    ...validateAplicar(body),
    descarteId,
    actorId,
  }),
  toCrearConteoCommand: (body: unknown, responsableId: string) => ({
    ...validateCrearConteo(body),
    responsableId,
  }),
  toAbrirConteoCommand: (body: unknown, conteoId: string) => ({
    ...validateAbrirConteo(body),
    conteoId,
  }),
  toRegistrarLineaCommand: (
    body: unknown,
    conteoId: string,
    lineaId: string,
  ) => ({
    ...validateRegistrarLinea(body),
    conteoId,
    lineaId,
  }),
  toClasificarCommand: (body: unknown, conteoId: string, lineaId: string) => ({
    ...validateClasificar(body),
    conteoId,
    lineaId,
  }),
  toCrearAjusteCommand: (body: unknown, solicitanteId: string) => ({
    ...validateCrearAjuste(body),
    solicitanteId,
  }),
}
