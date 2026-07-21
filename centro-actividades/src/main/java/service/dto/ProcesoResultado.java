package service.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Resumen genérico de procesos de cobro/cuota.
 */
public class ProcesoResultado {

    private int procesados;
    private int omitidos;
    private int errores;
    private BigDecimal montoTotal = BigDecimal.ZERO.setScale(2);
    private final List<String> mensajes = new ArrayList<>();
    private final List<String> detallesTabla = new ArrayList<>();

    public int getProcesados() {
        return procesados;
    }

    public void incrementProcesados() {
        procesados++;
    }

    public int getOmitidos() {
        return omitidos;
    }

    public void incrementOmitidos() {
        omitidos++;
    }

    public int getErrores() {
        return errores;
    }

    public void incrementErrores() {
        errores++;
    }

    public BigDecimal getMontoTotal() {
        return montoTotal;
    }

    public void addMonto(BigDecimal monto) {
        if (monto != null) {
            montoTotal = montoTotal.add(monto).setScale(2);
        }
    }

    public List<String> getMensajes() {
        return mensajes;
    }

    public void addMensaje(String mensaje) {
        mensajes.add(mensaje);
    }

    public List<String> getDetallesTabla() {
        return detallesTabla;
    }

    public void addDetalleTabla(String fila) {
        detallesTabla.add(fila);
    }

    public String resumenTexto() {
        return "Procesados: " + procesados
                + " | Omitidos: " + omitidos
                + " | Errores: " + errores
                + " | Monto: " + montoTotal.toPlainString();
    }
}
