/**
 * Formas de pago — helpers (tabla FormaPago en SQL Server).
 * Las notas de crédito NO son forma de pago.
 */
function slugFromCodigo(codigo) {
  return String(codigo || '')
    .trim()
    .toLowerCase();
}

function mapEstadoToFe(estado) {
  const e = String(estado || '').trim().toLowerCase();
  if (e === 'activo' || e === 'active') return 'active';
  return 'inactive';
}

function mapEstadoToDb(status) {
  const e = String(status || '').trim().toLowerCase();
  if (e === 'active' || e === 'activo') return 'Activo';
  return 'Inactivo';
}

function mapToApi(row) {
  const codigo = String(row.codigo || '').trim();
  const slug = String(row.slug || slugFromCodigo(codigo)).trim();
  return {
    id: String(row.id_forma_pago ?? row.id ?? slug),
    code: codigo,
    name: row.nombre || row.name || '',
    description: row.descripcion || row.description || '',
    status: mapEstadoToFe(row.estado ?? row.status),
    slug,
  };
}

module.exports = {
  slugFromCodigo,
  mapEstadoToFe,
  mapEstadoToDb,
  mapToApi,
};
