-- Seguimiento operativo de invitaciones.
--
-- Este frente no modifica guests.status, payment_status ni el consumo del QR.
-- Una invitacion generada no se convierte automaticamente en "enviada": la
-- marca de envio es una confirmacion humana y la visita publica es una señal
-- tecnica separada.

create table if not exists public.invitation_sender_groups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 80),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists invitation_sender_groups_event_label_idx
  on public.invitation_sender_groups(event_id, lower(btrim(label)));

create index if not exists invitation_sender_groups_event_sort_idx
  on public.invitation_sender_groups(event_id, sort_order, created_at);

alter table public.guests
  add column if not exists invitation_sender_group_id uuid
    references public.invitation_sender_groups(id) on delete set null;

create index if not exists guests_invitation_sender_group_id_idx
  on public.guests(invitation_sender_group_id);

create table if not exists public.invitation_delivery_tracking (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  invitation_token_id uuid not null references public.invitation_tokens(id) on delete cascade,
  -- La visita puede ocurrir antes de saber por qué canal llegó el link.
  -- El canal se completa cuando se marca un envío real.
  channel text check (channel is null or channel in ('whatsapp', 'email')),
  status text not null default 'pending' check (status in ('pending', 'marked_sent')),
  sender_group_id uuid references public.invitation_sender_groups(id) on delete set null,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  marked_sent_at timestamptz,
  marked_sent_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invitation_token_id),
  check (last_opened_at is null or first_opened_at is not null),
  check (marked_sent_at is null or status = 'marked_sent')
);

create index if not exists invitation_delivery_tracking_event_status_idx
  on public.invitation_delivery_tracking(event_id, status, channel);

create index if not exists invitation_delivery_tracking_guest_idx
  on public.invitation_delivery_tracking(guest_id, updated_at desc);

create index if not exists invitation_delivery_tracking_opened_idx
  on public.invitation_delivery_tracking(event_id, first_opened_at)
  where first_opened_at is not null;

create table if not exists public.invitation_delivery_audit (
  id uuid primary key default gen_random_uuid(),
  tracking_id uuid not null references public.invitation_delivery_tracking(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  invitation_token_id uuid not null references public.invitation_tokens(id) on delete cascade,
  channel text check (channel is null or channel in ('whatsapp', 'email')),
  action text not null check (action in ('marked_sent', 'unmarked_sent', 'link_opened')),
  sender_group_id uuid references public.invitation_sender_groups(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists invitation_delivery_audit_tracking_idx
  on public.invitation_delivery_audit(tracking_id, created_at desc);

create index if not exists invitation_delivery_audit_event_idx
  on public.invitation_delivery_audit(event_id, created_at desc);

alter table public.invitation_sender_groups enable row level security;
alter table public.invitation_delivery_tracking enable row level security;
alter table public.invitation_delivery_audit enable row level security;

-- El navegador nunca escribe estas tablas directamente. Las APIs validan el
-- evento, invitado y token y escriben con service_role; authenticated sólo
-- puede leer filas de eventos que ya puede administrar.
revoke all on table public.invitation_sender_groups from anon, authenticated;
revoke all on table public.invitation_delivery_tracking from anon, authenticated;
revoke all on table public.invitation_delivery_audit from anon, authenticated;

grant select on table public.invitation_sender_groups to authenticated;
grant select on table public.invitation_delivery_tracking to authenticated;
grant select on table public.invitation_delivery_audit to authenticated;

drop policy if exists "Event operators can view invitation sender groups" on public.invitation_sender_groups;
create policy "Event operators can view invitation sender groups"
  on public.invitation_sender_groups for select
  to authenticated
  using (public.can_manage_event(event_id));

drop policy if exists "Event operators can view invitation delivery tracking" on public.invitation_delivery_tracking;
create policy "Event operators can view invitation delivery tracking"
  on public.invitation_delivery_tracking for select
  to authenticated
  using (public.can_manage_event(event_id));

drop policy if exists "Event operators can view invitation delivery audit" on public.invitation_delivery_audit;
create policy "Event operators can view invitation delivery audit"
  on public.invitation_delivery_audit for select
  to authenticated
  using (public.can_manage_event(event_id));

comment on table public.invitation_sender_groups is
  'Grupos operativos de remitente por evento; no representan roles de autenticacion.';
comment on column public.guests.invitation_sender_group_id is
  'Grupo que se ocupa de enviar esta invitacion; nullable significa sin asignar.';
comment on table public.invitation_delivery_tracking is
  'Estado actual por token y canal. No reemplaza guests.status ni el consumo del QR.';
comment on table public.invitation_delivery_audit is
  'Historial de marcas humanas y señales tecnicas de visita de una invitacion.';
