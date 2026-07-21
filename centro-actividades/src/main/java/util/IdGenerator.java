package util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

public final class IdGenerator {

    private static final AtomicInteger SEQUENCE = new AtomicInteger(1);
    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private IdGenerator() {
    }

    public static String next(String prefix) {
        String safePrefix = prefix == null || prefix.isBlank() ? "ID" : prefix.trim().toUpperCase();
        return safePrefix + "-" + LocalDateTime.now().format(TS) + "-"
                + String.format("%03d", SEQUENCE.getAndIncrement() % 1000);
    }

    public static int nextIntFromExisting(Iterable<? extends Number> existingIds) {
        int max = 0;
        if (existingIds != null) {
            for (Number id : existingIds) {
                if (id != null && id.intValue() > max) {
                    max = id.intValue();
                }
            }
        }
        return max + 1;
    }
}
