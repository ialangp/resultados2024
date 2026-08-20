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
  setupCandidatesModule('distritos', 'candidatos-distritos.json', 'search-distritos', 'select-distritos', 'grid-distritos', 'select-acciones-distritos');

  // 4. Lógica para el módulo de Rentabilidad
  setupRentabilidadModule('rentabilidad-distritos.json', 'grid-rentabilidad-distritos', 'sort-rentabilidad-distritos');
  
  // 5. Configurar eventos de cierre para el Modal de Imágenes
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

    // 1. Poblar desplegable de ubicaciones
    const locations = [...new Set(candidates.map(item => item.ubicacion))].filter(Boolean).sort();
    locations.forEach(loc => {
      const option = document.createElement('option');
      option.value = loc;
      option.textContent = loc;
      selectFilter.appendChild(option);
    });

    // 2. Poblar desplegable de Acciones Afirmativas (si existe)
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

    // 3. Función de filtrado con la nueva lógica
    function applyFilters() {
      const nameQuery = searchInput.value.toLowerCase().trim();
      const locationQuery = selectFilter.value;
      const actionQuery = actionFilter ? actionFilter.value.trim() : '';

      const filtered = candidates.filter(c => {
        // Validación de nombre
        const matchesName = (c.nombre || '').toLowerCase().includes(nameQuery);
        
        // Validación de ubicación / distrito
        const matchesLocation = locationQuery === '' || c.ubicacion === locationQuery;
        
        // Validación de Acción Afirmativa
        const candidateAction = (c.accionAfirmativa || '').trim();
        const hasAction = candidateAction !== '' && candidateAction.toLowerCase() !== 'ninguna';

        let matchesAction = true;

        if (actionQuery === '') {
          // Opción "Todos los candidatos": muestra todo sin importar si tiene o no acción
          matchesAction = true;
        } else if (actionQuery === '__TODAS_ACCIONES__') {
          // Opción "Todas las Acciones Afirmativas": solo los que SI tienen alguna acción
          matchesAction = hasAction;
        } else {
          // Opción específica: debe coincidir exactamente con la categoría seleccionada
          matchesAction = candidateAction === actionQuery;
        }

        return matchesName && matchesLocation && matchesAction;
      });

      renderCards(filtered, grid);
    }

    // Event listeners
    searchInput.addEventListener('input', applyFilters);
    selectFilter.addEventListener('change', applyFilters);
    if (actionFilter) {
      actionFilter.addEventListener('change', applyFilters);
    }

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

// 1. Mapa de íconos SVG representativos por categoría
  const iconMap = {
    'personas adultas mayores': '<path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v1h2v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1z"/>',
    'personas jóvenes': '<path d="M13 3a1 1 0 0 0-2 0v8.59l-4.3-4.3a1 1 0 0 0-1.4 1.42l6 6a1 1 0 0 0 1.4 0l6-6a1 1 0 0 0-1.4-1.42L13 11.59Z"/>',
    'personas de la diversidad sexual': '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
    'personas afromexicanas': '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>',
    'personas con discapacidad': '<path d="M12 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm9 7h-6v13h-2v-6h-2v6H9V9H3V7h18v2z"/>',
    'persona integrante de pueblos y barrios originarios y comunidades indígenas': '<path d="M12 2L2 22h20L12 2zm0 4.1L18.6 19H5.4L12 6.1z"/>'
  };
  
  // 2. Mapa de descripciones extendidas (Tooltips)
  const tooltipMap = {
    'personas adultas mayores': 'Personas Adultas mayores',
    'personas jóvenes': 'Personas Jóvenes',
    'personas de la diversidad sexual': 'Personas de la Diversidad Sexual',
    'personas afromexicanas': 'Personas afromexicanas',
    'personas con discapacidad': 'Personas con Discapacidad',
    'persona integrante de pueblos y barrios originarios y comunidades indígenas': 'Persona Integrante de Pueblos y barrios originarios y comunidades indígenas'
  };
  
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

    const hasPhoto = item.foto && item.foto.trim() !== '';
    const avatarHTML = hasPhoto
      ? `<img src="${item.foto}" alt="${item.nombre}" class="candidate-avatar" loading="lazy" onclick="openImageModal('${item.foto}', '${safeName}', '${safeLocation}')" onerror="this.outerHTML='<div class=\\'candidate-avatar no-photo\\'>Sin foto</div>'">`
      : `<div class="candidate-avatar no-photo">Sin foto</div>`;

    // 1. Lógica del Badge
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

    const cardHTML = `
      <div class="candidate-card ${cardBorderClass}">
        <div class="candidate-header">
          ${avatarHTML}
          <div class="candidate-info">
            <h3>${item.nombre || 'Sin Candidato'}</h3>
            <span class="location-badge">🏛️ ${item.ubicacion}</span>
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

async function setupRentabilidadModule(jsonFile, gridId, sortSelectId) {
  try {
    const response = await fetch(jsonFile);
    
    // 1. Verificación de respuesta HTTP
    if (!response.ok) {
      console.error(`Error HTTP ${response.status}: No se pudo cargar el archivo "${jsonFile}". Revisa que el nombre y la ruta sean correctos.`);
      return;
    }

    let data = await response.json();

    // 2. Verificación del contenedor en el DOM
    const grid = document.getElementById(gridId);
    const sortSelect = document.getElementById(sortSelectId);

    if (!grid) {
      console.error(`No se encontró el elemento contenedor con id="${gridId}" en el HTML.`);
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      grid.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">No se encontraron registros de rentabilidad.</p>';
      return;
    }

    // 3. Renderizado de tarjetas con soporte para mayúsculas/minúsculas
    function renderRentabilidadCards(items) {
      grid.innerHTML = '';

      items.forEach(item => {
        // Tolerancia a las llaves del JSON (Mayúsculas/Minúsculas)
        const val = item.Valor ?? item.valor ?? 0;
        const votos = item.Votos ?? item.votos ?? 0;
        const nombre = item.Nombre ?? item.nombre ?? 'Sin Candidato/Nombre';
        const distrito = item.Distrito ?? item.distrito ?? '';
        const cabecera = item.Cabecera ?? item.cabecera ?? '';
        const foto = item.Fotografia ?? item.fotografia ?? item.foto ?? item.Foto ?? 'img/default.jpg';
        const bloque = item['Bloque de Competitividad'] ?? item.bloqueCompetitividad ?? item.bloque ?? 'N/A';

        const valorFormateado = new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN'
        }).format(val);

        const votosFormateados = new Intl.NumberFormat('es-MX').format(votos);

        const cardHTML = `
          <div class="candidate-card">
            <div class="card-header">
              <span class="location-badge">${distrito} ${cabecera ? '- ' + cabecera : ''}</span>
              <span class="badge-competitividad ${String(bloque).toUpperCase().replace(/\s+/g, '-')}">
                ${bloque}
              </span>
            </div>
            <img src="${foto}" alt="${nombre}" class="candidate-img" onerror="this.src='img/default.jpg'">
            <div class="candidate-info">
              <h3>${nombre}</h3>
              <div class="rentabilidad-metrics">
                <p><strong>Votos obtenidos:</strong> ${votosFormateados}</p>
                <p class="valor-destacado"><strong>Valor estimado:</strong> ${valorFormateado}</p>
              </div>
            </div>
          </div>
        `;
        grid.insertAdjacentHTML('beforeend', cardHTML);
      });
    }

    // 4. Lógica de ordenamiento
    function sortAndRender() {
      const order = sortSelect ? sortSelect.value : 'desc';
      let sortedData = [...data];

      if (order === 'desc') {
        sortedData.sort((a, b) => (b.Valor ?? b.valor ?? 0) - (a.Valor ?? a.valor ?? 0));
      } else if (order === 'asc') {
        sortedData.sort((a, b) => (a.Valor ?? a.valor ?? 0) - (b.Valor ?? b.valor ?? 0));
      } else if (order === 'votos-desc') {
        sortedData.sort((a, b) => (b.Votos ?? b.votos ?? 0) - (a.Votos ?? a.votos ?? 0));
      }

      renderRentabilidadCards(sortedData);
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', sortAndRender);
    }

    sortAndRender();

  } catch (error) {
    console.error(`Error al procesar el módulo de rentabilidad (${jsonFile}):`, error);
  }
}
