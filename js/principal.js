/* Demetrius Grupo Inmobiliario — lógica principal del sitio */
  /* =========================================================
     CONFIGURACIÓN CENTRAL
     ========================================================= */
  const GA_MEASUREMENT_ID = "G-XXXXXXXXXX"; // ← Reemplaza con tu ID real de Google Analytics 4

  // Solo valores PÚBLICOS. Las llaves privadas (EasyBroker, etc.) viven en .env y se
  // usan desde una función serverless; nunca se escriben en este archivo.
  const ENV_CONFIG = Object.freeze({
    SITE_URL: "https://inmobiliariademetrius.com",
    BUSINESS_NAME: "Demetrius Grupo Inmobiliario",
    LEGAL_RESPONSIBLE: "Gerardo Yair Ocaña Vázquez",
    WHATSAPP_NUMBER: "5213351070944",
    PHONE_E164: "+523351070944",
    PHONE_DISPLAY: "(33) 5107-0944",
    CONTACT_EMAIL: "inmobiliriademetrius@gmail.com",
    GA_MEASUREMENT_ID: GA_MEASUREMENT_ID,
    COOKIE_CONSENT_KEY: "demetrius_cookie_consent",
    MAP_TILES_URL: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    EASYBROKER_PROXY_URL: "", // p. ej. "/.netlify/functions/easybroker" (la llave va en .env)
    MAPS_PUBLIC_KEY: "",      // solo si en el futuro usas un proveedor de mapas con llave pública restringida por dominio
    // Reseñas (Supabase). La URL y la llave PUBLICABLE son públicas por diseño: la seguridad la dan
    // las reglas RLS de supabase/resenas.sql. NUNCA pongas aquí la llave secreta / service_role.
    SUPABASE_URL: "",         // p. ej. "https://abcdefghijklmnop.supabase.co"
    SUPABASE_ANON_KEY: "",    // "Publishable key" (sb_publishable_…) o la llave "anon public" (eyJ…)
    RESENAS_POR_PAGINA: 6
  });

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior = reduceMotion ? 'auto' : 'smooth';
  const waLink = (mensaje) => `https://wa.me/${ENV_CONFIG.WHATSAPP_NUMBER}` + (mensaje ? `?text=${encodeURIComponent(mensaje)}` : '');

  const storage = {
    get(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { window.localStorage.setItem(key, value); } catch (e) { /* almacenamiento no disponible */ } }
  };

  // Construcción segura de DOM (nunca innerHTML): el('a', { clase, href, ... }, hijo1, hijo2…)
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
  const iconoVentanas = () => el('span', { clase: 'win' }, el('span'), el('span'), el('span'), el('span'));
  const enlaceExterno = (href, texto) => el('a', { href, target: '_blank', rel: 'noopener noreferrer' }, texto);

  // Sanitización de entradas: Unicode normalizado, sin caracteres de control ni invisibles
  // (incluye los de dirección bidi usados para disfrazar texto), espacios compactados y longitud máxima.
  const SALTO = String.fromCharCode(10);
  function limpiar(texto, max = 200, multilinea = false) {
    const visibles = Array.from(String(texto ?? '').normalize('NFC')).filter(c => {
      const n = c.codePointAt(0);
      if (n === 10) return multilinea;
      if (n === 9) return true;
      return !(n < 32 || (n >= 127 && n <= 159) || (n >= 0x200B && n <= 0x200F) || (n >= 0x202A && n <= 0x202E) || (n >= 0x2066 && n <= 0x2069) || n === 0xFEFF);
    }).join('');
    const lineas = visibles.split(SALTO).map(l => l.replace(/\s+/g, ' ').trim())
      .filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== ''));
    return (multilinea ? lineas.join(SALTO) : lineas.join(' ')).trim().slice(0, max);
  }
  const nombreValido = (v) => /^[\p{L}\p{M}][\p{L}\p{M} .'’-]{1,59}$/u.test(v);
  const telefonoValido = (v) => /^[+\d\s().-]{10,20}$/.test(v) && v.replace(/\D/g, '').length >= 10 && v.replace(/\D/g, '').length <= 13;
  const correoValido = (v) => v.length <= 100 && /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/.test(v);

  /* =========================================================
     GOOGLE ANALYTICS 4 + CONSENTIMIENTO DE COOKIES
     ========================================================= */
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }

  let analyticsActivo = false;
  const gaConfigurado = () => /^G-[A-Z0-9]{4,}$/.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX';
  const consentimiento = () => storage.get(ENV_CONFIG.COOKIE_CONSENT_KEY);

  function activarAnalytics() {
    if (!gaConfigurado()) return;
    if (analyticsActivo) { gtag('consent', 'update', { analytics_storage: 'granted' }); return; }
    analyticsActivo = true;
    gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
  }

  function desactivarAnalytics() {
    if (analyticsActivo) gtag('consent', 'update', { analytics_storage: 'denied' });
    // Elimina cookies _ga existentes
    document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(n => /^_ga/.test(n)).forEach(n => {
      const base = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = base;
      document.cookie = `${base}; domain=.${location.hostname.replace(/^www\./, '')}`;
    });
  }

  function track(evento, params = {}) {
    if (consentimiento() !== 'accepted') return;
    if (analyticsActivo) gtag('event', evento, params);
    else console.info('[GA4 pendiente de configurar]', evento, params);
  }

  const cookieBanner = $('#cookieBanner');
  function actualizarOffsetCookie() {
    const visible = !cookieBanner.hidden && cookieBanner.classList.contains('show');
    document.documentElement.style.setProperty('--cookie-h', visible ? `${cookieBanner.offsetHeight + 12}px` : '0px');
  }
  function mostrarCookieBanner() {
    cookieBanner.hidden = false;
    void cookieBanner.offsetWidth; // fuerza reflow para animar la entrada
    cookieBanner.classList.add('show');
    actualizarOffsetCookie();
  }
  function ocultarCookieBanner() {
    cookieBanner.classList.remove('show');
    document.documentElement.style.setProperty('--cookie-h', '0px');
    setTimeout(() => { if (!cookieBanner.classList.contains('show')) cookieBanner.hidden = true; }, 600);
  }
  $('#cookieAccept').addEventListener('click', () => {
    storage.set(ENV_CONFIG.COOKIE_CONSENT_KEY, 'accepted');
    activarAnalytics();
    ocultarCookieBanner();
  });
  $('#cookieReject').addEventListener('click', () => {
    storage.set(ENV_CONFIG.COOKIE_CONSENT_KEY, 'rejected');
    desactivarAnalytics();
    ocultarCookieBanner();
  });
  window.addEventListener('resize', actualizarOffsetCookie, { passive: true });

  if (consentimiento() === 'accepted') activarAnalytics();
  else if (consentimiento() !== 'rejected') setTimeout(mostrarCookieBanner, 900);

  /* =========================================================
     AVISO (TOAST)
     ========================================================= */
  const toast = $('#toast');
  let toastTimer;
  function mostrarToast(texto) {
    toast.textContent = texto;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4200);
  }

  /* =========================================================
     MODALES LEGALES
     ========================================================= */
  function sincronizarScrollModal() {
    document.documentElement.classList.toggle('modal-open', $$('dialog.legal-modal').some(d => d.open));
  }
  function abrirModal(id) {
    const dialogo = document.getElementById(id);
    if (!dialogo) return;
    $$('dialog.legal-modal[open]').forEach(d => { if (d !== dialogo) d.close(); });
    if (typeof dialogo.showModal === 'function') { if (!dialogo.open) dialogo.showModal(); }
    else dialogo.setAttribute('open', '');
    $('.legal-body', dialogo).scrollTop = 0;
    sincronizarScrollModal();
  }
  function cerrarModal(dialogo) {
    if (typeof dialogo.close === 'function') dialogo.close(); else dialogo.removeAttribute('open');
    sincronizarScrollModal();
  }
  $$('[data-modal-open]').forEach(el => el.addEventListener('click', (e) => {
    e.preventDefault();
    abrirModal(el.dataset.modalOpen);
  }));
  $$('dialog.legal-modal').forEach(dialogo => {
    $$('[data-modal-close]', dialogo).forEach(btn => btn.addEventListener('click', () => cerrarModal(dialogo)));
    dialogo.addEventListener('click', (e) => { if (e.target === dialogo) cerrarModal(dialogo); }); // clic fuera del panel
    dialogo.addEventListener('close', sincronizarScrollModal);
  });
  $$('[data-cookie-settings]').forEach(btn => btn.addEventListener('click', () => {
    $$('dialog.legal-modal[open]').forEach(cerrarModal);
    mostrarCookieBanner();
  }));
  const modalesPorHash = { '#aviso-privacidad': 'modalPrivacidad', '#terminos-y-condiciones': 'modalTerminos' };
  if (modalesPorHash[location.hash]) abrirModal(modalesPorHash[location.hash]);

  /* =========================================================
     HEADER + MENÚ MÓVIL (único)
     ========================================================= */
  const siteHeader = $('#siteHeader');
  let headerTicking = false;
  window.addEventListener('scroll', () => {
    if (headerTicking) return;
    headerTicking = true;
    requestAnimationFrame(() => { siteHeader.classList.toggle('is-scrolled', window.scrollY > 40); headerTicking = false; });
  }, { passive: true });

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

  // "Blog" lleva a las reseñas de la comunidad (ancla #blog dentro de #testimonios)

  /* =========================================================
     COLONIAS (buscador del Hero)
     ========================================================= */
  const colonias = {
    todos: { populares: [], resto: ["Todas las colonias"] },
    guadalajara: { populares: ["Providencia 1a Secc", "Providencia 2a Secc", "Providencia 3a Secc", "Providencia 4a Secc", "Providencia Sur", "Chapalita", "Residencial Chapalita", "Americana", "Lafayette", "Moderna", "Ladrón de Guevara", "Vallarta Norte", "Vallarta Poniente", "Vallarta San Jorge", "Vallarta San Lucas", "Vallarta Cuauhtémoc", "Country Club", "Colinas de San Javier", "Jardines Del Bosque Centro", "Jardines Del Bosque Norte", "Monraz", "Arcos Vallarta", "Chapultepec Country", "Seattle", "Santa Teresita", "Italia", "Italia Providencia", "Lomas de Guevara", "Lomas del Valle", "Verde Valle", "Guadalajara Centro"], resto: ["1 de Mayo", "5 de Mayo", "8 de Julio", "Agraria", "Agustín Yánez", "Alcalde Barranquitas", "Aldama Tetlán", "Aldrete", "Altavista de Guadalajara", "Ampliación Provincia", "Analco", "Arboledas Del Sur", "Arcos Sur", "Artesanos", "Atlas", "Ayuntamiento", "Balcones de Huentitán", "Barrio Mezquitan", "Belisario Domínguez", "Benito Juárez", "Bosques Del Boulevard", "Bosques de La Cantera", "Bosques de La Victoria", "Cantarranas", "Capilla de Jesús", "Circunvalación Américas", "Ciudad Universitaria", "Colinas de Huentitán", "Colomos Providencia", "Colonial Independencia", "Del Fresno", "Dr. Atl", "Echeverría", "El Dean", "El Mirador", "El Retiro", "El Rosario", "Emiliano Zapata", "Esperanza", "Estadio", "Ferrocarril", "Francisco Villa", "González Gallo", "Guadalajara Oriente", "Guadalupana Norte", "Hermosa Provincia", "Huentitán El Alto", "Huentitán El Bajo", "Independencia", "Insurgentes", "Jardines Alcalde", "Jardines Del Sur", "Jardines de Guadalupe", "Jardines de La Cruz", "Jardines de La Paz", "Jardines de Plaza Del Sol", "Jardines de San Francisco", "Jardines de Santa Isabel", "Jardines de los Escritores", "Jardines del Bosque Centro", "Jardines del Country", "La Aurora", "La Federacha", "La Florida", "La Loma", "La Nogalera", "La Normal", "La Perla", "Lagos de Oriente", "Las Américas", "Las Conchas", "Las Juntas", "Las Piedrotas", "Libertad", "Loma Linda", "Lomas Del Country", "Lomas Del Pedregal", "Lomas Independencia", "Lomas de Polanco", "Lomas de Providencia", "Lomas del Paraíso", "Mexicaltzingo", "Mezquitan", "Mezquitan Country", "Miraflores", "Monumental", "Morelos", "Niños Héroes", "Oblatos", "Obrera", "Obrera Centro", "Observatorio", "Olímpica", "Panorámica Huentitán", "Patria", "Plan de Ayala", "Polanco Oriente", "Popular", "Providencia 5a Secc", "Ramón López Velarde", "Rancho Blanco", "Real", "Residencial Del Bosque", "Residencial Victoria", "Revolución", "Río Verde Oblatos", "San Andrés", "San Antonio", "San Isidro", "San Joaquín", "San Martín", "San Rafael", "San Vicente", "Santa Cecilia", "Santa Elena Alcalde Poniente", "Santa María", "Santa Mónica", "Santa Rosa", "Talpita Oriente", "Tetlán", "Universitaria", "Vallarta Sur", "Valle Del Álamo", "Versalles", "Vicente Guerrero", "Villa Hermosa", "Villa La Victoria", "Villa Santa Rita", "Villas Del Country", "Villas Del Estadio", "Villaseñor", "Zona Industrial"] },
    zapopan: { populares: ["Puerta de Hierro", "Valle Real", "Ciudad Bugambilias", "Santa Margarita", "Santa Margarita Residencial", "Real Vallarta", "Base Aérea Militar", "Tesistán", "Puerta Del Roble", "Puerta del Valle", "Colinas de San Javier", "Royal Country", "Jardines Vallarta", "Prados Vallarta", "Vallarta Universidad", "Vallarta La Patria", "Chapalita Sur", "Chapalita Oriente", "Ciudad Del Sol", "Santa Isabel", "Residencial Victoria", "Villa Universitaria", "La Estancia", "Rinconada Del Valle", "Lomas de Zapopan", "Hacienda del Sol", "Bosques de Zapopan", "Coto Del Rey", "Real de Valdepeñas", "Puerta Real"], resto: ["12 de Diciembre", "27 de Septiembre", "Agraria", "Agraria Río Blanco", "Agua Fría", "Alamedas de Tesistán", "Altagracia", "Altamira", "Altavista Residencial", "Arboledas", "Arcos de Guadalupe", "Arcos de Zapopan", "Arenales Tapatíos", "Arrayanes", "Arroyo Hondo", "Atemajac Del Valle", "Atlas Chapalita", "Aves del Paraíso", "Ayamonte", "Azaleas Del Valle", "Balcones Del Sol", "Balcones de La Cantera", "Belenes U de G", "Bellavista", "Benito Juárez Norte", "Bosque Escondido", "Bosque Valdepeñas", "Bosques Del Centinela", "Bosques de San Isidro", "Bosques de la Primavera", "CUCEA", "Camichines Vallarta", "Camino Real", "Campestre Los Robles", "Campo Real", "Carlos Rivera", "Casa Grande", "Cañadas de San Lorenzo", "Chapalita Inn", "Chapalita de Occidente", "Ciudad Granja", "Ciudad Tepeyac", "Colinas Del Centinela", "Colinas Del Rey", "Colinas de Atemajac", "Colinas de La Primavera", "Colinas de Las Águilas", "Colinas de Tabachines", "Colinas de los Belenes", "Colli C.T.M.", "Colli Sitio", "Colomos Patria", "Constitución", "Constituyentes", "Coto Miraflores", "Crucero de La Mesa", "Cumbres", "División del Norte", "Don Bosco Vallarta", "El Bajío", "El Batan", "El Borrego", "El Bosque", "El Capullo", "El Carrizal", "El Centinela", "El Colli", "El Colli Ejidal", "El Fortín", "El Fresno", "El Rehilete", "El Tigre", "El Tizate", "El Vigía", "El Zapote", "El Álamo", "Emiliano Zapata", "Girasoles Acueducto", "Glorias Del Colli", "Gonzalez Ortega", "Guadalupe Inn", "Guadalupe Jardín", "Guadalupe Sur", "Hacienda Del Tepeyac", "Hacienda de Las Lomas", "Haciendas Del Valle", "Hogar de Atemajac", "Hogares", "Héroes Nacionales", "Indígena de Mezquitan", "Jacarandas", "Jardines Del Auditorio", "Jardines Del Sol", "Jardines Del Valle", "Jardines Del Vergel", "Jardines San Francisco", "Jardines Tapatíos", "Jardines Tepeyac", "Jardines Universidad", "Jardines de Chapalita", "Jardines de Guadalupe", "Jardines de La Esperanza", "Jardines de La Patria", "Jardines de La Primavera", "Jardines de Nuevo México", "Jardines de San Antonio", "Jardines de San Ignacio", "Jardines de Santa Margarita", "Jardines de Tabachines", "Jardines de la Cantera", "Jardines de los Belenes", "Jardines del Porvenir", "Jardín Real", "Jocotán", "José López Portillo", "La Arboleda", "La Aurora", "La Calma", "La Casita", "La Castilla", "La Cima", "La Coronilla", "La Experiencia", "La Favorita", "La Floresta Del Colli", "La Florida", "La Giralda", "La Grana", "La Granja", "La Higuera", "La Hoja Verde", "La Huerta", "La Joya", "La Laja", "La Loma", "La Magdalena", "La Martinica", "La Mojonera", "La Moraleja", "La Palmira", "La Palmita", "La Patria Universidad", "La Tuzania", "La Villa", "Lagos del Country", "Las Agujas", "Las Alamedas", "Las Cabañitas", "Las Flores", "Las Fuentes", "Las Higuerillas", "Las Águilas", "Lindavista", "Loma Blanca", "Loma Bonita", "Loma Real", "Lomas Altas", "Lomas Del Batan", "Lomas Del Bosque", "Lomas Del Centinela", "Lomas Del Colli", "Lomas Del Refugio", "Lomas Del Seminario", "Lomas Del Valle", "Lomas Del Vergel", "Lomas Universidad", "Lomas de Atemajac", "Lomas de Guadalupe", "Lomas de La Primavera", "Lomas de Miramar", "Lomas de San Isidro", "Lomas de Tabachines", "Lomas del Camino", "Los Abetos", "Los Alamitos", "Los Almendros", "Los Canteros", "Los Cerritos", "Los Girasoles", "Los Guayabos", "Los Jazmines", "Los Maestros", "Los Manzanos", "Los Palomos", "Los Paraísos", "Los Pinos", "Los Robles", "Marcelino Garcia Barragán", "Mariano Otero", "Mesa Colorada Oriente", "Mesa Colorada Poniente", "Mesa de los Ocotes", "Miguel Hidalgo", "Mirador Del Sol", "Mirador Escondido", "Mirador de La Cañada", "Mirador de San Isidro", "Miramar", "Nueva España", "Nueva Galicia", "Nueva Primavera", "Nuevo México", "Nuevo Vergel", "Paraísos Del Colli", "Parque Real", "Parque Regency", "Parque de La Castellana", "Patria", "Pedregal Zapopan", "Pedro Moreno", "Periodistas", "Pinar de La Calma", "Placita del Sol", "Prados Tepeyac", "Prados de Guadalupe", "Prados de San Ignacio", "Primavera Norte", "Puerta del Sol", "Puertas Del Tule", "Rancho Contento", "Real Cantabria", "Real Del Bosque", "Real Del Parque", "Real San Bernardo", "Residencial Cordilleras", "Residencial Loma Bonita", "Residencial Moctezuma", "Rinconada Auditorio", "Rinconada Del Sol", "Rinconada Guadalupe", "Rinconada San Isidro", "Rinconada Santa Catalina", "Rinconada de La Calma", "Rinconada del Mirador", "Rinconadas de las Palmas", "Rio Blanco", "San Bernardo", "San Francisco", "San Gilberto", "San Isidro", "San Isidro Ejidal", "San José del Bajío", "San Juan de Ocotan", "San Miguel de La Cañada", "San Wenceslao", "Santa Catalina", "Santa Engracia", "Santa Fe", "Santa Paula", "Seattle", "Tabachines", "Tepeyac", "U.A.G.", "Unidad Auditorio", "Unidad México", "Vallarta Cuauhtémoc", "Venustiano Carranza", "Vicente Guerrero", "Victor Hugo", "Vigusa", "Villa Coral", "Villa Magna", "Villas Alcalde", "Villas Del Centinela", "Villas Del Marques", "Villas Mariano Otero", "Villas de San Javier", "Villas de Zapopan", "Villas del Bosque", "Virreyes Residencial", "Vista Hermosa", "Zapopan Centro", "Zoquipan"] },
    tlaquepaque: { populares: ["Santa Anita", "Chulavista", "El Álamo", "Centro Histórico", "Las Juntas", "Camino Real", "Verde Valle", "La Aurora", "El Vergel", "Toluquilla", "San Martín de las Flores", "El Manantial", "Santa María Tequepexpan", "Constitución", "La Guadalupana", "Nuevo Milenio", "Villas de Guadalupe", "San Pedrito", "Eucaliptos", "El Paraíso"], resto: ["Alamo", "Aztlán", "El Colorado", "El Rocío", "El Rosario", "El Zalate", "Ferrocarril", "Fovissste", "Guadalupana", "Jardines de Santa Anita", "La Duraznera", "Las Liebres", "Lomas de Zoquipan", "Los Puestos", "Nueva Santa María", "San Sebastianito", "Santa Cruz del Valle"] },
    tonala: { populares: ["Loma Dorada", "Real del Sol", "Jardines del Sol", "Tonalá Centro", "Urbi Villa del Rey", "Lomas del Camichín", "Puente Grande", "Buena Vista", "Santa Paula", "Zalatitán"], resto: ["Coyula", "El Rosario", "El Vado", "Ex-Hacienda El Rosario", "Jauja", "La Ladrillera", "Las Juntitas", "Loma Bonita", "Loma Bonita Ejidal", "San Gaspar de las Flores", "Tateposco"] },
    tlajomulco: { populares: ["Hacienda Santa Fe", "Santa Fe", "San Agustín", "Santa Anita", "Cajititlán", "Real del Bosque", "Valle Dorado", "La Tijera", "El Palomar", "Lomas de Tejeda"], resto: ["La Alameda", "La Loma", "La Providencia", "Lomas de San Agustín", "Los Gavilanes", "Nuevo México", "San Isidro Mazatepec", "San Miguel Cuyutlán", "San Sebastián El Grande", "Santa Cruz de las Flores"] },
    elsalto: { populares: [], resto: ["Centro", "El Verde", "Ex-Hacienda El Vigía", "La Capilla", "Las Pintas", "Nueva Galicia", "Santa Cruz del Valle"] },
    juanacatlan: { populares: [], resto: ["Centro", "El Zapote", "La Vega", "Las Pilas", "Ojo de Agua"] },
    chapala: { populares: [], resto: ["Ajijic", "Centro", "Chula Vista", "El Chante", "La Floresta", "Riberas del Pilar", "San Antonio Tlayacapan"] },
    jocotepec: { populares: [], resto: ["Centro", "El Chante", "San Cristóbal Zapotitlán", "San Juan Cosalá", "San Pedro Tesistán"] },
    mazamitla: { populares: [], resto: ["Centro", "El Escondite", "La Cofradía", "Los Encinos"] },
    tapalpa: { populares: [], resto: ["Centro", "Fraccionamiento Los Sabinos", "Las Piedrotas", "San Miguel"] },
    vallarta: { populares: [], resto: ["5 de Diciembre", "Amapas", "Conchas Chinas", "El Pitillal", "Fluvial Vallarta", "Las Glorias", "Marina Vallarta", "Versalles", "Zona Romántica"] }
  };

  const municipioSelect = document.getElementById('municipioSelect');
  const coloniaSelect = document.getElementById('coloniaSelect');
  const ebMunicipioSelect = document.getElementById('ebMunicipioSelect');
  const ebColoniaSelect = document.getElementById('ebColoniaSelect');

  function construirOpcionesColonia(municipioValue){
    const frag = document.createDocumentFragment();
    frag.append(el('option', { value: '' }, 'Todas las colonias'));
    const data = colonias[municipioValue];
    if(municipioValue === 'todos' || !data) return frag;
    if(data.populares && data.populares.length){
      frag.append(el('optgroup', { label: '★ Más buscadas' }, data.populares.map(c => el('option', {}, c))));
    }
    if(data.resto && data.resto.length){
      const groups = {};
      data.resto.forEach(c => {
        const letra = c.normalize('NFD').replace(/[̀-ͯ]/g,'')[0].toUpperCase();
        if(!groups[letra]) groups[letra] = [];
        groups[letra].push(c);
      });
      Object.keys(groups).sort().forEach(letra => {
        frag.append(el('optgroup', { label: letra }, groups[letra].map(c => el('option', {}, c))));
      });
    }
    return frag;
  }

  function actualizarColonias(){
    if (municipioSelect && coloniaSelect) coloniaSelect.replaceChildren(construirOpcionesColonia(municipioSelect.value));
  }

  function actualizarColoniasEb(){
    // Sección EasyBroker aún no publicada: solo se ejecuta si existen sus selectores
    if (ebMunicipioSelect && ebColoniaSelect) ebColoniaSelect.replaceChildren(construirOpcionesColonia(ebMunicipioSelect.value));
  }

  if (municipioSelect) municipioSelect.addEventListener('change', actualizarColonias);
  actualizarColonias();

  if (ebMunicipioSelect && ebColoniaSelect) {
    ebMunicipioSelect.addEventListener('change', actualizarColoniasEb);
    actualizarColoniasEb();
  }

  document.getElementById('operacionSelect').addEventListener('change', function(){
    if(this.value === 'vender'){
      document.getElementById('vender').scrollIntoView({behavior: scrollBehavior});
    }
  });

  /* =========================================================
     CATÁLOGO: filtros, buscador, "Ver más" y fichas por WhatsApp
     ========================================================= */
  const propGrid = $('#propGrid');
  const tarjetas = $$('.prop-card', propGrid);
  const btnVerMas = $('#btn-ver-mas');
  const catalogStatus = $('#catalogStatus');
  const catalogEmpty = $('#catalogEmpty');
  const catalogToolbar = $('#catalogToolbar');
  const nombresFiltro = { todas: 'Todas', casas: 'Casas', departamentos: 'Departamentos', coto: 'Coto residencial', preventa: 'Preventa' };

  const estadoCatalogo = {
    tipo: 'todas',
    busqueda: false,
    operacion: 'Comprar',
    municipio: 'todos',
    colonia: '',
    min: 0,
    max: Infinity,
    expandido: false
  };

  const normalizar = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const textoSelect = (sel) => sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : '';

  function datosTarjeta(card) {
    return {
      titulo: $('h3', card).textContent.replace(/["“”]/g, '').replace(/\s+/g, ' ').trim(),
      zona: $('.prop-zone', card).textContent.replace(/\s+/g, ' ').trim().replace(/\.$/, ''),
      precio: $('.prop-price', card).textContent.trim()
    };
  }

  function coincide(card) {
    const d = card.dataset;
    const { tipo } = estadoCatalogo;
    if (tipo === 'casas' && d.tipo !== 'casa') return false;
    if (tipo === 'departamentos' && d.tipo !== 'departamento') return false;
    if (tipo === 'coto' && d.coto !== 'si') return false;
    if (tipo === 'preventa' && d.preventa !== 'si') return false;
    if (!estadoCatalogo.busqueda) return true;
    if (estadoCatalogo.operacion === 'Comprar' && d.operacion !== 'venta') return false;
    if (estadoCatalogo.operacion === 'Rentar' && d.operacion !== 'renta') return false;
    if (estadoCatalogo.operacion === 'Administrar') return false;
    if (estadoCatalogo.municipio !== 'todos' && !(d.municipio || '').split(' ').includes(estadoCatalogo.municipio)) return false;
    if (estadoCatalogo.colonia && normalizar(d.colonia) !== normalizar(estadoCatalogo.colonia)) return false;
    const precio = Number(d.precio || 0);
    return precio >= estadoCatalogo.min && precio <= estadoCatalogo.max;
  }

  function resumenBusqueda() {
    const partes = [];
    if (estadoCatalogo.busqueda) {
      partes.push(`Operación: ${estadoCatalogo.operacion}`);
      partes.push(`Municipio: ${textoSelect(municipioSelect)}`);
      if (estadoCatalogo.colonia) partes.push(`Colonia: ${estadoCatalogo.colonia}`);
      partes.push(`Presupuesto: ${textoSelect($('#presupuestoSelect'))}`);
    }
    if (estadoCatalogo.tipo !== 'todas') partes.push(`Tipo: ${nombresFiltro[estadoCatalogo.tipo]}`);
    return partes;
  }

  function renderCatalogo() {
    const filtrando = estadoCatalogo.tipo !== 'todas' || estadoCatalogo.busqueda;
    let visibles = 0;
    tarjetas.forEach(card => {
      const ocultaPorVerMas = !filtrando && !estadoCatalogo.expandido && card.classList.contains('tarjeta-oculta');
      const mostrar = coincide(card) && !ocultaPorVerMas;
      card.classList.toggle('is-hidden', !mostrar);
      card.classList.toggle('is-shown', mostrar);
      if (mostrar) visibles++;
    });

    btnVerMas.parentElement.hidden = filtrando;
    btnVerMas.textContent = estadoCatalogo.expandido ? 'Ver menos propiedades' : 'Ver más propiedades';
    btnVerMas.setAttribute('aria-expanded', String(estadoCatalogo.expandido));

    catalogEmpty.hidden = visibles > 0;
    if (visibles === 0) {
      const criterios = resumenBusqueda().join(' · ');
      $('#catalogEmptyWa').href = waLink(`Hola Demetrius Grupo Inmobiliario, busco una propiedad con estos criterios: ${criterios}. ¿Tienen opciones disponibles?`);
    }

    catalogStatus.replaceChildren();
    if (filtrando) {
      catalogStatus.append('Mostrando ', el('b', {}, visibles), ` ${visibles === 1 ? 'propiedad' : 'propiedades'} `,
        el('button', { type: 'button', clase: 'link-btn', 'data-limpiar-filtros': true }, 'Limpiar filtros'));
    }
  }

  function limpiarFiltros() {
    estadoCatalogo.tipo = 'todas';
    estadoCatalogo.busqueda = false;
    $$('.chip', catalogToolbar).forEach(c => { const activo = c.dataset.filtro === 'todas'; c.classList.toggle('active', activo); c.setAttribute('aria-pressed', String(activo)); });
    renderCatalogo();
  }

  function irAResultados() {
    catalogToolbar.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  }

  // Botón "Ver más propiedades" (se conserva el nombre de la función original)
  function mostrarMasPropiedades() {
    estadoCatalogo.expandido = !estadoCatalogo.expandido;
    renderCatalogo();
    if (!estadoCatalogo.expandido && propGrid.getBoundingClientRect().top < 0) irAResultados();
  }
  btnVerMas.addEventListener('click', mostrarMasPropiedades);

  // Chips de filtro
  $$('.chip', catalogToolbar).forEach(chip => chip.addEventListener('click', () => {
    $$('.chip', catalogToolbar).forEach(c => { c.classList.toggle('active', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
    estadoCatalogo.tipo = chip.dataset.filtro;
    renderCatalogo();
    irAResultados();
    track('filtrar_catalogo', { filtro: nombresFiltro[estadoCatalogo.tipo] });
  }));

  // Buscador del Hero
  $('#searchBtn').addEventListener('click', () => {
    const operacion = $('#operacionSelect').value;
    if (operacion === 'vender') {
      $('#vender').scrollIntoView({ behavior: scrollBehavior });
      track('search', { search_term: 'Vender', operacion: 'Vender' });
      return;
    }
    const [min, max] = ($('#presupuestoSelect').value || '').split('-');
    Object.assign(estadoCatalogo, {
      busqueda: true,
      operacion,
      municipio: municipioSelect.value,
      colonia: coloniaSelect.value,
      min: Number(min) || 0,
      max: max ? Number(max) : Infinity
    });
    renderCatalogo();
    irAResultados();
    track('search', {
      search_term: resumenBusqueda().join(' | '),
      operacion,
      municipio: textoSelect(municipioSelect),
      colonia: estadoCatalogo.colonia || 'Todas',
      presupuesto: textoSelect($('#presupuestoSelect'))
    });
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-limpiar-filtros]')) { limpiarFiltros(); irAResultados(); }
  });

  // "Ver ficha →" abre WhatsApp con la propiedad, zona y precio exactos
  tarjetas.forEach(card => {
    const d = datosTarjeta(card);
    const cta = $('.prop-cta', card);
    cta.href = waLink(`Hola Demetrius Grupo Inmobiliario, me interesa ver la ficha de: ${d.titulo} en ${d.zona} (${d.precio})`);
    cta.setAttribute('aria-label', `Ver ficha de ${d.titulo} en ${d.zona} por WhatsApp`);
    cta.addEventListener('click', () => track('solicitar_ficha_propiedad', { propiedad: d.titulo, zona: d.zona, precio: d.precio }));
  });

  renderCatalogo();

  // Esqueleto: marca como cargadas las fotos que ya estaban en caché
  $$('.prop-media').forEach(media => {
    const img = $('img', media);
    if (img && img.complete && img.naturalWidth > 0) media.classList.add('is-loaded');
  });

  // Zonas: shimmer mientras descarga la foto de fondo + CTA por WhatsApp
  $$('.zone-card').forEach(card => {
    card.href = waLink(`Hola Demetrius Grupo Inmobiliario, me interesan propiedades en ${card.dataset.zona}.`);
    card.setAttribute('aria-label', `${card.dataset.zona}: consultar propiedades por WhatsApp`);
    card.dataset.ubicacion = 'zonas';
    const fondo = getComputedStyle(card, '::after').backgroundImage;
    const url = (fondo.match(/url\(["']?(.*?)["']?\)/) || [])[1];
    if (!url) return;
    const img = new Image();
    img.src = url;
    if (img.complete) return;
    card.classList.add('is-loading');
    img.onload = img.onerror = () => card.classList.remove('is-loading');
  });

  /* =========================================================
     FORMULARIOS → WHATSAPP (con consentimiento y honeypot)
     ========================================================= */
  // Valor de un campo ya sanitizado (los textos largos conservan saltos de línea)
  const valor = (id, max = 200, multilinea = false) => limpiar((document.getElementById(id) || {}).value, max, multilinea);

  // Mensaje bajo el formulario: acepta textos y nodos (p. ej. enlaceExterno), nunca HTML
  function mensajeForm(form, tipo, ...partes) {
    const msg = $('.form-msg', form);
    msg.className = `form-msg ${tipo === 'ok' ? 'is-ok' : 'is-error'}`;
    msg.replaceChildren(...partes);
  }

  function validarFormulario(form, camposRequeridos) {
    const faltantes = [];
    $$('.is-invalid', form).forEach(el => el.classList.remove('is-invalid'));
    camposRequeridos.forEach(({ id, etiqueta, validar }) => {
      const campo = document.getElementById(id);
      const v = limpiar(campo.value, 200);
      if (!v || (validar && !validar(v))) { campo.classList.add('is-invalid'); faltantes.push({ el: campo, etiqueta }); }
    });
    const correo = $('input[type="email"]', form);
    if (correo && limpiar(correo.value, 120) && !correoValido(limpiar(correo.value, 120))) {
      correo.classList.add('is-invalid'); faltantes.push({ el: correo, etiqueta: 'Correo electrónico válido' });
    }
    const acepto = $('input[name="acepto"]', form);
    const consentLabel = acepto.closest('.consent');
    consentLabel.classList.toggle('is-invalid', !acepto.checked);
    if (faltantes.length) {
      mensajeForm(form, 'error', `Por favor completa: ${faltantes.map(f => f.etiqueta).join(', ')}.`);
      faltantes[0].el.focus();
      return false;
    }
    if (!acepto.checked) {
      mensajeForm(form, 'error', 'Para continuar, acepta el Aviso de Privacidad y los Términos y Condiciones.');
      acepto.focus();
      return false;
    }
    return true;
  }

  const esSpam = (form) => valor($('input[name="empresa_web"]', form).id) !== '';

  function abrirWhatsApp(mensaje, form) {
    const url = waLink(mensaje);
    const ventana = window.open(url, '_blank');
    if (ventana) { try { ventana.opener = null; } catch (e) { /* sin acceso */ } }
    mensajeForm(form, 'ok', '¡Gracias! Abrimos WhatsApp con tu solicitud. Si no se abrió, ', enlaceExterno(url, 'toca aquí'), '.');
  }

  // Limpia el estado de error al corregir
  $$('#formConstruccion, #formValuacion').forEach(form => {
    form.addEventListener('input', (e) => {
      if (e.target.classList.contains('is-invalid')) e.target.classList.remove('is-invalid');
      if (e.target.name === 'acepto' && e.target.checked) e.target.closest('.consent').classList.remove('is-invalid');
    });
    form.addEventListener('change', (e) => {
      if (e.target.name === 'acepto' && e.target.checked) e.target.closest('.consent').classList.remove('is-invalid');
    });
  });

  // Construcción a la medida
  const formConstruccion = $('#formConstruccion');
  formConstruccion.addEventListener('submit', (e) => {
    e.preventDefault();
    if (esSpam(formConstruccion)) return;
    const ok = validarFormulario(formConstruccion, [
      { id: 'conNombre', etiqueta: 'Nombre (solo letras)', validar: nombreValido },
      { id: 'conTelefono', etiqueta: 'Teléfono (10 dígitos)', validar: telefonoValido }
    ]);
    if (!ok) return;
    const nd = (v) => v || 'No especificado';
    const mensaje = `Hola Demetrius Grupo Inmobiliario, me interesa solicitar un proyecto de *Construcción a la medida*:\n\n` +
      `👤 *Nombre:* ${nd(valor('conNombre'))}\n` +
      `📞 *Teléfono:* ${nd(valor('conTelefono'))}\n` +
      `🏞️ *¿Ya tiene terreno?:* ${nd(valor('conTerreno'))}\n` +
      `📍 *Municipio de interés:* ${nd(valor('conMunicipio'))}\n` +
      `📐 *M² aproximados de construcción:* ${nd(valor('conM2'))}\n` +
      `💰 *Presupuesto estimado:* ${nd(valor('conPresupuesto'))}\n` +
      `📝 *Descripción del proyecto:* ${nd(valor('conDescripcion', 800, true))}`;
    abrirWhatsApp(mensaje, formConstruccion);
    track('enviar_solicitud_construccion', { municipio: valor('conMunicipio'), presupuesto: valor('conPresupuesto'), terreno: valor('conTerreno') });
  });

  // Valuación (se conserva la función original y su mensaje)
  function enviarWhatsAppValuacion(event) {
    event.preventDefault(); // Evita que se recargue la página
    const form = $('#formValuacion');
    if (esSpam(form)) return;
    const ok = validarFormulario(form, [
      { id: 'valNombre', etiqueta: 'Nombre (solo letras)', validar: nombreValido },
      { id: 'valTelefono', etiqueta: 'Teléfono (10 dígitos)', validar: telefonoValido }
    ]);
    if (!ok) return;

    // Capturamos los valores de cada campo usando los IDs que pusimos
    const nombre = valor('valNombre') || 'No especificado';
    const telefono = valor('valTelefono') || 'No especificado';
    const correo = valor('valCorreo') || 'No especificado';
    const tipoPropiedad = valor('valTipo') || 'No especificado';
    const municipio = valor('valMunicipio') || 'No especificado';
    const colonia = valor('valColonia') || 'No especificado';
    const antiguedad = valor('valAntiguedad') || 'No especificado';
    const mConstruccion = valor('valConstruccion') || 'No especificado';
    const mTerreno = valor('valTerreno') || 'No especificado';
    const recamaras = valor('valRecamaras') || 'No especificado';
    const banos = valor('valBanos') || 'No especificado';
    const precio = valor('valPrecio') || 'No especificado';
    const fecha = valor('valFecha') || 'No especificado';
    const horario = valor('valHorario') || 'No especificado';

    // Armamos el mensaje ordenado al estilo de anuncio de Facebook
    const mensaje = `Hola, me interesa agendar una cita de valuación con estos datos:\n\n` +
      `👤 *Nombre:* ${nombre}\n` +
      `📞 *Teléfono:* ${telefono}\n` +
      `📧 *Correo:* ${correo}\n` +
      `🏠 *Tipo de propiedad:* ${tipoPropiedad}\n` +
      `📍 *Municipio:* ${municipio}\n` +
      `🏘️ *Colonia:* ${colonia}\n` +
      `🏗️ *Antigüedad:* ${antiguedad}\n` +
      `📐 *m² Construcción:* ${mConstruccion}\n` +
      `🟩 *m² Terreno:* ${mTerreno}\n` +
      `🛏️ *Recámaras:* ${recamaras}\n` +
      `🚿 *Baños:* ${banos}\n` +
      `💰 *Precio esperado:* ${precio}\n` +
      `📅 *Fecha preferida:* ${fecha}\n` +
      `⏰ *Horario preferido:* ${horario}`;

    abrirWhatsApp(mensaje, form);
    track('agendar_valuacion', { tipo_propiedad: tipoPropiedad, municipio, antiguedad });
  }
  $('#formValuacion').addEventListener('submit', enviarWhatsAppValuacion);
  const hoy = new Date();
  $('#valFecha').min = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  /* =========================================================
     RESEÑAS DE LA COMUNIDAD (Supabase REST, con moderación)
     ========================================================= */
  (() => {
    const base = (ENV_CONFIG.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const llave = (ENV_CONFIG.SUPABASE_ANON_KEY || '').trim();
    const configurado = (/^https:\/\/[^\s/]+$/.test(base) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) && llave.length > 20;
    const porPagina = ENV_CONFIG.RESENAS_POR_PAGINA || 6;
    const campos = 'id,created_at,nombre,anonimo,perfil,zona,calificacion,comentario,respuesta';
    const fechaFmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

    const seccion = $('#testimonios');
    const lista = $('#resenasLista');
    const vacio = $('#resenasVacio');
    const masWrap = $('#resenasMasWrap');
    const btnMas = $('#resenasMas');
    const form = $('#formResena');
    const nombreIn = $('#resNombre');
    const anonimo = $('#resAnonimo');
    const comentario = $('#resComentario');
    const contador = $('#resContador');
    const cargadoEn = Date.now();
    let pagina = 0;

    // La llave publicable (sb_publishable_…) va solo en "apikey"; la llave anon heredada (JWT) también en Authorization
    const encabezados = (extra = {}) => {
      const h = { apikey: llave, ...extra };
      if (llave.startsWith('eyJ')) h.Authorization = `Bearer ${llave}`;
      return h;
    };
    async function pedir(ruta, opciones = {}) {
      const r = await fetch(`${base}/rest/v1/${ruta}`, { ...opciones, headers: encabezados(opciones.headers) });
      if (!r.ok) throw new Error(`Supabase respondió ${r.status}`);
      return r.status === 200 ? r.json() : null;
    }

    function pintarEstrellas(el, valor) {
      const v = Math.max(0, Math.min(5, Number(valor) || 0));
      el.style.setProperty('--pct', `${(v / 5) * 100}%`);
      el.setAttribute('aria-label', `${v.toLocaleString('es-MX', { maximumFractionDigits: 1 })} de 5 estrellas`);
    }

    const iniciales = (nombre) => nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');

    // Todo el contenido escrito por usuarios se inserta con textContent (nunca innerHTML)
    function crearTarjeta(r) {
      const card = document.createElement('article');
      card.className = 'testi-card resena-card';

      const top = document.createElement('div');
      top.className = 'resena-top';
      const estrellas = document.createElement('span');
      estrellas.className = 'estrellas';
      estrellas.setAttribute('role', 'img');
      estrellas.textContent = '★★★★★';
      pintarEstrellas(estrellas, r.calificacion);
      const fecha = document.createElement('time');
      fecha.dateTime = r.created_at;
      fecha.textContent = fechaFmt.format(new Date(r.created_at));
      top.append(estrellas, fecha);

      const texto = document.createElement('p');
      texto.className = 'resena-texto';
      texto.textContent = r.comentario;
      card.append(top, texto);

      if ((r.comentario || '').length > 280) {
        texto.classList.add('is-clamped');
        const leer = document.createElement('button');
        leer.type = 'button';
        leer.className = 'link-btn resena-leer';
        leer.textContent = 'Leer más';
        leer.addEventListener('click', () => {
          const recortado = texto.classList.toggle('is-clamped');
          leer.textContent = recortado ? 'Leer más' : 'Leer menos';
        });
        card.append(leer);
      }

      const nombre = r.anonimo || !r.nombre ? 'Anónimo' : r.nombre;
      const persona = document.createElement('div');
      persona.className = 'testi-person';
      const avatar = document.createElement('div');
      avatar.className = 'testi-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      if (nombre === 'Anónimo') {
        avatar.classList.add('is-anon');
        avatar.append(iconoVentanas());
      } else {
        avatar.textContent = iniciales(nombre);
      }
      const datos = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = nombre;
      const detalle = document.createElement('span');
      detalle.textContent = [r.perfil, r.zona].filter(Boolean).join(' · ');
      datos.append(b, detalle);
      persona.append(avatar, datos);
      card.append(persona);

      if (r.respuesta) {
        const resp = document.createElement('div');
        resp.className = 'resena-respuesta';
        const titulo = document.createElement('b');
        titulo.textContent = 'Respuesta de Demetrius';
        const p = document.createElement('p');
        p.textContent = r.respuesta;
        resp.append(titulo, p);
        card.append(resp);
      }
      return card;
    }

    async function cargarResumen() {
      try {
        const [d] = await pedir('resenas_resumen?select=total,promedio');
        const total = d ? Number(d.total) : 0;
        if (!total) return;
        const promedio = Number(d.promedio) || 0;
        $('#resenasPromedio').textContent = promedio.toLocaleString('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        pintarEstrellas($('#resenasEstrellas'), promedio);
        $('#resenasTotal').textContent = `${total} ${total === 1 ? 'reseña publicada' : 'reseñas publicadas'}`;
      } catch (e) { /* el resumen es opcional */ }
    }

    async function cargarPagina() {
      btnMas.disabled = true;
      try {
        const filas = await pedir(`resenas?select=${campos}&aprobada=eq.true&order=created_at.desc&limit=${porPagina + 1}&offset=${pagina * porPagina}`);
        filas.slice(0, porPagina).forEach(r => lista.append(crearTarjeta(r)));
        masWrap.hidden = filas.length <= porPagina;
        pagina++;
      } catch (e) {
        masWrap.hidden = true;
      } finally {
        btnMas.disabled = false;
        vacio.hidden = lista.children.length > 0;
      }
    }

    if (configurado) {
      btnMas.addEventListener('click', cargarPagina);
      const iniciar = () => { cargarResumen(); cargarPagina(); };
      if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entradas) => {
          if (entradas.some(en => en.isIntersecting)) { obs.disconnect(); iniciar(); }
        }, { rootMargin: '600px 0px' });
        obs.observe(seccion);
      } else {
        iniciar();
      }
    }

    // ---- Formulario ----
    comentario.addEventListener('input', () => { contador.textContent = `${comentario.value.length} / 800`; });
    anonimo.addEventListener('change', () => {
      nombreIn.disabled = anonimo.checked;
      if (anonimo.checked) nombreIn.classList.remove('is-invalid');
    });
    form.addEventListener('input', (e) => { if (e.target.classList.contains('is-invalid')) e.target.classList.remove('is-invalid'); });
    form.addEventListener('change', (e) => {
      if (e.target.name === 'calificacion') $('.rating', form).classList.remove('is-invalid');
      if (e.target.name === 'acepto' && e.target.checked) e.target.closest('.consent').classList.remove('is-invalid');
    });

    const tieneEnlace = (t) => /(https?:\/\/|www\.)/i.test(t);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (esSpam(form) || Date.now() - cargadoEn < 3000) return;

      $$('.is-invalid', form).forEach(el => el.classList.remove('is-invalid'));
      const esAnonimo = anonimo.checked;
      const nombre = limpiar(nombreIn.value, 60);
      const zona = limpiar($('#resZona').value, 60);
      const texto = limpiar(comentario.value, 800, true);
      const calificacion = Number((form.querySelector('input[name="calificacion"]:checked') || {}).value || 0);

      const faltantes = [];
      if (!esAnonimo && !nombreValido(nombre)) { nombreIn.classList.add('is-invalid'); faltantes.push('Nombre (solo letras) o marca «Anónimo»'); }
      if (!calificacion) { $('.rating', form).classList.add('is-invalid'); faltantes.push('Calificación'); }
      if (texto.length < 20) { comentario.classList.add('is-invalid'); faltantes.push('Tu reseña (mínimo 20 caracteres)'); }
      if (faltantes.length) {
        mensajeForm(form, 'error', `Por favor completa: ${faltantes.join(', ')}.`);
        return;
      }
      if (tieneEnlace(texto) || tieneEnlace(nombre) || tieneEnlace(zona)) {
        comentario.classList.add('is-invalid');
        mensajeForm(form, 'error', 'Por seguridad no se permiten enlaces ni direcciones web en las reseñas.');
        return;
      }
      const acepto = $('#resAcepto');
      if (!acepto.checked) {
        acepto.closest('.consent').classList.add('is-invalid');
        mensajeForm(form, 'error', 'Para enviar tu reseña, acepta el Aviso de Privacidad y los Términos y Condiciones.');
        acepto.focus();
        return;
      }

      const datos = {
        nombre: esAnonimo ? 'Anónimo' : nombre.slice(0, 60),
        anonimo: esAnonimo,
        perfil: $('#resPerfil').value,
        zona: zona.slice(0, 60) || null,
        calificacion,
        comentario: texto.slice(0, 800)
      };
      const mensajeWa = `Hola Demetrius Grupo Inmobiliario, quiero dejar una reseña:\n\n` +
        `⭐ *Calificación:* ${'★'.repeat(calificacion)} (${calificacion}/5)\n` +
        `👤 *Nombre:* ${datos.nombre} · ${datos.perfil}${datos.zona ? ` · ${datos.zona}` : ''}\n` +
        `💬 *Reseña:* ${datos.comentario}`;
      const enlaceWa = () => enlaceExterno(waLink(mensajeWa), 'envíala por WhatsApp');

      if (!configurado) {
        mensajeForm(form, 'ok', 'Las reseñas en línea se activarán muy pronto. Mientras tanto, ', enlaceWa(), '.');
        return;
      }

      const boton = $('.form-submit', form);
      boton.disabled = true;
      boton.textContent = 'Enviando…';
      try {
        await pedir('resenas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify(datos)
        });
        form.reset();
        nombreIn.disabled = false;
        contador.textContent = '0 / 800';
        mensajeForm(form, 'ok', '¡Gracias por compartir tu experiencia! Tu reseña quedó en revisión y aparecerá aquí en cuanto sea aprobada.');
        track('enviar_resena', { calificacion, perfil: datos.perfil, anonimo: esAnonimo });
      } catch (err) {
        mensajeForm(form, 'error', 'No pudimos enviar tu reseña en este momento. Intenta de nuevo más tarde o ', enlaceWa(), '.');
      } finally {
        boton.disabled = false;
        boton.textContent = 'Enviar reseña';
      }
    });
  })();

  /* =========================================================
     WHATSAPP FLOTANTE + CTAs DE CONTACTO
     ========================================================= */
  const waNumero = ENV_CONFIG.WHATSAPP_NUMBER;
  const waMensajeDefault = "Hola, vi su página y me gustaría más información sobre sus propiedades.";
  document.getElementById('waFloat').href =
    `https://wa.me/${waNumero}?text=${encodeURIComponent(waMensajeDefault)}`;
  $$('[data-wa-msg]').forEach(a => { a.href = waLink(a.dataset.waMsg); });

  // Mostrar el tooltip un momento al cargar, y luego al pasar el cursor
  const waTooltip = document.getElementById('waTooltip');
  const waBtn = document.getElementById('waFloat');
  setTimeout(() => waTooltip.classList.add('show'), 1200);
  setTimeout(() => waTooltip.classList.remove('show'), 5000);
  waBtn.addEventListener('mouseenter', () => waTooltip.classList.add('show'));
  waBtn.addEventListener('mouseleave', () => waTooltip.classList.remove('show'));

  // Eventos de contacto para GA4
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (a.id === 'waFloat') track('click_whatsapp_flotante', { ubicacion: 'boton_flotante' });
    else if (href.startsWith('tel:')) track('click_llamar', { ubicacion: a.dataset.ubicacion || 'sitio' });
    else if (href.includes('wa.me') && !a.classList.contains('prop-cta')) track('click_whatsapp', { ubicacion: a.dataset.ubicacion || 'sitio' });
  });

  /* =========================================================
     ANIMACIONES AL HACER SCROLL (IntersectionObserver)
     ========================================================= */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const selectoresReveal = '.section-head, .prop-card, .why-item, .build-info, .build-form, .sell-info, .sell-form, .zone-card, .map-wrap, .proceso-paso, .proceso-docs, .proceso-cta, .testi-card, .resenas-resumen, .resenas-vacio, .resena-form, .faq-item, .cta-box';
    const elementosReveal = $$(selectoresReveal);
    elementosReveal.forEach(el => el.classList.add('reveal'));

    const limpiarReveal = (el) => {
      el.classList.remove('reveal', 'is-visible');
      el.style.removeProperty('--reveal-delay');
    };

    const observadorReveal = new IntersectionObserver((entradas) => {
      const visibles = entradas.filter(en => en.isIntersecting).map(en => en.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
      visibles.forEach((el, i) => {
        observadorReveal.unobserve(el);
        el.style.setProperty('--reveal-delay', `${Math.min(i, 5) * 90}ms`);
        el.classList.add('is-visible');
        el.addEventListener('transitionend', function fin(ev) {
          if (ev.target !== el || ev.propertyName !== 'transform') return;
          el.removeEventListener('transitionend', fin);
          limpiarReveal(el);
        });
        setTimeout(() => limpiarReveal(el), 1500 + i * 90);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    elementosReveal.forEach(el => observadorReveal.observe(el));
  }

  /* =========================================================
     MAPA ZMG (Leaflet) — se carga al acercarse a la sección
     ========================================================= */
  // Propiedades de ejemplo distribuidas en toda la ZMG
  // (en producción, este arreglo se llena dinámicamente desde el panel de administración)
  const propiedades = [
    { lat: 20.282674624206717, lng: -103.41836727906231, zona: "Jocotepec · Jalisco.", titulo: "Terreno En Venta", precio: "$36,400,000.00 M.N." },   // (listo)
    { lat: 20.617445778259928, lng: -103.47095443086424, zona: "Ciudad Bugambilias · Zapopan, Jalisco", titulo: "Casa En Venta", precio: "$12,000,000.00 M.N" },   // (listo)
    { lat: 20.717159221118813, lng: -103.3255021, zona: "Lomas Independencia · Guadalajara, Jalisco", titulo: "Departamento En Venta", precio: "$2,990,000.00 M.N." },   // (listo)}
    { lat: 20.618699824026095, lng: -103.46896374241076, zona: "Ciudad Bugambilias 2da secc. · Zapopan, Jalisco", titulo: "Terraza En Venta", precio: "$10,500,000.00 M.N." },  // (listo)}
    { lat: 20.722392121213318, lng: -103.4764693423289, zona: "Parques Vallarta · Zapopan", titulo: "Casa En Venta", precio: "$9,900,000.00 M.N." },     // (listo)
    { lat: 20.717072912690632, lng: -103.32776600006594, zona: "Col. Lomas De Independencia · Guadalajara", titulo: "Casa En Venta", precio: "$4,750,000.00 M.N." }, // (listo)}
    { lat: 20.728365480919404, lng: -103.37751172883554, zona: "Col. Constitucion · Zapopan", titulo: "Casa En Venta", precio: "$2,800,000.00 M.N." },       // (listo)}
    { lat: 20.59056053032381, lng: -103.43716371664033, zona: "La Tijera · Zapopan", titulo: "Departamento En Venta", precio: "$3'300,000.00 M.N." },     // (listo)}
    { lat: 20.766653331806882, lng: -103.39456730008078, zona: "Los Almendros · Zapopan", titulo: "Casa En Venta", precio: "$6,980,000.00 M.N." },  // (listo)}
    { lat: 20.65738913571202, lng: -103.28536297097166, zona: "Col. Insurgentes · Guadalajara", titulo: "Bodega En Venta", precio: "$3,750,000.00 M.N." },    // (listo)
    { lat: 20.785784, lng: -103.411437, zona: "Zoi Capital Norte · Río Blanco, Zapopan", titulo: "Casa En Venta", precio: "$3,199,000.00 M.N." },    // Av. D, Capital Norte (ubicación aproximada de la calle)
  ];

  let mapaIniciado = false;
  function iniciarMapa() {
    if (mapaIniciado) return;
    mapaIniciado = true;
    if (typeof L === 'undefined') return; // Leaflet no cargó (sin conexión): el resto del sitio sigue funcionando

    // Mapa de la Zona Metropolitana de Guadalajara
    const map = L.map('map-zmg', { scrollWheelZoom: false }).setView([20.66, -103.38], 10);

    L.tileLayer(ENV_CONFIG.MAP_TILES_URL, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);

    // Icono dorado personalizado (marca Demetrius); la forma del pin vive en css/estilos.css (.demetrius-marker)
    const goldIcon = L.divIcon({
      className: 'demetrius-marker',
      html: '',
      iconSize: [16, 16],
      iconAnchor: [8, 16],
      popupAnchor: [0, -16]
    });

    propiedades.forEach(p => {
      const mensaje = `Hola Demetrius Grupo Inmobiliario, me interesa la propiedad del mapa: ${p.titulo} en ${p.zona.replace(/\s*·\s*/g, ', ').replace(/\.$/, '')} (${p.precio})`;
      L.marker([p.lat, p.lng], { icon: goldIcon, title: `${p.titulo} · ${p.zona}`, alt: `${p.titulo} · ${p.zona}` }).addTo(map).bindPopup(
        el('div', {},
          el('div', { clase: 'popup-zone' }, p.zona),
          el('div', { clase: 'popup-title' }, p.titulo),
          el('div', { clase: 'popup-price' }, p.precio),
          el('a', { clase: 'popup-cta', href: waLink(mensaje), target: '_blank', rel: 'noopener noreferrer', 'data-ubicacion': 'mapa' }, 'Solicitar información →'))
      );
    });

    // Encuadra los 10 marcadores (incluido Jocotepec)
    map.fitBounds(L.latLngBounds(propiedades.map(p => [p.lat, p.lng])), { padding: [40, 40] });
  }

  const contenedorMapa = document.getElementById('map-zmg');
  if ('IntersectionObserver' in window) {
    const observadorMapa = new IntersectionObserver((entradas) => {
      if (entradas.some(en => en.isIntersecting)) { observadorMapa.disconnect(); iniciarMapa(); }
    }, { rootMargin: '400px 0px' });
    observadorMapa.observe(contenedorMapa);
  } else {
    iniciarMapa();
  }
