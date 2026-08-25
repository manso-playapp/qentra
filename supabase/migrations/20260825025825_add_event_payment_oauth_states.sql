-- Estado efímero de OAuth + verificador PKCE cifrado. El estado plano nunca
-- se guarda: si la base se expusiera, no se puede completar un callback.
CREATE TABLE IF NOT EXISTS public.event_payment_oauth_states (
  state_hash text PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  operator_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verifier_ciphertext text NOT NULL,
  verifier_iv text NOT NULL,
  verifier_auth_tag text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_payment_oauth_states_expires_at_idx
  ON public.event_payment_oauth_states (expires_at);

ALTER TABLE public.event_payment_oauth_states ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.event_payment_oauth_states FROM anon, authenticated;
