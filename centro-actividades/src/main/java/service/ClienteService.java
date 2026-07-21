package service;

import model.Cliente;
import repository.ClienteRepository;
import repository.CobroRepository;
import repository.CuotaRepository;
import repository.ReservaActividadRepository;
import repository.ReservaRepository;
import util.DateUtils;
import util.MoneyUtils;
import validation.ValidationException;
import validation.Validators;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final ReservaRepository reservaRepository;
    private final ReservaActividadRepository reservaActividadRepository;
    private final CobroRepository cobroRepository;
    private final CuotaRepository cuotaRepository;

    public ClienteService() {
        this(new ClienteRepository(), new ReservaRepository(), new ReservaActividadRepository(),
                new CobroRepository(), new CuotaRepository());
    }

    public ClienteService(ClienteRepository clienteRepository,
                          ReservaRepository reservaRepository,
                          ReservaActividadRepository reservaActividadRepository,
                          CobroRepository cobroRepository,
                          CuotaRepository cuotaRepository) {
        this.clienteRepository = clienteRepository;
        this.reservaRepository = reservaRepository;
        this.reservaActividadRepository = reservaActividadRepository;
        this.cobroRepository = cobroRepository;
        this.cuotaRepository = cuotaRepository;
    }

    public List<Cliente> listar() {
        return clienteRepository.findAll();
    }

    public Optional<Cliente> buscarPorId(Integer id) {
        return clienteRepository.findById(id);
    }

    public Optional<Cliente> buscarPorId(String idTexto) {
        if (idTexto == null || idTexto.isBlank()) {
            return Optional.empty();
        }
        return buscarPorId(Validators.requireInteger("ID Cliente", idTexto));
    }

    public Cliente guardar(Cliente cliente, boolean esNuevo) {
        if (cliente == null) {
            throw new ValidationException("Cliente", "los datos son obligatorios.");
        }

        Optional<Cliente> existente = buscarPorId(cliente.getIdCliente());
        if (esNuevo) {
            if (existente.isPresent()) {
                throw new ValidationException("ID Cliente",
                        "ya existe. No se permiten identificadores duplicados.");
            }
            cliente.setFechaIngreso(DateUtils.today());
            cliente.setBalanceCliente(MoneyUtils.zero());
        } else {
            if (existente.isEmpty()) {
                throw new ValidationException("ID Cliente",
                        "no existe para modificar. Use Nuevo o verifique el ID.");
            }
            // Conservar fecha de ingreso y balance actuales (no editables en UI).
            cliente.setFechaIngreso(existente.get().getFechaIngreso());
            cliente.setBalanceCliente(existente.get().getBalanceCliente());
        }

        aplicarReglasTipo(cliente);
        validar(cliente);

        if (esNuevo) {
            return clienteRepository.insert(cliente);
        }
        return clienteRepository.update(cliente);
    }

    public void eliminar(Integer id) {
        if (id == null) {
            throw new ValidationException("ID Cliente", "es obligatorio para eliminar.");
        }
        Cliente cliente = buscarPorId(id).orElseThrow(() ->
                new ValidationException("ID Cliente", "no existe. No hay nada que eliminar."));

        if (cliente.getBalanceCliente() != null
                && cliente.getBalanceCliente().compareTo(BigDecimal.ZERO) > 0) {
            throw new ValidationException("Balance",
                    "el cliente tiene balance pendiente (" + MoneyUtils.format(cliente.getBalanceCliente())
                            + "). Debe saldarlo antes de eliminar.");
        }
        if (reservaRepository.existsByCliente(id)) {
            throw new ValidationException("ID Cliente",
                    "no se puede eliminar porque tiene reservas asociadas.");
        }
        if (reservaActividadRepository.existsByCliente(id)) {
            throw new ValidationException("ID Cliente",
                    "no se puede eliminar porque tiene reservas de actividad asociadas.");
        }
        if (cobroRepository.existsByCliente(id)) {
            throw new ValidationException("ID Cliente",
                    "no se puede eliminar porque tiene cobros asociados.");
        }
        if (cuotaRepository.existsByCliente(id)) {
            throw new ValidationException("ID Cliente",
                    "no se puede eliminar porque tiene cuotas asociadas.");
        }
        clienteRepository.deleteById(String.valueOf(id));
    }

    public void validar(Cliente cliente) {
        if (cliente.getIdCliente() == null || cliente.getIdCliente() <= 0) {
            throw new ValidationException("ID Cliente", "debe ser un entero mayor que cero.");
        }
        cliente.setNombreCliente(Validators.requireText("Nombre", cliente.getNombreCliente()));
        cliente.setApellidoPaternoCliente(Validators.requireText("Apellido paterno", cliente.getApellidoPaternoCliente()));
        cliente.setApellidoMaternoCliente(Validators.requireText("Apellido materno", cliente.getApellidoMaternoCliente()));
        cliente.setDireccionCliente(Validators.requireText("Dirección", cliente.getDireccionCliente()));

        if (cliente.getFechaNacimientoCliente() == null) {
            throw new ValidationException("Fecha de nacimiento",
                    "es obligatoria. Use formato dd/MM/yyyy.");
        }
        if (cliente.getFechaNacimientoCliente().isAfter(DateUtils.today())) {
            throw new ValidationException("Fecha de nacimiento", "no puede ser una fecha futura.");
        }

        Validators.requirePhone("Teléfono", cliente.getTelefonoCliente());
        Validators.requirePhone("Celular", cliente.getCelularCliente());
        Validators.requireTipoCliente("Tipo", cliente.getTipoCliente());
        Validators.optionalEmail("Correo", cliente.getCorreoCliente());
        if (cliente.getCorreoCliente() != null && cliente.getCorreoCliente().isBlank()) {
            cliente.setCorreoCliente(null);
        }

        if (cliente.getFechaIngreso() == null) {
            throw new ValidationException("Fecha de ingreso", "es obligatoria.");
        }
        if (cliente.getStatusCliente() == null) {
            throw new ValidationException("Estado", "es obligatorio.");
        }

        cliente.setBalanceCliente(MoneyUtils.normalize(cliente.getBalanceCliente()));
        cliente.setValorCuotaCliente(MoneyUtils.normalize(cliente.getValorCuotaCliente()));

        if (MoneyUtils.isNegative(cliente.getBalanceCliente())) {
            throw new ValidationException("Balance", "no puede ser negativo.");
        }
        if (MoneyUtils.isNegative(cliente.getValorCuotaCliente())) {
            throw new ValidationException("Valor de cuota", "no puede ser negativo.");
        }

        if (cliente.isSocio()) {
            if (cliente.getValorCuotaCliente().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ValidationException("Valor de cuota",
                        "es obligatorio para socios y debe ser mayor que cero. Ejemplo: 1500.00");
            }
        } else {
            if (Boolean.TRUE.equals(cliente.getStatusCliente())) {
                throw new ValidationException("Estado",
                        "un invitado no puede estar activo. Debe quedar inactivo.");
            }
            if (cliente.getValorCuotaCliente().compareTo(BigDecimal.ZERO) != 0) {
                throw new ValidationException("Valor de cuota",
                        "para invitados debe ser 0.00.");
            }
        }
    }

    /**
     * Ajusta status y cuota según el tipo seleccionado.
     */
    public void aplicarReglasTipo(Cliente cliente) {
        if (cliente.getTipoCliente() != null && cliente.getTipoCliente() == Cliente.TIPO_INVITADO) {
            cliente.setStatusCliente(false);
            cliente.setValorCuotaCliente(MoneyUtils.zero());
        }
        if (cliente.getBalanceCliente() == null) {
            cliente.setBalanceCliente(MoneyUtils.zero());
        }
        if (cliente.getValorCuotaCliente() == null) {
            cliente.setValorCuotaCliente(MoneyUtils.zero());
        }
    }

    public LocalDate parseFechaNacimiento(String valor) {
        return Validators.requireFechaNacimiento("Fecha de nacimiento", valor);
    }
}
