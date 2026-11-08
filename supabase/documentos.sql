-- =========================================================
--  Demetrius Grupo Inmobiliario — Documentos del equipo (archivos privados)
--  Ejecuta TODO este archivo en:
--  Supabase → SQL Editor → New query → pegar → Run
--
--  Requisito: haber ejecutado antes supabase/propiedades.sql
--  (usa sus tablas "perfiles" y "propiedades" y sus funciones es_admin() y usuario_activo()).
--
--  Se puede volver a ejecutar sin perder datos: solo crea lo que falta
--  y actualiza las reglas. No toca las propiedades ni las reseñas.
--
--  Qué crea:
--    1) La configuración: tamaño máximo por archivo y espacio del plan.
--    2) La tabla "documentos" con su flujo:
--       subiendo → en_revision → aprobado (o rechazado, con comentario) → archivado
--    3) La bitácora: quién entró, subió, abrió, descargó, aprobó, rechazó, archivó o borró.
--       Solo la ven los administradores.
--    4) Las funciones que usa el panel. Nadie lee ni escribe las tablas directamente.
--    5) El espacio PRIVADO "documentos" en Storage y sus reglas.
--
--  Seguridad:
--    - Todo exige una cuenta ACTIVA del equipo y la verificación en dos pasos (aal2).
--      Con solo la contraseña, la base de datos niega los documentos.
--    - Un archivo solo se puede abrir justo después de quedar anotado en la bitácora
--      (el enlace se crea en el momento y caduca en 60 segundos).
--    - Nadie borra un documento aprobado desde el panel: el administrador solo lo archiva.
-- =========================================================


-- ---------------------------------------------------------
-- 1) CONFIGURACIÓN (un solo renglón)
-- ---------------------------------------------------------
--   max_mb      tamaño máximo por archivo. Plan gratis de Supabase: 50 como máximo.
--   espacio_gb  espacio total del plan (fotos + documentos). Plan gratis: 1. Plan Pro: 100.
--
--   Para pasar al plan Pro (ver supabase/GUIA-PANEL.md):
--     update public.documentos_config set max_mb = 300, espacio_gb = 100;
create table if not exists public.documentos_config (
  id          boolean primary key default true,
  max_mb      integer not null default 50,
  espacio_gb  numeric(8, 2) not null default 1,

  constraint documentos_config_unico   check (id),
  constraint documentos_config_max_mb  check (max_mb between 1 and 5000),
  constraint documentos_config_espacio check (espacio_gb > 0 and espacio_gb <= 100000)
);
insert into public.documentos_config (id) values (true) on conflict (id) do nothing;


-- ---------------------------------------------------------
-- 2) DOCUMENTOS
-- ---------------------------------------------------------
create table if not exists public.documentos (
  id               uuid primary key default gen_random_uuid(),
  titulo           text not null,
  descripcion      text,
  propiedad_id     uuid references public.propiedades (id) on delete set null,
  expediente       text not null,              -- nombre de la propiedad o expediente (se conserva aunque la propiedad se borre)
  archivo          text not null unique,       -- ruta en Storage: <id>/<uuid>.<pdf|jpg|png>
  nombre_original  text not null,
  tipo_mime        text not null,
  tamano           bigint,                     -- bytes; lo pone la base de datos al confirmar la subida
  estado           text not null default 'subiendo',
  comentario_admin text,
  subido_por       uuid references public.perfiles (id) on delete set null,
  creado           timestamptz not null default now(),
  enviado          timestamptz,                -- cuando terminó de subirse
  revisado         timestamptz,
  revisado_por     uuid references public.perfiles (id) on delete set null,
  borrando_por     uuid,                       -- permiso temporal para quitar el archivo (10 minutos)
  borrando_desde   timestamptz,

  constraint documentos_estado        check (estado in ('subiendo', 'en_revision', 'aprobado', 'rechazado', 'archivado')),
  constraint documentos_tipo          check (tipo_mime in ('application/pdf', 'image/jpeg', 'image/png')),
  constraint documentos_titulo_largo  check (char_length(btrim(titulo)) between 3 and 150),
  constraint documentos_descripcion_largo check (descripcion is null or char_length(descripcion) <= 1000),
  constraint documentos_expediente_largo  check (char_length(btrim(expediente)) between 2 and 120),
  constraint documentos_nombre_largo  check (char_length(nombre_original) between 1 and 200),
  constraint documentos_comentario_largo check (comentario_admin is null or char_length(comentario_admin) <= 1000),
  constraint documentos_tamano        check (tamano is null or tamano > 0),
  constraint documentos_archivo_ruta  check (
    archivo ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|jpg|png)$'
    and split_part(archivo, '/', 1) = id::text
  ),
  constraint documentos_rechazo_con_comentario check (estado <> 'rechazado' or char_length(btrim(coalesce(comentario_admin, ''))) >= 5)
);

create index if not exists documentos_estado_idx on public.documentos (estado, enviado desc);
create index if not exists documentos_subido_por_idx on public.documentos (subido_por, creado desc);
create index if not exists documentos_propiedad_idx on public.documentos (propiedad_id);


-- ---------------------------------------------------------
-- 3) BITÁCORA (solo la leen los administradores; nadie la edita ni la borra desde el panel)
-- ---------------------------------------------------------
create table if not exists public.documentos_bitacora (
  id            bigint generated always as identity primary key,
  fecha         timestamptz not null default now(),
  usuario_id    uuid,              -- sin llave foránea: el registro se conserva siempre
  usuario       text not null,     -- nombre (o correo) en ese momento
  accion        text not null,
  documento_id  uuid,              -- sin llave foránea: se conserva aunque el documento se borre
  documento     text,              -- título en ese momento
  detalle       text,
  ip            text,
  navegador     text,

  constraint documentos_bitacora_accion check (accion in
    ('entrada', 'abrir', 'descargar', 'subir', 'aprobar', 'rechazar', 'archivar', 'desarchivar', 'borrar'))
);

create index if not exists documentos_bitacora_fecha_idx on public.documentos_bitacora (fecha desc);
create index if not exists documentos_bitacora_usuario_idx on public.documentos_bitacora (usuario_id, accion, fecha desc);
create index if not exists documentos_bitacora_documento_idx on public.documentos_bitacora (documento_id, usuario_id, fecha desc);


-- ---------------------------------------------------------
-- 4) FUNCIONES
-- ---------------------------------------------------------

-- ¿Cuenta activa del equipo Y verificación en dos pasos en esta sesión?
create or replace function public.documentos_acceso()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.usuario_activo()
     and coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2';
$$;

-- ¿Puedo ver un documento con este estado?
--   Admin: todos. Equipo: los aprobados, y los míos mientras se suben, se revisan o si me los rechazaron.
create or replace function public.documento_visible(p_estado text, p_subido_por uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.documentos_acceso() and (
    public.es_admin()
    or p_estado = 'aprobado'
    or (p_subido_por = (select auth.uid()) and p_estado in ('subiendo', 'en_revision', 'rechazado'))
  );
$$;

-- ¿Puedo borrar un documento con este estado?
--   Quien lo subió: mientras se sube, está en revisión o si se lo rechazaron.
--   Admin: los rechazados y las subidas que no se terminaron. Un aprobado no se borra: se archiva.
create or replace function public.documento_borrable(p_estado text, p_subido_por uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.documentos_acceso() and (
    (p_subido_por = (select auth.uid()) and p_estado in ('subiendo', 'en_revision', 'rechazado'))
    or (public.es_admin() and p_estado in ('subiendo', 'rechazado'))
  );
$$;

-- Anota un movimiento en la bitácora (uso interno: no se puede llamar desde el panel)
create or replace function public.documentos_anotar(p_accion text, p_documento uuid, p_titulo text, p_detalle text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  cabeceras jsonb;
begin
  begin
    cabeceras := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    cabeceras := null;
  end;
  insert into public.documentos_bitacora (usuario_id, usuario, accion, documento_id, documento, detalle, ip, navegador)
  select (select auth.uid()),
         left(coalesce(nullif(btrim(p.nombre), ''), nullif(p.correo, ''), 'Cuenta desconocida'), 120),
         p_accion,
         p_documento,
         left(p_titulo, 150),
         left(p_detalle, 300),
         left(coalesce(cabeceras ->> 'cf-connecting-ip', cabeceras ->> 'x-real-ip',
                       btrim(split_part(cabeceras ->> 'x-forwarded-for', ',', 1))), 60),
         left(cabeceras ->> 'user-agent', 300)
  from (select 1) as uno
  left join public.perfiles p on p.id = (select auth.uid());
end;
$$;

-- Espacio usado por TODOS los archivos del proyecto (fotos + documentos), en bytes
create or replace function public.documentos_espacio_usado()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum((o.metadata ->> 'size')::bigint), 0)::bigint from storage.objects o;
$$;

create or replace function public.documentos_exigir_acceso()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.documentos_acceso() then
    raise exception 'Para ver los documentos necesitas una cuenta activa y la verificación en dos pasos.'
      using errcode = '42501';
  end if;
end;
$$;

-- Lista de documentos + espacio (y anota la entrada en la bitácora, máximo una vez cada 10 minutos)
create or replace function public.documentos_listar()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  yo        uuid := (select auth.uid());
  admin     boolean := public.es_admin();
  config    public.documentos_config;
  lista     jsonb;
begin
  perform public.documentos_exigir_acceso();

  if not exists (
    select 1 from public.documentos_bitacora
    where usuario_id = yo and accion = 'entrada' and fecha > now() - interval '10 minutes'
  ) then
    perform public.documentos_anotar('entrada', null, null, null);
  end if;

  select * into config from public.documentos_config limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', d.id,
           'titulo', d.titulo,
           'descripcion', d.descripcion,
           'propiedad_id', d.propiedad_id,
           'propiedad_publica', coalesce(p.estado in ('publicada', 'vendida', 'rentada'), false),
           'expediente', d.expediente,
           'nombre_original', d.nombre_original,
           'tipo_mime', d.tipo_mime,
           'tamano', d.tamano,
           'estado', d.estado,
           'comentario_admin', case when admin or d.subido_por = yo then d.comentario_admin end,
           'subido_por_nombre', coalesce(nullif(btrim(s.nombre), ''), s.correo, 'Cuenta eliminada'),
           'es_mio', d.subido_por = yo,
           'borrable', public.documento_borrable(d.estado, d.subido_por),
           'creado', d.creado,
           'enviado', d.enviado,
           'revisado', d.revisado,
           'revisado_por_nombre', coalesce(nullif(btrim(r.nombre), ''), r.correo)
         ) order by coalesce(d.enviado, d.creado) desc), '[]'::jsonb)
    into lista
  from public.documentos d
  left join public.propiedades p on p.id = d.propiedad_id
  left join public.perfiles s on s.id = d.subido_por
  left join public.perfiles r on r.id = d.revisado_por
  where admin
     or d.estado = 'aprobado'
     or (d.subido_por = yo and d.estado in ('subiendo', 'en_revision', 'rechazado'));

  return jsonb_build_object(
    'es_admin', admin,
    'max_mb', config.max_mb,
    'espacio_gb', config.espacio_gb,
    'usado_bytes', public.documentos_espacio_usado(),
    'documentos', lista
  );
end;
$$;

-- Contador del menú para el administrador (no revela nada más que un número)
create or replace function public.documentos_pendientes()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.es_admin()
    then (select count(*)::integer from public.documentos where estado = 'en_revision')
    else 0 end;
$$;

-- Paso 1 de la subida: registra el documento y devuelve la ruta donde debe subirse el archivo
create or replace function public.documento_crear(
  p_titulo text, p_descripcion text, p_propiedad uuid, p_expediente text,
  p_nombre text, p_tipo text, p_tamano bigint)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  yo         uuid := (select auth.uid());
  config     public.documentos_config;
  extension  text;
  v_titulo     text := btrim(coalesce(p_titulo, ''));
  v_expediente text := nullif(btrim(coalesce(p_expediente, '')), '');
  v_nombre     text := btrim(coalesce(p_nombre, ''));
  prop       record;
  nuevo_id   uuid := gen_random_uuid();
  ruta       text;
begin
  perform public.documentos_exigir_acceso();
  select * into config from public.documentos_config limit 1;

  extension := case p_tipo when 'application/pdf' then 'pdf' when 'image/jpeg' then 'jpg' when 'image/png' then 'png' end;
  if extension is null then
    raise exception 'Solo se aceptan archivos PDF, JPG o PNG.';
  end if;
  if char_length(v_titulo) not between 3 and 150 then
    raise exception 'El título debe tener entre 3 y 150 caracteres.';
  end if;
  if char_length(coalesce(p_descripcion, '')) > 1000 then
    raise exception 'La nota puede tener máximo 1,000 caracteres.';
  end if;
  if char_length(v_nombre) = 0 then
    v_nombre := 'documento.' || extension;
  end if;
  if p_tamano is null or p_tamano < 1 then
    raise exception 'El archivo está vacío.';
  end if;
  if p_tamano > config.max_mb::bigint * 1048576 then
    raise exception 'El archivo pesa más de % MB, que es el máximo permitido.', config.max_mb;
  end if;

  if p_propiedad is not null then
    select pr.id, pr.titulo, pr.estado, pr.asesor_id into prop from public.propiedades pr where pr.id = p_propiedad;
    if not found or not (public.es_admin() or prop.asesor_id = yo or prop.estado in ('publicada', 'vendida', 'rentada')) then
      raise exception 'No encontramos esa propiedad. Elige otra o escribe el nombre del expediente.';
    end if;
    v_expediente := coalesce(v_expediente, prop.titulo);
  end if;
  if v_expediente is null or char_length(v_expediente) < 2 then
    raise exception 'Elige una propiedad o escribe el nombre del expediente.';
  end if;

  if public.documentos_espacio_usado() + p_tamano > (config.espacio_gb * 1073741824)::bigint then
    raise exception 'Ya no hay espacio suficiente para este archivo. Avísale al administrador.';
  end if;
  if (select count(*) from public.documentos where subido_por = yo and creado > now() - interval '1 hour') >= 40 then
    raise exception 'Subiste muchos documentos en poco tiempo. Espera un rato e inténtalo de nuevo.';
  end if;

  ruta := nuevo_id::text || '/' || gen_random_uuid()::text || '.' || extension;
  insert into public.documentos (id, titulo, descripcion, propiedad_id, expediente, archivo, nombre_original, tipo_mime, estado, subido_por)
  values (nuevo_id, v_titulo, nullif(btrim(coalesce(p_descripcion, '')), ''), p_propiedad, left(v_expediente, 120),
          ruta, left(v_nombre, 200), p_tipo, 'subiendo', yo);

  return jsonb_build_object('id', nuevo_id, 'archivo', ruta);
end;
$$;

-- Paso 2 de la subida: confirma que el archivo llegó completo y lo manda a revisión
-- (lo que sube un administrador queda aprobado de una vez)
create or replace function public.documento_confirmar(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  yo      uuid := (select auth.uid());
  admin   boolean := public.es_admin();
  doc     public.documentos;
  config  public.documentos_config;
  v_tamano bigint;
  v_tipo   text;
  nuevo    text;
begin
  perform public.documentos_exigir_acceso();
  select * into config from public.documentos_config limit 1;
  select * into doc from public.documentos where id = p_id for update;
  if not found or doc.subido_por is distinct from yo or doc.estado <> 'subiendo' then
    raise exception 'Este documento ya no se puede confirmar. Recarga la página.';
  end if;

  select (o.metadata ->> 'size')::bigint, o.metadata ->> 'mimetype' into v_tamano, v_tipo
  from storage.objects o
  where o.bucket_id = 'documentos' and o.name = doc.archivo;
  if not found then
    raise exception 'El archivo no terminó de subirse. Inténtalo de nuevo.';
  end if;
  if v_tipo is not null and v_tipo <> doc.tipo_mime then
    raise exception 'El archivo que llegó no coincide con el que elegiste. Bórralo e inténtalo de nuevo.';
  end if;
  if v_tamano is not null and v_tamano > config.max_mb::bigint * 1048576 then
    raise exception 'El archivo pesa más de % MB, que es el máximo permitido.', config.max_mb;
  end if;

  nuevo := case when admin then 'aprobado' else 'en_revision' end;
  update public.documentos
     set tamano = v_tamano,
         estado = nuevo,
         enviado = now(),
         revisado = case when admin then now() end,
         revisado_por = case when admin then yo end
   where id = p_id;

  perform public.documentos_anotar('subir', doc.id, doc.titulo,
    doc.nombre_original || coalesce(' · ' || pg_size_pretty(v_tamano), '') ||
    case when admin then ' · aprobado al subirlo' else '' end);

  return jsonb_build_object('id', doc.id, 'estado', nuevo);
end;
$$;

-- Administrador: aprobar o rechazar (con comentario) un documento en revisión
create or replace function public.documento_revisar(p_id uuid, p_aprobar boolean, p_comentario text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  doc        public.documentos;
  comentario text := nullif(btrim(coalesce(p_comentario, '')), '');
begin
  perform public.documentos_exigir_acceso();
  if not public.es_admin() then
    raise exception 'Solo un administrador puede aprobar o rechazar documentos.' using errcode = '42501';
  end if;
  select * into doc from public.documentos where id = p_id for update;
  if not found or doc.estado <> 'en_revision' then
    raise exception 'Este documento ya no está en revisión. Recarga la página.';
  end if;

  if p_aprobar then
    update public.documentos
       set estado = 'aprobado', comentario_admin = null, revisado = now(), revisado_por = (select auth.uid())
     where id = p_id;
    perform public.documentos_anotar('aprobar', doc.id, doc.titulo, null);
    return jsonb_build_object('id', doc.id, 'estado', 'aprobado');
  end if;

  if comentario is null or char_length(comentario) < 5 then
    raise exception 'Escribe un comentario de al menos 5 caracteres para que el asesor sepa qué corregir.';
  end if;
  update public.documentos
     set estado = 'rechazado', comentario_admin = left(comentario, 1000), revisado = now(), revisado_por = (select auth.uid())
   where id = p_id;
  perform public.documentos_anotar('rechazar', doc.id, doc.titulo, left(comentario, 300));
  return jsonb_build_object('id', doc.id, 'estado', 'rechazado');
end;
$$;

-- Administrador: archivar (ocultar al equipo) o volver a mostrar un documento aprobado
create or replace function public.documento_archivar(p_id uuid, p_archivar boolean)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  doc      public.documentos;
  esperado text := case when p_archivar then 'aprobado' else 'archivado' end;
begin
  perform public.documentos_exigir_acceso();
  if not public.es_admin() then
    raise exception 'Solo un administrador puede archivar documentos.' using errcode = '42501';
  end if;
  select * into doc from public.documentos where id = p_id for update;
  if not found or doc.estado <> esperado then
    raise exception 'Este documento cambió de estado. Recarga la página.';
  end if;
  update public.documentos
     set estado = case when p_archivar then 'archivado' else 'aprobado' end,
         revisado = now(), revisado_por = (select auth.uid())
   where id = p_id;
  perform public.documentos_anotar(case when p_archivar then 'archivar' else 'desarchivar' end, doc.id, doc.titulo, null);
  return jsonb_build_object('id', doc.id, 'estado', case when p_archivar then 'archivado' else 'aprobado' end);
end;
$$;

-- Abrir o descargar: queda anotado y da permiso para crear el enlace (válido 2 minutos)
create or replace function public.documento_abrir(p_id uuid, p_descargar boolean)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  doc public.documentos;
begin
  perform public.documentos_exigir_acceso();
  select * into doc from public.documentos where id = p_id;
  if not found or doc.estado = 'subiendo' or not public.documento_visible(doc.estado, doc.subido_por) then
    raise exception 'No encontramos ese documento o ya no tienes acceso a él.';
  end if;
  perform public.documentos_anotar(case when p_descargar then 'descargar' else 'abrir' end, doc.id, doc.titulo, doc.nombre_original);
  return jsonb_build_object('archivo', doc.archivo, 'nombre', doc.nombre_original, 'tipo', doc.tipo_mime);
end;
$$;

-- Borrar, paso 1: da permiso (10 minutos) para quitar el archivo de Storage
create or replace function public.documento_borrar_preparar(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  doc public.documentos;
begin
  perform public.documentos_exigir_acceso();
  select * into doc from public.documentos where id = p_id for update;
  if not found or not public.documento_borrable(doc.estado, doc.subido_por) then
    raise exception 'Este documento no se puede borrar. Los documentos aprobados solo se pueden archivar.';
  end if;
  update public.documentos set borrando_por = (select auth.uid()), borrando_desde = now() where id = p_id;
  return jsonb_build_object('archivo', doc.archivo);
end;
$$;

-- Borrar, paso 2: con el archivo ya quitado, borra el registro (y lo anota)
create or replace function public.documento_borrar(p_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  doc public.documentos;
begin
  perform public.documentos_exigir_acceso();
  select * into doc from public.documentos where id = p_id for update;
  if not found or not public.documento_borrable(doc.estado, doc.subido_por)
     or doc.borrando_por is distinct from (select auth.uid())
     or doc.borrando_desde < now() - interval '10 minutes' then
    raise exception 'Este documento no se puede borrar. Recarga la página e inténtalo de nuevo.';
  end if;
  if exists (select 1 from storage.objects o where o.bucket_id = 'documentos' and o.name = doc.archivo) then
    raise exception 'El archivo todavía no se quita. Inténtalo de nuevo.';
  end if;
  delete from public.documentos where id = p_id;
  perform public.documentos_anotar('borrar', doc.id, doc.titulo,
    doc.nombre_original || ' · estaba ' || replace(doc.estado, '_', ' '));
  return jsonb_build_object('id', doc.id);
end;
$$;

-- Bitácora (solo administradores)
create or replace function public.documentos_bitacora_listar(p_limite integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  lista jsonb;
begin
  perform public.documentos_exigir_acceso();
  if not public.es_admin() then
    raise exception 'Solo un administrador puede ver la bitácora.' using errcode = '42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'fecha', b.fecha, 'usuario', b.usuario, 'usuario_id', b.usuario_id, 'accion', b.accion,
           'documento_id', b.documento_id, 'documento', b.documento, 'detalle', b.detalle,
           'ip', b.ip, 'navegador', b.navegador
         ) order by b.fecha desc, b.id desc), '[]'::jsonb)
    into lista
  from (
    select * from public.documentos_bitacora
    order by fecha desc, id desc
    limit least(greatest(coalesce(p_limite, 300), 1), 2000)
  ) b;
  return lista;
end;
$$;

-- Reglas de Storage: ¿puedo subir, leer o quitar este archivo?
create or replace function public.documento_puede_subir(ruta text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.documentos_acceso() and exists (
    select 1 from public.documentos d
    where d.archivo = ruta and d.estado = 'subiendo' and d.subido_por = (select auth.uid())
  );
$$;

create or replace function public.documento_puede_leer(ruta text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.documentos_acceso() and exists (
    select 1 from public.documentos d
    where d.archivo = ruta
      and (
        -- abrir/descargar: solo justo después de quedar anotado en la bitácora
        (public.documento_visible(d.estado, d.subido_por) and exists (
          select 1 from public.documentos_bitacora b
          where b.documento_id = d.id
            and b.usuario_id = (select auth.uid())
            and b.accion in ('abrir', 'descargar')
            and b.fecha > now() - interval '2 minutes'))
        -- quien lo está subiendo (lo necesita Storage al terminar la subida)
        or (d.estado = 'subiendo' and d.subido_por = (select auth.uid()))
        -- quien lo está borrando
        or (d.borrando_por = (select auth.uid()) and d.borrando_desde > now() - interval '10 minutes'
            and public.documento_borrable(d.estado, d.subido_por))
      )
  );
$$;

create or replace function public.documento_puede_quitar(ruta text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.documentos_acceso() and exists (
    select 1 from public.documentos d
    where d.archivo = ruta
      and d.borrando_por = (select auth.uid())
      and d.borrando_desde > now() - interval '10 minutes'
      and public.documento_borrable(d.estado, d.subido_por)
  );
$$;

-- Si cambia el tamaño máximo en la configuración, se aplica al espacio "documentos" de Storage
create or replace function public.documentos_config_aplicar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update storage.buckets set file_size_limit = new.max_mb::bigint * 1048576 where id = 'documentos';
  return new;
end;
$$;

drop trigger if exists documentos_config_aplicar on public.documentos_config;
create trigger documentos_config_aplicar
  after insert or update on public.documentos_config
  for each row execute function public.documentos_config_aplicar();


-- ---------------------------------------------------------
-- 5) SEGURIDAD DE LAS TABLAS: nadie las toca directamente (todo pasa por las funciones de arriba)
-- ---------------------------------------------------------
alter table public.documentos_config   enable row level security;
alter table public.documentos          enable row level security;
alter table public.documentos_bitacora enable row level security;

revoke all on public.documentos_config   from anon, authenticated;
revoke all on public.documentos          from anon, authenticated;
revoke all on public.documentos_bitacora from anon, authenticated;

-- Funciones internas: no se pueden llamar desde el panel
revoke execute on function public.documentos_anotar(text, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.documentos_config_aplicar() from public, anon, authenticated;
revoke execute on function public.documentos_espacio_usado() from public, anon, authenticated;
revoke execute on function public.documentos_exigir_acceso() from public, anon, authenticated;

-- Funciones del panel y de las reglas: solo para sesiones iniciadas (nunca para el público)
do $$
declare
  firma text;
begin
  foreach firma in array array[
    'public.documentos_acceso()',
    'public.documento_visible(text, uuid)',
    'public.documento_borrable(text, uuid)',
    'public.documentos_listar()',
    'public.documentos_pendientes()',
    'public.documento_crear(text, text, uuid, text, text, text, bigint)',
    'public.documento_confirmar(uuid)',
    'public.documento_revisar(uuid, boolean, text)',
    'public.documento_archivar(uuid, boolean)',
    'public.documento_abrir(uuid, boolean)',
    'public.documento_borrar_preparar(uuid)',
    'public.documento_borrar(uuid)',
    'public.documentos_bitacora_listar(integer)',
    'public.documento_puede_subir(text)',
    'public.documento_puede_leer(text)',
    'public.documento_puede_quitar(text)'
  ] loop
    execute format('revoke execute on function %s from public, anon', firma);
    execute format('grant execute on function %s to authenticated', firma);
  end loop;
end;
$$;


-- ---------------------------------------------------------
-- 6) ARCHIVOS (Storage): espacio PRIVADO "documentos"
-- ---------------------------------------------------------
-- Sin enlaces públicos. PDF, JPG y PNG. El tamaño máximo sale de la configuración (paso 1).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'documentos', 'documentos', false, c.max_mb::bigint * 1048576, array['application/pdf', 'image/jpeg', 'image/png']
from public.documentos_config c
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Documentos: subir" on storage.objects;
create policy "Documentos: subir"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documentos' and public.documento_puede_subir(name));

drop policy if exists "Documentos: abrir" on storage.objects;
create policy "Documentos: abrir"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documentos' and public.documento_puede_leer(name));

drop policy if exists "Documentos: quitar" on storage.objects;
create policy "Documentos: quitar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documentos' and public.documento_puede_quitar(name));

-- (No hay regla para reemplazar archivos: un documento subido no se puede sobrescribir.)
