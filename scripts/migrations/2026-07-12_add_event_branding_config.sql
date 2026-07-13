-- Migration: add_config_to_event_branding (idempotent)
-- Fecha: 2026-07-12

ALTER TABLE event_branding
  ADD COLUMN IF NOT EXISTS config jsonb;

-- Nota: esta migración es idempotente y segura para correrse varias veces.
