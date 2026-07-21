package util;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Utilidades de archivos con escritura atómica (archivo temporal + replace).
 */
public final class FileUtils {

    private FileUtils() {
    }

    public static void ensureDirectory(Path directory) throws IOException {
        if (directory != null && !Files.exists(directory)) {
            Files.createDirectories(directory);
        }
    }

    public static void ensureFile(Path file) throws IOException {
        if (file == null) {
            return;
        }
        ensureDirectory(file.getParent());
        if (!Files.exists(file)) {
            Files.createFile(file);
        }
    }

    public static List<String> readLines(Path file) throws IOException {
        ensureFile(file);
        if (Files.size(file) == 0) {
            return new ArrayList<>();
        }
        return new ArrayList<>(Files.readAllLines(file, StandardCharsets.UTF_8));
    }

    /**
     * Reescribe el archivo de forma segura: escribe en .tmp y reemplaza el original.
     */
    public static void writeLinesAtomic(Path file, List<String> lines) throws IOException {
        ensureDirectory(file.getParent());
        Path temp = file.resolveSibling(file.getFileName() + ".tmp");
        Path backup = file.resolveSibling(file.getFileName() + ".bak");

        List<String> safeLines = lines == null ? Collections.emptyList() : lines;
        Files.write(temp, safeLines, StandardCharsets.UTF_8,
                StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);

        if (Files.exists(file)) {
            Files.copy(file, backup, StandardCopyOption.REPLACE_EXISTING);
        }

        try {
            Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException ex) {
            Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING);
        }

        if (Files.exists(backup)) {
            Files.deleteIfExists(backup);
        }
    }

    public static void appendLine(Path file, String line) throws IOException {
        ensureFile(file);
        Files.writeString(file, line + System.lineSeparator(), StandardCharsets.UTF_8,
                StandardOpenOption.CREATE, StandardOpenOption.APPEND);
    }

    public static boolean isEmptyOrMissing(Path file) throws IOException {
        return file == null || !Files.exists(file) || Files.size(file) == 0;
    }

    public static Path backupFile(Path file) throws IOException {
        if (file == null || !Files.exists(file)) {
            return null;
        }
        Path backup = file.resolveSibling(file.getFileName() + ".txn.bak");
        Files.copy(file, backup, StandardCopyOption.REPLACE_EXISTING);
        return backup;
    }

    public static void restoreBackup(Path file, Path backup) throws IOException {
        if (backup == null || !Files.exists(backup)) {
            return;
        }
        Files.copy(backup, file, StandardCopyOption.REPLACE_EXISTING);
        Files.deleteIfExists(backup);
    }

    public static void deleteQuietly(Path path) {
        if (path == null) {
            return;
        }
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // best effort
        }
    }

    public static void deleteDirectoryContents(Path directory) throws IOException {
        if (directory == null || !Files.isDirectory(directory)) {
            return;
        }
        try (var stream = Files.list(directory)) {
            stream.forEach(FileUtils::deleteQuietly);
        }
    }
}
