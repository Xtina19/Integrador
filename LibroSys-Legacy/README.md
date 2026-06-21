# LibroSys-Legacy

Versión experimental de **LibroSys** para **Librería Joselito**, desarrollada con arquitectura tradicional LAMP para comparación académica con la versión principal.

---

## Versiones del Proyecto

| Versión | Tecnologías | Ubicación | Estado |
|---------|-------------|-----------|--------|
| **Principal** | React, TypeScript, Vite, Tailwind | `/` (raíz del repositorio) | Producción / Desarrollo activo |
| **Legacy (experimental)** | HTML5, CSS3, JavaScript, Bootstrap 5, PHP, MySQL | `/LibroSys-Legacy` | Rama de prueba |

---

## Objetivo

Comparar ambas arquitecturas antes de decidir cuál será utilizada en la entrega final del Proyecto Integrador:

- **SPA moderna** (React + TypeScript) vs **aplicación web tradicional** (PHP + Bootstrap)
- Misma identidad visual y mismos módulos base
- Evaluación de mantenibilidad, rendimiento y complejidad de despliegue

---

## Tecnologías Legacy

### Frontend
- HTML5 semántico
- CSS3 personalizado (`assets/css/custom.css`)
- Bootstrap 5.3 (layout, sidebar, cards, tablas, modales, formularios)
- JavaScript Vanilla (navegación, filtros, validaciones)
- Chart.js 4.4 (gráficos del Dashboard)
- JsBarcode (códigos de barras en inventario)

### Backend
- PHP 8+ modular
- Sesiones PHP para mensajes flash

### Base de Datos
- MySQL (esquema en `database/schema.sql`)
- Modo mock activo por defecto (`config/app.php` → `DATA_MODE = 'mock'`)

### Entorno
- XAMPP (Apache + PHP + MySQL)

---

## Estructura del Proyecto

```
LibroSys-Legacy/
├── config/           # Configuración app y base de datos
├── database/         # Esquema SQL MySQL
├── includes/         # Header, sidebar, footer, helpers CRUD
├── models/           # MockData.php (datos simulados)
├── modules/          # Pantallas por módulo
│   ├── dashboard.php
│   ├── inventario.php
│   ├── transferencias.php
│   ├── editoriales.php
│   ├── eventos.php
│   ├── usuarios.php
│   └── admin/        # Catálogos maestros
├── assets/
│   ├── css/custom.css
│   └── js/app.js, charts.js
├── index.php
└── README.md
```

---

## Módulos Incluidos

### Menú Principal
- Dashboard (KPIs + Chart.js)
- Inventario (CRUD + código de barras)
- Transferencias (CRUD)
- Editoriales (CRUD + alertas de contratos)
- Eventos y Ferias (CRUD)
- Usuarios y Permisos (CRUD roles)

### Administración
- Productos, Categorías, Editoriales, Sucursales, Proveedores, Monedas, Tasas de Cambio

Cada módulo soporta: **Listar · Crear · Editar · Ver · Eliminar** (datos simulados).

---

## Colores Corporativos

| Color | Hex | Uso |
|-------|-----|-----|
| Azul institucional | `#1E2D86` | Sidebar, títulos, botones |
| Amarillo corporativo | `#F4D22E` | Acentos, ítem activo |
| Blanco | `#FFFFFF` | Cards, header |
| Gris claro | `#F5F5F5` | Fondo general |

---

## Instalación con XAMPP

1. Copiar la carpeta `LibroSys-Legacy` a `C:\xampp\htdocs\` (o crear enlace simbólico).

2. Iniciar **Apache** en el panel de XAMPP.

3. Abrir en el navegador:
   ```
   http://localhost/LibroSys-Legacy/
   ```

4. **(Opcional)** Activar MySQL:
   - Iniciar MySQL en XAMPP
   - Importar `database/schema.sql` en phpMyAdmin
   - Cambiar en `config/app.php`: `define('DATA_MODE', 'mysql');`

---

## Notas Importantes

- Esta versión **NO modifica** el proyecto React principal.
- Los formularios CRUD muestran mensajes de confirmación simulados (no persisten en disco).
- Para producción real se requerirían modelos PHP conectados a MySQL y autenticación de usuarios.

---

## Autor

Proyecto Integrador — Librería Joselito  
Universidad · LibroSys © 2026
