package repository;

import config.AppConfig;
import model.Usuario;
import repository.mapper.UsuarioMapper;

import java.util.Optional;

public class UsuarioRepository extends TxtRepository<Usuario> {

    public UsuarioRepository() {
        super(AppConfig.usuariosFile(), new UsuarioMapper());
    }

    public Optional<Usuario> findByLogin(String login) {
        return findById(login);
    }
}
