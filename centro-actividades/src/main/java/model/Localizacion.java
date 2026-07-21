package model;

import java.util.Objects;

public class Localizacion {

    private Integer idLocalizacion;
    private String tipo;

    public Localizacion() {
    }

    public Localizacion(Integer idLocalizacion, String tipo) {
        this.idLocalizacion = idLocalizacion;
        this.tipo = tipo;
    }

    public Integer getIdLocalizacion() {
        return idLocalizacion;
    }

    public void setIdLocalizacion(Integer idLocalizacion) {
        this.idLocalizacion = idLocalizacion;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Localizacion that)) {
            return false;
        }
        return Objects.equals(idLocalizacion, that.idLocalizacion);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idLocalizacion);
    }

    @Override
    public String toString() {
        return idLocalizacion + " - " + tipo;
    }
}
