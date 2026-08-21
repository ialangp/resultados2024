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
        section.classList.toggle('active', section.id === targetSectionId);
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
      if (!parentSection) return;

      const sectionTabs = parentSection.querySelectorAll('.tab-btn');
      const sectionReports = parentSection.querySelectorAll('.report-container');

      sectionTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetModuleId = tab.getAttribute('data-module');
      sectionReports.forEach(report => {
        report.classList.toggle('active', report.id === targetModuleId);
      });

      triggerFlourishResize();
    });
  });

  // 3. Lógica para el módulo de Candidatos
  setupCandidatesModule('alcaldias', 'candidatos-alcaldias.json', 'search-alcaldias', 'select-alcaldias', 'grid-alcaldias');
  setupCandidatesModule('distritos', 'candidatos-distritos.json', 'search-distritos', 'select-distritos', 'grid-distritos', 'select-acciones-distritos');

  // 4. Lógica para el módulo de Rendimiento
  setupRendimientoModule('rendimiento-distritos.json', 'grid-rendimiento-distritos', 'sort-rendimiento-distritos','search-rendimiento-distritos');

  // 5. Configurar eventos de cierre para el Modal de Imágenes
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

async function setupCandidatesModule(type, jsonFile, searchId, selectId, gridId, actionSelectId = null) {
  try {
    const response = await fetch(jsonFile);
    if (!response.ok) return;
    const candidates = await response.json();

    const searchInput = document.getElementById(searchId);
    const selectFilter = document.getElementById(selectId);
    const actionFilter = actionSelectId ? document.getElementById(actionSelectId) : null;
    const grid = document.getElementById(gridId);

    if (!searchInput || !selectFilter || !grid) return;

    // Poblar desplegable de ubicaciones
    const locations = [...new Set(candidates.map(item => item.ubicacion))].filter(Boolean).sort();
    locations.forEach(loc => {
      const option = document.createElement('option');
      option.value = loc;
      option.textContent = loc;
      selectFilter.appendChild(option);
    });

    // Poblar desplegable de Acciones Afirmativas (si existe)
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

    // Función de filtrado con búsqueda multicampo
    function applyFilters() {
      const searchQuery = searchInput.value.toLowerCase().trim();
      const locationQuery = selectFilter.value;
      const actionQuery = actionFilter ? actionFilter.value.trim() : '';

      const filtered = candidates.filter(c => {
        // Coincidencia amplia en la barra de texto
        const nombreTexto = String(c.nombre || '').toLowerCase();
        const cabeceraTexto = String(c.cabecera || '').toLowerCase();
        const distritoTexto = String(c.distrito || '').toLowerCase();
        const ubicacionTexto = String(c.ubicacion || '').toLowerCase();

        const matchesSearch = nombreTexto.includes(searchQuery) ||
                              cabeceraTexto.includes(searchQuery) ||
                              distritoTexto.includes(searchQuery) ||
                              ubicacionTexto.includes(searchQuery);

        const matchesLocation = locationQuery === '' || c.ubicacion === locationQuery;

        const candidateAction = (c.accionAfirmativa || '').trim();
        const hasAction = candidateAction !== '' && candidateAction.toLowerCase() !== 'ninguna';

        let matchesAction = true;
        if (actionQuery === '__TODAS_ACCIONES__') {
          matchesAction = hasAction;
        } else if (actionQuery !== '') {
          matchesAction = candidateAction === actionQuery;
        }

        return matchesSearch && matchesLocation && matchesAction;
      });

      renderCards(filtered, grid);
    }

    searchInput.addEventListener('input', applyFilters);
    selectFilter.addEventListener('change', applyFilters);
    if (actionFilter) actionFilter.addEventListener('change', applyFilters);

    renderCards(candidates, grid);

  } catch (error) {
    console.warn(`Nota: Esperando archivo ${jsonFile} para renderizar tarjetas.`, error);
  }
}

function renderCards(list, container) {
  if (!container) return;
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">No se encontraron candidatos con los criterios seleccionados.</p>';
    return;
  }

  const iconMap = {
    'personas adultas mayores': '<path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v1h2v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1z"/>',
    'personas jóvenes': '<path d="M13 3a1 1 0 0 0-2 0v8.59l-4.3-4.3a1 1 0 0 0-1.4 1.42l6 6a1 1 0 0 0 1.4 0l6-6a1 1 0 0 0-1.4-1.42L13 11.59Z"/>',
    'personas de la diversidad sexual': '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
    'personas afromexicanas': '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>',
    'personas con discapacidad': '<path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>',
    'persona integrante de pueblos y barrios originarios y comunidades indígenas': '<path d="M12 2L2 22h20L12 2zm0 4.1L18.6 19H5.4L12 6.1z"/>'
  };

  const tooltipMap = {
    'personas adultas mayores': 'Personas Adultas mayores',
    'personas jóvenes': 'Personas Jóvenes',
    'personas de la diversidad sexual': 'Personas de la Diversidad Sexual',
    'personas afromexicanas': 'Personas afromexicanas',
    'personas con discapacidad': 'Personas con Discapacidad',
    'persona integrante de pueblos y barrios originarios y comunidades indígenas': 'Persona Integrante de Pueblos y barrios originarios y comunidades indígenas'
  };

  const fragment = document.createDocumentFragment();

  list.forEach(item => {
    const isPositive = item.incremento >= 0;
    const incSign = isPositive ? '▲ +' : '▼ ';
    const incClass = isPositive ? 'positive' : 'negative';
    const cardBorderClass = isPositive ? 'positive-card' : 'negative-card';

    const isDesPositive = item.desempeno >= 0;
    const desClass = isDesPositive ? 'positive' : 'negative';
    const desSign = isDesPositive ? '+' : '';

    const safeName = (item.nombre || 'Sin Candidato').replace(/'/g, "\\'");
    // SE CORRIGE LA DECLARACIÓN DE UBICACIÓN
    const safeLocation = (item.ubicacion || `${item.distrito || ''} ${item.cabecera ? '- ' + item.cabecera : ''}`).replace(/'/g, "\\'");

    const hasPhoto = item.foto && item.foto.trim() !== '';
    const avatarHTML = hasPhoto
      ? `<img src="${item.foto}" alt="${safeName}" class="candidate-avatar" loading="lazy" onclick="openImageModal('${item.foto}', '${safeName}', '${safeLocation}')" onerror="this.outerHTML='<div class=\\'candidate-avatar no-photo\\'>Sin foto</div>'">`
      : `<div class="candidate-avatar no-photo">Sin foto</div>`;

    const accionTexto = (item.accionAfirmativa || '').trim();
    const tieneAccion = accionTexto !== '' && accionTexto.toLowerCase() !== 'ninguna';

    let emblemaHTML = '';
    if (tieneAccion) {
      const claveAccion = accionTexto.toLowerCase();
      const pathSvg = iconMap[claveAccion] || '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>';
      const tooltipTexto = tooltipMap[claveAccion] || `Acción Afirmativa: ${accionTexto}`;
      const claseEspecial = 'badge-' + claveAccion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');

      emblemaHTML = `
        <div class="emblema-accion-afirmativa ${claseEspecial}" title="${tooltipTexto}">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
            ${pathSvg}
          </svg>
          <span class="emblema-texto">${accionTexto}</span>
        </div>
      `;
    }

    const cardContainer = document.createElement('div');
    cardContainer.className = `candidate-card ${cardBorderClass}`;
    cardContainer.innerHTML = `
      <div class="candidate-header">
        ${avatarHTML}
        <div class="candidate-info">
          <h3>${item.nombre || 'Sin Candidato'}</h3>
          <span class="location-badge">🏛️ ${item.ubicacion || (item.distrito + (item.cabecera ? ' - ' + item.cabecera : ''))}</span>
          ${emblemaHTML}
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
          <div class="progress-bar-fill ${incClass}" style="width: ${Math.min(Math.max(item.porcentaje, 0), 100)}%;"></div>
        </div>

        <div class="performance-footer">
          <span class="footer-label">Desempeño</span>
          <span class="performance-badge ${desClass}">${desSign}${item.desempeno}%</span>
        </div>
      </div>
    `;
    fragment.appendChild(cardContainer);
  });

  container.appendChild(fragment);
}

async function setupRendimientoModule(jsonFile, gridId, sortSelectId, searchInputId = null) {
  try {
    const response = await fetch(jsonFile);
    if (!response.ok) return;

    const json = await response.json();
    const data = json.registros || (Array.isArray(json) ? json : []);
    const kpis = json.kpis;

    const grid = document.getElementById(gridId);
    const sortSelect = document.getElementById(sortSelectId);
    const searchInput = searchInputId ? document.getElementById(searchInputId) : null;

    if (!grid) return;

    // Actualizar KPIs si existen
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

    // Helper para obtener el nombre independientemente de cómo se llame la propiedad en el JSON
    function getNombre(item) {
      return item.nombre || item.candidato || item.candidatoNombre || item.nombreCandidato || item.nombre_candidato || 'Sin Nombre';
    }

    function renderRendimientoCards(items) {
      grid.innerHTML = '';
      if (items.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">No se encontraron registros con los criterios seleccionados.</p>';
        return;
      }

      const fragment = document.createDocumentFragment();
      items.forEach(item => {
        const val = item.valor ?? 0;
        const votos = item.votos ?? 0;
        const nombre = getNombre(item).replace(/'/g, "\\'");
        const distrito = item.distrito ?? '';
        const cabecera = item.cabecera ?? '';
        const foto = item.fotografia && item.fotografia.trim() !== '' ? item.fotografia : '';
        const bloque = item.bloqueCompetitividad ?? item.bloque ?? 'N/A';

        const valorFormateado = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
        const votosFormateados = new Intl.NumberFormat('es-MX').format(votos);
        const bloqueClass = 'badge-' + String(bloque).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');

        const avatarHTML = foto
          ? `<img src="${foto}" alt="${nombre}" class="candidate-avatar" loading="lazy" onclick="openImageModal('${foto}', '${nombre}', '${distrito}')" onerror="this.outerHTML='<div class=\\'candidate-avatar no-photo\\'>Sin foto</div>'">`
          : `<div class="candidate-avatar no-photo">Sin foto</div>`;

        const cardContainer = document.createElement('div');
        cardContainer.className = 'candidate-card positive-card';
        cardContainer.innerHTML = `
          <div class="candidate-header">
            ${avatarHTML}
            <div class="candidate-info">
              <h3>${nombre}</h3>
              <span class="location-badge">🏛️ ${distrito} ${cabecera ? '- ' + cabecera : ''}</span>
              <div class="emblema-accion-afirmativa ${bloqueClass}">
                <span class="emblema-texto">${bloque}</span>
              </div>
            </div>
          </div>

          <div class="performance-metric">
            <div class="metric-header-row">
              <span class="metric-label">Desglose de Rendimiento</span>
            </div>

            <div class="rendimiento-metric-grid">
              <div class="metric-data-item">
                <span class="sub-label">Votos Obtenidos</span>
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

    // Función de filtrado y ordenamiento corregida
    function applyFilterAndSort() {
      const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
      const order = sortSelect ? sortSelect.value : 'desc';

      let filtered = data.filter(item => {
        const nombreCandidato = getNombre(item).toLowerCase();
        const distritoTexto = String(item.distrito || '').toLowerCase();
        const cabeceraTexto = String(item.cabecera || '').toLowerCase();

        return nombreCandidato.includes(searchQuery) || 
               distritoTexto.includes(searchQuery) || 
               cabeceraTexto.includes(searchQuery);
      });

      if (order === 'desc') {
        filtered.sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));
      } else if (order === 'asc') {
        filtered.sort((a, b) => (a.valor ?? 0) - (b.valor ?? 0));
      } else if (order === 'votos-desc') {
        filtered.sort((a, b) => (b.votos ?? 0) - (a.votos ?? 0));
      }

      renderRendimientoCards(filtered);
    }

    if (sortSelect) sortSelect.addEventListener('change', applyFilterAndSort);
    if (searchInput) searchInput.addEventListener('input', applyFilterAndSort);

    applyFilterAndSort();

  } catch (error) {
    console.error(`Error al procesar el módulo de Rendimiento (${jsonFile}):`, error);
  }
}

// Abrir modal con validación y formato HTML en la leyenda
window.openImageModal = function(src, name, location) {
  if (!src || src.trim() === '') return;

  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-img');
  const modalCaption = document.getElementById('modal-caption');

  if (modal && modalImg && modalCaption) {
    modalImg.src = src;
    modalImg.alt = name || '';
    modalCaption.innerHTML = `${name}<br><span style="font-weight:600; color:var(--text-muted); font-size:0.85rem;">🏛️ ${location}</span>`;
    modal.classList.add('show');
  }
};

// Cerrar modal
window.closeImageModal = function() {
  const modal = document.getElementById('image-modal');
  if (modal) {
    modal.classList.remove('show');
  }
};
