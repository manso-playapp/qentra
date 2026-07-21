-- Migration: add_table_assignment_to_guests (2026-07-21)
-- Agrega la columna table_assignment a guests para soportar la asignacion de
-- destino (mesa) por invitado de forma nativa, en lugar de embebida en notes.
-- Idempotente: seguro correr varias veces.

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS table_assignment text;