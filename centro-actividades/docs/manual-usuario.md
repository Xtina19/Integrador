# Manual de usuario

## Requisitos

- Windows 10/11
- JDK 17+ (o usar `.tools/jdk-17` con `scripts/build.ps1`)
- Maven 3.9+ (o `.tools/apache-maven-3.9.6`)

## Instalación / ubicación

Proyecto de entrega:

```text
C:\Users\<USUARIO>\Documents\CentroActividades
```

En esta máquina, la carpeta Documentos real se obtiene con:

```powershell
[Environment]::GetFolderPath('MyDocuments')
```

## Compilar y ejecutar

Desde la carpeta del proyecto:

```powershell
.\scripts\build.ps1 test
.\scripts\build.ps1 package
.\scripts\build.ps1 exec:java "-Dexec.mainClass=app.Main"
```

O con Maven del sistema:

```bash
mvn test
mvn package
java -jar target/centro-actividades-1.0.0.jar
```

## Acceso

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| usuario | usuario123 | Usuario normal |

## Menús

1. **Mantenimientos** — CRUD de catálogos, clientes y reservas.
2. **Movimientos → Cuotas** — registrar pagos.
3. **Procesos** — generar/reversar cobro (admin), actualizar cuota.
4. **Consultas** — reportes de solo lectura con filtros y exportación CSV.
5. **Sesión** — cerrar sesión o salir.

## Flujo típico de facturación

1. Admin: **Procesos → Generar cobro** (mes/año).
2. Usuario: **Movimientos → Cuotas** (registrar pago).
3. Usuario/Admin: **Procesos → Actualizar cuota** (aplicar a cobros).
4. Consultar resultados en **Consultas → Cobros / Cuotas / Clientes con balance**.

## Exportar CSV

En cualquier consulta: **Exportar CSV**. Se exportan las filas visibles (tras filtros y orden). En cuotas también hay exportación de detalles y combinada.

## Datos

- Entrada/salida de negocio: carpeta `data/`
- PDFs: `output/volantes/`
- No editar los TXT a mano salvo respaldo previo.
