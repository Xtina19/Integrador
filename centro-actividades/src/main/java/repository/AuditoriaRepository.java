package repository;

import config.AppConfig;
import model.Auditoria;
import repository.mapper.AuditoriaMapper;
import util.FileUtils;

import java.io.IOException;

public class AuditoriaRepository extends TxtRepository<Auditoria> {

    private final AuditoriaMapper mapper = new AuditoriaMapper();

    public AuditoriaRepository() {
        super(AppConfig.auditoriaFile(), new AuditoriaMapper());
    }

    /**
     * Append-only para bitácora (no reescribe todo el archivo).
     */
    public synchronized void append(Auditoria auditoria) {
        try {
            FileUtils.appendLine(AppConfig.auditoriaFile(), mapper.toLine(auditoria));
        } catch (IOException ex) {
            throw new RepositoryException("Error al registrar auditoría: " + ex.getMessage(), ex);
        }
    }
}
