document.addEventListener('DOMContentLoaded', () => {
  const navButtons = document.querySelectorAll('.nav-btn');
  const levelSections = document.querySelectorAll('.level-section');
  const currentTitle = document.getElementById('current-title');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('toggle-sidebar');
  const closeBtn = document.getElementById('close-sidebar');

  // Disparar evento de resize para gráficos de Flourish
  function triggerFlourishResize() {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
  }

  // Control Menú Móvil
  function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  }

  if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
  if (closeBtn) closeBtn.addEventListener('click', toggleSidebar);
  if (overlay) overlay.addEventListener('click', toggleSidebar);

  // 1. Cambio de Nivel (Alcaldías vs Distritos)
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

  // 2. Cambio de Módulo (Resultados vs Competitividad vs Candidatos)
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
      const parentSection = tab.closest('.level-section');
      const sectionTabs = parentSection.querySelectorAll('.tab-btn');
      const sectionReports = parentSection.querySelectorAll('.report-container');

      sectionTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

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

  // 3. Lógica para el módulo de Candidatos
  setupCandidatesModule('alcaldias', 'candidatos-alcaldias.json', 'search-alcaldias', 'select-alcaldias', 'grid-alcaldias');
  setupCandidatesModule('distritos', 'candidatos-distritos.json', 'search-distritos', 'select-distritos', 'grid-distritos');
});

async function setupCandidatesModule(type, jsonFile, searchId, selectId, gridId) {
  try {
    const response = await fetch(jsonFile);
    if (!response.ok) return;
    const candidates = await response.json();

    const searchInput = document.getElementById(searchId);
    const selectFilter = document.getElementById(selectId);
    const grid = document.getElementById(gridId);

    // Poblar desplegable con las demarcaciones únicas
    const locations = [...new Set(candidates.map(item => item.ubicacion))].sort();
    locations.forEach(loc => {
      const option = document.createElement('option');
      option.value = loc;
      option.textContent = loc;
      selectFilter.appendChild(option);
    });

    // Función de filtrado en tiempo real
    function applyFilters() {
      const nameQuery = searchInput.value.toLowerCase().trim();
      const locationQuery = selectFilter.value;

      const filtered = candidates.filter(c => {
        const matchesName = c.nombre.toLowerCase().includes(nameQuery);
        const matchesLocation = locationQuery === '' || c.ubicacion === locationQuery;
        return matchesName && matchesLocation;
      });

      renderCards(filtered, grid);
    }

    searchInput.addEventListener('input', applyFilters);
    selectFilter.addEventListener('change', applyFilters);

    // Carga inicial
    renderCards(candidates, grid);

  } catch (error) {
    console.log(`Nota: Esperando archivo ${jsonFile} para renderizar tarjetas.`);
  }
}

function renderCards(list, container) {
  if (!container) return;
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">No se encontraron candidatos con los criterios seleccionados.</p>';
    return;
  }

  list.forEach(item => {
    const diff = (item.porcentaje - item.porcentajeAnterior).toFixed(1);
    const diffClass = diff >= 0 ? 'positive' : 'negative';
    const diffSign = diff >= 0 ? '+' : '';

    const cardHTML = `
      <div class="candidate-card">
        <div class="candidate-header">
          <img src="${item.foto}" alt="${item.nombre}" class="candidate-avatar" onerror="this.src='https://via.placeholder.com/64?text=Foto'">
          <div class="candidate-info">
            <h3>${item.nombre}</h3>
            <span class="location-badge">${item.ubicacion}</span>
          </div>
        </div>

        <div class="performance-metric">
          <div class="metric-label">Porcentaje de Votación</div>
          <div class="metric-value-row">
            <span class="metric-number">${item.porcentaje}%</span>
            <span class="metric-diff ${diffClass}">${diffSign}${diff}% vs anterior</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${Math.min(item.porcentaje, 100)}%;"></div>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.45rem;">
            Total: ${Number(item.votos).toLocaleString()} votos
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', cardHTML);
  });
}
