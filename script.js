document.addEventListener('DOMContentLoaded', () => {
  const navButtons = document.querySelectorAll('.nav-btn');
  const levelSections = document.querySelectorAll('.level-section');
  const currentTitle = document.getElementById('current-title');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('toggle-sidebar');
  const closeBtn = document.getElementById('close-sidebar');

  // Disparar evento de resize para gráficos
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
        section.classList.toggle('active', section.id === targetSectionId);
      });

      triggerFlourishResize();

      if (window.innerWidth <= 850 && sidebar && sidebar.classList.contains('open')) {
        toggleSidebar();
      }
    });
  });

  // 2. Cambio de Módulo / Pestañas
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
      const parentSection = tab.closest('.level-section');
      if (!parentSection) return;

      const sectionTabs = parentSection.querySelectorAll('.tab-btn');
      const sectionReports = parentSection.querySelectorAll('.report-container');

      sectionTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetModuleId = tab.getAttribute('data-module');
      sectionReports.forEach(report => {
        const isActive = report.id === targetModuleId;
        report.classList.toggle('active', isActive);
      });

      triggerFlourishResize();
    });
  });

  // 3. Cargas aisladas e independientes
  setupCandidatesModule('alcaldias', 'candidatos-alcaldias.json', 'search-alcaldias', 'select-alcaldias', 'grid-alcaldias');
  setupCandidatesModule('distritos', 'candidatos-distritos.json', 'search-distritos', 'select-distritos', 'grid-distritos', 'select-acciones-distritos');
  
  // Módulo de Rentabilidad / Rendimiento
  setupRentabilidadModule('rentabilidad-distritos.json', 'grid-rentabilidad-distritos', 'sort-rentabilidad-distritos', 'search-rentabilidad-distritos');

  // 4. Configurar Modal de Imágenes
  const modal = document.getElementById('image-modal');
  const modalCloseBtn = document.getElementById('modal-close');

  function closeModal() {
    if (modal) modal.classList.remove('show');
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
});

// Helper universal para normalizar cadenas
function cleanText(str) {
  return String(str || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

async function setupCandidatesModule(type, jsonFile, searchId, selectId, gridId, actionSelectId = null) {
  try {
    const response = await fetch(jsonFile);
    if (!response.ok) return;
    const candidates = await response.json();

    const searchInput = document.getElementById(searchId);
    const selectFilter = document.getElementById(selectId);
    const actionFilter = actionSelectId ? document.getElementById(actionSelectId) : null;
    const grid = document.getElementById(gridId);

    if (!grid) return;

    if (selectFilter) {
      const locations = [...new Set(candidates.map(item => item.ubicacion))].filter(Boolean).sort();
      locations.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc;
        option.textContent = loc;
        selectFilter.appendChild(option);
      });
    }

    if (actionFilter) {
      const actions = [...new Set(
        candidates
          .map(item => (item.accionAfirmativa || '').trim())
          .filter(act => act !== '' && act.toLowerCase() !== 'ninguna')
      )].sort();

      actions.forEach(action => {
        const option = document.createElement('option');
        option.value = action;
        option.textContent = action;
        actionFilter.appendChild(option);
      });
    }

    function applyFilters() {
      const query = searchInput ? cleanText(searchInput.value) : '';
      const locationQuery = selectFilter ? selectFilter.value : '';
      const actionQuery = actionFilter ? actionFilter.value.trim() : '';

      const filtered = candidates.filter(c => {
        const nameText = cleanText(c.nombre);
        const cabeceraText = cleanText(c.cabecera);
        const distritoText = cleanText(c.distrito);
        const ubicacionText = cleanText(c.ubicacion);

        const matchesQuery = query === '' || 
                             nameText.includes(query) || 
                             cabeceraText.includes(query) || 
                             distritoText.includes(query) || 
                             ubicacionText.includes(query);

        const matchesLocation = locationQuery === '' || c.ubicacion === locationQuery;

        const candidateAction = (c.accionAfirmativa || '').trim();
        const hasAction = candidateAction !== '' && candidateAction.toLowerCase() !== 'ninguna';

        let matchesAction = true;
        if (actionQuery === '__TODAS_ACCIONES__') {
          matchesAction = hasAction;
        } else if (actionQuery !== '') {
          matchesAction = candidateAction === actionQuery;
        }

        return matchesQuery && matchesLocation && matchesAction;
      });

      renderCards(filtered, grid);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (selectFilter) selectFilter.addEventListener('change', applyFilters);
    if (actionFilter) actionFilter.addEventListener('change', applyFilters);

    renderCards(candidates, grid);

  } catch (error) {
    console.warn(`Archivo ${jsonFile} no cargado.`, error);
  }
}

function renderCards(list, container) {
  if (!container) return;
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); padding: 1rem; grid-column: 1/-1;">No se encontraron registros con los criterios seleccionados.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  list.forEach(item => {
    const isPositive = item.incremento >= 0;
    const incSign = isPositive ? '▲ +' : '▼ ';
    const incClass = isPositive ? 'positive' : 'negative';
    const cardBorderClass = isPositive ? 'positive-card' : 'negative-card';

    const safeName = (item.nombre || 'Sin Nombre').replace(/'/g, "\\'");
    const safeLocation = (item.ubicacion || '').replace(/'/g, "\\'");

    const hasPhoto = item.foto && item.foto.trim() !== '';
    const avatarHTML = hasPhoto
      ? `<img src="${item.foto}" alt="${safeName}" class="candidate-avatar" loading="lazy" onclick="openImageModal('${item.foto}', '${safeName}', '${safeLocation}')" onerror="this.outerHTML='<div class=\\'candidate-avatar no-photo\\'>Sin foto</div>'">`
      : `<div class="candidate-avatar no-photo">Sin foto</div>`;

    const cardContainer = document.createElement('div');
    cardContainer.className = `candidate-card ${cardBorderClass}`;
    cardContainer.innerHTML = `
      <div class="candidate-header">
        ${avatarHTML}
        <div class="candidate-info">
          <h3>${item.nombre || 'Sin Nombre'}</h3>
          <span class="location-badge">🏛️ ${item.ubicacion || ''}</span>
        </div>
      </div>
      <div class="performance-metric">
        <div class="metric-header-row">
          <span class="metric-label">Votación 2024</span>
          <span class="metric-diff ${incClass}">${incSign}${item.incremento || 0}%</span>
        </div>
        <div class="metric-value-row">
          <span class="metric-number">${item.porcentaje || 0}%</span>
        </div>
      </div>
    `;
    fragment.appendChild(cardContainer);
  });

  container.appendChild(fragment);
}

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

async function setupRentabilidadModule(jsonFile, gridId, sortSelectId, searchInputId = null) {
  const grid = document.getElementById(gridId);
  if (!grid) {
    console.error(`[Rentabilidad] No existe el contenedor DOM con ID: #${gridId}`);
    return;
  }

  try {
    const response = await fetch(jsonFile);
    if (!response.ok) {
      grid.innerHTML = `<p style="color:var(--text-muted); padding:1rem; grid-column:1/-1;">Error HTTP ${response.status}: No se pudo cargar ${jsonFile}</p>`;
      return;
    }

    const json = await response.json();

    // Extraer array sin importar la llave del objeto raíz
    let data = [];
    if (Array.isArray(json)) {
      data = json;
    } else if (json && Array.isArray(json.registros)) {
      data = json.registros;
    } else if (json && Array.isArray(json.data)) {
      data = json.data;
    } else if (json && Array.isArray(json.candidatos)) {
      data = json.candidatos;
    }

    if (data.length === 0) {
      grid.innerHTML = '<p style="color: var(--text-muted); padding: 1rem; grid-column: 1/-1;">El archivo JSON no contiene una lista de registros válida.</p>';
      return;
    }

    const kpis = json.kpis;
    const sortSelect = document.getElementById(sortSelectId);
    const searchInput = searchInputId ? document.getElementById(searchInputId) : null;

    if (kpis) {
      const parentContainer = grid.closest('.report-container');
      if (parentContainer) {
        const kpiElements = parentContainer.querySelectorAll('.kpi-card .kpi-value');
        if (kpiElements.length >= 3) {
          kpiElements[0].textContent = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(kpis.presupuestoAnual || 0);
          kpiElements[1].textContent = new Intl.NumberFormat('es-MX').format(kpis.totalVotos || 0);
          kpiElements[2].textContent = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(kpis.valorVoto || 0);
        }
      }
    }

    function getNombre(item) {
      return item.nombre || item.candidato || item.candidatoNombre || item.nombreCandidato || item.nombre_candidato || '';
    }

    function renderRentabilidadCards(items) {
      grid.innerHTML = '';
      if (!items || items.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted); padding: 1rem; grid-column: 1/-1;">No se encontraron registros con los criterios seleccionados.</p>';
        return;
      }

      const fragment = document.createDocumentFragment();
      items.forEach(item => {
        const val = item.valor ?? item.valorEstimado ?? 0;
        const votos = item.votos ?? item.votosObtenidos ?? 0;
        const rawNombre = getNombre(item) || 'Sin Nombre';
        const nombre = rawNombre.replace(/'/g, "\\'");
        const distrito = item.distrito ?? item.ubicacion ?? '';
        const cabecera = item.cabecera ?? '';
        const foto = (item.fotografia || item.foto || '').trim();
        const bloque = item.bloqueCompetitividad ?? item.bloque ?? 'N/A';

        const valorFormateado = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
        const votosFormateados = new Intl.NumberFormat('es-MX').format(votos);

        const avatarHTML = foto
          ? `<img src="${foto}" alt="${nombre}" class="candidate-avatar" loading="lazy" onclick="openImageModal('${foto}', '${nombre}', '${distrito}')" onerror="this.outerHTML='<div class=\\'candidate-avatar no-photo\\'>Sin foto</div>'">`
          : `<div class="candidate-avatar no-photo">Sin foto</div>`;

        const bloqueSlug = cleanText(bloque).replace(/[^a-z0-9]/g, '-');
        const badgeClass = `badge-competitividad ${bloqueSlug}`;
        
        const cardContainer = document.createElement('div');
        cardContainer.className = 'candidate-card';
        cardContainer.innerHTML = `
          <div class="candidate-header">
            ${avatarHTML}
            <div class="candidate-info">
              <h3>${rawNombre}</h3>
              <span class="location-badge">🏛️ ${distrito} ${cabecera ? '- ' + cabecera : ''}</span>
              <div class="${badgeClass}">
                <span class="emblema-texto">${bloque}</span>
              </div>
            </div>
          </div>
        
          <div class="performance-metric">
            <div class="metric-header-row">
              <span class="metric-label">Rendimiento Electoral</span>
            </div>
        
            <div class="rentabilidad-metric-grid">
              <div class="metric-data-item">
                <span class="sub-label">Votos</span>
                <span class="metric-number">${votosFormateados}</span>
              </div>
              <div class="metric-data-item highlight">
                <span class="sub-label">Valor Estimado</span>
                <span class="metric-number valor-destacado">${valorFormateado}</span>
              </div>
            </div>
          </div>
        `;
        fragment.appendChild(cardContainer);
      });

      grid.appendChild(fragment);
    }

    function applyFilterAndSort() {
      const searchQuery = searchInput ? cleanText(searchInput.value) : '';
      const order = sortSelect ? sortSelect.value : 'desc';

      let filtered = data.filter(item => {
        if (!searchQuery) return true;
        const nombreCandidato = cleanText(getNombre(item));
        const distritoTexto = cleanText(item.distrito);
        const cabeceraTexto = cleanText(item.cabecera);

        return nombreCandidato.includes(searchQuery) || 
               distritoTexto.includes(searchQuery) || 
               cabeceraTexto.includes(searchQuery);
      });

      if (order === 'desc') {
        filtered.sort((a, b) => (b.valor ?? b.valorEstimado ?? 0) - (a.valor ?? a.valorEstimado ?? 0));
      } else if (order === 'asc') {
        filtered.sort((a, b) => (a.valor ?? a.valorEstimado ?? 0) - (b.valor ?? b.valorEstimado ?? 0));
      }

      renderRentabilidadCards(filtered);
    }

    if (sortSelect) sortSelect.addEventListener('change', applyFilterAndSort);
    if (searchInput) searchInput.addEventListener('input', applyFilterAndSort);

    // Renderizado inicial
    applyFilterAndSort();

  } catch (error) {
    console.error(`Error procesando JSON de rendimiento (${jsonFile}):`, error);
  }
}
