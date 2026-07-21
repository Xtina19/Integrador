package service;

import model.Usuario;
import repository.UsuarioRepository;
import validation.ValidationException;
import validation.Validators;

import java.util.List;
import java.util.Optional;

public class UsuarioService {

    public static final String ADMIN_PRINCIPAL = "admin";

    private final UsuarioRepository repository;

    public UsuarioService() {
        this(new UsuarioRepository());
    }

    public UsuarioService(UsuarioRepository repository) {
        this.repository = repository;
    }

    public List<Usuario> listar() {
        return repository.findAll();
    }

    public Optional<Usuario> buscarPorLogin(String login) {
        if (login == null || login.isBlank()) {
            return Optional.empty();
        }
        return repository.findByLogin(login.trim());
    }

    public Usuario guardar(Usuario usuario, boolean esNuevo) {
        asegurarAdministrador();
        validar(usuario);

        String login = usuario.getLoginUsuario().trim();
        Optional<Usuario> existente = buscarPorLogin(login);

        if (esNuevo) {
            if (existente.isPresent()) {
                throw new ValidationException("Login",
                        "ya existe. No se permiten identificadores duplicados. Elija otro login.");
            }
            return repository.insert(usuario);
        }

        if (existente.isEmpty()) {
            throw new ValidationException("Login",
                    "no existe para modificar. Use Nuevo o verifique el login.");
        }
        return repository.update(usuario);
    }

    public void eliminar(String login) {
        asegurarAdministrador();
        String id = Validators.requireText("Login", login).trim();

        if (ADMIN_PRINCIPAL.equalsIgnoreCase(id)) {
            throw new ValidationException("Login",
                    "no se puede eliminar al administrador principal \"admin\".");
        }

        Usuario actual = SessionContext.getCurrentUser();
        if (actual != null && id.equalsIgnoreCase(actual.getLoginUsuario())) {
            throw new ValidationException("Login",
                    "no puede eliminarse a sí mismo mientras tiene la sesión activa.");
        }

        if (buscarPorLogin(id).isEmpty()) {
            throw new ValidationException("Login", "no existe. No hay nada que eliminar.");
        }

        repository.deleteById(id);
    }

    public void validar(Usuario usuario) {
        if (usuario == null) {
            throw new ValidationException("Usuario", "los datos son obligatorios.");
        }
        String login = Validators.requireText("Login", usuario.getLoginUsuario());
        usuario.setLoginUsuario(login.trim());
        Validators.requireText("Contraseña", usuario.getPassUsuario());
        Validators.requireNivelAcceso("Nivel de acceso", String.valueOf(usuario.getNivelAcceso()));
        usuario.setNombreUsuario(Validators.requireText("Nombre", usuario.getNombreUsuario()));
        usuario.setApellidosUsuario(Validators.requireText("Apellidos", usuario.getApellidosUsuario()));
        Validators.optionalEmail("Correo", usuario.getCorreoUsuario());
        if (usuario.getCorreoUsuario() != null && usuario.getCorreoUsuario().isBlank()) {
            usuario.setCorreoUsuario(null);
        }
    }

    private void asegurarAdministrador() {
        if (!SessionContext.isAdministrador()) {
            throw new ValidationException(
                    "Acceso denegado. Solo el administrador puede gestionar usuarios.");
        }
    }
}
