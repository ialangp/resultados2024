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
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
  if (closeBtn) closeBtn.addEventListener('click', toggleSidebar);
  if (overlay) overlay.addEventListener('click', toggleSidebar);

  // Función robusta para montar el embed de Flourish
  function renderFlourishChart(id) {
    // 1. Vaciar el contenedor por completo
    container.innerHTML = '';

    // 2. Crear un elemento wrapper nuevo y limpio
    const embedDiv = document.createElement('div');
    embedDiv.className = 'flourish-embed flourish-chart';
    embedDiv.setAttribute('data-src', `visualisation/${id}`);

    // 3. Añadir el wrapper al DOM
    container.appendChild(embedDiv);

    // 4. Forzar la recarga/ejecución de la librería Flourish
    const oldScript = document.getElementById('flourish-script-loader');
    if (oldScript) {
      oldScript.remove(); // Elimina el script previo para resetear el estado global de Flourish
    }

    const newScript = document.createElement('script');
    newScript.id = 'flourish-script-loader';
    newScript.src = 'https://public.flourish.studio/resources/embed.js';
    document.body.appendChild(newScript);
  }

  // Evento al presionar cualquier botón del menú
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      // Manejar la clase activa en la interfaz
      buttons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Actualizar el título superior
      const newTitle = button.getAttribute('data-title');
      if (newTitle && currentTitle) {
        currentTitle.textContent = newTitle;
      }

      // Renderizar la nueva visualización
      const chartId = button.getAttribute('data-id');
      renderFlourishChart(chartId);

      // Cierre automático del menú en vistas móviles
      if (window.innerWidth <= 850 && sidebar && sidebar.classList.contains('open')) {
        toggleSidebar();
      }
    });
  });
});
