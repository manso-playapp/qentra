-- ============================================================================
-- Habilitacion comercial del evento.
--
-- Es ESTADO, no permiso: nunca va en las policies de acceso a datos. La duena
-- entra a su evento y edita siempre, haya pagado o no. Lo unico que cambia es
-- si se pueden emitir los links de invitacion.
-- Ver `docs/Product/ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md` §4.
--
-- NO confundir con `events.status` ('draft'/'active'/'inactive'/'cancelled'),
-- que es operativo —¿la fiesta va?— y ademas gobierna la visibilidad publica de
-- la invitacion. Esto es comercial: ¿esta habilitado para emitir?
--
-- Una fila por evento. Si algun dia hay packs profesionales, son N filas de
-- activacion producidas por una compra, y la tabla `events` no se toca.
-- ============================================================================

create table if not exists public.event_activations (
  event_id uuid primary key references public.events(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'revoked')),
  -- 'cortesia' cumple la §22 del canonico: habilitar sin inventar un pago de $0.
  source text not null check (source in ('payment', 'cortesia', 'manual')),
  activated_at timestamptz not null default now(),
  -- Reservado para activaciones temporales. Null = no vence.
  expires_at timestamptz,
  granted_by_user_id uuid references auth.users(id) on delete set null,
  payer_user_id uuid references auth.users(id) on delete set null,
  amount_cents integer check (amount_cents is null or amount_cents >= 0),
  currency_id text,
  mp_payment_id text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_activations_status_idx
  on public.event_activations(status);

-- ---------------------------------------------------------------------------
-- Backfill: los eventos que ya existen quedan activados.
--
-- Sin esto, el muro cortaria la emision de invitaciones en eventos reales que
-- hoy estan operando. Se marcan como 'manual' y quedan identificados por la
-- nota, para poder distinguirlos de una activacion genuina mas adelante.
-- ---------------------------------------------------------------------------
insert into public.event_activations (event_id, status, source, note)
select id, 'active', 'manual', 'backfill: evento anterior al muro de activacion'
from public.events
on conflict (event_id) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
--
-- Lectura: quien administra el evento, para poder ver si esta habilitado.
-- Escritura: solo el staff de Alista. Mientras el cobro no exista, la
-- activacion se otorga a mano. Cuando se automatice, el webhook de pago escribe
-- con service_role y esta policy no estorba.
-- ---------------------------------------------------------------------------
alter table public.event_activations enable row level security;
revoke all on table public.event_activations from anon, authenticated;
grant select on table public.event_activations to authenticated;

drop policy if exists "Event managers can view activation" on public.event_activations;
create policy "Event managers can view activation"
  on public.event_activations for select to authenticated
  using (public.can_manage_event(event_id));

drop policy if exists "Alista staff can manage activation" on public.event_activations;
create policy "Alista staff can manage activation"
  on public.event_activations for all to authenticated
  using (public.is_alista_staff())
  with check (public.is_alista_staff());
