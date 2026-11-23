/* Demetrius Grupo Inmobiliario — comparador de hasta 3 propiedades
   - Agrega el botón «Comparar» a cada tarjeta del catálogo (también a las que llegan del panel).
   - Con 2 o 3 elegidas, la barra flotante abre el modal con las propiedades lado a lado,
     con el precio en pesos y en dólares.
   Los precios salen de data-precio / data-precio-renta de cada tarjeta. Sin innerHTML. */
(() => {
  'use strict';
  const D = window.Demetrius;
  const Aj = window.DemetriusAjustes;
  const grid = document.getElementById('propGrid');
  const barra = document.getElementById('compararBarra');
  const modal = document.getElementById('modalComparar');
  if (!D || !Aj || !grid || !barra || !modal) return;
  const { $, $$, el, track } = D;
  const t = Aj.t;
  const tr = (texto) => (Aj.idioma === 'en' ? Aj.aIngles(texto) : texto);

  const MAXIMO = 3;
  const seleccion = []; // tarjetas elegidas, en el orden en que se eligieron
  const barraTexto = $('#compararBarraTexto');
  const abrir = $('#compararAbrir');
  const contenido = $('#compararContenido');
  const nota = $('#compararNota');

  const NS_SVG = 'http://www.w3.org/2000/svg';
  const TRAZO_BALANZA = 'M12 4v16M7 20h10M5 8h14M5 8l-3 6.2a3 3 0 0 0 6 0L5 8zM19 8l-3 6.2a3 3 0 0 0 6 0L19 8z';
  function iconoBalanza() {
    const svg = document.createElementNS(NS_SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const trazo = document.createElementNS(NS_SVG, 'path');
    trazo.setAttribute('d', TRAZO_BALANZA);
    svg.append(trazo);
    return svg;
  }

  /* ---------- Botón en cada tarjeta ---------- */
  const tituloDe = (card) => (($('h3', card) || {}).textContent || '').replace(/\s+/g, ' ').trim();
  const zonaDe = (card) => (($('.prop-zone', card) || {}).textContent || '').replace(/\s+/g, ' ').trim();

  function pintarBoton(card) {
    const boton = $('.comparar-btn', card);
    if (!boton) return;
    const elegida = seleccion.includes(card);
    boton.setAttribute('aria-pressed', String(elegida));
    boton.setAttribute('aria-label', `${t(elegida ? 'cmp.quitar' : 'cmp.boton')}: ${tituloDe(card)}, ${zonaDe(card)}`);
    $('span', boton).textContent = t(elegida ? 'cmp.elegida' : 'cmp.boton');
    card.classList.toggle('is-comparando', elegida);
  }

  function prepararTarjeta(card) {
    const media = $('.prop-media', card);
    if (!media || $('.comparar-btn', card)) return;
    const boton = el('button', { type: 'button', clase: 'comparar-btn', 'data-no-i18n': true }, iconoBalanza(), el('span', {}, ''));
    boton.addEventListener('click', () => alternar(card));
    media.append(boton);
    pintarBoton(card);
  }

  function alternar(card) {
    const i = seleccion.indexOf(card);
    if (i >= 0) seleccion.splice(i, 1);
    else if (seleccion.length >= MAXIMO) { D.mostrarToast(t('cmp.max')); return; }
    else seleccion.push(card);
    track('comparar_propiedad', { accion: i >= 0 ? 'quitar' : 'agregar', propiedad: tituloDe(card), zona: zonaDe(card) });
    actualizar();
  }

  /* ---------- Barra flotante ---------- */
  function pintarBarra() {
    const n = seleccion.length;
    barra.hidden = n === 0;
    barraTexto.textContent = n === 1 ? t('cmp.una') : t('cmp.varias', { n });
    abrir.disabled = n < 2;
    // Los botones flotantes de WhatsApp y llamada suben para no quedar debajo de la barra (css/modulos.css)
    document.documentElement.style.setProperty('--cmp-h', n ? `${barra.offsetHeight + 12}px` : '0px');
  }

  function actualizar() {
    // Las tarjetas que la página haya quitado o cambiado (catálogo del panel) salen de la selección
    for (let i = seleccion.length - 1; i >= 0; i--) if (!grid.contains(seleccion[i])) seleccion.splice(i, 1);
    $$('.prop-card', grid).forEach(card => { prepararTarjeta(card); pintarBoton(card); });
    pintarBarra();
    if (modal.open) {
      if (seleccion.length) pintarModal();
      else D.cerrarModal(modal);
    }
  }

  /* ---------- Modal lado a lado ---------- */
  const TIPOS = { casa: 'Casa', departamento: 'Departamento', terreno: 'Terreno', bodega: 'Bodega', terraza: 'Terraza', edificio: 'Edificio' };
  const OPERACIONES = { venta: 'Venta', renta: 'Renta', 'venta renta': 'Venta y renta' };
  const RAYA = '—';

  function datosDe(card) {
    const d = card.dataset;
    const operacion = (d.operacion || 'venta').trim();
    const soloRenta = operacion === 'renta';
    const venta = !soloRenta && Number(d.precio) > 0 ? Number(d.precio) : null;
    const renta = Number(d.precioRenta) > 0 ? Number(d.precioRenta) : (soloRenta && Number(d.precio) > 0 ? Number(d.precio) : null);
    const meta = $$('.prop-meta span', card).map(s => s.textContent.replace(/\s+/g, ' ').trim());
    // Tarjeta destacada: "2,720 m²" + "Construcción" vienen pegados en el HTML; aquí se separan con un espacio
    const destacados = $$('.destacada-datos div', card).map(x => $$('b, span', x).map(n => n.textContent.trim()).join(' '));
    const cta = $('.prop-cta', card) || $('.opcion', card);
    const img = $('.prop-img', card);
    const sello = $('.sello-vendida', card);
    return {
      card, titulo: tituloDe(card), zona: zonaDe(card),
      foto: img ? { src: img.currentSrc || img.src, alt: img.alt } : null,
      tipo: tr(TIPOS[d.tipo] || d.tipo || RAYA),
      operacion: tr(OPERACIONES[operacion] || operacion),
      venta, renta,
      recamaras: d.recamaras || RAYA,
      caracteristicas: (meta.length ? meta : destacados).join(' · ') || RAYA,
      estatus: d.vendida === 'si' ? (sello ? sello.textContent.trim() : t('cmp.vendida')) : t('cmp.disponible'),
      vendida: d.vendida === 'si',
      enlace: cta ? { href: cta.href, texto: $('.prop-cta', card) ? cta.textContent.trim() : t('cmp.meInteresa'), nueva: cta.target === '_blank' } : null
    };
  }

  const porMes = () => (Aj.idioma === 'en' ? '/ mo' : '/ mes');
  const pesos = (n, renta) => (n === null ? RAYA : `${Aj.fmtMXN(n)}${renta ? ` ${porMes()}` : ''}`);
  const dolares = (n, renta) => (n === null ? RAYA : `${Aj.fmtUSDdePesos(n)}${renta ? ` ${porMes()}` : ''}`);

  function pintarModal() {
    const props = seleccion.map(datosDe);
    const fila = (titulo, celda, clase) => el('tr', { clase: clase || null },
      el('th', { scope: 'row' }, titulo),
      props.map(p => el('td', {}, celda(p))));

    const encabezado = el('tr', {},
      el('td', { clase: 'comparar-esquina' }),
      props.map(p => {
        const quitar = el('button', { type: 'button', clase: 'comparar-quitar', 'aria-label': `${t('cmp.quitar')}: ${p.titulo}` }, '✕');
        quitar.addEventListener('click', () => alternar(p.card));
        return el('th', { scope: 'col', clase: 'comparar-prop' + (p.vendida ? ' is-vendida' : '') },
          quitar,
          p.foto ? el('img', { src: p.foto.src, alt: p.foto.alt, width: 400, height: 300, loading: 'lazy', decoding: 'async' }) : null,
          el('span', { clase: 'comparar-zona' }, p.zona),
          el('span', { clase: 'comparar-titulo' }, p.titulo));
      }));

    contenido.replaceChildren(el('table', { clase: `comparar-tabla comparar-tabla--${props.length}` },
      el('thead', {}, encabezado),
      el('tbody', {},
        fila(t('cmp.fEstatus'), p => el('span', { clase: 'comparar-estatus' + (p.vendida ? ' is-vendida' : '') }, p.estatus)),
        fila(t('cmp.fPrecioMxn'), p => (p.venta !== null ? pesos(p.venta) : pesos(p.renta, true)), 'comparar-precio'),
        fila(t('cmp.fPrecioUsd'), p => (p.venta !== null ? dolares(p.venta) : dolares(p.renta, true)), 'comparar-precio comparar-precio--usd'),
        props.some(p => p.venta !== null && p.renta !== null)
          ? fila(t('cmp.fRenta'), p => (p.venta !== null && p.renta !== null ? `${pesos(p.renta, true)} · ${dolares(p.renta, true)}` : RAYA))
          : null,
        fila(t('cmp.fOperacion'), p => p.operacion),
        fila(t('cmp.fTipo'), p => p.tipo),
        fila(t('cmp.fRecamaras'), p => p.recamaras),
        fila(t('cmp.fCaracteristicas'), p => p.caracteristicas),
        fila('', p => {
          if (!p.enlace) return RAYA;
          const a = el('a', { clase: 'cta-btn comparar-cta', href: p.enlace.href, target: p.enlace.nueva ? '_blank' : null, rel: p.enlace.nueva ? 'noopener noreferrer' : null, 'data-ubicacion': 'comparador' }, p.enlace.texto);
          a.addEventListener('click', () => track('comparador_ver_propiedad', { propiedad: p.titulo, zona: p.zona }));
          return a;
        }, 'comparar-acciones'))));
    nota.textContent = `${t('cmp.nota')} ${Aj.notaTipoCambio()}`;
  }

  abrir.addEventListener('click', () => {
    if (seleccion.length < 2) return;
    Aj.cargarTasa();
    pintarModal();
    D.abrirModal('modalComparar');
    track('abrir_comparador', { propiedades: seleccion.length });
  });
  const vaciar = () => { seleccion.length = 0; actualizar(); };
  $('#compararLimpiar').addEventListener('click', vaciar);
  $('#compararVaciar').addEventListener('click', vaciar);

  document.addEventListener('demetrius:catalogo', actualizar);
  window.addEventListener('resize', pintarBarra, { passive: true });
  Aj.alCambiar(actualizar);
  actualizar();
})();
