# Panel del equipo — Guía paso a paso (Supabase)

Esta guía es para activar el **panel interno** donde tu equipo carga propiedades y tú las validas.
No necesitas saber programar: solo copiar, pegar y dar clic.

Tiempo estimado: 15 minutos. Costo: $0 (plan gratuito de Supabase).

> **Importante:** el panel funciona cuando la página ya esté publicada con su dominio
> (`https://inmobiliariademetrius.com/panel/`). Puedes hacer los pasos 1 a 4 desde hoy;
> así, el día que se publique la página, el panel ya estará listo.

---

## Cómo funciona (en 30 segundos)

1. **Un asesor** entra al panel con su correo y contraseña, carga una propiedad (datos y fotos) y la **envía a validación**.
2. **Tú (administrador)** la revisas: la **apruebas** (se publica en la página al instante) o la **rechazas** con un comentario para que el asesor la corrija.
3. Cuando se vende o se renta, la marcas como **vendida** o **rentada**: sigue en la página con la banda dorada «Vendida» o «Rentada».

Los estados son: **borrador → en validación → publicada** (o **rechazada**), y después **vendida / rentada**.

La seguridad está **en la base de datos**, no solo en los botones:

- El público solo puede leer propiedades publicadas (y las vendidas o rentadas).
- Cada asesor solo puede modificar las suyas, y solo mientras estén en borrador o rechazadas.
- Solo el administrador puede publicar, rechazar, despublicar o marcarlas como vendidas.

---

## 1. Entrar a tu proyecto de Supabase

Vas a usar **el mismo proyecto de las reseñas** (no tienes que crear uno nuevo).

1. Entra a <https://supabase.com> e inicia sesión.
2. Abre tu proyecto (su dirección es `https://tnzewcoqimldxwmvwbxi.supabase.co`).

> ¿Algún día necesitas un proyecto nuevo? Mira el anexo al final de esta guía.

## 2. Crear las tablas, las reglas de seguridad y el espacio para fotos

1. En el menú izquierdo abre **SQL Editor** → **New query**.
2. Abre el archivo `supabase/propiedades.sql` (está en la carpeta de la página), copia **todo** su contenido y pégalo.
3. Da clic en **Run**.
4. Debe aparecer **«Success. No rows returned»**.

Esto crea:

- La tabla **perfiles**: el nombre, el rol (asesor o administrador) y si la cuenta está activa.
- La tabla **propiedades**, con su flujo de estados.
- Las **reglas de seguridad** (Row Level Security).
- El espacio **propiedades** en Storage para las fotos, con un máximo de 5 MB por foto.

> Puedes volver a ejecutar el archivo cuando quieras: no borra nada y no toca las reseñas.

## 3. Desactivar el registro público (muy importante)

Así nadie puede crearse una cuenta por su cuenta. Las cuentas solo las creas tú.

1. Abre **Authentication** → **Sign In / Providers** (en algunas versiones se llama **Providers** o **Settings**).
2. Busca **Allow new users to sign up** y **desactívalo**.
3. Da clic en **Save**.

> Aunque se te olvidara este paso, las cuentas nuevas entran **desactivadas** y no pueden hacer nada hasta que tú las actives. Aun así, desactívalo.

## 4. Crear tu cuenta de administrador

**a) Crea la cuenta**

1. Abre **Authentication** → **Users** → botón **Add user** → **Create new user**.
2. Escribe tu correo y una contraseña segura (mínimo 8 caracteres, con letras y números).
3. Deja marcada la casilla **Auto Confirm User**.
4. Da clic en **Create user**.

**b) Conviértela en administrador**

1. Abre **SQL Editor** → **New query**.
2. Pega esto **cambiando el correo y el nombre**:

   ```sql
   update public.perfiles
   set rol = 'admin', activo = true, nombre = 'Gerardo Ocaña'
   where lower(correo) = lower('tu-correo@ejemplo.com');
   ```

3. Da clic en **Run**. Debe decir **«Success. 1 row affected»**.
   Si dice **0 rows**, revisa que el correo sea idéntico al que usaste en el paso a).

¡Listo! Ya puedes entrar al panel con ese correo y contraseña.

## 5. La dirección (URL) y la llave: ya están puestas

La página necesita dos datos de Supabase y **ya están configurados** en el archivo `js/config.js`:

```js
SUPABASE_URL: "https://tnzewcoqimldxwmvwbxi.supabase.co",
SUPABASE_ANON_KEY: "sb_publishable_…",
```

- **SUPABASE_URL** es la *Project URL*. La encuentras en **Project Settings → Data API**, o en el botón **Connect**.
- **SUPABASE_ANON_KEY** es la *Publishable key* (empieza con `sb_publishable_`). La encuentras en **Project Settings → API Keys**.
  En proyectos antiguos se llama **anon public** y empieza con `eyJ`; también sirve.

Esa llave es **pública por diseño**: lo que protege tus datos son las reglas del paso 2.

> ⚠️ **Nunca** pongas en la página la **Secret key** ni la **service_role**. Esas llaves se saltan todas las reglas de seguridad.

## 6. Dar de alta a un asesor (o a otro administrador)

**Mientras la página no esté publicada**, hazlo todo desde Supabase:

1. Crea su cuenta igual que en el paso 4 a): **Authentication** → **Users** → **Add user** → **Create new user**, con **Auto Confirm User** marcado.
2. Abre **SQL Editor** → **New query** y pega esto, cambiando el nombre y el correo:

   ```sql
   update public.perfiles
   set rol = 'asesor', activo = true, nombre = 'Nombre del asesor'
   where lower(correo) = lower('asesor@ejemplo.com');
   ```

   - Para un **segundo administrador**, cambia `'asesor'` por `'admin'`.
3. Da clic en **Run**. Debe decir **«Success. 1 row affected»**.
4. Para revisar cómo quedó todo el equipo, ejecuta:

   ```sql
   select correo, nombre, rol, activo from public.perfiles order by creado;
   ```

**Cuando la página ya esté publicada**, después del punto 1 puedes hacerlo desde el panel:

1. Entra al panel con tu cuenta de administrador y abre **Equipo**.
2. En el renglón de la persona:
   - escribe su nombre;
   - elige el rol (**Asesor** o **Administrador**);
   - marca **Cuenta activa**;
   - da clic en **Guardar**.

En los dos casos, pásale su correo y su contraseña. Al entrar, puede cambiarla desde el botón **Contraseña**.

**Cuando alguien deje el equipo,** abre **Equipo** y desmarca **Cuenta activa**. Así ya no puede entrar y sus propiedades se conservan. Sin panel, haz lo mismo con este comando:

```sql
update public.perfiles set activo = false where lower(correo) = lower('asesor@ejemplo.com');
```

Evita borrar su usuario en Supabase.

## 7. Uso diario

**Asesor** (en `…/panel/`):

1. Abre **Cargar propiedad** y llena los datos: título, tipo, operación, precio, colonia, medidas, descripción y amenidades.
2. Agrega fotos (hasta 20). La primera es la portada; con las flechas cambias el orden. Las fotos se reducen solas antes de subirse.
3. Si quieres, toca el mapa para marcar la ubicación. Si no la marcas, la propiedad no aparece en el mapa de la página.
4. Da clic en **Guardar borrador** para seguir después, o en **Guardar y enviar a validación**.
5. En **Mis propiedades** ve el estado de cada una. Si el administrador la rechaza, ahí aparece su comentario. El asesor puede corregirla y volver a enviarla.

**Administrador:**

- **Validación**: revisa los datos y las fotos de cada propiedad y elige:
  - **Aprobar y publicar**: se ve en la página de inmediato.
  - **Rechazar**: es obligatorio escribir el comentario para el asesor.
- **Todas**: filtra por estado y elige qué hacer con cada propiedad:
  - **Marcar vendida** o **Marcar rentada**: sigue en la página con la banda dorada.
  - **Volver a publicar**.
  - **Despublicar**: deja de verse y regresa a borrador.
- **Cargar propiedad**: lo que carga el administrador se publica directo con **Guardar y publicar**.

## 8. Problemas comunes

| Mensaje | Qué hacer |
|---|---|
| «Correo o contraseña incorrectos» | Revisa que estén bien escritos (las mayúsculas cuentan). |
| «Tu cuenta todavía no está activada…» | El administrador debe marcar **Cuenta activa** en **Equipo**. |
| «Tu cuenta no tiene perfil en el panel» | Vuelve a ejecutar `supabase/propiedades.sql` (crea los perfiles que falten). |
| «No tienes permiso para hacer este cambio» | La propiedad ya no está en borrador o rechazada, o la cuenta se desactivó. |
| «Agrega al menos una foto…» | Una propiedad sin fotos no se puede enviar ni publicar. |
| «No pudimos abrir … (formato HEIC del iPhone)» | Sube la foto desde el iPhone (ahí se convierte sola) o conviértela a JPG. |
| «No hay conexión con el servidor» | Revisa el internet e inténtalo de nuevo. |

**Un asesor olvidó su contraseña.** Asígnale una temporal:

1. Abre **SQL Editor** y pega esto, cambiando la contraseña y el correo:

   ```sql
   update auth.users
   set encrypted_password = extensions.crypt('Temporal2026', extensions.gen_salt('bf'))
   where email = 'asesor@ejemplo.com';
   ```

2. Da clic en **Run** y pásale la contraseña temporal.
3. Pídele que la cambie al entrar, desde el botón **Contraseña** del panel.

---

## Anexo: crear un proyecto nuevo de Supabase (solo si algún día lo necesitas)

1. En <https://supabase.com> da clic en **New project**.
2. **Project name:** el que quieras.
3. **Database password:** da clic en *Generate a password* y guárdala en un lugar seguro. La página no la necesita.
4. **Region:** *Americas*.
5. **Security:**
   - deja activada **Enable Data API**;
   - desactiva **Automatically expose new tables**;
   - activa **Enable automatic RLS**.
6. Da clic en **Create new project** y espera 1 o 2 minutos.
7. Haz los pasos 2, 3 y 4 de esta guía. Si quieres las reseñas en el proyecto nuevo, ejecuta también `supabase/resenas.sql`.
8. Copia la nueva **Project URL** y la nueva **Publishable key** en `js/config.js` (paso 5). Es el único archivo donde van.
