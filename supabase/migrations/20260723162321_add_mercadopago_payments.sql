-- Precio fijo por tipo de invitado (centavos ARS, evita errores de coma flotante).
ALTER TABLE public.guest_types
  ADD COLUMN IF NOT EXISTS payment_amount_cents integer NOT NULL DEFAULT 0
  CHECK (payment_amount_cents >= 0);

-- Credenciales OAuth cifradas por evento. Nunca se exponen por la Data API:
-- solo las rutas del servidor con service_role pueden leerlas.
CREATE TABLE IF NOT EXISTS public.event_payment_accounts (
  event_id uuid PRIMARY KEY REFERENCES public.events(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'mercadopago' CHECK (provider = 'mercadopago'),
  collector_id text,
  access_token_ciphertext text NOT NULL,
  access_token_iv text NOT NULL,
  access_token_auth_tag text NOT NULL,
  refresh_token_ciphertext text,
  refresh_token_iv text,
  refresh_token_auth_tag text,
  access_token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_payment_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.event_payment_accounts FROM anon, authenticated;

-- Una fila por intento de cobro. El importe se copia al crear el intento para
-- que editar el precio del tipo no cambie cobros ya iniciados.
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  guest_type_id uuid NOT NULL REFERENCES public.guest_types(id),
  provider text NOT NULL DEFAULT 'mercadopago' CHECK (provider = 'mercadopago'),
  external_reference text NOT NULL UNIQUE,
  provider_preference_id text UNIQUE,
  provider_payment_id text UNIQUE,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency_id text NOT NULL DEFAULT 'ARS' CHECK (currency_id = 'ARS'),
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'pending', 'approved', 'rejected', 'cancelled', 'refunded')),
  status_detail text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_transactions_event_guest_idx
  ON public.payment_transactions (event_id, guest_id, created_at DESC);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.payment_transactions FROM anon, authenticated;
