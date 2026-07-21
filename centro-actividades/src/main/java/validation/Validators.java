package validation;

import util.DateUtils;
import util.MoneyUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Validaciones reutilizables. Se ampliarán en fases posteriores.
 */
public final class Validators {

    private static final Pattern EMAIL = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Pattern PHONE = Pattern.compile("^\\d{7,15}$");
    private static final Pattern TIME = Pattern.compile("^([01]?\\d|2[0-3]):[0-5]\\d$");
    private static final Set<String> DIAS = Set.of(
            "lunes", "martes", "miércoles", "miercoles", "jueves", "viernes", "sábado", "sabado", "domingo"
    );

    private Validators() {
    }

    public static String requireText(String campo, String value) {
        if (value == null || value.isBlank()) {
            throw new ValidationException(campo, "es obligatorio. Debe ingresar un valor.");
        }
        return value.trim();
    }

    public static Integer requireInteger(String campo, String value) {
        String text = requireText(campo, value);
        try {
            return Integer.parseInt(text);
        } catch (NumberFormatException ex) {
            throw new ValidationException(campo, "debe ser un número entero. Ejemplo: 1");
        }
    }

    public static Integer requireNivelAcceso(String campo, String value) {
        Integer nivel = requireInteger(campo, value);
        if (nivel != 0 && nivel != 1) {
            throw new ValidationException(campo, "solo admite 0 (Administrador) o 1 (Usuario normal).");
        }
        return nivel;
    }

    public static BigDecimal requireMoney(String campo, String value) {
        String text = requireText(campo, value);
        return MoneyUtils.parse(text).orElseThrow(() ->
                new ValidationException(campo, "debe ser un valor monetario válido. Ejemplo: 1500.00"));
    }

    public static BigDecimal requireNonNegativeMoney(String campo, String value) {
        BigDecimal money = requireMoney(campo, value);
        if (MoneyUtils.isNegative(money)) {
            throw new ValidationException(campo, "no puede ser negativo.");
        }
        return money;
    }

    public static LocalDate requireDate(String campo, String value) {
        String text = requireText(campo, value);
        return DateUtils.parseDate(text).orElseThrow(() ->
                new ValidationException(campo, "debe tener formato dd/MM/yyyy. Ejemplo: 20/07/2026"));
    }

    public static void optionalEmail(String campo, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (!EMAIL.matcher(value.trim()).matches()) {
            throw new ValidationException(campo, "no tiene formato de correo válido. Ejemplo: usuario@dominio.com");
        }
    }

    public static void optionalPhone(String campo, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        String digits = value.replaceAll("[^0-9]", "");
        if (!PHONE.matcher(digits).matches()) {
            throw new ValidationException(campo, "debe contener entre 7 y 15 dígitos.");
        }
    }

    public static void requirePhone(String campo, String value) {
        requireText(campo, value);
        optionalPhone(campo, value);
        String digits = value.replaceAll("[^0-9]", "");
        if (!PHONE.matcher(digits).matches()) {
            throw new ValidationException(campo, "debe contener entre 7 y 15 dígitos.");
        }
    }

    public static void requireDia(String campo, String value) {
        String dia = requireText(campo, value).toLowerCase();
        if (!DIAS.contains(dia)) {
            throw new ValidationException(campo,
                    "debe ser un día válido (Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo).");
        }
    }

    public static LocalTime requireHora(String campo, String value) {
        String hora = requireText(campo, value);
        return DateUtils.parseTime(hora).orElseThrow(() ->
                new ValidationException(campo, "debe tener formato HH:mm. Ejemplo: 08:00 o 18:30"));
    }

    public static LocalDate requireFechaNacimiento(String campo, String value) {
        LocalDate fecha = requireDate(campo, value);
        if (fecha.isAfter(DateUtils.today())) {
            throw new ValidationException(campo, "no puede ser una fecha futura.");
        }
        return fecha;
    }

    public static void requireTipoCliente(String campo, Integer tipo) {
        if (tipo == null || (tipo != 1 && tipo != 2)) {
            throw new ValidationException(campo, "debe ser 1 (Socio) o 2 (Invitado).");
        }
    }
}
