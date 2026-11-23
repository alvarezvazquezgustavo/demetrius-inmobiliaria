/* Demetrius Grupo Inmobiliario — aviso de cookies y Google Analytics en las páginas que no usan js/principal.js
   (yeucate.html y propiedad.html). Funciona igual que en el inicio:
   - Guarda la decisión en el mismo lugar ("demetrius_cookie_consent"): si la persona ya aceptó o rechazó
     en cualquier página, no se le vuelve a preguntar.
   - Google Analytics solo se carga si la persona da clic en «Aceptar». El ID vive en js/config.js.
   - Sin publicidad: ad_storage, ad_user_data y ad_personalization siempre en «denied». */
(() => {
  'use strict';
  const CLAVE = 'demetrius_cookie_consent';
  const ID = String((window.DEMETRIUS_CONFIG || {}).GA_MEASUREMENT_ID || '');
  const configurado = /^G-[A-Z0-9]{4,}$/.test(ID) && ID !== 'G-XXXXXXXXXX';
  const leer = () => { try { return window.localStorage.getItem(CLAVE); } catch (e) { return null; } };
  const guardar = (v) => { try { window.localStorage.setItem(CLAVE, v); } catch (e) { /* almacenamiento no disponible */ } };

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  let activo = false;
  function activar() {
    if (!configurado) return;
    if (activo) { gtag('consent', 'update', { analytics_storage: 'granted' }); return; }
    activo = true;
    gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID)}`;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', ID);
  }
  function desactivar() {
    if (activo) gtag('consent', 'update', { analytics_storage: 'denied' });
    // Borra las cookies _ga que hubiera
    document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(n => /^_ga/.test(n)).forEach(n => {
      const base = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = base;
      document.cookie = `${base}; domain=.${location.hostname.replace(/^www\./, '')}`;
    });
  }

  // Aviso (mismo diseño que el del inicio; el botón de WhatsApp se recorre hacia arriba mientras se ve)
  const aviso = document.getElementById('cookieBanner');
  function ajustarEspacio() {
    const visible = aviso && !aviso.hidden && aviso.classList.contains('show');
    document.documentElement.style.setProperty('--cookie-h', visible ? `${aviso.offsetHeight + 12}px` : '0px');
  }
  function mostrar() {
    aviso.hidden = false;
    void aviso.offsetWidth; // para que se anime la entrada
    aviso.classList.add('show');
    ajustarEspacio();
  }
  function ocultar() {
    aviso.classList.remove('show');
    document.documentElement.style.setProperty('--cookie-h', '0px');
    setTimeout(() => { if (!aviso.classList.contains('show')) aviso.hidden = true; }, 600);
  }
  if (aviso) {
    document.getElementById('cookieAccept').addEventListener('click', () => { guardar('accepted'); activar(); ocultar(); });
    document.getElementById('cookieReject').addEventListener('click', () => { guardar('rejected'); desactivar(); ocultar(); });
    window.addEventListener('resize', ajustarEspacio, { passive: true });
  }

  if (leer() === 'accepted') activar();
  else if (leer() !== 'rejected' && aviso) setTimeout(mostrar, 900);

  // Para registrar eventos desde otros scripts de la página (solo si la persona aceptó)
  window.DemetriusAnalitica = Object.freeze({
    track(evento, params = {}) { if (activo && leer() === 'accepted') gtag('event', evento, params); }
  });
})();
