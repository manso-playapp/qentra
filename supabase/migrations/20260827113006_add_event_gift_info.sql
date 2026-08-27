alter table if exists public.events
  add column if not exists gift_info text;

comment on column public.events.gift_info is
  'Información libre para regalos o aportes, visible como bloque en la invitación.';
