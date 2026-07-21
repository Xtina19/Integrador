package model;

/**
 * Catálogo fijo de estados de reserva.
 * El booleano {@code estado} del modelo indica si bloquea disponibilidad (true = activa).
 */
public final class EstadoReservaIds {

    public static final String ACTIVA = "ACT";
    public static final String CANCELADA = "CAN";
    public static final String REVERSADA = "REV";
    public static final String FINALIZADA = "FIN";

    private EstadoReservaIds() {
    }

    public static boolean bloqueaDisponibilidad(String idEstado) {
        return ACTIVA.equalsIgnoreCase(idEstado);
    }

    public static boolean esTerminal(String idEstado) {
        return CANCELADA.equalsIgnoreCase(idEstado)
                || REVERSADA.equalsIgnoreCase(idEstado)
                || FINALIZADA.equalsIgnoreCase(idEstado);
    }

    public static boolean permiteEliminacionFisica(String idEstado) {
        return CANCELADA.equalsIgnoreCase(idEstado) || REVERSADA.equalsIgnoreCase(idEstado);
    }
}
