-- PROPUESTA LOCAL: aplicar manualmente antes de desplegar la API guarded.
-- No se aplico contra la base real. Ver docs/CHECKIN_INTEGRIDAD_MIGRACION.md.
BEGIN;

ALTER TABLE public.checkins ADD COLUMN IF NOT EXISTS admitted_people integer;
ALTER TABLE public.checkins ADD CONSTRAINT checkins_admitted_people_nonnegative
  CHECK (admitted_people >= 0);
COMMENT ON COLUMN public.checkins.admitted_people IS
  'Personas admitidas en este ingreso: titular y acompanantes confirmados. Reingresos = 0. Snapshot historico inicial estimado con el grupo disponible al migrar.';

-- El esquema anterior no conservaba el tamano del grupo al ingresar. Este
-- backfill es una estimacion: primera admision por invitado, cero reingresos.
-- No modifica invitados ni presume que un pago pendiente sea aprobado.
WITH ranked AS (
  SELECT c.id, c.result,
    row_number() OVER (
      PARTITION BY c.event_id, coalesce(c.guest_id, c.id), c.result
      ORDER BY c.checked_in_at, c.id
    ) AS ordinal,
    1 + greatest(coalesce(g.plus_ones_confirmed, cardinality(g.companion_names), 0), 0) AS people
  FROM public.checkins c
  LEFT JOIN public.guests g ON g.id = c.guest_id
)
UPDATE public.checkins c
SET admitted_people = CASE WHEN r.result = 'approved' AND r.ordinal = 1 THEN r.people ELSE 0 END
FROM ranked r WHERE r.id = c.id AND c.admitted_people IS NULL;

CREATE INDEX IF NOT EXISTS checkins_approved_event_guest_idx
  ON public.checkins (event_id, guest_id) WHERE result = 'approved';

CREATE OR REPLACE FUNCTION public.register_guest_checkin_guarded(
  p_event_id uuid,
  p_guest_id uuid,
  p_invitation_token_id uuid DEFAULT NULL,
  p_method text DEFAULT 'manual',
  p_reason text DEFAULT NULL,
  p_override_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_guest public.guests%ROWTYPE;
  v_type public.guest_types%ROWTYPE;
  v_token public.invitation_tokens%ROWTYPE;
  v_now timestamptz;
  v_checkin_id uuid;
  v_existing boolean;
  v_people integer;
  v_occupancy bigint;
  v_start timestamptz;
  v_end timestamptz;
BEGIN
  IF p_method IS NULL OR p_method NOT IN ('manual', 'qr') OR
    (p_method = 'qr' AND p_invitation_token_id IS NULL) OR
    (p_override_code IS NOT NULL AND (
      p_override_code NOT IN ('already_checked_in', 'outside_window') OR
      nullif(btrim(p_reason), '') IS NULL
    )) THEN
    RAISE EXCEPTION 'invalid_parameters' USING ERRCODE = '22023';
  END IF;

  -- Todas las admisiones/reversiones de un evento toman este candado primero.
  -- El aforo se vuelve a leer DESPUES de adquirirlo: dos puertas no pueden
  -- reservar simultaneamente el ultimo lugar.
  SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'event_not_found' USING ERRCODE = 'P0002'; END IF;
  SELECT * INTO v_guest FROM public.guests WHERE id = p_guest_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'guest_not_found' USING ERRCODE = 'P0002'; END IF;
  IF v_guest.event_id IS DISTINCT FROM p_event_id THEN
    RAISE EXCEPTION 'guest_event_mismatch' USING ERRCODE = '22023';
  END IF;
  v_now := clock_timestamp();

  -- La columna, nunca notes, es la fuente de verdad. NULL tambien bloquea.
  IF v_guest.payment_status IS NULL OR v_guest.payment_status NOT IN ('approved', 'not_required') THEN
    RAISE EXCEPTION 'payment_required' USING ERRCODE = 'P0001';
  END IF;
  IF v_guest.status IN ('cancelled', 'rejected') THEN
    RAISE EXCEPTION 'cancelled' USING ERRCODE = 'P0001';
  ELSIF v_guest.status = 'duplicate' THEN
    RAISE EXCEPTION 'duplicate' USING ERRCODE = 'P0001';
  ELSIF v_guest.status IS NULL OR v_guest.status NOT IN ('enabled', 'confirmed', 'checked_in') THEN
    RAISE EXCEPTION 'not_ready' USING ERRCODE = 'P0001';
  END IF;

  -- Un QR consumido nunca se vuelve valido por un PIN. El reingreso es manual.
  IF p_invitation_token_id IS NOT NULL THEN
    SELECT * INTO v_token FROM public.invitation_tokens WHERE id = p_invitation_token_id FOR UPDATE;
    IF NOT FOUND OR v_token.guest_id IS DISTINCT FROM p_guest_id THEN
      RAISE EXCEPTION 'invalid_token' USING ERRCODE = 'P0001';
    END IF;
    IF v_token.expires_at IS NULL OR v_token.expires_at <= v_now THEN
      RAISE EXCEPTION 'expired' USING ERRCODE = 'P0001';
    END IF;
    IF v_token.is_active IS DISTINCT FROM true OR v_token.last_used_at IS NOT NULL OR
      coalesce(v_token.used_count, 0) >= coalesce(v_token.max_uses, 1) THEN
      RAISE EXCEPTION 'invalid_token' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.checkins
    WHERE event_id = p_event_id AND guest_id = p_guest_id AND result = 'approved') INTO v_existing;
  IF (v_existing OR v_guest.status = 'checked_in') AND p_override_code IS DISTINCT FROM 'already_checked_in' THEN
    RAISE EXCEPTION 'already_checked_in' USING ERRCODE = 'P0001';
  END IF;
  -- Un estado checked_in sin historial aprobado requiere revision; su primera
  -- admision registrada sigue contando personas y debe cumplir el horario.
  IF NOT v_existing THEN
    SELECT * INTO v_type FROM public.guest_types WHERE id = v_guest.guest_type_id;
    IF FOUND AND v_type.event_id IS DISTINCT FROM p_event_id THEN
      RAISE EXCEPTION 'guest_type_event_mismatch' USING ERRCODE = '22023';
    END IF;
    IF v_type.access_start_time IS NOT NULL THEN
      v_start := (v_event.event_date + coalesce(v_type.access_start_day_offset,
        CASE WHEN v_type.access_start_time < v_event.start_time THEN 1 ELSE 0 END)
        + v_type.access_start_time) AT TIME ZONE 'America/Argentina/Buenos_Aires';
    END IF;
    IF v_type.access_end_time IS NOT NULL THEN
      v_end := (v_event.event_date + coalesce(v_type.access_end_day_offset,
        CASE WHEN v_type.access_end_time < v_event.start_time THEN 1 ELSE 0 END)
        + v_type.access_end_time) AT TIME ZONE 'America/Argentina/Buenos_Aires';
    END IF;
    IF ((v_start IS NOT NULL AND v_now < v_start) OR (v_end IS NOT NULL AND v_now > v_end))
      AND p_override_code IS DISTINCT FROM 'outside_window' THEN
      RAISE EXCEPTION 'outside_window' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  v_people := CASE WHEN v_existing THEN 0 ELSE
    1 + greatest(coalesce(v_guest.plus_ones_confirmed, cardinality(v_guest.companion_names), 0), 0) END;
  -- Los snapshots no cambian al editar los acompanantes despues del ingreso.
  -- NULL historico (si un cliente viejo escribe) se agrupa por invitado, nunca
  -- se interpreta como cero y no duplica a quien ya tiene snapshot.
  SELECT coalesce(sum(x.people), 0) INTO v_occupancy FROM (
    SELECT coalesce(sum(c.admitted_people),
      1 + greatest(coalesce(max(g.plus_ones_confirmed), max(cardinality(g.companion_names)), 0), 0)) AS people
    FROM public.checkins c LEFT JOIN public.guests g ON g.id = c.guest_id
    WHERE c.event_id = p_event_id AND c.result = 'approved'
    GROUP BY coalesce(c.guest_id, c.id)
  ) x;
  IF v_event.max_capacity > 0 AND v_occupancy + v_people > v_event.max_capacity THEN
    RAISE EXCEPTION 'event_full' USING ERRCODE = 'P0001';
  END IF;

  IF p_invitation_token_id IS NOT NULL THEN
    UPDATE public.invitation_tokens SET used_count = coalesce(used_count, 0) + 1,
      last_used_at = v_now, is_active = false WHERE id = v_token.id;
  END IF;
  UPDATE public.guests SET status = 'checked_in', updated_at = v_now WHERE id = p_guest_id;
  UPDATE public.guest_qr_codes SET is_active = false, revoked_at = v_now
    WHERE guest_id = p_guest_id AND is_active = true;
  INSERT INTO public.checkins (event_id, guest_id, checked_in_at, result, device_name, reason, admitted_people)
    VALUES (p_event_id, p_guest_id, v_now, 'approved', p_method, p_reason, v_people)
    RETURNING id INTO v_checkin_id;
  UPDATE public.event_activations SET consumed_at = v_now, consumed_for_date = v_event.event_date
    WHERE event_id = p_event_id AND consumed_at IS NULL;
  RETURN jsonb_build_object('checkin_id', v_checkin_id, 'checked_in_at', v_now, 'admitted_people', v_people);
END;
$$;

-- Compatibilidad de firma. No conserva el bypass de pago/horario/aforo.
-- Solo service_role puede invocar ambas funciones; la API verifica el PIN y
-- la autorizacion al evento antes de enviar el codigo de excepcion.
CREATE OR REPLACE FUNCTION public.register_guest_checkin(
  p_event_id uuid, p_guest_id uuid, p_invitation_token_id uuid DEFAULT NULL,
  p_method text DEFAULT 'manual', p_reason text DEFAULT NULL, p_allow_duplicate boolean DEFAULT false
)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.register_guest_checkin_guarded(p_event_id, p_guest_id, p_invitation_token_id,
    p_method, p_reason, CASE WHEN p_allow_duplicate THEN 'already_checked_in' ELSE NULL END);
$$;

-- Mismo orden de locks que el ingreso: una correccion libera el cupo de manera
-- serializada, sin deshacer el consumo de la activacion de una fiesta celebrada.
CREATE OR REPLACE FUNCTION public.revert_guest_checkin(
  p_guest_id uuid, p_reason text DEFAULT 'Ingreso revertido desde Alista Admin'
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_guest public.guests%ROWTYPE;
  v_event_id uuid;
  v_token public.invitation_tokens%ROWTYPE;
  v_now timestamptz := clock_timestamp();
  v_reverted_count integer := 0;
BEGIN
  SELECT event_id INTO v_event_id FROM public.guests WHERE id = p_guest_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'guest_not_found' USING ERRCODE = 'P0002'; END IF;
  PERFORM 1 FROM public.events WHERE id = v_event_id FOR UPDATE;
  SELECT * INTO v_guest FROM public.guests WHERE id = p_guest_id FOR UPDATE;
  IF NOT FOUND OR v_guest.event_id IS DISTINCT FROM v_event_id THEN
    RAISE EXCEPTION 'guest_event_mismatch' USING ERRCODE = '22023';
  END IF;
  UPDATE public.checkins SET result = 'rejected', reason = p_reason
    WHERE guest_id = p_guest_id AND result = 'approved';
  GET DIAGNOSTICS v_reverted_count = ROW_COUNT;
  SELECT * INTO v_token FROM public.invitation_tokens
    WHERE guest_id = p_guest_id AND last_used_at IS NOT NULL
    ORDER BY last_used_at DESC LIMIT 1 FOR UPDATE;
  IF v_token.id IS NOT NULL THEN
    UPDATE public.invitation_tokens SET used_count = 0, last_used_at = NULL, is_active = true
      WHERE id = v_token.id;
  ELSE
    SELECT * INTO v_token FROM public.invitation_tokens
      WHERE guest_id = p_guest_id AND is_active = true AND coalesce(used_count, 0) = 0
      ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  END IF;
  UPDATE public.guests SET status = 'enabled', updated_at = v_now WHERE id = p_guest_id;
  IF v_token.id IS NOT NULL THEN
    UPDATE public.guest_qr_codes SET is_active = true, revoked_at = NULL
      WHERE guest_id = p_guest_id AND strpos(qr_value, v_token.token) > 0;
  END IF;
  RETURN jsonb_build_object('reverted_checkins', v_reverted_count);
END;
$$;

REVOKE ALL ON FUNCTION public.register_guest_checkin_guarded(uuid, uuid, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_guest_checkin_guarded(uuid, uuid, uuid, text, text, text) TO service_role;
REVOKE ALL ON FUNCTION public.register_guest_checkin(uuid, uuid, uuid, text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_guest_checkin(uuid, uuid, uuid, text, text, boolean) TO service_role;
REVOKE ALL ON FUNCTION public.revert_guest_checkin(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revert_guest_checkin(uuid, text) TO service_role;

-- El navegador lee y recibe Realtime, pero toda escritura pasa por APIs que
-- verifican acceso al evento y usan service_role. Sin esto, un cliente podria
-- insertar un check-in por REST o cambiar payment_status y eludir la funcion.
-- Se conservan las policies y SELECT: no hay borrado de configuracion RLS.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.checkins, public.guests,
  public.invitation_tokens, public.guest_qr_codes FROM PUBLIC, anon, authenticated;

COMMIT;
