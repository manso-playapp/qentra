type GuestAccessPayloadInput = {
  eventId: string
  eventSlug?: string
  guestId: string
  guestName?: string
  token: string
  issuedAt?: string
}

export function buildGuestAccessQrPayload({
  eventId,
  eventSlug,
  guestId,
  guestName,
  token,
  issuedAt = new Date().toISOString(),
}: GuestAccessPayloadInput) {
  return JSON.stringify({
    kind: 'qentra_guest_access',
    eventId,
    eventSlug,
    guestId,
    guestName,
    token,
    issuedAt,
  })
}
