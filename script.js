document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.nav-btn');
  const reports = document.querySelectorAll('.flourish-report');
  const currentTitle = document.getElementById('current-title');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('toggle-sidebar');
  const closeBtn = document.getElementById('close-sidebar');

  function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
  if (closeBtn) closeBtn.addEventListener('click', toggleSidebar);
  if (overlay) overlay.addEventListener('click', toggleSidebar);

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      // 1. Activar botón en el menú
      buttons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // 2. Actualizar el título
      const newTitle = button.getAttribute('data-title');
      if (newTitle && currentTitle) {
        currentTitle.textContent = newTitle;
      }

      // 3. Alternar visibilidad de los reportes
      const targetId = button.getAttribute('data-target');
      reports.forEach(iframe => {
        if (iframe.id === targetId) {
          iframe.classList.add('active');
          
          // FORZAR RESIZE: Notifica al iframe para recalculación de altura
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 50);
          
        } else {
          iframe.classList.remove('active');
        }
      });

      // 4. Cerrar menú en móviles
      if (window.innerWidth <= 850 && sidebar && sidebar.classList.contains('open')) {
        toggleSidebar();
      }
    });
  });
});
