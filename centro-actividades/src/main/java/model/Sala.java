package model;

import java.util.Objects;

public class Sala {

    private Integer idSala;
    private String nombreSala;
    private String descripcionSala;
    private Integer idLocalizacionSala;

    public Sala() {
    }

    public Sala(Integer idSala, String nombreSala, String descripcionSala, Integer idLocalizacionSala) {
        this.idSala = idSala;
        this.nombreSala = nombreSala;
        this.descripcionSala = descripcionSala;
        this.idLocalizacionSala = idLocalizacionSala;
    }

    public Integer getIdSala() {
        return idSala;
    }

    public void setIdSala(Integer idSala) {
        this.idSala = idSala;
    }

    public String getNombreSala() {
        return nombreSala;
    }

    public void setNombreSala(String nombreSala) {
        this.nombreSala = nombreSala;
    }

    public String getDescripcionSala() {
        return descripcionSala;
    }

    public void setDescripcionSala(String descripcionSala) {
        this.descripcionSala = descripcionSala;
    }

    public Integer getIdLocalizacionSala() {
        return idLocalizacionSala;
    }

    public void setIdLocalizacionSala(Integer idLocalizacionSala) {
        this.idLocalizacionSala = idLocalizacionSala;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Sala sala)) {
            return false;
        }
        return Objects.equals(idSala, sala.idSala);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idSala);
    }

    @Override
    public String toString() {
        return idSala + " - " + nombreSala;
    }
}
