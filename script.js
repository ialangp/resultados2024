document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.nav-btn');
  const reports = document.querySelectorAll('.flourish-report');
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

  // Cambio entre reportes mediante alternancia de clases CSS
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      // 1. Marcar botón activo en el menú
      buttons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // 2. Actualizar el título superior
      const newTitle = button.getAttribute('data-title');
      if (newTitle && currentTitle) {
        currentTitle.textContent = newTitle;
      }

      // 3. Ocultar todos los iframes y mostrar solo el seleccionado
      const targetId = button.getAttribute('data-target');
      reports.forEach(iframe => {
        if (iframe.id === targetId) {
          iframe.classList.add('active');
        } else {
          iframe.classList.remove('active');
        }
      });

      // 4. Cerrar menú en dispositivos móviles al seleccionar
      if (window.innerWidth <= 850 && sidebar && sidebar.classList.contains('open')) {
        toggleSidebar();
      }
    });
  });
});
