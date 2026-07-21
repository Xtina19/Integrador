package service;

import config.AppConfig;
import model.Cliente;
import model.Cobro;
import model.Reserva;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import repository.CobroRepository;
import repository.ReservaRepository;
import util.MoneyUtils;
import validation.ValidationException;

import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClienteServiceTest {

    @TempDir
    Path tempDir;

    private ClienteService service;

    @BeforeEach
    void setUp() {
        AppConfig.setBaseDir(tempDir);
        service = new ClienteService();
    }

    @AfterEach
    void tearDown() {
        AppConfig.setBaseDir(null);
    }

    private Cliente socioBase(int id) {
        Cliente c = new Cliente();
        c.setIdCliente(id);
        c.setNombreCliente("Luis");
        c.setApellidoPaternoCliente("Perez");
        c.setApellidoMaternoCliente("Gomez");
        c.setDireccionCliente("Calle 1");
        c.setFechaNacimientoCliente(LocalDate.of(1990, 1, 1));
        c.setTelefonoCliente("8095551000");
        c.setCelularCliente("8295551000");
        c.setTipoCliente(Cliente.TIPO_SOCIO);
        c.setStatusCliente(true);
        c.setValorCuotaCliente(MoneyUtils.of(1500));
        return c;
    }

    @Test
    void crearSocioActivo() {
        Cliente guardado = service.guardar(socioBase(1), true);
        assertTrue(guardado.isSocio());
        assertTrue(guardado.isActivo());
        assertEquals(0, guardado.getBalanceCliente().compareTo(MoneyUtils.zero()));
        assertEquals(LocalDate.now(), guardado.getFechaIngreso());
        assertEquals(2, guardado.getValorCuotaCliente().scale());
    }

    @Test
    void crearInvitadoForzadoInactivo() {
        Cliente c = socioBase(2);
        c.setTipoCliente(Cliente.TIPO_INVITADO);
        c.setStatusCliente(true);
        c.setValorCuotaCliente(MoneyUtils.of(100));
        Cliente guardado = service.guardar(c, true);
        assertFalse(guardado.isActivo());
        assertEquals(0, guardado.getValorCuotaCliente().compareTo(MoneyUtils.zero()));
    }

    @Test
    void rechazarSocioSinCuota() {
        Cliente c = socioBase(3);
        c.setValorCuotaCliente(MoneyUtils.zero());
        assertThrows(ValidationException.class, () -> service.guardar(c, true));
    }

    @Test
    void rechazarFechaNacimientoFutura() {
        assertThrows(ValidationException.class,
                () -> service.parseFechaNacimiento("01/01/2999"));
    }

    @Test
    void mantenerFechaIngresoAlModificar() {
        Cliente c = service.guardar(socioBase(4), true);
        LocalDate original = c.getFechaIngreso();
        c.setNombreCliente("Luisito");
        c.setFechaIngreso(LocalDate.of(2000, 1, 1)); // intento de cambio
        Cliente mod = service.guardar(c, false);
        assertEquals(original, mod.getFechaIngreso());
        assertEquals("Luisito", mod.getNombreCliente());
    }

    @Test
    void rechazarEliminacionConBalance() {
        Cliente c = service.guardar(socioBase(5), true);
        c.setBalanceCliente(MoneyUtils.of(100));
        // actualizar balance vía repositorio (no editable en UI)
        new repository.ClienteRepository().update(c);
        assertThrows(ValidationException.class, () -> service.eliminar(5));
    }

    @Test
    void rechazarEliminacionConRelaciones() {
        service.guardar(socioBase(6), true);
        new ReservaRepository().insert(new Reserva("R1", 1, 6, LocalDate.now(), "H1", "ACT"));
        assertThrows(ValidationException.class, () -> service.eliminar(6));

        Cliente c7 = service.guardar(socioBase(7), true);
        Cobro cobro = new Cobro();
        cobro.setIdCobro("C1");
        cobro.setFechaCobro(LocalDate.now());
        cobro.setIdClienteCobro(7);
        cobro.setValorCobro(MoneyUtils.of(100));
        cobro.setConceptoCobro("Prueba");
        cobro.setStatusCobro(false);
        new CobroRepository().insert(cobro);
        assertThrows(ValidationException.class, () -> service.eliminar(c7.getIdCliente()));
    }

    @Test
    void validarMontosYBalanceNoNegativo() {
        Cliente c = socioBase(8);
        c.setValorCuotaCliente(new BigDecimal("1500.5"));
        Cliente g = service.guardar(c, true);
        assertEquals(2, g.getValorCuotaCliente().scale());

        Cliente neg = socioBase(9);
        neg.setBalanceCliente(MoneyUtils.of(-10));
        // al crear se fuerza balance 0; validar método directo
        neg.setBalanceCliente(MoneyUtils.of(-1));
        neg.setFechaIngreso(LocalDate.now());
        assertThrows(ValidationException.class, () -> service.validar(neg));
    }
}
