/**
 * Roles de usuario — tabla Rol (SQL Server) + Usuario.rol (slug).
 */
const ROLES_SEMILLA = [
  'administrador',
  'almacen',
  'auditor',
  'cajero',
  'compras',
  'consulta',
  'eventos',
  'inventario',
  'logistica',
  'supervisor',
  'usuario',
];

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

function formatRoleLabel(rol) {
  const s = String(rol || '').trim();
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function mapRoleToApi(row, users = 0) {
  if (row && typeof row === 'object' && row.slug) {
    return {
      id: row.slug,
      code: row.codigo || String(row.slug).toUpperCase(),
      name: row.nombre || formatRoleLabel(row.slug),
      description: row.descripcion || '',
      status: mapEstadoToFe(row.estado),
      users: Number(users ?? row.users) || 0,
    };
  }

  const slug = String(row || '').trim().toLowerCase();
  return {
    id: slug,
    code: slug.toUpperCase(),
    name: formatRoleLabel(slug),
    description: '',
    status: 'active',
    users: Number(users) || 0,
  };
}

module.exports = {
  ROLES_SEMILLA,
  mapEstadoToFe,
  mapEstadoToDb,
  formatRoleLabel,
  mapRoleToApi,
};
