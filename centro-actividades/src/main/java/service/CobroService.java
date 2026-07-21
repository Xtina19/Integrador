package service;

import config.AppConfig;
import model.Cliente;
import model.Cobro;
import repository.ClienteRepository;
import repository.CobroRepository;
import service.dto.ProcesoResultado;
import util.DateUtils;
import util.FileUtils;
import util.MoneyUtils;
import util.PdfUtils;
import validation.ValidationException;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Generación y reversión de cobros mensuales + volantes PDF.
 */
public class CobroService {

    private final CobroRepository cobroRepository;
    private final ClienteRepository clienteRepository;
    private final AuditoriaService auditoriaService;

    public CobroService() {
        this(new CobroRepository(), new ClienteRepository(), new AuditoriaService());
    }

    public CobroService(CobroRepository cobroRepository,
                        ClienteRepository clienteRepository,
                        AuditoriaService auditoriaService) {
        this.cobroRepository = cobroRepository;
        this.clienteRepository = clienteRepository;
        this.auditoriaService = auditoriaService;
    }

    public List<Cobro> listar() {
        return cobroRepository.findAll();
    }

    public List<Cobro> listarPendientesPorCliente(Integer idCliente) {
        return cobroRepository.findPendientesByCliente(idCliente);
    }

    public Optional<Cobro> buscarPorId(String id) {
        return cobroRepository.findById(id);
    }

    public String conceptoMensual(int mes, int anio) {
        return "Cuota mensual " + DateUtils.formatPeriodo(mes, anio);
    }

    public Path carpetaVolantes(int mes, int anio) {
        return AppConfig.volantesDir().resolve(DateUtils.formatPeriodo(mes, anio));
    }

    public boolean existeCobroPeriodoCliente(int mes, int anio, Integer idCliente) {
        String concepto = conceptoMensual(mes, anio);
        return cobroRepository.findByCliente(idCliente).stream()
                .anyMatch(c -> concepto.equalsIgnoreCase(c.getConceptoCobro()));
    }

    /**
     * Genera cobros mensuales para socios activos. Transaccional a nivel de archivos.
     */
    public ProcesoResultado generarCobrosMensuales(int mes, int anio) {
        asegurarAdministrador("generar cobros");
        validarPeriodo(mes, anio);

        ProcesoResultado resultado = new ProcesoResultado();
        String concepto = conceptoMensual(mes, anio);
        LocalDate fechaCobro = fechaFacturacion(mes, anio);
        Path dirVolantes = carpetaVolantes(mes, anio);

        Path bakCobros = null;
        Path bakClientes = null;
        try {
            bakCobros = FileUtils.backupFile(AppConfig.cobrosFile());
            bakClientes = FileUtils.backupFile(AppConfig.clientesFile());
            FileUtils.ensureDirectory(dirVolantes);

            List<Cliente> socios = clienteRepository.findSociosActivos();
            List<Cobro> cobrosActuales = new ArrayList<>(cobroRepository.findAll());
            List<Cliente> clientesActuales = new ArrayList<>(clienteRepository.findAll());

            for (Cliente socio : socios) {
                try {
                    if (existeCobroPeriodoCliente(mes, anio, socio.getIdCliente())) {
                        resultado.incrementOmitidos();
                        resultado.addMensaje("Omitido cliente " + socio.getIdCliente()
                                + ": ya tiene cobro " + concepto);
                        resultado.addDetalleTabla(socio.getIdCliente() + "|OMITIDO|Ya existe cobro del período");
                        continue;
                    }

                    BigDecimal valor = MoneyUtils.normalize(socio.getValorCuotaCliente());
                    if (!MoneyUtils.isPositive(valor)) {
                        resultado.incrementOmitidos();
                        resultado.addMensaje("Omitido cliente " + socio.getIdCliente() + ": cuota inválida");
                        resultado.addDetalleTabla(socio.getIdCliente() + "|OMITIDO|Valor de cuota inválido");
                        continue;
                    }

                    BigDecimal balanceAnterior = MoneyUtils.normalize(socio.getBalanceCliente());
                    BigDecimal balanceNuevo = MoneyUtils.add(balanceAnterior, valor);

                    String idCobro = "COB-" + DateUtils.formatPeriodo(mes, anio)
                            + "-" + socio.getIdCliente();

                    Cobro cobro = new Cobro();
                    cobro.setIdCobro(idCobro);
                    cobro.setFechaCobro(fechaCobro);
                    cobro.setIdClienteCobro(socio.getIdCliente());
                    cobro.setValorCobro(valor);
                    cobro.setConceptoCobro(concepto);
                    cobro.setStatusCobro(false);

                    socio.setBalanceCliente(balanceNuevo);
                    actualizarEnLista(clientesActuales, socio);
                    cobrosActuales.add(cobro);

                    PdfUtils.generarVolanteCobro(
                            dirVolantes,
                            idCobro,
                            fechaCobro,
                            DateUtils.formatPeriodo(mes, anio),
                            socio.getIdCliente(),
                            socio.getNombreCompleto(),
                            concepto,
                            valor,
                            balanceAnterior,
                            balanceNuevo
                    );

                    resultado.incrementProcesados();
                    resultado.addMonto(valor);
                    resultado.addDetalleTabla(idCobro + "|" + socio.getIdCliente() + "|"
                            + MoneyUtils.format(valor) + "|GENERADO");
                    resultado.addMensaje("Cobro generado: " + idCobro);
                } catch (Exception ex) {
                    resultado.incrementErrores();
                    resultado.addMensaje("Error cliente " + socio.getIdCliente() + ": " + ex.getMessage());
                    resultado.addDetalleTabla(socio.getIdCliente() + "|ERROR|" + ex.getMessage());
                    throw ex; // aborta y restaura
                }
            }

            cobroRepository.saveAll(cobrosActuales);
            clienteRepository.saveAll(clientesActuales);

            auditoriaService.registrar("GENERAR_COBRO", "Cobro", DateUtils.formatPeriodo(mes, anio),
                    resultado.resumenTexto());

            FileUtils.deleteQuietly(bakCobros);
            FileUtils.deleteQuietly(bakClientes);
            return resultado;
        } catch (Exception ex) {
            try {
                FileUtils.restoreBackup(AppConfig.cobrosFile(), bakCobros);
                FileUtils.restoreBackup(AppConfig.clientesFile(), bakClientes);
                FileUtils.deleteDirectoryContents(dirVolantes);
            } catch (IOException restoreEx) {
                resultado.addMensaje("Fallo al restaurar respaldos: " + restoreEx.getMessage());
            }
            throw new ValidationException("Generar cobro",
                    "proceso abortado por error grave: " + ex.getMessage()
                            + ". Se intentó restaurar los archivos.");
        }
    }

    /**
     * Revierte cobros del período. No revierte cobros ya saldados.
     */
    public ProcesoResultado reversarCobrosMensuales(int mes, int anio) {
        asegurarAdministrador("reversar cobros");
        validarPeriodo(mes, anio);

        String concepto = conceptoMensual(mes, anio);
        List<Cobro> delPeriodo = cobroRepository.findByConceptoContains(concepto).stream()
                .filter(c -> concepto.equalsIgnoreCase(c.getConceptoCobro()))
                .toList();

        if (delPeriodo.isEmpty()) {
            throw new ValidationException("Período",
                    "no existen cobros para " + DateUtils.formatPeriodo(mes, anio) + ".");
        }

        ProcesoResultado resultado = new ProcesoResultado();
        Path bakCobros = null;
        Path bakClientes = null;

        try {
            bakCobros = FileUtils.backupFile(AppConfig.cobrosFile());
            bakClientes = FileUtils.backupFile(AppConfig.clientesFile());

            List<Cobro> restantes = new ArrayList<>(cobroRepository.findAll());
            List<Cliente> clientes = new ArrayList<>(clienteRepository.findAll());

            for (Cobro cobro : delPeriodo) {
                if (cobro.isSaldado()) {
                    resultado.incrementErrores();
                    resultado.addMensaje("No se revirtió " + cobro.getIdCobro()
                            + ": ya está saldado completamente.");
                    resultado.addDetalleTabla(cobro.getIdCobro() + "|ERROR|Cobro saldado");
                    continue;
                }

                Cliente cliente = clientes.stream()
                        .filter(c -> c.getIdCliente().equals(cobro.getIdClienteCobro()))
                        .findFirst()
                        .orElse(null);
                if (cliente == null) {
                    resultado.incrementErrores();
                    resultado.addMensaje("Cliente no encontrado para cobro " + cobro.getIdCobro());
                    continue;
                }

                BigDecimal pendiente = MoneyUtils.normalize(cobro.getValorCobro());
                BigDecimal nuevoBalance = MoneyUtils.subtract(cliente.getBalanceCliente(), pendiente);
                if (MoneyUtils.isNegative(nuevoBalance)) {
                    nuevoBalance = MoneyUtils.zero();
                }
                cliente.setBalanceCliente(nuevoBalance);
                actualizarEnLista(clientes, cliente);

                restantes.removeIf(c -> c.getIdCobro().equalsIgnoreCase(cobro.getIdCobro()));

                resultado.incrementProcesados();
                resultado.addMonto(pendiente);
                resultado.addDetalleTabla(cobro.getIdCobro() + "|" + cliente.getIdCliente()
                        + "|" + MoneyUtils.format(pendiente) + "|REVERSADO");
                resultado.addMensaje("Reversado: " + cobro.getIdCobro());

                auditoriaService.registrar("REVERSAR_COBRO", "Cobro", cobro.getIdCobro(),
                        "Reversión período " + DateUtils.formatPeriodo(mes, anio)
                                + " valor " + MoneyUtils.toStorage(pendiente));
            }

            if (resultado.getProcesados() == 0 && resultado.getErrores() > 0) {
                throw new ValidationException("Reversar cobro",
                        "ningún cobro pudo reversarse (posiblemente todos saldados).");
            }

            cobroRepository.saveAll(restantes);
            clienteRepository.saveAll(clientes);

            Path dir = carpetaVolantes(mes, anio);
            if (Files.isDirectory(dir)) {
                FileUtils.deleteDirectoryContents(dir);
            }

            FileUtils.deleteQuietly(bakCobros);
            FileUtils.deleteQuietly(bakClientes);
            return resultado;
        } catch (ValidationException ex) {
            try {
                FileUtils.restoreBackup(AppConfig.cobrosFile(), bakCobros);
                FileUtils.restoreBackup(AppConfig.clientesFile(), bakClientes);
            } catch (IOException ignored) {
                // best effort
            }
            throw ex;
        } catch (Exception ex) {
            try {
                FileUtils.restoreBackup(AppConfig.cobrosFile(), bakCobros);
                FileUtils.restoreBackup(AppConfig.clientesFile(), bakClientes);
            } catch (IOException ignored) {
                // best effort
            }
            throw new ValidationException("Reversar cobro",
                    "error grave: " + ex.getMessage() + ". Se restauraron respaldos si fue posible.");
        }
    }

    private LocalDate fechaFacturacion(int mes, int anio) {
        // Se asume mes de 30 días para facturación.
        int dia = Math.min(30, LocalDate.of(anio, mes, 1).lengthOfMonth());
        return LocalDate.of(anio, mes, dia);
    }

    private void validarPeriodo(int mes, int anio) {
        if (mes < 1 || mes > 12) {
            throw new ValidationException("Mes", "debe estar entre 1 y 12.");
        }
        if (anio < 2000 || anio > 2100) {
            throw new ValidationException("Año", "debe ser un año válido (2000-2100).");
        }
    }

    private void actualizarEnLista(List<Cliente> lista, Cliente cliente) {
        for (int i = 0; i < lista.size(); i++) {
            if (lista.get(i).getIdCliente().equals(cliente.getIdCliente())) {
                lista.set(i, cliente);
                return;
            }
        }
        lista.add(cliente);
    }

    private void asegurarAdministrador(String accion) {
        if (!SessionContext.isAdministrador()) {
            throw new ValidationException("Acceso denegado. Solo el administrador puede " + accion + ".");
        }
    }
}
