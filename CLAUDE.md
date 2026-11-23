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
| Correo | `inmobiliariademetrius@gmail.com`. Antes la página decía `inmobiliriademetrius@gmail.com` (sin la "a"); el 2026-11-08 el usuario pidió usar el de su ficha de negocio y se cambió en todo el sitio (8 archivos) |
| Horario | Abierto las 24 horas, los 7 días (confirmado el 2026-11-08). Está en el JSON-LD (`openingHoursSpecification`), en el pie de las tres páginas y en `llms.txt`/`llms-full.txt` |
| Dominio previsto | `https://inmobiliariademetrius.com`, **todavía no comprado** |
| Redes | Facebook `share/1Hd4mDmCfW`, Instagram `@residencial_demetrius`, TikTok `@demetrius.inmobiliaria` |

Todos estos datos viven en `ENV_CONFIG`, al inicio de `js/principal.js`. Cámbialos ahí, no en cada sección.
**Excepción (2026-11-05):** la dirección y la llave publicable de Supabase viven **solo** en `js/config.js` (`window.DEMETRIUS_CONFIG`); `ENV_CONFIG` las lee de ahí. Ese archivo también lo usan la ficha (`propiedad.html`) y el panel (`/panel/`). El número de WhatsApp está repetido en `config.js` y en `js/yeucate.js`: si cambia, hay que cambiarlo en los tres lugares. Desde el 2026-11-08 también el ID de Google Analytics (`GA_MEASUREMENT_ID`) vive en `js/config.js`.

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
4. `## Servicios principales`: enlaces a `#catalogo`, `#proceso`, `#vender`, `#construccion`, `#mapa` y, desde el 2026-11-14, `#herramientas` (Calculadoras) y `#asesores`.
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

**Catálogo escrito a mano en el panel (2026-11-08, paso 17 pedido por el usuario):** las 48 tarjetas (todas menos el Edificio Luviano) ya viven también en Supabase con `supabase/catalogo-inicial.sql` (ids fijos, `uuid5` de la foto; `on conflict do nothing`).
- Cada tarjeta de `index.html` lleva `data-id` con su id del panel; los 10 marcadores del mapa con ubicación llevan el mismo `id` en el arreglo `propiedades` de `principal.js`.
- Al cargar Supabase, `principal.js` cambia cada tarjeta escrita a mano por su versión del panel **en el mismo lugar**. Si en el panel pasó de disponible a vendida (o al revés), se mueve a su grupo; si ya no es pública, se quita. Sus marcadores del mapa se cambian por los del panel (con «Ver ficha →»).
- **Seguro:** solo lo hace si Supabase tiene al menos una de esas tarjetas; si no (SQL sin ejecutar, lista vacía o sin conexión), no toca nada. Las tarjetas escritas a mano siguen en el HTML para buscadores y como respaldo.
- Para que se vean idénticas se agregaron `zona_texto` y `datos_tarjeta` (ver §7b). Se comparó tarjeta por tarjeta: 47 de 48 quedan iguales; la de Torre Balanty muestra «$3,300,000.00 M.N.» en lugar de «$3'300,000.00 M.N.» (el formato del panel). El texto alternativo de las fotos y los textos del mapa ahora salen de los datos del panel.
- Fotos: `fotos = ['sitio/<archivo>']` (la foto sigue en la raíz con su nombre original). `urlFoto` la resuelve contra la raíz de la página. Nunca se borra desde el panel.
- Ajustes de datos: Torre Balanty tenía municipios «zapopan tlajomulco» → quedó `zapopan`; Colomos Providencia decía venta y renta sin renta mensual → quedó `venta`; los m² sueltos de casas se guardaron como construcción (los de terrenos, como terreno); los datos que no son m², recámaras, baños o estacionamientos quedaron como amenidades. El marcador de «Bugambilias $12 M» se asignó a la de `CASA BUGA GRANDE.jpeg` (había dos casas de $12 M; conviene que el usuario lo confirme).
- `llms.txt`, `llms-full.txt`, el JSON-LD y `sitemap.xml` **no** se actualizan solos con lo que se cambie en el panel.

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
- **Analytics y aviso de cookies en las subpáginas** (2026-11-08, recomendado y aprobado por el usuario): `yeucate.html` y `propiedad.html` cargan `js/config.js` + `js/cookies.js` y llevan el mismo aviso que el inicio (el enlace va a `index.html#aviso-privacidad`, que abre el modal). Comparten la decisión en `localStorage` (`demetrius_cookie_consent`) con el inicio: si se acepta o rechaza en una página, no se vuelve a preguntar. GA solo carga con «Aceptar»; publicidad siempre en `denied`. `cookies.js` expone `window.DemetriusAnalitica.track()`; la medición mejorada de GA ya registra clics de salida (WhatsApp).

## 5c. Módulos del 2026-11-14 (moneda e idioma, calculadoras, valuación, asesores, comparador)

El usuario pegó una lista de 7 bloques (redactada con otra IA). Se aplicó completa, verificando cada punto contra el código. Se subió a GitHub el 2026-11-22, con permiso del usuario.

- **Archivos nuevos** (solo los carga `index.html`, después de `js/principal.js`):
  - `js/ajustes.js`: **«PANEL DE CONFIGURACIÓN RÁPIDA DEMETRIUS»**. Aquí se cambian `URL_SIMULADOR_HIPOTECARIA` (vacío = el banner abre WhatsApp), `FALLBACK_USD_MXN` (20.00), `CONFIG_CREDITO` (tasa 10.75 %), `CONFIG_ESCRITURACION_JALISCO`, `CONFIG_ISR` (700,000 UDIS; UDI del 13-nov-2026 = 8.904621), `VALORES_MERCADO_PORTALES_ZMG` y `ASESORES_DEMETRIUS`. Se carga antes de `principal.js`.
  - `js/i18n-en.js`: `DICCIONARIO_I18N` (por clave), `TEXTOS_I18N` (por texto en español) y `PATRONES_I18N`.
  - `js/idioma-moneda.js`: motor de idioma y moneda, menú 🌐 del encabezado y «Buscar al mover el mapa». Expone `window.DemetriusAjustes`.
  - `js/herramientas.js`: pestañas de `#herramientas` y valuación instantánea (`window.DemetriusValuacion`).
  - `js/asesores.js`, `js/comparador.js` y `css/modulos.css` (todos los estilos nuevos; usa las variables de `estilos.css`).
- **Puente:** al final de `js/principal.js` está `window.Demetrius` (`el`, `limpiar`, `waLink`, `track`, validación de formularios, `catalogo`, `mapa`). Los módulos solo usan eso. `principal.js` avisa con los eventos `demetrius:catalogo` y `demetrius:mapa`; el motor, con `demetrius:ajustes`.
- **Idioma (es MX / en US):**
  - Los elementos nuevos llevan `data-i18n`, `data-i18n-placeholder` o `data-i18n-aria`. El español es el del HTML; el inglés sale de `DICCIONARIO_I18N.en`.
  - Lo que ya existía se traduce por su texto en español (`TEXTOS_I18N`). **Si se cambia un texto en `index.html`, hay que cambiar su renglón ahí**; si no, ese texto se queda en español al ver la página en inglés.
  - Lo que la página escribe después (tarjetas del panel, mensajes, mapa) se traduce con un `MutationObserver`.
  - No se traducen: modales legales, reseñas de clientes, nombres propios, `data-no-i18n` ni los mensajes de WhatsApp (siempre en español).
  - Antes de traducir, a cada `<option>` sin `value` se le fija su texto en español como valor, para que filtros y mensajes sigan igual.
- **Moneda (MXN / USD):** el tipo de cambio se pide a `https://open.er-api.com/v6/latest/USD` solo cuando hace falta (dólares activos, menú abierto, calculadoras o comparador a la vista) y se guarda 12 h en `localStorage`. Solo cambia el **texto** de los precios (`.prop-price`, `.opcion-precio`, `.popup-price`, `#presupuestoSelect`, `#conPresupuesto`); `data-precio` y los filtros siguen en pesos. Con dólares activos aparece una nota bajo los filtros: el precio oficial es en M.N.
- **Catálogo:**
  - Interruptor **Disponibles / Vendidas · Casos de Éxito** (`estadoCatalogo.vista`). Ya no se mezclan: antes las vendidas iban al final de «Ver más». Las búsquedas del Hero siempre son sobre disponibles.
  - Chips nuevos: `terrenos` (`data-tipo="terreno"`) y `comercial` (`bodega`, `edificio`, `terraza`).
  - «Ver más» ahora cuenta sobre las tarjetas que coinciden: 7 al inicio y de 9 en 9.
  - Botón «Comparar» en cada tarjeta (lo inserta `comparador.js`), barra flotante y modal lado a lado con pesos y dólares; máximo 3.
- **`#herramientas`** (después de `#proceso`): crédito hipotecario (banner + desglosador), gastos de escrituración (estimador por municipio y cotizador por WhatsApp) e ISR (pre-evaluador del art. 93 LISR). Enlaces directos: `#herramientas-escrituracion`, `#herramientas-isr`.
- **Valuación instantánea:** al enviar `#formValuacion` se muestra el rango (mínimo, promedio, máximo y precio por m²) y el botón «Confirmar y enviar por WhatsApp», que manda la solicitud de siempre más el rango. Si faltan los m², se puede enviar sin rango. El texto de la animación se dejó como «Comparando con los valores de mercado de referencia…» y no «Consultando… los portales», porque la página **no consulta portales en vivo**: usa la tabla de `ajustes.js`.
- **`#asesores`** (antes de las reseñas): directorio con filtros y páginas (6 por página) y modal de perfil con formulario a WhatsApp del asesor. Hoy solo está Gerardo Yair Ocaña Vázquez (sin foto: se ven sus iniciales; idioma: Español). Hay 2 perfiles de ejemplo comentados.
- **Mapa:** interruptor «Buscar al mover el mapa» (en el menú 🌐 y bajo el mapa): lista las propiedades del área visible y resalta sus tarjetas. Los marcadores del panel ahora llevan `id`; el del Luviano, `selector: ".prop-destacada"`.
- **Botón flotante de llamada** (`#telFloat`) arriba del de WhatsApp. Su centro va en la misma línea que el de WhatsApp: en computadora `right:29px` (52 px; WhatsApp mide 58 px con `right:26px`) y en celular (≤640 px) `right:18px`, igual que WhatsApp (52 px). El 2026-11-19 el usuario vio que en celular quedaba 11 px a la izquierda (seguía con 29 px); se corrigió y se midió en 360, 375, 640, 641, 1024 y 1440 px. Si cambia el tamaño o la orilla de `.wa-float`, hay que cambiar también `.tel-float`.
- **Encabezado** (medido en el navegador): completo ≥ 1820 px; compacto con «Agendar cita» 1560–1819; sin ese botón 1440–1559; muy compacto 1340–1439; **hamburguesa ≤ 1339 px** (antes 1309; mismo número en `principal.js`). En celular el selector es un ícono redondo; Instagram y TikTok se ocultan desde **480 px** (antes 380).
- **Textos corregidos a petición del usuario:** títulos sin comillas, «Ciudad Bugambilias», «2da Sección», «La mejor ubicación», «Área de Asador», «Área condominal» y Balanty «$3,300,000.00 M.N.». También en `supabase/catalogo-inicial.sql`. El menú ya no dice «Blog»: ahora Calculadoras, Asesores y Reseñas (el ancla `#blog` sigue existiendo).
- **Edificio Luviano:** ahora dice `$80,000,000.00 M.N.` y `$500,000.00 M.N. / mes` (HTML, JSON-LD, mapa y `llms`). Lo indicó el texto pegado; antes estaba «por confirmar». **Falta que el usuario lo confirme.**
- **Años de experiencia:** «12+» de `#nosotros` pasó a «10+», igual que el resto del sitio. Falta que el usuario confirme cuál es el correcto.
- **Lo que NO se aplicó, y por qué:**
  - `defer` en `js/inicio.js`: ese archivo debe correr antes de pintar (pone la clase `js` del esqueleto de fotos); con `defer` las fotos parpadean. Pesa 1.4 KB.
  - Codificar los `src` de las fotos: se quedan tal cual (regla 2 y el propio bloque 7 de la lista). Los navegadores los codifican solos. Sí se agregó `width="800" height="600"`.
- **Valores de referencia (hay que revisarlos):** las tarifas de escrituración y los precios por m² son estimados armados con fuentes públicas de 2026 (leyes de ingresos municipales, reportes de precios de lista de octubre 2026). El usuario dijo que los ajustará con datos de su notaría.
- **Las subpáginas** (`yeucate.html`, `propiedad.html`) no tienen el selector de moneda e idioma.
- **Probado** en el navegador integrado con el servidor local (CSP real): 1820, 1560, 1440, 1366, 1340, 1339, 660, 481, 390 y 360 px; inglés y dólares; calculadoras, valuación, asesores, comparador y mapa. Único error de consola: el 400 de Supabase mientras no se ejecute el SQL nuevo (pendiente de antes).

## 5d. Ajustes legales del 2026-11-19 (NOM-247-SE-2021)

El usuario preguntó qué faltaba para evitar demandas o denuncias. Se revisó la página contra la NOM-247 (numeral «Obligaciones respecto al portal de Internet»: precios de contado; leyenda de crédito; dirección física y electrónica para quejas y horario; modelo de contrato de adhesión registrado ante PROFECO; formas de pago; tasa/CAT si el proveedor financia; Aviso de Privacidad). El usuario aprobó («Sí, hazlos») estos cambios. Se subieron a GitHub el 2026-11-22.

- **Leyenda de crédito** (texto casi literal de la NOM): «En operaciones de crédito, el precio total se determinará en función de los montos variables de los conceptos de crédito y de los gastos notariales, que deben consultarse con tu asesor.» Está en `.nom-note` del catálogo, en Términos §5 y en `.ficha-legal` de `propiedad.html`. Su inglés está en `TEXTOS_I18N` (el renglón de la nota completa).
- **Se quitó «· Tour virtual 360° disponible en fichas marcadas»** de `.compare-note`: ninguna ficha tiene tour (riesgo de publicidad engañosa, art. 32 LFPC). Si algún día hay tours, se vuelve a poner.
- **Domicilio y contrato PROFECO, listos para llenar** en `js/config.js`: `DOMICILIO_OFICINA`, `PROFECO_REGISTRO` y `PROFECO_CONTRATO_PDF` (PDF en la raíz, solo nombre de archivo, termina en `.pdf`). `js/datos-legales.js` (lo cargan las tres páginas después de `config.js`) llena los `[data-legal="…"]` y muestra los `[data-legal-si="…"]`, que están `hidden` mientras el dato esté vacío. Claves: `domicilio`, `profeco-registro`, `profeco-pdf`. Dónde aparecen:
  - pie de las tres páginas: «Oficina: …» y el enlace «Contrato registrado ante PROFECO» (en inglés: «Office:» / «Contract registered with PROFECO»);
  - Términos §7: número de registro y enlace al contrato; Términos §8: párrafo nuevo de quejas (correo, WhatsApp, 24/7 y, si existe, la oficina);
  - Aviso de Privacidad §1: «Domicilio de la oficina del Responsable: …».
  - **Cuando el usuario dé la dirección**, además hay que ponerla a mano en el JSON-LD (`address` de `RealEstateAgent`), en `llms.txt` y en `llms-full.txt`.
- `~/Herramientas-Demetrius/servidor-enlace.py` ahora también sirve `.pdf` (para el contrato).
- **No se tocó** «Liderando el mercado inmobiliario de lujo en la Zona Metropolitana de Guadalajara.» (`#nosotros`): se le dijo al usuario que, si no se puede probar, conviene suavizarlo; decide él.
- Lo que ya cumplía: precios en M.N. con nota del tipo de cambio, Aviso de Privacidad con la autoridad actual (Secretaría Anticorrupción y Buen Gobierno), Términos con PROFECO, imágenes ilustrativas, descargos de las calculadoras («no es un avalúo», «no constituye una cotización oficial»), reseñas moderadas.
- Probado con un servidor local de prueba (scratchpad) con datos de ejemplo y sin ellos: 1440 y 390 px, español e inglés, las tres páginas; sin desbordamiento; sin errores de consola salvo el 400 de Supabase de siempre.

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
- Desde el 2026-11-14, `connect-src` permite también `https://open.er-api.com` (tipo de cambio USD/MXN del selector de moneda), en `_headers` y en `.htaccess`. Es una consulta sin datos personales.
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
  - `supabase/GUIA-PANEL.md`: guía para el usuario, paso a paso y sin tecnicismos. `supabase/GUIA-PANEL.pdf` es la misma guía en PDF (2026-11-07, pedido del usuario): se armó del .md con `marked` → HTML con el estilo de la marca → Chrome sin interfaz (`--print-to-pdf`, tamaño carta, portada con índice). **Si cambia la guía, hay que volver a generar el PDF.**
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
  - Las propiedades escritas a mano se pasaron al panel el 2026-11-08 (ver §5): salen como «Sin asesor asignado» y solo el admin las edita. Al guardar una sin asesor, el admin regresa a «Todas».
  - **Campos `zona_texto` y `datos_tarjeta`** (2026-11-08, en `propiedades.sql` con `add column if not exists`): textos opcionales de la tarjeta. En el formulario solo los ve el admin («Texto de la zona en la tarjeta» y «Datos cortos de la tarjeta», uno por renglón, máx. 6 × 40). Si están vacíos, la tarjeta se arma sola. El público los puede leer (grant).
  - **Fotos `sitio/…`:** `fotos_validas` acepta `sitio/<archivo>` (sin `/`, con extensión de imagen). El trigger solo deja que el admin las agregue; el asesor solo conserva las que ya tenía. El panel nunca las manda a borrar de Storage.
  - Si una cuenta no está activa, se cierra la sesión y aparece un aviso en el acceso.
- **Sin registro público:** el usuario crea las cuentas en Supabase (Authentication → Users) y debe apagar "Allow new users to sign up". El primer admin se hace con un `update` que viene en la guía; los demás se activan desde **Equipo**.
- **El panel solo funciona con la página publicada**: hoy no hay dominio.
- **El SQL ya se ejecutó en el Supabase real** (2026-11-05, «Success. No rows returned»). Se verificó, solo leyendo y sin sesión:
  - el público lee `propiedades` (`[]`);
  - se niegan `select=*`, `comentario_admin`, `perfiles` y crear una propiedad;
  - el bucket `propiedades` existe;
  - las reseñas siguen bien.

## 7c. Documentos del equipo (2026-11-07)

Apartado privado del panel (`#documentos`) para compartir la documentación delicada de las propiedades (escrituras, INE, predial, planos; escaneos de 80+ páginas). Lo pidió el usuario "de extrema seguridad". Respuestas del usuario: verificación en dos pasos obligatoria para todos; bitácora que solo ven los admins y sin avisar al asesor; lo aprobado lo ve todo el equipo activo; cada documento se liga a una propiedad del panel o a un expediente con nombre libre; nadie borra un aprobado (el admin solo archiva); PDF, JPG y PNG.

- **Archivos:** `supabase/documentos.sql` (idempotente; requiere `propiedades.sql`), `js/panel-documentos.js`, secciones `vista-verificacion`, `vista-documentos` y `vista-bitacora` en `panel/index.html`, estilos `pn-doc-*`, `pn-verif-*`, `pn-tabla` en `css/panel.css`. La guía está en `supabase/GUIA-PANEL.md`, punto 8.
- **Tablas cerradas:** `documentos`, `documentos_bitacora` y `documentos_config` tienen RLS sin políticas y sin grants: nadie las lee ni escribe directo. Todo pasa por funciones `security definer`: `documentos_listar` (anota la «entrada», máximo una vez cada 10 min), `documento_crear`, `documento_confirmar`, `documento_revisar`, `documento_archivar`, `documento_abrir`, `documento_borrar_preparar`, `documento_borrar`, `documentos_bitacora_listar` y `documentos_pendientes` (solo el número, para el menú; no pide los dos pasos).
- **Todo exige** `usuario_activo()` y `auth.jwt()->>'aal' = 'aal2'` (`documentos_acceso()`), también en Storage.
- **Estados:** `subiendo → en_revision → aprobado / rechazado (comentario obligatorio) → archivado`. Lo que sube un admin queda aprobado al confirmar. El asesor ve los aprobados y sus propios pendientes, rechazados y subidas incompletas; el admin ve todo.
- **Storage:** bucket **privado** `documentos`, ruta `<id>/<uuid>.<pdf|jpg|png>`. Políticas: subir solo a un documento propio en `subiendo`; leer (crear el enlace firmado, 60 s) solo con un registro `abrir`/`descargar` de la bitácora de hace menos de 2 minutos (así cada apertura queda anotada sí o sí); quitar solo con el permiso temporal de `documento_borrar_preparar` (10 min). No hay política de update: no se puede sobrescribir.
- **Borrar:** quien lo subió, mientras está en `subiendo`/`en_revision`/`rechazado`; el admin, los `rechazado` y `subiendo`. Un aprobado nunca. Se quita primero el archivo con la API de Storage (Supabase no deja borrar `storage.objects` por SQL) y después el registro.
- **Subida:** en partes de 6 MB con el protocolo TUS, directo a `https://<proyecto>.storage.supabase.co` (`URL_STORAGE` en `panel-comun.js`; en pruebas, `SUPABASE_STORAGE_URL` en `config.js`). Reintenta si se cae la conexión y se puede cancelar; si falla, borra el registro a medias. El tipo se revisa por el contenido (`%PDF-`, JPEG, PNG), no por el nombre.
- **Límites:** `documentos_config` (`max_mb` 50 y `espacio_gb` 1, plan gratis). Un trigger copia `max_mb` al bucket. Al pasar a Pro: `update public.documentos_config set max_mb = 300, espacio_gb = 100;` y subir el límite global de Storage a 300 MB en el dashboard. `documento_crear` niega si el archivo no cabe en el espacio (cuenta fotos + documentos).
- **Verificación en dos pasos:** TOTP de Supabase (`mfa.enroll`/`challengeAndVerify`). El QR llega como SVG y se muestra desde un `blob:` (la CSP ya permitía `blob:` en `img-src`). En celular aparece «Abrir en mi app de autenticación» (`otpauth://`). Para reiniciarla a alguien: `delete from auth.mfa_factors where user_id = …` (está en la guía).
- **Bitácora:** guarda persona, acción, documento, detalle, IP (`cf-connecting-ip`/`x-real-ip`/`x-forwarded-for`) y navegador. Vista `#bitacora` solo admin, con filtros; en celular la tabla se vuelve tarjetas.
- **Cierre por inactividad:** el panel cierra la sesión tras 30 minutos sin actividad (`motivo=inactividad` en el login). Subir un archivo cuenta como actividad.
- **Menú del panel:** con «Documentos», el menú completo del admin necesita ~1560 px; en ≤1560 px baja a su propio renglón y puede ocupar dos (antes el corte era 1320).
- **Aviso de Privacidad** (2026-11-07, a petición del usuario): se agregó en la sección 2 el punto «Documentación de la operación» y en la sección 5 un párrafo de que se resguarda en Supabase (servidores posiblemente fuera de México, espacio privado, dos pasos y registro de consultas). La fecha del aviso pasó a 7 de noviembre de 2026. Conviene que lo revise un abogado.
- **Probado:** SQL en PGlite con 110 casos (ejecutado dos veces). Panel completo contra un Supabase simulado (ver §10) en 1440, 1280, 1024, 800 y 390 px, y en el motor de Safari (WKWebView).

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
- Mensajes de commit en español. Desde el 2026-11-22 ya **no** llevan la línea `Co-Authored-By` de Claude (así lo indica ahora Claude Code).
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
| `f15b23b` | Panel del equipo con Supabase, ficha de propiedades, filtro de recámaras, acceso "Iniciar sesión" y capas del bloque Yéucate para Safari |
| `3ab298f` | Documentos privados del panel (dos pasos, aprobación, bitácora), Aviso de Privacidad y guía en PDF |
| `e79d50c` | Las 48 propiedades escritas a mano pasan al panel sin cambiar cómo se ven (`catalogo-inicial.sql`) |
| `8e3e22a` | Correo `inmobiliariademetrius@gmail.com`, horario 24/7 y Google Analytics `G-HENM9J0QYE` |
| `4894760` | Analytics en subpáginas, moneda e idioma, calculadoras, valuación, asesores, comparador, botón de llamada y ajustes legales de la NOM-247 (2026-11-22) |

## 10. Cómo se prueba

- Chrome sin interfaz (CDP) en escritorio, a 1440, 1280 y 1024 px, y en móvil, a 390 y 360 px:
  - capturas de pantalla;
  - 0 errores de consola;
  - 0 violaciones de CSP;
  - sin desbordamiento horizontal.
- Servidor local que aplica `_headers`, para probar la CSP real.
  - **El scratchpad se borra al reiniciarse la sesión** (pasó el 2026-11-14): el servidor de prueba, el Supabase simulado y el visor de WebKit hay que volver a escribirlos cuando hagan falta. El servidor actual es `tools/servidor.py <sitio> <puerto>` (sirve la carpeta con la CSP real, sin `upgrade-insecure-requests`, y cambia el ID de Analytics por `G-PRUEBA1234`).
  - Si el navegador integrado está oculto, las capturas fallan: primero se muestra el panel y después se captura. Tras cambiar el ancho hay que esperar 1–2 s antes de medir (el encabezado anima su margen).
- **Enlace temporal para otra computadora u otra red** (2026-11-11, mientras no hay dominio): túnel rápido de Cloudflare (`cloudflared tunnel --url http://127.0.0.1:<puerto>`, sin cuenta) hacia un servidor de solo lectura que bloquea `supabase/`, `CLAUDE.md`, `_headers`, `netlify.toml` y los archivos con punto, no lista carpetas, pone `noindex` en todo y quita el ID de Analytics. La dirección `https://…trycloudflare.com` cambia cada vez y solo funciona con la Mac prendida y la sesión abierta. No es publicar el sitio.
  - **Desde el 2026-11-19 vive en `~/Herramientas-Demetrius/`** (fuera del sitio, a petición del usuario, para que no se borre al reiniciar la sesión): `servidor-enlace.py`, `cloudflared` 2026.10.4 (sha256 del programa `fdec0f9a…c883a9`, firma Cloudflare Inc. 68WVV388M8, notarizado) e `iniciar-enlace.sh`.
  - Para abrirlo: `bash ~/Herramientas-Demetrius/iniciar-enlace.sh` en segundo plano. El script revisa la firma, arranca el servidor en 127.0.0.1:8797 y el túnel con `caffeinate`; la dirección sale en un renglón con «trycloudflare.com». Al detenerlo se apagan los dos. Ya no hace falta descargar nada.
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
  - Desde el 2026-11-07 el simulador es Node + PGlite (`supabase-simulado.mjs` en el scratchpad): corre los `.sql` reales, así que RLS, funciones y políticas de Storage son las de verdad. Imita auth con verificación en dos pasos (acepta el código `123456`), REST de lectura, RPC y Storage (TUS, enlaces firmados y borrado). Las cuentas de prueba están en ese archivo; no van en el sitio.
  - Página auxiliar `/__prueba/entrar.html?como=admin|asesor&verificar=1&ir=%23vista` (scratchpad) para entrar sin teclear, útil con el visor de WebKit.
- **Motor de Safari en esta Mac:** un visor propio con WKWebView (`tools/visor.swift`, compilado con `swiftc`) abre una URL en una ventana y la captura con `screencapture -l`. Sirve para revisar cómo se ve en Safari de macOS sin tocar el Safari del usuario.
  - Simulador de iOS (2026-11-05): sin el permiso del panel solo se puede abrir enlaces (`simctl openurl`) y tomar capturas.
    - Para entrar al panel se usa una página auxiliar del servidor de prueba (`/__prueba/entrar.html?como=asesor|admin&ir=%23vista`), que vive en el scratchpad y no en el sitio.
    - Cada enlace abre una pestaña nueva y Safari se vuelve lento: hay que esperar de 25 a 60 s por captura, y si se traba, cerrar Safari con `simctl terminate`.
    - El servidor simulado debe responder **fuera** de su candado; si no, una foto que Safari lee lento bloquea las demás peticiones.
- Encabezado: el menú hamburguesa se activa en ≤1309 px (antes 1259; cambió el 2026-11-05 al agregar el ícono de "Iniciar sesión"). Se midió en 11 anchos, de 360 a 1920 px, en las tres páginas: nada se encima ni desborda.

## 11. Decisiones del 2026-11-02

- Edificio Luviano:
  - Se queda la foto recortada del folleto.
  - La nota "*Moneda de los importes y periodicidad de la renta por confirmar" **se queda así** por ahora. (Cambió el 2026-11-14: ahora dice M.N. y renta mensual, ver §5c; falta la confirmación del usuario.)
- Zoi Capital Norte: el usuario **confirmó la autorización** del propietario para publicarla.
- `og-preview.jpg` ya tiene el logo nuevo.

## 12. Pendientes del usuario

Del 2026-11-19 (revisión legal, ver §5d; se le recomendó llevarlo con su abogado y su contador):

- [ ] Registrar ante PROFECO (Registro Público de Contratos de Adhesión) el modelo de contrato con el que comercializan, y pasar el número y el PDF para `js/config.js`.
- [ ] Dar el domicilio de la oficina para `DOMICILIO_OFICINA` (y para el JSON-LD y los `llms`).
- [ ] Decidir si se suaviza «Liderando el mercado inmobiliario de lujo en la ZMG» (`#nosotros`).
- [ ] Ley antilavado (LFPIORPI, reformada el 16-jul-2025): la compraventa de inmuebles es actividad vulnerable; alta en el portal de PLD del SAT, identificación del cliente y avisos. Confirmar umbrales con su contador.
- [ ] Revisar y registrar la marca «Demetrius» en el IMPI (servicios inmobiliarios).
- [ ] Permisos por escrito de los dueños para publicar fotos y precio (también de las 37 vendidas que siguen con foto) y de cada asesor para su foto y WhatsApp.
- [ ] Definir cuánto tiempo se guardan los documentos del panel y cómo se borran si un cliente lo pide (hoy nadie borra un aprobado desde el panel).
- [ ] Verificación en dos pasos en Gmail, WhatsApp Business, Facebook, Instagram, TikTok, GitHub, Supabase y el registrador del dominio.
- [ ] Seguir la iniciativa del Congreso de Jalisco (oct-2026) para el registro obligatorio de agentes inmobiliarios (todavía no es ley).

Del 2026-11-14 (módulos nuevos, ver §5c):

- [x] ~~Dar permiso para subir a GitHub los cambios del 2026-11-08 (Analytics en subpáginas), del 2026-11-14 (módulos nuevos) y del 2026-11-19 (ajustes legales y botón de llamada).~~ El usuario dio permiso («Sí, súbelos») y se subieron el 2026-11-22 (ver el historial de la sección 9).
- [ ] Confirmar que el Edificio Luviano es en pesos (M.N.) y que la renta de $500,000 es mensual.
- [ ] Confirmar los años de experiencia: quedó «10+» en todo el sitio (antes `#nosotros` decía «12+»).
- [ ] Revisar en `js/ajustes.js` las tarifas de escrituración y los precios por m² con datos de su notaría y de su mercado.
- [ ] Pegar en `js/ajustes.js` el enlace del simulador de la hipotecaria (`URL_SIMULADOR_HIPOTECARIA`).
- [ ] Dar los datos de los demás asesores (nombre, WhatsApp, especialidades, foto) y decir si Gerardo atiende en inglés.
- [ ] (Opcional) Llevar el selector de moneda e idioma a `yeucate.html` y `propiedad.html`.

De antes:

- [ ] Comprar el dominio `inmobiliariademetrius.com`: el usuario dijo que lo compra a fin de noviembre de 2026. Recomendado: comprarlo y publicar en **Netlify** (la página ya está preparada para Netlify: `netlify.toml` con redirecciones y bloqueos 404, y `_headers`; en Cloudflare Pages harían falta un `_redirects` y revisar los bloqueos).
- [ ] Ejecutar en Supabase la versión nueva de `supabase/propiedades.sql` y después `supabase/catalogo-inicial.sql` (guía, punto 7.1).
- [x] ~~**Site URL** de Supabase = `https://inmobiliariademetrius.com`~~ (2026-11-08, captura del usuario). - [x] GA4 listo (ver abajo). Nota: el 2026-11-08 el usuario primero mandó un código de **Google Tag Manager** (`GTM-W5LBNN49`): **no se usa**. La página carga GA4 directo (`gtag/js`, solo con consentimiento); `gtm.js` no está permitido en la CSP y GTM permitiría meter scripts desde fuera. Se le pidió el ID de medición de GA4 (analytics.google.com → Administrar → Flujos de datos). **Search Console** espera al dominio (pide verificarlo).
- [ ] Activar el panel del equipo (`supabase/GUIA-PANEL.md`):
  - ~~ejecutar `supabase/propiedades.sql`~~ (hecho el 2026-11-05);
  - ~~apagar "Allow new users to sign up"~~ (el usuario confirmó el 2026-11-08 que quedó apagado);
  - ~~crear su cuenta y hacerla admin~~ (2026-11-05: hay 2 administradores activos, Gerardo Yair Ocaña y Gustavo Álvarez; sus correos no se anotan aquí porque el repositorio es público);
  - dar de alta a los asesores cuando el usuario los tenga.
  El panel se usa hasta que la página esté publicada.
- [ ] Activar **Documentos** (`supabase/GUIA-PANEL.md`, punto 8): ejecutar `supabase/documentos.sql` en el Supabase real y revisar que TOTP esté prendido.
- [ ] (2026-11-08: por ahora NO pasan al plan Pro) Decidir si pasan al **plan Pro** de Supabase ($25 USD/mes) para archivos de 150 MB. Hoy, con el plan gratis, el máximo es 50 MB por archivo y 1 GB en total. Al pagar: punto 8.4 de la guía (sin cambios de código).
- [ ] (Recomendado) Que un abogado revise lo que se agregó al Aviso de Privacidad el 2026-11-07.
- [x] ~~Crear la propiedad de Google Analytics 4 y dar el ID~~: `G-HENM9J0QYE` (2026-11-08), en `js/config.js`. Solo carga si la persona acepta las cookies; GA mostrará «recogida de datos no activada» hasta que la página esté publicada. El servidor de prueba usa `G-PRUEBA1234` para no ensuciar las estadísticas.
- [x] ~~Decidir si Yéucate y la ficha cargan Analytics~~: sí (2026-11-08), con su aviso de cookies.
- [ ] Dar la dirección completa de la oficina. (El horario ya está: 24 horas, los 7 días, 2026-11-08.) Desde el 2026-11-19 va en `DOMICILIO_OFICINA` de `js/config.js` (ver §5d).
- [x] ~~Aclarar el correo~~: el 2026-11-08 el usuario eligió `inmobiliariademetrius@gmail.com` (el de su ficha).
- [x] ~~Confirmar la autorización del desarrollador de Yéucate para publicar su plano, sus datos y las fotos de la obra.~~ El usuario confirmó el 2026-11-08 que ya tiene el permiso.
- [ ] (Opcional) Borrar la reseña "Prueba de conexión" en Supabase. No es urgente: está sin aprobar, así que no aparece en la web.
- [x] ~~(Opcional) Enviar capturas del catálogo de WhatsApp para compararlo con la web.~~ Llegó como carpeta `Catalogo_Demetrius_Inmobiliaria` y se agregaron 31 propiedades (2026-11-04).
- [x] ~~Confirmar si alguna de las 31 propiedades nuevas ya se vendió.~~ El 2026-11-05 el usuario confirmó, con capturas del catálogo de WhatsApp (de Colomos Providencia a Paseos del Sol), que **todas** se vendieron. Se pasaron a vendidas, junto con el terreno de Jocotepec (la ficha "Terreno a la Venta, Ajijic" de 10,413 m² aparece en esas capturas). Terraza Constitución, Bosques/Parques Vallarta y Balanty no venían en las capturas y siguen disponibles.
