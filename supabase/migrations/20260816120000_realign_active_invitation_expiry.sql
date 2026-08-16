-- Si un evento se reprogramo antes de que existiera la sincronizacion desde
-- Admin, sus QR activos podian conservar la fecha vieja. Alineamos solo
-- accesos que siguen activos y todavia no se usaron; los historicos no cambian.
UPDATE public.invitation_tokens AS token
SET expires_at = ((event.event_date + event.start_time + INTERVAL '12 hours') AT TIME ZONE 'America/Argentina/Buenos_Aires')
FROM public.guests AS guest
JOIN public.events AS event ON event.id = guest.event_id
WHERE token.guest_id = guest.id
  AND token.is_active = true
  AND token.last_used_at IS NULL
  AND COALESCE(token.used_count, 0) = 0;
