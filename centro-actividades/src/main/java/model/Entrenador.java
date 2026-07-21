package model;

import java.util.Objects;

public class Entrenador {

    private Integer idEntrenador;
    private String nombreEntrenador;
    private String apellidoEntrenador;
    private String telefonoEntrenador;
    private String correoEntrenador;

    public Entrenador() {
    }

    public Entrenador(Integer idEntrenador, String nombreEntrenador, String apellidoEntrenador,
                      String telefonoEntrenador, String correoEntrenador) {
        this.idEntrenador = idEntrenador;
        this.nombreEntrenador = nombreEntrenador;
        this.apellidoEntrenador = apellidoEntrenador;
        this.telefonoEntrenador = telefonoEntrenador;
        this.correoEntrenador = correoEntrenador;
    }

    public Integer getIdEntrenador() {
        return idEntrenador;
    }

    public void setIdEntrenador(Integer idEntrenador) {
        this.idEntrenador = idEntrenador;
    }

    public String getNombreEntrenador() {
        return nombreEntrenador;
    }

    public void setNombreEntrenador(String nombreEntrenador) {
        this.nombreEntrenador = nombreEntrenador;
    }

    public String getApellidoEntrenador() {
        return apellidoEntrenador;
    }

    public void setApellidoEntrenador(String apellidoEntrenador) {
        this.apellidoEntrenador = apellidoEntrenador;
    }

    public String getTelefonoEntrenador() {
        return telefonoEntrenador;
    }

    public void setTelefonoEntrenador(String telefonoEntrenador) {
        this.telefonoEntrenador = telefonoEntrenador;
    }

    public String getCorreoEntrenador() {
        return correoEntrenador;
    }

    public void setCorreoEntrenador(String correoEntrenador) {
        this.correoEntrenador = correoEntrenador;
    }

    public String getNombreCompleto() {
        return (nombreEntrenador == null ? "" : nombreEntrenador) + " "
                + (apellidoEntrenador == null ? "" : apellidoEntrenador);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Entrenador that)) {
            return false;
        }
        return Objects.equals(idEntrenador, that.idEntrenador);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idEntrenador);
    }

    @Override
    public String toString() {
        return idEntrenador + " - " + getNombreCompleto().trim();
    }
}
