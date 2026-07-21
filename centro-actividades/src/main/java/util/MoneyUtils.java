package util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;
import java.util.Optional;

public final class MoneyUtils {

    private static final int SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    private MoneyUtils() {
    }

    public static BigDecimal zero() {
        return BigDecimal.ZERO.setScale(SCALE, ROUNDING);
    }

    public static BigDecimal of(double value) {
        return BigDecimal.valueOf(value).setScale(SCALE, ROUNDING);
    }

    public static BigDecimal normalize(BigDecimal value) {
        if (value == null) {
            return zero();
        }
        return value.setScale(SCALE, ROUNDING);
    }

    public static Optional<BigDecimal> parse(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            String normalized = value.trim().replace(",", "");
            return Optional.of(new BigDecimal(normalized).setScale(SCALE, ROUNDING));
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }
    }

    public static String format(BigDecimal value) {
        DecimalFormatSymbols symbols = DecimalFormatSymbols.getInstance(Locale.US);
        DecimalFormat format = new DecimalFormat("#,##0.00", symbols);
        return format.format(normalize(value));
    }

    public static String toStorage(BigDecimal value) {
        return normalize(value).toPlainString();
    }

    public static boolean isNegative(BigDecimal value) {
        return normalize(value).compareTo(BigDecimal.ZERO) < 0;
    }

    public static boolean isPositive(BigDecimal value) {
        return normalize(value).compareTo(BigDecimal.ZERO) > 0;
    }

    public static BigDecimal add(BigDecimal a, BigDecimal b) {
        return normalize(normalize(a).add(normalize(b)));
    }

    public static BigDecimal subtract(BigDecimal a, BigDecimal b) {
        return normalize(normalize(a).subtract(normalize(b)));
    }

    public static BigDecimal min(BigDecimal a, BigDecimal b) {
        return normalize(a).min(normalize(b));
    }
}
