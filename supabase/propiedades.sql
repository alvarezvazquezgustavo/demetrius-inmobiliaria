-- =========================================================
--  Demetrius Grupo Inmobiliario — Panel del equipo (propiedades)
--  Ejecuta TODO este archivo en:
--  Supabase → SQL Editor → New query → pegar → Run
--
--  Se puede volver a ejecutar sin perder datos: solo crea lo que falta
--  y actualiza las reglas. No toca la tabla de reseñas.
--
--  Qué crea:
--    1) La tabla "perfiles" (nombre, rol y si la cuenta está activa).
--    2) La tabla "propiedades" con su flujo de estados:
--       borrador → en_validacion → publicada (o rechazada, con comentario)
--       y además vendida / rentada (las pone el administrador).
--    3) Las reglas de seguridad (Row Level Security) en la base de datos.
--    4) El espacio "propiedades" de Storage para las fotos.
-- =========================================================


-- ---------------------------------------------------------
-- 1) PERFILES: un renglón por cada cuenta del equipo
-- ---------------------------------------------------------
create table if not exists public.perfiles (
  id      uuid primary key references auth.users (id) on delete cascade,
  correo  text not null default '',
  nombre  text not null default '',
  rol     text not null default 'asesor',
  activo  boolean not null default false,   -- las cuentas nuevas entran DESACTIVADAS; el admin las activa
  creado  timestamptz not null default now(),

  constraint perfiles_rol          check (rol in ('asesor', 'admin')),
  constraint perfiles_nombre_largo check (char_length(nombre) <= 80),
  constraint perfiles_correo_largo check (char_length(correo) <= 254)
);

-- ¿El usuario que hace la petición es administrador activo?
-- (security definer: puede leer "perfiles" sin quedar atrapado en sus propias reglas)
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'admin' and activo
  );
$$;

-- ¿El usuario que hace la petición tiene la cuenta activa?
create or replace function public.usuario_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and activo
  );
$$;

-- Cada cuenta nueva (creada en Authentication → Users) recibe su perfil automáticamente
create or replace function public.crear_perfil_de_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, correo, nombre)
  values (
    new.id,
    left(coalesce(new.email, ''), 254),
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(coalesce(new.email, ''), '@', 1)), 80)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists al_crear_usuario_crear_perfil on auth.users;
create trigger al_crear_usuario_crear_perfil
  after insert on auth.users
  for each row execute function public.crear_perfil_de_usuario();

-- Perfiles para las cuentas que ya existían antes de ejecutar este archivo
insert into public.perfiles (id, correo, nombre)
select u.id, left(coalesce(u.email, ''), 254), left(split_part(coalesce(u.email, ''), '@', 1), 80)
from auth.users u
on conflict (id) do nothing;

-- Protecciones al editar perfiles desde el panel
create or replace function public.perfiles_antes_de_actualizar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.id     := old.id;
  new.correo := old.correo;
  new.creado := old.creado;
  new.nombre := btrim(new.nombre);
  -- Evita que el administrador se quede fuera por accidente
  if old.id = (select auth.uid()) and (new.rol <> 'admin' or not new.activo) then
    raise exception 'No puedes quitarte el rol de administrador ni desactivar tu propia cuenta.';
  end if;
  return new;
end;
$$;

drop trigger if exists perfiles_antes_de_actualizar on public.perfiles;
create trigger perfiles_antes_de_actualizar
  before update on public.perfiles
  for each row execute function public.perfiles_antes_de_actualizar();


-- ---------------------------------------------------------
-- 2) PROPIEDADES
-- ---------------------------------------------------------

-- Lista de textos válida (amenidades): sin vacíos, con largo y cantidad máximos
create or replace function public.lista_texto_valida(lista text[], max_largo int, max_elementos int)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(cardinality(lista), 0) <= max_elementos
     and not exists (
       select 1 from unnest(lista) as t(valor)
       where valor is null or char_length(btrim(valor)) not between 1 and max_largo
     );
$$;

-- Rutas de fotos válidas: "<id de la propiedad>/<nombre>.jpg" (máximo 20)
create or replace function public.fotos_validas(fotos text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(cardinality(fotos), 0) <= 20
     and not exists (
       select 1 from unnest(fotos) as t(ruta)
       where ruta is null
          or ruta !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9_-]{1,64}\.(jpg|jpeg|png|webp)$'
     );
$$;

create table if not exists public.propiedades (
  id                uuid primary key default gen_random_uuid(),
  asesor_id         uuid default auth.uid() references public.perfiles (id) on delete set null,
  estado            text not null default 'borrador',
  comentario_admin  text,

  titulo            text not null,
  tipo              text not null,
  operacion         text not null,
  precio_venta      numeric(14, 2),
  precio_renta      numeric(14, 2),          -- renta mensual
  municipio         text not null,
  colonia           text not null,
  etiqueta          text,                    -- p. ej. "Coto con amenidades" (la cinta dorada de la tarjeta)
  terreno_m2        numeric(12, 2),
  construccion_m2   numeric(12, 2),
  recamaras         smallint,
  banos             numeric(4, 1),
  estacionamientos  smallint,
  descripcion       text,
  amenidades        text[] not null default '{}',
  coto              boolean not null default false,
  preventa          boolean not null default false,
  lat               double precision,
  lng               double precision,
  fotos             text[] not null default '{}',   -- la primera es la portada

  creada            timestamptz not null default now(),
  actualizada       timestamptz not null default now(),
  enviada           timestamptz,             -- última vez que se envió a validación
  revisada          timestamptz,             -- última vez que el admin cambió el estado
  revisada_por      uuid,
  publicada_en      timestamptz,

  constraint propiedades_estado        check (estado in ('borrador', 'en_validacion', 'publicada', 'rechazada', 'vendida', 'rentada')),
  constraint propiedades_tipo          check (tipo in ('casa', 'departamento', 'terreno', 'bodega', 'local', 'oficina', 'terraza', 'edificio')),
  constraint propiedades_operacion     check (operacion in ('venta', 'renta', 'venta renta')),
  constraint propiedades_municipio     check (municipio in ('guadalajara', 'zapopan', 'tlaquepaque', 'tonala', 'elsalto', 'juanacatlan',
                                                          'tlajomulco', 'chapala', 'jocotepec', 'mazamitla', 'tapalpa', 'vallarta')),
  constraint propiedades_titulo_largo  check (char_length(btrim(titulo)) between 5 and 120),
  constraint propiedades_colonia_largo check (char_length(btrim(colonia)) between 2 and 80),
  constraint propiedades_etiqueta_largo check (etiqueta is null or char_length(etiqueta) <= 40),
  constraint propiedades_descripcion_largo check (descripcion is null or char_length(descripcion) <= 4000),
  constraint propiedades_comentario_largo  check (comentario_admin is null or char_length(comentario_admin) <= 1000),
  constraint propiedades_precio_venta  check (precio_venta is null or precio_venta between 1 and 999999999999),
  constraint propiedades_precio_renta  check (precio_renta is null or precio_renta between 1 and 999999999999),
  constraint propiedades_precio_segun_operacion check (
    (operacion not like '%venta%' or precio_venta is not null) and
    (operacion not like '%renta%' or precio_renta is not null)
  ),
  constraint propiedades_medidas       check (
    (terreno_m2 is null or terreno_m2 between 1 and 99999999) and
    (construccion_m2 is null or construccion_m2 between 1 and 99999999)
  ),
  constraint propiedades_conteos       check (
    (recamaras is null or recamaras between 0 and 50) and
    (estacionamientos is null or estacionamientos between 0 and 200) and
    (banos is null or (banos between 0 and 50 and banos * 2 = trunc(banos * 2)))
  ),
  constraint propiedades_ubicacion     check (
    (lat is null and lng is null) or
    (lat between 14 and 33 and lng between -119 and -86)   -- dentro de México
  ),
  constraint propiedades_amenidades_validas check (public.lista_texto_valida(amenidades, 60, 30)),
  constraint propiedades_fotos_validas      check (public.fotos_validas(fotos))
);

create index if not exists propiedades_publicas_idx on public.propiedades (publicada_en desc)
  where estado in ('publicada', 'vendida', 'rentada');
create index if not exists propiedades_asesor_idx on public.propiedades (asesor_id, actualizada desc);
create index if not exists propiedades_estado_idx on public.propiedades (estado, enviada);

-- Reglas automáticas al guardar (también protegen lo que RLS no puede comparar: antes vs. después)
create or replace function public.propiedades_antes_de_guardar()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  -- Admin del panel, o tú mismo desde el panel de Supabase (Table Editor / SQL Editor)
  privilegiado boolean := public.es_admin() or current_user not in ('anon', 'authenticated');
begin
  new.titulo      := btrim(new.titulo);
  new.colonia     := btrim(new.colonia);
  new.etiqueta    := nullif(btrim(new.etiqueta), '');
  new.descripcion := nullif(btrim(new.descripcion), '');
  new.amenidades  := coalesce((select array_agg(btrim(a) order by n) from unnest(new.amenidades) with ordinality as t(a, n)
                               where btrim(a) <> ''), '{}');
  new.actualizada := now();

  -- Cada foto debe estar en la carpeta de ESTA propiedad
  if exists (select 1 from unnest(new.fotos) as t(ruta) where split_part(ruta, '/', 1) <> new.id::text) then
    raise exception 'Hay fotos que no pertenecen a esta propiedad.';
  end if;

  if tg_op = 'INSERT' then
    new.creada := now();
    if not privilegiado then
      new.asesor_id        := (select auth.uid());
      new.estado           := 'borrador';
      new.comentario_admin := null;
    end if;
    new.enviada      := null;
    new.revisada     := null;
    new.revisada_por := null;
    new.publicada_en := null;
  else
    new.id     := old.id;
    new.creada := old.creada;
    if not privilegiado then
      -- El asesor no puede tocar los datos de la revisión
      new.asesor_id        := old.asesor_id;
      new.comentario_admin := old.comentario_admin;
      new.revisada         := old.revisada;
      new.revisada_por     := old.revisada_por;
      new.publicada_en     := old.publicada_en;
      new.enviada          := old.enviada;
      if new.estado = 'rechazada' and old.estado <> 'rechazada' then
        raise exception 'Solo el administrador puede rechazar una propiedad.';
      end if;
    elsif new.estado is distinct from old.estado then
      new.revisada     := now();
      new.revisada_por := (select auth.uid());
    end if;
  end if;

  if new.estado = 'en_validacion' and (tg_op = 'INSERT' or old.estado is distinct from 'en_validacion') then
    new.enviada := now();
  end if;

  if new.estado in ('en_validacion', 'publicada') and cardinality(new.fotos) = 0 then
    raise exception 'Agrega al menos una foto antes de enviar o publicar la propiedad.';
  end if;

  if new.estado = 'rechazada' and coalesce(btrim(new.comentario_admin), '') = '' then
    raise exception 'Escribe un comentario para el asesor al rechazar la propiedad.';
  end if;

  if new.estado = 'publicada' and new.publicada_en is null then
    new.publicada_en := now();
  end if;

  return new;
end;
$$;

drop trigger if exists propiedades_antes_de_guardar on public.propiedades;
create trigger propiedades_antes_de_guardar
  before insert or update on public.propiedades
  for each row execute function public.propiedades_antes_de_guardar();


-- ---------------------------------------------------------
-- 3) SEGURIDAD (Row Level Security)
-- ---------------------------------------------------------
alter table public.perfiles    enable row level security;
alter table public.propiedades enable row level security;

-- PERFILES ------------------------------------------------
drop policy if exists "Equipo: ver mi perfil o todos si soy admin" on public.perfiles;
create policy "Equipo: ver mi perfil o todos si soy admin"
  on public.perfiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.es_admin()));

drop policy if exists "Admin: activar cuentas y asignar rol" on public.perfiles;
create policy "Admin: activar cuentas y asignar rol"
  on public.perfiles for update
  to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

-- PROPIEDADES ---------------------------------------------
-- El público (sin sesión) solo ve las publicadas (y las vendidas/rentadas, que se muestran con la banda)
drop policy if exists "Público: ver propiedades publicadas" on public.propiedades;
create policy "Público: ver propiedades publicadas"
  on public.propiedades for select
  to anon, authenticated
  using (estado in ('publicada', 'vendida', 'rentada'));

-- El asesor ve las suyas; el admin ve todas
drop policy if exists "Equipo: ver mis propiedades o todas si soy admin" on public.propiedades;
create policy "Equipo: ver mis propiedades o todas si soy admin"
  on public.propiedades for select
  to authenticated
  using (asesor_id = (select auth.uid()) or (select public.es_admin()));

-- Cualquier cuenta ACTIVA del equipo crea propiedades a su nombre, siempre como borrador
drop policy if exists "Equipo: crear propiedades propias" on public.propiedades;
create policy "Equipo: crear propiedades propias"
  on public.propiedades for insert
  to authenticated
  with check (
    asesor_id = (select auth.uid())
    and estado = 'borrador'
    and (select public.usuario_activo())
  );

-- El asesor edita las suyas SOLO en borrador o rechazada, y solo puede dejarlas así o enviarlas a validación
-- (que una propiedad pase a "rechazada" solo lo decide el admin: lo cuida el trigger)
drop policy if exists "Asesor: editar mis borradores o rechazadas" on public.propiedades;
create policy "Asesor: editar mis borradores o rechazadas"
  on public.propiedades for update
  to authenticated
  using (
    asesor_id = (select auth.uid())
    and estado in ('borrador', 'rechazada')
    and (select public.usuario_activo())
  )
  with check (
    asesor_id = (select auth.uid())
    and estado in ('borrador', 'rechazada', 'en_validacion')
  );

-- Solo el admin aprueba (publicada), rechaza, despublica o marca como vendida/rentada
drop policy if exists "Admin: revisar y cambiar el estado de cualquier propiedad" on public.propiedades;
create policy "Admin: revisar y cambiar el estado de cualquier propiedad"
  on public.propiedades for update
  to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

-- El asesor puede borrar sus borradores (nada más se borra)
drop policy if exists "Asesor: borrar mis borradores" on public.propiedades;
create policy "Asesor: borrar mis borradores"
  on public.propiedades for delete
  to authenticated
  using (
    asesor_id = (select auth.uid())
    and estado = 'borrador'
    and (select public.usuario_activo())
  );

-- Permisos explícitos (funciona aunque esté apagado "Automatically expose new tables")
grant usage on schema public to anon, authenticated;

revoke all on public.perfiles from anon, authenticated;
grant select on public.perfiles to authenticated;
grant update (nombre, rol, activo) on public.perfiles to authenticated;

revoke all on public.propiedades from anon, authenticated;
-- El público solo puede leer estas columnas (nunca el asesor ni los comentarios internos)
grant select (id, estado, titulo, tipo, operacion, precio_venta, precio_renta, municipio, colonia, etiqueta,
              terreno_m2, construccion_m2, recamaras, banos, estacionamientos, descripcion, amenidades,
              coto, preventa, lat, lng, fotos, publicada_en)
  on public.propiedades to anon;
grant select, delete on public.propiedades to authenticated;
grant insert (titulo, tipo, operacion, precio_venta, precio_renta, municipio, colonia, etiqueta,
              terreno_m2, construccion_m2, recamaras, banos, estacionamientos, descripcion, amenidades,
              coto, preventa, lat, lng, fotos)
  on public.propiedades to authenticated;
grant update (estado, comentario_admin, titulo, tipo, operacion, precio_venta, precio_renta, municipio, colonia,
              etiqueta, terreno_m2, construccion_m2, recamaras, banos, estacionamientos, descripcion, amenidades,
              coto, preventa, lat, lng, fotos)
  on public.propiedades to authenticated;


-- ---------------------------------------------------------
-- 4) FOTOS (Storage)
-- ---------------------------------------------------------
-- Espacio público de lectura (las fotos se ven en la página), máximo 5 MB por foto
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('propiedades', 'propiedades', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ¿Puede el usuario subir o quitar fotos en la carpeta de esta propiedad?
-- Asesor: solo en sus propiedades en borrador o rechazadas. Admin: en cualquiera.
create or replace function public.puede_editar_fotos(carpeta text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.es_admin() or exists (
    select 1 from public.propiedades p
    where p.id::text = carpeta
      and p.asesor_id = (select auth.uid())
      and p.estado in ('borrador', 'rechazada')
      and public.usuario_activo()
  );
$$;

drop policy if exists "Fotos de propiedades: subir" on storage.objects;
create policy "Fotos de propiedades: subir"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'propiedades' and public.puede_editar_fotos((storage.foldername(name))[1]));

drop policy if exists "Fotos de propiedades: ver desde el panel" on storage.objects;
create policy "Fotos de propiedades: ver desde el panel"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'propiedades' and public.puede_editar_fotos((storage.foldername(name))[1]));

drop policy if exists "Fotos de propiedades: reemplazar" on storage.objects;
create policy "Fotos de propiedades: reemplazar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'propiedades' and public.puede_editar_fotos((storage.foldername(name))[1]))
  with check (bucket_id = 'propiedades' and public.puede_editar_fotos((storage.foldername(name))[1]));

drop policy if exists "Fotos de propiedades: quitar" on storage.objects;
create policy "Fotos de propiedades: quitar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'propiedades' and public.puede_editar_fotos((storage.foldername(name))[1]));
