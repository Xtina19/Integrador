# Guía oficial — LibroSys

**Esta carpeta es la documentación oficial del proyecto.**  
Cualquier desarrollador que trabaje en LibroSys debe partir de aquí.

Documentación técnica detallada por módulo, arquitectura, reglas, decisiones (ADR) y flujos.  
Se mantiene **sincronizada con el código** en `Modulos/`, `Compartido/`, `Frontend/`, `backend/` y `database/sqlserver/`.

---

## Qué es LibroSys

ERP para librería (contexto Joselito): punto de venta, facturación, postventa, compras, editoriales e inventario con un único dueño de stock.

---

## Arquitectura del repositorio (referencia rápida)

```
Proyecto/
├── guia/                 ← Documentación oficial (esta carpeta)
├── Modulos/              ← Código de negocio por dominio
├── Compartido/           ← UI/utils usados por 2+ módulos
├── Infraestructura/      ← Mapa del shell de ejecución
├── Frontend/             ← Shell Vite/React (+ junctions a Modulos)
├── backend/              ← Shell Express (+ junctions DDD / Express clásico)
└── database/sqlserver/   ← Instalador oficial SQL Server
```

Plantilla de cada módulo de negocio:

```
Modulos/<Nombre>/
  README.md
  Frontend/
  Backend/     # código DDD/Express O README con ubicación runtime
  Database/    # scripts o nota hacia database/sqlserver/
```

---

## Índice general

### Fundamentos

| # | Documento | Contenido |
|---|-----------|-----------|
| 1 | [Visión del proyecto](./01_vision_del_proyecto.md) | Propósito y alcance |
| 2 | [Arquitectura general](./02_arquitectura_general.md) | Capas, shells, conexiones |
| 3 | [Reglas de negocio](./03_reglas_de_negocio.md) | Reglas transversales |
| 4 | [Base de datos](./04_base_de_datos.md) | Esquema e instalador |
| — | [Convenciones de documentación](./CONVENCIONES.md) | Cómo mantener esta guía al día |

### Módulos (documentación técnica completa)

| Módulo | Estado | Documentación |
|--------|--------|---------------|
| **Inventario** | Operativo (DDD) | [modulos/Inventario](./modulos/Inventario/README.md) |
| **Compras** | Operativo (Express + FE) | [modulos/Compras](./modulos/Compras/README.md) |
| **Ventas** | Operativo (DDD) | [modulos/Ventas](./modulos/Ventas/README.md) |
| **Editoriales** | Operativo (Express + FE) | [modulos/Editoriales](./modulos/Editoriales/README.md) |

> Otros módulos (`Admin`, `Usuarios`, `Configuracion`, `Eventos`, `Importaciones`, `Reportes`, `Auditoria`, `Dashboard`, `Ayuda`) existen en `Modulos/` y se documentarán en esta guía en siguientes iteraciones.

### Decisiones, flujos y glosario

| Sección | Enlace |
|---------|--------|
| Decisiones (ADR) | [06_decisiones](./06_decisiones/README.md) |
| Flujos (Mermaid) | [07_flujos](./07_flujos/README.md) |
| Glosario | [08_glosario.md](./08_glosario.md) |

### Índice legado (redirecciones)

Los archivos en [`05_modulos/`](./05_modulos/README.md) redirigen a `modulos/<Nombre>/` para no romper enlaces antiguos.

---

## Arranque rápido

```bash
# Backend
cd backend
copy .env.example .env
npm install
npm start          # http://localhost:3001

# Frontend
cd Frontend
copy .env.example .env
npm install
npm run dev        # http://localhost:5173
```

Variables FE habituales: `VITE_API_URL`, `VITE_USE_API_INVENTARIO`, `VITE_USE_API_VENTAS`, `VITE_USE_API_COMPRAS`.

Instalador BD: `database/sqlserver/install.sql` (orden `01`…`12`). Ver [04 Base de datos](./04_base_de_datos.md).

---

## Política de mantenimiento (obligatoria)

1. **`guia/` es la fuente de verdad documental.** No inventar arquitectura distinta a la del código.
2. **Tras cada cambio importante en un módulo**, actualizar `guia/modulos/<Modulo>/`.
3. No eliminar esta carpeta.
4. Preferir enlaces a rutas reales (`Modulos/...`, `database/sqlserver/...`) sobre descripciones obsoletas.

Detalle: [CONVENCIONES.md](./CONVENCIONES.md).
