/* Demetrius Grupo Inmobiliario — propiedades cargadas desde el panel del equipo (Supabase)
   Solo LEE propiedades publicadas (y vendidas/rentadas): las reglas RLS de la base de datos no dejan ver nada más.
   Lo usan la página de inicio (catálogo y mapa), la ficha (propiedad.html) y el panel (textos y formatos). */
(() => {
  'use strict';
  const cfg = window.DEMETRIUS_CONFIG || {};
  const base = String(cfg.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const llave = String(cfg.SUPABASE_ANON_KEY || '').trim();
  const bucket = cfg.BUCKET_FOTOS || 'propiedades';
  const configurado = (/^https:\/\/[^\s/]+$/.test(base) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) && llave.length > 20;

  // Columnas que el público tiene permitido leer (ver los "grant select" de supabase/propiedades.sql)
  const CAMPOS = 'id,estado,titulo,tipo,operacion,precio_venta,precio_renta,municipio,colonia,etiqueta,terreno_m2,' +
    'construccion_m2,recamaras,banos,estacionamientos,descripcion,amenidades,coto,preventa,lat,lng,fotos,publicada_en';
  const ESTADOS_PUBLICOS = 'publicada,vendida,rentada';

  const MUNICIPIOS = Object.freeze({
    guadalajara: 'Guadalajara', zapopan: 'Zapopan', tlaquepaque: 'Tlaquepaque', tonala: 'Tonalá', elsalto: 'El Salto',
    juanacatlan: 'Juanacatlán', tlajomulco: 'Tlajomulco de Zúñiga', chapala: 'Chapala', jocotepec: 'Jocotepec',
    mazamitla: 'Mazamitla', tapalpa: 'Tapalpa', vallarta: 'Puerto Vallarta'
  });
  const TIPOS = Object.freeze({
    casa: 'Casa', departamento: 'Departamento', terreno: 'Terreno', bodega: 'Bodega', local: 'Local comercial',
    oficina: 'Oficina', terraza: 'Terraza', edificio: 'Edificio'
  });
  const OPERACIONES = Object.freeze({ venta: 'Venta', renta: 'Renta', 'venta renta': 'Venta y renta' });

  const esUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));

  // La llave publicable (sb_publishable_…) va solo en "apikey"; la llave anon heredada (JWT) también en Authorization
  function encabezados() {
    const h = { apikey: llave, Accept: 'application/json' };
    if (llave.startsWith('eyJ')) h.Authorization = `Bearer ${llave}`;
    return h;
  }
  async function pedir(ruta) {
    const r = await fetch(`${base}/rest/v1/${ruta}`, { headers: encabezados() });
    if (!r.ok) throw new Error(`Supabase respondió ${r.status}`);
    return r.json();
  }

  async function listar() {
    if (!configurado) return [];
    const filas = await pedir(`propiedades?select=${CAMPOS}&estado=in.(${ESTADOS_PUBLICOS})&order=publicada_en.desc.nullslast&limit=300`);
    return Array.isArray(filas) ? filas : [];
  }
  async function obtener(id) {
    if (!configurado || !esUuid(id)) return null;
    const filas = await pedir(`propiedades?select=${CAMPOS}&id=eq.${id}&estado=in.(${ESTADOS_PUBLICOS})&limit=1`);
    return (Array.isArray(filas) && filas[0]) || null;
  }

  // ---------- Formatos (mismos que las tarjetas escritas a mano) ----------
  const urlFoto = (ruta) => `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${String(ruta).split('/').map(encodeURIComponent).join('/')}`;
  const urlFicha = (id) => `propiedad.html?id=${encodeURIComponent(id)}`;
  const numero = (n, dec = 2) => Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: dec });
  const dinero = (n) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M.N.`;
  const esVendida = (p) => p.estado === 'vendida' || p.estado === 'rentada';
  const textoSello = (p) => (p.estado === 'rentada' ? 'Rentada' : 'Vendida');
  const nombreMunicipio = (m) => MUNICIPIOS[m] || m || '';
  const textoZona = (p) => [p.colonia, nombreMunicipio(p.municipio)].filter(Boolean).join(', ');

  // Precio principal: el de venta; en las de solo renta, la renta mensual con "/ mes"
  function textoPrecio(p) {
    if (p.operacion === 'renta') return p.precio_renta != null ? `${dinero(p.precio_renta)} / mes` : 'Precio a consultar';
    return p.precio_venta != null ? dinero(p.precio_venta) : 'Precio a consultar';
  }
  function textoEtiqueta(p) {
    if (p.etiqueta) return p.etiqueta;
    if (p.preventa) return 'Preventa';
    if (p.coto) return 'Coto residencial';
    return p.operacion === 'venta renta' ? 'Venta · Renta' : (OPERACIONES[p.operacion] || '');
  }
  // Datos cortos de la tarjeta: "90 m²", "3 rec.", "2.5 baños", "2 estac."
  function datosCortos(p) {
    const m2 = p.construccion_m2 || p.terreno_m2;
    const banos = p.banos != null ? Number(p.banos) : null;
    return [
      m2 ? `${numero(m2)} m²` : null,
      p.recamaras != null && p.tipo !== 'terreno' ? `${p.recamaras} rec.` : null,
      banos ? `${numero(banos, 1)} ${banos === 1 ? 'baño' : 'baños'}` : null,
      p.estacionamientos ? `${p.estacionamientos} estac.` : null
    ].filter(Boolean);
  }
  // Ficha completa: [etiqueta, valor]
  function caracteristicas(p) {
    const banos = p.banos != null ? Number(p.banos) : null;
    return [
      ['Tipo', TIPOS[p.tipo] || p.tipo],
      ['Operación', OPERACIONES[p.operacion] || p.operacion],
      p.terreno_m2 ? ['Terreno', `${numero(p.terreno_m2)} m²`] : null,
      p.construccion_m2 ? ['Construcción', `${numero(p.construccion_m2)} m²`] : null,
      p.recamaras != null && p.tipo !== 'terreno' ? ['Recámaras', String(p.recamaras)] : null,
      banos != null && p.tipo !== 'terreno' ? ['Baños', numero(banos, 1)] : null,
      p.estacionamientos != null ? ['Estacionamientos', String(p.estacionamientos)] : null,
      p.coto ? ['Coto residencial', 'Sí'] : null,
      p.preventa ? ['Preventa', 'Sí'] : null
    ].filter(Boolean);
  }

  // Tarjeta igual a las de index.html (misma estructura y clases). "el" es el constructor seguro de DOM de cada página.
  function crearTarjeta(p, el) {
    const vendida = esVendida(p);
    const zona = textoZona(p);
    const meta = datosCortos(p);
    const precioFiltro = p.operacion === 'renta' ? p.precio_renta : p.precio_venta;
    return el('article', {
      clase: 'prop-card' + (vendida ? ' is-vendida' : ''),
      'data-origen': 'panel',
      'data-id': p.id,
      'data-tipo': p.tipo,
      'data-municipio': p.municipio,
      'data-colonia': p.colonia,
      'data-precio': precioFiltro != null ? String(Math.round(precioFiltro)) : '0',
      'data-precio-renta': p.precio_renta != null ? String(Math.round(p.precio_renta)) : null,
      'data-operacion': p.operacion,
      'data-coto': p.coto ? 'si' : 'no',
      'data-preventa': p.preventa ? 'si' : 'no',
      'data-recamaras': p.recamaras != null ? String(p.recamaras) : null,
      'data-vendida': vendida ? 'si' : null
    },
      el('div', { clase: 'prop-media' },
        vendida ? el('span', { clase: 'sello-vendida' }, textoSello(p)) : null,
        p.fotos && p.fotos[0]
          ? el('img', {
              clase: 'prop-img', src: urlFoto(p.fotos[0]), loading: 'lazy', decoding: 'async',
              alt: `${p.titulo} en ${zona}${vendida ? ` (${textoSello(p).toLowerCase()})` : ''} - Demetrius Grupo Inmobiliario`
            })
          : null),
      el('div', { clase: 'prop-body' },
        el('span', { clase: 'prop-tag' }, textoEtiqueta(p)),
        el('div', { clase: 'prop-zone' }, zona),
        el('h3', {}, p.titulo),
        meta.length ? el('div', { clase: 'prop-meta' }, meta.map(t => el('span', {}, t))) : null,
        el('div', { clase: 'prop-foot' },
          el('span', { clase: 'prop-price' }, textoPrecio(p)),
          el('a', { clase: 'prop-cta', href: urlFicha(p.id) }, vendida ? 'Quiero algo similar →' : 'Ver ficha →'))));
  }

  window.DemetriusPropiedades = Object.freeze({
    configurado, listar, obtener, esUuid,
    urlFoto, urlFicha, dinero, numero, textoPrecio, textoZona, textoEtiqueta, textoSello, esVendida,
    datosCortos, caracteristicas, crearTarjeta, nombreMunicipio,
    MUNICIPIOS, TIPOS, OPERACIONES
  });
})();
