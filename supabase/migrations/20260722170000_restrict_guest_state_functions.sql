-- PostgREST puede tener grants explicitos para anon/authenticated aun despues
-- de revocar PUBLIC. Estas funciones solo se invocan desde rutas protegidas
-- del servidor con service_role.
REVOKE ALL ON FUNCTION public.register_guest_checkin(uuid, uuid, uuid, text, text, boolean) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.revert_guest_checkin(uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_guest_checkin(uuid, uuid, uuid, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.revert_guest_checkin(uuid, text) TO service_role;
