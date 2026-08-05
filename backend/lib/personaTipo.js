/**
 * Persona.tipo_persona — Natural | Jurídica (public/scriptdb).
 * Clientes: Persona no vinculada a Usuario ni Proveedor.
 */

function normalizeTipo(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isJuridica(tipoPersona, row) {
  const t = normalizeTipo(tipoPersona);
  if (t === 'juridica' || t === 'cliente_empresa') return true;
  if (row && row.razon_social && !row.nombres && !row.apellidos) return true;
  return false;
}

function tipoPersonaFromFeTipo(tipoFe) {
  return String(tipoFe || '').toLowerCase() === 'empresa' ? 'Jurídica' : 'Natural';
}

function inferFeTipo(row) {
  return isJuridica(row?.tipo_persona, row) ? 'empresa' : 'persona';
}

const SQL_WHERE_CLIENTE = `
  p.id_persona NOT IN (SELECT id_persona FROM Usuario WHERE id_persona IS NOT NULL)
  AND p.id_persona NOT IN (SELECT id_persona FROM Proveedor)
`;

const SQL_WHERE_CLIENTE_SOLO = `
  id_persona NOT IN (SELECT id_persona FROM Usuario WHERE id_persona IS NOT NULL)
  AND id_persona NOT IN (SELECT id_persona FROM Proveedor)
`;

/** Filtro cliente con alias opcional en la tabla Persona exterior (no toca subconsultas). */
function sqlWhereClienteSolo(alias) {
  const col = alias ? `${alias}.id_persona` : 'id_persona';
  return `${col} NOT IN (SELECT id_persona FROM Usuario WHERE id_persona IS NOT NULL)
    AND ${col} NOT IN (SELECT id_persona FROM Proveedor)`;
}

module.exports = {
  isJuridica,
  tipoPersonaFromFeTipo,
  inferFeTipo,
  SQL_WHERE_CLIENTE,
  SQL_WHERE_CLIENTE_SOLO,
  sqlWhereClienteSolo,
};
