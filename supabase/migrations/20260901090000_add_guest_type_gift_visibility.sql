-- Configuración por tipo de invitado para mostrar u ocultar el bloque de
-- regalo (alias/CBU) en la invitación pública.
-- El valor por defecto conserva el comportamiento existente.
ALTER TABLE public.guest_types
  ADD COLUMN IF NOT EXISTS show_gift_info boolean NOT NULL DEFAULT true;
