'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/admin/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type InvitationResponseFormProps = {
  token: string
  initialData: {
    attendanceResponse: 'pending' | 'confirmed' | 'declined'
    firstName: string
    lastName: string
    email: string
    phone: string
    dni: string
    plusOnesAllowed: number
    plusOnesConfirmed: number
    companionNames: string
    dietaryRequirements: string
    song: string
    greeting: string
    observations: string
    photoUrl: string
  }
}

export default function InvitationResponseForm({ token, initialData }: InvitationResponseFormProps) {
  const router = useRouter()
  const [attendanceResponse, setAttendanceResponse] = useState<'confirmed' | 'declined'>(
    initialData.attendanceResponse === 'declined' ? 'declined' : 'confirmed'
  )
  const [firstName, setFirstName] = useState(initialData.firstName)
  const [lastName, setLastName] = useState(initialData.lastName)
  const [email, setEmail] = useState(initialData.email)
  const [phone, setPhone] = useState(initialData.phone)
  const [dni, setDni] = useState(initialData.dni)
  const [plusOnesConfirmed, setPlusOnesConfirmed] = useState(String(initialData.plusOnesConfirmed))
  const [companionNames, setCompanionNames] = useState(initialData.companionNames)
  const [dietaryRequirements, setDietaryRequirements] = useState(initialData.dietaryRequirements)
  const [song, setSong] = useState(initialData.song)
  const [greeting, setGreeting] = useState(initialData.greeting)
  const [observations, setObservations] = useState(initialData.observations)
  const [photoUrl, setPhotoUrl] = useState(initialData.photoUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const isConfirming = attendanceResponse === 'confirmed'
  const companionLimit = initialData.plusOnesAllowed

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

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
          dni,
          plusOnesConfirmed: isConfirming ? Number.parseInt(plusOnesConfirmed || '0', 10) || 0 : 0,
          companionNames: isConfirming ? companionNames : '',
          dietaryRequirements: isConfirming ? dietaryRequirements : '',
          song: isConfirming ? song : '',
          greeting: isConfirming ? greeting : '',
          observations,
        }),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo guardar tu respuesta.')
      }

      setNotice(
        attendanceResponse === 'confirmed'
          ? 'Asistencia confirmada. Si el acceso queda habilitado, el QR final aparecera enseguida.'
          : 'Respuesta registrada. Gracias por avisarnos.'
      )
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo guardar tu respuesta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 text-white [&_input]:border-white/20 [&_input]:bg-black/45 [&_input]:text-white [&_input]:placeholder:text-white/40 [&_label]:text-white [&_textarea]:border-white/20 [&_textarea]:bg-black/45 [&_textarea]:text-white [&_textarea]:placeholder:text-white/40"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setAttendanceResponse('confirmed')}
          className={`rounded-[24px] border px-4 py-4 text-left transition ${
            isConfirming
              ? 'border-emerald-300/70 bg-emerald-950/80 text-emerald-50'
              : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <p className="text-sm font-semibold">Confirmar asistencia</p>
          <p className="mt-2 text-sm leading-6 opacity-80">Completa tus datos y recibe el QR final de ingreso.</p>
        </button>
        <button
          type="button"
          onClick={() => setAttendanceResponse('declined')}
          className={`rounded-[24px] border px-4 py-4 text-left transition ${
            !isConfirming
              ? 'border-rose-300/70 bg-rose-950/80 text-rose-50'
              : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <p className="text-sm font-semibold">No asistire</p>
          <p className="mt-2 text-sm leading-6 opacity-80">Avisa a la organizacion para liberar tu lugar.</p>
        </button>
      </div>

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
          <div className="rounded-[24px] border border-white/20 bg-white/5 p-4">
            <ImageUpload
              label="Tu foto"
              hint="Se usa para validar tu identidad en el ingreso. Podés sacártela con la cámara."
              value={photoUrl}
              onChange={setPhotoUrl}
              uploadUrl={`/api/invitacion/${token}/photo`}
              capture="user"
              shape="round"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="invitation-dni">DNI</Label>
              <Input
                id="invitation-dni"
                value={dni}
                onChange={(event) => setDni(event.target.value)}
                className="mt-2"
                placeholder="Documento"
              />
            </div>

            <div>
              <Label htmlFor="invitation-plus-ones">Acompanantes confirmados</Label>
              <Input
                id="invitation-plus-ones"
                type="number"
                min="0"
                max={String(companionLimit)}
                value={plusOnesConfirmed}
                onChange={(event) => setPlusOnesConfirmed(event.target.value)}
                className="mt-2"
                placeholder="0"
              />
              <p className="mt-2 text-xs text-white/60">
                Cupo disponible: {companionLimit}
              </p>
            </div>
          </div>

          {companionLimit > 0 && (
            <div>
              <Label htmlFor="invitation-companion-names">Nombres de acompanantes</Label>
              <Textarea
                id="invitation-companion-names"
                rows={3}
                value={companionNames}
                onChange={(event) => setCompanionNames(event.target.value)}
                className="mt-2"
                placeholder="Un nombre por linea o separados por coma"
              />
            </div>
          )}

          <div>
            <Label htmlFor="invitation-menu">Menu o necesidad alimentaria</Label>
            <Input
              id="invitation-menu"
              value={dietaryRequirements}
              onChange={(event) => setDietaryRequirements(event.target.value)}
              className="mt-2"
              placeholder="Ej: celiaco, vegetariano, sin restriccion"
            />
          </div>

          <div>
            <Label htmlFor="invitation-song">Tu cancion 🎵</Label>
            <Input
              id="invitation-song"
              value={song}
              onChange={(event) => setSong(event.target.value)}
              className="mt-2"
              placeholder="La que no puede faltar en la pista"
            />
          </div>

          <div>
            <Label htmlFor="invitation-greeting">Saludo o dedicatoria 💌</Label>
            <Textarea
              id="invitation-greeting"
              rows={3}
              value={greeting}
              onChange={(event) => setGreeting(event.target.value)}
              className="mt-2"
              placeholder="Un mensaje para quien celebra"
            />
          </div>
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
        <div className="rounded-[24px] border border-rose-300/50 bg-rose-950/80 p-4 text-sm text-rose-100">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-[24px] border border-emerald-300/50 bg-emerald-950/80 p-4 text-sm text-emerald-100">
          {notice}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading
          ? 'Guardando respuesta...'
          : isConfirming
          ? 'Confirmar y continuar'
          : 'Registrar no asistencia'}
      </Button>
    </form>
  )
}
