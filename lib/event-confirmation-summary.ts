export function summarizeEventConfirmations(guests: readonly { status: string | null }[]) {
  const counts = { confirmed: 0, awaiting: 0, uninvited: 0, disabled: 0, unknown: 0 }
  for (const guest of guests) {
    switch (guest.status) {
      case 'registered':
      case 'enabled':
      case 'checked_in': counts.confirmed++; break
      case 'link_sent': counts.awaiting++; break
      case 'preinvited': counts.uninvited++; break
      case 'rejected':
      case 'duplicate': counts.disabled++; break
      default: counts.unknown++
    }
  }
  return { ...counts, total: guests.length }
}
