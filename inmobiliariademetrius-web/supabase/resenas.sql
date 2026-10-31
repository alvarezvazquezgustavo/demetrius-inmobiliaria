-- =========================================================
--  Demetrius Grupo Inmobiliario — Reseñas de la comunidad
--  Ejecuta TODO este archivo una sola vez en:
--  Supabase → SQL Editor → New query → pegar → Run
-- =========================================================

-- 1) Tabla
create table if not exists public.resenas (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  nombre         text not null default 'Anónimo',
  anonimo        boolean not null default false,
  perfil         text,
  zona           text,
  calificacion   smallint not null,
  comentario     text not null,
  aprobada       boolean not null default false,   -- tú la cambias a true para publicarla
  respuesta      text,                              -- respuesta pública opcional de Demetrius
  respondida_at  timestamptz,

  constraint resenas_nombre_largo      check (char_length(nombre) between 1 and 60),
  constraint resenas_perfil_largo      check (perfil is null or char_length(perfil) <= 40),
  constraint resenas_zona_largo        check (zona is null or char_length(zona) <= 60),
  constraint resenas_calificacion      check (calificacion between 1 and 5),
  constraint resenas_comentario_largo  check (char_length(comentario) between 20 and 800),
  constraint resenas_sin_enlaces       check (
    comentario !~* '(https?://|www\.)' and nombre !~* '(https?://|www\.)' and coalesce(zona, '') !~* '(https?://|www\.)'
  )
);

create index if not exists resenas_publicadas_idx
  on public.resenas (created_at desc) where aprobada;

-- 2) Seguridad (Row Level Security)
alter table public.resenas enable row level security;

-- El público solo puede LEER reseñas aprobadas
drop policy if exists "Leer reseñas aprobadas" on public.resenas;
create policy "Leer reseñas aprobadas"
  on public.resenas for select
  to anon, authenticated
  using (aprobada = true);

-- El público puede ENVIAR reseñas, que siempre entran como NO aprobadas
drop policy if exists "Enviar reseñas para revisión" on public.resenas;
create policy "Enviar reseñas para revisión"
  on public.resenas for insert
  to anon, authenticated
  with check (aprobada = false and respuesta is null);

-- Nadie del público puede editar ni borrar (solo tú, desde el panel de Supabase)
revoke update, delete, truncate on public.resenas from anon, authenticated;

-- El público solo puede escribir estas columnas
revoke insert on public.resenas from anon, authenticated;
grant insert (nombre, anonimo, perfil, zona, calificacion, comentario) on public.resenas to anon, authenticated;

-- 3) Reglas automáticas al recibir una reseña
create or replace function public.resenas_antes_de_insertar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Freno anti-spam: máximo 10 reseñas nuevas por minuto en todo el sitio
  if (select count(*) from public.resenas where created_at > now() - interval '1 minute') >= 10 then
    raise exception 'Demasiadas reseñas en poco tiempo. Intenta de nuevo en unos minutos.';
  end if;

  new.created_at    := now();
  new.aprobada      := false;
  new.respuesta     := null;
  new.respondida_at := null;
  new.nombre        := btrim(new.nombre);
  new.comentario    := btrim(new.comentario);
  if new.anonimo or new.nombre = '' then
    new.nombre := 'Anónimo';
  end if;
  return new;
end;
$$;

drop trigger if exists resenas_antes_de_insertar on public.resenas;
create trigger resenas_antes_de_insertar
  before insert on public.resenas
  for each row execute function public.resenas_antes_de_insertar();

-- Registra la fecha cuando escribes una respuesta desde el panel
create or replace function public.resenas_antes_de_actualizar()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.respuesta is distinct from old.respuesta then
    new.respondida_at := case when new.respuesta is null then null else now() end;
  end if;
  return new;
end;
$$;

drop trigger if exists resenas_antes_de_actualizar on public.resenas;
create trigger resenas_antes_de_actualizar
  before update on public.resenas
  for each row execute function public.resenas_antes_de_actualizar();

-- 4) Resumen público (promedio y total de reseñas APROBADAS)
create or replace view public.resenas_resumen
with (security_invoker = true) as
  select count(*)::int as total,
         coalesce(round(avg(calificacion)::numeric, 1), 0) as promedio
  from public.resenas
  where aprobada;

grant select on public.resenas_resumen to anon, authenticated;
