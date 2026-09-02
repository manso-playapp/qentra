'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import ImageUpload from '@/components/admin/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { calculateGuestPaymentAmountCents, formatGuestPaymentAmount } from '@/lib/guest-payment'

type InvitationResponseFormProps = {
  token: string
  fields?: {
    rsvp?: boolean
    dni?: boolean
    menu?: boolean
    companions?: boolean
  }
  initialData: {
    attendanceResponse: 'pending' | 'confirmed' | 'declined'
    firstName: string
    lastName: string
    email: string
    phone: string
    dni: string
    plusOnesAllowed: number
    plusOnesConfirmed: number
    paymentAmountCents: number
    companionNames: string
    dietaryRequirements: string
    song: string
    greeting: string
    observations: string
    photoUrl: string
  }
}

export default function InvitationResponseForm({ token, initialData, fields }: InvitationResponseFormProps) {
  const router = useRouter()
  const [attendanceResponse, setAttendanceResponse] = useState<'confirmed' | 'declined'>(
    fields?.rsvp === false ? 'confirmed' : initialData.attendanceResponse === 'declined' ? 'declined' : 'confirmed'
  )
  const [firstName, setFirstName] = useState(initialData.firstName)
  const [lastName, setLastName] = useState(initialData.lastName)
  const [email, setEmail] = useState(initialData.email)
  const [phone, setPhone] = useState(initialData.phone)
  const [dni, setDni] = useState(initialData.dni)
  const [companionNames, setCompanionNames] = useState<string[]>(() => {
    const names = initialData.companionNames
      .split(/[\n,]+/)
      .map((name) => name.trim())
      .filter(Boolean)
    return Array.from({ length: initialData.plusOnesAllowed }, (_, index) => names[index] || '')
  })
  const [dietaryRequirements, setDietaryRequirements] = useState(initialData.dietaryRequirements)
  const [observations, setObservations] = useState(initialData.observations)
  const [photoUrl, setPhotoUrl] = useState(initialData.photoUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRsvpEnabled = fields?.rsvp !== false
  const isDniEnabled = fields?.dni !== false
  const isMenuEnabled = fields?.menu !== false
  const isCompanionsEnabled = fields?.companions !== false
  const isConfirming = attendanceResponse === 'confirmed'
  const companionLimit = isCompanionsEnabled ? initialData.plusOnesAllowed : 0
  const confirmedCompanionCount = companionNames.filter((name) => name.trim()).length
  const estimatedPaymentAmountCents = calculateGuestPaymentAmountCents(
    initialData.paymentAmountCents,
    confirmedCompanionCount
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/invitacion/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceResponse,
          firstName,
          lastName,
          email,
          phone,
          dni: isDniEnabled ? dni : '',
          plusOnesConfirmed: isConfirming && isCompanionsEnabled ? companionNames.filter((name) => name.trim()).length : 0,
          companionNames: isConfirming && isCompanionsEnabled ? companionNames.filter((name) => name.trim()).join('\n') : '',
          dietaryRequirements: isConfirming && isMenuEnabled ? dietaryRequirements : '',
          song: isConfirming ? initialData.song : '',
          greeting: isConfirming ? initialData.greeting : '',
          observations,
        }),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo guardar tu respuesta.')
      }

      if (attendanceResponse === 'confirmed') {
        const nextSearchParams = new URLSearchParams(window.location.search)
        nextSearchParams.set('confirmed', '1')
        router.replace(`${window.location.pathname}?${nextSearchParams.toString()}`)
      } else {
        router.refresh()
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar tu respuesta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 text-slate-950 [&_input]:border-slate-300 [&_input]:bg-white/70 [&_input]:text-slate-950 [&_input]:placeholder:text-slate-400 [&_label]:text-slate-700 [&_textarea]:border-slate-300 [&_textarea]:bg-white/70 [&_textarea]:text-slate-950 [&_textarea]:placeholder:text-slate-400"
    >
      {isRsvpEnabled ? <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setAttendanceResponse('confirmed')}
          aria-pressed={isConfirming}
          className={`invitation-choice-card min-h-28 rounded-[22px] border-2 px-5 py-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcb39e] focus-visible:ring-offset-2 ${
            isConfirming
              ? 'border-[#2f5d55] bg-[#2f5d55] text-white shadow-[0_10px_24px_rgba(47,93,85,0.2)]'
              : 'border-[#fcb39e] bg-white/60 text-slate-800 hover:border-[#2f5d55] hover:bg-white'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <span
              className={`invitation-choice-icon grid size-7 shrink-0 place-items-center rounded-full border ${
                isConfirming ? 'border-white/45 bg-white/15 text-white' : 'border-[#fcb39e] bg-[#fcb39e]/25 text-[#2f5d55]'
              }`}
            >
              <Check className="size-4" strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold">Confirmar asistencia</span>
          </span>
          <span className={`invitation-choice-desc mt-2 block text-sm leading-6 ${isConfirming ? 'text-white/80' : 'text-slate-600'}`}>
            Completá tus datos y recibí el QR final de ingreso.
          </span>
        </button>
        <button
          type="button"
          onClick={() => setAttendanceResponse('declined')}
          aria-pressed={!isConfirming}
          className={`invitation-choice-card min-h-28 rounded-[22px] border-2 px-5 py-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcb39e] focus-visible:ring-offset-2 ${
            !isConfirming
              ? 'border-[#344563] bg-[#344563] text-white shadow-[0_10px_24px_rgba(52,69,99,0.2)]'
              : 'border-[#fcb39e] bg-white/60 text-slate-800 hover:border-[#344563] hover:bg-white'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <span
              className={`invitation-choice-icon grid size-7 shrink-0 place-items-center rounded-full border ${
                !isConfirming ? 'border-white/45 bg-white/15 text-white' : 'border-[#fcb39e] bg-[#fcb39e]/25 text-[#344563]'
              }`}
            >
              <X className="size-4" strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold">No asistiré</span>
          </span>
          <span className={`invitation-choice-desc mt-2 block text-sm leading-6 ${!isConfirming ? 'text-white/80' : 'text-slate-600'}`}>
            Avisá a la organización para liberar tu lugar.
          </span>
        </button>
      </div> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="invitation-first-name">Nombre</Label>
          <Input
            id="invitation-first-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className="mt-2"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <Label htmlFor="invitation-last-name">Apellido</Label>
          <Input
            id="invitation-last-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className="mt-2"
            placeholder="Tu apellido"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="invitation-email">Email</Label>
          <Input
            id="invitation-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2"
            placeholder="tu@email.com"
          />
        </div>
        <div>
          <Label htmlFor="invitation-phone">Telefono</Label>
          <Input
            id="invitation-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-2"
            placeholder="+54 9 ..."
          />
        </div>
      </div>

      {isConfirming && (
        <>
          <div className="invitation-photo-upload rounded-3xl border border-dashed border-slate-300 bg-white/50 p-4">
            <ImageUpload
              label="Tu foto"
              hint="Se usa para validar tu identidad en el ingreso. Podés sacártela con la cámara."
              hintClassName="invitation-form-hint"
              value={photoUrl}
              onChange={setPhotoUrl}
              uploadUrl={`/api/invitacion/${token}/photo`}
              capture="user"
              shape="round"
            />
          </div>

          <div className={`grid gap-4 ${companionLimit > 0 ? 'sm:grid-cols-2' : ''}`}>
            {isDniEnabled ? <div>
              <Label htmlFor="invitation-dni">DNI</Label>
              <Input
                id="invitation-dni"
                value={dni}
                onChange={(event) => setDni(event.target.value)}
                className="mt-2"
                placeholder="Documento"
              />
            </div> : null}
          </div>

          {companionLimit > 0 && (
            <div>
              <Label>Nombres de acompanantes</Label>
              <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
                <p className="text-xs font-semibold">Completá sólo los nombres de quienes realmente vienen.</p>
                <p className="mt-1 text-xs leading-5 text-amber-900/75">
                  Cada nombre completo suma una entrada al total. Los campos vacíos no se cobran y los acompañantes comparten tu QR.
                </p>
                {initialData.paymentAmountCents > 0 && (
                  <p className="mt-2 text-xs font-semibold">
                    Total estimado ahora: {formatGuestPaymentAmount(estimatedPaymentAmountCents)}
                  </p>
                )}
              </div>
              <p className="invitation-form-hint mt-2 text-xs text-slate-500">Opcional. Podés dejar todos los campos vacíos si venís solo/a.</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {companionNames.map((name, index) => (
                  <Input
                    key={`companion-${index}`}
                    id={`invitation-companion-${index + 1}`}
                    value={name}
                    onChange={(event) => {
                      const next = [...companionNames]
                      next[index] = event.target.value
                      setCompanionNames(next)
                    }}
                    placeholder={`Acompanante ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {isMenuEnabled ? <div>
            <Label htmlFor="invitation-menu">Menu o necesidad alimentaria</Label>
            <Input
              id="invitation-menu"
              value={dietaryRequirements}
              onChange={(event) => setDietaryRequirements(event.target.value)}
              className="mt-2"
              placeholder="Ej: celiaco, vegetariano, sin restriccion"
            />
          </div> : null}


        </>
      )}

      <div>
        <Label htmlFor="invitation-observations">Observaciones</Label>
        <Textarea
          id="invitation-observations"
          rows={4}
          value={observations}
          onChange={(event) => setObservations(event.target.value)}
          className="mt-2"
          placeholder="Aclaraciones utiles para la organizacion"
        />
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-300/50 bg-rose-950/80 p-4 text-sm text-rose-100">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" className="invitation-submit-button w-full bg-[#fcb39e] text-slate-950 hover:bg-[#f8c4b5]" disabled={loading}>
        {loading
          ? 'Guardando respuesta...'
          : isConfirming
          ? 'Confirmar y continuar'
          : 'Registrar no asistencia'}
      </Button>
    </form>
  )
}
