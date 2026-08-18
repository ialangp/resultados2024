document.addEventListener('DOMContentLoaded', () => {
  const navButtons = document.querySelectorAll('.nav-btn');
  const levelSections = document.querySelectorAll('.level-section');
  const currentTitle = document.getElementById('current-title');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('toggle-sidebar');
  const closeBtn = document.getElementById('close-sidebar');

  // Disparar evento de resize a Flourish
  function triggerFlourishResize() {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
  }

  // Menú Móvil
  function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
  if (closeBtn) closeBtn.addEventListener('click', toggleSidebar);
  if (overlay) overlay.addEventListener('click', toggleSidebar);

  // 1. Cambio de Nivel (Menú Lateral: Alcaldías vs Distritos)
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const title = button.getAttribute('data-title');
      if (title && currentTitle) currentTitle.textContent = title;

      const targetSectionId = button.getAttribute('data-target');
      levelSections.forEach(section => {
        if (section.id === targetSectionId) {
          section.classList.add('active');
        } else {
          section.classList.remove('active');
        }
      });

      triggerFlourishResize();

      if (window.innerWidth <= 850 && sidebar && sidebar.classList.contains('open')) {
        toggleSidebar();
      }
    });
  });

  // 2. Cambio de Módulo (Pestañas Superiores: Resultados vs Competitividad)
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
      const parentSection = tab.closest('.level-section');
      const sectionTabs = parentSection.querySelectorAll('.tab-btn');
      const sectionReports = parentSection.querySelectorAll('.report-container');

      // Alternar clase active en la pestaña
      sectionTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Alternar módulo visible dentro de la sección actual
      const targetModuleId = tab.getAttribute('data-module');
      sectionReports.forEach(report => {
        if (report.id === targetModuleId) {
          report.classList.add('active');
        } else {
          report.classList.remove('active');
        }
      });

      triggerFlourishResize();
    });
  });
});
