package service;

import model.Cliente;
import model.Cobro;
import model.DetalleCuota;
import model.EncabezadoCuota;
import repository.ClienteRepository;
import repository.CobroRepository;
import repository.CuotaRepository;
import service.dto.ProcesoResultado;
import util.DateUtils;
import util.IdGenerator;
import util.MoneyUtils;
import validation.ValidationException;
import validation.Validators;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Registro de cuotas (pagos) y aplicación sobre cobros pendientes.
 */
public class CuotaService {

    private final CuotaRepository cuotaRepository;
    private final CobroRepository cobroRepository;
    private final ClienteRepository clienteRepository;
    private final AuditoriaService auditoriaService;

    public CuotaService() {
        this(new CuotaRepository(), new CobroRepository(), new ClienteRepository(), new AuditoriaService());
    }

    public CuotaService(CuotaRepository cuotaRepository,
                        CobroRepository cobroRepository,
                        ClienteRepository clienteRepository,
                        AuditoriaService auditoriaService) {
        this.cuotaRepository = cuotaRepository;
        this.cobroRepository = cobroRepository;
        this.clienteRepository = clienteRepository;
        this.auditoriaService = auditoriaService;
    }

    public Optional<EncabezadoCuota> buscarEncabezado(String idCuota) {
        return cuotaRepository.findEncabezadoById(idCuota);
    }

    public List<DetalleCuota> listarDetalles(String idCuota) {
        return cuotaRepository.findDetallesByCuota(idCuota);
    }

    public List<Cobro> listarCobrosPendientes(Integer idCliente) {
        return cobroRepository.findPendientesByCliente(idCliente);
    }

    public List<DetalleCuota> simularDistribucion(Integer idCliente, BigDecimal valorPago, String concepto) {
        List<Cobro> pendientes = cobroRepository.findPendientesByCliente(idCliente);
        return construirDetallesPlan("SIM", valorPago, concepto, pendientes);
    }

    /**
     * Registra una cuota (pago) sin aplicar aún a cobros/balance.
     * Crea encabezado (status=false) y detalles planificados.
     */
    public EncabezadoCuota registrarCuota(String idCuota, Integer idCliente,
                                          BigDecimal valorPago, String concepto) {
        String id = Validators.requireText("ID Cuota", idCuota).trim();
        if (idCliente == null) {
            throw new ValidationException("Cliente", "es obligatorio.");
        }
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new ValidationException("Cliente", "no existe."));
        if (!cliente.isSocio()) {
            throw new ValidationException("Cliente", "debe ser socio.");
        }
        if (!cliente.isActivo()) {
            throw new ValidationException("Cliente", "debe estar activo.");
        }

        BigDecimal valor = MoneyUtils.normalize(valorPago);
        if (!MoneyUtils.isPositive(valor)) {
            throw new ValidationException("Valor", "debe ser mayor que cero.");
        }
        BigDecimal balance = MoneyUtils.normalize(cliente.getBalanceCliente());
        if (valor.compareTo(balance) > 0) {
            throw new ValidationException("Valor",
                    "no puede ser mayor que el balance pendiente (" + MoneyUtils.format(balance)
                            + "). Ajuste el monto del pago.");
        }

        String conceptoSafe = Validators.requireText("Concepto", concepto);
        Optional<EncabezadoCuota> existente = buscarEncabezado(id);
        if (existente.isPresent() && existente.get().isAplicada()) {
            throw new ValidationException("ID Cuota",
                    "ya fue aplicada y no puede modificarse.");
        }

        List<Cobro> pendientes = cobroRepository.findPendientesByCliente(idCliente);
        if (pendientes.isEmpty()) {
            throw new ValidationException("Cobros",
                    "el cliente no tiene cobros pendientes para aplicar el pago.");
        }

        EncabezadoCuota encabezado = existente.orElseGet(EncabezadoCuota::new);
        encabezado.setIdCuota(id);
        if (existente.isEmpty()) {
            encabezado.setFechaCuota(DateUtils.today());
        }
        encabezado.setIdClienteCuota(idCliente);
        encabezado.setValorCobro(valor);
        encabezado.setStatusCuota(false);

        List<DetalleCuota> plan = construirDetallesPlan(id, valor, conceptoSafe, pendientes);

        // Reemplazar detalles previos de esta cuota
        List<DetalleCuota> todosDetalles = new ArrayList<>(cuotaRepository.detalles().findAll());
        todosDetalles.removeIf(d -> id.equalsIgnoreCase(d.getIdCuota()));
        todosDetalles.addAll(plan);

        cuotaRepository.saveEncabezado(encabezado);
        cuotaRepository.detalles().saveAll(todosDetalles);

        auditoriaService.registrar(existente.isPresent() ? "MODIFICAR" : "CREAR",
                "Cuota", id, "Registro de pago " + MoneyUtils.toStorage(valor)
                        + " cliente " + idCliente);
        return encabezado;
    }

    public String sugerirIdCuota() {
        return IdGenerator.next("CUO");
    }

    /**
     * Aplica cuotas pendientes de una fecha sobre cobros y balances.
     */
    public ProcesoResultado actualizarCuotasPorFecha(LocalDate fecha) {
        if (fecha == null) {
            throw new ValidationException("Fecha", "es obligatoria. Formato dd/MM/yyyy.");
        }

        List<EncabezadoCuota> pendientes = cuotaRepository.findEncabezadosByFecha(fecha).stream()
                .filter(e -> !e.isAplicada())
                .toList();

        if (pendientes.isEmpty()) {
            throw new ValidationException("Fecha",
                    "no hay cuotas pendientes de aplicar para " + DateUtils.format(fecha) + ".");
        }

        ProcesoResultado resultado = new ProcesoResultado();
        List<Cobro> cobros = new ArrayList<>(cobroRepository.findAll());
        List<Cliente> clientes = new ArrayList<>(clienteRepository.findAll());
        List<EncabezadoCuota> encabezados = new ArrayList<>(cuotaRepository.encabezados().findAll());
        List<DetalleCuota> todosDetalles = new ArrayList<>(cuotaRepository.detalles().findAll());
        int cobrosSaldados = 0;

        for (EncabezadoCuota cuota : pendientes) {
            try {
                Cliente cliente = clientes.stream()
                        .filter(c -> c.getIdCliente().equals(cuota.getIdClienteCuota()))
                        .findFirst()
                        .orElseThrow(() -> new ValidationException("Cliente",
                                "no encontrado para cuota " + cuota.getIdCuota()));

                BigDecimal restante = MoneyUtils.normalize(cuota.getValorCobro());
                BigDecimal aplicadoTotal = MoneyUtils.zero();
                List<DetalleCuota> aplicados = new ArrayList<>();
                int seq = 1;

                List<Cobro> pendientesCliente = cobros.stream()
                        .filter(c -> cliente.getIdCliente().equals(c.getIdClienteCobro()) && c.isPendiente())
                        .sorted((a, b) -> {
                            int cmp = a.getFechaCobro().compareTo(b.getFechaCobro());
                            return cmp != 0 ? cmp : a.getIdCobro().compareToIgnoreCase(b.getIdCobro());
                        })
                        .toList();

                for (Cobro cobro : pendientesCliente) {
                    if (restante.compareTo(BigDecimal.ZERO) <= 0) {
                        break;
                    }
                    BigDecimal pendienteCobro = MoneyUtils.normalize(cobro.getValorCobro());
                    BigDecimal aplicar = MoneyUtils.min(restante, pendienteCobro);
                    BigDecimal nuevoValor = MoneyUtils.subtract(pendienteCobro, aplicar);
                    cobro.setValorCobro(nuevoValor);
                    if (nuevoValor.compareTo(BigDecimal.ZERO) == 0) {
                        cobro.setStatusCobro(true);
                        cobrosSaldados++;
                    }
                    actualizarCobroEnLista(cobros, cobro);

                    DetalleCuota det = new DetalleCuota(
                            cuota.getIdCuota(),
                            seq++,
                            "Aplicación a " + cobro.getIdCobro() + " (" + cobro.getConceptoCobro() + ")",
                            aplicar,
                            cobro.getIdCobro()
                    );
                    aplicados.add(det);
                    restante = MoneyUtils.subtract(restante, aplicar);
                    aplicadoTotal = MoneyUtils.add(aplicadoTotal, aplicar);
                }

                if (!MoneyUtils.isPositive(aplicadoTotal)) {
                    resultado.incrementErrores();
                    resultado.addMensaje("Cuota " + cuota.getIdCuota()
                            + ": no había cobros pendientes aplicables.");
                    continue;
                }

                BigDecimal nuevoBalance = MoneyUtils.subtract(cliente.getBalanceCliente(), aplicadoTotal);
                if (MoneyUtils.isNegative(nuevoBalance)) {
                    throw new ValidationException("Balance",
                            "la aplicación produciría balance negativo para cliente "
                                    + cliente.getIdCliente());
                }
                cliente.setBalanceCliente(nuevoBalance);
                actualizarClienteEnLista(clientes, cliente);

                // Reemplazar detalles planificados por los aplicados
                todosDetalles.removeIf(d -> cuota.getIdCuota().equalsIgnoreCase(d.getIdCuota()));
                todosDetalles.addAll(aplicados);

                cuota.setStatusCuota(true);
                actualizarEncabezadoEnLista(encabezados, cuota);

                resultado.incrementProcesados();
                resultado.addMonto(aplicadoTotal);
                resultado.addDetalleTabla(cuota.getIdCuota() + "|" + cliente.getIdCliente()
                        + "|" + MoneyUtils.format(aplicadoTotal) + "|APLICADA");
                resultado.addMensaje("Cuota aplicada: " + cuota.getIdCuota()
                        + " monto " + MoneyUtils.format(aplicadoTotal));

                auditoriaService.registrar("ACTUALIZAR_CUOTA", "Cuota", cuota.getIdCuota(),
                        "Aplicados " + MoneyUtils.toStorage(aplicadoTotal)
                                + "; cobros saldados en lote: " + cobrosSaldados);
            } catch (Exception ex) {
                resultado.incrementErrores();
                resultado.addMensaje("Error cuota " + cuota.getIdCuota() + ": " + ex.getMessage());
            }
        }

        cobroRepository.saveAll(cobros);
        clienteRepository.saveAll(clientes);
        cuotaRepository.encabezados().saveAll(encabezados);
        cuotaRepository.detalles().saveAll(todosDetalles);

        resultado.addMensaje("Cobros saldados en el proceso: " + cobrosSaldados);
        return resultado;
    }

    private List<DetalleCuota> construirDetallesPlan(String idCuota, BigDecimal valorPago,
                                                     String concepto, List<Cobro> pendientes) {
        List<DetalleCuota> detalles = new ArrayList<>();
        BigDecimal restante = MoneyUtils.normalize(valorPago);
        int seq = 1;
        for (Cobro cobro : pendientes) {
            if (restante.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            BigDecimal pendiente = MoneyUtils.normalize(cobro.getValorCobro());
            BigDecimal parte = MoneyUtils.min(restante, pendiente);
            detalles.add(new DetalleCuota(
                    idCuota,
                    seq++,
                    concepto + " → " + cobro.getIdCobro(),
                    parte,
                    cobro.getIdCobro()
            ));
            restante = MoneyUtils.subtract(restante, parte);
        }
        return detalles;
    }

    private void actualizarCobroEnLista(List<Cobro> lista, Cobro cobro) {
        for (int i = 0; i < lista.size(); i++) {
            if (lista.get(i).getIdCobro().equalsIgnoreCase(cobro.getIdCobro())) {
                lista.set(i, cobro);
                return;
            }
        }
    }

    private void actualizarClienteEnLista(List<Cliente> lista, Cliente cliente) {
        for (int i = 0; i < lista.size(); i++) {
            if (lista.get(i).getIdCliente().equals(cliente.getIdCliente())) {
                lista.set(i, cliente);
                return;
            }
        }
    }

    private void actualizarEncabezadoEnLista(List<EncabezadoCuota> lista, EncabezadoCuota cuota) {
        for (int i = 0; i < lista.size(); i++) {
            if (lista.get(i).getIdCuota().equalsIgnoreCase(cuota.getIdCuota())) {
                lista.set(i, cuota);
                return;
            }
        }
    }
}
