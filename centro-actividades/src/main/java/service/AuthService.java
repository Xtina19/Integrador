package service;

import model.Usuario;
import repository.UsuarioRepository;
import validation.ValidationException;
import validation.Validators;

import java.util.Optional;

public class AuthService {

    private final UsuarioRepository usuarioRepository;

    public AuthService() {
        this(new UsuarioRepository());
    }

    public AuthService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    public Optional<Usuario> buscarPorLogin(String login) {
        if (login == null || login.isBlank()) {
            return Optional.empty();
        }
        return usuarioRepository.findByLogin(login.trim());
    }

    public boolean existeLogin(String login) {
        return buscarPorLogin(login).isPresent();
    }

    /**
     * Autentica al usuario. Lanza ValidationException si falla.
     */
    public Usuario login(String login, String password) {
        String loginSafe = Validators.requireText("Login", login);
        String passSafe = Validators.requireText("Contraseña", password);

        Usuario usuario = buscarPorLogin(loginSafe)
                .orElseThrow(() -> new ValidationException("Login",
                        "no existe. Verifique el usuario o solicite creación al administrador."));

        if (!passSafe.equals(usuario.getPassUsuario())) {
            throw new ValidationException("Contraseña",
                    "incorrecta. Intente nuevamente o contacte al administrador.");
        }

        SessionContext.setCurrentUser(usuario);
        return usuario;
    }

    public void logout() {
        SessionContext.clear();
    }

    public Usuario registrarUsuario(Usuario nuevo) {
        if (!SessionContext.isAdministrador()) {
            throw new ValidationException("Solo el administrador puede registrar usuarios.");
        }
        if (nuevo == null) {
            throw new ValidationException("Usuario", "los datos del usuario son obligatorios.");
        }
        Validators.requireText("Login", nuevo.getLoginUsuario());
        Validators.requireText("Contraseña", nuevo.getPassUsuario());
        Validators.requireNivelAcceso("Nivel de acceso", String.valueOf(nuevo.getNivelAcceso()));
        Validators.requireText("Nombre", nuevo.getNombreUsuario());
        Validators.requireText("Apellidos", nuevo.getApellidosUsuario());
        Validators.optionalEmail("Correo", nuevo.getCorreoUsuario());

        if (existeLogin(nuevo.getLoginUsuario())) {
            throw new ValidationException("Login",
                    "ya existe. Elija otro identificador de usuario.");
        }
        return usuarioRepository.insert(nuevo);
    }
}
