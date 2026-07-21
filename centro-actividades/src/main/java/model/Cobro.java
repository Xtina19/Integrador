package model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

public class Cobro {

    private String idCobro;
    private LocalDate fechaCobro;
    private Integer idClienteCobro;
    private BigDecimal valorCobro;
    private String conceptoCobro;
    private Boolean statusCobro;

    public Cobro() {
        this.valorCobro = BigDecimal.ZERO.setScale(2);
        this.statusCobro = Boolean.FALSE;
    }

    public String getIdCobro() {
        return idCobro;
    }

    public void setIdCobro(String idCobro) {
        this.idCobro = idCobro;
    }

    public LocalDate getFechaCobro() {
        return fechaCobro;
    }

    public void setFechaCobro(LocalDate fechaCobro) {
        this.fechaCobro = fechaCobro;
    }

    public Integer getIdClienteCobro() {
        return idClienteCobro;
    }

    public void setIdClienteCobro(Integer idClienteCobro) {
        this.idClienteCobro = idClienteCobro;
    }

    public BigDecimal getValorCobro() {
        return valorCobro;
    }

    public void setValorCobro(BigDecimal valorCobro) {
        this.valorCobro = valorCobro == null
                ? BigDecimal.ZERO.setScale(2)
                : valorCobro;
    }

    public String getConceptoCobro() {
        return conceptoCobro;
    }

    public void setConceptoCobro(String conceptoCobro) {
        this.conceptoCobro = conceptoCobro;
    }

    public Boolean getStatusCobro() {
        return statusCobro;
    }

    public void setStatusCobro(Boolean statusCobro) {
        this.statusCobro = statusCobro;
    }

    public boolean isSaldado() {
        return Boolean.TRUE.equals(statusCobro);
    }

    public boolean isPendiente() {
        return !isSaldado();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Cobro cobro)) {
            return false;
        }
        return Objects.equals(idCobro, cobro.idCobro);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idCobro);
    }

    @Override
    public String toString() {
        return idCobro + " - " + conceptoCobro;
    }
}
