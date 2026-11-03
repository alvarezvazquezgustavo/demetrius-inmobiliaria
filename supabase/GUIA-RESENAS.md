# Reseñas de la comunidad — Guía de activación (Supabase)

Tiempo estimado: 15 minutos. Costo: $0 (plan gratuito de Supabase).

Mientras no completes esta guía, la sección de reseñas muestra «Sé el primero en compartir tu experiencia» y, si alguien envía una reseña, se le ofrece mandarla por WhatsApp.

---

## 1. Crear el proyecto

1. Entra a <https://supabase.com> y crea tu cuenta (puedes usar tu Gmail o GitHub).
2. Da clic en **New project**.
   - **Name:** `demetrius-resenas`
   - **Database Password:** genera una contraseña segura y guárdala en un lugar seguro.
   - **Region:** la más cercana a México (por ejemplo, *East US* o *West US*).
3. Espera 1–2 minutos a que el proyecto termine de crearse.

## 2. Crear la tabla y las reglas de seguridad

1. En el menú izquierdo abre **SQL Editor** → **New query**.
2. Copia **todo** el contenido del archivo `supabase/resenas.sql`, pégalo y da clic en **Run**.
3. Debe aparecer **«Success. No rows returned»**.

Esto crea:

- La tabla `resenas`.
- Las reglas que permiten al público **leer solo las reseñas aprobadas** y **enviar reseñas que siempre entran como no aprobadas**.
- Un freno anti-spam.
- La vista `resenas_resumen`, con el promedio y el total de reseñas.

## 3. Copiar tus llaves

1. Abre **Project Settings** (ícono de engrane) → **API Keys**.
   - Copia la **Publishable key** (empieza con `sb_publishable_…`).
   - Si tu proyecto solo muestra *Legacy API keys*, copia la llave **anon public** (empieza con `eyJ…`).
2. Copia la **Project URL**. La encuentras en **Project Settings → Data API** o en el botón **Connect**. Se ve así: `https://abcdefghijklmnop.supabase.co`.

> ⚠️ **Nunca** copies la **Secret key** ni la **service_role** en `js/principal.js` ni la subas a GitHub. Esas llaves saltan todas las reglas de seguridad.

## 4. Conectar la página

En `js/principal.js`, busca `ENV_CONFIG` (al inicio del archivo) y llena estas dos líneas:

```js
SUPABASE_URL: "https://abcdefghijklmnop.supabase.co",
SUPABASE_ANON_KEY: "sb_publishable_xxxxxxxxxxxxxxxx",
```

Guarda el archivo y súbelo a GitHub. La llave publicable **sí puede estar en el código**: es pública por diseño, y la seguridad la dan las reglas del paso 2.

## 5. Moderar reseñas (tu rutina)

1. En Supabase abre **Table Editor** → tabla **resenas**.
2. Las reseñas nuevas aparecen con `aprobada = false` y todavía no se ven en la página.
3. Para **publicar** una reseña, da doble clic en la celda `aprobada`, cámbiala a `true` y guarda. Aparecerá en la página al recargar.
4. Para **responder**, escribe tu respuesta en la columna `respuesta`. Se mostrará como «Respuesta de Demetrius» y la fecha se registra sola.
5. Para **rechazar o eliminar** una reseña, selecciona la fila y usa **Delete**.

Reglas que prometes en los Términos y Condiciones:

- Publicar opiniones positivas **y negativas**, siempre que sean reales y respetuosas.
- **No editar** el texto de las reseñas: solo puedes aprobar, rechazar o responder.
- Retirar una reseña cuando su autor lo solicite.

## 6. Bueno saber

- **Avisos de nuevas reseñas:** Supabase no te avisa por correo por defecto. Revisa la tabla periódicamente, o más adelante configura un *Database Webhook*.
- **Plan gratuito:** Supabase puede **pausar** proyectos gratuitos sin actividad durante una semana. Si eso pasa, entra al panel y da clic en **Restore project**.
- **Prueba rápida:** envía una reseña desde tu página, confirma que llega a la tabla con `aprobada = false`, apruébala y recarga la página.
