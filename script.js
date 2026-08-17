document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.nav-btn');
  // Referencia directa al iframe, no al contenedor
  const flourishIframe = document.getElementById('flourish-iframe');
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

  // Evento al presionar cualquier botón del menú
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      // 1. Manejar la clase activa en la interfaz (CSS)
      buttons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // 2. Actualizar el título superior
      const newTitle = button.getAttribute('data-title');
      if (newTitle && currentTitle) {
        currentTitle.textContent = newTitle;
      }

      // 3. CAMBIO CLAVE: Actualizar el SRC del iframe
      // Esto fuerza al navegador a recargar Flourish completamente
      const chartId = button.getAttribute('data-id');
      if (flourishIframe) {
        flourishIframe.src = `https://public.flourish.studio/visualisation/${chartId}/embed`;
      }

      // 4. Cierre automático del menú en vistas móviles
      if (window.innerWidth <= 850 && sidebar && sidebar.classList.contains('open')) {
        toggleSidebar();
      }
    });
  });
});
