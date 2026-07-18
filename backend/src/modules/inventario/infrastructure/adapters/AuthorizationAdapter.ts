export interface AuthContext {
  userId: string
  roles: string[]
}

export interface IAuthorizationAdapter {
  authorize(
    context: AuthContext,
    permission: string,
  ): Promise<{ allowed: boolean; reason?: string }>
}

/**
 * Adaptador de autorización.
 * No contiene reglas de inventario; solo verifica permisos/roles.
 */
export class InMemoryAuthorizationAdapter implements IAuthorizationAdapter {
  constructor(
    private readonly grants: Map<string, Set<string>> = new Map(),
  ) {}

  grant(userId: string, permission: string): void {
    const set = this.grants.get(userId) ?? new Set<string>()
    set.add(permission)
    this.grants.set(userId, set)
  }

  async authorize(
    context: AuthContext,
    permission: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (context.roles.includes('admin')) {
      return { allowed: true }
    }
    const userGrants = this.grants.get(context.userId)
    if (userGrants?.has(permission) || userGrants?.has('*')) {
      return { allowed: true }
    }
    return {
      allowed: false,
      reason: `Permiso denegado: ${permission}`,
    }
  }
}
