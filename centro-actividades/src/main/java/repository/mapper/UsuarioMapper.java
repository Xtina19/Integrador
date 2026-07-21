package repository.mapper;

import model.Usuario;
import repository.EntityMapper;
import util.TxtMapper;

import java.util.List;

public class UsuarioMapper implements EntityMapper<Usuario> {

    @Override
    public String getId(Usuario entity) {
        return entity.getLoginUsuario();
    }

    @Override
    public Usuario fromLine(String line) {
        List<String> p = TxtMapper.ensureSize(TxtMapper.split(line), 6);
        Usuario u = new Usuario();
        u.setLoginUsuario(p.get(0));
        u.setPassUsuario(p.get(1));
        u.setNivelAcceso(p.get(2).isBlank() ? null : Integer.parseInt(p.get(2)));
        u.setNombreUsuario(p.get(3));
        u.setApellidosUsuario(p.get(4));
        u.setCorreoUsuario(TxtMapper.emptyToNull(p.get(5)));
        return u;
    }

    @Override
    public String toLine(Usuario entity) {
        return TxtMapper.join(
                entity.getLoginUsuario(),
                entity.getPassUsuario(),
                String.valueOf(entity.getNivelAcceso()),
                entity.getNombreUsuario(),
                entity.getApellidosUsuario(),
                TxtMapper.nullToEmpty(entity.getCorreoUsuario())
        );
    }
}
