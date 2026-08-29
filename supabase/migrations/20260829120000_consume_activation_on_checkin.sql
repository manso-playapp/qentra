-- Un evento es una fiesta que ocurrio, y el check-in es la marca.
-- Ver `docs/Product/ALISTA_DECISIONES_PROPIEDAD_Y_PAGOS.md` §4 bis.
--
-- Hasta aca la activacion habilitaba para siempre, y todo lo que identifica la
-- fiesta (nombre, fecha, salon, lista) es editable. Con eso, despues de la
-- fiesta se podia mover la fecha, reemplazar los invitados, re-emitir los links
-- y correr una segunda fiesta sin volver a pagar.
--
-- La marca no bloquea nada: es estado, no permiso (§4). La duena sigue llegando
-- a todos sus datos. Lo unico que cambia es que una activacion consumida deja de
-- habilitar la emision de tokens para una fecha distinta a la que ya se celebro.

ALTER TABLE public.event_activations
  ADD COLUMN IF NOT EXISTS consumed_at timestamptz,
  -- La fecha para la que se celebro. Comparar contra `events.event_date` es lo
  -- que distingue "sigo operando mi fiesta" de "estoy montando otra".
  ADD COLUMN IF NOT EXISTS consumed_for_date date;

COMMENT ON COLUMN public.event_activations.consumed_at IS
  'Primer ingreso registrado: la fiesta ocurrio y esta activacion ya hizo su trabajo.';
COMMENT ON COLUMN public.event_activations.consumed_for_date IS
  'events.event_date al momento de consumirse. Si la fecha del evento cambia, la activacion deja de habilitar.';

-- Las fiestas ya celebradas quedan marcadas con su propio historial, no con la
-- fecha de esta migracion: si no, una fiesta pasada quedaria habilitada para
-- cualquier fecha nueva.
UPDATE public.event_activations a
SET consumed_at = primer.checked_in_at,
    consumed_for_date = e.event_date
FROM (
  SELECT event_id, min(checked_in_at) AS checked_in_at
  FROM public.checkins
  WHERE result = 'approved'
  GROUP BY event_id
) AS primer
JOIN public.events e ON e.id = primer.event_id
WHERE a.event_id = primer.event_id
  AND a.consumed_at IS NULL;

CREATE OR REPLACE FUNCTION public.register_guest_checkin(
  p_event_id uuid,
  p_guest_id uuid,
  p_invitation_token_id uuid DEFAULT NULL,
  p_method text DEFAULT 'manual',
  p_reason text DEFAULT NULL,
  p_allow_duplicate boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest public.guests%ROWTYPE;
  v_token public.invitation_tokens%ROWTYPE;
  v_now timestamptz := now();
  v_next_used_count integer;
  v_max_uses integer;
  v_checkin_id uuid;
BEGIN
  SELECT *
  INTO v_guest
  FROM public.guests
  WHERE id = p_guest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitado inexistente.' USING ERRCODE = 'P0002';
  END IF;

  IF v_guest.event_id <> p_event_id THEN
    RAISE EXCEPTION 'El invitado no pertenece al evento.' USING ERRCODE = '22023';
  END IF;

  IF NOT p_allow_duplicate AND EXISTS (
    SELECT 1
    FROM public.checkins
    WHERE event_id = p_event_id
      AND guest_id = p_guest_id
      AND result = 'approved'
  ) THEN
    RAISE EXCEPTION 'El ingreso ya fue registrado.' USING ERRCODE = 'P0001';
  END IF;

  IF p_invitation_token_id IS NOT NULL THEN
    SELECT *
    INTO v_token
    FROM public.invitation_tokens
    WHERE id = p_invitation_token_id
    FOR UPDATE;

    IF NOT FOUND OR v_token.guest_id <> p_guest_id THEN
      RAISE EXCEPTION 'El token no corresponde al invitado.' USING ERRCODE = '22023';
    END IF;

    v_max_uses := COALESCE(v_token.max_uses, 1);
    IF NOT v_token.is_active
      OR v_token.last_used_at IS NOT NULL
      OR COALESCE(v_token.used_count, 0) >= v_max_uses THEN
      RAISE EXCEPTION 'El token de invitacion ya fue utilizado o no esta activo.' USING ERRCODE = 'P0001';
    END IF;

    v_next_used_count := COALESCE(v_token.used_count, 0) + 1;
    UPDATE public.invitation_tokens
    SET used_count = v_next_used_count,
        last_used_at = v_now,
        is_active = v_next_used_count < v_max_uses
    WHERE id = v_token.id;
  END IF;

  UPDATE public.guests
  SET status = 'checked_in', updated_at = v_now
  WHERE id = p_guest_id;

  -- Es un artefacto de visualizacion legado. Al ingresar no debe poder
  -- presentarse como QR activo en la tarjeta de gestion.
  UPDATE public.guest_qr_codes
  SET is_active = false, revoked_at = v_now
  WHERE guest_id = p_guest_id
    AND is_active = true;

  INSERT INTO public.checkins (
    event_id,
    guest_id,
    checked_in_at,
    result,
    device_name,
    reason
  )
  VALUES (
    p_event_id,
    p_guest_id,
    v_now,
    'approved',
    p_method,
    p_reason
  )
  RETURNING id INTO v_checkin_id;

  -- El primer ingreso consume la activacion, en la misma transaccion que lo
  -- registra: si el ingreso queda, la marca queda. Los siguientes no la mueven,
  -- para que conserve la fecha real de la fiesta.
  UPDATE public.event_activations a
  SET consumed_at = v_now,
      consumed_for_date = e.event_date
  FROM public.events e
  WHERE a.event_id = p_event_id
    AND e.id = p_event_id
    AND a.consumed_at IS NULL;

  RETURN jsonb_build_object('checkin_id', v_checkin_id, 'checked_in_at', v_now);
END;
$$;

REVOKE ALL ON FUNCTION public.register_guest_checkin(uuid, uuid, uuid, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_guest_checkin(uuid, uuid, uuid, text, text, boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_guest_checkin(uuid, uuid, uuid, text, text, boolean) TO service_role;
