package model;

import java.time.LocalDateTime;
import java.util.Objects;

public class Auditoria {

    private LocalDateTime fechaHora;
    private String usuario;
    private String accion;
    private String entidad;
    private String identificador;
    private String descripcion;

    public Auditoria() {
    }

    public Auditoria(LocalDateTime fechaHora, String usuario, String accion,
                     String entidad, String identificador, String descripcion) {
        this.fechaHora = fechaHora;
        this.usuario = usuario;
        this.accion = accion;
        this.entidad = entidad;
        this.identificador = identificador;
        this.descripcion = descripcion;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getAccion() {
        return accion;
    }

    public void setAccion(String accion) {
        this.accion = accion;
    }

    public String getEntidad() {
        return entidad;
    }

    public void setEntidad(String entidad) {
        this.entidad = entidad;
    }

    public String getIdentificador() {
        return identificador;
    }

    public void setIdentificador(String identificador) {
        this.identificador = identificador;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Auditoria that)) {
            return false;
        }
        return Objects.equals(fechaHora, that.fechaHora)
                && Objects.equals(usuario, that.usuario)
                && Objects.equals(accion, that.accion)
                && Objects.equals(identificador, that.identificador);
    }

    @Override
    public int hashCode() {
        return Objects.hash(fechaHora, usuario, accion, identificador);
    }
}
