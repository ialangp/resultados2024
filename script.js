document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.nav-btn');
  const container = document.getElementById('flourish-container');
  const currentTitle = document.getElementById('current-title');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('toggle-sidebar');
  const closeBtn = document.getElementById('close-sidebar');

  // Abrir / Cerrar barra lateral en móviles
  function toggleSidebar() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
  if (closeBtn) closeBtn.addEventListener('click', toggleSidebar);
  if (overlay) overlay.addEventListener('click', toggleSidebar);

  // Función para cargar visualización de Flourish
  function loadFlourishVisualization(id) {
    // 1. Limpiar completamente el contenedor
    container.innerHTML = '';

    // 2. Crear el nuevo elemento embed
    const embedDiv = document.createElement('div');
    embedDiv.className = 'flourish-embed flourish-chart';
    embedDiv.setAttribute('data-src', `visualisation/${id}`);

    // 3. Insertar el elemento en el DOM
    container.appendChild(embedDiv);

    // 4. Cargar o reinicializar el script de Flourish
    if (window.Flourish && typeof window.Flourish.init === 'function') {
      window.Flourish.init();
    } else {
      // Si la librería no se ha cargado o requiere refrescarse
      const oldScript = document.getElementById('flourish-embed-script');
      if (oldScript) oldScript.remove();

      const newScript = document.createElement('script');
      newScript.id = 'flourish-embed-script';
      newScript.src = 'https://public.flourish.studio/resources/embed.js';
      document.body.appendChild(newScript);
    }
  }

  // Evento al hacer clic en los botones del menú
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      // Desactivar botones previos y activar el actual
      buttons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Actualizar título de la barra superior
      const newTitle = button.getAttribute('data-title');
      if (newTitle && currentTitle) {
        currentTitle.textContent = newTitle;
      }

      // Cargar la visualización correspondiente
      const id = button.getAttribute('data-id');
      loadFlourishVisualization(id);

      // Cerrar sidebar si se está en dispositivo móvil
      if (window.innerWidth <= 850 && sidebar.classList.contains('open')) {
        toggleSidebar();
      }
    });
  });
});
