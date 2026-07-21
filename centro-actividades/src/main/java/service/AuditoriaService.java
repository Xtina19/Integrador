package service;

import model.Auditoria;
import repository.AuditoriaRepository;
import util.DateUtils;

import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Bitácora de operaciones. Un fallo de escritura no aborta la operación principal.
 */
public class AuditoriaService {

    private static final Logger LOGGER = Logger.getLogger(AuditoriaService.class.getName());

    private final AuditoriaRepository repository;

    public AuditoriaService() {
        this(new AuditoriaRepository());
    }

    public AuditoriaService(AuditoriaRepository repository) {
        this.repository = repository;
    }

    /**
     * @return true si se registró correctamente; false si falló (operación principal continúa).
     */
    public boolean registrar(String accion, String entidad, String identificador, String descripcion) {
        try {
            String usuario = SessionContext.isAuthenticated()
                    ? SessionContext.getCurrentUser().getLoginUsuario()
                    : "sistema";
            Auditoria a = new Auditoria(
                    DateUtils.now(),
                    usuario,
                    accion,
                    entidad,
                    identificador,
                    descripcion
            );
            repository.append(a);
            return true;
        } catch (Exception ex) {
            LOGGER.log(Level.WARNING, "No se pudo registrar auditoría: " + ex.getMessage(), ex);
            return false;
        }
    }

    public List<Auditoria> listar() {
        return repository.findAll();
    }
}
