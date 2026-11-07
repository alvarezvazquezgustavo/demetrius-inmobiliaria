/* Demetrius Grupo Inmobiliario — panel del equipo: piezas compartidas (login y panel)
   - Conexión con Supabase (librería oficial copiada en js/vendor/, sin CDN externo).
   - Construcción segura de DOM (nunca innerHTML).
   - Mensajes de error claros en español.
   La seguridad real está en la base de datos (RLS de supabase/propiedades.sql): ocultar botones aquí es solo comodidad. */
(() => {
  'use strict';
  const cfg = window.DEMETRIUS_CONFIG || {};
  const url = String(cfg.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const llave = String(cfg.SUPABASE_ANON_KEY || '').trim();
  const configurado = (/^https:\/\/[^\s/]+$/.test(url) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url)) && llave.length > 20;

  const sb = configurado && window.supabase && typeof window.supabase.createClient === 'function'
    ? window.supabase.createClient(url, llave, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'demetrius-panel-sesion' }
      })
    : null;

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

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

  // Texto escrito por personas: Unicode normalizado, sin caracteres de control/invisibles, espacios compactados
  const SALTO = String.fromCharCode(10);
  function limpiar(texto, max = 200, multilinea = false) {
    const visibles = Array.from(String(texto ?? '').normalize('NFC')).filter(c => {
      const n = c.codePointAt(0);
      if (n === 10) return multilinea;
      if (n < 32 || (n >= 127 && n < 160)) return false;
      if ((n >= 0x200B && n <= 0x200F) || (n >= 0x202A && n <= 0x202E) || (n >= 0x2066 && n <= 0x2069) || n === 0xFEFF) return false;
      return true;
    }).join('');
    const lineas = visibles.split(SALTO).map(l => l.replace(/\s+/g, ' ').trim());
    const unido = multilinea ? lineas.join(SALTO).replace(/\n{3,}/g, SALTO + SALTO).trim() : lineas.join(' ').trim();
    return Array.from(unido).slice(0, max).join('');
  }

  // Identificador aleatorio para el nombre de cada foto (funciona también fuera de HTTPS)
  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function' && window.isSecureContext) return window.crypto.randomUUID();
    const b = window.crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  const fechaLarga = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  const fechaHora = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const formatoFecha = (v, conHora = false) => { const d = new Date(v); return isNaN(d) ? '' : (conHora ? fechaHora : fechaLarga).format(d); };

  // Mensajes de las reglas de la base de datos (check constraints) en palabras simples
  const RESTRICCIONES = {
    propiedades_titulo_largo: 'El título debe tener entre 5 y 120 caracteres.',
    propiedades_colonia_largo: 'La colonia debe tener entre 2 y 80 caracteres.',
    propiedades_etiqueta_largo: 'La etiqueta puede tener máximo 40 caracteres.',
    propiedades_descripcion_largo: 'La descripción puede tener máximo 4,000 caracteres.',
    propiedades_comentario_largo: 'El comentario puede tener máximo 1,000 caracteres.',
    propiedades_precio_venta: 'Revisa el precio de venta.',
    propiedades_precio_renta: 'Revisa la renta mensual.',
    propiedades_precio_segun_operacion: 'Falta el precio: una propiedad en venta necesita precio de venta y una en renta, renta mensual.',
    propiedades_medidas: 'Revisa los metros cuadrados de terreno y de construcción.',
    propiedades_conteos: 'Revisa recámaras, baños (medio baño = .5) y estacionamientos.',
    propiedades_ubicacion: 'La ubicación marcada en el mapa no es válida. Vuelve a marcarla dentro de México.',
    propiedades_amenidades_validas: 'Revisa las amenidades: máximo 30, de hasta 60 caracteres cada una.',
    propiedades_fotos_validas: 'Hay un problema con las fotos (máximo 20). Quita la última que agregaste e inténtalo de nuevo.',
    propiedades_tipo: 'Elige un tipo de propiedad de la lista.',
    propiedades_operacion: 'Elige la operación: venta, renta o ambas.',
    propiedades_municipio: 'Elige un municipio de la lista.',
    propiedades_estado: 'Ese cambio de estado no es válido.',
    perfiles_nombre_largo: 'El nombre puede tener máximo 80 caracteres.',
    perfiles_rol: 'El rol debe ser asesor o administrador.'
  };

  function mensajeError(err) {
    const m = String((err && (err.message || err.error_description || err.msg)) || err || '');
    const codigo = String((err && err.code) || '');
    const estado = Number((err && (err.status || err.statusCode)) || 0);
    if (/Failed to fetch|NetworkError|Load failed|network ?error|fetch failed/i.test(m)) {
      return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
    }
    if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos. Revisa que estén bien escritos.';
    if (/Email not confirmed/i.test(m)) return 'Tu cuenta todavía no está confirmada. Pídele al administrador que la confirme en Supabase.';
    if (/user is banned|banned/i.test(m)) return 'Tu acceso está bloqueado. Habla con el administrador.';
    if (estado === 429 || /rate limit|too many requests/i.test(m)) return 'Demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.';
    if (/JWT expired|invalid JWT|Invalid Refresh Token|refresh token|session.*(missing|expired)/i.test(m) || codigo === 'PGRST301' || codigo === 'PGRST303') {
      return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    }
    if (/New password should be different/i.test(m)) return 'La nueva contraseña debe ser distinta a la anterior.';
    if (/Password should be|weak password|password.*(short|characters)/i.test(m)) return 'La contraseña es muy débil. Usa al menos 8 caracteres, con letras y números.';
    if (codigo === 'P0001' && m) return m; // mensajes escritos en el SQL (ya están en español)
    if (codigo === '23514') {
      const restriccion = (m.match(/constraint "([^"]+)"/) || [])[1];
      return RESTRICCIONES[restriccion] || 'Algún dato no es válido. Revisa el formulario.';
    }
    if (codigo === 'PGRST116') return 'Esta propiedad ya no se puede modificar (quizá cambió de estado). Recarga la página.';
    if (estado === 413 || /Payload too large|maximum allowed size|exceeded/i.test(m)) return 'La foto pesa demasiado (máximo 5 MB).';
    if (/mime type|invalid_mime|not supported/i.test(m)) return 'Formato de foto no permitido. Usa JPG, PNG o WebP.';
    if (/Duplicate|already exists/i.test(m)) return 'Esa foto ya existe. Inténtalo de nuevo.';
    if (codigo === '42501' || estado === 403 || /row-level security|permission denied|Unauthorized/i.test(m)) {
      return 'No tienes permiso para hacer este cambio. Si crees que es un error, avísale al administrador.';
    }
    return 'Ocurrió un error inesperado. Inténtalo de nuevo; si sigue pasando, avísale al administrador.';
  }
  const sesionExpirada = (err) => mensajeError(err).startsWith('Tu sesión expiró');

  window.Panel = Object.freeze({
    sb, configurado, $, $$, el, limpiar, uuid, formatoFecha, mensajeError, sesionExpirada,
    BUCKET: cfg.BUCKET_FOTOS || 'propiedades'
  });
})();
