-- La invitación guarda opciones visuales variables por evento. JSONB permite
-- sumar templates sin convertir el modelo operativo en una tabla de estilos.
alter table public.event_branding
  add column if not exists config jsonb not null default '{}'::jsonb;

comment on column public.event_branding.config is
  'Configuración de invitación por evento: template, campos y widgets.';
