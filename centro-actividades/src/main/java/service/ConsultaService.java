package service;

import model.Actividad;
import model.Cliente;
import model.Cobro;
import model.DetalleCuota;
import model.EncabezadoCuota;
import model.Entrenador;
import model.HorarioActividad;
import model.Localizacion;
import model.Sala;
import model.Usuario;
import repository.ActividadRepository;
import repository.ClienteRepository;
import repository.CobroRepository;
import repository.CuotaRepository;
import repository.EntrenadorRepository;
import repository.HorarioActividadRepository;
import repository.LocalizacionRepository;
import repository.SalaRepository;
import repository.UsuarioRepository;
import service.dto.ConsultaResultado;
import util.DateUtils;
import util.MoneyUtils;
import validation.ValidationException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

/**
 * Consultas de solo lectura. Toda la lógica de filtrado vive aquí.
 */
public class ConsultaService {

    private static final Logger LOGGER = Logger.getLogger(ConsultaService.class.getName());
    private static final String NO_ENCONTRADO = "No encontrado";

    private final UsuarioRepository usuarioRepository = new UsuarioRepository();
    private final EntrenadorRepository entrenadorRepository = new EntrenadorRepository();
    private final LocalizacionRepository localizacionRepository = new LocalizacionRepository();
    private final SalaRepository salaRepository = new SalaRepository();
    private final ActividadRepository actividadRepository = new ActividadRepository();
    private final HorarioActividadRepository horarioRepository = new HorarioActividadRepository();
    private final CobroRepository cobroRepository = new CobroRepository();
    private final ClienteRepository clienteRepository = new ClienteRepository();
    private final CuotaRepository cuotaRepository = new CuotaRepository();

    // ---------- Usuarios ----------

    public ConsultaResultado consultarUsuarios(String login, String nombre, String apellido,
                                              Integer nivel, String correo) {
        asegurarAdmin();
        String[] cols = {"Login", "Nombre", "Apellidos", "Correo", "Nivel", "Descripción nivel"};
        List<Object[]> filas = new ArrayList<>();
        for (Usuario u : usuarioRepository.findAll()) {
            if (!contains(u.getLoginUsuario(), login)) {
                continue;
            }
            if (!contains(u.getNombreUsuario(), nombre)) {
                continue;
            }
            if (!contains(u.getApellidosUsuario(), apellido)) {
                continue;
            }
            if (nivel != null && !Objects.equals(u.getNivelAcceso(), nivel)) {
                continue;
            }
            if (!contains(u.getCorreoUsuario(), correo)) {
                continue;
            }
            filas.add(new Object[]{
                    u.getLoginUsuario(),
                    u.getNombreUsuario(),
                    u.getApellidosUsuario(),
                    nullToEmpty(u.getCorreoUsuario()),
                    u.getNivelAcceso(),
                    u.getNivelDescripcion()
            });
        }
        return new ConsultaResultado(cols, filas, "Registros: " + filas.size());
    }

    // ---------- Entrenadores ----------

    public ConsultaResultado consultarEntrenadores(String id, String nombre, String apellido,
                                                   String telefono, String correo) {
        String[] cols = {"ID", "Nombre", "Apellido", "Nombre completo", "Teléfono", "Correo"};
        List<Object[]> filas = new ArrayList<>();
        for (Entrenador e : entrenadorRepository.findAll()) {
            if (!matchesId(e.getIdEntrenador(), id)) {
                continue;
            }
            if (!contains(e.getNombreEntrenador(), nombre)) {
                continue;
            }
            if (!contains(e.getApellidoEntrenador(), apellido)) {
                continue;
            }
            if (!contains(e.getTelefonoEntrenador(), telefono)) {
                continue;
            }
            if (!contains(e.getCorreoEntrenador(), correo)) {
                continue;
            }
            filas.add(new Object[]{
                    e.getIdEntrenador(),
                    e.getNombreEntrenador(),
                    e.getApellidoEntrenador(),
                    e.getNombreCompleto().trim(),
                    nullToEmpty(e.getTelefonoEntrenador()),
                    nullToEmpty(e.getCorreoEntrenador())
            });
        }
        return new ConsultaResultado(cols, filas, "Registros: " + filas.size());
    }

    // ---------- Localizaciones ----------

    public ConsultaResultado consultarLocalizaciones(String id, String tipo) {
        String[] cols = {"ID", "Tipo"};
        List<Object[]> filas = new ArrayList<>();
        for (Localizacion l : localizacionRepository.findAll()) {
            if (!matchesId(l.getIdLocalizacion(), id)) {
                continue;
            }
            if (!contains(l.getTipo(), tipo)) {
                continue;
            }
            filas.add(new Object[]{l.getIdLocalizacion(), l.getTipo()});
        }
        return new ConsultaResultado(cols, filas, "Registros: " + filas.size());
    }

    // ---------- Salas ----------

    public ConsultaResultado consultarSalas(String id, String nombre, String localizacion) {
        String[] cols = {"ID", "Nombre", "Descripción", "ID localización", "Localización"};
        Map<Integer, Localizacion> locs = index(localizacionRepository.findAll(), Localizacion::getIdLocalizacion);
        List<Object[]> filas = new ArrayList<>();
        for (Sala s : salaRepository.findAll()) {
            if (!matchesId(s.getIdSala(), id)) {
                continue;
            }
            if (!contains(s.getNombreSala(), nombre)) {
                continue;
            }
            String locLabel = resolveLocalizacion(locs, s.getIdLocalizacionSala());
            if (!contains(locLabel, localizacion) && !matchesId(s.getIdLocalizacionSala(), localizacion)) {
                continue;
            }
            filas.add(new Object[]{
                    s.getIdSala(), s.getNombreSala(), s.getDescripcionSala(),
                    s.getIdLocalizacionSala(), locLabel
            });
        }
        return new ConsultaResultado(cols, filas, "Registros: " + filas.size());
    }

    // ---------- Actividades ----------

    public ConsultaResultado consultarActividades(String id, String nombre, String entrenador, String localizacion) {
        String[] cols = {"ID", "Nombre", "Descripción", "ID entrenador", "Entrenador",
                "ID localización", "Localización"};
        Map<Integer, Localizacion> locs = index(localizacionRepository.findAll(), Localizacion::getIdLocalizacion);
        Map<Integer, Entrenador> ents = index(entrenadorRepository.findAll(), Entrenador::getIdEntrenador);
        List<Object[]> filas = new ArrayList<>();
        for (Actividad a : actividadRepository.findAll()) {
            if (!matchesId(a.getIdActividad(), id)) {
                continue;
            }
            if (!contains(a.getNombreActividad(), nombre)) {
                continue;
            }
            String entLabel = resolveEntrenador(ents, a.getIdEntrenadorActividad());
            String locLabel = resolveLocalizacion(locs, a.getIdLocalizacionActividad());
            if (!contains(entLabel, entrenador) && !matchesId(a.getIdEntrenadorActividad(), entrenador)) {
                continue;
            }
            if (!contains(locLabel, localizacion) && !matchesId(a.getIdLocalizacionActividad(), localizacion)) {
                continue;
            }
            filas.add(new Object[]{
                    a.getIdActividad(), a.getNombreActividad(), a.getDescripcionActividad(),
                    a.getIdEntrenadorActividad(), entLabel,
                    a.getIdLocalizacionActividad(), locLabel
            });
        }
        return new ConsultaResultado(cols, filas, "Registros: " + filas.size());
    }

    // ---------- Horarios ----------

    public ConsultaResultado consultarHorarios(String id, String dia, String hora, String actividad) {
        String[] cols = {"ID", "Día", "Hora", "ID actividad", "Actividad"};
        Map<Integer, Actividad> acts = index(actividadRepository.findAll(), Actividad::getIdActividad);
        List<Object[]> filas = new ArrayList<>();
        for (HorarioActividad h : horarioRepository.findAll()) {
            if (!contains(h.getIdHorarioActividad(), id)) {
                continue;
            }
            if (!contains(h.getDiaActividad(), dia)) {
                continue;
            }
            if (!contains(h.getHoraFormateada(), hora)) {
                continue;
            }
            String actLabel = resolveActividad(acts, h.getIdActividad());
            if (!contains(actLabel, actividad) && !matchesId(h.getIdActividad(), actividad)) {
                continue;
            }
            filas.add(new Object[]{
                    h.getIdHorarioActividad(),
                    h.getDiaActividad(),
                    h.getHoraActividad() == null ? "" : h.getHoraActividad(),
                    h.getIdActividad(),
                    actLabel
            });
        }
        filas.sort(Comparator
                .comparing((Object[] r) -> String.valueOf(r[1]))
                .thenComparing(r -> r[2] instanceof LocalTime t ? t : LocalTime.MIDNIGHT));
        return new ConsultaResultado(cols, filas, "Registros: " + filas.size());
    }

    // ---------- Cobros rango ----------

    public ConsultaResultado consultarCobrosPorRango(LocalDate desde, LocalDate hasta,
                                                    Integer idCliente, Boolean saldado,
                                                    Integer mes, Integer anio) {
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new ValidationException("Fecha inicial",
                    "no puede ser posterior a la fecha final.");
        }
        String[] cols = {"ID cobro", "Fecha", "Período", "ID cliente", "Cliente",
                "Concepto", "Valor pendiente", "Estado", "Balance actual cliente"};
        Map<Integer, Cliente> clientes = index(clienteRepository.findAll(), Cliente::getIdCliente);
        List<Object[]> filas = new ArrayList<>();
        BigDecimal totalPendiente = MoneyUtils.zero();
        BigDecimal totalSaldado = MoneyUtils.zero();
        int cantPend = 0;
        int cantSald = 0;

        for (Cobro c : cobroRepository.findAll()) {
            if (desde != null && (c.getFechaCobro() == null || c.getFechaCobro().isBefore(desde))) {
                continue;
            }
            if (hasta != null && (c.getFechaCobro() == null || c.getFechaCobro().isAfter(hasta))) {
                continue;
            }
            if (idCliente != null && !idCliente.equals(c.getIdClienteCobro())) {
                continue;
            }
            if (saldado != null && saldado != c.isSaldado()) {
                continue;
            }
            String periodo = extraerPeriodo(c.getConceptoCobro());
            if (mes != null || anio != null) {
                if (!periodoCoincide(periodo, mes, anio)) {
                    continue;
                }
                if (desde != null || hasta != null) {
                    // coherencia básica: si hay fechas y período, ambos deben dejar pasar
                }
            }
            Cliente cli = clientes.get(c.getIdClienteCobro());
            String nombreCli = cli == null ? warnFk("Cliente", c.getIdClienteCobro()) : cli.getNombreCompleto();
            BigDecimal balance = cli == null ? MoneyUtils.zero() : MoneyUtils.normalize(cli.getBalanceCliente());
            String estado = c.isSaldado() ? "Saldado" : "Pendiente";
            filas.add(new Object[]{
                    c.getIdCobro(),
                    c.getFechaCobro(),
                    periodo,
                    c.getIdClienteCobro(),
                    nombreCli,
                    c.getConceptoCobro(),
                    MoneyUtils.normalize(c.getValorCobro()),
                    estado,
                    balance
            });
            if (c.isSaldado()) {
                cantSald++;
                // valor pendiente 0 cuando saldado
            } else {
                cantPend++;
                totalPendiente = MoneyUtils.add(totalPendiente, c.getValorCobro());
            }
        }
        BigDecimal totalGeneral = totalPendiente; // montos visibles = saldos pendientes
        String resumen = "Cobros: " + filas.size()
                + " | Pendientes: " + cantPend + " (total pendiente " + MoneyUtils.format(totalPendiente) + ")"
                + " | Saldados: " + cantSald + " (total saldado en pendiente: " + MoneyUtils.format(totalSaldado) + ")"
                + " | Total general (saldos pendientes del resultado): " + MoneyUtils.format(totalGeneral)
                + " | Nota: valorCobro = saldo pendiente del cobro (no el monto original).";
        return new ConsultaResultado(cols, filas, resumen);
    }

    // ---------- Cobros por cliente ----------

    public ConsultaResultado consultarCobrosPorCliente(Integer idCliente, Boolean saldado,
                                                      LocalDate desde, LocalDate hasta) {
        if (idCliente == null) {
            throw new ValidationException("Cliente", "seleccione un cliente.");
        }
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new ValidationException("Fecha inicial", "no puede ser posterior a la fecha final.");
        }
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new ValidationException("Cliente", "no existe."));
        String[] cols = {"ID cobro", "Fecha", "Concepto", "Valor pendiente", "Estado"};
        List<Object[]> filas = new ArrayList<>();
        BigDecimal totalPend = MoneyUtils.zero();
        int saldados = 0;
        for (Cobro c : cobroRepository.findByCliente(idCliente)) {
            if (desde != null && (c.getFechaCobro() == null || c.getFechaCobro().isBefore(desde))) {
                continue;
            }
            if (hasta != null && (c.getFechaCobro() == null || c.getFechaCobro().isAfter(hasta))) {
                continue;
            }
            if (saldado != null && saldado != c.isSaldado()) {
                continue;
            }
            filas.add(new Object[]{
                    c.getIdCobro(), c.getFechaCobro(), c.getConceptoCobro(),
                    MoneyUtils.normalize(c.getValorCobro()),
                    c.isSaldado() ? "Saldado" : "Pendiente"
            });
            if (c.isSaldado()) {
                saldados++;
            } else {
                totalPend = MoneyUtils.add(totalPend, c.getValorCobro());
            }
        }
        String resumen = "Cliente: " + cliente.getNombreCompleto()
                + " | Balance actual: " + MoneyUtils.format(cliente.getBalanceCliente())
                + " | Cobros: " + filas.size()
                + " | Total pendiente: " + MoneyUtils.format(totalPend)
                + " | Saldados: " + saldados;
        return new ConsultaResultado(cols, filas, resumen);
    }

    // ---------- Cuotas por fecha ----------

    public ConsultaResultado consultarCuotasPorFecha(LocalDate fecha, Boolean aplicada, Integer idCliente) {
        if (fecha == null) {
            throw new ValidationException("Fecha", "es obligatoria.");
        }
        String[] cols = {"ID cuota", "Fecha", "ID cliente", "Cliente", "Valor recibido", "Estado"};
        Map<Integer, Cliente> clientes = index(clienteRepository.findAll(), Cliente::getIdCliente);
        List<Object[]> filas = new ArrayList<>();
        BigDecimal totalRecibido = MoneyUtils.zero();
        BigDecimal totalAplicado = MoneyUtils.zero();
        BigDecimal totalPendienteAplicar = MoneyUtils.zero();
        for (EncabezadoCuota e : cuotaRepository.findEncabezadosByFecha(fecha)) {
            if (aplicada != null && aplicada != e.isAplicada()) {
                continue;
            }
            if (idCliente != null && !idCliente.equals(e.getIdClienteCuota())) {
                continue;
            }
            Cliente c = clientes.get(e.getIdClienteCuota());
            String nombre = c == null ? warnFk("Cliente", e.getIdClienteCuota()) : c.getNombreCompleto();
            filas.add(new Object[]{
                    e.getIdCuota(), e.getFechaCuota(), e.getIdClienteCuota(), nombre,
                    MoneyUtils.normalize(e.getValorCobro()),
                    e.isAplicada() ? "Aplicada" : "Pendiente"
            });
            totalRecibido = MoneyUtils.add(totalRecibido, e.getValorCobro());
            if (e.isAplicada()) {
                totalAplicado = MoneyUtils.add(totalAplicado, e.getValorCobro());
            } else {
                totalPendienteAplicar = MoneyUtils.add(totalPendienteAplicar, e.getValorCobro());
            }
        }
        String resumen = "Cuotas: " + filas.size()
                + " | Total recibido: " + MoneyUtils.format(totalRecibido)
                + " | Total aplicado: " + MoneyUtils.format(totalAplicado)
                + " | Pendiente de aplicar: " + MoneyUtils.format(totalPendienteAplicar);
        return new ConsultaResultado(cols, filas, resumen);
    }

    public ConsultaResultado consultarDetallesCuota(String idCuota) {
        String[] cols = {"Secuencia", "ID cobro", "Concepto", "Valor aplicado"};
        if (idCuota == null || idCuota.isBlank()) {
            return ConsultaResultado.vacio(cols, "Seleccione una cuota.");
        }
        List<Object[]> filas = new ArrayList<>();
        BigDecimal total = MoneyUtils.zero();
        for (DetalleCuota d : cuotaRepository.findDetallesByCuota(idCuota.trim())) {
            filas.add(new Object[]{
                    d.getSecuenciaCuota(), d.getIdCobroCuota(), d.getConceptoCuota(),
                    MoneyUtils.normalize(d.getValorCuota())
            });
            total = MoneyUtils.add(total, d.getValorCuota());
        }
        return new ConsultaResultado(cols, filas,
                "Detalles de " + idCuota + ": " + filas.size()
                        + " | Total aplicado en detalle: " + MoneyUtils.format(total));
    }

    // ---------- Cuotas por cliente ----------

    public ConsultaResultado consultarCuotasPorCliente(Integer idCliente, LocalDate desde,
                                                      LocalDate hasta, Boolean aplicada) {
        if (idCliente == null) {
            throw new ValidationException("Cliente", "seleccione un cliente.");
        }
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new ValidationException("Fecha inicial", "no puede ser posterior a la fecha final.");
        }
        Cliente cliente = clienteRepository.findById(idCliente)
                .orElseThrow(() -> new ValidationException("Cliente", "no existe."));
        String[] cols = {"ID cuota", "Fecha", "Valor recibido", "Estado"};
        List<Object[]> filas = new ArrayList<>();
        BigDecimal totalRec = MoneyUtils.zero();
        BigDecimal totalApl = MoneyUtils.zero();
        int pend = 0;
        int apl = 0;
        for (EncabezadoCuota e : cuotaRepository.findEncabezadosByCliente(idCliente)) {
            if (desde != null && (e.getFechaCuota() == null || e.getFechaCuota().isBefore(desde))) {
                continue;
            }
            if (hasta != null && (e.getFechaCuota() == null || e.getFechaCuota().isAfter(hasta))) {
                continue;
            }
            if (aplicada != null && aplicada != e.isAplicada()) {
                continue;
            }
            filas.add(new Object[]{
                    e.getIdCuota(), e.getFechaCuota(),
                    MoneyUtils.normalize(e.getValorCobro()),
                    e.isAplicada() ? "Aplicada" : "Pendiente"
            });
            totalRec = MoneyUtils.add(totalRec, e.getValorCobro());
            if (e.isAplicada()) {
                apl++;
                totalApl = MoneyUtils.add(totalApl, e.getValorCobro());
            } else {
                pend++;
            }
        }
        String resumen = "Balance actual: " + MoneyUtils.format(cliente.getBalanceCliente())
                + " | Total recibido: " + MoneyUtils.format(totalRec)
                + " | Total aplicado: " + MoneyUtils.format(totalApl)
                + " | Pendientes: " + pend + " | Aplicadas: " + apl;
        return new ConsultaResultado(cols, filas, resumen);
    }

    // ---------- Clientes ----------

    public ConsultaResultado consultarClientes(String id, String nombre, String apellido,
                                              Integer tipo, Boolean activo, String correo,
                                              LocalDate ingresoDesde, LocalDate ingresoHasta) {
        if (ingresoDesde != null && ingresoHasta != null && ingresoDesde.isAfter(ingresoHasta)) {
            throw new ValidationException("Fecha ingreso desde",
                    "no puede ser posterior a la fecha hasta.");
        }
        String[] cols = {"ID", "Nombre completo", "Dirección", "Fecha nacimiento", "Fecha ingreso",
                "Teléfono", "Celular", "Correo", "Tipo", "Estado", "Balance", "Valor cuota"};
        List<Object[]> filas = new ArrayList<>();
        int socios = 0;
        int invitados = 0;
        int activos = 0;
        int inactivos = 0;
        BigDecimal balanceTotal = MoneyUtils.zero();
        for (Cliente c : clienteRepository.findAll()) {
            if (!matchesId(c.getIdCliente(), id)) {
                continue;
            }
            if (!contains(c.getNombreCliente(), nombre)
                    && !contains(c.getNombreCompleto(), nombre)) {
                continue;
            }
            if (!contains(c.getApellidoPaternoCliente(), apellido)
                    && !contains(c.getApellidoMaternoCliente(), apellido)) {
                continue;
            }
            if (tipo != null && !Objects.equals(c.getTipoCliente(), tipo)) {
                continue;
            }
            if (activo != null && activo != c.isActivo()) {
                continue;
            }
            if (!contains(c.getCorreoCliente(), correo)) {
                continue;
            }
            if (ingresoDesde != null && (c.getFechaIngreso() == null || c.getFechaIngreso().isBefore(ingresoDesde))) {
                continue;
            }
            if (ingresoHasta != null && (c.getFechaIngreso() == null || c.getFechaIngreso().isAfter(ingresoHasta))) {
                continue;
            }
            filas.add(new Object[]{
                    c.getIdCliente(), c.getNombreCompleto(), c.getDireccionCliente(),
                    c.getFechaNacimientoCliente(), c.getFechaIngreso(),
                    c.getTelefonoCliente(), c.getCelularCliente(),
                    nullToEmpty(c.getCorreoCliente()),
                    c.getTipoDescripcion(), c.getStatusDescripcion(),
                    MoneyUtils.normalize(c.getBalanceCliente()),
                    MoneyUtils.normalize(c.getValorCuotaCliente())
            });
            if (c.isSocio()) {
                socios++;
            } else {
                invitados++;
            }
            if (c.isActivo()) {
                activos++;
            } else {
                inactivos++;
            }
            balanceTotal = MoneyUtils.add(balanceTotal, c.getBalanceCliente());
        }
        String resumen = "Total: " + filas.size()
                + " | Socios: " + socios + " | Invitados: " + invitados
                + " | Activos: " + activos + " | Inactivos: " + inactivos
                + " | Balance total: " + MoneyUtils.format(balanceTotal);
        return new ConsultaResultado(cols, filas, resumen);
    }

    // ---------- Clientes con balance ----------

    public ConsultaResultado consultarClientesConBalance(String id, String nombre,
                                                        BigDecimal balanceMinimo,
                                                        boolean soloActivos, Integer tipo) {
        String[] cols = {"ID", "Nombre completo", "Tipo", "Estado", "Balance",
                "Valor cuota", "Cobros pendientes"};
        List<Object[]> filas = new ArrayList<>();
        BigDecimal total = MoneyUtils.zero();
        BigDecimal mayor = MoneyUtils.zero();
        for (Cliente c : clienteRepository.findAll()) {
            BigDecimal bal = MoneyUtils.normalize(c.getBalanceCliente());
            if (bal.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            if (!matchesId(c.getIdCliente(), id)) {
                continue;
            }
            if (!contains(c.getNombreCompleto(), nombre)) {
                continue;
            }
            if (balanceMinimo != null && bal.compareTo(MoneyUtils.normalize(balanceMinimo)) < 0) {
                continue;
            }
            if (soloActivos && !c.isActivo()) {
                continue;
            }
            if (tipo != null && !Objects.equals(c.getTipoCliente(), tipo)) {
                continue;
            }
            int cobrosPend = cobroRepository.findPendientesByCliente(c.getIdCliente()).size();
            filas.add(new Object[]{
                    c.getIdCliente(), c.getNombreCompleto(), c.getTipoDescripcion(),
                    c.getStatusDescripcion(), bal,
                    MoneyUtils.normalize(c.getValorCuotaCliente()), cobrosPend
            });
            total = MoneyUtils.add(total, bal);
            if (bal.compareTo(mayor) > 0) {
                mayor = bal;
            }
        }
        filas.sort((a, b) -> ((BigDecimal) b[4]).compareTo((BigDecimal) a[4]));
        BigDecimal promedio = filas.isEmpty() ? MoneyUtils.zero()
                : total.divide(BigDecimal.valueOf(filas.size()), 2, RoundingMode.HALF_UP);
        String resumen = "Clientes con deuda: " + filas.size()
                + " | Balance total pendiente: " + MoneyUtils.format(total)
                + " | Promedio: " + MoneyUtils.format(promedio)
                + " | Mayor balance: " + MoneyUtils.format(mayor);
        return new ConsultaResultado(cols, filas, resumen);
    }

    public List<Cliente> listarClientesCombo() {
        return clienteRepository.findAll();
    }

    // ---------- helpers ----------

    private void asegurarAdmin() {
        if (!SessionContext.isAdministrador()) {
            throw new ValidationException("Acceso denegado. Solo el administrador puede consultar usuarios.");
        }
    }

    private static boolean contains(String value, String filter) {
        if (filter == null || filter.isBlank()) {
            return true;
        }
        if (value == null) {
            return false;
        }
        return value.toLowerCase(Locale.ROOT).contains(filter.trim().toLowerCase(Locale.ROOT));
    }

    private static boolean matchesId(Number id, String filter) {
        if (filter == null || filter.isBlank()) {
            return true;
        }
        if (id == null) {
            return false;
        }
        return String.valueOf(id).equals(filter.trim())
                || String.valueOf(id).contains(filter.trim());
    }

    private static String nullToEmpty(String v) {
        return v == null ? "" : v;
    }

    private <T> Map<Integer, T> index(List<T> list, Function<T, Integer> keyFn) {
        return list.stream().filter(Objects::nonNull)
                .collect(Collectors.toMap(keyFn, Function.identity(), (a, b) -> a));
    }

    private String resolveLocalizacion(Map<Integer, Localizacion> map, Integer id) {
        Localizacion l = map.get(id);
        if (l == null) {
            return warnFk("Localización", id);
        }
        return l.getIdLocalizacion() + " - " + l.getTipo();
    }

    private String resolveEntrenador(Map<Integer, Entrenador> map, Integer id) {
        Entrenador e = map.get(id);
        if (e == null) {
            return warnFk("Entrenador", id);
        }
        return e.getIdEntrenador() + " - " + e.getNombreCompleto().trim();
    }

    private String resolveActividad(Map<Integer, Actividad> map, Integer id) {
        Actividad a = map.get(id);
        if (a == null) {
            return warnFk("Actividad", id);
        }
        return a.getIdActividad() + " - " + a.getNombreActividad();
    }

    private String warnFk(String entidad, Object id) {
        LOGGER.log(Level.WARNING, "FK faltante: {0} id={1}", new Object[]{entidad, id});
        return NO_ENCONTRADO + " (" + id + ")";
    }

    private String extraerPeriodo(String concepto) {
        if (concepto == null) {
            return "";
        }
        // "Cuota mensual MM-AAAA"
        int idx = concepto.lastIndexOf(' ');
        if (idx >= 0 && idx < concepto.length() - 1) {
            return concepto.substring(idx + 1).trim();
        }
        return "";
    }

    private boolean periodoCoincide(String periodo, Integer mes, Integer anio) {
        if (periodo == null || periodo.isBlank()) {
            return false;
        }
        String[] p = periodo.split("-");
        if (p.length != 2) {
            return false;
        }
        try {
            int m = Integer.parseInt(p[0]);
            int a = Integer.parseInt(p[1]);
            if (mes != null && mes != m) {
                return false;
            }
            if (anio != null && anio != a) {
                return false;
            }
            return true;
        } catch (NumberFormatException ex) {
            return false;
        }
    }
}
