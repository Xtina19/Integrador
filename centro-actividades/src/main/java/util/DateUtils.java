package util;

import config.AppConfig;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.Optional;

public final class DateUtils {

    public static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern(AppConfig.DATE_PATTERN);
    public static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern(AppConfig.DATE_TIME_PATTERN);
    public static final DateTimeFormatter TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm");

    private DateUtils() {
    }

    public static String format(LocalDate date) {
        return date == null ? "" : DATE_FORMATTER.format(date);
    }

    public static String format(LocalDateTime dateTime) {
        return dateTime == null ? "" : DATE_TIME_FORMATTER.format(dateTime);
    }

    public static Optional<LocalDate> parseDate(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(LocalDate.parse(value.trim(), DATE_FORMATTER));
        } catch (DateTimeParseException ex) {
            return Optional.empty();
        }
    }

    public static Optional<LocalDateTime> parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(LocalDateTime.parse(value.trim(), DATE_TIME_FORMATTER));
        } catch (DateTimeParseException ex) {
            return Optional.empty();
        }
    }

    public static LocalDate today() {
        return LocalDate.now();
    }

    public static LocalDateTime now() {
        return LocalDateTime.now();
    }

    public static String formatPeriodo(int mes, int anio) {
        return String.format("%02d-%04d", mes, anio);
    }

    public static String format(LocalTime time) {
        return time == null ? "" : TIME_FORMATTER.format(time);
    }

    public static Optional<LocalTime> parseTime(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(LocalTime.parse(value.trim(), TIME_FORMATTER));
        } catch (DateTimeParseException ex) {
            return Optional.empty();
        }
    }

    /**
     * Día de la semana en español, alineado con HorarioActividad.diaActividad.
     */
    public static String diaSemanaEspanol(LocalDate date) {
        if (date == null) {
            return "";
        }
        DayOfWeek day = date.getDayOfWeek();
        return switch (day) {
            case MONDAY -> "Lunes";
            case TUESDAY -> "Martes";
            case WEDNESDAY -> "Miércoles";
            case THURSDAY -> "Jueves";
            case FRIDAY -> "Viernes";
            case SATURDAY -> "Sábado";
            case SUNDAY -> "Domingo";
        };
    }

    public static boolean mismoDiaSemana(LocalDate fecha, String diaConfigurado) {
        if (fecha == null || diaConfigurado == null) {
            return false;
        }
        return normalizarDia(diaSemanaEspanol(fecha)).equals(normalizarDia(diaConfigurado));
    }

    public static String normalizarDia(String dia) {
        if (dia == null) {
            return "";
        }
        return dia.trim().toLowerCase(Locale.ROOT)
                .replace("á", "a")
                .replace("é", "e")
                .replace("í", "i")
                .replace("ó", "o")
                .replace("ú", "u");
    }
}
