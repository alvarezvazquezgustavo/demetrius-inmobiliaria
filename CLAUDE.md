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
**Excepción (2026-11-05):** la dirección y la llave publicable de Supabase viven **solo** en `js/config.js` (`window.DEMETRIUS_CONFIG`); `ENV_CONFIG` las lee de ahí. Ese archivo también lo usan la ficha (`propiedad.html`) y el panel (`/panel/`). El número de WhatsApp está repetido en `config.js` y en `js/yeucate.js`: si cambia, hay que cambiarlo en los tres lugares.

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

Fotos de la portada y de Yéucate (2026-11-04), también con su nombre original:

```
mesa-vista-013.jpg.webp            plano-lotes-1920w.png.webp     DJI_0375.JPG
IMG-20261102-WA0007.jpg            IMG-20261102-WA0009.jpg        IMG-20261102-WA0010.jpg
IMG-20261102-WA0012.jpg            IMG-20261102-WA0015.jpg        IMG-20261102-WA0016.jpg
DJI_0373.MP4                       DJI_0373-poster.jpg            DJI_0388-pueblo.jpg
DJI_0373-celular.MP4               DJI_0375-grande.jpg
```

- `DJI_0373.MP4` es el video original recortado a 14 s y sin audio, en 1080p (5 MB). `DJI_0373-celular.MP4` es la versión de 720p (2.7 MB). `DJI_0375-grande.jpg` es la foto aérea a 2560 px.
- `DJI_0373-poster.jpg` y `DJI_0388-pueblo.jpg` son cuadros sacados de los videos. Llevan el nombre del video más una palabra.
- `mesa-vista-013.jpg.webp` en realidad es un JPEG con extensión .webp. Se dejó así porque convertirlo a WebP lo hacía más pesado; los navegadores lo muestran bien.
- Fuente de las fotos y videos de Yéucate: Google Drive, carpeta `Mercadotecnia/Videos Capcut/Terrenos en Venta Chiquilistlan`.

Fotos del catálogo de WhatsApp (2026-11-04), 31 propiedades nuevas:

- Fuente: `~/Downloads/Catalogo_Demetrius_Inmobiliaria/`. Ahí están las 40 fichas en `Catalogo_Web_Demetrius_Inmobiliaria.json` (también en .csv, .xlsx y .md) y las portadas en PNG de 960×960.
- Se usó el nombre "exacto" del catálogo (el que no lleva número adelante), con estas correcciones:
  - se quitaron las comillas;
  - `.png` pasó a `.jpg`, porque se convirtieron a JPEG;
  - se conservaron el emoji 🏡, las comas, los errores de dedo ("Chapalita In", "Tesoro,Tlaquepaque") y el `(2)`.
- Las portadas son capturas de pantalla. A todas se les recortó la barrita blanca de avance de abajo (todo lo que está debajo de y = 932). Además:
  - Con bandas a los lados: x 96–864 en Pre-Venta Casa Fuerte, La Estancia, Bosques del Centinela, Sendero de las Moras y Coto los Olmos. Zoí Sur se recortó de x 20 a 940.
  - Con bandas arriba y abajo: y 120–840 en Coto Laureles, La Rioja, Bugambilias (amueblada) y Casa Fuerte `(2)`.
  - `Casa en Venta, Residencial Casa Fuerte, Tlajomulco de Zuñiga.jpg` ($6,050,000) se recortó a y 220–850 para quitar el letrero escrito en la foto y el ícono de "silencio" del video. Ojo: es la foto de la ficha 6 del catálogo. El archivo de Descargas sin comillas que tiene el mismo nombre es otra casa (la ficha 7, ya vendida).
- Se convirtieron a JPEG con PSNR ≥ 40.5 dB: pasaron de 40.8 MB a unos 8 MB en total.
- Fichas del catálogo que ya estaban en la web y no se duplicaron: 1 (Terraza Constitución), 2 (Mirador del Bosque, vendida), 3 (es la "Parques Vallarta" de la web), 4 (Balanty), 7 y 9 (Casa Fuerte, vendidas), 12 (Bugambilias esquina, vendida) y 29 (es el terreno de Jocotepec). La ficha 21 es un duplicado de la 19.

### Fotos nuevas: el nombre se conserva "tal cual"

Una foto nueva usa **el mismo nombre que tiene en Descargas**. Solo se permiten estas correcciones mínimas:

- Agregar la extensión (`.jpg`) si el archivo no la tiene.
- Quitar espacios al final del nombre.
- Quitar comillas dobles (`"`), porque Windows no las permite.
- Si el original es PNG, se convierte a JPEG y la extensión cambia a `.jpg` (el resto del nombre queda igual).

Los errores de dedo, las comas, los emojis y las mayúsculas **se conservan** ("cuidad", "asa", "terrza", "balenty", "🏡").

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
   Orden: Edificio Luviano, Zoi Capital Norte, Yéucate (desarrollo, "precio por lote a consultar" y enlace a `yeucate.html`) y después el resto, en el mismo orden que el catálogo.
6. `## Propiedades vendidas recientemente`:
   - Una frase introductoria.
   - Una línea por propiedad vendida, **sin precio**: `- Nombre — Municipio — detalles.`
   - Cierra con `¿Buscas algo similar? Escríbenos por WhatsApp: https://wa.me/5213351070944`.
   - Hoy contiene: Residencia Solares, Casa Fuerte (pre-venta), Bugambilias 2da Sección (esquina), Residencial Casa Fuerte, Mirador del Bosque, el terreno de Jocotepec y las 31 propiedades del catálogo de WhatsApp (2026-11-05). Las dos de solo renta llevan "(rentada)".
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
- **Ojo:** esto aplica a las propiedades escritas a mano en `index.html`. Las que se cargan desde el panel (Supabase) **no** aparecen solas en `llms.txt`, `llms-full.txt`, el JSON-LD ni `sitemap.xml`; si el usuario quiere que salgan ahí, se agregan a mano (o más adelante se genera con un script).

## 5. Catálogo (`index.html`, `#catalogo`)

### Atributos de cada tarjeta `<article class="prop-card">`

| Atributo | Valores |
|---|---|
| `data-tipo` | `casa`, `departamento`, `terreno`, `bodega`, `terraza`, `edificio` |
| `data-municipio` | en minúsculas; acepta varios separados por espacio (`"zapopan tlajomulco"`) |
| `data-colonia` | texto libre (sirve para la búsqueda) |
| `data-precio` | número sin formato (`3199000`) |
| `data-precio-renta` | opcional; lo usa el filtro "Rentar". En las de solo renta, `data-precio` y `data-precio-renta` llevan la renta mensual y el precio se muestra con "/ mes" |
| `data-operacion` | `venta`, `renta` o `venta renta` |
| `data-coto` / `data-preventa` | `si` / `no` |
| `data-vendida` | `si` solo en las vendidas |
| `data-recamaras` | lo usa el filtro "Recámaras". En las escritas a mano **no está en el HTML**: `principal.js` lo lee de su `<span>` "N rec." (cada `span` por separado, para que "Seguridad 24/7" + "3 rec." no se lea como 73) |
| `data-origen` / `data-id` | solo en las tarjetas que vienen del panel: `panel` y el id de Supabase |

### Clases

- `tarjeta-oculta`: la tarjeta aparece solo después de "Ver más". Hay 7 visibles al inicio. Cada clic en "Ver más" muestra 9 más, en el orden del HTML. Cuando ya se ven todas, el botón dice "Ver menos propiedades" y vuelve a dejar 7.
- `prop-destacada`: tarjeta a todo lo ancho, con tres opciones (`.opcion`) que usan `data-wa-msg` y `data-ubicacion`. Hoy solo la usa el Edificio Luviano.
- `is-vendida` junto con `data-vendida="si"`: foto en gris oscuro (`grayscale(.9) brightness(.58)`) y precio en gris. Además lleva:
  - `<span class="sello-vendida">Vendida</span>` dentro de `.prop-media`. Desde el 2026-11-05 es una **banda dorada en diagonal** (−14°) que cruza toda la foto, con bordes negros y la palabra en letras grandes; el usuario la pidió así para que se note de inmediato que ya se vendió.
  - En las de solo renta (`data-operacion="renta"`) el sello dice `Rentada` y el mensaje de WhatsApp dice "vi que rentaron…".
  - el CTA `Quiero algo similar →`.

### Orden actual

1. Edificio Luviano (destacada).
2. Zoi Capital Norte.
3. 5 tarjetas visibles originales.
4. Tarjetas ocultas disponibles: las 5 originales que siguen a la venta.
5. **Vendidas al final**, todas ocultas: las 5 de antes, el terreno de Jocotepec y las 31 del catálogo de WhatsApp, en el orden de ese catálogo (de Colomos Providencia a Paseos del Sol).

**Tarjetas del panel (2026-11-05):** se insertan al cargar la página. Las publicadas van justo **después del Edificio Luviano**, y las vendidas o rentadas, **antes de la primera vendida escrita a mano**. Después se vuelve a calcular qué queda oculto: siempre se ven las primeras 7 (`VISIBLES_INICIALES`). Si Supabase no responde, el catálogo escrito a mano se queda igual.

Hoy son 49 tarjetas escritas a mano: 12 disponibles y 37 vendidas (35 "Vendida" y 2 "Rentada"). El JSON-LD (`OfferCatalog`) tiene `numberOfItems: 51`: Yéucate, el Luviano (que cuenta como dos ofertas, venta y renta), Zoi, `#propiedad-1` a `#propiedad-11`, `#propiedad-12` y `#vendida-1` a `#vendida-4`, y `#propiedad-13` a `#propiedad-43` (las del catálogo de WhatsApp). Hay 37 vendidas: llevan `"availability": "https://schema.org/SoldOut"` y "(vendida)" o "(rentada)" al final del `name`; entre ellas están `#propiedad-7` (Jocotepec) y de `#propiedad-13` a `#propiedad-43`. Las de renta usan `LeaseOut` y un `UnitPriceSpecification` mensual (`unitCode: MON`).

### Lógica relacionada (`js/principal.js`)

- `coincide()`:
  - Excluye las vendidas cuando hay filtro de tipo o búsqueda.
  - "Comprar" equivale a `venta` y "Rentar" a `renta` (en ese caso usa `data-precio-renta` si existe).
- Los CTA arman el mensaje de WhatsApp a partir de la tarjeta:
  - En las vendidas, el mensaje es "vi que vendieron… busco algo similar" y se envía el evento GA `solicitar_similar_vendida`.
  - La tarjeta destacada usa sus propios `data-wa-msg`.
- Buscador del Hero: desde el 2026-11-05 tiene un quinto campo, **Recámaras** (`#recamarasSelect`: 1, 2, 3 o 4 o más), en un renglón a todo lo ancho (`.search-field--ancho`). La portada creció 68 px por ese renglón. Las tarjetas que no dicen recámaras (terrenos, bodegas…) no salen cuando se elige un mínimo.
- Las colonias de las propiedades del panel que no estén en la lista `colonias` se agregan solas al selector de colonia.
- En las tarjetas del panel, "Ver ficha →" abre `propiedad.html?id=…` (evento GA `ver_ficha_propiedad`); en las vendidas del panel abre WhatsApp "Quiero algo similar", igual que las demás.
- Mapa:
  - Las propiedades del panel con ubicación marcada se agregan como marcadores (su popup dice "Ver ficha →") y la leyenda se recalcula.
  - El arreglo `propiedades` tiene 11 marcadores (lat, lng, zona, título y precio), **solo de propiedades disponibles**: las vendidas no van en el mapa. El número de la leyenda (`#mapaTotal`) lo calcula el script a partir del arreglo; el del HTML es solo de respaldo.
  - Para geocodificar se usa Nominatim. Si la dirección no es exacta, se marca como "ubicación aproximada".

## 5b. Encabezado, portada y desarrollo Yéucate (2026-11-04)

- **Encabezado:**
  - Se quitó la barra "Página de inicio" a petición del usuario.
  - El `header` ahora es `position: fixed`. Es transparente hasta arriba y pasa al cristal oscuro (`.is-scrolled`) al bajar más de 10 px, con una transición de 0.3 s.
  - La portada (`.hero`) deja 84 px arriba para el encabezado y ocupa 100vh.
- **Bloque `.desarrollo` en el inicio** (después del catálogo): promociona Yéucate y enlaza a `yeucate.html`.
  - `js/principal.js` calcula solo el porcentaje vendido, los lotes disponibles y la barra a partir de `js/yeucate-lotes.js`.
  - Las cifras escritas en el HTML (47 % y 39) son solo un respaldo por si el script no carga; conviene mantenerlas parecidas.
  - **Capas (2026-11-07):** foto `z-index:0`, degradado (`::before`) `1` y texto (`.desarrollo-inner`) `position:relative; z-index:2`. Antes eran `-2` y `-1`, y en Safari de la otra Mac del usuario el texto desaparecía y solo quedaban los recuadros de cifras (no se pudo repetir en esta Mac; el usuario confirmó en su Safari que con el cambio quedó arreglado). La portada de `yeucate.html` se cambió igual (video, cifras, botón de pausa y flecha). **No volver a usar z-index negativos** en secciones con foto o video de fondo.
- **Subpágina `yeucate.html`** con `css/yeucate.css` y `js/yeucate.js` (independiente de `principal.js`):
  - Video de portada con botón de pausa.
  - Plano interactivo con 83 marcadores, filtros por superficie, interruptor "solo disponibles", ficha del lote y sugerencias de lotes parecidos.
  - Galería con visor, compra con certeza, Chiquilistlán, mapa Leaflet de la entrada (20.08420, -103.85540) y preguntas frecuentes.
- **Datos de los lotes (una sola fuente):** viven en `js/yeucate-lotes.js` (`window.YEUCATE`), que cargan el inicio y la subpágina.
  - Cada lote es `[número, m², estatus, x %, y %]`. El estatus es `d` (disponible), `a` (apartado), `b` (bloqueado) o `v` (vendido).
  - `actualizado` es el mes que se muestra en la nota de disponibilidad.
  - La subpágina y el bloque del inicio calculan solos los contadores y el porcentaje.
  - Las posiciones x/y son relativas a `plano-lotes-1920w.png.webp`.
  - Estatus a noviembre de 2026: 39 disponibles, 2 apartados (19, 30), 3 bloqueados (5, 12, 13) y 39 vendidos. Coinciden con la maqueta "OCT 2026" del usuario.
- **Si cambia un estatus, hay que actualizar a la vez:** `js/yeucate-lotes.js` (estatus y `actualizado`), la línea de Yéucate en `llms.txt` y `llms-full.txt`, y la fecha en `sitemap.xml`.
- **Zoom del plano:** botones + / − con niveles de 100 %, 160 % y 220 %.
  - Al acercar, el plano se recorre deslizando el dedo (o arrastrando con el mouse) y en celular los marcadores crecen de 14 a 24 px.
  - Al elegir un lote en la lista, el plano se centra en él.
- **Video de portada:** `DJI_0373.MP4` es la versión de 1080p para computadora (5 MB) y `DJI_0373-celular.MP4` la de 720p para pantallas de 980 px o menos (2.7 MB). Se elige con `<source media>`.
- **Foto aérea grande:** `DJI_0375-grande.jpg` (2560 px) se sirve con `srcset` solo a pantallas grandes o de alta resolución. `DJI_0375.JPG` (1600 px) es la normal.
- **Precios por lote:** no se publican; se piden por WhatsApp. El usuario tiene una lista de precios y planes de pago (12 a 72 meses) que no está en la web.
- Los textos de la subpágina son originales; no se copiaron de yeucate.mx. Los mensajes de WhatsApp van al número de Demetrius, no al del desarrollador.
- La subpágina **no carga Google Analytics ni el aviso de cookies**. Cuando se active GA, hay que decidir si también se agregan ahí.

## 6. Seguridad (OWASP)

- **CSP estricta**, con la misma regla en `_headers` (Netlify y Cloudflare Pages) y en `.htaccess` (Apache):
  - **Nada de scripts ni estilos en línea.**
  - **Nada de `innerHTML`**: se usa el helper `el()` y se sanitiza con `limpiar()`.
- Archivos de código:
  - `js/inicio.js` va en el `<head>`.
  - `js/principal.js` va al final del `<body>`.
- Leaflet 1.9.4 se carga desde cdnjs con SRI (`sha384`). Si cambia la versión, hay que actualizar el hash y la CSP.
- `supabase-js` **2.118.0** está copiada dentro del sitio (`js/vendor/supabase-2.118.0.js`, con su licencia MIT), así que la CSP de scripts no cambió. Se descargó del registro oficial de npm verificando su firma (sha512) y no usa `eval`. Para actualizarla: elegir una versión publicada hace más de 2 semanas, descargarla igual, cambiar el nombre del archivo y las dos etiquetas `<script>` de `panel/`.
- La CSP permite además `blob:` (vista previa de las fotos antes de subirlas) y `https://*.supabase.co` en `img-src` (fotos de las propiedades del panel).
- `/panel/` lleva `noindex, nofollow` (meta, `X-Robots-Tag` en `_headers` y `.htaccess`), `Cache-Control: no-store` y `Disallow: /panel/` en `robots.txt`.
- Otras cabeceras: HSTS de 2 años con preload, `X-Frame-Options DENY`, `frame-ancestors 'none'`, COOP `same-origin-allow-popups`, Permissions-Policy restrictiva y `X-XSS-Protection 0`.
- `netlify.toml` solo maneja redirecciones. GitHub Pages **no puede** enviar cabeceras.
- Archivos internos bloqueados con 404: `supabase/`, `.env*`, `_headers`, `netlify.toml`, `CLAUDE.md`.
- `.env` está en `.gitignore`. `.env.example` solo contiene marcadores.

## 7. Reseñas (Supabase)

- Proyecto: `https://tnzewcoqimldxwmvwbxi.supabase.co`. La parte pública (reseñas, catálogo y ficha) se conecta por REST, sin librería; solo el panel usa `supabase-js`.
- En el código **solo va la llave publicable** (`sb_publishable_…`), en `js/config.js`. Es pública por diseño y la protege RLS.
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

## 7b. Panel del equipo y propiedades (2026-11-05)

El usuario pidió un acceso privado para el equipo: los asesores cargan propiedades y el administrador las valida. Solo las validadas se ven en la página. Mismo proyecto de Supabase que las reseñas.

- **Archivos:**
  - `supabase/propiedades.sql`: todo el SQL, idempotente.
  - `supabase/GUIA-PANEL.md`: guía para el usuario, paso a paso y sin tecnicismos.
  - `panel/login.html` y `panel/index.html`, con `css/panel.css`, `js/panel-comun.js`, `js/panel-login.js` y `js/panel.js`. Todas sus clases empiezan con `pn-`.
  - `propiedad.html` (la ficha), con `css/propiedad.css` y `js/propiedad.js`. Su encabezado, menú y pie se copiaron de `yeucate.html`.
  - `js/propiedades-publicas.js` (`window.DemetriusPropiedades`): lee las publicadas por REST y arma las tarjetas con la misma estructura que las de `index.html`. Lo usan el inicio, la ficha y el panel.
- **Tablas:**
  - `perfiles` (id = `auth.users.id`, correo, nombre, rol `asesor`/`admin`, `activo`). Un trigger en `auth.users` crea el perfil **desactivado**.
  - `propiedades` (estado, `comentario_admin`, datos, `amenidades text[]`, `fotos text[]` con la portada primero, `lat`/`lng` opcionales y fechas).
  - Las fotos van en el bucket público `propiedades`, en la ruta `<id de la propiedad>/<uuid>.jpg`, con un máximo de 5 MB y 20 por propiedad.
- **Estados:** `borrador → en_validacion → publicada`, o `rechazada` (con comentario obligatorio), y además `vendida` / `rentada`, que pone el admin. "Despublicar" la regresa a `borrador`.
- **RLS** (se probó en PGlite con 67 casos; la prueba vive en el scratchpad y se vuelve a escribir si hace falta):
  - El público solo lee `publicada`, `vendida` y `rentada`, y solo las columnas con `grant` (nunca el asesor ni los comentarios).
  - El asesor crea propiedades a su nombre, siempre como borrador. Solo edita las suyas en `borrador` o `rechazada`, y solo puede dejarlas así o mandarlas a `en_validacion`. Solo borra sus borradores.
  - El admin hace todo, menos borrar.
  - Las cuentas desactivadas no pueden crear ni editar.
  - El trigger `propiedades_antes_de_guardar` impide que un asesor toque `comentario_admin`, las fechas o el asesor; exige al menos una foto para enviar o publicar, y que cada foto esté en la carpeta de su propiedad.
  - Storage: se suben o quitan fotos solo en las propiedades editables propias, o en cualquiera si es admin.
- **Panel:**
  - Vistas por hash: `#mis`, `#nueva`, `#editar/<id>` y, solo para el admin, `#validacion`, `#todas` y `#equipo`.
  - Las fotos se reducen en el navegador a 1600 px en JPEG (calidad 0.82). HEIC solo funciona desde el iPhone; en la computadora sale un aviso claro.
  - Lo que carga el admin se publica directo con "Guardar y publicar".
  - El admin tiene "Editar" en **todas** las propiedades, también en las publicadas, vendidas y en validación. Al editar una publicada sale el aviso "los cambios se publican en cuanto los guardes".
  - En celular (≤760 px) los menús del panel bajan a un segundo renglón, para que "Todas" y "Equipo" no queden escondidos.
  - **Acceso desde la página** (pedido por el usuario el 2026-11-05), igual en `index.html`, `propiedad.html` y `yeucate.html`, y todo lleva a `panel/login.html`:
    - Ícono de persona (`.acceso-equipo`) al final de `.social-icons`, con `title` "Iniciar sesión".
    - Enlace "Iniciar sesión" al final del menú hamburguesa.
    - "Acceso del equipo" en la columna Navegación del pie.
    - Para que quepa el ícono, `.desktop-nav` bajó de 36 a 30 px de separación y el menú hamburguesa ahora empieza en **≤1309 px** (antes 1259). A ≤380 px el ícono se oculta con los otros (la regla `nth-child(n+3)` de siempre); ahí queda el enlace del menú.
    - El panel tiene "Ver la página" al final de sus menús.
  - Las 49 propiedades escritas a mano **no aparecen en el panel**; para editarlas ahí habría que pasarlas a Supabase.
  - Si una cuenta no está activa, se cierra la sesión y aparece un aviso en el acceso.
- **Sin registro público:** el usuario crea las cuentas en Supabase (Authentication → Users) y debe apagar "Allow new users to sign up". El primer admin se hace con un `update` que viene en la guía; los demás se activan desde **Equipo**.
- **El panel solo funciona con la página publicada**: hoy no hay dominio.
- **El SQL ya se ejecutó en el Supabase real** (2026-11-05, «Success. No rows returned»). Se verificó, solo leyendo y sin sesión:
  - el público lee `propiedades` (`[]`);
  - se niegan `select=*`, `comentario_admin`, `perfiles` y crear una propiedad;
  - el bucket `propiedades` existe;
  - las reseñas siguen bien.

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
| `25dc86e` | Notas del proyecto (`CLAUDE.md`) |
| `1a789ba` | Logo nuevo en la imagen para redes |
| `a392209` | Portada nueva, desarrollo Yéucate y 31 propiedades del catálogo de WhatsApp |
| `7280231` | Las 31 del catálogo y el terreno de Jocotepec pasan a vendidas; sello "Vendida" en banda diagonal |

## 10. Cómo se prueba

- Chrome sin interfaz (CDP) en escritorio, a 1440, 1280 y 1024 px, y en móvil, a 390 y 360 px:
  - capturas de pantalla;
  - 0 errores de consola;
  - 0 violaciones de CSP;
  - sin desbordamiento horizontal.
- Servidor local que aplica `_headers`, para probar la CSP real.
- **Simulador de iOS** (instalado el 2026-11-05: Xcode 26.5 y el simulador de iOS 26.5, con iPhone 17, 17 Pro, 17 Pro Max y Air):
  - El simulador llega a la Mac por `127.0.0.1`. Se abre la página con `xcrun simctl openurl <iPhone> http://127.0.0.1:<puerto>/` y se toma la captura con `xcrun simctl io <iPhone> screenshot`.
  - Para que el panel de Claude pueda usar el iPhone simulado, el usuario tiene que dar el permiso ("Let Claude use it") en el panel; Claude no puede aceptarlo por él.
  - La Mac es Intel (i7, 16 GB): el primer arranque tardó unos 10 minutos y Safari tarda en cargar si hay otros procesos pesados. Al terminar se apagan el servidor y el simulador.
- **Prueba en el iPhone del usuario**:
  - Se levanta el servidor en la red Wi-Fi y se abre `http://MacBook-Pro-de-Gustavo.local:8792/yeucate.html`.
  - Hay que usar el nombre `.local` y no la IP, porque `js/inicio.js` manda a HTTPS cualquier dirección que no sea local.
  - El servidor de prueba del Wi-Fi tiene que quitar `upgrade-insecure-requests`, tanto de la etiqueta `<meta>` de las páginas como de la cabecera CSP, **solo al servir**. Si no, Safari pide el CSS, las fotos y los scripts por HTTPS y la página sale sin estilos (pasó el 2026-11-04). Los archivos del sitio conservan esa regla, porque en producción sí se necesita. El aviso de COOP que aparece en la consola al usar HTTP en `.local` es normal.
  - Al terminar se apaga el servidor.
- El SQL se prueba en PGlite antes de dárselo al usuario. Se simulan `auth.users`, `auth.uid()`, los roles `anon` y `authenticated` y `storage.objects` con `storage.foldername()`, y se ejecuta dos veces para comprobar que es idempotente.
- **Panel y catálogo con Supabase simulado.** No se prueba contra el Supabase real, porque ahí no hay cuentas de prueba y no se mandan cambios.
  - Un servidor local en memoria imita auth, REST (PostgREST) y Storage.
  - El servidor de prueba del sitio, con `MOCK_SUPABASE=http://127.0.0.1:<puerto>`, sirve un `js/config.js` de prueba y agrega ese origen a la CSP **solo al servir**.
  - Con el modo `sim` escucha en 127.0.0.1 y quita `upgrade-insecure-requests`, igual que `lan`.
  - Se prueban con Chrome sin interfaz los flujos del asesor y del admin, en 1280 y 390 px.
  - Simulador de iOS (2026-11-05): sin el permiso del panel solo se puede abrir enlaces (`simctl openurl`) y tomar capturas.
    - Para entrar al panel se usa una página auxiliar del servidor de prueba (`/__prueba/entrar.html?como=asesor|admin&ir=%23vista`), que vive en el scratchpad y no en el sitio.
    - Cada enlace abre una pestaña nueva y Safari se vuelve lento: hay que esperar de 25 a 60 s por captura, y si se traba, cerrar Safari con `simctl terminate`.
    - El servidor simulado debe responder **fuera** de su candado; si no, una foto que Safari lee lento bloquea las demás peticiones.
- Encabezado: el menú hamburguesa se activa en ≤1309 px (antes 1259; cambió el 2026-11-05 al agregar el ícono de "Iniciar sesión"). Se midió en 11 anchos, de 360 a 1920 px, en las tres páginas: nada se encima ni desborda.

## 11. Decisiones del 2026-11-02

- Edificio Luviano:
  - Se queda la foto recortada del folleto.
  - La nota "*Moneda de los importes y periodicidad de la renta por confirmar" **se queda así** por ahora.
- Zoi Capital Norte: el usuario **confirmó la autorización** del propietario para publicarla.
- `og-preview.jpg` ya tiene el logo nuevo.

## 12. Pendientes del usuario

- [ ] Comprar el dominio `inmobiliariademetrius.com`. Después hay que elegir hosting y activar la publicación.
- [ ] Activar el panel del equipo (`supabase/GUIA-PANEL.md`):
  - ~~ejecutar `supabase/propiedades.sql`~~ (hecho el 2026-11-05);
  - apagar "Allow new users to sign up";
  - ~~crear su cuenta y hacerla admin~~ (2026-11-05: hay 2 administradores activos, Gerardo Yair Ocaña y Gustavo Álvarez; sus correos no se anotan aquí porque el repositorio es público);
  - dar de alta a los asesores cuando el usuario los tenga.
  El panel se usa hasta que la página esté publicada.
- [ ] Cuando exista el dominio: crear la propiedad de Google Analytics 4 y dar el ID (`G-…`). Mientras siga el marcador `G-XXXXXXXXXX`, GA no se carga.
- [ ] Dar la dirección completa de la oficina y el horario.
- [ ] Confirmar la autorización del desarrollador de Yéucate para publicar su plano, sus datos y las fotos de la obra.
- [ ] (Opcional) Borrar la reseña "Prueba de conexión" en Supabase. No es urgente: está sin aprobar, así que no aparece en la web.
- [x] ~~(Opcional) Enviar capturas del catálogo de WhatsApp para compararlo con la web.~~ Llegó como carpeta `Catalogo_Demetrius_Inmobiliaria` y se agregaron 31 propiedades (2026-11-04).
- [x] ~~Confirmar si alguna de las 31 propiedades nuevas ya se vendió.~~ El 2026-11-05 el usuario confirmó, con capturas del catálogo de WhatsApp (de Colomos Providencia a Paseos del Sol), que **todas** se vendieron. Se pasaron a vendidas, junto con el terreno de Jocotepec (la ficha "Terreno a la Venta, Ajijic" de 10,413 m² aparece en esas capturas). Terraza Constitución, Bosques/Parques Vallarta y Balanty no venían en las capturas y siguen disponibles.
