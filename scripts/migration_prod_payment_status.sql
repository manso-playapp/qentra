-- =============================================================================
-- Qentra: Migración de payment_status a producción
-- Ejecutar en Supabase SQL Editor del proyecto de producción
-- Fecha: 2026-06-05
-- Prerequisito: snapshot/backup tomado ANTES de ejecutar este script
-- =============================================================================

-- ─── PASO 1: MIGRACIÓN ─────────────────────────────────────────────────────────
-- Agrega la columna payment_status con CHECK constraint y default seguro.
-- IF NOT EXISTS hace este paso idempotente (seguro de re-ejecutar).

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'not_required'
  CHECK (payment_status IN ('not_required','pending','approved'));

-- ─── PASO 2: BACKFILL ──────────────────────────────────────────────────────────
-- Migra el valor de paymentStatus desde el campo serializado `notes` a la
-- columna propia. Solo toca filas que aún tienen el default 'not_required'
-- para no pisar datos que ya fueron escritos con el código nuevo.

-- 2a. Filas con "Pago: pending" en notes
UPDATE guests
  SET payment_status = 'pending'
  WHERE notes LIKE '%Pago: pending%'
    AND payment_status = 'not_required';

-- 2b. Filas con "Pago: approved" en notes
UPDATE guests
  SET payment_status = 'approved'
  WHERE notes LIKE '%Pago: approved%'
    AND payment_status = 'not_required';

-- ─── PASO 3: VERIFICACIÓN ──────────────────────────────────────────────────────
-- Esta query debe devolver 0 filas. Si devuelve algo, hay una inconsistencia
-- entre lo que notes decía y lo que la columna tiene ahora.

SELECT id, first_name, last_name, status, payment_status, notes
FROM guests
WHERE (
  (notes LIKE '%Pago: pending%'  AND payment_status != 'pending')
  OR (notes LIKE '%Pago: approved%' AND payment_status != 'approved')
  OR (payment_status IS NULL)
);

-- ─── PASO 4: CONTEO DE FILAS MIGRADAS (informativo) ────────────────────────────

SELECT payment_status, COUNT(*) as total
FROM guests
GROUP BY payment_status
ORDER BY payment_status;
