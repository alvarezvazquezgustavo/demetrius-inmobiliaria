/* Demetrius Grupo Inmobiliario — panel del equipo (panel/index.html)
   Vistas: #mis · #nueva · #editar/<id> · #validacion · #todas · #equipo (las tres últimas, solo admin).
   Ocultar botones aquí es solo comodidad: la base de datos (RLS) decide qué puede hacer cada quien. */
(() => {
  'use strict';
  const { sb, $, $$, el, limpiar, uuid, formatoFecha, mensajeError, sesionExpirada, BUCKET } = window.Panel;
  const P = window.DemetriusPropiedades;

  const ESTADOS = { borrador: 'Borrador', en_validacion: 'En validación', publicada: 'Publicada', rechazada: 'Rechazada', vendida: 'Vendida', rentada: 'Rentada' };
  const MAX_FOTOS = 20;
  const LADO_MAX = 1600;          // px del lado mayor después de reducir
  const CALIDAD_JPEG = 0.82;
  const MAX_ARCHIVO = 25 * 1024 * 1024; // 25 MB antes de reducir
  const CENTRO_ZMG = [20.67, -103.38];
  const CENTROS = {
    guadalajara: [20.6767, -103.3475], zapopan: [20.7214, -103.391], tlaquepaque: [20.6409, -103.3108], tonala: [20.624, -103.234],
    elsalto: [20.5195, -103.1817], juanacatlan: [20.5079, -103.1667], tlajomulco: [20.4736, -103.4469], chapala: [20.296, -103.191],
    jocotepec: [20.2867, -103.429], mazamitla: [19.9156, -103.0197], tapalpa: [19.9447, -103.7589], vallarta: [20.6534, -105.2253]
  };

  let yo = null;
  let esAdmin = false;
  let saliendo = false;
  let vistaActual = '';
  let filtroTodas = '';

  const urlFicha = (id) => `../${P.urlFicha(id)}`;
  const nombreAsesor = (p) => (p.asesor && (p.asesor.nombre || p.asesor.correo)) || 'Sin asesor asignado';

  /* =========================================================
     UTILIDADES DE PANTALLA
     ========================================================= */
  let toastTimer;
  function toast(texto) {
    const t = $('#pnToast');
    t.textContent = texto;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 4500);
  }
  function errorGlobal(texto) {
    const p = $('#pnErrorGlobal');
    p.textContent = texto || '';
    p.hidden = !texto;
  }
  async function manejarError(err) {
    if (sesionExpirada(err)) { await salir('sesion'); return; }
    errorGlobal(mensajeError(err));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const cargandoEn = (lista, texto) => lista.replaceChildren(el('p', { clase: 'pn-cargando' }, texto));
  function boton(texto, clase, alHacerClic) {
    const b = el('button', { type: 'button', clase: `pn-btn ${clase}` }, texto);
    b.addEventListener('click', () => alHacerClic(b));
    return b;
  }
  const enlace = (texto, clase, href, externo = false) =>
    el('a', { clase: `pn-btn ${clase}`, href, target: externo ? '_blank' : null, rel: externo ? 'noopener noreferrer' : null }, texto);

  /* ---------- Confirmaciones (con comentario opcional u obligatorio) ---------- */
  const dlg = $('#dlgConfirmar');
  function confirmar({ titulo, texto, aceptar = 'Confirmar', peligro = false, comentario = null }) {
    return new Promise(resolve => {
      const campo = $('#dlgConfirmarCampo');
      const area = $('#dlgConfirmarComentario');
      const error = $('#dlgConfirmarError');
      const form = $('#dlgConfirmarForm');
      const cancelar = $('#dlgConfirmarCancelar');
      const aceptarBtn = $('#dlgConfirmarAceptar');
      $('#dlgConfirmarTitulo').textContent = titulo;
      $('#dlgConfirmarTexto').textContent = texto || '';
      campo.hidden = !comentario;
      area.value = '';
      area.removeAttribute('aria-invalid');
      error.hidden = true;
      if (comentario) { $('#dlgConfirmarEtiqueta').textContent = comentario.etiqueta; area.placeholder = comentario.ejemplo || ''; }
      aceptarBtn.textContent = aceptar;
      aceptarBtn.className = `pn-btn ${peligro ? 'pn-btn-peligro' : 'pn-btn-primario'}`;

      const terminar = (valor) => {
        form.removeEventListener('submit', alAceptar);
        cancelar.removeEventListener('click', alCancelar);
        dlg.removeEventListener('cancel', alCancelar);
        if (dlg.open) dlg.close();
        resolve(valor);
      };
      function alAceptar(e) {
        e.preventDefault();
        if (!comentario) return terminar(true);
        const v = limpiar(area.value, 1000, true);
        if (comentario.obligatorio && v.length < 5) {
          error.textContent = 'Escribe un comentario de al menos 5 caracteres para que el asesor sepa qué corregir.';
          error.hidden = false;
          area.setAttribute('aria-invalid', 'true');
          area.focus();
          return;
        }
        terminar(v);
      }
      function alCancelar(e) { if (e) e.preventDefault(); terminar(false); }
      form.addEventListener('submit', alAceptar);
      cancelar.addEventListener('click', alCancelar);
      dlg.addEventListener('cancel', alCancelar);
      dlg.showModal();
      (comentario ? area : cancelar).focus();
    });
  }

  /* =========================================================
     SESIÓN
     ========================================================= */
  async function salir(motivo = 'salida') {
    saliendo = true;
    try {
      const { error } = await sb.auth.signOut();
      if (error) await sb.auth.signOut({ scope: 'local' });
    } catch (e) {
      try { await sb.auth.signOut({ scope: 'local' }); } catch (_) { /* sin sesión local */ }
    }
    location.replace(`login.html?motivo=${encodeURIComponent(motivo)}`);
  }

  async function iniciar() {
    if (!sb) {
      $('#pnCargando').hidden = true;
      errorGlobal('El panel no está conectado con Supabase. Revisa la dirección y la llave en js/config.js.');
      return;
    }
    const { data } = await sb.auth.getSession();
    if (!data || !data.session) { location.replace('login.html'); return; }

    const { data: perfiles, error } = await sb.from('perfiles').select('id,correo,nombre,rol,activo').eq('id', data.session.user.id).limit(1);
    if (error) {
      if (sesionExpirada(error)) return salir('sesion');
      $('#pnCargando').hidden = true;
      errorGlobal(mensajeError(error));
      return;
    }
    const perfil = perfiles && perfiles[0];
    if (!perfil) return salir('sinperfil');
    if (!perfil.activo) return salir('inactiva');

    yo = perfil;
    esAdmin = perfil.rol === 'admin';
    $('#pnNombre').textContent = perfil.nombre || perfil.correo;
    $('#pnRol').textContent = esAdmin ? 'Administrador' : 'Asesor';
    $$('[data-solo-admin]').forEach(n => { n.hidden = !esAdmin; });
    $('#pnNav').hidden = false;
    $('#pnUsuario').hidden = false;
    $('#pnCargando').hidden = true;

    sb.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT' && !saliendo) location.replace('login.html?motivo=sesion');
    });
    $('#pnSalir').addEventListener('click', () => salir('salida'));
    if (esAdmin) actualizarContador();
    window.addEventListener('hashchange', mostrarVista);
    mostrarVista();
  }

  /* =========================================================
     NAVEGACIÓN ENTRE VISTAS
     ========================================================= */
  const VISTAS = {
    mis: { seccion: 'vista-mis', titulo: 'Mis propiedades' },
    nueva: { seccion: 'vista-formulario', titulo: 'Cargar propiedad' },
    editar: { seccion: 'vista-formulario', titulo: 'Editar propiedad' },
    validacion: { seccion: 'vista-validacion', titulo: 'Por validar', admin: true },
    todas: { seccion: 'vista-todas', titulo: 'Todas las propiedades', admin: true },
    equipo: { seccion: 'vista-equipo', titulo: 'Equipo', admin: true }
  };
  function leerRuta() {
    const [vista, id] = location.hash.replace(/^#/, '').split('/');
    return { vista: VISTAS[vista] ? vista : 'mis', id: id || '' };
  }
  function mostrarVista() {
    const { vista, id } = leerRuta();
    if (VISTAS[vista].admin && !esAdmin) { location.replace('#mis'); return; }
    errorGlobal('');
    $$('.pn-vista').forEach(s => { s.hidden = s.id !== VISTAS[vista].seccion; });
    $$('#pnNav a').forEach(a => {
      if (a.dataset.vista === vista) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    vistaActual = vista;
    document.title = `${VISTAS[vista].titulo} | Panel Demetrius`;
    window.scrollTo(0, 0);
    if (vista === 'mis') cargarMis();
    else if (vista === 'nueva') abrirFormulario(null);
    else if (vista === 'editar') abrirFormularioPorId(id);
    else if (vista === 'validacion') cargarValidacion();
    else if (vista === 'todas') cargarTodas();
    else if (vista === 'equipo') cargarEquipo();
  }
  function recargarVista() {
    if (vistaActual === 'mis') cargarMis();
    if (vistaActual === 'validacion') cargarValidacion();
    if (vistaActual === 'todas') cargarTodas();
    if (esAdmin) actualizarContador();
  }

  async function actualizarContador() {
    const { count, error } = await sb.from('propiedades').select('id', { count: 'exact', head: true }).eq('estado', 'en_validacion');
    if (error) return;
    const c = $('#pnContador');
    c.textContent = String(count || 0);
    c.hidden = !count;
  }

  /* =========================================================
     TARJETAS DE LAS LISTAS
     ========================================================= */
  function textoFecha(p) {
    if (p.estado === 'en_validacion' && p.enviada) return `Enviada el ${formatoFecha(p.enviada)}`;
    if (p.estado === 'publicada' && p.publicada_en) return `Publicada el ${formatoFecha(p.publicada_en)}`;
    return `Actualizada el ${formatoFecha(p.actualizada)}`;
  }

  function bloqueDetalles(p) {
    const datos = [
      ...P.caracteristicas(p),
      p.operacion === 'venta renta' && p.precio_renta != null ? ['Renta mensual', `${P.dinero(p.precio_renta)} / mes`] : null,
      ['Etiqueta', p.etiqueta || '—'],
      ['Ubicación en el mapa', Number.isFinite(p.lat) ? `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` : 'Sin marcar'],
      ['Amenidades', (p.amenidades || []).join(', ') || '—']
    ].filter(Boolean);
    const fotos = p.fotos || [];
    return el('details', { clase: 'pn-detalles' },
      el('summary', {}, `Ver todos los datos y fotos (${fotos.length})`),
      fotos.length ? el('div', { clase: 'pn-detalles-fotos' }, fotos.map((ruta, i) =>
        el('a', { href: P.urlFoto(ruta), target: '_blank', rel: 'noopener noreferrer', 'aria-label': `Abrir la foto ${i + 1} en otra pestaña` },
          el('img', { src: P.urlFoto(ruta), alt: '', loading: 'lazy', decoding: 'async' })))) : null,
      el('dl', {}, datos.map(([dt, dd]) => el('div', {}, el('dt', {}, dt), el('dd', {}, dd)))),
      p.descripcion ? el('p', { clase: 'pn-detalles-texto' }, p.descripcion) : null);
  }

  function tarjeta(p, { acciones = [], asesor = false, detalles = false } = {}) {
    const portada = p.fotos && p.fotos[0]
      ? el('img', { clase: 'pn-item-foto', src: P.urlFoto(p.fotos[0]), alt: '', loading: 'lazy', decoding: 'async' })
      : el('div', { clase: 'pn-item-foto pn-item-sinfoto' }, 'Sin foto');
    const cuerpo = el('div', { clase: 'pn-item-cuerpo' },
      el('div', { clase: 'pn-item-top' },
        el('span', { clase: `pn-estado pn-estado--${p.estado}` }, ESTADOS[p.estado] || p.estado),
        el('span', { clase: 'pn-item-fecha' }, textoFecha(p))),
      el('h3', {}, p.titulo),
      el('p', { clase: 'pn-item-zona' }, [P.textoZona(p), P.TIPOS[p.tipo], P.OPERACIONES[p.operacion]].filter(Boolean).join(' · ')),
      el('p', { clase: 'pn-item-precio' }, P.textoPrecio(p)),
      asesor ? el('p', { clase: 'pn-item-asesor' }, 'Asesor: ', el('b', {}, nombreAsesor(p))) : null,
      p.estado === 'rechazada' && p.comentario_admin
        ? el('div', { clase: 'pn-comentario' }, el('b', {}, 'Comentario del administrador'), p.comentario_admin)
        : null);
    const item = el('article', { clase: 'pn-item', 'data-id': p.id }, portada, cuerpo,
      acciones.length ? el('div', { clase: 'pn-item-acciones' }, acciones) : null);
    if (detalles) item.append(bloqueDetalles(p));
    return item;
  }

  /* ---------- Acciones sobre una propiedad ---------- */
  async function cambiarEstado(p, cambios, textoOk, b) {
    if (b) b.disabled = true;
    try {
      const { data, error } = await sb.from('propiedades').update(cambios).eq('id', p.id).select('id,estado');
      if (error) throw error;
      if (!data || !data.length) throw { code: 'PGRST116' };
      toast(textoOk);
      recargarVista();
    } catch (err) {
      if (b) b.disabled = false;
      manejarError(err);
    }
  }

  async function enviarAValidacion(p, b) {
    if (!p.fotos || !p.fotos.length) {
      errorGlobal(`«${p.titulo}» no tiene fotos. Edítala, agrega al menos una foto y vuelve a enviarla.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const ok = await confirmar({
      titulo: '¿Enviar a validación?',
      texto: `El administrador revisará «${p.titulo}». Mientras esté en validación no podrás editarla.`,
      aceptar: 'Enviar a validación'
    });
    if (ok) cambiarEstado(p, { estado: 'en_validacion' }, 'Listo: la propiedad se envió a validación.', b);
  }

  async function borrarBorrador(p, b) {
    const ok = await confirmar({
      titulo: '¿Borrar este borrador?',
      texto: `Se borrará «${p.titulo}» junto con sus fotos. Esta acción no se puede deshacer.`,
      aceptar: 'Sí, borrar',
      peligro: true
    });
    if (!ok) return;
    b.disabled = true;
    try {
      // 1) quita las fotos de la ficha, 2) borra los archivos, 3) borra la propiedad
      if (p.fotos && p.fotos.length) {
        const r1 = await sb.from('propiedades').update({ fotos: [] }).eq('id', p.id).select('id');
        if (r1.error) throw r1.error;
        const r2 = await sb.storage.from(BUCKET).remove(p.fotos);
        if (r2.error) throw r2.error;
      }
      const { data, error } = await sb.from('propiedades').delete().eq('id', p.id).select('id');
      if (error) throw error;
      if (!data || !data.length) throw { code: 'PGRST116' };
      toast('El borrador se eliminó.');
      cargarMis();
    } catch (err) {
      b.disabled = false;
      manejarError(err);
    }
  }

  async function aprobar(p, b) {
    const ok = await confirmar({
      titulo: '¿Aprobar y publicar?',
      texto: `«${p.titulo}» aparecerá en la página de inmediato.`,
      aceptar: 'Aprobar y publicar'
    });
    if (ok) cambiarEstado(p, { estado: 'publicada', comentario_admin: null }, 'Propiedad publicada en la página.', b);
  }

  async function rechazar(p, b) {
    const comentario = await confirmar({
      titulo: 'Rechazar propiedad',
      texto: `Explícale al asesor qué debe corregir en «${p.titulo}». Podrá editarla y volver a enviarla.`,
      aceptar: 'Rechazar',
      peligro: true,
      comentario: { etiqueta: 'Comentario para el asesor', obligatorio: true, ejemplo: 'Ej. Faltan fotos de la cocina y el precio no coincide con el folleto.' }
    });
    if (comentario) cambiarEstado(p, { estado: 'rechazada', comentario_admin: comentario }, 'Propiedad rechazada. El asesor verá tu comentario.', b);
  }

  async function despublicar(p, b) {
    const ok = await confirmar({
      titulo: '¿Despublicar?',
      texto: `«${p.titulo}» dejará de verse en la página y regresará a borrador; su asesor podrá editarla y volver a enviarla.`,
      aceptar: 'Despublicar',
      peligro: true
    });
    if (ok) cambiarEstado(p, { estado: 'borrador' }, 'La propiedad ya no se ve en la página.', b);
  }

  async function marcarCerrada(p, estado, b) {
    const palabra = estado === 'rentada' ? 'rentada' : 'vendida';
    const ok = await confirmar({
      titulo: `¿Marcar como ${palabra}?`,
      texto: `«${p.titulo}» seguirá en la página con la banda «${palabra === 'rentada' ? 'Rentada' : 'Vendida'}» y el botón «Quiero algo similar».`,
      aceptar: `Marcar como ${palabra}`
    });
    if (ok) cambiarEstado(p, { estado }, `Propiedad marcada como ${palabra}.`, b);
  }

  /* =========================================================
     MIS PROPIEDADES
     ========================================================= */
  async function cargarMis() {
    const lista = $('#listaMis');
    $('#vacioMis').hidden = true;
    cargandoEn(lista, 'Cargando tus propiedades…');
    const { data, error } = await sb.from('propiedades').select('*').eq('asesor_id', yo.id).order('actualizada', { ascending: false });
    if (error) { lista.replaceChildren(); return manejarError(error); }
    lista.replaceChildren(...data.map(p => {
      const acciones = [];
      if (p.estado === 'borrador' || p.estado === 'rechazada') {
        acciones.push(enlace('Editar', 'pn-btn-borde', `#editar/${p.id}`));
        acciones.push(boton('Enviar a validación', 'pn-btn-primario', b => enviarAValidacion(p, b)));
        if (p.estado === 'borrador') acciones.push(boton('Borrar', 'pn-btn-peligro', b => borrarBorrador(p, b)));
      } else if (p.estado === 'en_validacion') {
        acciones.push(el('span', { clase: 'pn-item-fecha' }, 'En revisión del administrador'));
        if (esAdmin) acciones.push(enlace('Revisar', 'pn-btn-borde', '#validacion'), enlace('Editar', 'pn-btn-borde', `#editar/${p.id}`));
      } else {
        if (esAdmin) acciones.push(enlace('Editar', 'pn-btn-borde', `#editar/${p.id}`));
        acciones.push(enlace('Ver en la página', 'pn-btn-borde', urlFicha(p.id), true));
      }
      return tarjeta(p, { acciones });
    }));
    $('#vacioMis').hidden = data.length > 0;
  }

  /* =========================================================
     VALIDACIÓN (admin)
     ========================================================= */
  async function cargarValidacion() {
    const lista = $('#listaValidacion');
    $('#vacioValidacion').hidden = true;
    cargandoEn(lista, 'Cargando propiedades por validar…');
    const { data, error } = await sb.from('propiedades').select('*, asesor:perfiles(nombre,correo)')
      .eq('estado', 'en_validacion').order('enviada', { ascending: true });
    if (error) { lista.replaceChildren(); return manejarError(error); }
    lista.replaceChildren(...data.map(p => tarjeta(p, {
      asesor: true,
      detalles: true,
      acciones: [
        boton('Aprobar y publicar', 'pn-btn-primario', b => aprobar(p, b)),
        boton('Rechazar', 'pn-btn-peligro', b => rechazar(p, b)),
        enlace('Editar', 'pn-btn-borde', `#editar/${p.id}`)
      ]
    })));
    $('#vacioValidacion').hidden = data.length > 0;
    actualizarContador();
  }

  /* =========================================================
     TODAS (admin)
     ========================================================= */
  $$('#filtrosTodas .chip').forEach(chip => chip.addEventListener('click', () => {
    $$('#filtrosTodas .chip').forEach(c => { c.classList.toggle('active', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
    filtroTodas = chip.dataset.estado;
    cargarTodas();
  }));

  async function cargarTodas() {
    const lista = $('#listaTodas');
    $('#vacioTodas').hidden = true;
    cargandoEn(lista, 'Cargando propiedades…');
    let consulta = sb.from('propiedades').select('*, asesor:perfiles(nombre,correo)').order('actualizada', { ascending: false });
    if (filtroTodas) consulta = consulta.in('estado', filtroTodas.split(','));
    const { data, error } = await consulta;
    if (error) { lista.replaceChildren(); return manejarError(error); }
    lista.replaceChildren(...data.map(p => {
      const acciones = [];
      if (p.estado === 'publicada') {
        acciones.push(enlace('Editar', 'pn-btn-borde', `#editar/${p.id}`));
        acciones.push(enlace('Ver en la página', 'pn-btn-borde', urlFicha(p.id), true));
        if (p.operacion.includes('venta')) acciones.push(boton('Marcar vendida', 'pn-btn-oscuro', b => marcarCerrada(p, 'vendida', b)));
        if (p.operacion.includes('renta')) acciones.push(boton('Marcar rentada', 'pn-btn-oscuro', b => marcarCerrada(p, 'rentada', b)));
        acciones.push(boton('Despublicar', 'pn-btn-peligro', b => despublicar(p, b)));
      } else if (p.estado === 'en_validacion') {
        acciones.push(enlace('Revisar', 'pn-btn-primario', '#validacion'));
        acciones.push(enlace('Editar', 'pn-btn-borde', `#editar/${p.id}`));
      } else if (p.estado === 'vendida' || p.estado === 'rentada') {
        acciones.push(enlace('Editar', 'pn-btn-borde', `#editar/${p.id}`));
        acciones.push(enlace('Ver en la página', 'pn-btn-borde', urlFicha(p.id), true));
        acciones.push(boton('Volver a publicar', 'pn-btn-primario', b => cambiarEstado(p, { estado: 'publicada' }, 'La propiedad está disponible otra vez.', b)));
        acciones.push(boton('Despublicar', 'pn-btn-peligro', b => despublicar(p, b)));
      } else {
        acciones.push(enlace('Editar', 'pn-btn-borde', `#editar/${p.id}`));
      }
      return tarjeta(p, { acciones, asesor: true, detalles: true });
    }));
    $('#vacioTodas').hidden = data.length > 0;
  }

  /* =========================================================
     EQUIPO (admin)
     ========================================================= */
  async function cargarEquipo() {
    const lista = $('#listaEquipo');
    cargandoEn(lista, 'Cargando el equipo…');
    const { data, error } = await sb.from('perfiles').select('id,correo,nombre,rol,activo,creado').order('creado', { ascending: true });
    if (error) { lista.replaceChildren(); return manejarError(error); }
    lista.replaceChildren(...data.map(filaPersona));
  }

  function filaPersona(p) {
    const soyYo = p.id === yo.id;
    const nombre = el('input', { id: `eqNombre-${p.id}`, maxlength: 80, autocomplete: 'off' });
    nombre.value = p.nombre || '';
    const rol = el('select', { id: `eqRol-${p.id}`, disabled: soyYo },
      el('option', { value: 'asesor' }, 'Asesor'),
      el('option', { value: 'admin' }, 'Administrador'));
    rol.value = p.rol;
    const activo = el('input', { type: 'checkbox', id: `eqActivo-${p.id}`, disabled: soyYo });
    activo.checked = p.activo;
    const guardar = boton('Guardar', 'pn-btn-borde', async (b) => {
      const cambios = { nombre: limpiar(nombre.value, 80), rol: rol.value, activo: activo.checked };
      b.disabled = true;
      try {
        const { data, error } = await sb.from('perfiles').update(cambios).eq('id', p.id).select('id,nombre,activo');
        if (error) throw error;
        if (!data || !data.length) throw { code: '42501' };
        const quien = data[0].nombre || p.correo;
        toast(cambios.activo && !p.activo ? `Cuenta de ${quien} activada: ya puede entrar al panel.` : `Se guardaron los cambios de ${quien}.`);
        Object.assign(p, cambios);
        if (soyYo) { yo.nombre = cambios.nombre; $('#pnNombre').textContent = cambios.nombre || yo.correo; }
      } catch (err) {
        manejarError(err);
      } finally {
        b.disabled = false;
      }
    });
    return el('div', { clase: 'pn-persona' },
      el('div', { clase: 'pn-campo' }, el('label', { for: nombre.id }, 'Nombre', soyYo ? el('span', { clase: 'pn-persona-yo' }, '(tú)') : null), nombre),
      el('p', { clase: 'pn-persona-correo' }, p.correo),
      el('div', { clase: 'pn-campo' }, el('label', { for: rol.id }, 'Rol'), rol),
      el('label', { clase: 'pn-check', for: activo.id }, activo, 'Cuenta activa'),
      guardar);
  }

  /* =========================================================
     FORMULARIO: CARGAR / EDITAR
     ========================================================= */
  const form = $('#formPropiedad');
  const c = {
    titulo: $('#fTitulo'), tipo: $('#fTipo'), operacion: $('#fOperacion'), etiqueta: $('#fEtiqueta'),
    coto: $('#fCoto'), preventa: $('#fPreventa'), precioVenta: $('#fPrecioVenta'), precioRenta: $('#fPrecioRenta'),
    municipio: $('#fMunicipio'), colonia: $('#fColonia'), terreno: $('#fTerreno'), construccion: $('#fConstruccion'),
    recamaras: $('#fRecamaras'), banos: $('#fBanos'), estacionamientos: $('#fEstacionamientos'),
    descripcion: $('#fDescripcion'), otras: $('#fAmenidadesOtras'), fotos: $('#fFotos')
  };
  const SUB_ORIGINAL = $('#formSub').cloneNode(true); // conserva el asterisco rojo
  let estadoForm = null;   // { id, propiedad, fotos:[{tipo, ruta?, blob?, url}], quitadas:[], lat, lng }
  let formSucio = false;
  let guardando = false;
  let mapaForm = null;
  let marcadorForm = null;

  const numeroDe = (v) => {
    const t = String(v ?? '').replace(/[\s,$]/g, '').replace(/M\.?N\.?/i, '');
    if (!t) return null;
    return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
  };
  const conMiles = (n) => Number(n).toLocaleString('es-MX', { maximumFractionDigits: 2 });

  function progreso(texto) { $('#formProgreso').textContent = texto || ''; }
  function bloquearForm(si) {
    ['#btnGuardar', '#btnEnviar'].forEach(s => { $(s).disabled = si; });
    form.setAttribute('aria-busy', String(si));
  }

  // Avisar antes de salir del formulario con cambios sin guardar
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !formSucio || (vistaActual !== 'nueva' && vistaActual !== 'editar') || a.getAttribute('href') === '#pnMain') return;
    e.preventDefault();
    const ok = await confirmar({
      titulo: '¿Salir sin guardar?',
      texto: 'Tienes cambios sin guardar en esta propiedad. Si sales ahora, se perderán.',
      aceptar: 'Salir sin guardar',
      peligro: true
    });
    if (ok) { formSucio = false; location.hash = a.getAttribute('href'); }
  });
  window.addEventListener('beforeunload', (e) => { if (formSucio) { e.preventDefault(); e.returnValue = ''; } });
  // Al corregir un campo marcado en rojo, se quita su aviso
  function alCambiarCampo(e) {
    formSucio = true;
    const campo = e.target;
    if (campo.getAttribute && campo.getAttribute('aria-invalid') === 'true') {
      campo.removeAttribute('aria-invalid');
      const aviso = campo.id && $(`#${campo.id}Error`);
      if (aviso) { aviso.hidden = true; aviso.textContent = ''; }
      if (!$$('[aria-invalid="true"]', form).length) $('#formError').hidden = true;
    }
  }
  form.addEventListener('input', alCambiarCampo);
  form.addEventListener('change', alCambiarCampo);

  async function abrirFormularioPorId(id) {
    if (!P.esUuid(id)) { location.replace('#mis'); return; }
    $('#vista-formulario').hidden = true;
    const { data, error } = await sb.from('propiedades').select('*').eq('id', id).limit(1);
    if (error) return manejarError(error);
    const p = data && data[0];
    if (!p) { errorGlobal('No encontramos esa propiedad o no tienes acceso a ella.'); return; }
    const editable = esAdmin || (p.asesor_id === yo.id && (p.estado === 'borrador' || p.estado === 'rechazada'));
    if (!editable) {
      errorGlobal(p.estado === 'en_validacion'
        ? 'Esta propiedad está en validación: no se puede editar hasta que el administrador la revise.'
        : 'Esta propiedad ya no se puede editar. Si necesitas cambiarla, pídele al administrador que la despublique.');
      return;
    }
    $('#vista-formulario').hidden = false;
    abrirFormulario(p);
  }

  function abrirFormulario(p) {
    form.reset();
    limpiarErroresForm();
    (estadoForm ? estadoForm.fotos : []).forEach(f => { if (f.tipo === 'nueva') URL.revokeObjectURL(f.url); });
    estadoForm = {
      id: p ? p.id : null,
      propiedad: p,
      fotos: (p && p.fotos ? p.fotos : []).map(ruta => ({ tipo: 'existente', ruta, url: P.urlFoto(ruta) })),
      quitadas: [],
      lat: p && Number.isFinite(p.lat) ? p.lat : null,
      lng: p && Number.isFinite(p.lng) ? p.lng : null
    };
    $('#formTitulo').textContent = p ? 'Editar propiedad' : 'Cargar propiedad';
    if (p && ['publicada', 'vendida', 'rentada'].includes(p.estado)) {
      $('#formSub').textContent = 'Esta propiedad ya se ve en la página: los cambios se publican en cuanto los guardes.';
    } else {
      $('#formSub').replaceChildren(...Array.from(SUB_ORIGINAL.cloneNode(true).childNodes));
    }
    const estado = $('#formEstado');
    estado.hidden = !p;
    if (p) { estado.className = `pn-estado pn-estado--${p.estado}`; estado.textContent = ESTADOS[p.estado] || p.estado; }
    $('#formComentario').hidden = !(p && p.estado === 'rechazada' && p.comentario_admin);
    $('#formComentarioTexto').textContent = (p && p.comentario_admin) || '';

    if (p) {
      c.titulo.value = p.titulo || '';
      c.tipo.value = p.tipo || '';
      c.operacion.value = p.operacion || 'venta';
      c.etiqueta.value = p.etiqueta || '';
      c.coto.checked = !!p.coto;
      c.preventa.checked = !!p.preventa;
      c.precioVenta.value = p.precio_venta != null ? conMiles(p.precio_venta) : '';
      c.precioRenta.value = p.precio_renta != null ? conMiles(p.precio_renta) : '';
      c.municipio.value = p.municipio || '';
      c.colonia.value = p.colonia || '';
      c.terreno.value = p.terreno_m2 != null ? conMiles(p.terreno_m2) : '';
      c.construccion.value = p.construccion_m2 != null ? conMiles(p.construccion_m2) : '';
      c.recamaras.value = p.recamaras != null ? p.recamaras : '';
      c.banos.value = p.banos != null ? Number(p.banos) : '';
      c.estacionamientos.value = p.estacionamientos != null ? p.estacionamientos : '';
      c.descripcion.value = p.descripcion || '';
      const marcadas = new Set();
      $$('#fAmenidades input').forEach(ch => {
        ch.checked = (p.amenidades || []).some(a => a.toLowerCase() === ch.value.toLowerCase());
        if (ch.checked) marcadas.add(ch.value.toLowerCase());
      });
      c.otras.value = (p.amenidades || []).filter(a => !marcadas.has(a.toLowerCase())).join(', ');
    }

    // Botones según quién edita y en qué estado está
    const estadoActual = p ? p.estado : 'borrador';
    $('#btnGuardar').textContent = p ? 'Guardar cambios' : 'Guardar borrador';
    const btnEnviar = $('#btnEnviar');
    btnEnviar.textContent = esAdmin ? 'Guardar y publicar' : 'Guardar y enviar a validación';
    btnEnviar.hidden = !(esAdmin
      ? ['borrador', 'rechazada', 'en_validacion'].includes(estadoActual)
      : ['borrador', 'rechazada'].includes(estadoActual));

    actualizarOperacion();
    vistaPrecio(c.precioVenta, $('#fPrecioVentaVista'), false);
    vistaPrecio(c.precioRenta, $('#fPrecioRentaVista'), true);
    contarDescripcion();
    pintarFotos();
    prepararMapaForm();
    formSucio = false;
  }

  // Precio de venta / renta según la operación
  function actualizarOperacion() {
    const op = c.operacion.value;
    $('#campoPrecioVenta').hidden = !op.includes('venta');
    $('#campoPrecioRenta').hidden = !op.includes('renta');
  }
  c.operacion.addEventListener('change', actualizarOperacion);

  function vistaPrecio(campo, salida, renta) {
    const n = numeroDe(campo.value);
    salida.textContent = n === null ? 'Así se verá: —' : Number.isNaN(n) ? 'Escribe solo números, por ejemplo 3,500,000' : `Así se verá: ${P.dinero(n)}${renta ? ' / mes' : ''}`;
  }
  c.precioVenta.addEventListener('input', () => vistaPrecio(c.precioVenta, $('#fPrecioVentaVista'), false));
  c.precioRenta.addEventListener('input', () => vistaPrecio(c.precioRenta, $('#fPrecioRentaVista'), true));
  [c.precioVenta, c.precioRenta, c.terreno, c.construccion].forEach(campo => campo.addEventListener('blur', () => {
    const n = numeroDe(campo.value);
    if (n !== null && !Number.isNaN(n)) campo.value = conMiles(n);
  }));

  function contarDescripcion() { $('#fDescripcionContador').textContent = c.descripcion.value.length.toLocaleString('es-MX'); }
  c.descripcion.addEventListener('input', contarDescripcion);

  /* ---------- Errores del formulario ---------- */
  function limpiarErroresForm() {
    $('#formError').hidden = true;
    $$('.pn-error-campo', form).forEach(p => { p.hidden = true; p.textContent = ''; });
    $$('[aria-invalid="true"]', form).forEach(n => n.removeAttribute('aria-invalid'));
  }
  function mostrarErroresForm(errores) {
    errores.forEach(({ campo, texto }) => {
      const p = $(`#${campo.id}Error`);
      if (p) { p.textContent = texto; p.hidden = false; }
      campo.setAttribute('aria-invalid', 'true');
    });
    const caja = $('#formError');
    caja.textContent = errores.length === 1
      ? `Falta corregir un dato: ${errores[0].texto}`
      : `Faltan corregir ${errores.length} datos. Están marcados en rojo.`;
    caja.hidden = false;
    const primero = errores[0].campo;
    primero.scrollIntoView({ block: 'center', behavior: 'smooth' });
    primero.focus({ preventScroll: true });
  }

  /* ---------- Leer y validar ---------- */
  function leerFormulario(enviar) {
    const errores = [];
    const error = (campo, texto) => errores.push({ campo, texto });

    const titulo = limpiar(c.titulo.value, 120);
    if (!titulo) error(c.titulo, 'Escribe un título.');
    else if (titulo.length < 5) error(c.titulo, 'El título es muy corto: usa al menos 5 caracteres.');
    const tipo = c.tipo.value;
    if (!tipo) error(c.tipo, 'Elige el tipo de propiedad.');
    const operacion = c.operacion.value;

    const precio = (campo, nombre) => {
      const n = numeroDe(campo.value);
      if (n === null) { error(campo, `Escribe ${nombre}.`); return null; }
      if (Number.isNaN(n) || n < 1 || n >= 1e12) { error(campo, `Escribe ${nombre} solo con números, por ejemplo 3,500,000.`); return null; }
      return Math.round(n * 100) / 100;
    };
    const precioVenta = operacion.includes('venta') ? precio(c.precioVenta, 'el precio de venta') : null;
    const precioRenta = operacion.includes('renta') ? precio(c.precioRenta, 'la renta mensual') : null;

    const municipio = c.municipio.value;
    if (!municipio) error(c.municipio, 'Elige el municipio.');
    const colonia = limpiar(c.colonia.value, 80);
    if (colonia.length < 2) error(c.colonia, 'Escribe la colonia.');
    const etiqueta = limpiar(c.etiqueta.value, 40);

    const medida = (campo, nombre) => {
      const n = numeroDe(campo.value);
      if (n === null) return null;
      if (Number.isNaN(n) || n < 1 || n > 99999999) { error(campo, `Escribe los m² de ${nombre} solo con números, por ejemplo 250.`); return null; }
      return Math.round(n * 100) / 100;
    };
    const entero = (campo, max, nombre) => {
      if (campo.validity && campo.validity.badInput) { error(campo, `Escribe ${nombre} solo con números.`); return null; }
      if (campo.value === '') return null;
      const n = Number(campo.value);
      if (!Number.isInteger(n) || n < 0 || n > max) { error(campo, `Escribe un número entero de 0 a ${max}.`); return null; }
      return n;
    };
    const terreno = medida(c.terreno, 'terreno');
    const construccion = medida(c.construccion, 'construcción');
    const recamaras = entero(c.recamaras, 50, 'las recámaras');
    let banos = null;
    if (c.banos.validity && c.banos.validity.badInput) error(c.banos, 'Escribe los baños solo con números, por ejemplo 2.5.');
    else if (c.banos.value !== '') {
      const n = Number(c.banos.value);
      if (!Number.isFinite(n) || n < 0 || n > 50 || n * 2 !== Math.trunc(n * 2)) error(c.banos, 'Usa números enteros o medios: 1, 1.5, 2, 2.5…');
      else banos = n;
    }
    const estacionamientos = entero(c.estacionamientos, 200, 'los estacionamientos');
    const descripcion = limpiar(c.descripcion.value, 4000, true);

    const amenidades = $$('#fAmenidades input:checked').map(ch => ch.value);
    limpiar(c.otras.value, 600).split(',').map(a => limpiar(a, 60)).filter(Boolean).forEach(a => {
      if (!amenidades.some(x => x.toLowerCase() === a.toLowerCase())) amenidades.push(a);
    });
    if (amenidades.length > 30) error(c.otras, `Puedes poner máximo 30 amenidades (tienes ${amenidades.length}).`);

    if (enviar && !estadoForm.fotos.length) error(c.fotos, 'Agrega al menos una foto antes de enviarla.');

    return {
      errores,
      datos: {
        titulo, tipo, operacion,
        precio_venta: precioVenta, precio_renta: precioRenta,
        municipio, colonia, etiqueta: etiqueta || null,
        terreno_m2: terreno, construccion_m2: construccion, recamaras, banos, estacionamientos,
        descripcion: descripcion || null, amenidades,
        coto: c.coto.checked, preventa: c.preventa.checked,
        lat: estadoForm.lat, lng: estadoForm.lng
      }
    };
  }

  /* ---------- Fotos: reducir en el navegador antes de subir ---------- */
  function cargarImagen(archivo) {
    return new Promise((resolver, rechazar) => {
      const u = URL.createObjectURL(archivo);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(u); resolver(img); };
      img.onerror = () => { URL.revokeObjectURL(u); rechazar(new Error('formato')); };
      img.src = u;
    });
  }
  async function reducirFoto(archivo) {
    let fuente;
    let cerrar = () => {};
    try {
      fuente = await createImageBitmap(archivo);
      cerrar = () => { if (fuente.close) fuente.close(); };
    } catch (e) {
      fuente = await cargarImagen(archivo);
    }
    const ancho = fuente.naturalWidth || fuente.width;
    const alto = fuente.naturalHeight || fuente.height;
    if (!ancho || !alto) throw new Error('formato');
    const escala = Math.min(1, LADO_MAX / Math.max(ancho, alto));
    const w = Math.max(1, Math.round(ancho * escala));
    const h = Math.max(1, Math.round(alto * escala));
    const lienzo = document.createElement('canvas');
    lienzo.width = w;
    lienzo.height = h;
    const ctx = lienzo.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(fuente, 0, 0, w, h);
    cerrar();
    const blob = await new Promise(res => lienzo.toBlob(res, 'image/jpeg', CALIDAD_JPEG));
    if (!blob) throw new Error('reducir');
    return blob;
  }

  async function agregarArchivos(archivos) {
    const errorFotos = $('#fFotosError');
    errorFotos.hidden = true;
    c.fotos.removeAttribute('aria-invalid');
    const espacio = MAX_FOTOS - estadoForm.fotos.length;
    const problemas = [];
    if (archivos.length > espacio) problemas.push(`Puedes tener máximo ${MAX_FOTOS} fotos; solo se agregaron ${Math.max(espacio, 0)}.`);
    const lote = archivos.slice(0, Math.max(espacio, 0));
    for (let i = 0; i < lote.length; i++) {
      const archivo = lote[i];
      progreso(`Preparando foto ${i + 1} de ${lote.length}…`);
      const esHeic = /hei[cf]/i.test(`${archivo.type} ${archivo.name}`);
      if (!/^image\//.test(archivo.type) && !/\.(jpe?g|png|webp|hei[cf])$/i.test(archivo.name)) { problemas.push(`«${archivo.name}» no es una foto.`); continue; }
      if (archivo.size > MAX_ARCHIVO) { problemas.push(`«${archivo.name}» pesa más de 25 MB.`); continue; }
      try {
        const blob = await reducirFoto(archivo);
        estadoForm.fotos.push({ tipo: 'nueva', blob, url: URL.createObjectURL(blob), nombre: archivo.name });
      } catch (e) {
        problemas.push(esHeic
          ? `No pudimos abrir «${archivo.name}» (formato HEIC del iPhone). Súbela desde el iPhone (ahí se convierte sola) o conviértela a JPG.`
          : `No pudimos abrir «${archivo.name}». Usa fotos JPG, PNG o WebP.`);
      }
    }
    progreso('');
    if (problemas.length) { errorFotos.textContent = problemas.join(' '); errorFotos.hidden = false; }
    if (lote.length) formSucio = true;
    pintarFotos();
  }
  c.fotos.addEventListener('change', () => {
    const archivos = Array.from(c.fotos.files || []);
    c.fotos.value = '';
    if (archivos.length) agregarArchivos(archivos);
  });
  const zonaSubir = $('#fSubir');
  ['dragenter', 'dragover'].forEach(ev => zonaSubir.addEventListener(ev, () => zonaSubir.classList.add('is-sobre')));
  ['dragleave', 'drop'].forEach(ev => zonaSubir.addEventListener(ev, () => zonaSubir.classList.remove('is-sobre')));

  function pintarFotos() {
    const total = estadoForm.fotos.length;
    $('#fFotosLista').replaceChildren(...estadoForm.fotos.map((f, i) => {
      const antes = el('button', { type: 'button', 'aria-label': `Mover la foto ${i + 1} antes`, disabled: i === 0 }, '←');
      const despues = el('button', { type: 'button', 'aria-label': `Mover la foto ${i + 1} después`, disabled: i === total - 1 }, '→');
      const quitar = el('button', { type: 'button', 'data-quitar': true, 'aria-label': `Quitar la foto ${i + 1}` }, '✕');
      antes.addEventListener('click', () => moverFoto(i, -1));
      despues.addEventListener('click', () => moverFoto(i, 1));
      quitar.addEventListener('click', () => quitarFoto(i));
      return el('li', { clase: 'pn-foto' },
        el('img', { src: f.url, alt: `Foto ${i + 1}${i === 0 ? ' (portada)' : ''}` }),
        el('span', { clase: 'pn-foto-num' }, i === 0 ? 'Portada' : String(i + 1)),
        el('div', { clase: 'pn-foto-acciones' }, antes, despues, quitar));
    }));
    zonaSubir.hidden = total >= MAX_FOTOS;
  }
  function moverFoto(i, d) {
    const j = i + d;
    const a = estadoForm.fotos;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    formSucio = true;
    pintarFotos();
    const botones = $$('#fFotosLista li')[j].querySelectorAll('button');
    (botones[d < 0 ? 0 : 1].disabled ? botones[d < 0 ? 1 : 0] : botones[d < 0 ? 0 : 1]).focus();
  }
  function quitarFoto(i) {
    const [f] = estadoForm.fotos.splice(i, 1);
    if (f.tipo === 'existente') estadoForm.quitadas.push(f.ruta);
    else URL.revokeObjectURL(f.url);
    formSucio = true;
    pintarFotos();
  }

  /* ---------- Mapa para marcar la ubicación (opcional) ---------- */
  function prepararMapaForm() {
    if (typeof L === 'undefined') {
      $('#fCoordenadas').textContent = 'El mapa no cargó (revisa tu conexión). Puedes guardar la propiedad sin ubicación.';
      return;
    }
    if (!mapaForm) {
      mapaForm = L.map('fMapa', { scrollWheelZoom: false }).setView(CENTRO_ZMG, 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(mapaForm);
      mapaForm.on('click', (e) => { ponerUbicacion(e.latlng.lat, e.latlng.lng); formSucio = true; });
      $('#fQuitarUbicacion').addEventListener('click', () => { ponerUbicacion(null, null); formSucio = true; });
      c.municipio.addEventListener('change', () => {
        if (estadoForm.lat === null && CENTROS[c.municipio.value]) mapaForm.setView(CENTROS[c.municipio.value], 13);
      });
    }
    requestAnimationFrame(() => mapaForm.invalidateSize());
    ponerUbicacion(estadoForm.lat, estadoForm.lng, true);
  }
  function ponerUbicacion(lat, lng, centrar = false) {
    if (lat === null || lng === null || lat === undefined || lng === undefined) {
      estadoForm.lat = null;
      estadoForm.lng = null;
      if (marcadorForm) { marcadorForm.remove(); marcadorForm = null; }
      $('#fCoordenadas').textContent = 'Sin ubicación marcada';
      $('#fQuitarUbicacion').hidden = true;
      if (centrar) mapaForm.setView(CENTROS[c.municipio.value] || CENTRO_ZMG, CENTROS[c.municipio.value] ? 13 : 11);
      return;
    }
    if (lat < 14 || lat > 33 || lng < -119 || lng > -86) { toast('Marca una ubicación dentro de México.'); return; }
    estadoForm.lat = Math.round(lat * 1e6) / 1e6;
    estadoForm.lng = Math.round(lng * 1e6) / 1e6;
    if (!marcadorForm) {
      const icono = L.divIcon({ className: 'demetrius-marker', html: '', iconSize: [16, 16], iconAnchor: [8, 16] });
      marcadorForm = L.marker([estadoForm.lat, estadoForm.lng], { icon: icono, draggable: true, title: 'Ubicación de la propiedad', alt: 'Ubicación de la propiedad' })
        .addTo(mapaForm)
        .on('dragend', (ev) => { const ll = ev.target.getLatLng(); ponerUbicacion(ll.lat, ll.lng); formSucio = true; });
    } else {
      marcadorForm.setLatLng([estadoForm.lat, estadoForm.lng]);
    }
    $('#fCoordenadas').textContent = `Ubicación marcada (${estadoForm.lat.toFixed(5)}, ${estadoForm.lng.toFixed(5)}). Puedes arrastrar el marcador para ajustarla.`;
    $('#fQuitarUbicacion').hidden = false;
    if (centrar) mapaForm.setView([estadoForm.lat, estadoForm.lng], 15);
  }

  /* ---------- Guardar ---------- */
  let ultimoBoton = 'guardar';
  ['#btnGuardar', '#btnEnviar'].forEach(s => $(s).addEventListener('click', (e) => { ultimoBoton = e.currentTarget.dataset.accion; }));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const accion = (e.submitter && e.submitter.dataset.accion) || ultimoBoton;
    guardar(accion === 'enviar');
  });

  async function guardar(enviar) {
    if (guardando) return;
    limpiarErroresForm();
    const { datos, errores } = leerFormulario(enviar);
    if (errores.length) { mostrarErroresForm(errores); return; }

    guardando = true;
    bloquearForm(true);
    let datosGuardados = false;
    try {
      let id = estadoForm.id;
      if (!id) {
        progreso('Guardando la propiedad…');
        const { data, error } = await sb.from('propiedades').insert(datos).select('id,estado,asesor_id').single();
        if (error) throw error;
        id = data.id;
        estadoForm.id = id;
        estadoForm.propiedad = { ...datos, ...data };
        history.replaceState(null, '', `#editar/${id}`);
        $('#formTitulo').textContent = 'Editar propiedad';
        $('#btnGuardar').textContent = 'Guardar cambios';
      } else {
        progreso('Guardando los cambios…');
        const { data, error } = await sb.from('propiedades').update(datos).eq('id', id).select('id');
        if (error) throw error;
        if (!data || !data.length) throw { code: 'PGRST116' };
      }
      datosGuardados = true;

      const nuevas = estadoForm.fotos.filter(f => f.tipo === 'nueva');
      for (let i = 0; i < nuevas.length; i++) {
        progreso(`Subiendo foto ${i + 1} de ${nuevas.length}…`);
        const f = nuevas[i];
        const ruta = `${id}/${uuid()}.jpg`;
        const { error } = await sb.storage.from(BUCKET).upload(ruta, f.blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
        if (error) throw error;
        URL.revokeObjectURL(f.url);
        Object.assign(f, { tipo: 'existente', ruta, url: P.urlFoto(ruta), blob: null });
      }

      progreso(enviar ? (esAdmin ? 'Publicando…' : 'Enviando a validación…') : 'Guardando las fotos…');
      const cambios = { fotos: estadoForm.fotos.map(f => f.ruta) };
      if (enviar) cambios.estado = esAdmin ? 'publicada' : 'en_validacion';
      if (enviar && esAdmin) cambios.comentario_admin = null;
      const { data: fin, error: errorFin } = await sb.from('propiedades').update(cambios).eq('id', id).select('id,estado');
      if (errorFin) throw errorFin;
      if (!fin || !fin.length) throw { code: 'PGRST116' };

      // Las fotos que quitaste se borran al final (si falla, solo quedan archivos sin usar)
      if (estadoForm.quitadas.length) {
        const { error } = await sb.storage.from(BUCKET).remove(estadoForm.quitadas);
        if (!error) estadoForm.quitadas = [];
      }

      formSucio = false;
      toast(enviar
        ? (esAdmin ? 'Listo: la propiedad ya se ve en la página.' : 'Listo: la propiedad se envió a validación.')
        : 'Cambios guardados.');
      const ajena = estadoForm.propiedad && estadoForm.propiedad.asesor_id && estadoForm.propiedad.asesor_id !== yo.id;
      location.hash = esAdmin && ajena ? '#todas' : '#mis';
    } catch (err) {
      pintarFotos();
      if (sesionExpirada(err)) { await salir('sesion'); return; }
      const caja = $('#formError');
      caja.textContent = mensajeError(err) + (datosGuardados
        ? ' Los datos de la propiedad sí se guardaron como borrador; puedes intentarlo de nuevo.'
        : '');
      caja.hidden = false;
      caja.focus();
    } finally {
      guardando = false;
      bloquearForm(false);
      progreso('');
    }
  }

  /* =========================================================
     CAMBIAR MI CONTRASEÑA
     ========================================================= */
  const dlgClave = $('#dlgClave');
  $('#pnCambiarClave').addEventListener('click', () => {
    $('#dlgClaveForm').reset();
    $('#dlgClaveUsuario').value = yo.correo || '';
    $('#dlgClaveError').hidden = true;
    dlgClave.showModal();
    $('#dlgClaveNueva').focus();
  });
  $('#dlgClaveCancelar').addEventListener('click', () => dlgClave.close());
  $('#dlgClaveForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nueva = $('#dlgClaveNueva').value;
    const repetir = $('#dlgClaveRepetir').value;
    const error = $('#dlgClaveError');
    const fallo = nueva.length < 8 ? 'La contraseña debe tener al menos 8 caracteres.'
      : nueva !== repetir ? 'Las dos contraseñas no coinciden. Escríbelas de nuevo.' : '';
    if (fallo) { error.textContent = fallo; error.hidden = false; return; }
    const b = $('#dlgClaveGuardar');
    b.disabled = true;
    try {
      const { error: err } = await sb.auth.updateUser({ password: nueva });
      if (err) throw err;
      dlgClave.close();
      toast('Tu contraseña se cambió. Úsala la próxima vez que entres.');
    } catch (err) {
      error.textContent = mensajeError(err);
      error.hidden = false;
    } finally {
      b.disabled = false;
    }
  });

  iniciar().catch(err => {
    $('#pnCargando').hidden = true;
    manejarError(err);
  });
})();
