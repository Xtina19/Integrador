package service;

import model.Usuario;

/**
 * Contexto de sesión en memoria (usuario autenticado).
 */
public final class SessionContext {

    private static Usuario currentUser;

    private SessionContext() {
    }

    public static void setCurrentUser(Usuario usuario) {
        currentUser = usuario;
    }

    public static Usuario getCurrentUser() {
        return currentUser;
    }

    public static boolean isAuthenticated() {
        return currentUser != null;
    }

    public static boolean isAdministrador() {
        return currentUser != null && currentUser.isAdministrador();
    }

    public static void clear() {
        currentUser = null;
    }
}
