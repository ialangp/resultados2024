document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.nav-btn');
  const reports = document.querySelectorAll('.report-container');
  const currentTitle = document.getElementById('current-title');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('toggle-sidebar');
  const closeBtn = document.getElementById('close-sidebar');

  // Control de apertura/cierre de la barra lateral en móviles
  function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
  if (closeBtn) closeBtn.addEventListener('click', toggleSidebar);
  if (overlay) overlay.addEventListener('click', toggleSidebar);

  // Cambio de reporte
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      // 1. Botón activo en menú
      buttons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // 2. Cambiar título
      const newTitle = button.getAttribute('data-title');
      if (newTitle && currentTitle) {
        currentTitle.textContent = newTitle;
      }

      // 3. Alternar reporte visible
      const targetId = button.getAttribute('data-target');
      reports.forEach(container => {
        if (container.id === targetId) {
          container.classList.add('active');
        } else {
          container.classList.remove('active');
        }
      });

      // 4. Notificar al script de Flourish para que recalcule las dimensiones exactas
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);

      // 5. Cerrar menú en móvil
      if (window.innerWidth <= 850 && sidebar && sidebar.classList.contains('open')) {
        toggleSidebar();
      }
    });
  });
});
