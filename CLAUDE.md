# Demetrius Grupo Inmobiliario — Notas del proyecto

Sitio estático de **Demetrius Grupo Inmobiliario** (también *Inmobiliaria Demetrius*), en Guadalajara y Zapopan, Jalisco.
Este archivo reúne las decisiones tomadas y las convenciones que hay que respetar en cualquier cambio.

> **Idioma:** responde siempre en **español**, incluyendo commits, comentarios y notas.

---

## 1. Datos oficiales del negocio

| Dato | Valor |
|---|---|
| Marca | Demetrius Grupo Inmobiliario (también Inmobiliaria Demetrius) |
| Responsable legal | Gerardo Yair Ocaña Vázquez |
| Teléfono / WhatsApp | +52 33 5107 0944 · `https://wa.me/5213351070944` |
| Correo | `inmobiliriademetrius@gmail.com` (así se escribe, sin la "a": no corregir) |
| Dominio previsto | `https://inmobiliariademetrius.com`, **todavía no comprado** |
| Redes | Facebook `share/1Hd4mDmCfW`, Instagram `@residencial_demetrius`, TikTok `@demetrius.inmobiliaria` |

Todos estos datos viven en `ENV_CONFIG`, al inicio de `js/principal.js`. Cámbialos ahí, no en cada sección.

## 2. Reglas que no se rompen

1. **Prohibido cambiar textos**, tipografías (Playfair Display / Montserrat) y variables de color (`:root` en `css/estilos.css`). Solo se agrega contenido nuevo cuando el usuario lo pide.
2. **No se renombran las fotos del catálogo.** Están sincronizadas con GitHub. Ver la sección 3.
3. **No publicar el sitio** hasta tener el dominio. GitHub Pages está **desactivado**: no activarlo, no conectar Netlify ni Cloudflare.
4. **Pedir permiso antes de cada `git push`.** Primero se confirma con el usuario y después se sube.
5. Los originales del usuario en `~/Downloads` **nunca se modifican**: solo se copian.
6. No iniciar sesión en el WhatsApp Web del usuario. Si hace falta información del catálogo de WhatsApp, se le piden capturas o el texto.

## 3. Convenciones para los nombres de las fotos

### Fotos existentes: no se tocan

Los `src` actuales del catálogo se quedan exactamente así, con espacios, mayúsculas y errores de dedo incluidos:

```
lomasindependenciapreguntan.jpeg   terrza charros.jpeg            bodega insurgentes gris.jpeg
depapuntonorte.jpeg                casabugamorada.jpeg            1.jpeg
terrenojocotepec.jpeg              CASA BUGA GRANDE.jpeg          parquesvallarta.jpeg
depa balenty.jpeg                  losalmendros.jpeg              residenciasolares.jpeg
zoicapitalnorte.jpg                edificioluviano.jpg            casa en pre-venta.jpg
casa en venta cuidad bugambilias.jpg
Casa en Venta, Residencial Casa Fuerte.jpg
asa en Venta, Mirador del Bosque, Zapopan.jpg
```

### Fotos nuevas: el nombre se conserva "tal cual"

Una foto nueva usa **el mismo nombre que tiene en Descargas**. Solo se permiten estas correcciones mínimas:

- Agregar la extensión (`.jpg`) si el archivo no la tiene.
- Quitar espacios al final del nombre.
- Quitar comillas dobles (`"`), porque Windows no las permite.

Los errores de dedo, las comas y las mayúsculas **se conservan** ("cuidad", "asa", "terrza", "balenty").

### Dónde van y cómo se referencian

- Todas las fotos van en la **raíz**, junto a `index.html`. El logo es la excepción: `img/logo-demetrius.png`.
- En `index.html` (`src="..."`), el nombre se escribe tal cual, con espacios.
- En `sitemap.xml` y en el JSON-LD, el nombre se escribe **codificado como URL**: espacio = `%20`, coma = `%2C`. Ejemplo: `Casa%20en%20Venta%2C%20Residencial%20Casa%20Fuerte.jpg`.

### Optimización de fotos (solo sin pérdida visible)

- Se vuelve a codificar como JPEG con la **calidad más baja que mantenga PSNR ≥ 40–41 dB** respecto al original.
- El lado mayor queda en **1600 px como máximo**.
- **Se conserva el mismo nombre.**
- El resultado solo se guarda si **ahorra al menos 10 %**.
- Casos especiales ya resueltos:
  - `1.jpeg` era un PNG con extensión .jpeg. Se convirtió a JPEG real conservando el nombre.
  - `residenciasolares.jpeg` se generó a partir de `20260725_140707(1).jpeg`. Ese original sigue intacto en GitHub y no se borra.
  - `edificioluviano.jpg` es un recorte del folleto (555×408). El usuario no tiene la foto original, así que se queda esta.

## 4. Estructura de `llms.txt` (resumen para IA)

Sigue el estándar llmstxt.org. **Este orden se respeta:**

1. `# Demetrius Grupo Inmobiliario`
2. Resumen en blockquote (`> `): más de 10 años, Guadalajara y Zapopan, servicios, zonas, precios en MXN sin escrituración.
3. Línea de marca: marca comercial, responsable e idioma de atención.
4. `## Servicios principales`: enlaces a `#catalogo`, `#proceso`, `#vender`, `#construccion` y `#mapa`.
5. `## Propiedades destacadas`: una línea por propiedad **disponible**:
   `- Nombre — Colonia/zona, Municipio, Jalisco — $X,XXX,XXX MXN — detalles breves.`
   Orden: Edificio Luviano, Zoi Capital Norte y después el resto, en el mismo orden que el catálogo.
6. `## Propiedades vendidas recientemente`:
   - Una frase introductoria.
   - Una línea por propiedad vendida, **sin precio**: `- Nombre — Municipio — detalles.`
   - Cierra con `¿Buscas algo similar? Escríbenos por WhatsApp: https://wa.me/5213351070944`.
   - Hoy contiene: Residencia Solares, Casa Fuerte (pre-venta), Bugambilias 2da Sección (esquina), Residencial Casa Fuerte y Mirador del Bosque.
7. `## Preguntas frecuentes`: enlaces a `#preguntas-frecuentes` y `#testimonios`.
8. `## Contacto y ubicación`
9. `## Información legal`: Términos (NOM-247-SE-2021) y Aviso de Privacidad (LFPDPPP).
10. `## Optional`: enlaces a `llms-full.txt` y `sitemap.xml`.

### `llms-full.txt`

Es la versión extendida:

1. Título `# Demetrius Grupo Inmobiliario — información completa`.
2. Blockquote.
3. Lista de datos: sitio, marca, responsable, cobertura y última actualización.
4. Secciones `## Servicios`, `## Proceso de compra` (5 pasos y documentos necesarios), `## Propiedades destacadas (precios en MXN)`, `## Propiedades vendidas recientemente`, `## Preguntas frecuentes` (respuestas completas), `## Contacto` e `## Información legal`.

### Cuando una propiedad cambia

**Hay que actualizar a la vez:** `llms.txt`, `llms-full.txt`, el JSON-LD de `index.html`, `sitemap.xml` (imagen y `lastmod`) y, si aplica, el mapa (`js/principal.js`).

- **Nueva y disponible:** agrégala a "Propiedades destacadas".
- **Vendida:** quítala de "Propiedades destacadas" y pásala a "Propiedades vendidas recientemente", **sin precio**.

## 5. Catálogo (`index.html`, `#catalogo`)

### Atributos de cada tarjeta `<article class="prop-card">`

| Atributo | Valores |
|---|---|
| `data-tipo` | `casa`, `departamento`, `terreno`, `bodega`, `terraza`, `edificio` |
| `data-municipio` | en minúsculas; acepta varios separados por espacio (`"zapopan tlajomulco"`) |
| `data-colonia` | texto libre (sirve para la búsqueda) |
| `data-precio` | número sin formato (`3199000`) |
| `data-precio-renta` | opcional; lo usa el filtro "Rentar" |
| `data-operacion` | `venta`, `renta` o `venta renta` |
| `data-coto` / `data-preventa` | `si` / `no` |
| `data-vendida` | `si` solo en las vendidas |

### Clases

- `tarjeta-oculta`: la tarjeta aparece solo después de "Ver más". Hay 7 visibles al inicio.
- `prop-destacada`: tarjeta a todo lo ancho, con tres opciones (`.opcion`) que usan `data-wa-msg` y `data-ubicacion`. Hoy solo la usa el Edificio Luviano.
- `is-vendida` junto con `data-vendida="si"`: foto en gris suave y precio en gris. Además lleva:
  - `<span class="sello-vendida">Vendida</span>` dentro de `.prop-media`;
  - el CTA `Quiero algo similar →`.

### Orden actual

1. Edificio Luviano (destacada).
2. Zoi Capital Norte.
3. 5 tarjetas visibles originales.
4. Tarjetas ocultas disponibles.
5. **Vendidas al final**, todas ocultas.

Hoy son 18 tarjetas: 13 disponibles y 5 vendidas. El JSON-LD (`OfferCatalog`) tiene `numberOfItems: 19`, porque el Luviano cuenta como dos ofertas (venta y renta). Las vendidas llevan `"availability": "https://schema.org/SoldOut"` y un `@id` de la forma `#vendida-N`.

### Lógica relacionada (`js/principal.js`)

- `coincide()`:
  - Excluye las vendidas cuando hay filtro de tipo o búsqueda.
  - "Comprar" equivale a `venta` y "Rentar" a `renta` (en ese caso usa `data-precio-renta` si existe).
- Los CTA arman el mensaje de WhatsApp a partir de la tarjeta:
  - En las vendidas, el mensaje es "vi que vendieron… busco algo similar" y se envía el evento GA `solicitar_similar_vendida`.
  - La tarjeta destacada usa sus propios `data-wa-msg`.
- Mapa:
  - El arreglo `propiedades` tiene 12 marcadores (lat, lng, zona, título y precio). La leyenda del mapa dice 12.
  - Para geocodificar se usa Nominatim. Si la dirección no es exacta, se marca como "ubicación aproximada".

## 6. Seguridad (OWASP)

- **CSP estricta**, con la misma regla en `_headers` (Netlify y Cloudflare Pages) y en `.htaccess` (Apache):
  - **Nada de scripts ni estilos en línea.**
  - **Nada de `innerHTML`**: se usa el helper `el()` y se sanitiza con `limpiar()`.
- Archivos de código:
  - `js/inicio.js` va en el `<head>`.
  - `js/principal.js` va al final del `<body>`.
- Leaflet 1.9.4 se carga desde cdnjs con SRI (`sha384`). Si cambia la versión, hay que actualizar el hash y la CSP.
- Otras cabeceras: HSTS de 2 años con preload, `X-Frame-Options DENY`, `frame-ancestors 'none'`, COOP `same-origin-allow-popups`, Permissions-Policy restrictiva y `X-XSS-Protection 0`.
- `netlify.toml` solo maneja redirecciones. GitHub Pages **no puede** enviar cabeceras.
- Archivos internos bloqueados con 404: `supabase/`, `.env*`, `_headers`, `netlify.toml`, `CLAUDE.md`.
- `.env` está en `.gitignore`. `.env.example` solo contiene marcadores.

## 7. Reseñas (Supabase)

- Proyecto: `https://tnzewcoqimldxwmvwbxi.supabase.co`, conectado por REST, sin librería.
- En el código **solo va la llave publicable** (`sb_publishable_…`), en `ENV_CONFIG.SUPABASE_ANON_KEY`. Es pública por diseño y la protege RLS.
  - Se envía en la cabecera `apikey`.
  - `Authorization` solo se agrega para llaves `eyJ…`.
- **Nunca** van en el código ni en GitHub la *Secret key*, la *service_role* ni la contraseña de la base de datos. Tampoco se le piden al usuario.
- **Nunca** se envían `DELETE`, borrados masivos ni cambios destructivos a la base de datos real. Las pruebas en vivo son solo de lectura o inserción normal.
- `supabase/resenas.sql` contiene:
  - la tabla `resenas`;
  - RLS: se leen solo las que tienen `aprobada = true`, y todo lo insertado entra como no aprobado;
  - grants explícitos, para que funcione aunque esté apagado "Automatically expose new tables";
  - un trigger anti-spam (10 por minuto);
  - la vista `resenas_resumen` con `security_invoker`.
- Moderación: el usuario aprueba (`aprobada = true`) o responde desde el Table Editor. La guía está en `supabase/GUIA-RESENAS.md`.

## 8. SEO, GEO e IA

- El JSON-LD `@graph` en `index.html` incluye:
  - `RealEstateAgent`, `WebSite` y `WebPage`;
  - 3 `Service`;
  - `OfferCatalog`;
  - `FAQPage`.
- `robots.txt`:
  - Permite buscadores y bots de IA que citan.
  - **Los bots de entrenamiento también están PERMITIDOS** (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot, Meta-ExternalAgent). Es decisión del usuario: "Mantener permitido".
  - Para todos se bloquean `/supabase/` y `/generador-og-1200x630.html`.
- `sitemap.xml` usa image sitemap y actualiza `lastmod` en cada cambio de contenido.
- OG y Twitter usan `og-preview.jpg` (1200×630): foto de casa de noche, panel oscuro y el **logo nuevo**.
  - El 2026-11-02 solo se cambió el logo; el resto del diseño y los textos se conservaron.
  - `generador-og-1200x630.html` crea un diseño **distinto** (casa con alberca). No se usa salvo que el usuario lo pida.

## 9. Git y GitHub

- Repositorio: `alvarezvazquezgustavo/demetrius-inmobiliaria` (público), rama `main`.
- Autor de los commits: `alvarezvazquezgustavo <334010730+alvarezvazquezgustavo@users.noreply.github.com>`. Es el correo noreply; **no se usa el correo personal**.
- Mensajes de commit en español, terminados con la línea `Co-Authored-By` de Claude.
- Antes de cada push:
  1. Verificar que nadie cambió el remoto.
  2. Confirmar que la carpeta local es igual al repositorio.
  3. Revisar que no se suba ningún secreto.
- La carpeta `~/Downloads/inmobiliariademetrius-web/` es la copia de trabajo y no es un repositorio git. La única diferencia con GitHub es el original `20260725_140707(1).jpeg`, que solo está en GitHub y no se borra.

### Historial de cambios principales

| Commit | Cambio |
|---|---|
| `8f8f138` | Reestructura (CSS y JS externos, seguridad, SEO y GEO) |
| `db5ed0f` | Logo nuevo |
| `07393d6` | Casa Zoi Capital Norte |
| `4513146` | Edificio Luviano y reseñas con Supabase |
| `451db5a` | Propiedades vendidas con etiqueta "Vendida" |

## 10. Cómo se prueba

- Chrome sin interfaz (CDP) en escritorio, a 1440, 1280 y 1024 px, y en móvil, a 390 y 360 px:
  - capturas de pantalla;
  - 0 errores de consola;
  - 0 violaciones de CSP;
  - sin desbordamiento horizontal.
- Servidor local que aplica `_headers`, para probar la CSP real.
- El SQL se prueba en PGlite antes de dárselo al usuario.
- Encabezado: el menú hamburguesa se activa en ≤1259 px para evitar el desbordamiento entre 981 y 1370 px.

## 11. Decisiones del 2026-11-02

- Edificio Luviano:
  - Se queda la foto recortada del folleto.
  - La nota "*Moneda de los importes y periodicidad de la renta por confirmar" **se queda así** por ahora.
- Zoi Capital Norte: el usuario **confirmó la autorización** del propietario para publicarla.
- `og-preview.jpg` ya tiene el logo nuevo.

## 12. Pendientes del usuario

- [ ] Comprar el dominio `inmobiliariademetrius.com`. Después hay que elegir hosting y activar la publicación.
- [ ] Cuando exista el dominio: crear la propiedad de Google Analytics 4 y dar el ID (`G-…`). Mientras siga el marcador `G-XXXXXXXXXX`, GA no se carga.
- [ ] Dar la dirección completa de la oficina y el horario.
- [ ] (Opcional) Borrar la reseña "Prueba de conexión" en Supabase. No es urgente: está sin aprobar, así que no aparece en la web.
- [ ] (Opcional) Enviar capturas del catálogo de WhatsApp para compararlo con la web.
