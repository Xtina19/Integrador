package model;

import java.util.Objects;

public class Usuario {

    private String loginUsuario;
    private String passUsuario;
    private Integer nivelAcceso;
    private String nombreUsuario;
    private String apellidosUsuario;
    private String correoUsuario;

    public Usuario() {
    }

    public Usuario(String loginUsuario, String passUsuario, Integer nivelAcceso,
                   String nombreUsuario, String apellidosUsuario, String correoUsuario) {
        this.loginUsuario = loginUsuario;
        this.passUsuario = passUsuario;
        this.nivelAcceso = nivelAcceso;
        this.nombreUsuario = nombreUsuario;
        this.apellidosUsuario = apellidosUsuario;
        this.correoUsuario = correoUsuario;
    }

    public String getLoginUsuario() {
        return loginUsuario;
    }

    public void setLoginUsuario(String loginUsuario) {
        this.loginUsuario = loginUsuario;
    }

    public String getPassUsuario() {
        return passUsuario;
    }

    public void setPassUsuario(String passUsuario) {
        this.passUsuario = passUsuario;
    }

    public Integer getNivelAcceso() {
        return nivelAcceso;
    }

    public void setNivelAcceso(Integer nivelAcceso) {
        this.nivelAcceso = nivelAcceso;
    }

    public String getNombreUsuario() {
        return nombreUsuario;
    }

    public void setNombreUsuario(String nombreUsuario) {
        this.nombreUsuario = nombreUsuario;
    }

    public String getApellidosUsuario() {
        return apellidosUsuario;
    }

    public void setApellidosUsuario(String apellidosUsuario) {
        this.apellidosUsuario = apellidosUsuario;
    }

    public String getCorreoUsuario() {
        return correoUsuario;
    }

    public void setCorreoUsuario(String correoUsuario) {
        this.correoUsuario = correoUsuario;
    }

    public boolean isAdministrador() {
        return nivelAcceso != null && nivelAcceso == 0;
    }

    public String getNombreCompleto() {
        return (nombreUsuario == null ? "" : nombreUsuario) + " "
                + (apellidosUsuario == null ? "" : apellidosUsuario);
    }

    public String getNivelDescripcion() {
        if (nivelAcceso == null) {
            return "Desconocido";
        }
        return nivelAcceso == 0 ? "Administrador" : "Usuario normal";
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Usuario usuario)) {
            return false;
        }
        return Objects.equals(loginUsuario, usuario.loginUsuario);
    }

    @Override
    public int hashCode() {
        return Objects.hash(loginUsuario);
    }

    @Override
    public String toString() {
        return loginUsuario + " - " + getNombreCompleto().trim();
    }
}
