import { getEventCapacity } from '@/lib/event-capacity'

export function CapacityWarning({ capacity, admitted }: { capacity?: number | null; admitted: number | null }) {
  const state = getEventCapacity(capacity, admitted)
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="shrink-0">
      {state.message && (
        <p className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${state.full
          ? 'border-rose-300 bg-rose-100 text-rose-950'
          : 'border-amber-300 bg-amber-100 text-amber-950'}`}>
          {state.message}
        </p>
      )}
    </div>
  )
}
