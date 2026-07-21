package model;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;

/**
 * Horario de una actividad.
 * Internamente usa {@link LocalTime}; en TXT se persiste como HH:mm.
 */
public class HorarioActividad {

    public static final DateTimeFormatter HORA_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private String idHorarioActividad;
    private String diaActividad;
    private LocalTime horaActividad;
    private Integer idActividad;

    public HorarioActividad() {
    }

    public HorarioActividad(String idHorarioActividad, String diaActividad,
                            LocalTime horaActividad, Integer idActividad) {
        this.idHorarioActividad = idHorarioActividad;
        this.diaActividad = diaActividad;
        this.horaActividad = horaActividad;
        this.idActividad = idActividad;
    }

    public HorarioActividad(String idHorarioActividad, String diaActividad,
                            String horaActividad, Integer idActividad) {
        this(idHorarioActividad, diaActividad, parseHora(horaActividad), idActividad);
    }

    public String getIdHorarioActividad() {
        return idHorarioActividad;
    }

    public void setIdHorarioActividad(String idHorarioActividad) {
        this.idHorarioActividad = idHorarioActividad;
    }

    public String getDiaActividad() {
        return diaActividad;
    }

    public void setDiaActividad(String diaActividad) {
        this.diaActividad = diaActividad;
    }

    public LocalTime getHoraActividad() {
        return horaActividad;
    }

    public void setHoraActividad(LocalTime horaActividad) {
        this.horaActividad = horaActividad;
    }

    public void setHoraActividad(String horaActividad) {
        this.horaActividad = parseHora(horaActividad);
    }

    public String getHoraFormateada() {
        return horaActividad == null ? "" : HORA_FORMATTER.format(horaActividad);
    }

    public Integer getIdActividad() {
        return idActividad;
    }

    public void setIdActividad(Integer idActividad) {
        this.idActividad = idActividad;
    }

    private static LocalTime parseHora(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return LocalTime.parse(value.trim(), HORA_FORMATTER);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof HorarioActividad that)) {
            return false;
        }
        return Objects.equals(idHorarioActividad, that.idHorarioActividad);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idHorarioActividad);
    }

    @Override
    public String toString() {
        return idHorarioActividad + " - " + diaActividad + " " + getHoraFormateada();
    }
}
