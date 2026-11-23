/* Demetrius Grupo Inmobiliario — conexión con Supabase y Google Analytics
   ÚNICO lugar donde van la dirección del proyecto, la llave y el ID de Analytics. La usan:
   la página de inicio (reseñas, propiedades y Analytics), la ficha de propiedad, Yéucate y el panel del equipo.

   Solo valores PÚBLICOS: la llave publicable (sb_publishable_…) es pública por diseño;
   la seguridad la dan las reglas RLS de supabase/resenas.sql y supabase/propiedades.sql.
   NUNCA pongas aquí la Secret key ni la service_role.
   Google Analytics solo se carga si la persona acepta las cookies (js/principal.js y js/cookies.js). */
window.DEMETRIUS_CONFIG = Object.freeze({
  SUPABASE_URL: "https://tnzewcoqimldxwmvwbxi.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_KFbJFxQLzn-IxVetjEOhlg_5WMnvA53",
  BUCKET_FOTOS: "propiedades",
  WHATSAPP_NUMBER: "5213351070944",
  GA_MEASUREMENT_ID: "G-HENM9J0QYE", // Google Analytics 4 · flujo «Página web Demetrius» (2026-11-08)

  /* Datos legales que pide la NOM-247-SE-2021 (js/datos-legales.js). Mientras estén vacíos, la página no los muestra.
     Se ven en el pie de las tres páginas, en los Términos y Condiciones y en el Aviso de Privacidad. */
  DOMICILIO_OFICINA: "",    // Dirección física de la oficina: calle y número, colonia, C.P., municipio, Jalisco
  PROFECO_REGISTRO: "",     // Número de registro ante PROFECO del modelo de contrato de adhesión
  PROFECO_CONTRATO_PDF: ""  // PDF de ese contrato, guardado en la raíz junto a index.html (ej. "contrato-adhesion-profeco.pdf")
});
