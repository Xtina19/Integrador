package service.dto;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Resultado tabular de una consulta (solo lectura).
 */
public class ConsultaResultado {

    private final String[] columnas;
    private final List<Object[]> filas;
    private final String resumen;

    public ConsultaResultado(String[] columnas, List<Object[]> filas, String resumen) {
        this.columnas = columnas == null ? new String[0] : columnas.clone();
        this.filas = filas == null ? List.of() : List.copyOf(filas);
        this.resumen = resumen == null ? "" : resumen;
    }

    public String[] getColumnas() {
        return columnas.clone();
    }

    public List<Object[]> getFilas() {
        return filas;
    }

    public String getResumen() {
        return resumen;
    }

    public int getCantidad() {
        return filas.size();
    }

    public List<Object[]> getFilasMutables() {
        List<Object[]> copy = new ArrayList<>();
        for (Object[] f : filas) {
            copy.add(f.clone());
        }
        return copy;
    }

    public static ConsultaResultado vacio(String[] columnas, String mensaje) {
        return new ConsultaResultado(columnas, Collections.emptyList(), mensaje);
    }
}
