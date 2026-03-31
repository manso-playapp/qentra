'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    observations: string
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
  const [observations, setObservations] = useState(initialData.observations)
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setAttendanceResponse('confirmed')}
          className={`rounded-[24px] border px-4 py-4 text-left transition ${
            isConfirming
              ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
              : 'border-border bg-white text-slate-700 hover:bg-slate-50'
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
              ? 'border-rose-300 bg-rose-50 text-rose-950'
              : 'border-border bg-white text-slate-700 hover:bg-slate-50'
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
              <p className="mt-2 text-xs text-muted-foreground">
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
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
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
