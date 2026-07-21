package repository;

import util.FileUtils;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Predicate;

/**
 * Repositorio genérico sobre archivos TXT (una línea por registro, separador |).
 */
public class TxtRepository<T> {

    private final Path filePath;
    private final EntityMapper<T> mapper;

    public TxtRepository(Path filePath, EntityMapper<T> mapper) {
        this.filePath = Objects.requireNonNull(filePath, "filePath");
        this.mapper = Objects.requireNonNull(mapper, "mapper");
    }

    public Path getFilePath() {
        return filePath;
    }

    public synchronized List<T> findAll() {
        try {
            List<String> lines = FileUtils.readLines(filePath);
            List<T> result = new ArrayList<>();
            for (String line : lines) {
                if (line == null || line.isBlank() || line.startsWith("#")) {
                    continue;
                }
                result.add(mapper.fromLine(line));
            }
            return result;
        } catch (IOException ex) {
            throw new RepositoryException("Error al leer " + filePath.getFileName() + ": " + ex.getMessage(), ex);
        }
    }

    public synchronized Optional<T> findById(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }
        return findAll().stream()
                .filter(entity -> id.equalsIgnoreCase(mapper.getId(entity)))
                .findFirst();
    }

    public synchronized boolean existsById(String id) {
        return findById(id).isPresent();
    }

    public synchronized List<T> findBy(Predicate<T> predicate) {
        return findAll().stream().filter(predicate).toList();
    }

    public synchronized T insert(T entity) {
        Objects.requireNonNull(entity, "entity");
        String id = mapper.getId(entity);
        if (id == null || id.isBlank()) {
            throw new RepositoryException("El identificador del registro es obligatorio.");
        }
        if (existsById(id)) {
            throw new RepositoryException("Ya existe un registro con el identificador: " + id);
        }
        List<T> all = findAll();
        all.add(entity);
        saveAll(all);
        return entity;
    }

    public synchronized T update(T entity) {
        Objects.requireNonNull(entity, "entity");
        String id = mapper.getId(entity);
        if (id == null || id.isBlank()) {
            throw new RepositoryException("El identificador del registro es obligatorio.");
        }
        List<T> all = findAll();
        boolean found = false;
        for (int i = 0; i < all.size(); i++) {
            if (id.equalsIgnoreCase(mapper.getId(all.get(i)))) {
                all.set(i, entity);
                found = true;
                break;
            }
        }
        if (!found) {
            throw new RepositoryException("No se encontró el registro con identificador: " + id);
        }
        saveAll(all);
        return entity;
    }

    public synchronized T save(T entity) {
        Objects.requireNonNull(entity, "entity");
        String id = mapper.getId(entity);
        if (existsById(id)) {
            return update(entity);
        }
        return insert(entity);
    }

    public synchronized boolean deleteById(String id) {
        if (id == null || id.isBlank()) {
            return false;
        }
        List<T> all = findAll();
        boolean removed = all.removeIf(entity -> id.equalsIgnoreCase(mapper.getId(entity)));
        if (removed) {
            saveAll(all);
        }
        return removed;
    }

    public synchronized void saveAll(List<T> entities) {
        try {
            List<String> lines = new ArrayList<>();
            if (entities != null) {
                for (T entity : entities) {
                    lines.add(mapper.toLine(entity));
                }
            }
            FileUtils.writeLinesAtomic(filePath, lines);
        } catch (IOException ex) {
            throw new RepositoryException("Error al escribir " + filePath.getFileName() + ": " + ex.getMessage(), ex);
        }
    }

    public synchronized int count() {
        return findAll().size();
    }
}
