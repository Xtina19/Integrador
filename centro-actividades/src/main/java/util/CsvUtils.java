package util;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Exportación CSV UTF-8 con separador coma y escapado RFC-style.
 */
public final class CsvUtils {

    public static final char SEPARATOR = ',';

    private CsvUtils() {
    }

    public static Path ensureCsvExtension(Path path) {
        Objects.requireNonNull(path, "path");
        String name = path.getFileName().toString();
        if (!name.toLowerCase().endsWith(".csv")) {
            return path.resolveSibling(name + ".csv");
        }
        return path;
    }

    public static String escape(Object value) {
        if (value == null) {
            return "";
        }
        String text;
        if (value instanceof LocalDate date) {
            text = DateUtils.format(date);
        } else if (value instanceof LocalTime time) {
            text = DateUtils.format(time);
        } else if (value instanceof BigDecimal money) {
            text = MoneyUtils.toStorage(money);
        } else {
            text = String.valueOf(value);
        }

        boolean needsQuotes = text.contains(",")
                || text.contains("\"")
                || text.contains("\n")
                || text.contains("\r")
                || text.contains(";");
        String escaped = text.replace("\"", "\"\"");
        return needsQuotes ? "\"" + escaped + "\"" : escaped;
    }

    public static String toCsvLine(Object... values) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                sb.append(SEPARATOR);
            }
            sb.append(escape(values[i]));
        }
        return sb.toString();
    }

    public static void writeCsv(Path path, String[] headers, List<Object[]> rows) throws IOException {
        Path target = ensureCsvExtension(path);
        FileUtils.ensureDirectory(target.getParent());
        List<String> lines = new ArrayList<>();
        if (headers != null) {
            lines.add(toCsvLine((Object[]) headers));
        }
        if (rows != null) {
            for (Object[] row : rows) {
                lines.add(toCsvLine(row == null ? new Object[0] : row));
            }
        }
        Files.write(target, lines, StandardCharsets.UTF_8);
    }

    public static String buildCsvContent(String[] headers, List<Object[]> rows) {
        StringBuilder sb = new StringBuilder();
        if (headers != null) {
            sb.append(toCsvLine((Object[]) headers)).append('\n');
        }
        if (rows != null) {
            for (Object[] row : rows) {
                sb.append(toCsvLine(row == null ? new Object[0] : row)).append('\n');
            }
        }
        return sb.toString();
    }
}
