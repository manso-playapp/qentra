-- Dresscode y el enlace del mapa son datos del evento, no opciones visuales.
alter table if exists public.events
  add column if not exists dresscode text,
  add column if not exists directions_url text;

-- Migra los valores existentes desde la configuracion del personalizador.
update public.events e
set dresscode = coalesce(e.dresscode, nullif(trim(b.config->>'dresscode'), '')),
    directions_url = coalesce(e.directions_url, nullif(trim(b.config->>'directionsUrl'), ''))
from public.event_branding b
where b.event_id = e.id
  and jsonb_typeof(b.config) = 'object'
  and (b.config ? 'dresscode' or b.config ? 'directionsUrl');

-- Limpia las claves antiguas para que Personalizacion deje de ser su origen.
update public.event_branding
set config = config - 'dresscode' - 'directionsUrl'
where jsonb_typeof(config) = 'object'
  and (config ? 'dresscode' or config ? 'directionsUrl');

comment on column public.events.dresscode is
  'Codigo de vestimenta visible en la invitacion.';
comment on column public.events.directions_url is
  'Enlace al mapa del evento.';
