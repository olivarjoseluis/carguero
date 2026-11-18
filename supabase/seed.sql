-- Carguero · datos iniciales
-- Barrios de Cali y Jamundí (coordenadas aproximadas del centro de cada sector; ajústalas si hace falta)
insert into public.zones (id, city_slug, city_name, name, lat, lng, sort_order) values
  ('valle-del-lili',  'cali',    'Cali',    'Valle del Lili',  3.3740, -76.5230, 1),
  ('ciudad-jardin',   'cali',    'Cali',    'Ciudad Jardín',   3.3640, -76.5350, 2),
  ('el-caney',        'cali',    'Cali',    'El Caney',        3.3920, -76.5150, 3),
  ('pance',           'cali',    'Cali',    'Pance',           3.3330, -76.5450, 4),
  ('san-fernando',    'cali',    'Cali',    'San Fernando',    3.4330, -76.5430, 5),
  ('centro-cali',     'cali',    'Cali',    'Centro',          3.4520, -76.5320, 6),
  ('el-limonar',      'cali',    'Cali',    'El Limonar',      3.3950, -76.5400, 7),
  ('melendez',        'cali',    'Cali',    'Meléndez',        3.3780, -76.5480, 8),
  ('alfaguara',       'jamundi', 'Jamundí', 'Alfaguara',       3.2790, -76.5330, 1),
  ('terranova',       'jamundi', 'Jamundí', 'Terranova',       3.2630, -76.5440, 2),
  ('ciudad-country',  'jamundi', 'Jamundí', 'Ciudad Country',  3.2860, -76.5210, 3),
  ('centro-jamundi',  'jamundi', 'Jamundí', 'Centro',          3.2605, -76.5395, 4),
  ('bochalema',       'jamundi', 'Jamundí', 'Bochalema',       3.3000, -76.5300, 5)
on conflict (id) do nothing;

-- Conductores DE EJEMPLO (is_sample = true). Bórralos antes de lanzar:
--   delete from public.drivers where is_sample;
with d as (
  insert into public.drivers
    (slug, first_name, last_name, whatsapp, body_type, capacity_kg, schedule, has_soat, has_tecno, has_license,
     city_slug, location, status, is_sample, consent_at, rating_avg, review_count, jobs_count)
  values
    ('hernan-r',  'Hernán',     'Rodríguez', '3000000001', 'volteo',  1000, '{semana,sabado}',  true,  true,  true,  'cali',    'SRID=4326;POINT(-76.5225 3.3760)', 'approved', true, now(), 4.9, 38, 112),
    ('marisol-g', 'Marisol',    'Gómez',     '3000000002', 'furgon',   600, '{semana}',         true,  true,  true,  'cali',    'SRID=4326;POINT(-76.5400 3.3500)', 'approved', true, now(), 4.8, 21,  64),
    ('jhon-c',    'Jhon Fredy', 'Castro',    '3000000003', 'platon',  1000, '{semana,sabado,domingo}', true, false, true, 'cali', 'SRID=4326;POINT(-76.5370 3.4450)', 'approved', true, now(), 4.7, 54, 160),
    ('luz-m',     'Luz Dary',   'Mosquera',  '3000000004', 'furgon',   700, '{semana,sabado}',  true,  true,  true,  'cali',    'SRID=4326;POINT(-76.5440 3.4300)', 'approved', true, now(), 5.0, 12,  30),
    ('oscar-p',   'Óscar',      'Paz',       '3000000005', 'platon',   900, '{sabado,domingo}', true,  false, true,  'cali',    'SRID=4326;POINT(-76.5160 3.3880)', 'approved', true, now(), 4.6, 17,  48),
    ('wilson-a',  'Wilson',     'Arboleda',  '3000000006', 'volteo',  1200, '{semana}',         true,  true,  true,  'cali',    'SRID=4326;POINT(-76.5470 3.3400)', 'approved', true, now(), 4.8,  9,  22),
    ('diego-t',   'Diego',      'Torres',    '3000000007', 'platon',   800, '{semana,sabado}',  true,  true,  true,  'jamundi', 'SRID=4326;POINT(-76.5350 3.2770)', 'approved', true, now(), 4.9, 26,  81),
    ('yaneth-l',  'Yaneth',     'Lucumí',    '3000000008', 'furgon',   600, '{semana}',         true,  false, true,  'jamundi', 'SRID=4326;POINT(-76.5220 3.2850)', 'approved', true, now(), 4.7, 14,  37),
    ('carlos-e',  'Carlos',     'Escobar',   '3000000009', 'volteo',  1000, '{semana,sabado,domingo}', true, true, true,  'jamundi', 'SRID=4326;POINT(-76.5410 3.2620)', 'approved', true, now(), 4.8, 31,  95)
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.driver_zones (driver_id, zone_id)
select d.id, z.zone_id from d
join (values
  ('hernan-r', 'valle-del-lili'), ('hernan-r', 'el-caney'),
  ('marisol-g', 'ciudad-jardin'), ('marisol-g', 'pance'),
  ('jhon-c', 'centro-cali'), ('jhon-c', 'san-fernando'),
  ('luz-m', 'san-fernando'), ('luz-m', 'centro-cali'),
  ('oscar-p', 'el-caney'), ('oscar-p', 'valle-del-lili'),
  ('wilson-a', 'pance'), ('wilson-a', 'ciudad-jardin'),
  ('diego-t', 'alfaguara'), ('diego-t', 'terranova'),
  ('yaneth-l', 'ciudad-country'), ('yaneth-l', 'centro-jamundi'),
  ('carlos-e', 'centro-jamundi'), ('carlos-e', 'terranova')
) as z(slug, zone_id) on z.slug = d.slug
on conflict do nothing;
