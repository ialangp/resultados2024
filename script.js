document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.nav-btn');
  const container = document.getElementById('flourish-container');
  const currentTitle = document.getElementById('current-title');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('toggle-sidebar');
  const closeBtn = document.getElementById('close-sidebar');

  // Control de apertura/cierre de la barra lateral en móviles
  function toggleSidebar() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  }

  toggleBtn.addEventListener('click', toggleSidebar);
  closeBtn.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', toggleSidebar);

  // Cambio dinámico de reportes
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      // 1. Manejo de estado de los botones
      buttons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // 2. Actualizar título superior
      const newTitle = button.getAttribute('data-title');
      if (newTitle) currentTitle.textContent = newTitle;

      // 3. Reemplazar contenedor e inyectar el nuevo ID de Flourish
      const id = button.getAttribute('data-id');
      container.innerHTML = `<div class="flourish-embed flourish-chart" data-src="visualisation/${id}"></div>`;

      // 4. Forzar el renderizado oficial de Flourish
      if (window.Flourish && typeof window.Flourish.init === 'function') {
        window.Flourish.init();
      }

      // 5. Cerrar menú en móvil tras seleccionar
      if (window.innerWidth <= 850) {
        toggleSidebar();
      }
    });
  });
});
