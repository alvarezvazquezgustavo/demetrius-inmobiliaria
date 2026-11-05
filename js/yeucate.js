/* Demetrius Grupo Inmobiliario — subpágina del desarrollo Yéucate */
(() => {
  'use strict';
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WHATSAPP = '5213351070944';
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
  $$('[data-wa-msg]').forEach(a => { a.href = waLink(a.dataset.waMsg); });

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

  /* ---------- Video de portada (respeta "reducir movimiento" y ahorro de datos) ---------- */
  const video = $('#yeuVideo');
  const videoBtn = $('#yeuVideoBtn');
  const ahorroDatos = navigator.connection && navigator.connection.saveData;
  function pausarVideo(pausar) {
    if (pausar) video.pause(); else video.play().catch(() => {});
    videoBtn.setAttribute('aria-pressed', String(pausar));
    videoBtn.textContent = pausar ? 'Reproducir video' : 'Pausar video';
  }
  if (reduceMotion || ahorroDatos) { video.removeAttribute('autoplay'); pausarVideo(true); }
  videoBtn.addEventListener('click', () => pausarVideo(!video.paused));

  /* ---------- Lotes (datos en js/yeucate-lotes.js) ---------- */
  const LOTES = window.YEUCATE.lotes.map(([n, m2, st, x, y]) => ({ n, m2, st, x, y }));
  $('#lotesFecha').textContent = window.YEUCATE.actualizado;

  const ESTATUS = {
    d: { nombre: 'Disponible', texto: 'Está disponible. Pídenos el precio, su plano y las opciones de pago.', cta: 'Consultar este lote' },
    a: { nombre: 'Apartado', texto: 'Este lote está apartado. Si se libera te avisamos; mientras, revisa los disponibles parecidos.', cta: 'Buscar un lote similar' },
    b: { nombre: 'Bloqueado', texto: 'Este lote no está a la venta por ahora. Te sugerimos opciones con superficie parecida.', cta: 'Buscar un lote similar' },
    v: { nombre: 'Vendido', texto: 'Este lote ya se vendió. Estos disponibles tienen una superficie parecida.', cta: 'Buscar un lote similar' }
  };
  const FILTROS = {
    todos: () => true,
    hasta650: l => l.m2 <= 650,
    '651a800': l => l.m2 > 650 && l.m2 <= 800,
    mas1000: l => l.m2 > 1000
  };
  const fmtM2 = (m2) => `${m2.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;
  const num = (n) => String(n).padStart(2, '0');
  const etiqueta = (l) => `Lote ${num(l.n)} · ${fmtM2(l.m2)} · ${ESTATUS[l.st].nombre}`;

  const lienzo = $('#planoLienzo');
  const rejilla = $('#lotesRejilla');
  const pins = new Map();
  const botones = new Map();
  let seleccionado = null;
  let filtro = 'todos';

  LOTES.forEach(l => {
    const pin = el('button', { type: 'button', clase: `yeu-pin st-${l.st}`, 'aria-label': etiqueta(l), 'data-tip': `Lote ${num(l.n)} · ${fmtM2(l.m2)}` });
    pin.style.left = `${l.x}%`;
    pin.style.top = `${l.y}%`;
    pin.addEventListener('click', () => seleccionar(l, true));
    lienzo.append(pin);
    pins.set(l.n, pin);
    const boton = el('button', { type: 'button', clase: `yeu-lote st-${l.st}`, 'aria-label': etiqueta(l), title: etiqueta(l), 'aria-pressed': 'false' }, num(l.n));
    boton.addEventListener('click', () => seleccionar(l, false));
    rejilla.append(boton);
    botones.set(l.n, boton);
  });

  // Contadores, porcentaje vendido y leyenda
  const conteo = { d: 0, a: 0, b: 0, v: 0 };
  LOTES.forEach(l => { conteo[l.st] += 1; });
  const porcentaje = Math.round(conteo.v / LOTES.length * 100);
  $('#lotesPorcentaje').textContent = `${porcentaje} %`;
  $('#lotesDisponibles').textContent = `${conteo.d} lotes disponibles`;
  $('#lotesBarra').setAttribute('aria-label', `${porcentaje} % de los lotes vendidos`);
  $('#lotesBarra span').style.width = `${porcentaje}%`;
  $$('#lotesLeyenda li').forEach(li => { const st = li.className.replace('st-', ''); $('b', li).textContent = conteo[st]; });
  $$('[data-cifra="vendido"]').forEach(s => { s.dataset.contar = porcentaje; s.textContent = porcentaje; });

  function aplicarFiltro() {
    const soloDisp = $('#soloDisponibles').checked;
    LOTES.forEach(l => {
      const visible = FILTROS[filtro](l) && (!soloDisp || l.st === 'd');
      pins.get(l.n).classList.toggle('atenuado', !visible);
      botones.get(l.n).classList.toggle('atenuado', !visible);
    });
  }
  $$('.yeu-chip').forEach(chip => chip.addEventListener('click', () => {
    filtro = chip.dataset.filtro;
    $$('.yeu-chip').forEach(c => { const activo = c === chip; c.classList.toggle('activo', activo); c.setAttribute('aria-pressed', String(activo)); });
    aplicarFiltro();
  }));
  $('#soloDisponibles').addEventListener('change', aplicarFiltro);

  /* ---------- Zoom del plano (sobre todo para celular) ---------- */
  const NIVELES_ZOOM = [1, 1.6, 2.2];
  const marco = $('#planoMarco');
  let nivelZoom = 0;
  function centrarEnPin(n, suave) {
    if (nivelZoom === 0) return;
    const pin = pins.get(n);
    marco.scrollTo({
      left: pin.offsetLeft - marco.clientWidth / 2,
      top: pin.offsetTop - marco.clientHeight / 2,
      behavior: suave && !reduceMotion ? 'smooth' : 'auto'
    });
  }
  function aplicarZoom(nuevo) {
    // Conserva el punto central del plano al acercar o alejar
    const cx = (marco.scrollLeft + marco.clientWidth / 2) / lienzo.offsetWidth;
    const cy = (marco.scrollTop + marco.clientHeight / 2) / lienzo.offsetHeight;
    nivelZoom = nuevo;
    const factor = NIVELES_ZOOM[nivelZoom];
    lienzo.style.setProperty('--zoom', factor);
    marco.className = `yeu-plano-marco zoom-${nivelZoom + 1}`;
    $('#zoomNivel').textContent = `${Math.round(factor * 100)} %`;
    $('#zoomMenos').disabled = nivelZoom === 0;
    $('#zoomMas').disabled = nivelZoom === NIVELES_ZOOM.length - 1;
    $('#zoomPista').textContent = nivelZoom === 0 ? 'Usa + para acercar el plano' : 'Desliza para moverte por el plano';
    requestAnimationFrame(() => {
      if (nivelZoom === 0) return marco.scrollTo(0, 0);
      if (seleccionado) return centrarEnPin(seleccionado.n, false);
      marco.scrollTo({ left: cx * lienzo.offsetWidth - marco.clientWidth / 2, top: cy * lienzo.offsetHeight - marco.clientHeight / 2 });
    });
  }
  $('#zoomMas').addEventListener('click', () => aplicarZoom(Math.min(nivelZoom + 1, NIVELES_ZOOM.length - 1)));
  $('#zoomMenos').addEventListener('click', () => aplicarZoom(Math.max(nivelZoom - 1, 0)));
  lienzo.addEventListener('transitionend', (e) => { if (e.propertyName === 'width' && seleccionado) centrarEnPin(seleccionado.n, true); });

  // Arrastrar con el mouse para moverse por el plano ampliado (en celular basta deslizar)
  let arrastre = null;
  marco.addEventListener('pointerdown', (e) => {
    if (nivelZoom === 0 || e.pointerType !== 'mouse' || e.button !== 0) return;
    arrastre = { x: e.clientX, y: e.clientY, left: marco.scrollLeft, top: marco.scrollTop, movido: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) arrastre.movido = true;
    marco.scrollLeft = arrastre.left - dx;
    marco.scrollTop = arrastre.top - dy;
  });
  let suprimirClick = false;
  window.addEventListener('pointerup', () => {
    if (arrastre && arrastre.movido) { suprimirClick = true; setTimeout(() => { suprimirClick = false; }, 0); }
    arrastre = null;
  });
  // Un arrastre no debe seleccionar el lote donde se suelta el mouse
  marco.addEventListener('click', (ev) => { if (suprimirClick) { ev.stopPropagation(); ev.preventDefault(); } }, { capture: true });

  function seleccionar(l, desdePlano) {
    if (seleccionado) {
      pins.get(seleccionado.n).classList.remove('activo');
      botones.get(seleccionado.n).classList.remove('activo');
      botones.get(seleccionado.n).setAttribute('aria-pressed', 'false');
    }
    seleccionado = l;
    pins.get(l.n).classList.add('activo');
    botones.get(l.n).classList.add('activo');
    botones.get(l.n).setAttribute('aria-pressed', 'true');

    const info = ESTATUS[l.st];
    const pill = $('#fichaEstatus');
    pill.textContent = info.nombre;
    pill.className = `yeu-pill st-${l.st}`;
    $('#fichaTitulo').textContent = `Lote ${num(l.n)}`;
    $('#fichaDato span').textContent = 'Superficie';
    $('#fichaM2').textContent = fmtM2(l.m2);
    $('#fichaTexto').textContent = info.texto;

    const cta = $('#fichaCta');
    cta.textContent = info.cta;
    cta.href = waLink(l.st === 'd'
      ? `Hola Demetrius Grupo Inmobiliario, me interesa el Lote ${num(l.n)} (${fmtM2(l.m2)}) de Yéucate en Chiquilistlán. ¿Me comparten precio y formas de pago?`
      : `Hola Demetrius Grupo Inmobiliario, vi que el Lote ${num(l.n)} de Yéucate no está disponible. Busco un lote similar de unos ${Math.round(l.m2)} m².`);

    // Sugerencias: los 3 disponibles con superficie más parecida
    const caja = $('#fichaSimilares');
    const lista = $('#fichaSimilaresLista');
    lista.replaceChildren();
    if (l.st !== 'd') {
      LOTES.filter(o => o.st === 'd').sort((a, b) => Math.abs(a.m2 - l.m2) - Math.abs(b.m2 - l.m2)).slice(0, 3)
        .forEach(o => {
          const b = el('button', { type: 'button', clase: 'yeu-similar' }, `Lote ${num(o.n)} · ${fmtM2(o.m2)}`);
          b.addEventListener('click', () => seleccionar(o, false));
          lista.append(b);
        });
    }
    caja.hidden = l.st === 'd';

    if (!desdePlano) centrarEnPin(l.n, true);

    const ficha = $('#loteFicha');
    ficha.classList.remove('cambio');
    void ficha.offsetWidth;
    ficha.classList.add('cambio');
    if (!desdePlano && window.innerWidth <= 980) ficha.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  }

  /* ---------- Visor de fotos ---------- */
  const visor = $('#visor');
  const fotos = $$('.yeu-foto-btn').map(b => ({ img: $('img', b), texto: $('figcaption', b.closest('figure')).textContent }));
  let fotoActual = 0;
  function mostrarFoto(i) {
    fotoActual = (i + fotos.length) % fotos.length;
    const f = fotos[fotoActual];
    $('#visorImg').src = f.img.currentSrc || f.img.src;
    $('#visorImg').alt = f.img.alt;
    $('#visorTexto').textContent = `${f.texto} · ${fotoActual + 1} de ${fotos.length}`;
  }
  $$('.yeu-foto-btn').forEach(b => b.addEventListener('click', () => {
    mostrarFoto(Number(b.dataset.indice));
    if (typeof visor.showModal === 'function') visor.showModal();
  }));
  $('#visorCerrar').addEventListener('click', () => visor.close());
  $('#visorPrevia').addEventListener('click', () => mostrarFoto(fotoActual - 1));
  $('#visorSiguiente').addEventListener('click', () => mostrarFoto(fotoActual + 1));
  visor.addEventListener('click', (e) => { if (e.target === visor) visor.close(); });
  visor.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') mostrarFoto(fotoActual - 1);
    if (e.key === 'ArrowRight') mostrarFoto(fotoActual + 1);
  });

  /* ---------- Copiar coordenadas ---------- */
  const copiar = $('#copiarCoords');
  copiar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copiar.dataset.coords);
      copiar.textContent = 'Coordenadas copiadas ✓';
    } catch {
      copiar.textContent = copiar.dataset.coords;
    }
    setTimeout(() => { copiar.textContent = 'Copiar coordenadas'; }, 2600);
  });

  /* ---------- Mapa de la entrada (Leaflet), se carga al acercarse ---------- */
  const ENTRADA = [20.0842, -103.8554];
  const contMapa = $('#mapaYeucate');
  let mapaListo = false;
  function crearMapa() {
    if (mapaListo || typeof L === 'undefined') return;
    mapaListo = true;
    contMapa.replaceChildren();
    const mapa = L.map(contMapa, { scrollWheelZoom: false }).setView(ENTRADA, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(mapa);
    const icono = L.divIcon({ className: 'yeu-marker', html: '', iconSize: [30, 30], iconAnchor: [15, 15] });
    const popup = el('div', { clase: 'yeu-popup' }, el('b', {}, 'Entrada a Yéucate'), el('span', {}, '20.08420° N, 103.85540° O'));
    L.marker(ENTRADA, { icon: icono, title: 'Entrada a Yéucate' }).addTo(mapa).bindPopup(popup).openPopup();
    mapa.on('click', () => mapa.scrollWheelZoom.enable());
  }
  if ('IntersectionObserver' in window) {
    const obsMapa = new IntersectionObserver((entradas) => {
      if (entradas.some(en => en.isIntersecting)) { crearMapa(); obsMapa.disconnect(); }
    }, { rootMargin: '300px 0px' });
    obsMapa.observe(contMapa);
  } else crearMapa();

  /* ---------- Contadores animados y aparición al hacer scroll ---------- */
  function contar(nodo) {
    const meta = Number(nodo.dataset.contar);
    const inicio = performance.now();
    const paso = (t) => {
      const p = Math.min((t - inicio) / 1400, 1);
      nodo.textContent = Math.round(meta * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }
  if (!reduceMotion && 'IntersectionObserver' in window) {
    $$('[data-contar]').forEach(contar);
    const elementos = $$('.yeu-head, .yeu-intro-texto, .yeu-intro-foto, .yeu-servicio, .yeu-avance, .yeu-plano, .yeu-panel, .yeu-foto, .yeu-compra-card, .yeu-pueblo-foto, .yeu-pueblo-texto, .yeu-mapa, .yeu-ubicacion-card, .yeu-faq-item, .yeu-final-caja');
    elementos.forEach(e => e.classList.add('reveal'));
    const obs = new IntersectionObserver((entradas) => {
      entradas.filter(en => en.isIntersecting).forEach((en, i) => {
        obs.unobserve(en.target);
        en.target.style.setProperty('--reveal-delay', `${Math.min(i, 5) * 90}ms`);
        en.target.classList.add('is-visible');
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    elementos.forEach(e => obs.observe(e));
  }
})();
