-- Intentos de cobro del servicio de Alista.
--
-- Es una tabla de conciliacion del pago propio de Alista, separada de
-- payment_transactions (que pertenece a los invitados) y de
-- event_payment_accounts (OAuth de la responsable del evento).

create table if not exists public.event_activation_payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  payer_user_id uuid references auth.users(id) on delete set null,
  provider text not null default 'mercadopago' check (provider = 'mercadopago'),
  external_reference text not null unique,
  provider_preference_id text unique,
  provider_payment_id text unique,
  checkout_url text,
  amount_cents integer not null check (amount_cents > 0),
  currency_id text not null default 'ARS' check (currency_id = 'ARS'),
  status text not null default 'created'
    check (status in ('created', 'pending', 'approved', 'rejected', 'cancelled', 'refunded')),
  status_detail text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_activation_payments_event_idx
  on public.event_activation_payments (event_id, created_at desc);

-- Un solo checkout abierto por evento. Si la responsable vuelve a entrar,
-- la ruta le devuelve el mismo checkout en lugar de generar dos cobros.
create unique index if not exists event_activation_payments_open_event_idx
  on public.event_activation_payments (event_id)
  where status in ('created', 'pending');

alter table public.event_activation_payments enable row level security;
revoke all on table public.event_activation_payments from anon, authenticated;

-- La tabla solo se toca desde las rutas de servidor con service_role. El pago
-- es estado comercial, no una policy de autorizacion.
