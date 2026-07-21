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

class UsuarioServiceTest {

    @TempDir
    Path tempDir;

    private UsuarioService service;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        UsuarioRepository repo = new UsuarioRepository();
        repo.insert(new Usuario("admin", "admin123", 0, "Administrador", "General", "admin@sistema.local"));
        repo.insert(new Usuario("operador", "op123", 1, "Operador", "Uno", null));
        service = new UsuarioService(repo);
        SessionContext.setCurrentUser(repo.findByLogin("admin").orElseThrow());
    }

    @AfterEach
    void tearDown() {
        SessionContext.clear();
        AppConfig.setBaseDir(null);
    }

    @Test
    void crearYBuscarUsuario() {
        Usuario nuevo = new Usuario("nuevo", "clave", 1, "Nuevo", "User", "nuevo@test.com");
        service.guardar(nuevo, true);

        assertTrue(service.buscarPorLogin("nuevo").isPresent());
        assertEquals("Nuevo", service.buscarPorLogin("nuevo").orElseThrow().getNombreUsuario());
    }

    @Test
    void rechazaLoginDuplicado() {
        Usuario dup = new Usuario("operador", "otra", 1, "X", "Y", null);
        assertThrows(ValidationException.class, () -> service.guardar(dup, true));
    }

    @Test
    void modificarUsuario() {
        Usuario u = service.buscarPorLogin("operador").orElseThrow();
        u.setNombreUsuario("OperadorMod");
        service.guardar(u, false);
        assertEquals("OperadorMod", service.buscarPorLogin("operador").orElseThrow().getNombreUsuario());
    }

    @Test
    void eliminarUsuario() {
        service.eliminar("operador");
        assertFalse(service.buscarPorLogin("operador").isPresent());
    }

    @Test
    void noEliminarAdminPrincipal() {
        assertThrows(ValidationException.class, () -> service.eliminar("admin"));
    }

    @Test
    void noEliminarUsuarioAutenticado() {
        SessionContext.setCurrentUser(service.buscarPorLogin("admin").orElseThrow());
        service.guardar(new Usuario("admin2", "x", 0, "Admin", "Dos", null), true);

        SessionContext.setCurrentUser(service.buscarPorLogin("admin2").orElseThrow());
        assertThrows(ValidationException.class, () -> service.eliminar("admin2"));
        assertTrue(service.buscarPorLogin("admin2").isPresent());
    }

    @Test
    void validarNivelYCorreo() {
        Usuario malo = new Usuario("x", "y", 5, "A", "B", "correo-invalido");
        assertThrows(ValidationException.class, () -> service.validar(malo));

        Usuario correoMalo = new Usuario("x", "y", 1, "A", "B", "sinarroba");
        assertThrows(ValidationException.class, () -> service.validar(correoMalo));
    }

    @Test
    void usuarioNormalNoPuedeGestionar() {
        SessionContext.setCurrentUser(service.buscarPorLogin("operador").orElseThrow());
        Usuario n = new Usuario("z", "z", 1, "Z", "Z", null);
        assertThrows(ValidationException.class, () -> service.guardar(n, true));
    }
}
