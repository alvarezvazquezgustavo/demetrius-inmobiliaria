/* Demetrius Grupo Inmobiliario — se carga en <head> antes de pintar la página */
// Fuerza HTTPS en producción (no aplica en localhost ni al abrir el archivo de forma local)
(function () {
  var h = location.hostname;
  var esLocal = h === '' || h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || /\.(localhost|local|test)$/.test(h);
  if (location.protocol === 'http:' && !esLocal) {
    location.replace('https://' + location.host + location.pathname + location.search + location.hash);
  }
})();
document.documentElement.classList.add('js');
// Esqueleto de carga: detecta cuándo cada foto del catálogo termina de descargar (o falla).
// Si una foto falla y tiene data-fallback, se usa esa imagen de respaldo (sustituye a onerror="" inline, que la CSP bloquea).
(function () {
  function marcar(e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.classList.contains('prop-img')) return;
    var media = img.closest('.prop-media');
    if (!media) return;
    if (e.type === 'load') {
      media.classList.remove('is-error');
      media.classList.add('is-loaded');
    } else if (img.dataset.fallback && !img.dataset.fallbackUsado) {
      img.dataset.fallbackUsado = '1';
      img.src = img.dataset.fallback;
    } else {
      media.classList.add('is-error');
    }
  }
  document.addEventListener('load', marcar, true);
  document.addEventListener('error', marcar, true);
})();
