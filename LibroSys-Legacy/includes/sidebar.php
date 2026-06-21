<?php
/** @var string $currentModule */
$currentModule = $currentModule ?? '';
$isAdmin = str_starts_with($currentModule, 'admin');
?>
<aside class="sidebar" id="sidebar">
  <div class="sidebar-brand">
    <div class="sidebar-logo"><i class="bi bi-book"></i></div>
    <div class="sidebar-brand-text">
      <div class="fw-bold sidebar-text" style="font-size:0.85rem">LibroSys</div>
      <div class="sidebar-text" style="font-size:0.65rem; opacity:0.6">Librería Joselito</div>
      <span class="version-badge sidebar-text">Legacy</span>
    </div>
  </div>

  <nav class="sidebar-nav">
    <a href="<?= url('modules/dashboard.php') ?>" class="nav-link <?= $currentModule === 'dashboard' ? 'active' : '' ?>">
      <i class="bi bi-grid-1x2"></i><span class="sidebar-text">Dashboard</span>
    </a>
    <a href="<?= url('modules/inventario.php') ?>" class="nav-link <?= $currentModule === 'inventario' ? 'active' : '' ?>">
      <i class="bi bi-box-seam"></i><span class="sidebar-text">Inventario</span>
    </a>
    <a href="<?= url('modules/transferencias.php') ?>" class="nav-link <?= $currentModule === 'transferencias' ? 'active' : '' ?>">
      <i class="bi bi-arrow-left-right"></i><span class="sidebar-text">Transferencias</span>
    </a>
    <a href="<?= url('modules/editoriales.php') ?>" class="nav-link <?= $currentModule === 'editoriales' ? 'active' : '' ?>">
      <i class="bi bi-building"></i><span class="sidebar-text">Editoriales</span>
    </a>
    <a href="<?= url('modules/eventos.php') ?>" class="nav-link <?= $currentModule === 'eventos' ? 'active' : '' ?>">
      <i class="bi bi-calendar-event"></i><span class="sidebar-text">Eventos y Ferias</span>
    </a>
    <a href="<?= url('modules/usuarios.php') ?>" class="nav-link <?= $currentModule === 'usuarios' ? 'active' : '' ?>">
      <i class="bi bi-people"></i><span class="sidebar-text">Usuarios</span>
    </a>

    <div class="mt-2 pt-2 border-top border-white border-opacity-10">
      <button class="admin-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#adminMenu">
        <span><i class="bi bi-gear me-2"></i><span class="sidebar-text">Administración</span></span>
        <i class="bi bi-chevron-down sidebar-text" style="font-size:0.75rem"></i>
      </button>
      <div class="collapse <?= $isAdmin ? 'show' : '' ?> admin-submenu" id="adminMenu">
        <a href="<?= url('modules/admin/index.php') ?>" class="nav-link <?= $currentModule === 'admin' ? 'active' : '' ?>">
          <i class="bi bi-dot"></i><span class="sidebar-text">General</span>
        </a>
        <a href="<?= url('modules/admin/productos.php') ?>" class="nav-link <?= $currentModule === 'admin-productos' ? 'active' : '' ?>">
          <i class="bi bi-book"></i><span class="sidebar-text">Productos</span>
        </a>
        <a href="<?= url('modules/admin/categorias.php') ?>" class="nav-link <?= $currentModule === 'admin-categorias' ? 'active' : '' ?>">
          <i class="bi bi-tag"></i><span class="sidebar-text">Categorías</span>
        </a>
        <a href="<?= url('modules/admin/editoriales.php') ?>" class="nav-link <?= $currentModule === 'admin-editoriales' ? 'active' : '' ?>">
          <i class="bi bi-building"></i><span class="sidebar-text">Editoriales</span>
        </a>
        <a href="<?= url('modules/admin/sucursales.php') ?>" class="nav-link <?= $currentModule === 'admin-sucursales' ? 'active' : '' ?>">
          <i class="bi bi-shop"></i><span class="sidebar-text">Sucursales</span>
        </a>
        <a href="<?= url('modules/admin/proveedores.php') ?>" class="nav-link <?= $currentModule === 'admin-proveedores' ? 'active' : '' ?>">
          <i class="bi bi-truck"></i><span class="sidebar-text">Proveedores</span>
        </a>
        <a href="<?= url('modules/admin/monedas.php') ?>" class="nav-link <?= $currentModule === 'admin-monedas' ? 'active' : '' ?>">
          <i class="bi bi-currency-exchange"></i><span class="sidebar-text">Monedas</span>
        </a>
        <a href="<?= url('modules/admin/tasas-cambio.php') ?>" class="nav-link <?= $currentModule === 'admin-tasas' ? 'active' : '' ?>">
          <i class="bi bi-graph-up"></i><span class="sidebar-text">Tasas de Cambio</span>
        </a>
      </div>
    </div>
  </nav>

  <div class="p-3 border-top border-white border-opacity-10">
    <button class="btn btn-sm btn-outline-light w-100 sidebar-text" id="toggleSidebar">
      <i class="bi bi-chevron-left"></i> Colapsar
    </button>
  </div>
</aside>

<div class="main-wrapper" id="mainWrapper">
  <header class="top-header">
    <div>
      <h1 class="h5 mb-0 fw-semibold text-corporate"><?= e($pageTitle ?? 'LibroSys') ?></h1>
      <?php if (!empty($pageSubtitle)): ?>
        <small class="text-muted"><?= e($pageSubtitle) ?></small>
      <?php endif; ?>
    </div>
    <div class="d-flex align-items-center gap-3">
      <span class="badge bg-warning text-dark">Versión Legacy</span>
      <div class="d-flex align-items-center gap-2">
        <div class="rounded-circle bg-corporate text-white d-flex align-items-center justify-content-center" style="width:36px;height:36px;font-size:0.8rem">MG</div>
        <span class="text-muted d-none d-md-inline" style="font-size:0.85rem">María González</span>
      </div>
    </div>
  </header>
  <main class="main-content">
    <?php flashMessage(); ?>
