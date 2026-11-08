/* Demetrius Grupo Inmobiliario — acceso del equipo (panel/login.html)
   Sin registro público: las cuentas las crea el administrador en Supabase. */
(() => {
  'use strict';
  const { sb, $, mensajeError } = window.Panel;
  const form = $('#formLogin');
  const correo = $('#loginCorreo');
  const clave = $('#loginClave');
  const btn = $('#loginBtn');
  const errorGeneral = $('#loginError');
  const aviso = $('#loginAviso');

  const AVISOS = {
    salida: 'Cerraste sesión. ¡Hasta pronto!',
    sesion: 'Tu sesión expiró. Vuelve a entrar.',
    inactiva: 'Tu cuenta todavía no está activada (o fue desactivada). Pídele al administrador que la active en el panel, en la sección Equipo.',
    sinperfil: 'Tu cuenta no tiene perfil en el panel. Pídele al administrador que revise tu cuenta.',
    inactividad: 'Cerramos tu sesión porque pasaron 30 minutos sin actividad. Así protegemos los documentos. Vuelve a entrar.'
  };
  const motivo = new URLSearchParams(location.search).get('motivo');
  if (AVISOS[motivo]) { aviso.textContent = AVISOS[motivo]; aviso.hidden = false; }

  function errorCampo(campo, texto) {
    const p = $(`#${campo.id}Error`);
    p.textContent = texto || '';
    p.hidden = !texto;
    campo.setAttribute('aria-invalid', texto ? 'true' : 'false');
  }
  function mostrarError(texto) {
    errorGeneral.textContent = texto || '';
    errorGeneral.hidden = !texto;
  }

  if (!sb) {
    mostrarError('El panel no está conectado con Supabase. Revisa la dirección y la llave en js/config.js.');
    btn.disabled = true;
    return;
  }

  // Si ya hay sesión, directo al panel
  sb.auth.getSession().then(({ data }) => { if (data && data.session && !motivo) location.replace('./'); });

  // Mostrar / ocultar contraseña
  $('#loginVerClave').addEventListener('click', (e) => {
    const visible = clave.type === 'password';
    clave.type = visible ? 'text' : 'password';
    e.currentTarget.textContent = visible ? 'Ocultar' : 'Mostrar';
    e.currentTarget.setAttribute('aria-pressed', String(visible));
    clave.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarError('');
    aviso.hidden = true;
    const email = correo.value.trim();
    const password = clave.value;
    let valido = true;
    if (!email) { errorCampo(correo, 'Escribe tu correo.'); valido = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { errorCampo(correo, 'El correo no parece válido. Ejemplo: nombre@gmail.com'); valido = false; }
    else errorCampo(correo, '');
    if (!password) { errorCampo(clave, 'Escribe tu contraseña.'); valido = false; }
    else errorCampo(clave, '');
    if (!valido) { (correo.getAttribute('aria-invalid') === 'true' ? correo : clave).focus(); return; }

    btn.disabled = true;
    btn.textContent = 'Entrando…';
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      location.replace('./');
    } catch (err) {
      mostrarError(mensajeError(err));
      clave.select();
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });
})();
