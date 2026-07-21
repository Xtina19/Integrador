package model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

public class Cliente {

    public static final int TIPO_SOCIO = 1;
    public static final int TIPO_INVITADO = 2;

    private Integer idCliente;
    private String nombreCliente;
    private String apellidoPaternoCliente;
    private String apellidoMaternoCliente;
    private String direccionCliente;
    private LocalDate fechaNacimientoCliente;
    private String telefonoCliente;
    private String celularCliente;
    private LocalDate fechaIngreso;
    private Boolean statusCliente;
    private Integer tipoCliente;
    private String correoCliente;
    private BigDecimal balanceCliente;
    private BigDecimal valorCuotaCliente;

    public Cliente() {
        this.balanceCliente = BigDecimal.ZERO.setScale(2);
        this.valorCuotaCliente = BigDecimal.ZERO.setScale(2);
    }

    public Integer getIdCliente() {
        return idCliente;
    }

    public void setIdCliente(Integer idCliente) {
        this.idCliente = idCliente;
    }

    public String getNombreCliente() {
        return nombreCliente;
    }

    public void setNombreCliente(String nombreCliente) {
        this.nombreCliente = nombreCliente;
    }

    public String getApellidoPaternoCliente() {
        return apellidoPaternoCliente;
    }

    public void setApellidoPaternoCliente(String apellidoPaternoCliente) {
        this.apellidoPaternoCliente = apellidoPaternoCliente;
    }

    public String getApellidoMaternoCliente() {
        return apellidoMaternoCliente;
    }

    public void setApellidoMaternoCliente(String apellidoMaternoCliente) {
        this.apellidoMaternoCliente = apellidoMaternoCliente;
    }

    public String getDireccionCliente() {
        return direccionCliente;
    }

    public void setDireccionCliente(String direccionCliente) {
        this.direccionCliente = direccionCliente;
    }

    public LocalDate getFechaNacimientoCliente() {
        return fechaNacimientoCliente;
    }

    public void setFechaNacimientoCliente(LocalDate fechaNacimientoCliente) {
        this.fechaNacimientoCliente = fechaNacimientoCliente;
    }

    public String getTelefonoCliente() {
        return telefonoCliente;
    }

    public void setTelefonoCliente(String telefonoCliente) {
        this.telefonoCliente = telefonoCliente;
    }

    public String getCelularCliente() {
        return celularCliente;
    }

    public void setCelularCliente(String celularCliente) {
        this.celularCliente = celularCliente;
    }

    public LocalDate getFechaIngreso() {
        return fechaIngreso;
    }

    public void setFechaIngreso(LocalDate fechaIngreso) {
        this.fechaIngreso = fechaIngreso;
    }

    public Boolean getStatusCliente() {
        return statusCliente;
    }

    public void setStatusCliente(Boolean statusCliente) {
        this.statusCliente = statusCliente;
    }

    public Integer getTipoCliente() {
        return tipoCliente;
    }

    public void setTipoCliente(Integer tipoCliente) {
        this.tipoCliente = tipoCliente;
    }

    public String getCorreoCliente() {
        return correoCliente;
    }

    public void setCorreoCliente(String correoCliente) {
        this.correoCliente = correoCliente;
    }

    public BigDecimal getBalanceCliente() {
        return balanceCliente;
    }

    public void setBalanceCliente(BigDecimal balanceCliente) {
        this.balanceCliente = balanceCliente == null
                ? BigDecimal.ZERO.setScale(2)
                : balanceCliente;
    }

    public BigDecimal getValorCuotaCliente() {
        return valorCuotaCliente;
    }

    public void setValorCuotaCliente(BigDecimal valorCuotaCliente) {
        this.valorCuotaCliente = valorCuotaCliente == null
                ? BigDecimal.ZERO.setScale(2)
                : valorCuotaCliente;
    }

    public boolean isSocio() {
        return tipoCliente != null && tipoCliente == TIPO_SOCIO;
    }

    public boolean isActivo() {
        return Boolean.TRUE.equals(statusCliente);
    }

    public String getNombreCompleto() {
        return String.join(" ",
                nombreCliente == null ? "" : nombreCliente,
                apellidoPaternoCliente == null ? "" : apellidoPaternoCliente,
                apellidoMaternoCliente == null ? "" : apellidoMaternoCliente).trim();
    }

    public String getTipoDescripcion() {
        if (tipoCliente == null) {
            return "Desconocido";
        }
        return tipoCliente == TIPO_SOCIO ? "Socio" : "Invitado";
    }

    public String getStatusDescripcion() {
        return isActivo() ? "Activo" : "Pasivo";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Cliente cliente)) {
            return false;
        }
        return Objects.equals(idCliente, cliente.idCliente);
    }

    @Override
    public int hashCode() {
        return Objects.hash(idCliente);
    }

    @Override
    public String toString() {
        return idCliente + " - " + getNombreCompleto();
    }
}
