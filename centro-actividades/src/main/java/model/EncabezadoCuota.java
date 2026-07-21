package model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

public class EncabezadoCuota {

    private String idCuota;
    private LocalDate fechaCuota;
    private Integer idClienteCuota;
    private BigDecimal valorCobro;
    private Boolean statusCuota;

    public EncabezadoCuota() {
        this.valorCobro = BigDecimal.ZERO.setScale(2);
        this.statusCuota = Boolean.FALSE;
    }

    public String getIdCuota() {
        return idCuota;
    }

    public void setIdCuota(String idCuota) {
        this.idCuota = idCuota;
    }

    public LocalDate getFechaCuota() {
        return fechaCuota;
    }

    public void setFechaCuota(LocalDate fechaCuota) {
        this.fechaCuota = fechaCuota;
    }

    public Integer getIdClienteCuota() {
        return idClienteCuota;
    }

    public void setIdClienteCuota(Integer idClienteCuota) {
        this.idClienteCuota = idClienteCuota;
    }

    public BigDecimal getValorCobro() {
        return valorCobro;
    }

    public void setValorCobro(BigDecimal valorCobro) {
        this.valorCobro = valorCobro == null
                ? BigDecimal.ZERO.setScale(2)
                : valorCobro;
    }

    public Boolean getStatusCuota() {
        return statusCuota;
    }

    public void setStatusCuota(Boolean statusCuota) {
        this.statusCuota = statusCuota;
    }

    public boolean isAplicada() {
        return Boolean.TRUE.equals(statusCuota);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof EncabezadoCuota that)) {
            return false;
        }
        return Objects.equals(idCuota, that.idCuota);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idCuota);
    }

    @Override
    public String toString() {
        return idCuota;
    }
}
