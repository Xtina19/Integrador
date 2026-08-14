import type { ClienteConsultaPort } from '../../application/ports/outbound'

interface SqlRequestLike {
  input(name: string, value: unknown): SqlRequestLike
  query<T = unknown>(sql: string): Promise<{ recordset: T[] }>
}

interface SqlPoolLike {
  request(): SqlRequestLike
}

const SQL_WHERE_CLIENTE = `
  p.id_persona NOT IN (SELECT id_persona FROM Usuario WHERE id_persona IS NOT NULL)
  AND p.id_persona NOT IN (SELECT id_persona FROM Proveedor)
`

function mapNombre(row: {
  nombres?: string | null
  apellidos?: string | null
  razon_social?: string | null
}): string {
  const rs = String(row.razon_social || '').trim()
  if (rs) return rs
  return [row.nombres, row.apellidos]
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .join(' ')
}

function mapActivo(estado: string | null | undefined): boolean {
  const e = String(estado || '').trim().toLowerCase()
  return e === 'activo' || e === 'active'
}

/**
 * ACL de clientes desde Persona (public/scriptdb) — misma regla que /api/clientes.
 */
export class SqlServerClienteConsultaAdapter implements ClienteConsultaPort {
  constructor(private readonly pool: SqlPoolLike) {}

  async getActivo(clienteId: string) {
    const id = Number(clienteId)
    if (!Number.isInteger(id) || id <= 0) return null

    const result = await this.pool
      .request()
      .input('id', id)
      .query(`
        SELECT p.id_persona, p.nombres, p.apellidos, p.razon_social, p.estado
        FROM Persona p
        WHERE p.id_persona = @id
          AND ${SQL_WHERE_CLIENTE}
      `)

    const row = result.recordset[0] as
      | {
          id_persona: number
          nombres: string | null
          apellidos: string | null
          razon_social: string | null
          estado: string
        }
      | undefined
    if (!row) return null

    const activo = mapActivo(row.estado)
    if (!activo) return null

    return {
      id: String(row.id_persona),
      nombre: mapNombre(row),
      activo: true,
    }
  }

  async buscar(texto: string) {
    const q = texto.trim()
    if (!q) return []

    const idNum = (() => {
      const digits = q.replace(/\D/g, '')
      if (!digits || !/^\d+$/.test(digits)) return null
      const n = parseInt(digits, 10)
      return Number.isInteger(n) && n > 0 ? n : null
    })()

    const req = this.pool.request().input('q', `%${q}%`)
    if (idNum) req.input('idNum', idNum)

    const result = await req.query(`
        SELECT TOP 50 p.id_persona, p.nombres, p.apellidos, p.razon_social, p.estado
        FROM Persona p
        WHERE ${SQL_WHERE_CLIENTE}
          AND (
            p.nombres LIKE @q OR p.apellidos LIKE @q OR p.razon_social LIKE @q
            OR CAST(p.id_persona AS VARCHAR(20)) LIKE @q
            ${idNum ? 'OR p.id_persona = @idNum' : ''}
          )
        ORDER BY p.id_persona
      `)

    return (result.recordset as Array<{
      id_persona: number
      nombres: string | null
      apellidos: string | null
      razon_social: string | null
      estado: string
    }>)
      .filter((row) => mapActivo(row.estado))
      .map((row) => ({
        id: String(row.id_persona),
        nombre: mapNombre(row),
        activo: true,
      }))
  }

  ensureIdentity(_cliente: { id: string; nombre: string; activo: boolean }): void {
    // Maestro en Persona — no se replica en memoria.
  }
}
