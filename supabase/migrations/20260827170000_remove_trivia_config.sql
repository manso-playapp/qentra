-- La trivia ya no forma parte del producto. Retiramos sus claves del JSON
-- persistido sin afectar otros widgets de la invitacion.
update public.event_branding
set config = case
  when jsonb_typeof(config->'widgets') = 'object' then
    (config - 'triviaQuestion') || jsonb_build_object('widgets', (config->'widgets') - 'trivia')
  else
    config - 'triviaQuestion'
end
where config ? 'triviaQuestion'
   or (jsonb_typeof(config->'widgets') = 'object' and config->'widgets' ? 'trivia');
