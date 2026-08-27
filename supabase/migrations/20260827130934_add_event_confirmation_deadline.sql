alter table if exists public.events
  add column if not exists confirmation_deadline date;

comment on column public.events.confirmation_deadline is
  'Fecha limite opcional para que los invitados confirmen su asistencia.';
