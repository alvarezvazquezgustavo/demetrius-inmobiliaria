/* Demetrius Grupo Inmobiliario — panel del equipo: DOCUMENTOS (#documentos) y BITÁCORA (#bitacora, solo admin)
   - Antes de mostrar algo pide la verificación en dos pasos (código de 6 dígitos de una app del celular).
   - Los archivos van a un espacio PRIVADO de Supabase Storage. Para abrir uno se crea un enlace que caduca en 60 s.
   - Los archivos grandes se suben en partes de 6 MB (protocolo TUS): si se cae el internet, la subida sigue.
   La seguridad real está en la base de datos (supabase/documentos.sql): ocultar botones aquí es solo comodidad. */
(() => {
  'use strict';
  const { sb, $, $$, el, limpiar, mensajeError, sesionExpirada, URL_STORAGE, LLAVE } = window.Panel;

  const BUCKET = 'documentos';
  const PARTE = 6 * 1024 * 1024; // Supabase exige partes de 6 MB exactos
  const TIPOS = { 'application/pdf': 'PDF', 'image/jpeg': 'JPG', 'image/png': 'PNG' };
  const ESTADOS = { subiendo: 'Subida incompleta', en_revision: 'Por aprobar', aprobado: 'Aprobado', rechazado: 'Rechazado', archivado: 'Archivado' };
  const ACCIONES = {
    entrada: 'Entró a Documentos', abrir: 'Abrió', descargar: 'Descargó', subir: 'Subió', aprobar: 'Aprobó',
    rechazar: 'Rechazó', archivar: 'Archivó', desarchivar: 'Volvió a mostrar', borrar: 'Borró'
  };

  let ctx = null;            // lo que comparte js/panel.js (toast, confirmar, yo, esAdmin…)
  let destino = 'documentos';
  let datos = null;          // última respuesta de documentos_listar
  let filtro = 'aprobado';
  let subiendo = false;
  let cancelador = null;
  let elegido = null;        // { archivo, tipo }
  let propiedadesListas = false;
  let registros = [];        // bitácora
  let factorPendiente = null;
  let urlQr = null;

  const fechaHora = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const fh = (v) => { const d = new Date(v); return isNaN(d) ? '' : fechaHora.format(d); };
  function tamanoTexto(bytes) {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0) return '';
    if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / 1048576).toLocaleString('es-MX', { maximumFractionDigits: 1 })} MB`;
    return `${(n / 1073741824).toLocaleString('es-MX', { maximumFractionDigits: 2 })} GB`;
  }
  const esVerificacion = (err) => /verificación en dos pasos/i.test(String((err && err.message) || ''));

  async function falla(err) {
    if (esVerificacion(err)) { mostrarVerificacion(); return; }
    if (sesionExpirada(err)) { ctx.manejarError(err); return; }
    ctx.manejarError(err);
  }

  /* =========================================================
     ENTRADA: ¿ya pasó la verificación en dos pasos?
     ========================================================= */
  async function mostrar(vista, contexto) {
    ctx = contexto;
    destino = vista;
    $('#vista-verificacion').hidden = true;
    try {
      const { data, error } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) throw error;
      if (data.currentLevel === 'aal2') abrirVista();
      else mostrarVerificacion();
    } catch (err) {
      falla(err);
    }
  }

  function abrirVista() {
    $('#vista-verificacion').hidden = true;
    $$('.pn-vista').forEach(s => { s.hidden = s.id !== (destino === 'bitacora' ? 'vista-bitacora' : 'vista-documentos'); });
    $$('#vista-documentos [data-solo-admin]').forEach(n => { n.hidden = !ctx.esAdmin; });
    if (destino === 'bitacora') cargarBitacora();
    else cargarDocumentos();
  }

  /* =========================================================
     VERIFICACIÓN EN DOS PASOS
     ========================================================= */
  const verError = (texto) => { const p = $('#verError'); p.textContent = texto || ''; p.hidden = !texto; if (texto) p.focus(); };
  const soloDigitos = (campo) => campo.addEventListener('input', () => { campo.value = campo.value.replace(/\D/g, '').slice(0, 6); });
  soloDigitos($('#verCodigo'));
  soloDigitos($('#verCodigoNuevo'));

  async function mostrarVerificacion() {
    $$('.pn-vista').forEach(s => { s.hidden = s.id !== 'vista-verificacion'; });
    verError('');
    $('#verCodigoForm').hidden = true;
    $('#verActivarForm').hidden = true;
    $('#verCargando').hidden = false;
    try {
      const { data, error } = await sb.auth.mfa.listFactors();
      if (error) throw error;
      const verificado = (data.totp || []).find(f => f.status === 'verified');
      $('#verCargando').hidden = true;
      if (verificado) {
        factorPendiente = verificado.id;
        $('#verIntro').textContent = 'Los documentos son confidenciales. Escribe el código de 6 dígitos de tu app de autenticación para entrar.';
        $('#verCodigo').value = '';
        $('#verCodigoForm').hidden = false;
        $('#verCodigo').focus();
        return;
      }
      // Primera vez: se quitan intentos anteriores sin terminar y se crea uno nuevo
      for (const f of (data.all || []).filter(x => x.factor_type === 'totp' && x.status !== 'verified')) {
        await sb.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data: alta, error: e2 } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Demetrius', issuer: 'Demetrius' });
      if (e2) throw e2;
      factorPendiente = alta.id;
      // El código QR llega como SVG: se muestra desde un blob (la CSP no permite HTML incrustado)
      const svg = String(alta.totp.qr_code || '').replace(/^data:image\/svg\+xml;[^,]*,/, '');
      if (urlQr) URL.revokeObjectURL(urlQr);
      urlQr = URL.createObjectURL(new Blob([svg.startsWith('<') ? svg : decodeURIComponent(svg)], { type: 'image/svg+xml' }));
      $('#verQr').src = urlQr;
      $('#verSecreto').textContent = alta.totp.secret;
      $('#verAbrirApp').href = alta.totp.uri;
      $('#verIntro').textContent = 'Los documentos son confidenciales. Solo la primera vez, conecta tu celular en tres pasos.';
      $('#verCodigoNuevo').value = '';
      $('#verActivarForm').hidden = false;
    } catch (err) {
      $('#verCargando').hidden = true;
      if (sesionExpirada(err)) { ctx.manejarError(err); return; }
      verError(mensajeError(err));
    }
  }

  $('#verCopiar').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('#verSecreto').textContent);
      ctx.toast('Clave copiada. Pégala en tu app de autenticación.');
    } catch (e) {
      ctx.toast('No se pudo copiar. Escríbela a mano.');
    }
  });

  async function verificar(e, campo, boton) {
    e.preventDefault();
    const codigo = campo.value.replace(/\D/g, '');
    if (codigo.length !== 6) { verError('Escribe los 6 dígitos del código.'); campo.focus(); return; }
    boton.disabled = true;
    verError('');
    try {
      const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: factorPendiente, code: codigo });
      if (error) throw error;
      if (urlQr) { URL.revokeObjectURL(urlQr); urlQr = null; $('#verQr').removeAttribute('src'); }
      ctx.toast('Verificación lista. Bienvenido a Documentos.');
      abrirVista();
    } catch (err) {
      if (sesionExpirada(err)) { ctx.manejarError(err); return; }
      verError(mensajeError(err));
      campo.select();
    } finally {
      boton.disabled = false;
    }
  }
  $('#verCodigoForm').addEventListener('submit', (e) => verificar(e, $('#verCodigo'), $('#verCodigoBtn')));
  $('#verActivarForm').addEventListener('submit', (e) => verificar(e, $('#verCodigoNuevo'), $('#verActivarBtn')));

  /* =========================================================
     LISTA DE DOCUMENTOS
     ========================================================= */
  async function cargarDocumentos() {
    const lista = $('#docLista');
    $('#docVacio').hidden = true;
    if (!datos) lista.replaceChildren(el('p', { clase: 'pn-cargando' }, 'Cargando documentos…'));
    const { data, error } = await sb.rpc('documentos_listar');
    if (error) { lista.replaceChildren(); return falla(error); }
    datos = data;
    pintarEspacio();
    pintarFiltros();
    pintarLista();
    if (ctx.esAdmin) ctx.actualizarContadorDocs(datos.documentos.filter(d => d.estado === 'en_revision').length);
  }

  function pintarEspacio() {
    const total = Number(datos.espacio_gb) * 1073741824;
    const usado = Number(datos.usado_bytes) || 0;
    const pct = total > 0 ? Math.min(100, (usado / total) * 100) : 0;
    $('#docEspacio').hidden = false;
    $('#docEspacioTexto').replaceChildren('Espacio usado: ', el('b', {}, `${tamanoTexto(usado) || '0 KB'} de ${tamanoTexto(total)}`),
      ` (${pct.toLocaleString('es-MX', { maximumFractionDigits: 1 })} %)`);
    $('#docEspacioMax').textContent = `Máximo por archivo: ${datos.max_mb} MB`;
    $('#docEspacioRelleno').style.width = `${pct}%`;
    $('#docEspacioBarra').classList.toggle('is-lleno', pct >= 90);
    $('#docEspacioBarra').setAttribute('aria-label', `Espacio usado: ${pct.toFixed(0)} por ciento`);
    $('#docArchivoAyuda').textContent = `PDF, JPG o PNG · máximo ${datos.max_mb} MB`;
  }

  function pintarFiltros() {
    const cuenta = (estado) => datos.documentos.filter(d => d.estado === estado).length;
    const opciones = [
      ['aprobado', 'Aprobados'],
      ['en_revision', ctx.esAdmin ? 'Por aprobar' : 'Mis pendientes'],
      ['rechazado', ctx.esAdmin ? 'Rechazados' : 'Mis rechazados'],
      ['subiendo', 'Subidas incompletas'],
      ['archivado', 'Archivados']
    ].filter(([estado]) => estado === 'aprobado' || estado === filtro || cuenta(estado) > 0);
    if (!opciones.some(([estado]) => estado === filtro)) filtro = 'aprobado';
    $('#docFiltros').replaceChildren(...opciones.map(([estado, texto]) => {
      const n = cuenta(estado);
      const chip = el('button', { type: 'button', clase: `chip${estado === filtro ? ' active' : ''}`, 'aria-pressed': String(estado === filtro) },
        texto, n ? el('span', { clase: 'pn-chip-n' }, String(n)) : null);
      chip.addEventListener('click', () => { filtro = estado; pintarFiltros(); pintarLista(); });
      return chip;
    }));
  }

  const normal = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  $('#docBuscar').addEventListener('input', () => { if (datos) pintarLista(); });

  function pintarLista() {
    const q = normal($('#docBuscar').value.trim());
    const docs = datos.documentos.filter(d => d.estado === filtro)
      .filter(d => !q || normal(`${d.titulo} ${d.expediente} ${d.nombre_original} ${d.descripcion || ''} ${d.subido_por_nombre}`).includes(q));
    $('#docLista').replaceChildren(...docs.map(tarjeta));
    const vacio = $('#docVacio');
    vacio.hidden = docs.length > 0;
    if (!docs.length) {
      const hayAlgo = datos.documentos.length > 0;
      $('#docVacioTitulo').textContent = q ? 'No encontramos documentos con esa búsqueda' : hayAlgo ? 'No hay documentos en este apartado' : 'Todavía no hay documentos';
      $('#docVacioTexto').textContent = q ? 'Prueba con otra palabra o revisa los demás apartados.' : 'Sube el primero con el botón «Subir documento».';
    }
  }

  function textoFecha(d) {
    if (d.estado === 'aprobado' && d.revisado) return `Aprobado el ${fh(d.revisado)}`;
    if (d.estado === 'rechazado' && d.revisado) return `Rechazado el ${fh(d.revisado)}`;
    if (d.estado === 'archivado' && d.revisado) return `Archivado el ${fh(d.revisado)}`;
    return `Subido el ${fh(d.enviado || d.creado)}`;
  }

  function tarjeta(d) {
    const tipo = TIPOS[d.tipo_mime] || 'DOC';
    const quien = d.es_mio ? 'ti' : d.subido_por_nombre;
    const acciones = [];
    if (d.estado !== 'subiendo') {
      acciones.push(ctx.boton('Abrir', d.estado === 'aprobado' ? 'pn-btn-primario' : 'pn-btn-borde', b => abrir(d, false, b)));
      acciones.push(ctx.boton('Descargar', 'pn-btn-borde', b => abrir(d, true, b)));
    }
    if (ctx.esAdmin && d.estado === 'en_revision') {
      acciones.push(ctx.boton('Aprobar', 'pn-btn-primario', b => aprobar(d, b)));
      acciones.push(ctx.boton('Rechazar', 'pn-btn-peligro', b => rechazar(d, b)));
    }
    if (ctx.esAdmin && d.estado === 'aprobado') acciones.push(ctx.boton('Archivar', 'pn-btn-oscuro', b => archivar(d, true, b)));
    if (ctx.esAdmin && d.estado === 'archivado') acciones.push(ctx.boton('Volver a mostrar', 'pn-btn-primario', b => archivar(d, false, b)));
    if (d.borrable) acciones.push(ctx.boton('Borrar', 'pn-btn-peligro', b => borrar(d, b)));

    const cuerpo = el('div', { clase: 'pn-item-cuerpo' },
      el('div', { clase: 'pn-item-top' },
        el('span', { clase: `pn-estado pn-estado--doc-${d.estado}` }, ESTADOS[d.estado] || d.estado),
        el('span', { clase: 'pn-item-fecha' }, textoFecha(d))),
      el('h3', {}, d.titulo),
      el('p', { clase: 'pn-item-zona' }, d.propiedad_id ? 'Propiedad: ' : 'Expediente: ', el('b', {}, d.expediente)),
      el('p', { clase: 'pn-doc-meta' }, [d.nombre_original, tamanoTexto(d.tamano), `Subido por ${quien}`].filter(Boolean).join(' · ')),
      d.descripcion ? el('p', { clase: 'pn-doc-nota' }, d.descripcion) : null,
      d.estado === 'rechazado' && d.comentario_admin
        ? el('div', { clase: 'pn-comentario' }, el('b', {}, 'Comentario del administrador'), d.comentario_admin) : null,
      d.estado === 'subiendo'
        ? el('p', { clase: 'pn-aviso pn-doc-aviso' }, 'La subida no se terminó. Bórralo y vuelve a subir el archivo.') : null);
    return el('article', { clase: 'pn-item pn-doc', 'data-id': d.id },
      el('div', { clase: `pn-doc-icono pn-doc-icono--${tipo.toLowerCase()}`, 'aria-hidden': 'true' }, tipo),
      cuerpo,
      acciones.length ? el('div', { clase: 'pn-item-acciones' }, acciones) : null);
  }

  /* ---------- Abrir / descargar (queda anotado en la bitácora) ---------- */
  async function abrir(d, descargar, b) {
    // La ventana se abre en el mismo clic (si no, Safari la bloquea) y se le pone el enlace cuando esté listo
    let ventana = null;
    if (!descargar) {
      ventana = window.open('', '_blank');
      if (ventana) {
        try { ventana.opener = null; ventana.document.title = 'Abriendo documento…'; ventana.document.body.textContent = 'Abriendo el documento…'; } catch (e) { /* sin acceso */ }
      }
    }
    b.disabled = true;
    try {
      const { data, error } = await sb.rpc('documento_abrir', { p_id: d.id, p_descargar: descargar });
      if (error) throw error;
      const { data: firmado, error: e2 } = await sb.storage.from(BUCKET)
        .createSignedUrl(data.archivo, 60, descargar ? { download: data.nombre } : undefined);
      if (e2) throw e2;
      if (descargar) {
        const a = el('a', { href: firmado.signedUrl, rel: 'noopener noreferrer', 'data-descarga': true });
        document.body.append(a);
        a.click();
        a.remove();
        ctx.toast('La descarga empezó.');
      } else if (ventana && !ventana.closed) {
        ventana.location.replace(firmado.signedUrl);
      } else if (!window.open(firmado.signedUrl, '_blank', 'noopener')) {
        ctx.toast('Tu navegador bloqueó la ventana nueva. Usa «Descargar».');
      }
    } catch (err) {
      if (ventana && !ventana.closed) ventana.close();
      falla(err);
    } finally {
      b.disabled = false;
    }
  }

  /* ---------- Acciones del administrador ---------- */
  async function llamar(fn, args, textoOk, b) {
    if (b) b.disabled = true;
    try {
      const { error } = await sb.rpc(fn, args);
      if (error) throw error;
      ctx.toast(textoOk);
      await cargarDocumentos();
    } catch (err) {
      if (b) b.disabled = false;
      falla(err);
    }
  }
  async function aprobar(d, b) {
    const ok = await ctx.confirmar({ titulo: '¿Aprobar este documento?', texto: `«${d.titulo}» lo podrá ver y abrir todo el equipo.`, aceptar: 'Aprobar' });
    if (ok) llamar('documento_revisar', { p_id: d.id, p_aprobar: true, p_comentario: null }, 'Documento aprobado: ya lo ve todo el equipo.', b);
  }
  async function rechazar(d, b) {
    const comentario = await ctx.confirmar({
      titulo: 'Rechazar documento',
      texto: `Explícale a ${d.subido_por_nombre} qué está mal en «${d.titulo}». Podrá borrarlo y subirlo de nuevo.`,
      aceptar: 'Rechazar', peligro: true,
      comentario: { etiqueta: 'Comentario para el asesor', obligatorio: true, ejemplo: 'Ej. Faltan las páginas 10 a 14 y la copia de la INE no se lee.' }
    });
    if (comentario) llamar('documento_revisar', { p_id: d.id, p_aprobar: false, p_comentario: comentario }, 'Documento rechazado. El asesor verá tu comentario.', b);
  }
  async function archivar(d, si, b) {
    const ok = await ctx.confirmar(si
      ? { titulo: '¿Archivar este documento?', texto: `«${d.titulo}» dejará de verse para el equipo. No se borra: lo puedes volver a mostrar desde «Archivados».`, aceptar: 'Archivar' }
      : { titulo: '¿Volver a mostrar?', texto: `«${d.titulo}» lo volverá a ver todo el equipo.`, aceptar: 'Volver a mostrar' });
    if (ok) llamar('documento_archivar', { p_id: d.id, p_archivar: si }, si ? 'Documento archivado.' : 'El documento se volvió a mostrar.', b);
  }

  /* ---------- Borrar (solo pendientes, rechazados o subidas incompletas) ---------- */
  async function borrarSinPreguntar(id, archivo) {
    const { data, error } = await sb.rpc('documento_borrar_preparar', { p_id: id });
    if (error) throw error;
    const { error: e2 } = await sb.storage.from(BUCKET).remove([data.archivo || archivo]);
    if (e2 && !/not.?found/i.test(e2.message || '')) throw e2;
    const { error: e3 } = await sb.rpc('documento_borrar', { p_id: id });
    if (e3) throw e3;
  }
  async function borrar(d, b) {
    const ok = await ctx.confirmar({
      titulo: '¿Borrar este documento?',
      texto: `Se borrará «${d.titulo}» y su archivo. Esta acción no se puede deshacer.`,
      aceptar: 'Sí, borrar', peligro: true
    });
    if (!ok) return;
    b.disabled = true;
    try {
      await borrarSinPreguntar(d.id, null);
      ctx.toast('Documento borrado.');
      await cargarDocumentos();
    } catch (err) {
      b.disabled = false;
      falla(err);
    }
  }

  /* =========================================================
     SUBIR UN DOCUMENTO
     ========================================================= */
  const form = $('#docForm');
  const campos = {
    titulo: $('#docTitulo2'), propiedad: $('#docPropiedad'), expediente: $('#docExpediente'),
    descripcion: $('#docDescripcion'), archivo: $('#docArchivo')
  };

  $('#docNuevo').addEventListener('click', () => abrirFormulario());
  $('#docCancelar').addEventListener('click', async () => {
    if (subiendo) {
      const ok = await ctx.confirmar({ titulo: '¿Cancelar la subida?', texto: 'El archivo dejará de subirse y no se guardará nada.', aceptar: 'Cancelar la subida', peligro: true });
      if (ok && cancelador) cancelador.abort();
      return;
    }
    cerrarFormulario();
  });

  async function abrirFormulario() {
    form.reset();
    limpiarErrores();
    elegido = null;
    $('#docArchivoElegido').hidden = true;
    $('#docProgreso').hidden = true;
    ligarCon('propiedad');
    $('#docFormNota').textContent = ctx.esAdmin
      ? 'Como administrador, lo que subas queda aprobado y lo ve todo el equipo.'
      : 'Un administrador lo revisará antes de que lo vea el resto del equipo.';
    form.hidden = false;
    $('#docNuevo').hidden = true;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    campos.titulo.focus({ preventScroll: true });
    if (!propiedadesListas) cargarPropiedades();
  }
  function cerrarFormulario() {
    form.hidden = true;
    $('#docNuevo').hidden = false;
    elegido = null;
  }

  async function cargarPropiedades() {
    const { data, error } = await sb.from('propiedades').select('id,titulo,colonia,estado').order('titulo', { ascending: true });
    if (error) return;
    propiedadesListas = true;
    const sufijo = { borrador: ' (borrador)', en_validacion: ' (en validación)', rechazada: ' (rechazada)', vendida: ' (vendida)', rentada: ' (rentada)' };
    campos.propiedad.replaceChildren(
      el('option', { value: '' }, data.length ? 'Elige la propiedad…' : 'No hay propiedades en el panel: usa «Otra»'),
      ...data.map(p => el('option', { value: p.id }, `${p.titulo} — ${p.colonia}${sufijo[p.estado] || ''}`)));
  }

  function ligarCon(modo) {
    $('#docLigarPropiedad').checked = modo === 'propiedad';
    $('#docLigarExpediente').checked = modo === 'expediente';
    $('#docCampoPropiedad').hidden = modo !== 'propiedad';
    $('#docCampoExpediente').hidden = modo !== 'expediente';
  }
  $$('input[name="docLigar"]').forEach(r => r.addEventListener('change', () => ligarCon(r.value)));

  /* ---------- Errores ---------- */
  function limpiarErrores() {
    $('#docFormError').hidden = true;
    $$('.pn-error-campo', form).forEach(p => { p.hidden = true; p.textContent = ''; });
    $$('[aria-invalid="true"]', form).forEach(n => n.removeAttribute('aria-invalid'));
  }
  function errorCampo(campo, texto) {
    const p = $(`#${campo.id}Error`);
    if (p) { p.textContent = texto; p.hidden = false; }
    campo.setAttribute('aria-invalid', 'true');
  }
  form.addEventListener('input', (e) => {
    const campo = e.target;
    if (campo.getAttribute && campo.getAttribute('aria-invalid') === 'true') {
      campo.removeAttribute('aria-invalid');
      const p = campo.id && $(`#${campo.id}Error`);
      if (p) { p.hidden = true; p.textContent = ''; }
    }
  });
  function errorFormulario(texto) {
    const caja = $('#docFormError');
    caja.textContent = texto;
    caja.hidden = false;
    caja.focus();
  }

  /* ---------- Elegir archivo: se revisa qué es por su contenido, no por su nombre ---------- */
  async function detectarTipo(archivo) {
    const b = new Uint8Array(await archivo.slice(0, 1024).arrayBuffer());
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
    if ([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A].every((x, i) => b[i] === x)) return 'image/png';
    let texto = '';
    for (let i = 0; i < b.length; i++) texto += String.fromCharCode(b[i]);
    return texto.includes('%PDF-') ? 'application/pdf' : null;
  }
  campos.archivo.addEventListener('change', async () => {
    const archivo = campos.archivo.files && campos.archivo.files[0];
    const info = $('#docArchivoElegido');
    const error = $('#docArchivoError');
    error.hidden = true;
    error.textContent = '';
    campos.archivo.removeAttribute('aria-invalid');
    elegido = null;
    info.hidden = true;
    if (!archivo) return;
    const max = (datos ? datos.max_mb : 50) * 1048576;
    let problema = '';
    const tipo = await detectarTipo(archivo).catch(() => null);
    if (!tipo) problema = `«${archivo.name}» no es un PDF, JPG o PNG.`;
    else if (archivo.size === 0) problema = `«${archivo.name}» está vacío.`;
    else if (archivo.size > max) {
      problema = `«${archivo.name}» pesa ${tamanoTexto(archivo.size)} y el máximo es ${datos ? datos.max_mb : 50} MB.` +
        (tipo === 'application/pdf' ? ' Si es un escaneo, vuelve a escanearlo a 200 dpi en escala de grises: queda mucho más ligero y se lee igual.' : '');
    }
    if (problema) {
      error.textContent = problema;
      error.hidden = false;
      campos.archivo.setAttribute('aria-invalid', 'true');
      campos.archivo.value = '';
      return;
    }
    elegido = { archivo, tipo };
    info.replaceChildren(el('b', {}, archivo.name), ` · ${TIPOS[tipo]} · ${tamanoTexto(archivo.size)}`);
    info.hidden = false;
    if (!limpiar(campos.titulo.value, 150)) campos.titulo.value = limpiar(archivo.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '), 150);
  });
  const zona = $('#docSubir');
  ['dragenter', 'dragover'].forEach(ev => zona.addEventListener(ev, () => zona.classList.add('is-sobre')));
  ['dragleave', 'drop'].forEach(ev => zona.addEventListener(ev, () => zona.classList.remove('is-sobre')));

  /* ---------- Progreso ---------- */
  let inicioSubida = 0;
  function progreso(enviados, total) {
    const pct = total ? Math.min(100, (enviados / total) * 100) : 0;
    $('#docBarra').value = pct;
    let resta = '';
    const seg = (Date.now() - inicioSubida) / 1000;
    if (enviados > 0 && seg > 3 && pct < 100) {
      const faltan = Math.round(((total - enviados) / (enviados / seg)) / 60);
      resta = faltan < 1 ? ' · menos de 1 minuto' : ` · faltan unos ${faltan} min`;
    }
    $('#docProgresoTexto').textContent = `Subiendo… ${tamanoTexto(enviados) || '0 KB'} de ${tamanoTexto(total)} (${Math.floor(pct)} %)${resta}. No cierres esta página.`;
    ctx.marcarActividad();
  }

  /* ---------- Subida en partes (TUS) directo a Supabase Storage ---------- */
  const base64 = (t) => { const b = new TextEncoder().encode(t); let s = ''; b.forEach(x => { s += String.fromCharCode(x); }); return btoa(s); };
  const esperar = (ms, senal) => new Promise((ok, mal) => {
    const t = setTimeout(ok, ms);
    if (senal) senal.addEventListener('abort', () => { clearTimeout(t); mal(Object.assign(new Error('cancelado'), { name: 'AbortError' })); }, { once: true });
  });
  async function token() {
    const { data } = await sb.auth.getSession();
    if (!data || !data.session) throw Object.assign(new Error('session missing'), { status: 401 });
    return data.session.access_token;
  }
  async function errorDeRespuesta(r) {
    let texto = '';
    try { texto = await r.text(); } catch (e) { /* sin cuerpo */ }
    let m = texto;
    try { const j = JSON.parse(texto); m = j.message || j.error || texto; } catch (e) { /* no es JSON */ }
    return Object.assign(new Error(m || `Error ${r.status}`), { status: r.status });
  }
  function enviarParte(url, parte, desde, tok, alAvanzar, senal) {
    return new Promise((ok, mal) => {
      const x = new XMLHttpRequest();
      x.open('PATCH', url);
      x.setRequestHeader('Authorization', `Bearer ${tok}`);
      x.setRequestHeader('apikey', LLAVE);
      x.setRequestHeader('Tus-Resumable', '1.0.0');
      x.setRequestHeader('Upload-Offset', String(desde));
      x.setRequestHeader('Content-Type', 'application/offset+octet-stream');
      x.upload.onprogress = (e) => alAvanzar(e.loaded);
      x.onload = () => {
        if (x.status === 204) return ok(Number(x.getResponseHeader('Upload-Offset')));
        let m = x.responseText;
        try { const j = JSON.parse(x.responseText); m = j.message || j.error || m; } catch (e) { /* texto */ }
        mal(Object.assign(new Error(m || `Error ${x.status}`), { status: x.status }));
      };
      x.onerror = () => mal(new Error('NetworkError'));
      x.onabort = () => mal(Object.assign(new Error('cancelado'), { name: 'AbortError' }));
      if (senal) senal.addEventListener('abort', () => x.abort(), { once: true });
      x.send(parte);
    });
  }
  async function subirTus(archivo, ruta, tipo, alAvanzar, senal) {
    const punto = `${URL_STORAGE}/storage/v1/upload/resumable`;
    const cabeceras = (tok) => ({ Authorization: `Bearer ${tok}`, apikey: LLAVE, 'Tus-Resumable': '1.0.0' });
    const meta = [['bucketName', BUCKET], ['objectName', ruta], ['contentType', tipo], ['cacheControl', '3600']]
      .map(([k, v]) => `${k} ${base64(v)}`).join(',');
    const r = await fetch(punto, {
      method: 'POST', signal: senal,
      headers: { ...cabeceras(await token()), 'Upload-Length': String(archivo.size), 'Upload-Metadata': meta, 'x-upsert': 'false' }
    });
    if (r.status !== 201) throw await errorDeRespuesta(r);
    const destinoTus = new URL(r.headers.get('Location'), punto).href;
    let desde = 0;
    let intentos = 0;
    alAvanzar(0);
    while (desde < archivo.size) {
      const hasta = Math.min(desde + PARTE, archivo.size);
      try {
        const nuevo = await enviarParte(destinoTus, archivo.slice(desde, hasta), desde, await token(), (n) => alAvanzar(desde + n), senal);
        desde = Number.isFinite(nuevo) && nuevo > desde ? nuevo : hasta;
        intentos = 0;
        alAvanzar(desde);
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        const definitivo = err.status && err.status >= 400 && err.status < 500 && ![408, 409, 423, 429].includes(err.status);
        if (definitivo || ++intentos > 6) throw err;
        $('#docProgresoTexto').textContent = `Se interrumpió la conexión. Reintentando (${intentos} de 6)…`;
        await esperar(Math.min(30000, 1500 * 2 ** intentos), senal);
        // ¿Hasta dónde llegó realmente?
        const h = await fetch(destinoTus, { method: 'HEAD', headers: cabeceras(await token()), signal: senal }).catch(() => null);
        if (h && h.ok) desde = Number(h.headers.get('Upload-Offset')) || desde;
      }
    }
  }

  function bloquear(si) {
    subiendo = si;
    $('#docEnviar').disabled = si;
    $$('input, select, textarea', form).forEach(n => { n.disabled = si; });
    $('#docCancelar').textContent = si ? 'Cancelar la subida' : 'Cancelar';
    form.setAttribute('aria-busy', String(si));
  }
  window.addEventListener('beforeunload', (e) => { if (subiendo) { e.preventDefault(); e.returnValue = ''; } });
  // Avisar si cambia de sección a mitad de una subida
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('a[href]');
    if (!a || !subiendo || a.getAttribute('href') === '#pnMain' || a.target === '_blank' || a.hasAttribute('data-descarga')) return;
    e.preventDefault();
    const ok = await ctx.confirmar({ titulo: '¿Salir y cancelar la subida?', texto: 'Si sales ahora, el archivo dejará de subirse.', aceptar: 'Salir y cancelar', peligro: true });
    if (ok) { if (cancelador) cancelador.abort(); location.href = a.href; }
  }, true);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (subiendo) return;
    limpiarErrores();
    const titulo = limpiar(campos.titulo.value, 150);
    const ligar = $('#docLigarPropiedad').checked ? 'propiedad' : 'expediente';
    const propiedad = ligar === 'propiedad' ? campos.propiedad.value : '';
    const expediente = ligar === 'expediente' ? limpiar(campos.expediente.value, 120) : '';
    const descripcion = limpiar(campos.descripcion.value, 1000, true);
    const errores = [];
    if (titulo.length < 3) { errorCampo(campos.titulo, 'Escribe un título de al menos 3 caracteres.'); errores.push(campos.titulo); }
    if (ligar === 'propiedad' && !propiedad) { errorCampo(campos.propiedad, 'Elige la propiedad, o marca «Otra» y escribe el nombre.'); errores.push(campos.propiedad); }
    if (ligar === 'expediente' && expediente.length < 2) { errorCampo(campos.expediente, 'Escribe el nombre de la propiedad o expediente.'); errores.push(campos.expediente); }
    if (!elegido) { errorCampo(campos.archivo, 'Elige el archivo que vas a subir.'); errores.push(campos.archivo); }
    if (errores.length) {
      errorFormulario(errores.length === 1 ? 'Falta corregir un dato marcado en rojo.' : `Faltan corregir ${errores.length} datos marcados en rojo.`);
      errores[0].focus();
      return;
    }

    const { archivo, tipo } = elegido;
    bloquear(true);
    $('#docProgreso').hidden = false;
    $('#docBarra').value = 0;
    $('#docProgresoTexto').textContent = 'Preparando la subida…';
    let creado = null;
    try {
      const { data, error } = await sb.rpc('documento_crear', {
        p_titulo: titulo, p_descripcion: descripcion || null, p_propiedad: propiedad || null,
        p_expediente: expediente || null, p_nombre: limpiar(archivo.name, 200), p_tipo: tipo, p_tamano: archivo.size
      });
      if (error) throw error;
      creado = data;
      cancelador = new AbortController();
      inicioSubida = Date.now();
      await subirTus(archivo, creado.archivo, tipo, (n) => progreso(n, archivo.size), cancelador.signal);
      $('#docProgresoTexto').textContent = 'Revisando el archivo…';
      const { data: fin, error: e2 } = await sb.rpc('documento_confirmar', { p_id: creado.id });
      if (e2) throw e2;
      bloquear(false);
      cerrarFormulario();
      filtro = fin.estado === 'aprobado' ? 'aprobado' : 'en_revision';
      ctx.toast(fin.estado === 'aprobado'
        ? 'Listo: el documento ya lo ve todo el equipo.'
        : 'Listo: el documento quedó en revisión. Un administrador lo aprobará.');
      await cargarDocumentos();
    } catch (err) {
      bloquear(false);
      const cancelado = err.name === 'AbortError';
      // Si no se terminó, se borra el registro a medias (si no se puede, queda como «Subida incompleta»)
      let limpio = !creado;
      if (creado) { try { await borrarSinPreguntar(creado.id, creado.archivo); limpio = true; } catch (e2) { limpio = false; } }
      $('#docProgreso').hidden = true;
      if (cancelado) { ctx.toast('Cancelaste la subida.'); if (!limpio) cargarDocumentos(); return; }
      if (sesionExpirada(err)) { ctx.manejarError(err); return; }
      if (esVerificacion(err)) { mostrarVerificacion(); return; }
      const m = String(err.message || '');
      let texto = mensajeError(err);
      if (err.status === 413 || /maximum allowed size|too large|exceeded the maximum/i.test(m)) texto = `El archivo pesa más de lo permitido (${datos ? datos.max_mb : 50} MB).`;
      else if (/mime type|invalid_mime/i.test(m)) texto = 'Solo se aceptan archivos PDF, JPG o PNG.';
      errorFormulario(texto + (limpio ? '' : ' Quedó como «Subida incompleta»: bórralo desde la lista y vuelve a intentarlo.'));
      if (!limpio) cargarDocumentos();
    } finally {
      cancelador = null;
    }
  });

  /* =========================================================
     BITÁCORA (solo administradores)
     ========================================================= */
  function dispositivo(ua) {
    const t = String(ua || '');
    if (!t) return '';
    const so = /iPhone/.test(t) ? 'iPhone' : /iPad/.test(t) ? 'iPad' : /Android/.test(t) ? 'Android'
      : /Macintosh|Mac OS X/.test(t) ? 'Mac' : /Windows/.test(t) ? 'Windows' : /Linux/.test(t) ? 'Linux' : '';
    const nav = /Edg\//.test(t) ? 'Edge' : /OPR\//.test(t) ? 'Opera' : /Firefox\/|FxiOS/.test(t) ? 'Firefox'
      : /Chrome\/|CriOS/.test(t) ? 'Chrome' : /Safari\//.test(t) ? 'Safari' : '';
    return [so, nav].filter(Boolean).join(' · ') || 'Otro';
  }

  async function cargarBitacora() {
    const caja = $('#bitCaja');
    caja.replaceChildren(el('p', { clase: 'pn-cargando' }, 'Cargando la bitácora…'));
    const { data, error } = await sb.rpc('documentos_bitacora_listar', { p_limite: 1000 });
    if (error) { caja.replaceChildren(); return falla(error); }
    registros = data || [];
    const personas = [...new Map(registros.map(r => [r.usuario_id || r.usuario, r.usuario])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1], 'es'));
    const persona = $('#bitPersona');
    const antes = persona.value;
    persona.replaceChildren(el('option', { value: '' }, 'Todas las personas'), ...personas.map(([id, nombre]) => el('option', { value: id }, nombre)));
    persona.value = personas.some(([id]) => id === antes) ? antes : '';
    const accion = $('#bitAccion');
    if (accion.options.length <= 1) accion.append(...Object.entries(ACCIONES).map(([k, v]) => el('option', { value: k }, v)));
    pintarBitacora();
  }

  function pintarBitacora() {
    const persona = $('#bitPersona').value;
    const accion = $('#bitAccion').value;
    const q = normal($('#bitBuscar').value.trim());
    const filas = registros.filter(r => (!persona || (r.usuario_id || r.usuario) === persona)
      && (!accion || r.accion === accion)
      && (!q || normal(r.documento).includes(q)));
    const caja = $('#bitCaja');
    if (!filas.length) {
      caja.replaceChildren(el('p', { clase: 'pn-bit-vacio' }, registros.length ? 'No hay movimientos con estos filtros.' : 'Todavía no hay movimientos.'));
    } else {
      const td = (etiqueta, ...hijos) => el('td', { 'data-etiqueta': etiqueta }, ...hijos);
      caja.replaceChildren(el('table', { clase: 'pn-tabla' },
        el('thead', {}, el('tr', {}, ['Fecha y hora', 'Persona', 'Acción', 'Documento', 'Desde'].map(t => el('th', { scope: 'col' }, t)))),
        el('tbody', {}, filas.map(r => el('tr', {},
          td('Fecha y hora', el('span', { clase: 'pn-tabla-fecha' }, fh(r.fecha))),
          td('Persona', r.usuario),
          td('Acción', el('span', { clase: `pn-accion pn-accion--${r.accion}` }, ACCIONES[r.accion] || r.accion)),
          td('Documento', r.documento || '—', r.detalle ? el('span', { clase: 'pn-tabla-sub' }, r.detalle) : null),
          td('Desde', dispositivo(r.navegador) || '—', r.ip ? el('span', { clase: 'pn-tabla-sub' }, `IP ${r.ip}`) : null))))));
    }
    $('#bitNota').textContent = `${filas.length.toLocaleString('es-MX')} de ${registros.length.toLocaleString('es-MX')} movimientos (se muestran los últimos 1,000).`;
  }
  ['#bitPersona', '#bitAccion'].forEach(s => $(s).addEventListener('change', pintarBitacora));
  $('#bitBuscar').addEventListener('input', pintarBitacora);
  $('#bitRecargar').addEventListener('click', cargarBitacora);

  window.PanelDocumentos = Object.freeze({ mostrar });
})();
