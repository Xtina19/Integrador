import type { UsuarioPermisosPort } from '../../application/ports/outbound'

interface SqlRequestLike {
  input(name: string, value: unknown): SqlRequestLike
  query<T = unknown>(sql: string): Promise<{ recordset: T[] }>
}

interface SqlPoolLike {
  request(): SqlRequestLike
}

type RolVentas = 'cajero' | 'supervisor' | 'administrador'

const TOPES: Record<RolVentas, number> = {
  cajero: 5,
  supervisor: 20,
  administrador: 100,
}

function mapRol(raw: string | null | undefined): RolVentas | null {
  const slug = String(raw || '').trim().toLowerCase()
  if (slug === 'cajero') return 'cajero'
  if (slug === 'supervisor') return 'supervisor'
  if (slug === 'administrador' || slug === 'admin') return 'administrador'
  return null
}

/** Permisos de emisión desde Usuario.rol (public/scriptdb). */
export class SqlServerUsuarioPermisosAdapter implements UsuarioPermisosPort {
  constructor(private readonly pool: SqlPoolLike) {}

  async getContexto(usuarioId: string) {
    const id = Number(usuarioId)
    if (!Number.isInteger(id) || id <= 0) return null

    const result = await this.pool
      .request()
      .input('id', id)
      .query(`
        SELECT id_usuario, rol, estado
        FROM Usuario
        WHERE id_usuario = @id
      `)

    const row = result.recordset[0] as
      | { id_usuario: number; rol: string; estado: string }
      | undefined
    if (!row) return null

    const estado = String(row.estado || '').trim().toLowerCase()
    if (estado !== 'activo' && estado !== 'active') return null

    const rol = mapRol(row.rol)
    if (!rol) return null

    return {
      rol,
      topePorcentajeDescuento: TOPES[rol],
    }
  }
}
