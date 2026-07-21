package model;

import java.time.LocalDate;
import java.util.Objects;

public class ReservaActividad {

    private Integer idReservaActividad;
    private LocalDate fechaReserva;
    private LocalDate fechaBaja;
    private String idEstadoReservaActividad;
    private Integer idClienteReservaActividad;
    private Integer idActividad;
    private String idHorarioActividad;

    public ReservaActividad() {
    }

    public Integer getIdReservaActividad() {
        return idReservaActividad;
    }

    public void setIdReservaActividad(Integer idReservaActividad) {
        this.idReservaActividad = idReservaActividad;
    }

    public LocalDate getFechaReserva() {
        return fechaReserva;
    }

    public void setFechaReserva(LocalDate fechaReserva) {
        this.fechaReserva = fechaReserva;
    }

    public LocalDate getFechaBaja() {
        return fechaBaja;
    }

    public void setFechaBaja(LocalDate fechaBaja) {
        this.fechaBaja = fechaBaja;
    }

    public String getIdEstadoReservaActividad() {
        return idEstadoReservaActividad;
    }

    public void setIdEstadoReservaActividad(String idEstadoReservaActividad) {
        this.idEstadoReservaActividad = idEstadoReservaActividad;
    }

    public Integer getIdClienteReservaActividad() {
        return idClienteReservaActividad;
    }

    public void setIdClienteReservaActividad(Integer idClienteReservaActividad) {
        this.idClienteReservaActividad = idClienteReservaActividad;
    }

    public Integer getIdActividad() {
        return idActividad;
    }

    public void setIdActividad(Integer idActividad) {
        this.idActividad = idActividad;
    }

    public String getIdHorarioActividad() {
        return idHorarioActividad;
    }

    public void setIdHorarioActividad(String idHorarioActividad) {
        this.idHorarioActividad = idHorarioActividad;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ReservaActividad that)) {
            return false;
        }
        return Objects.equals(idReservaActividad, that.idReservaActividad);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idReservaActividad);
    }

    @Override
    public String toString() {
        return String.valueOf(idReservaActividad);
    }
}
