/* Demetrius Grupo Inmobiliario — datos legales que pide la NOM-247-SE-2021 (portal de Internet)
   Muestra el domicilio de la oficina y el contrato de adhesión registrado ante PROFECO en cuanto
   se escriben en js/config.js (DOMICILIO_OFICINA, PROFECO_REGISTRO, PROFECO_CONTRATO_PDF).
   - [data-legal="clave"]: recibe el dato (texto; en un enlace, su dirección).
   - [data-legal-si="clave"]: está oculto ([hidden]) y se muestra solo si ese dato existe.
   Claves: domicilio, profeco-registro, profeco-pdf.
   Lo cargan index.html, yeucate.html y propiedad.html después de js/config.js. Sin innerHTML. */
(() => {
  'use strict';
  const cfg = window.DEMETRIUS_CONFIG || {};
  const limpio = (valor) => String(valor || '').replace(/\s+/g, ' ').trim();

  // El contrato tiene que ser un PDF del propio sitio, en la raíz (nunca una dirección de otro sitio)
  const pdf = limpio(cfg.PROFECO_CONTRATO_PDF);
  const datos = {
    domicilio: limpio(cfg.DOMICILIO_OFICINA).replace(/[\s.]+$/, ''), // sin punto final: el texto ya pone uno
    'profeco-registro': limpio(cfg.PROFECO_REGISTRO),
    'profeco-pdf': /^[^/\\:?#"'<>]+\.pdf$/i.test(pdf) ? pdf : ''
  };

  document.querySelectorAll('[data-legal]').forEach((nodo) => {
    const valor = datos[nodo.dataset.legal];
    if (!valor) return;
    if (nodo.tagName === 'A') nodo.setAttribute('href', encodeURI(valor));
    else nodo.textContent = valor;
  });

  document.querySelectorAll('[data-legal-si]').forEach((nodo) => {
    if (datos[nodo.dataset.legalSi]) nodo.hidden = false;
  });
})();
