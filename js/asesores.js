/* Demetrius Grupo Inmobiliario — sección #asesores: directorio y perfil de cada asesor
   Los perfiles se editan en js/ajustes.js (ASESORES_DEMETRIUS). Aquí solo se pintan:
   filtros por especialidad, páginas, tarjetas y el modal «Acerca de…» con su formulario,
   que abre WhatsApp con el número del asesor elegido. Sin innerHTML. */
(() => {
  'use strict';
  const D = window.Demetrius;
  const Aj = window.DemetriusAjustes;
  const A = window.DEMETRIUS_AJUSTES;
  const grid = document.getElementById('asesoresGrid');
  if (!D || !Aj || !A || !grid) return;
  const { $, $$, el, limpiar, track } = D;
  const t = Aj.t;
  const tr = (texto) => (Aj.idioma === 'en' ? Aj.aIngles(texto) : texto);

  const POR_PAGINA = 6;
  const SALTO = String.fromCharCode(10);
  const NS_SVG = 'http://www.w3.org/2000/svg';
  const TRAZO_PERSONA = 'M12 12a4.6 4.6 0 1 0 0-9.2 4.6 4.6 0 0 0 0 9.2zm0 2.1c-4.5 0-8.2 2.3-8.2 5.2v1.9h16.4v-1.9c0-2.9-3.7-5.2-8.2-5.2z';
  function iconoPersona() {
    const svg = document.createElementNS(NS_SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const trazo = document.createElementNS(NS_SVG, 'path');
    trazo.setAttribute('d', TRAZO_PERSONA);
    svg.append(trazo);
    return svg;
  }

  // Solo entran los perfiles completos: nombre y WhatsApp con lada de país (10 a 15 dígitos)
  const asesores = (Array.isArray(A.ASESORES_DEMETRIUS) ? A.ASESORES_DEMETRIUS : [])
    .filter(a => a && typeof a.nombre === 'string' && a.nombre.trim() && /^\d{10,15}$/.test(String(a.whatsapp || '')))
    .map(a => ({
      nombre: limpiar(a.nombre, 80),
      nombreCorto: limpiar(a.nombreCorto || a.nombre.split(/\s+/)[0], 40),
      cargo: limpiar(a.cargo || 'Asesor inmobiliario', 60),
      oficina: limpiar(a.oficina || 'Demetrius Grupo Inmobiliario', 80),
      ciudad: limpiar(a.ciudad || 'Guadalajara / Zapopan, Jal.', 80),
      especialidades: (Array.isArray(a.especialidades) ? a.especialidades : []).map(e => limpiar(e, 30)).filter(Boolean),
      experiencia: limpiar(a.experiencia || '', 40),
      idiomas: (Array.isArray(a.idiomas) && a.idiomas.length ? a.idiomas : ['Español']).map(i => limpiar(i, 30)),
      whatsapp: String(a.whatsapp),
      // La foto debe ser un archivo del sitio o una dirección https
      foto: /^(https:\/\/[^\s"'<>]+|[^:\s"'<>]+\.(jpe?g|png|webp))$/i.test(String(a.foto || '')) ? String(a.foto) : '',
      verificado: a.verificado !== false
    }));

  const iniciales = (nombre) => nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');

  /* ---------- Directorio ---------- */
  const filtros = $$('#asesoresFiltros .chip');
  const anterior = $('#asesoresAnterior');
  const siguiente = $('#asesoresSiguiente');
  const indicador = $('#asesoresPagina');
  const vacio = $('#asesoresVacio');
  let especialidad = 'todos';
  let pagina = 0;

  function tarjeta(a) {
    const foto = a.foto
      ? el('img', { clase: 'asesor-foto', src: a.foto, alt: a.nombre, width: 240, height: 240, loading: 'lazy', decoding: 'async' })
      : el('span', { clase: 'asesor-foto asesor-foto--iniciales', 'aria-hidden': 'true' }, iniciales(a.nombre));
    const ver = el('button', { type: 'button', clase: 'asesor-ver', 'aria-label': `${t('ases.ver')}: ${a.nombre}` }, iconoPersona(), el('span', {}, t('ases.ver')));
    ver.addEventListener('click', () => abrirPerfil(a));
    return el('article', { clase: 'asesor-card' },
      a.verificado ? el('span', { clase: 'asesor-insignia', role: 'img', 'aria-label': t('ases.verificadoLargo'), title: t('ases.verificadoLargo') }, '✓') : null,
      foto,
      el('h3', {}, a.nombre),
      el('p', { clase: 'asesor-cargo' }, tr(a.cargo)),
      el('p', { clase: 'asesor-oficina' }, a.oficina),
      a.especialidades.length ? el('div', { clase: 'asesor-pills' }, a.especialidades.map(e => el('span', {}, tr(e)))) : null,
      a.experiencia ? el('p', { clase: 'asesor-exp' }, tr(a.experiencia)) : null,
      ver);
  }

  function pintar() {
    const lista = asesores.filter(a => especialidad === 'todos' || a.especialidades.includes(especialidad));
    const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    pagina = Math.min(Math.max(pagina, 0), paginas - 1);
    grid.replaceChildren(...lista.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA).map(tarjeta));
    grid.hidden = lista.length === 0;
    vacio.hidden = lista.length > 0;
    indicador.textContent = `${pagina + 1} / ${paginas}`;
    anterior.disabled = pagina === 0;
    siguiente.disabled = pagina >= paginas - 1;
  }

  filtros.forEach(chip => chip.addEventListener('click', () => {
    filtros.forEach(c => { c.classList.toggle('active', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
    especialidad = chip.dataset.especialidad;
    pagina = 0;
    pintar();
    track('filtrar_asesores', { especialidad });
  }));
  anterior.addEventListener('click', () => { pagina -= 1; pintar(); });
  siguiente.addEventListener('click', () => { pagina += 1; pintar(); });

  /* ---------- Perfil (modal) ---------- */
  const modal = $('#modalAsesor');
  const form = $('#formAsesor');
  const mensaje = $('#asMensaje');
  let abierto = null;       // asesor del modal
  let mensajeSugerido = ''; // texto que se puso solo en el mensaje (para no borrar lo que escriba la persona)

  function pintarPerfil() {
    const a = abierto;
    if (!a) return;
    $('#asesorTitulo').textContent = t('ases.acerca', { nombre: a.nombre });
    $('#asesorDescripcion').textContent = t('ases.desc', { cargo: tr(a.cargo), ciudad: a.ciudad.replace(/\.$/, ''), nombre: a.nombre });
    $('#asesorOficina').textContent = a.oficina;
    $('#asesorCiudad').textContent = a.ciudad;
    $('#asesorIdiomas').replaceChildren(...a.idiomas.map(i => el('span', {}, tr(i))));
    $('#asesorContactoTitulo').textContent = t('ases.contactar', { nombre: a.nombreCorto });
    const sugerido = t('ases.msgDefault', { nombre: a.nombreCorto });
    if (!mensaje.value.trim() || mensaje.value === mensajeSugerido) mensaje.value = sugerido;
    mensajeSugerido = sugerido;
  }

  function abrirPerfil(a) {
    if (abierto !== a) { mensaje.value = ''; D.mensajeForm(form, 'ok'); }
    abierto = a;
    pintarPerfil();
    D.abrirModal('modalAsesor');
    track('ver_perfil_asesor', { asesor: a.nombre });
  }

  const quitarError = (e) => {
    if (e.target.classList.contains('is-invalid')) e.target.classList.remove('is-invalid');
    if (e.target.name === 'acepto' && e.target.checked) e.target.closest('.consent').classList.remove('is-invalid');
  };
  form.addEventListener('input', quitarError);
  form.addEventListener('change', quitarError);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!abierto || D.esSpam(form)) return;
    const ok = D.validarFormulario(form, [
      { id: 'asNombre', etiqueta: 'Nombre (solo letras)', validar: D.nombreValido },
      { id: 'asCorreo', etiqueta: 'Correo electrónico' },
      { id: 'asMensaje', etiqueta: 'Mensaje' }
    ]);
    if (!ok) return;
    const telefono = D.valor('asTelefono');
    if (telefono && !D.telefonoValido(telefono)) {
      const campo = $('#asTelefono');
      campo.classList.add('is-invalid');
      D.mensajeForm(form, 'error', 'Por favor completa: Teléfono (10 dígitos).');
      campo.focus();
      return;
    }
    const texto = `Hola ${abierto.nombreCorto}, te escribo desde la página de Demetrius Grupo Inmobiliario.${SALTO}${SALTO}` +
      `👤 *Nombre:* ${D.valor('asNombre')}${SALTO}` +
      `📧 *Correo:* ${D.valor('asCorreo', 100)}${SALTO}` +
      `📞 *Teléfono:* ${telefono || 'No especificado'}${SALTO}` +
      `📝 *Mensaje:* ${D.valor('asMensaje', 600, true)}`;
    const url = `https://wa.me/${abierto.whatsapp}?text=${encodeURIComponent(texto)}`;
    const ventana = window.open(url, '_blank');
    if (ventana) { try { ventana.opener = null; } catch (err) { /* sin acceso */ } }
    D.mensajeForm(form, 'ok', '¡Gracias! Abrimos WhatsApp con tu solicitud. Si no se abrió, ', D.enlaceExterno(url, 'toca aquí'), '.');
    track('contactar_asesor', { asesor: abierto.nombre });
  });

  Aj.alCambiar((motivo) => {
    if (motivo !== 'idioma' && motivo !== 'inicio') return;
    pintar();
    if (modal.open) pintarPerfil();
  });
  pintar();
})();
