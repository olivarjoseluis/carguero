-- Carguero · esquema inicial
-- Ejecuta este archivo en Supabase > SQL Editor (o con `supabase db push`).

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ─────────────────────────────────────────────────────────────
-- Zonas (ciudades y barrios). Alimentan el selector y las páginas SEO.
-- ─────────────────────────────────────────────────────────────
create table public.zones (
  id          text primary key,              -- slug, ej. 'valle-del-lili'
  city_slug   text not null,                 -- 'cali' | 'jamundi'
  city_name   text not null,
  name        text not null,
  lat         double precision not null,
  lng         double precision not null,
  sort_order  int not null default 0
);
create index zones_city_idx on public.zones (city_slug);

-- ─────────────────────────────────────────────────────────────
-- Conductores. Tabla PRIVADA: el público lee la vista public_drivers,
-- que nunca expone WhatsApp, correo, placa ni apellidos completos.
-- ─────────────────────────────────────────────────────────────
create table public.drivers (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  first_name    text not null check (char_length(first_name) between 1 and 60),
  last_name     text not null check (char_length(last_name) between 1 and 80),
  whatsapp      text not null check (whatsapp ~ '^3[0-9]{9}$'),
  email         text,
  plate         text,
  body_type     text not null check (body_type in ('platon', 'volteo', 'furgon', 'estacas')),
  capacity_kg   int  not null check (capacity_kg between 100 and 5000),
  schedule      text[] not null default '{}',
  has_soat      boolean not null default false,
  has_tecno     boolean not null default false,
  has_license   boolean not null default false,
  city_slug     text not null,
  location      extensions.geography(Point, 4326),
  photos        text[] not null default '{}',
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_sample     boolean not null default false,
  consent_at    timestamptz not null,
  rating_avg    numeric(2,1) not null default 0,
  review_count  int not null default 0,
  jobs_count    int not null default 0,
  created_at    timestamptz not null default now()
);
create index drivers_city_status_idx on public.drivers (city_slug, status);
create index drivers_location_idx on public.drivers using gist (location);

create table public.driver_zones (
  driver_id uuid not null references public.drivers(id) on delete cascade,
  zone_id   text not null references public.zones(id) on delete cascade,
  primary key (driver_id, zone_id)
);
create index driver_zones_zone_idx on public.driver_zones (zone_id);

-- ─────────────────────────────────────────────────────────────
-- Contactos: cada clic en WhatsApp crea uno, con un token de un solo uso
-- que habilita la reseña durante 14 días.
-- ─────────────────────────────────────────────────────────────
create table public.contact_events (
  id          uuid primary key default gen_random_uuid(),
  driver_id   uuid not null references public.drivers(id) on delete cascade,
  token       text unique not null default encode(extensions.gen_random_bytes(9), 'hex'),
  source      text,                 -- ej. 'grupo-jamundi-1', 'busqueda'
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index contact_events_driver_idx on public.contact_events (driver_id);

create table public.reviews (
  id                uuid primary key default gen_random_uuid(),
  driver_id         uuid not null references public.drivers(id) on delete cascade,
  contact_event_id  uuid unique not null references public.contact_events(id) on delete cascade,
  stars             smallint not null check (stars between 1 and 5),
  tags              text[] not null default '{}',
  comment           text check (comment is null or char_length(comment) <= 280),
  visible           boolean not null default true,
  created_at        timestamptz not null default now()
);
create index reviews_driver_idx on public.reviews (driver_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Promedio de valoración: se recalcula cuando cambian las reseñas.
-- ─────────────────────────────────────────────────────────────
create or replace function public.refresh_driver_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare d uuid := coalesce(new.driver_id, old.driver_id);
begin
  update public.drivers set
    rating_avg   = coalesce((select round(avg(stars)::numeric, 1) from public.reviews where driver_id = d and visible), 0),
    review_count = (select count(*) from public.reviews where driver_id = d and visible)
  where id = d;
  return null;
end $$;

create trigger reviews_refresh_rating
after insert or update or delete on public.reviews
for each row execute function public.refresh_driver_rating();

-- ─────────────────────────────────────────────────────────────
-- Vistas públicas (corren con permisos del dueño, así que ignoran RLS
-- de las tablas privadas pero solo exponen columnas seguras).
-- ─────────────────────────────────────────────────────────────
create or replace view public.public_drivers as
select
  d.id,
  d.slug,
  d.first_name || ' ' || left(d.last_name, 1) || '.'                    as display_name,
  upper(left(d.first_name, 1) || left(d.last_name, 1))                  as initials,
  d.body_type,
  d.capacity_kg,
  d.schedule,
  (d.has_soat and d.has_tecno and d.has_license)                        as verified,
  d.city_slug,
  extensions.st_y(d.location::extensions.geometry)                      as lat,
  extensions.st_x(d.location::extensions.geometry)                      as lng,
  d.photos[1]                                                           as photo,
  d.rating_avg,
  d.review_count,
  d.jobs_count,
  d.is_sample,
  coalesce((select array_agg(dz.zone_id order by z.sort_order)
            from public.driver_zones dz join public.zones z on z.id = dz.zone_id
            where dz.driver_id = d.id), '{}')                           as zone_ids,
  (select r.comment from public.reviews r
    where r.driver_id = d.id and r.visible and r.comment is not null and r.stars >= 4
    order by r.created_at desc limit 1)                                 as latest_quote
from public.drivers d
where d.status = 'approved';

create or replace view public.public_reviews as
select r.id, r.driver_id, r.stars, r.tags, r.comment, r.created_at
from public.reviews r
join public.drivers d on d.id = r.driver_id and d.status = 'approved'
where r.visible;

-- Búsqueda "cerca de mí"
create or replace function public.drivers_near(p_lat double precision, p_lng double precision, p_km double precision default 5)
returns setof public.public_drivers
language sql stable security definer set search_path = public, extensions as $$
  select pd.* from public.public_drivers pd
  join public.drivers d on d.id = pd.id
  where d.location is not null
    and st_dwithin(d.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_km * 1000)
  order by st_distance(d.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography);
$$;

-- Datos para la pantalla de reseña a partir del token (sin exponer el token de otros)
create or replace function public.review_context(p_token text)
returns table (driver_name text, initials text, body_type text, contacted_at timestamptz, status text)
language sql stable security definer set search_path = public as $$
  select pd.display_name, pd.initials, pd.body_type, c.created_at,
         case
           when c.used_at is not null then 'used'
           when c.created_at < now() - interval '14 days' then 'expired'
           else 'ok'
         end
  from public.contact_events c
  join public.public_drivers pd on pd.id = c.driver_id
  where c.token = p_token;
$$;

-- Publicar una reseña: valida token, una sola vez, máximo 14 días
create or replace function public.submit_review(p_token text, p_stars int, p_tags text[], p_comment text)
returns text
language plpgsql security definer set search_path = public as $$
declare c public.contact_events;
begin
  select * into c from public.contact_events where token = p_token for update;
  if not found then return 'invalid'; end if;
  if c.used_at is not null then return 'used'; end if;
  if c.created_at < now() - interval '14 days' then return 'expired'; end if;
  if p_stars < 1 or p_stars > 5 then return 'invalid'; end if;

  insert into public.reviews (driver_id, contact_event_id, stars, tags, comment)
  values (c.driver_id, c.id, p_stars, coalesce(p_tags[1:8], '{}'), nullif(left(trim(coalesce(p_comment, '')), 280), ''));

  update public.contact_events set used_at = now() where id = c.id;
  return 'ok';
end $$;

-- ─────────────────────────────────────────────────────────────
-- Seguridad (Row Level Security)
-- ─────────────────────────────────────────────────────────────
alter table public.zones          enable row level security;
alter table public.drivers        enable row level security;
alter table public.driver_zones   enable row level security;
alter table public.contact_events enable row level security;
alter table public.reviews        enable row level security;

-- Zonas: lectura pública. Lo demás: sin políticas = sin acceso con la anon key.
-- El servidor de Next.js escribe con la service role key (registro y contactos).
create policy "zonas visibles" on public.zones for select to anon, authenticated using (true);

-- Supabase da por defecto TODOS los permisos (también INSERT, UPDATE y DELETE) a anon y authenticated
-- en cada tabla y vista nueva. Se quitan todos y se devuelve solo la lectura de lo público.
-- Ojo: public_drivers es una vista simple, así que Postgres la deja editar, y corre como su dueño
-- (salta RLS). Sin este revoke, cualquiera con la anon key podría editar o borrar conductores aprobados.
revoke all on public.zones, public.drivers, public.driver_zones, public.contact_events, public.reviews,
              public.public_drivers, public.public_reviews from anon, authenticated;
grant select on public.zones, public.public_drivers, public.public_reviews to anon, authenticated;
grant execute on function public.drivers_near(double precision, double precision, double precision) to anon, authenticated;
grant execute on function public.review_context(text) to anon, authenticated;
grant execute on function public.submit_review(text, int, text[], text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Lista de espera de "Compra y venta" (solo escribe el servidor)
-- ─────────────────────────────────────────────────────────────
create table public.waitlist (
  email       text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  topic       text not null default 'compra-venta',
  created_at  timestamptz not null default now()
);
alter table public.waitlist enable row level security;
revoke all on public.waitlist from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Storage: bucket público "fotos" para las fotos del registro (máximo 3 MB cada una).
-- Solo sube el servidor (service role); el público solo las ve por su URL.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('fotos', 'fotos', true, 3145728)
on conflict (id) do nothing;
