-- Una sola operacion atomica para los cambios de estado que afectan el acceso.
-- `guests`, `invitation_tokens`, `guest_qr_codes` y `checkins` no pueden
-- quedar desincronizados por un fallo intermedio del navegador o del servidor.

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

  RETURN jsonb_build_object('checkin_id', v_checkin_id, 'checked_in_at', v_now);
END;
$$;

CREATE OR REPLACE FUNCTION public.revert_guest_checkin(
  p_guest_id uuid,
  p_reason text DEFAULT 'Ingreso revertido desde Alista Admin'
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
  v_reverted_count integer := 0;
BEGIN
  SELECT *
  INTO v_guest
  FROM public.guests
  WHERE id = p_guest_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitado inexistente.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.checkins
  SET result = 'rejected', reason = p_reason
  WHERE guest_id = p_guest_id
    AND result = 'approved';
  GET DIAGNOSTICS v_reverted_count = ROW_COUNT;

  -- Un ingreso por QR consume un unico token. Se restaura ese token; si el
  -- ingreso fue manual elegimos el token activo mas reciente para sincronizar
  -- el artefacto visual legado sin activar links historicos.
  SELECT *
  INTO v_token
  FROM public.invitation_tokens
  WHERE guest_id = p_guest_id
    AND last_used_at IS NOT NULL
  ORDER BY last_used_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_token.id IS NOT NULL THEN
    UPDATE public.invitation_tokens
    SET used_count = 0,
        last_used_at = NULL,
        is_active = true
    WHERE id = v_token.id;
  ELSE
    SELECT *
    INTO v_token
    FROM public.invitation_tokens
    WHERE guest_id = p_guest_id
      AND is_active = true
      AND COALESCE(used_count, 0) = 0
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;
  END IF;

  UPDATE public.guests
  SET status = 'enabled', updated_at = v_now
  WHERE id = p_guest_id;

  -- Solo se vuelve a activar el QR legado que pertenece al token vigente.
  -- La invitacion publica siempre valida el token y el estado del invitado.
  IF FOUND THEN
    UPDATE public.guest_qr_codes
    SET is_active = true, revoked_at = NULL
    WHERE guest_id = p_guest_id
      AND strpos(qr_value, v_token.token) > 0;
  END IF;

  RETURN jsonb_build_object('reverted_checkins', v_reverted_count);
END;
$$;

REVOKE ALL ON FUNCTION public.register_guest_checkin(uuid, uuid, uuid, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revert_guest_checkin(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_guest_checkin(uuid, uuid, uuid, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.revert_guest_checkin(uuid, text) TO service_role;
