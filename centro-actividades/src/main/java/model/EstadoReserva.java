package model;

import java.util.Objects;

public class EstadoReserva {

    private String idEstadoReserva;
    private Boolean estado;
    private String descripcion;

    public EstadoReserva() {
    }

    public EstadoReserva(String idEstadoReserva, Boolean estado, String descripcion) {
        this.idEstadoReserva = idEstadoReserva;
        this.estado = estado;
        this.descripcion = descripcion;
    }

    public String getIdEstadoReserva() {
        return idEstadoReserva;
    }

    public void setIdEstadoReserva(String idEstadoReserva) {
        this.idEstadoReserva = idEstadoReserva;
    }

    public Boolean getEstado() {
        return estado;
    }

    public void setEstado(Boolean estado) {
        this.estado = estado;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public boolean isActiva() {
        return Boolean.TRUE.equals(estado);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof EstadoReserva that)) {
            return false;
        }
        return Objects.equals(idEstadoReserva, that.idEstadoReserva);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idEstadoReserva);
    }

    @Override
    public String toString() {
        return idEstadoReserva + " - " + descripcion;
    }
}
