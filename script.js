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

  // 4. Configurar eventos de cierre para el Modal de Imágenes
  const modal = document.getElementById('image-modal');
  const modalCloseBtn = document.getElementById('modal-close');

  function closeModal() {
    if (modal) modal.classList.remove('show');
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
});

async function setupCandidatesModule(type, jsonFile, searchId, selectId, gridId) {
  try {
    const response = await fetch(jsonFile);
    if (!response.ok) return;
    const candidates = await response.json();

    const searchInput = document.getElementById(searchId);
    const selectFilter = document.getElementById(selectId);
    const grid = document.getElementById(gridId);

    if (!searchInput || !selectFilter || !grid) return;

    // Poblar desplegable con las demarcaciones únicas
    const locations = [...new Set(candidates.map(item => item.ubicacion))].filter(Boolean).sort();
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
        const matchesName = (c.nombre || '').toLowerCase().includes(nameQuery);
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

// Renderizado de tarjetas de candidatos
function renderCards(list, container) {
  if (!container) return;
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">No se encontraron candidatos con los criterios seleccionados.</p>';
    return;
  }

  list.forEach(item => {
    const isPositive = item.incremento >= 0;
    const incSign = isPositive ? '▲ +' : '▼ ';
    const incClass = isPositive ? 'positive' : 'negative';
    const cardBorderClass = isPositive ? 'positive-card' : 'negative-card';

    const isDesPositive = item.desempeno >= 0;
    const desClass = isDesPositive ? 'positive' : 'negative';
    const desSign = isDesPositive ? '+' : '';

    const safeName = (item.nombre || 'Sin Candidato').replace(/'/g, "\\'");
    const safeLocation = (item.ubicacion || '').replace(/'/g, "\\'");

    // Fotografía con optimización loading="lazy" y evento onclick global
    const hasPhoto = item.foto && item.foto.trim() !== '';
    const avatarHTML = hasPhoto
      ? `<img src="${item.foto}" alt="${item.nombre}" class="candidate-avatar" loading="lazy" onclick="openImageModal('${item.foto}', '${safeName}', '${safeLocation}')" onerror="this.outerHTML='<div class=\\'candidate-avatar no-photo\\'>Sin foto</div>'">`
      : `<div class="candidate-avatar no-photo">Sin foto</div>`;

    // Lógica para evaluar y construir el badge de Acción Afirmativa
    const tieneAccionAfirmativa = Boolean(item.accionAfirmativa) && 
                                  item.accionAfirmativa.trim() !== "" && 
                                  item.accionAfirmativa.toLowerCase() !== "ninguna";

    const emblemaHTML = tieneAccionAfirmativa ? `
      <div class="emblema-accion-afirmativa" title="Acción Afirmativa: ${item.accionAfirmativa}">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <span>${item.accionAfirmativa}</span>
      </div>
    ` : '';

    const cardHTML = `
      <div class="candidate-card ${cardBorderClass}">
        ${emblemaHTML}
        <div class="candidate-header">
          ${avatarHTML}
          <div class="candidate-info">
            <h3>${item.nombre || 'Sin Candidato'}</h3>
            <span class="location-badge">🏛️ ${item.ubicacion}</span>
          </div>
        </div>

        <div class="performance-metric">
          <div class="metric-header-row">
            <span class="metric-label">Votación 2024</span>
            <span class="metric-diff ${incClass}">${incSign}${item.incremento}%</span>
          </div>

          <div class="metric-value-row">
            <span class="metric-number">${item.porcentaje}%</span>
            <span class="previous-votes">2021: <strong>${item.porcentajeAnterior}%</strong></span>
          </div>

          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${incClass}" style="width: ${Math.min(item.porcentaje, 100)}%;"></div>
          </div>

          <div class="performance-footer">
            <span class="footer-label">Desempeño</span>
            <span class="performance-badge ${desClass}">${desSign}${item.desempeno}%</span>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', cardHTML);
  });
}
// Función global para abrir la foto en el Modal
window.openImageModal = function(src, name, location) {
  if (!src || src.trim() === '') return;

  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-img');
  const modalCaption = document.getElementById('modal-caption');

  if (modal && modalImg && modalCaption) {
    modalImg.src = src;
    modalCaption.innerHTML = `${name}<br><span style="font-weight:600; color:var(--text-muted); font-size:0.85rem;">🏛️ ${location}</span>`;
    modal.classList.add('show');
  }
};

