package util;

import config.AppConfig;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Serialización/deserialización de líneas TXT con separador | y escape básico.
 */
public final class TxtMapper {

    private static final String ESCAPE = "\\";
    private static final String SEPARATOR = AppConfig.FIELD_SEPARATOR;

    private TxtMapper() {
    }

    public static String join(String... fields) {
        List<String> escaped = new ArrayList<>();
        for (String field : fields) {
            escaped.add(escape(field));
        }
        return String.join(SEPARATOR, escaped);
    }

    public static String[] split(String line) {
        if (line == null || line.isBlank()) {
            return new String[0];
        }
        List<String> parts = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean escaping = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (escaping) {
                current.append(c);
                escaping = false;
                continue;
            }
            if (c == '\\') {
                escaping = true;
                continue;
            }
            if (String.valueOf(c).equals(SEPARATOR)) {
                parts.add(current.toString());
                current.setLength(0);
                continue;
            }
            current.append(c);
        }
        parts.add(current.toString());
        return parts.toArray(new String[0]);
    }

    public static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    public static String emptyToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value;
    }

    public static String boolToStorage(Boolean value) {
        return Boolean.TRUE.equals(value) ? "true" : "false";
    }

    public static Boolean storageToBool(String value) {
        if (value == null) {
            return Boolean.FALSE;
        }
        String v = value.trim().toLowerCase();
        return "true".equals(v) || "1".equals(v) || "si".equals(v) || "sí".equals(v);
    }

    public static List<String> ensureSize(String[] parts, int size) {
        List<String> list = new ArrayList<>(Arrays.asList(parts));
        while (list.size() < size) {
            list.add("");
        }
        return list;
    }

    private static String escape(String value) {
        String safe = nullToEmpty(value);
        return safe
                .replace(ESCAPE, ESCAPE + ESCAPE)
                .replace(SEPARATOR, ESCAPE + SEPARATOR)
                .replace("\r", " ")
                .replace("\n", " ");
    }
}
