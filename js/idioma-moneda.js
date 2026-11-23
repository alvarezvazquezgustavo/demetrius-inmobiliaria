/* Demetrius Grupo Inmobiliario — moneda (MXN / USD), idioma (es MX / en US) y «Buscar al mover el mapa»
   Sin recargar la página y sin innerHTML.

   Cómo traduce:
   - Los elementos con data-i18n="clave" (y data-i18n-placeholder / data-i18n-aria) toman su texto de
     DICCIONARIO_I18N (js/i18n-en.js). El español siempre es el que está escrito en el HTML.
   - El resto de los textos se busca en TEXTOS_I18N por su texto en español; si no está, se queda en español.
   - Lo que la página escribe después (catálogo del panel, mensajes, mapa) se traduce solo al aparecer.
   - No se traducen los modales legales, las reseñas de clientes ni lo marcado con data-no-i18n.

   Cómo convierte:
   - Solo cambia el texto de los precios (.prop-price, opciones de presupuesto, mapa). Los data-precio,
     los filtros y los mensajes de WhatsApp siguen en pesos: el precio oficial es en Moneda Nacional. */
(() => {
  'use strict';
  const D = window.Demetrius;
  if (!D) return;
  const { $, $$, el } = D;
  const AJUSTES = window.DEMETRIUS_AJUSTES || {};
  const DICC = window.DICCIONARIO_I18N || { es: {}, en: {} };
  const TEXTOS = window.TEXTOS_I18N || { en: {} };
  const PATRONES = window.PATRONES_I18N || { en: [], precios: [] };

  const CLAVE_IDIOMA = 'demetrius_idioma';
  const CLAVE_MONEDA = 'demetrius_moneda';
  const CLAVE_TASA = 'demetrius_tasa_usd';
  const URL_TASA = 'https://open.er-api.com/v6/latest/USD';
  const RESPALDO = Number(AJUSTES.FALLBACK_USD_MXN) > 0 ? Number(AJUSTES.FALLBACK_USD_MXN) : 20;
  const HORAS_CACHE = 12;

  const leer = (k) => { try { return window.localStorage.getItem(k); } catch (e) { return null; } };
  const guardar = (k, v) => { try { window.localStorage.setItem(k, v); } catch (e) { /* almacenamiento no disponible */ } };

  const estado = {
    idioma: leer(CLAVE_IDIOMA) === 'en' ? 'en' : 'es',
    moneda: leer(CLAVE_MONEDA) === 'USD' ? 'USD' : 'MXN',
    tasa: RESPALDO,      // pesos por dólar
    tasaEnVivo: false,   // false = valor de respaldo
    tasaFecha: ''        // fecha del tipo de cambio (texto ISO)
  };

  /* =========================================================
     TEXTOS
     ========================================================= */
  // t('clave', { n: 3 }) → texto en el idioma activo; las llaves {n} se sustituyen
  function t(clave, vars) {
    let texto = (estado.idioma === 'en' ? DICC.en[clave] : undefined);
    if (texto === undefined) texto = DICC.es[clave];
    if (texto === undefined) texto = clave;
    return vars ? texto.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m)) : texto;
  }

  // Español → inglés por texto exacto (sin importar espacios de más) o por patrón
  function aIngles(texto) {
    const partes = /^(\s*)([\s\S]*?)(\s*)$/.exec(texto);
    const nucleo = partes[2].replace(/\s+/g, ' ');
    if (!nucleo) return texto;
    const directo = TEXTOS.en[nucleo];
    if (directo !== undefined) return partes[1] + directo + partes[3];
    for (const [patron, reemplazo] of PATRONES.en) {
      if (patron.test(nucleo)) return partes[1] + nucleo.replace(patron, reemplazo) + partes[3];
    }
    return texto;
  }

  /* =========================================================
     IMPORTES
     ========================================================= */
  const numero = (n, dec = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const aDolares = (pesos) => Number(pesos) / estado.tasa;
  const aPesos = (dolares) => Number(dolares) * estado.tasa;
  // "$3,199,000 M.N." (en inglés: "$3,199,000 MXN") y "US$159,950"
  const fmtMXN = (pesos, dec = 0) => `$${numero(pesos, dec)} ${estado.idioma === 'en' ? 'MXN' : 'M.N.'}`;
  const fmtUSD = (dolares) => `US$${numero(Math.round(dolares))}`;
  const fmtUSDdePesos = (pesos) => fmtUSD(aDolares(pesos));

  // Cambia cada importe en pesos de un texto por su equivalente en dólares: "$3,199,000.00 M.N." → "US$159,950"
  const RE_IMPORTE = /\$\s?(\d[\d,']*(?:\.\d+)?)(\s*M\.N\.?)?/g;
  function convertirImportes(texto) {
    return texto.replace(RE_IMPORTE, (todo, cifra) => {
      const n = Number(cifra.replace(/[,']/g, ''));
      return Number.isFinite(n) ? fmtUSD(aDolares(n)) : todo;
    });
  }

  // Texto de un precio en la moneda y el idioma activos
  function textoPrecio(es) {
    let texto = es;
    if (estado.moneda === 'USD') texto = convertirImportes(texto);
    if (estado.idioma === 'en') {
      const directo = aIngles(texto);
      if (directo !== texto) return directo;
      (PATRONES.precios || []).forEach(([patron, reemplazo]) => { texto = texto.replace(patron, reemplazo); });
    }
    return texto;
  }

  // Nota del tipo de cambio que se muestra junto a cualquier importe en dólares
  function fechaCorta(iso) {
    const f = iso ? new Date(iso) : null;
    if (!f || Number.isNaN(f.getTime())) return '';
    return f.toLocaleDateString(estado.idioma === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function notaTipoCambio() {
    const tasa = numero(estado.tasa, 2);
    if (!estado.tasaEnVivo) return t('tc.respaldo', { tasa });
    return t('tc.vivo', { tasa, fecha: fechaCorta(estado.tasaFecha) });
  }

  // Lee un importe escrito por la persona ("3,000,000", "$3 000 000.50") → número, o NaN
  function aNumero(texto) {
    const limpio = String(texto || '').replace(/[^\d.]/g, '');
    return limpio && /^\d*\.?\d*$/.test(limpio) ? Number(limpio) : NaN;
  }

  /* =========================================================
     TIPO DE CAMBIO DEL DÍA (con valor de respaldo)
     ========================================================= */
  let promesaTasa = null;
  function fijarTasa(tasa, fecha) {
    estado.tasa = tasa;
    estado.tasaEnVivo = true;
    estado.tasaFecha = fecha || '';
    aplicarTodo('tasa');
  }
  // Se pide solo cuando hace falta (dólares activos, calculadoras o comparador a la vista) y se guarda 12 horas
  function cargarTasa() {
    if (promesaTasa) return promesaTasa;
    try {
      const guardada = JSON.parse(leer(CLAVE_TASA) || 'null');
      if (guardada && guardada.tasa > 5 && guardada.tasa < 100 && Date.now() - guardada.cuando < HORAS_CACHE * 3600000) {
        fijarTasa(guardada.tasa, guardada.fecha);
        promesaTasa = Promise.resolve(estado.tasa);
        return promesaTasa;
      }
    } catch (e) { /* caché ilegible: se vuelve a pedir */ }
    promesaTasa = fetch(URL_TASA, { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('sin respuesta'))))
      .then(datos => {
        const tasa = Number(datos && datos.rates && datos.rates.MXN);
        if (!(tasa > 5 && tasa < 100)) throw new Error('tipo de cambio fuera de rango');
        const fecha = datos.time_last_update_unix ? new Date(datos.time_last_update_unix * 1000).toISOString() : new Date().toISOString();
        guardar(CLAVE_TASA, JSON.stringify({ tasa, fecha, cuando: Date.now() }));
        fijarTasa(tasa, fecha);
        return tasa;
      })
      .catch(() => { promesaTasa = null; return estado.tasa; }); // sin conexión: se queda el valor de respaldo
    return promesaTasa;
  }

  /* =========================================================
     MOTOR: recorre la página y pone cada texto en el idioma y la moneda activos
     ========================================================= */
  const SIN_TRADUCIR = '[data-no-i18n], [data-i18n], script, style, noscript, #modalTerminos, #modalPrivacidad, #resenasLista, .leaflet-control-container';
  const SON_PRECIOS = '.prop-price, .opcion-precio, .popup-price, #presupuestoSelect, #conPresupuesto';
  const ATRIBUTOS = ['placeholder', 'aria-label', 'title', 'label'];

  const originalTexto = new WeakMap();    // nodo de texto → { es, mostrado }
  const originalClave = new WeakMap();    // elemento con data-i18n → texto en español
  const originalAtributo = new WeakMap(); // elemento → { atributo: { es, mostrado } }
  const enDefecto = () => estado.idioma === 'es' && estado.moneda === 'MXN';

  function ponerTexto(nodo) {
    const padre = nodo.parentElement;
    if (!padre || padre.closest(SIN_TRADUCIR)) return;
    const actual = nodo.nodeValue;
    let reg = originalTexto.get(nodo);
    if (!reg) {
      if (!actual.trim()) return;
      reg = { es: actual, mostrado: actual };
      originalTexto.set(nodo, reg);
    } else if (actual !== reg.mostrado) {
      reg.es = actual; // la página escribió un texto nuevo (siempre en español)
    }
    const esPrecio = !!padre.closest(SON_PRECIOS);
    let nuevo = reg.es;
    if (esPrecio) nuevo = textoPrecio(reg.es);
    else if (estado.idioma === 'en') nuevo = aIngles(reg.es);
    reg.mostrado = nuevo;
    if (actual !== nuevo) nodo.nodeValue = nuevo;
  }

  function ponerClave(elemento) {
    if (elemento.closest('[data-no-i18n]')) return;
    let es = originalClave.get(elemento);
    if (es === undefined) { es = elemento.textContent; originalClave.set(elemento, es); }
    let nuevo = es;
    if (estado.idioma === 'en') {
      const en = DICC.en[elemento.dataset.i18n];
      nuevo = en !== undefined ? en : aIngles(es);
    }
    if (elemento.textContent !== nuevo) elemento.textContent = nuevo;
  }

  function ponerAtributos(elemento) {
    if (elemento.closest('[data-no-i18n], #modalTerminos, #modalPrivacidad, #resenasLista')) return;
    let reg = originalAtributo.get(elemento);
    ATRIBUTOS.forEach(atributo => {
      if (!elemento.hasAttribute(atributo)) return;
      const actual = elemento.getAttribute(atributo);
      if (!reg) { reg = {}; originalAtributo.set(elemento, reg); }
      if (!reg[atributo]) reg[atributo] = { es: actual, mostrado: actual };
      else if (actual !== reg[atributo].mostrado) reg[atributo].es = actual;
      const clave = atributo === 'placeholder' ? elemento.dataset.i18nPlaceholder : (atributo === 'aria-label' ? elemento.dataset.i18nAria : undefined);
      let nuevo = reg[atributo].es;
      if (estado.idioma === 'en') {
        const en = clave !== undefined ? DICC.en[clave] : undefined;
        nuevo = en !== undefined ? en : aIngles(reg[atributo].es);
      }
      reg[atributo].mostrado = nuevo;
      if (actual !== nuevo) elemento.setAttribute(atributo, nuevo);
    });
  }

  const SELECTOR_ATRIBUTOS = '[placeholder], [aria-label], [title], optgroup[label]';
  function recorrer(raiz) {
    if (raiz.nodeType === Node.TEXT_NODE) { ponerTexto(raiz); return; }
    if (raiz.nodeType !== Node.ELEMENT_NODE) return;
    if (raiz.matches('[data-i18n]')) ponerClave(raiz);
    $$('[data-i18n]', raiz).forEach(ponerClave);
    if (raiz.matches(SELECTOR_ATRIBUTOS)) ponerAtributos(raiz);
    $$(SELECTOR_ATRIBUTOS, raiz).forEach(ponerAtributos);
    const paseo = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    let nodo = paseo.nextNode();
    while (nodo) { ponerTexto(nodo); nodo = paseo.nextNode(); }
  }

  // Las opciones sin atributo value usan su texto como valor: se fija en español antes de traducir,
  // para que los filtros y los mensajes de WhatsApp sigan recibiendo el mismo valor de siempre.
  function fijarValoresDeOpciones(raiz = document) {
    $$('option:not([value])', raiz).forEach(opcion => opcion.setAttribute('value', opcion.textContent));
  }

  const oyentes = new Set();
  let primeraVez = true;
  function aplicarTodo(motivo) {
    document.documentElement.lang = estado.idioma === 'en' ? 'en' : 'es-MX';
    // En español y en pesos la página queda tal como está escrita: no hay nada que recorrer la primera vez
    if (!(primeraVez && enDefecto())) {
      fijarValoresDeOpciones();
      recorrer(document.body);
    }
    primeraVez = false;
    pintarMenu();
    pintarNotaCatalogo();
    oyentes.forEach(fn => { try { fn(motivo); } catch (e) { /* un módulo falló: los demás siguen */ } });
    document.dispatchEvent(new CustomEvent('demetrius:ajustes', { detail: { motivo } }));
  }

  // Lo que la página agrega o cambia después (tarjetas del panel, mensajes, ventanas del mapa)
  new MutationObserver(cambios => {
    if (enDefecto()) return;
    cambios.forEach(cambio => {
      if (cambio.type === 'characterData') ponerTexto(cambio.target);
      else if (cambio.type === 'attributes') ponerAtributos(cambio.target);
      else cambio.addedNodes.forEach(nodo => {
        if (nodo.nodeType === Node.ELEMENT_NODE) fijarValoresDeOpciones(nodo);
        recorrer(nodo);
      });
    });
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });

  /* =========================================================
     MENÚ DEL ENCABEZADO (🌐 ES.MXN)
     ========================================================= */
  const boton = $('#ajustesBtn');
  const menu = $('#ajustesMenu');
  const etiqueta = $('#ajustesEtiqueta');

  function pintarMenu() {
    if (!boton) return;
    etiqueta.textContent = `${estado.idioma.toUpperCase()}.${estado.moneda}`;
    $$('[data-moneda]', menu).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.moneda === estado.moneda)));
    $$('[data-idioma]', menu).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.idioma === estado.idioma)));
  }
  function abrirMenu(abierto) {
    menu.hidden = !abierto;
    boton.setAttribute('aria-expanded', String(abierto));
    if (abierto) cargarTasa();
  }
  if (boton && menu) {
    boton.addEventListener('click', (e) => { e.stopPropagation(); abrirMenu(menu.hidden); });
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      const opcion = e.target.closest('.ajustes-opcion');
      if (!opcion) return;
      if (opcion.dataset.moneda) fijarMoneda(opcion.dataset.moneda);
      if (opcion.dataset.idioma) fijarIdioma(opcion.dataset.idioma);
    });
    document.addEventListener('click', () => { if (!menu.hidden) abrirMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) { abrirMenu(false); boton.focus({ preventScroll: true }); }
    });
  }

  function fijarMoneda(moneda) {
    const nueva = moneda === 'USD' ? 'USD' : 'MXN';
    if (nueva === estado.moneda) return;
    estado.moneda = nueva;
    guardar(CLAVE_MONEDA, nueva);
    aplicarTodo('moneda');
    if (nueva === 'USD') cargarTasa();
    D.track('cambiar_moneda', { moneda: nueva });
  }
  function fijarIdioma(idioma) {
    const nuevo = idioma === 'en' ? 'en' : 'es';
    if (nuevo === estado.idioma) return;
    estado.idioma = nuevo;
    guardar(CLAVE_IDIOMA, nuevo);
    aplicarTodo('idioma');
    D.track('cambiar_idioma', { idioma: nuevo });
  }

  // Aviso bajo los filtros del catálogo cuando los precios se ven en dólares
  const notaCatalogo = $('#catalogTipoCambio');
  function pintarNotaCatalogo() {
    if (!notaCatalogo) return;
    notaCatalogo.hidden = estado.moneda !== 'USD';
    if (estado.moneda === 'USD') notaCatalogo.textContent = `${t('tc.catalogo')} ${notaTipoCambio()}`;
  }

  /* =========================================================
     «BUSCAR AL MOVER EL MAPA»
     Con el interruptor encendido, cada vez que se mueve o se acerca el mapa se listan las
     propiedades que quedan dentro del área visible y sus tarjetas se resaltan en el catálogo.
     ========================================================= */
  const interruptores = [$('#buscarAlMover'), $('#buscarAlMoverMapa')].filter(Boolean);
  const zonaResultado = $('#mapaZonaResultado');
  const zonaTotal = $('#mapaZonaTotal');
  const zonaLista = $('#mapaZonaLista');
  let buscarAlMover = false;
  let mapaConectado = null;

  const tarjetaDe = (p) => (p.id ? $(`.prop-card[data-id="${p.id}"]`) : (p.selector ? $(p.selector) : null));

  function actualizarZona() {
    const mapa = D.mapa.instancia;
    $$('.prop-card.en-mapa').forEach(card => card.classList.remove('en-mapa'));
    if (!zonaResultado) return;
    if (!buscarAlMover || !mapa) { zonaResultado.hidden = true; return; }
    const limites = mapa.getBounds();
    const dentro = D.mapa.marcadores.filter(p => limites.contains([p.lat, p.lng]));
    zonaTotal.textContent = `${dentro.length} ${t(dentro.length === 1 ? 'mapa.una' : 'mapa.varias')}`;
    zonaLista.replaceChildren(...dentro.map(p => {
      const card = tarjetaDe(p);
      if (card) card.classList.add('en-mapa');
      const fila = el('button', { type: 'button', clase: 'mapa-zona-item' },
        el('b', {}, estado.idioma === 'en' ? aIngles(p.titulo) : p.titulo),
        el('span', {}, p.zona),
        el('span', { clase: 'mapa-zona-precio' }, textoPrecio(p.precio)));
      fila.addEventListener('click', () => {
        if (card) D.catalogo.mostrarTarjeta(card);
        else if (p.marcador) p.marcador.openPopup();
      });
      return fila;
    }));
    zonaResultado.hidden = false;
  }

  function conectarMapa() {
    const mapa = D.mapa.instancia;
    if (!mapa || mapa === mapaConectado) return;
    mapaConectado = mapa;
    mapa.on('moveend', actualizarZona);
  }

  function fijarBuscarAlMover(activo, origen) {
    buscarAlMover = !!activo;
    interruptores.forEach(i => { i.checked = buscarAlMover; });
    conectarMapa();
    actualizarZona();
    if (buscarAlMover) {
      D.mostrarToast(t('mapa.activado'));
      // Desde el menú del encabezado se baja hasta el mapa, para que se vea el resultado
      if (origen && origen.id === 'buscarAlMover') {
        if (menu) abrirMenu(false);
        const seccion = $('#mapa');
        if (seccion) seccion.scrollIntoView({ behavior: D.scrollBehavior, block: 'start' });
      }
    }
    D.track('buscar_al_mover_mapa', { activo: buscarAlMover });
  }
  interruptores.forEach(i => i.addEventListener('change', () => fijarBuscarAlMover(i.checked, i)));
  document.addEventListener('demetrius:mapa', () => { conectarMapa(); actualizarZona(); });
  document.addEventListener('demetrius:catalogo', () => { if (buscarAlMover) actualizarZonaSoloTarjetas(); });
  // Al volver a pintar el catálogo solo se repone el resaltado (sin rehacer la lista)
  function actualizarZonaSoloTarjetas() {
    const mapa = D.mapa.instancia;
    if (!mapa) return;
    const limites = mapa.getBounds();
    D.mapa.marcadores.forEach(p => {
      const card = tarjetaDe(p);
      if (card) card.classList.toggle('en-mapa', limites.contains([p.lat, p.lng]));
    });
  }

  /* =========================================================
     PARA LOS DEMÁS MÓDULOS
     ========================================================= */
  window.DemetriusAjustes = Object.freeze({
    get idioma() { return estado.idioma; },
    get moneda() { return estado.moneda; },
    get tasa() { return estado.tasa; },
    get tasaEnVivo() { return estado.tasaEnVivo; },
    t, aIngles, textoPrecio, aNumero, numero,
    aDolares, aPesos, fmtMXN, fmtUSD, fmtUSDdePesos, notaTipoCambio, cargarTasa,
    fijarMoneda, fijarIdioma,
    // Texto en español de un elemento, aunque en pantalla esté traducido
    textoEs(elemento) {
      if (!elemento) return '';
      if (originalClave.has(elemento)) return originalClave.get(elemento);
      let texto = '';
      const paseo = document.createTreeWalker(elemento, NodeFilter.SHOW_TEXT);
      let nodo = paseo.nextNode();
      while (nodo) { const reg = originalTexto.get(nodo); texto += reg ? reg.es : nodo.nodeValue; nodo = paseo.nextNode(); }
      return texto.replace(/\s+/g, ' ').trim();
    },
    // fn(motivo) se llama cada vez que cambia la moneda, el idioma o el tipo de cambio
    alCambiar(fn) { oyentes.add(fn); }
  });

  aplicarTodo('inicio');
  if (estado.moneda === 'USD') cargarTasa();
})();
