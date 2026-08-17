document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.nav-btn');
  const iframe = document.getElementById('flourish-frame');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      // Remover clase activa de todos los botones
      buttons.forEach(btn => btn.classList.remove('active'));
      
      // Activar el botón seleccionado
      button.classList.add('active');
      
      // Actualizar el iframe con la URL correspondiente
      const newSrc = button.getAttribute('data-src');
      iframe.src = newSrc;
    });
  });
});
