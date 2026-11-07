/* Demetrius Grupo Inmobiliario — ficha de propiedad (propiedad.html?id=…)
   Muestra SOLO propiedades publicadas (o vendidas/rentadas) cargadas desde el panel del equipo.
   Todo el texto que escriben los asesores se inserta con textContent (nunca innerHTML). */
(() => {
  'use strict';
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const P = window.DemetriusPropiedades;
  const WHATSAPP = (window.DEMETRIUS_CONFIG || {}).WHATSAPP_NUMBER || '5213351070944';
  const waLink = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

  function el(tag, attrs = {}, ...hijos) {
    const nodo = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v === null || v === undefined || v === false) return;
      if (k === 'clase') nodo.className = v;
      else nodo.setAttribute(k, v === true ? '' : String(v));
    });
    hijos.flat().forEach(h => { if (h !== null && h !== undefined && h !== false) nodo.append(h instanceof Node ? h : String(h)); });
    return nodo;
  }

  /* ---------- Enlaces de WhatsApp con mensaje ---------- */
  const prepararWa = () => $$('[data-wa-msg]').forEach(a => { a.href = waLink(a.dataset.waMsg); });
  prepararWa();

  /* ---------- Header: transparente arriba, cristal al bajar más de 10px ---------- */
  const siteHeader = $('#siteHeader');
  const actualizarHeader = () => siteHeader.classList.toggle('is-scrolled', window.scrollY > 10);
  let headerTicking = false;
  window.addEventListener('scroll', () => {
    if (headerTicking) return;
    headerTicking = true;
    requestAnimationFrame(() => { actualizarHeader(); headerTicking = false; });
  }, { passive: true });
  actualizarHeader();

  /* ---------- Menú móvil ---------- */
  const hamburger = $('#hamburgerMenu');
  const mobileNav = $('#mobileNav');
  const navOverlay = $('#navOverlay');
  const closeBtn = $('#closeMobileNav');
  function setMenu(abierto) {
    hamburger.classList.toggle('is-active', abierto);
    hamburger.setAttribute('aria-expanded', String(abierto));
    hamburger.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    mobileNav.classList.toggle('open', abierto);
    navOverlay.classList.toggle('open', abierto);
    mobileNav.setAttribute('aria-hidden', String(!abierto));
    mobileNav.inert = !abierto;
    document.documentElement.classList.toggle('nav-open', abierto);
    if (abierto) closeBtn.focus({ preventScroll: true });
  }
  hamburger.addEventListener('click', () => setMenu(!mobileNav.classList.contains('open')));
  closeBtn.addEventListener('click', () => { setMenu(false); hamburger.focus({ preventScroll: true }); });
  navOverlay.addEventListener('click', () => setMenu(false));
  $$('a', mobileNav).forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && mobileNav.classList.contains('open')) setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1259 && mobileNav.classList.contains('open')) setMenu(false); }, { passive: true });

  /* ---------- Estados: cargando / no encontrada ---------- */
  const cargando = $('#fichaCargando');
  const aviso = $('#fichaAviso');
  const contenido = $('#fichaContenido');

  function mostrarAviso(titulo, texto) {
    cargando.hidden = true;
    contenido.hidden = true;
    aviso.hidden = false;
    $('#fichaAvisoTitulo').textContent = titulo;
    $('#fichaAvisoTexto').textContent = texto;
    $('#fichaTitulo').textContent = titulo;
    document.title = `${titulo} | Demetrius Grupo Inmobiliario`;
    const robots = $('meta[name="robots"]');
    if (robots) robots.content = 'noindex, follow';
  }

  /* ---------- Galería ---------- */
  let fotos = [];
  let actual = 0;
  let textoAlt = '';
  const imgPrincipal = $('#galeriaImg');
  const miniaturas = $('#galeriaMiniaturas');
  const visor = $('#visor');
  const visorImg = $('#visorImg');

  function mostrarFoto(i) {
    if (!fotos.length) return;
    actual = (i + fotos.length) % fotos.length;
    const url = fotos[actual];
    const alt = `${textoAlt} — foto ${actual + 1} de ${fotos.length}`;
    if (!reduceMotion) imgPrincipal.classList.add('is-cambiando');
    imgPrincipal.onload = () => imgPrincipal.classList.remove('is-cambiando');
    imgPrincipal.src = url;
    imgPrincipal.alt = alt;
    visorImg.src = url;
    visorImg.alt = alt;
    const contador = fotos.length > 1 ? `${actual + 1} / ${fotos.length}` : '';
    $('#galeriaContador').textContent = contador;
    $('#visorContador').textContent = contador;
    $$('button', miniaturas).forEach((b, j) => b.setAttribute('aria-current', String(j === actual)));
    const mini = $$('button', miniaturas)[actual];
    if (mini && miniaturas.scrollWidth > miniaturas.clientWidth) {
      miniaturas.scrollTo({ left: mini.offsetLeft - miniaturas.clientWidth / 2 + mini.clientWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    // Precarga la siguiente para que el cambio sea inmediato
    if (fotos.length > 1) { const sig = new Image(); sig.src = fotos[(actual + 1) % fotos.length]; }
  }

  function prepararGaleria(lista) {
    fotos = lista;
    const unaSola = fotos.length < 2;
    ['#galeriaPrev', '#galeriaNext', '#visorPrev', '#visorNext'].forEach(s => { $(s).hidden = unaSola; });
    miniaturas.hidden = unaSola;
    if (!fotos.length) {
      $('#galeriaAbrir').replaceWith(el('div', { clase: 'galeria-sin-fotos' }, 'Fotos disponibles por WhatsApp'));
      return;
    }
    miniaturas.replaceChildren(...fotos.map((url, i) =>
      el('button', { type: 'button', 'aria-label': `Ver foto ${i + 1} de ${fotos.length}`, 'aria-current': String(i === 0) },
        el('img', { src: url, alt: '', loading: 'lazy', decoding: 'async' }))));
    $$('button', miniaturas).forEach((b, i) => b.addEventListener('click', () => mostrarFoto(i)));
    $('#galeriaPrev').addEventListener('click', () => mostrarFoto(actual - 1));
    $('#galeriaNext').addEventListener('click', () => mostrarFoto(actual + 1));
    $('#visorPrev').addEventListener('click', () => mostrarFoto(actual - 1));
    $('#visorNext').addEventListener('click', () => mostrarFoto(actual + 1));
    $('#galeriaAbrir').addEventListener('click', () => { if (typeof visor.showModal === 'function') visor.showModal(); });
    $('#visorCerrar').addEventListener('click', () => visor.close());
    visor.addEventListener('click', (e) => { if (e.target === visor) visor.close(); });
    document.addEventListener('keydown', (e) => {
      const enGaleria = visor.open || document.activeElement?.closest?.('.ficha-galeria');
      if (!enGaleria || fotos.length < 2) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); mostrarFoto(actual - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); mostrarFoto(actual + 1); }
    });
    // Deslizar con el dedo (galería y visor)
    [$('#galeriaPrincipal'), visor].forEach(zona => {
      let x0 = null, y0 = null;
      zona.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      zona.addEventListener('touchend', (e) => {
        if (x0 === null || fotos.length < 2) return;
        const dx = e.changedTouches[0].clientX - x0;
        const dy = e.changedTouches[0].clientY - y0;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) mostrarFoto(actual + (dx < 0 ? 1 : -1));
        x0 = y0 = null;
      }, { passive: true });
    });
    mostrarFoto(0);
  }

  /* ---------- Mapa (solo si el asesor marcó la ubicación) ---------- */
  function prepararMapa(p) {
    const bloque = $('#fichaMapaBloque');
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng) || typeof L === 'undefined') { bloque.hidden = true; return; }
    const iniciar = () => {
      const mapa = L.map('fichaMapa', { scrollWheelZoom: false }).setView([p.lat, p.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 18 }).addTo(mapa);
      const icono = L.divIcon({ className: 'demetrius-marker', html: '', iconSize: [16, 16], iconAnchor: [8, 16] });
      L.marker([p.lat, p.lng], { icon: icono, title: p.titulo, alt: p.titulo }).addTo(mapa);
    };
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entradas) => {
        if (entradas.some(en => en.isIntersecting)) { obs.disconnect(); iniciar(); }
      }, { rootMargin: '300px 0px' });
      obs.observe($('#fichaMapa'));
    } else {
      iniciar();
    }
  }

  /* ---------- Pintar la ficha ---------- */
  function pintar(p) {
    const vendida = P.esVendida(p);
    const zona = P.textoZona(p);
    const precio = P.textoPrecio(p);
    textoAlt = `${p.titulo} en ${zona}`;

    document.title = `${p.titulo} en ${zona} | Demetrius Grupo Inmobiliario`;
    const desc = $('meta[name="description"]');
    if (desc) desc.content = `${p.titulo} en ${zona}. ${precio}. ${P.datosCortos(p).join(' · ')}. Agenda tu visita con Demetrius Grupo Inmobiliario.`.slice(0, 300);

    $('#fichaMiga').textContent = p.titulo;
    $('#fichaTag').textContent = P.textoEtiqueta(p);
    $('#fichaTitulo').textContent = p.titulo;
    $('#fichaZona').textContent = zona;
    $('#fichaPrecioTop').textContent = vendida ? '' : precio;

    // Precios
    const precios = $('#fichaPrecios');
    precios.replaceChildren(...[
      vendida ? el('span', { clase: 'ficha-estado-venta' }, P.textoSello(p)) : null,
      el('p', { clase: 'ficha-precio' }, precio),
      p.operacion === 'venta renta' && p.precio_renta != null
        ? el('p', { clase: 'ficha-precio-sec' }, 'También en renta: ', el('b', {}, `${P.dinero(p.precio_renta)} / mes`))
        : null
    ].filter(Boolean));
    $('.ficha-info').classList.toggle('is-vendida', vendida);

    // Características
    $('#fichaDatos').replaceChildren(...P.caracteristicas(p).flatMap(([dt, dd]) => [
      el('div', {}, el('dt', {}, dt), el('dd', {}, dd))
    ]));

    // Descripción y amenidades
    $('#fichaDescripcion').textContent = p.descripcion || '';
    $('#fichaDescripcionBloque').hidden = !p.descripcion;
    const amenidades = Array.isArray(p.amenidades) ? p.amenidades : [];
    $('#fichaAmenidades').replaceChildren(...amenidades.map(a => el('li', {}, a)));
    $('#fichaAmenidadesBloque').hidden = !amenidades.length;

    // WhatsApp con la propiedad exacta (y el enlace a esta ficha)
    const mensaje = vendida
      ? `Hola Demetrius Grupo Inmobiliario, vi que ${p.estado === 'rentada' ? 'rentaron' : 'vendieron'}: ${p.titulo} en ${zona}. Busco algo similar, ¿tienen opciones disponibles?`
      : `Hola Demetrius Grupo Inmobiliario, me interesa: ${p.titulo} en ${zona} (${precio}). ¿Podemos agendar una visita? ${location.href}`;
    const wa = $('#fichaWa');
    wa.href = waLink(mensaje);
    wa.textContent = vendida ? 'Quiero algo similar →' : 'Me interesa →';
    $$('[data-wa-ficha]').forEach(a => { a.dataset.waMsg = mensaje; });
    prepararWa();

    // Galería
    $('#galeriaPrincipal').classList.toggle('is-vendida', vendida);
    const sello = $('#fichaSello');
    sello.hidden = !vendida;
    sello.textContent = P.textoSello(p);
    prepararGaleria((p.fotos || []).map(P.urlFoto));

    cargando.hidden = true;
    contenido.hidden = false;
    prepararMapa(p);
  }

  /* ---------- Cargar ---------- */
  const id = new URLSearchParams(location.search).get('id') || '';
  if (!P || !P.configurado) {
    mostrarAviso('No pudimos cargar la propiedad', 'La conexión con el catálogo no está configurada. Escríbenos por WhatsApp y con gusto te compartimos la ficha.');
  } else if (!P.esUuid(id)) {
    mostrarAviso('No encontramos esta propiedad', 'El enlace está incompleto. Revisa que lo hayas copiado completo o mira las propiedades disponibles.');
  } else {
    P.obtener(id)
      .then(p => {
        if (!p) mostrarAviso('Esta propiedad ya no está disponible', 'Es posible que ya no se encuentre publicada. Mira las propiedades disponibles o escríbenos y te ayudamos a encontrar algo similar.');
        else pintar(p);
      })
      .catch(() => mostrarAviso('No pudimos cargar la propiedad', 'Revisa tu conexión a internet y vuelve a intentarlo. Si sigue pasando, escríbenos por WhatsApp.'));
  }
})();
