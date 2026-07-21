package model;

import java.util.Objects;

public class Actividad {

    private Integer idActividad;
    private String nombreActividad;
    private String descripcionActividad;
    private Integer idLocalizacionActividad;
    private Integer idEntrenadorActividad;

    public Actividad() {
    }

    public Actividad(Integer idActividad, String nombreActividad, String descripcionActividad,
                     Integer idLocalizacionActividad, Integer idEntrenadorActividad) {
        this.idActividad = idActividad;
        this.nombreActividad = nombreActividad;
        this.descripcionActividad = descripcionActividad;
        this.idLocalizacionActividad = idLocalizacionActividad;
        this.idEntrenadorActividad = idEntrenadorActividad;
    }

    public Integer getIdActividad() {
        return idActividad;
    }

    public void setIdActividad(Integer idActividad) {
        this.idActividad = idActividad;
    }

    public String getNombreActividad() {
        return nombreActividad;
    }

    public void setNombreActividad(String nombreActividad) {
        this.nombreActividad = nombreActividad;
    }

    public String getDescripcionActividad() {
        return descripcionActividad;
    }

    public void setDescripcionActividad(String descripcionActividad) {
        this.descripcionActividad = descripcionActividad;
    }

    public Integer getIdLocalizacionActividad() {
        return idLocalizacionActividad;
    }

    public void setIdLocalizacionActividad(Integer idLocalizacionActividad) {
        this.idLocalizacionActividad = idLocalizacionActividad;
    }

    public Integer getIdEntrenadorActividad() {
        return idEntrenadorActividad;
    }

    public void setIdEntrenadorActividad(Integer idEntrenadorActividad) {
        this.idEntrenadorActividad = idEntrenadorActividad;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Actividad that)) {
            return false;
        }
        return Objects.equals(idActividad, that.idActividad);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idActividad);
    }

    @Override
    public String toString() {
        return idActividad + " - " + nombreActividad;
    }
}
