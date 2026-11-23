/* Demetrius Grupo Inmobiliario — sección #herramientas y valuación instantánea
   - Pestaña 1: precalificador (banner) y desglosador de pagos del crédito.
   - Pestaña 2: estimador de gastos de escrituración en Jalisco y cotizador de escrituras por WhatsApp.
   - Pestaña 3: pre-diagnóstico de exención de ISR por venta de casa habitación.
   - Valuación instantánea del formulario #formValuacion (window.DemetriusValuacion).
   Todos los números salen de js/ajustes.js. Los importes se muestran en pesos y en dólares.
   Sin innerHTML: todo se arma con el() de js/principal.js. */
(() => {
  'use strict';
  const D = window.Demetrius;
  const Aj = window.DemetriusAjustes;
  const A = window.DEMETRIUS_AJUSTES;
  if (!D || !Aj || !A) return;
  const { $, $$, el, limpiar, waLink, track } = D;
  const t = Aj.t;
  const seccion = $('#herramientas');

  /* =========================================================
     PIEZAS COMUNES
     ========================================================= */
  const SALTO = String.fromCharCode(10);
  const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const pesos = (n) => Aj.fmtMXN(Math.round(n));
  const dolares = (n) => Aj.fmtUSDdePesos(n);
  const sufijo = () => (Aj.idioma === 'en' ? 'MXN' : 'M.N.');
  // Fechas escritas en js/ajustes.js ("noviembre de 2026"): en inglés se muestran como "November 2026"
  const fecha = (texto) => (Aj.idioma === 'en' ? Aj.aIngles(texto) : texto);
  const rangoPesos = (a, b) => `$${Aj.numero(Math.round(a))} – $${Aj.numero(Math.round(b))} ${sufijo()}`;
  const rangoDolares = (a, b) => `${Aj.fmtUSDdePesos(a)} – ${Aj.fmtUSDdePesos(b)}`;
  // Importes en pesos para los mensajes de WhatsApp (siempre en español)
  const pesosWa = (n) => `$${Aj.numero(Math.round(n))} M.N.`;

  // Tabla de resultados: Concepto | Pesos | Dólares
  function tabla(filas) {
    return el('table', { clase: 'calc-tabla' },
      el('thead', {}, el('tr', {},
        el('th', { scope: 'col' }, t('tabla.concepto')),
        el('th', { scope: 'col' }, t('tabla.pesos')),
        el('th', { scope: 'col' }, t('tabla.dolares')))),
      el('tbody', {}, filas.map(f => el('tr', { clase: f.total ? 'calc-total' : null },
        el('th', { scope: 'row' }, f.concepto),
        el('td', { 'data-columna': t('tabla.pesos') }, f.mxn),
        el('td', { 'data-columna': t('tabla.dolares') }, f.usd)))));
  }
  const nota = (texto, clase = 'calc-nota') => el('p', { clase }, texto);

  // Campos de importe: cada uno lleva su selector de moneda (MXN / USD)
  const importes = [];
  function registrarImporte(idInput, idMoneda, alCambiar) {
    const input = document.getElementById(idInput);
    const moneda = document.getElementById(idMoneda);
    if (!input || !moneda) return null;
    const campo = {
      input, moneda,
      // Valor en pesos (NaN si está vacío o no es un número)
      get pesos() {
        const n = Aj.aNumero(input.value);
        return moneda.value === 'USD' ? Aj.aPesos(n) : n;
      }
    };
    const formatear = () => {
      const n = Aj.aNumero(input.value);
      if (Number.isFinite(n) && n > 0) input.value = Aj.numero(n, n % 1 ? 2 : 0);
    };
    input.addEventListener('input', () => alCambiar && alCambiar());
    input.addEventListener('blur', formatear);
    moneda.addEventListener('change', () => alCambiar && alCambiar());
    // Al cambiar la moneda del sitio, el importe escrito se convierte para conservar su valor
    campo.seguirMoneda = () => {
      if (moneda.value === Aj.moneda) return;
      const n = Aj.aNumero(input.value);
      if (Number.isFinite(n) && n > 0) {
        const convertido = Aj.moneda === 'USD' ? Aj.aDolares(n) : Aj.aPesos(n);
        input.value = Aj.numero(Aj.moneda === 'USD' ? Math.round(convertido) : Math.round(convertido / 1000) * 1000);
      }
      moneda.value = Aj.moneda;
    };
    campo.seguirMoneda();
    importes.push(campo);
    return campo;
  }

  // Mensaje de WhatsApp desde un formulario (misma conducta que los formularios de la página)
  function abrirWhatsApp(url, form) {
    const ventana = window.open(url, '_blank');
    if (ventana) { try { ventana.opener = null; } catch (e) { /* sin acceso */ } }
    D.mensajeForm(form, 'ok', '¡Gracias! Abrimos WhatsApp con tu solicitud. Si no se abrió, ', D.enlaceExterno(url, 'toca aquí'), '.');
  }
  function limpiarErroresAlEscribir(form) {
    const quitar = (e) => {
      if (e.target.classList.contains('is-invalid')) e.target.classList.remove('is-invalid');
      if (e.target.name === 'acepto' && e.target.checked) e.target.closest('.consent').classList.remove('is-invalid');
    };
    form.addEventListener('input', quitar);
    form.addEventListener('change', quitar);
  }

  /* =========================================================
     PESTAÑAS
     ========================================================= */
  if (seccion) {
    const pestanas = $$('.herr-tab', seccion);
    const elegir = (pestana, enfocar) => {
      pestanas.forEach(p => {
        const activa = p === pestana;
        p.classList.toggle('active', activa);
        p.setAttribute('aria-selected', String(activa));
        p.tabIndex = activa ? 0 : -1;
        document.getElementById(p.getAttribute('aria-controls')).hidden = !activa;
      });
      if (enfocar) pestana.focus();
    };
    pestanas.forEach((pestana, i) => {
      pestana.addEventListener('click', () => { elegir(pestana); track('abrir_calculadora', { calculadora: pestana.id }); });
      pestana.addEventListener('keydown', (e) => {
        const mover = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (mover) { e.preventDefault(); elegir(pestanas[(i + mover + pestanas.length) % pestanas.length], true); }
        else if (e.key === 'Home') { e.preventDefault(); elegir(pestanas[0], true); }
        else if (e.key === 'End') { e.preventDefault(); elegir(pestanas[pestanas.length - 1], true); }
      });
    });
    // Enlaces directos: #herramientas-escrituracion y #herramientas-isr abren su pestaña
    const porHash = { '#herramientas-escrituracion': 'tabEscrituras', '#herramientas-isr': 'tabIsr', '#herramientas-credito': 'tabCredito' };
    if (porHash[location.hash]) { elegir(document.getElementById(porHash[location.hash])); seccion.scrollIntoView(); }
    $$('.calc', seccion).forEach(f => { if (f.tagName === 'FORM' && f.id !== 'formCotizador') f.addEventListener('submit', (e) => e.preventDefault()); });
  }

  /* =========================================================
     PESTAÑA 1 — CRÉDITO HIPOTECARIO
     ========================================================= */
  const credito = A.CONFIG_CREDITO;
  const credResultado = $('#credResultado');
  const credEnganche = $('#credEnganche');
  const credEngancheTxt = $('#credEngancheTxt');
  const credValor = registrarImporte('credValor', 'credMoneda', pintarCredito);
  let ultimoCredito = null;

  function calcularCredito() {
    const valor = credValor.pesos;
    if (!Number.isFinite(valor) || valor <= 0) return { error: t('calc.invalido') };
    if (valor < credito.VALOR_MINIMO) return { error: t('calc.minimo', { min: pesos(credito.VALOR_MINIMO) }) };
    const porcentaje = Number(credEnganche.value);
    const plazo = Number(($('input[name="credPlazo"]:checked') || {}).value) || 20;
    const enganche = valor * porcentaje / 100;
    const monto = valor - enganche;
    const mensual = credito.TASA_ANUAL / 12;
    const pagos = plazo * 12;
    const mensualidad = mensual > 0 ? monto * mensual / (1 - Math.pow(1 + mensual, -pagos)) : monto / pagos;
    return { valor, porcentaje, plazo, enganche, monto, mensualidad, ingreso: mensualidad / credito.PORCENTAJE_INGRESO };
  }

  function pintarCredito() {
    if (!credResultado) return;
    credEngancheTxt.textContent = `${credEnganche.value}%`;
    const r = calcularCredito();
    ultimoCredito = r.error ? null : r;
    if (r.error) { credResultado.replaceChildren(nota(r.error, 'calc-error')); pintarBanner(); return; }
    credResultado.replaceChildren(
      tabla([
        { concepto: t('cred.rEnganche', { p: r.porcentaje }), mxn: pesos(r.enganche), usd: dolares(r.enganche) },
        { concepto: t('cred.rCredito'), mxn: pesos(r.monto), usd: dolares(r.monto) },
        { concepto: t('cred.rMensualidad'), mxn: pesos(r.mensualidad), usd: dolares(r.mensualidad), total: true },
        { concepto: t('cred.rIngreso'), mxn: pesos(r.ingreso), usd: dolares(r.ingreso) }
      ]),
      nota(t('cred.nota', { tasa: Aj.numero(credito.TASA_ANUAL * 100, 2), plazo: r.plazo })));
    pintarBanner();
  }

  // Banner del precalificador: enlace de la hipotecaria o, mientras no exista, WhatsApp con el desglose
  const banner = $('#creditoBanner');
  const bannerCta = $('#creditoBannerCta');
  const urlSimulador = /^https:\/\/[^\s"'<>]+$/.test(String(A.URL_SIMULADOR_HIPOTECARIA || '').trim()) ? String(A.URL_SIMULADOR_HIPOTECARIA).trim() : '';
  function pintarBanner() {
    if (!banner) return;
    if (urlSimulador) {
      banner.href = urlSimulador;
      bannerCta.textContent = t('cred.entrar');
      return;
    }
    const r = ultimoCredito;
    const detalle = r
      ? ` Mi cálculo: propiedad de ${pesosWa(r.valor)}, enganche de ${r.porcentaje} % (${pesosWa(r.enganche)}), crédito de ${pesosWa(r.monto)} a ${r.plazo} años.`
      : '';
    banner.href = waLink(`Hola Demetrius Grupo Inmobiliario, quiero precalificarme para un crédito hipotecario.${detalle}`);
    bannerCta.textContent = t('cred.wa');
  }
  if (banner) banner.addEventListener('click', () => track('abrir_precalificador', { destino: urlSimulador ? 'simulador' : 'whatsapp' }));
  if (credResultado) {
    credEnganche.addEventListener('input', pintarCredito);
    $$('input[name="credPlazo"]').forEach(r => r.addEventListener('change', pintarCredito));
  }

  /* =========================================================
     PESTAÑA 2 — GASTOS DE ESCRITURACIÓN (JALISCO)
     ========================================================= */
  const esc = A.CONFIG_ESCRITURACION_JALISCO;
  const escResultado = $('#escResultado');
  const escMunicipio = $('#escMunicipio');
  const cotMunicipio = $('#cotMunicipio');
  const opcionesMunicipio = () => esc.MUNICIPIOS.map(m => el('option', { value: m.id }, m.nombre));
  if (escMunicipio) escMunicipio.replaceChildren(...opcionesMunicipio());
  if (cotMunicipio) cotMunicipio.replaceChildren(...opcionesMunicipio());
  const escValor = registrarImporte('escValor', 'escMoneda', pintarEscrituras);

  function calcularEscrituras() {
    const valor = escValor.pesos;
    if (!Number.isFinite(valor) || valor <= 0) return { error: t('calc.invalido') };
    const municipio = esc.MUNICIPIOS.find(m => m.id === escMunicipio.value) || esc.MUNICIPIOS[0];
    const tramo = esc.ITP_TRAMOS.find(x => valor <= x.hasta) || esc.ITP_TRAMOS[esc.ITP_TRAMOS.length - 1];
    const porcentaje = (regla, cual) => Math.max(valor * regla[cual], regla.minimoPesos || 0);
    const conceptos = [
      { clave: 'esc.rItp', vars: { municipio: municipio.nombre }, min: valor * tramo.min * municipio.ajusteItp, max: valor * tramo.max * municipio.ajusteItp },
      { clave: 'esc.rRegistro', min: porcentaje(esc.REGISTRO_PUBLICO, 'min'), max: porcentaje(esc.REGISTRO_PUBLICO, 'max') },
      { clave: 'esc.rAvaluo', min: porcentaje(esc.AVALUO, 'min') + esc.CERTIFICADOS.min, max: porcentaje(esc.AVALUO, 'max') + esc.CERTIFICADOS.max },
      { clave: 'esc.rHonorarios', min: porcentaje(esc.HONORARIOS, 'min') * (1 + esc.IVA), max: porcentaje(esc.HONORARIOS, 'max') * (1 + esc.IVA) }
    ];
    const min = conceptos.reduce((s, c) => s + c.min, 0);
    const max = conceptos.reduce((s, c) => s + c.max, 0);
    return { valor, municipio, conceptos, min, max };
  }

  function pintarEscrituras() {
    if (!escResultado) return;
    const r = calcularEscrituras();
    if (r.error) { escResultado.replaceChildren(nota(r.error, 'calc-error')); return; }
    escResultado.replaceChildren(
      tabla([
        ...r.conceptos.map(c => ({ concepto: t(c.clave, c.vars), mxn: rangoPesos(c.min, c.max), usd: rangoDolares(c.min, c.max) })),
        { concepto: t('esc.rTotal'), mxn: rangoPesos(r.min, r.max), usd: rangoDolares(r.min, r.max), total: true }
      ]),
      nota(`${t('esc.porcentaje', { min: Aj.numero(r.min / r.valor * 100, 1), max: Aj.numero(r.max / r.valor * 100, 1) })} ${t('esc.actualizado', { fecha: fecha(esc.ACTUALIZADO) })}`));
  }
  if (escMunicipio) escMunicipio.addEventListener('change', pintarEscrituras);

  // Modo A (estimador) / Modo B (cotizador general de escrituras)
  const formCotizador = $('#formCotizador');
  const bloqueEstimador = $('#escEstimador');
  $$('.herr-modos .chip').forEach(chip => chip.addEventListener('click', () => {
    $$('.herr-modos .chip').forEach(c => { c.classList.toggle('active', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
    const cotizar = chip.dataset.modo === 'cotizador';
    bloqueEstimador.hidden = cotizar;
    formCotizador.hidden = !cotizar;
    track('cambiar_modo_escrituracion', { modo: chip.dataset.modo });
  }));

  const cotValor = registrarImporte('cotValor', 'cotMoneda', null);
  if (formCotizador) {
    limpiarErroresAlEscribir(formCotizador);
    formCotizador.addEventListener('submit', (e) => {
      e.preventDefault();
      if (D.esSpam(formCotizador)) return;
      const ok = D.validarFormulario(formCotizador, [
        { id: 'cotNombre', etiqueta: 'Nombre (solo letras)', validar: D.nombreValido },
        { id: 'cotWhatsapp', etiqueta: 'Teléfono (10 dígitos)', validar: D.telefonoValido }
      ]);
      if (!ok) return;
      const municipio = (esc.MUNICIPIOS.find(m => m.id === cotMunicipio.value) || {}).nombre || 'No especificado';
      const valor = cotValor.pesos;
      const valorTexto = Number.isFinite(valor) && valor > 0
        ? pesosWa(valor) + (cotValor.moneda.value === 'USD' ? ` (escrito como ${Aj.fmtUSD(Aj.aNumero(cotValor.input.value))})` : '')
        : 'No especificado';
      const mensaje = `Hola Demetrius Grupo Inmobiliario, quiero solicitar una *cotización de escrituras*:${SALTO}${SALTO}` +
        `📄 *Trámite:* ${D.valor('cotTramite', 120)}${SALTO}` +
        `👤 *Nombre:* ${D.valor('cotNombre')}${SALTO}` +
        `📞 *WhatsApp:* ${D.valor('cotWhatsapp')}${SALTO}` +
        `📍 *Municipio:* ${municipio}${SALTO}` +
        `💰 *Valor estimado:* ${valorTexto}${SALTO}` +
        `📝 *Detalles:* ${D.valor('cotDetalles', 800, true) || 'No especificado'}`;
      abrirWhatsApp(waLink(mensaje), formCotizador);
      track('solicitar_cotizacion_escrituras', { tramite: D.valor('cotTramite', 120), municipio });
    });
  }

  /* =========================================================
     PESTAÑA 3 — PRE-DIAGNÓSTICO DE ISR POR VENTA
     ========================================================= */
  const isr = A.CONFIG_ISR;
  const isrResultado = $('#isrResultado');
  const isrValor = registrarImporte('isrValor', 'isrMoneda', pintarIsr);
  const respuesta = (nombre) => ($(`input[name="${nombre}"]:checked`) || {}).value === 'si';

  function pintarIsr() {
    if (!isrResultado) return;
    const valor = isrValor.pesos;
    if (!Number.isFinite(valor) || valor <= 0) { isrResultado.replaceChildren(nota(t('calc.invalido'), 'calc-error')); return; }
    const tope = isr.UDIS_EXENTAS * isr.VALOR_UDI;
    const ambas = (n) => `${pesos(n)} · ${dolares(n)}`;
    const casa = respuesta('isrCasa');
    const comprobantes = respuesta('isrComprobantes');
    const previo = respuesta('isrPrevio');

    let tipo, titulo, detalle, resumen;
    if (!casa) { tipo = 'estudio'; titulo = t('isr.estudio.t'); detalle = t('isr.estudio.noCasa'); resumen = 'Requiere estudio de deducciones (no es casa habitación)'; }
    else if (previo) { tipo = 'estudio'; titulo = t('isr.estudio.t'); detalle = t('isr.estudio.previo'); resumen = 'Requiere estudio de deducciones (ya usó la exención en los últimos 3 años)'; }
    else if (!comprobantes) { tipo = 'estudio'; titulo = t('isr.estudio.t'); detalle = t('isr.estudio.sinComprobantes'); resumen = 'Requiere estudio de deducciones (sin comprobantes de domicilio)'; }
    else if (valor <= tope) { tipo = 'total'; titulo = t('isr.total.t'); detalle = t('isr.total.d', { valor: ambas(valor), tope: ambas(tope) }); resumen = 'Candidato a exención total'; }
    else { tipo = 'parcial'; titulo = t('isr.parcial.t'); detalle = t('isr.parcial.d', { valor: ambas(valor), tope: ambas(tope), excedente: ambas(valor - tope) }); resumen = `Exención parcial (excedente de ${pesosWa(valor - tope)})`; }

    const mensaje = `Hola Demetrius Grupo Inmobiliario, quiero mi *cálculo personalizado de ISR* por la venta de un inmueble.${SALTO}${SALTO}` +
      `🏠 *¿Casa habitación?:* ${casa ? 'Sí' : 'No'}${SALTO}` +
      `🧾 *¿Comprobantes a mi nombre?:* ${comprobantes ? 'Sí' : 'No'}${SALTO}` +
      `📅 *¿Exentó en los últimos 3 años?:* ${previo ? 'Sí' : 'No'}${SALTO}` +
      `💰 *Valor estimado de venta:* ${pesosWa(valor)}${SALTO}` +
      `📊 *Pre-diagnóstico de la página:* ${resumen}`;
    const cta = el('a', { clase: 'cta-btn calc-cta', href: waLink(mensaje), target: '_blank', rel: 'noopener noreferrer', 'data-ubicacion': 'isr' }, t('isr.cta'));
    cta.addEventListener('click', () => track('solicitar_calculo_isr', { diagnostico: tipo }));

    isrResultado.replaceChildren(
      el('div', { clase: `isr-diagnostico isr-diagnostico--${tipo}` },
        el('span', { clase: 'isr-diagnostico-etiqueta' }, t('isr.etiqueta')),
        el('strong', {}, titulo),
        el('p', {}, detalle)),
      nota(t('isr.udi', { udi: Aj.numero(isr.VALOR_UDI, 6), fecha: fecha(isr.FECHA_UDI), tope: ambas(tope) })),
      cta);
  }
  if (isrResultado) $$('#calcIsr input[type="radio"]').forEach(r => r.addEventListener('change', pintarIsr));

  /* =========================================================
     NOTA DEL TIPO DE CAMBIO + REPINTAR AL CAMBIAR MONEDA O IDIOMA
     ========================================================= */
  const notaTc = $('#herrTipoCambio');
  function pintarTodo() {
    pintarCredito();
    pintarEscrituras();
    pintarIsr();
    if (notaTc) notaTc.textContent = `${t('tc.herr')} ${Aj.notaTipoCambio()}`;
  }
  Aj.alCambiar((motivo) => {
    if (motivo === 'moneda') importes.forEach(c => c.seguirMoneda());
    pintarTodo();
    if (valuacion.repintar) valuacion.repintar();
  });
  // El tipo de cambio del día se pide cuando las calculadoras están por verse
  if (seccion && 'IntersectionObserver' in window) {
    const alVer = new IntersectionObserver((entradas) => {
      if (entradas.some(en => en.isIntersecting)) { alVer.disconnect(); Aj.cargarTasa(); }
    }, { rootMargin: '300px 0px' });
    alVer.observe(seccion);
  } else if (seccion) {
    Aj.cargarTasa();
  }

  /* =========================================================
     VALUACIÓN INSTANTÁNEA (formulario #formValuacion de la sección «Vende con nosotros»)
     js/principal.js valida el formulario y llama a DemetriusValuacion.mostrar(datos, enviar).
     ========================================================= */
  const mercado = A.VALORES_MERCADO_PORTALES_ZMG;
  const formValuacion = $('#formValuacion');
  const valuacion = { repintar: null };
  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Colonia escrita por la persona → renglón de la tabla (si no aparece, se usa el promedio del municipio)
  function valoresDeZona(colonia, municipio) {
    const buscada = normalizar(colonia);
    if (buscada.length >= 4) {
      const fila = mercado.COLONIAS.find(c => c.nombres.some(n => {
        const nombre = normalizar(n);
        return buscada === nombre || buscada.includes(nombre) || (buscada.length >= 6 && nombre.includes(buscada));
      }));
      if (fila) return { valores: fila, zona: fila.nombres[0], porColonia: true };
    }
    const valores = mercado.MUNICIPIOS[municipio] || mercado.MUNICIPIOS.Otro;
    return { valores, zona: municipio, porColonia: false };
  }

  function estimar(datos) {
    const construccion = Aj.aNumero(datos.construccion);
    const terreno = Aj.aNumero(datos.terreno);
    const hayConstruccion = Number.isFinite(construccion) && construccion > 0;
    const hayTerreno = Number.isFinite(terreno) && terreno > 0;
    const { valores, zona, porColonia } = valoresDeZona(datos.colonia, datos.municipio);
    const factor = (tabla, llave) => (tabla[llave] !== undefined ? tabla[llave] : 1);
    const porAntiguedad = factor(mercado.ANTIGUEDAD, datos.antiguedad);
    const porDistribucion = factor(mercado.RECAMARAS, datos.recamaras) * factor(mercado.BANOS, datos.banos);

    let base, superficie, unidad, supuesto = false;
    if (datos.tipo === 'Terreno') {
      if (!hayTerreno) return null;
      base = terreno * valores.terreno; superficie = terreno; unidad = 'terreno';
    } else if (datos.tipo === 'Departamento') {
      if (!hayConstruccion) return null;
      base = construccion * valores.depto * porAntiguedad * porDistribucion; superficie = construccion; unidad = 'construccion';
    } else {
      // Casa o local comercial: terreno + construcción. Sin m² de terreno se supone un lote típico (75 % de la construcción)
      if (!hayConstruccion) return null;
      supuesto = !hayTerreno;
      const lote = hayTerreno ? terreno : construccion * 0.75;
      base = lote * valores.terreno + construccion * valores.construccion * porAntiguedad;
      base *= datos.tipo === 'Casa' ? porDistribucion : mercado.LOCAL_COMERCIAL;
      superficie = construccion; unidad = 'construccion';
    }
    // Cifras cerradas: es un estimado, no un avalúo
    const cerrar = (n) => (n >= 1000000 ? Math.round(n / 10000) * 10000 : Math.round(n / 1000) * 1000);
    return {
      promedio: cerrar(base), min: cerrar(base * (1 - mercado.RANGO)), max: cerrar(base * (1 + mercado.RANGO)),
      porM2: Math.round(base / superficie / 100) * 100, unidad, zona, porColonia, supuesto
    };
  }

  if (formValuacion) {
    const tarjeta = el('div', { clase: 'valuacion', id: 'valResultado', role: 'region', 'aria-live': 'polite', 'data-no-i18n': true, hidden: true });
    formValuacion.append(tarjeta);
    let reloj = null;
    const ocultar = () => { clearTimeout(reloj); tarjeta.hidden = true; tarjeta.replaceChildren(); valuacion.repintar = null; };
    // Si la persona corrige un dato, el resultado anterior ya no vale: se oculta hasta que vuelva a enviar
    formValuacion.addEventListener('input', (e) => { if (!tarjeta.hidden && !tarjeta.contains(e.target)) ocultar(); });
    formValuacion.addEventListener('change', (e) => { if (!tarjeta.hidden && !tarjeta.contains(e.target)) ocultar(); });

    const dato = (etiqueta, importe, extra) => el('div', { clase: 'valuacion-dato' },
      el('span', { clase: 'valuacion-etiqueta' }, etiqueta),
      el('b', {}, pesos(importe) + (extra ? ` ${extra}` : '')),
      el('span', { clase: 'valuacion-usd' }, dolares(importe) + (extra ? ` ${extra}` : '')));

    function pintarResultado(datos, enviar) {
      const r = estimar(datos);
      const corregir = el('button', { type: 'button', clase: 'valuacion-corregir' }, t('val.corregir'));
      corregir.addEventListener('click', () => { ocultar(); $('#valConstruccion').focus(); });
      const confirmar = el('button', { type: 'button', clase: 'form-submit valuacion-confirmar' }, t(r ? 'val.confirmar' : 'val.enviarSin'));
      confirmar.addEventListener('click', () => {
        const extra = r
          ? `${SALTO}${SALTO}📊 *Valuación instantánea de la página (estimado informativo):*${SALTO}` +
            `• Mínimo: ${pesosWa(r.min)}${SALTO}• Promedio sugerido: ${pesosWa(r.promedio)}${SALTO}• Máximo: ${pesosWa(r.max)}${SALTO}` +
            `• Precio por m² de ${r.unidad === 'terreno' ? 'terreno' : 'construcción'}: ${pesosWa(r.porM2)}${SALTO}` +
            `• Zona de referencia: ${r.porColonia ? r.zona : `promedio de ${r.zona}`}`
          : '';
        enviar(extra);
        track('confirmar_valuacion_instantanea', { con_rango: !!r });
      });

      if (!r) {
        tarjeta.replaceChildren(
          el('h4', {}, t('val.titulo')),
          el('p', { clase: 'valuacion-aviso' }, t('val.faltan')),
          el('div', { clase: 'valuacion-acciones' }, confirmar, corregir));
        return;
      }
      const porM2 = t(r.unidad === 'terreno' ? 'val.m2t' : 'val.m2c');
      // (replaceChildren escribiría "null" como texto: por eso se filtran los renglones que no aplican)
      tarjeta.replaceChildren(...[
        el('span', { clase: 'valuacion-kicker' }, t('val.rango')),
        el('h4', {}, t('val.titulo')),
        el('p', { clase: 'valuacion-zona' }, t('val.zona', { zona: r.porColonia ? r.zona : t('val.zonaMunicipio', { municipio: r.zona }) })),
        el('div', { clase: 'valuacion-datos' },
          dato(t('val.min'), r.min),
          el('div', { clase: 'valuacion-dato valuacion-dato--principal' },
            el('span', { clase: 'valuacion-etiqueta' }, t('val.prom')),
            el('b', {}, pesos(r.promedio)),
            el('span', { clase: 'valuacion-usd' }, dolares(r.promedio))),
          dato(t('val.max'), r.max),
          dato(t('val.m2'), r.porM2, porM2)),
        r.supuesto ? el('p', { clase: 'valuacion-aviso' }, t('val.supuesto')) : null,
        el('p', { clase: 'valuacion-nota' }, `${t('val.nota', { fecha: fecha(mercado.ACTUALIZADO) })} ${Aj.notaTipoCambio()}`),
        el('div', { clase: 'valuacion-acciones' }, confirmar, corregir)
      ].filter(Boolean));
    }

    window.DemetriusValuacion = Object.freeze({
      mostrar(datos, enviar) {
        clearTimeout(reloj);
        Aj.cargarTasa();
        tarjeta.hidden = false;
        tarjeta.replaceChildren(
          el('div', { clase: 'valuacion-cargando' },
            el('span', { clase: 'valuacion-giro', 'aria-hidden': 'true' }),
            el('p', {}, t('val.analizando'))));
        tarjeta.scrollIntoView({ behavior: D.scrollBehavior, block: 'center' });
        valuacion.repintar = null;
        reloj = setTimeout(() => {
          pintarResultado(datos, enviar);
          valuacion.repintar = () => pintarResultado(datos, enviar);
          track('ver_valuacion_instantanea', { tipo_propiedad: datos.tipo, municipio: datos.municipio });
        }, reducirMovimiento ? 250 : 1700);
      }
    });
  }

  pintarTodo();
})();
