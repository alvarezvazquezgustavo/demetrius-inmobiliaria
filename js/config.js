/* Demetrius Grupo Inmobiliario — conexión con Supabase
   ÚNICO lugar donde van la dirección del proyecto y la llave. La usan:
   la página de inicio (reseñas y propiedades), la ficha de propiedad y el panel del equipo.

   Solo valores PÚBLICOS: la llave publicable (sb_publishable_…) es pública por diseño;
   la seguridad la dan las reglas RLS de supabase/resenas.sql y supabase/propiedades.sql.
   NUNCA pongas aquí la Secret key ni la service_role. */
window.DEMETRIUS_CONFIG = Object.freeze({
  SUPABASE_URL: "https://tnzewcoqimldxwmvwbxi.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_KFbJFxQLzn-IxVetjEOhlg_5WMnvA53",
  BUCKET_FOTOS: "propiedades",
  WHATSAPP_NUMBER: "5213351070944"
});
