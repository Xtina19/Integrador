package model;

import java.math.BigDecimal;
import java.util.Objects;

public class DetalleCuota {

    private String idCuota;
    private Integer secuenciaCuota;
    private String conceptoCuota;
    private BigDecimal valorCuota;
    private String idCobroCuota;

    public DetalleCuota() {
        this.valorCuota = BigDecimal.ZERO.setScale(2);
    }

    public DetalleCuota(String idCuota, Integer secuenciaCuota, String conceptoCuota,
                        BigDecimal valorCuota, String idCobroCuota) {
        this.idCuota = idCuota;
        this.secuenciaCuota = secuenciaCuota;
        this.conceptoCuota = conceptoCuota;
        this.valorCuota = valorCuota == null ? BigDecimal.ZERO.setScale(2) : valorCuota;
        this.idCobroCuota = idCobroCuota;
    }

    public String getIdCuota() {
        return idCuota;
    }

    public void setIdCuota(String idCuota) {
        this.idCuota = idCuota;
    }

    public Integer getSecuenciaCuota() {
        return secuenciaCuota;
    }

    public void setSecuenciaCuota(Integer secuenciaCuota) {
        this.secuenciaCuota = secuenciaCuota;
    }

    public String getConceptoCuota() {
        return conceptoCuota;
    }

    public void setConceptoCuota(String conceptoCuota) {
        this.conceptoCuota = conceptoCuota;
    }

    public BigDecimal getValorCuota() {
        return valorCuota;
    }

    public void setValorCuota(BigDecimal valorCuota) {
        this.valorCuota = valorCuota == null
                ? BigDecimal.ZERO.setScale(2)
                : valorCuota;
    }

    public String getIdCobroCuota() {
        return idCobroCuota;
    }

    public void setIdCobroCuota(String idCobroCuota) {
        this.idCobroCuota = idCobroCuota;
    }

    public String getClaveCompuesta() {
        return idCuota + "#" + secuenciaCuota;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof DetalleCuota that)) {
            return false;
        }
        return Objects.equals(idCuota, that.idCuota)
                && Objects.equals(secuenciaCuota, that.secuenciaCuota);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idCuota, secuenciaCuota);
    }

    @Override
    public String toString() {
        return getClaveCompuesta();
    }
}
