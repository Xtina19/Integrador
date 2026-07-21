package repository;

/**
 * Convierte entre entidades de dominio y líneas de archivo TXT.
 */
public interface EntityMapper<T> {

    String getId(T entity);

    T fromLine(String line);

    String toLine(T entity);
}
