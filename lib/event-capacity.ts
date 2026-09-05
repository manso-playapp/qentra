// Aviso informativo: la autorización y el límite estricto siguen en el servidor.
export function getEventCapacity(capacity: number | null | undefined, admitted: number | null) {
  const hasLimit = typeof capacity === 'number' && Number.isFinite(capacity) && capacity > 0
  const known = typeof admitted === 'number' && Number.isFinite(admitted) && admitted >= 0
  const occupancy = known ? admitted : 0
  const limit = hasLimit ? capacity : 0
  const spotsLeft = hasLimit && known ? Math.max(limit - occupancy, 0) : null
  const full = spotsLeft === 0
  const low = spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 3
  return {
    hasLimit, known, capacity: limit, occupancy, spotsLeft, full, low,
    pct: hasLimit && known ? Math.min(100, Math.round(occupancy / limit * 100)) : 0,
    message: full ? 'Cupo completo. No se admiten nuevos ingresos.'
      : low ? `Últimos lugares: ${spotsLeft === 1 ? 'queda 1 lugar' : `quedan ${spotsLeft} lugares`}.`
      : null,
  }
}
