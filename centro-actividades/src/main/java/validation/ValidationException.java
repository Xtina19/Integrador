package validation;

public class ValidationException extends RuntimeException {

    private final String campo;

    public ValidationException(String message) {
        this(null, message);
    }

    public ValidationException(String campo, String message) {
        super(message);
        this.campo = campo;
    }

    public String getCampo() {
        return campo;
    }

    @Override
    public String getMessage() {
        if (campo == null || campo.isBlank()) {
            return super.getMessage();
        }
        return "Campo '" + campo + "': " + super.getMessage();
    }
}
