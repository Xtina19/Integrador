package service;

import config.AppConfig;
import model.Usuario;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import repository.UsuarioRepository;
import validation.ValidationException;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthServiceTest {

    @TempDir
    Path tempDir;

    private AuthService authService;
    private UsuarioRepository usuarioRepository;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        usuarioRepository = new UsuarioRepository();
        usuarioRepository.insert(new Usuario("admin", "admin123", 0, "Administrador", "General", "admin@sistema.local"));
        usuarioRepository.insert(new Usuario("user1", "pass1", 1, "Usuario", "Normal", null));
        authService = new AuthService(usuarioRepository);
        SessionContext.clear();
    }

    @AfterEach
    void tearDown() {
        SessionContext.clear();
        AppConfig.setBaseDir(null);
    }

    @Test
    void loginExitosoAdministrador() {
        Usuario u = authService.login("admin", "admin123");
        assertEquals("admin", u.getLoginUsuario());
        assertTrue(SessionContext.isAdministrador());
    }

    @Test
    void loginFallaConPasswordIncorrecta() {
        assertThrows(ValidationException.class, () -> authService.login("admin", "mala"));
        assertFalse(SessionContext.isAuthenticated());
    }

    @Test
    void loginFallaSiUsuarioNoExiste() {
        assertThrows(ValidationException.class, () -> authService.login("noexiste", "x"));
    }

    @Test
    void existeLogin() {
        assertTrue(authService.existeLogin("user1"));
        assertFalse(authService.existeLogin("otro"));
    }
}
