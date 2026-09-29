/* Complemento del menú existente. El mapa se carga sólo al abrir su sección. */
document.addEventListener('DOMContentLoaded', () => {
  const section = document.getElementById('seccion-mapa-electoral');
  const frame = document.getElementById('mapa-electoral-frame');
  const expand = document.getElementById('ampliar-mapa');
  if (!section || !frame || !expand) return;
  const notifySize = () => {
    if (frame.hasAttribute('src')) {
      frame.contentWindow.postMessage({type:'metis-map-resize',expanded:document.body.classList.contains('mapa-electoral-ampliado')}, '*');
    }
  };
  const syncSection = () => {
    const active = section.classList.contains('active');
    document.body.classList.toggle('mapa-electoral-activo', active);
    if (active) {
      if (!frame.hasAttribute('src')) frame.src = frame.dataset.src;
      requestAnimationFrame(notifySize);
    } else {
      document.body.classList.remove('mapa-electoral-ampliado');
      expand.textContent = 'Ampliar mapa';
      expand.setAttribute('aria-pressed','false');
    }
  };
  new MutationObserver(syncSection).observe(section, {attributes:true, attributeFilter:['class']});
  expand.addEventListener('click', () => {
    const expanded = document.body.classList.toggle('mapa-electoral-ampliado');
    expand.textContent = expanded ? 'Mostrar menú' : 'Ampliar mapa';
    expand.setAttribute('aria-pressed', String(expanded));
    requestAnimationFrame(notifySize);
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('mapa-electoral-ampliado')) expand.click();
  });
  frame.addEventListener('load', notifySize);
  syncSection();
});

