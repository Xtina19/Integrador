package repository;

import model.Usuario;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import repository.mapper.UsuarioMapper;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TxtRepositoryTest {

    @TempDir
    Path tempDir;

    private Path file;
    private TxtRepository<Usuario> repository;

    @BeforeEach
    void setUp() {
        file = tempDir.resolve("usuarios_test.txt");
        repository = new TxtRepository<>(file, new UsuarioMapper());
    }

    @AfterEach
    void tearDown() {
        // TempDir limpia automáticamente
    }

    @Test
    void insertAndFindById() {
        Usuario u = new Usuario("demo", "pass", 1, "Demo", "User", "demo@test.com");
        repository.insert(u);

        assertTrue(repository.existsById("demo"));
        assertEquals("Demo", repository.findById("demo").orElseThrow().getNombreUsuario());
        assertEquals(1, repository.count());
    }

    @Test
    void rejectDuplicateId() {
        repository.insert(new Usuario("dup", "a", 1, "A", "B", null));
        assertThrows(RepositoryException.class, () ->
                repository.insert(new Usuario("dup", "b", 0, "C", "D", null)));
    }

    @Test
    void updateAndDelete() {
        repository.insert(new Usuario("edit", "old", 1, "Old", "Name", null));
        repository.update(new Usuario("edit", "new", 0, "New", "Name", "n@t.com"));

        Usuario updated = repository.findById("edit").orElseThrow();
        assertEquals("new", updated.getPassUsuario());
        assertEquals(0, updated.getNivelAcceso());

        assertTrue(repository.deleteById("edit"));
        assertFalse(repository.existsById("edit"));
    }
}
