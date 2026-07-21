package model;

import java.time.LocalDate;
import java.util.Objects;

public class Reserva {

    private String idReserva;
    private Integer idSalaReserva;
    private Integer idClienteReserva;
    private LocalDate fechaReserva;
    private String idHorarioReserva;
    private String idEstadoReserva;

    public Reserva() {
    }

    public Reserva(String idReserva, Integer idSalaReserva, Integer idClienteReserva,
                   LocalDate fechaReserva, String idHorarioReserva, String idEstadoReserva) {
        this.idReserva = idReserva;
        this.idSalaReserva = idSalaReserva;
        this.idClienteReserva = idClienteReserva;
        this.fechaReserva = fechaReserva;
        this.idHorarioReserva = idHorarioReserva;
        this.idEstadoReserva = idEstadoReserva;
    }

    public String getIdReserva() {
        return idReserva;
    }

    public void setIdReserva(String idReserva) {
        this.idReserva = idReserva;
    }

    public Integer getIdSalaReserva() {
        return idSalaReserva;
    }

    public void setIdSalaReserva(Integer idSalaReserva) {
        this.idSalaReserva = idSalaReserva;
    }

    public Integer getIdClienteReserva() {
        return idClienteReserva;
    }

    public void setIdClienteReserva(Integer idClienteReserva) {
        this.idClienteReserva = idClienteReserva;
    }

    public LocalDate getFechaReserva() {
        return fechaReserva;
    }

    public void setFechaReserva(LocalDate fechaReserva) {
        this.fechaReserva = fechaReserva;
    }

    public String getIdHorarioReserva() {
        return idHorarioReserva;
    }

    public void setIdHorarioReserva(String idHorarioReserva) {
        this.idHorarioReserva = idHorarioReserva;
    }

    public String getIdEstadoReserva() {
        return idEstadoReserva;
    }

    public void setIdEstadoReserva(String idEstadoReserva) {
        this.idEstadoReserva = idEstadoReserva;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Reserva reserva)) {
            return false;
        }
        return Objects.equals(idReserva, reserva.idReserva);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idReserva);
    }

    @Override
    public String toString() {
        return idReserva;
    }
}
