/**
 * LibroSys-Legacy — JavaScript principal (Vanilla JS)
 */
document.addEventListener('DOMContentLoaded', function () {
  // Toggle sidebar
  const toggleBtn = document.getElementById('toggleSidebar');
  const sidebar = document.getElementById('sidebar');
  const mainWrapper = document.getElementById('mainWrapper');

  if (toggleBtn && sidebar && mainWrapper) {
    toggleBtn.addEventListener('click', function () {
      sidebar.classList.toggle('collapsed');
      mainWrapper.classList.toggle('expanded');
      const icon = toggleBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('bi-chevron-left');
        icon.classList.toggle('bi-chevron-right');
      }
    });
  }

  // Búsqueda en tablas
  document.querySelectorAll('.table-search').forEach(function (input) {
    input.addEventListener('input', function () {
      const term = this.value.toLowerCase();
      const table = this.closest('.card, .main-content, body')?.querySelector('.data-table');
      if (!table) return;
      table.querySelectorAll('tbody tr').forEach(function (row) {
        row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
      });
    });
  });

  // Validación de formularios Bootstrap
  document.querySelectorAll('.needs-validation').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  });

  // Confirmación de eliminación
  document.querySelectorAll('[data-confirm]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (!confirm(this.dataset.confirm || '¿Está seguro?')) {
        e.preventDefault();
      }
    });
  });

  // Filtros por select
  document.querySelectorAll('.filter-select').forEach(function (select) {
    select.addEventListener('change', function () {
      const filter = this.value;
      const target = document.querySelector(this.dataset.target);
      if (!target) return;
      target.querySelectorAll('tbody tr').forEach(function (row) {
        if (filter === 'all') {
          row.style.display = '';
        } else {
          row.style.display = row.dataset.status === filter ? '' : 'none';
        }
      });
    });
  });

  // Generar código de barras si existe contenedor
  if (typeof JsBarcode !== 'undefined') {
    document.querySelectorAll('.barcode').forEach(function (el) {
      JsBarcode(el, el.dataset.code || '9780000000000', {
        format: 'EAN13',
        width: 1.5,
        height: 50,
        displayValue: true,
        fontSize: 12,
        lineColor: '#1E2D86',
      });
    });
  }
});
