/**
 * LibroSys-Legacy — Chart.js
 */
document.addEventListener('DOMContentLoaded', function () {
  const corporate = '#1E2D86';
  const gold = '#F4D22E';

  // Inventario por sucursal (bar chart)
  const branchCtx = document.getElementById('chartBranches');
  if (branchCtx && window.chartBranchesData) {
    new Chart(branchCtx, {
      type: 'bar',
      data: {
        labels: window.chartBranchesData.labels,
        datasets: [{
          label: 'Unidades',
          data: window.chartBranchesData.values,
          backgroundColor: corporate,
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { display: false } } },
      },
    });
  }

  // Evolución inventario (area/line)
  const invCtx = document.getElementById('chartInventory');
  if (invCtx && window.chartInventoryData) {
    new Chart(invCtx, {
      type: 'line',
      data: {
        labels: window.chartInventoryData.labels,
        datasets: [
          { label: 'Almacén Central', data: window.chartInventoryData.central, borderColor: corporate, backgroundColor: 'rgba(30,45,134,0.1)', fill: true, tension: 0.3 },
          { label: 'Sucursales', data: window.chartInventoryData.sucursales, borderColor: gold, backgroundColor: 'rgba(244,210,46,0.15)', fill: true, tension: 0.3 },
        ],
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
    });
  }

  // Stock por categoría (doughnut)
  const catCtx = document.getElementById('chartCategories');
  if (catCtx && window.chartCategoriesData) {
    new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: window.chartCategoriesData.labels,
        datasets: [{ data: window.chartCategoriesData.values, backgroundColor: window.chartCategoriesData.colors }],
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
    });
  }

  // Ventas mensuales
  const salesCtx = document.getElementById('chartSales');
  if (salesCtx && window.chartSalesData) {
    new Chart(salesCtx, {
      type: 'bar',
      data: {
        labels: window.chartSalesData.labels,
        datasets: [{ label: 'Ventas (RD$)', data: window.chartSalesData.values, backgroundColor: gold, borderColor: corporate, borderWidth: 1 }],
      },
      options: { responsive: true, plugins: { legend: { display: false } } },
    });
  }
});
