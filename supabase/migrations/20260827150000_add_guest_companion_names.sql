-- Permite que una invitacion represente a un grupo sin emitir QR individuales.
alter table if exists public.guests
  add column if not exists plus_ones_allowed integer not null default 0,
  add column if not exists plus_ones_confirmed integer not null default 0,
  add column if not exists companion_names text[] not null default '{}';

alter table if exists public.guests
  drop constraint if exists guests_plus_ones_allowed_check,
  drop constraint if exists guests_plus_ones_confirmed_check;

alter table if exists public.guests
  add constraint guests_plus_ones_allowed_check check (plus_ones_allowed >= 0),
  add constraint guests_plus_ones_confirmed_check check (plus_ones_confirmed >= 0);

-- Backfill compatible con las respuestas antiguas serializadas en notes.
with legacy_names as (
  select
    g.id,
    coalesce(
      (regexp_match(g.notes, '(?mi)^Acompanantes:[[:space:]]*(.*)$'))[1],
      (regexp_match(g.notes, '(?mi)^Acompañantes:[[:space:]]*(.*)$'))[1]
    ) as names_text
  from public.guests g
  where g.notes ilike '%acompanantes:%' or g.notes ilike '%acompañantes:%'
), parsed as (
  select
    id,
    array(
      select trim(name)
      from regexp_split_to_table(names_text, E'[\\n,]+') as name
      where trim(name) <> ''
    )::text[] as names
  from legacy_names
  where names_text is not null and trim(names_text) <> ''
)
update public.guests g
set companion_names = parsed.names,
    plus_ones_confirmed = cardinality(parsed.names),
    plus_ones_allowed = greatest(g.plus_ones_allowed, cardinality(parsed.names))
from parsed
where g.id = parsed.id;

comment on column public.guests.plus_ones_allowed is
  'Cantidad maxima de acompañantes que puede confirmar la invitacion.';
comment on column public.guests.plus_ones_confirmed is
  'Cantidad de acompañantes declarados por el titular de la invitacion.';
comment on column public.guests.companion_names is
  'Nombres de acompañantes declarados; no generan QR individual.';
