-- Leyenda editorial opcional para contextualizar la invitación según el tipo
-- de acceso (por ejemplo, una invitación al trasnoche).
ALTER TABLE public.guest_types
  ADD COLUMN IF NOT EXISTS invitation_message text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'guest_types_invitation_message_length_check'
      AND conrelid = 'public.guest_types'::regclass
  ) THEN
    ALTER TABLE public.guest_types
      ADD CONSTRAINT guest_types_invitation_message_length_check
      CHECK (invitation_message IS NULL OR char_length(invitation_message) <= 160);
  END IF;
END $$;
