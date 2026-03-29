'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Activity,
  Copy,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  UserPlus,
  Users2,
  Workflow,
} from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  useDeliveryHealth,
  useDeliveryLogs,
  useDeliveryProfiles,
  useOperatorProfiles,
} from '@/lib/hooks'
import type {
  CreateDeliveryProfileForm,
  CreateOperatorForm,
  DeliveryProfile,
  DeliveryHealthStatus,
  OperatorProfile,
  UpdateOperatorForm,
} from '@/types'

type DeliveryProfileFormState = {
  name: string
  channel_mode: DeliveryProfile['channel_mode']
  provider_email: NonNullable<DeliveryProfile['provider_email']> | ''
  provider_whatsapp: NonNullable<DeliveryProfile['provider_whatsapp']> | ''
  from_email: string
  from_phone: string
  reply_to_phone: string
  whatsapp_content_sid: string
  active: boolean
  notes: string
}

type OperatorFormState = {
  email: string
  password: string
  full_name: string
  roles: OperatorProfile['roles']
  active: boolean
}

type PasswordResetPayload = {
  user_id: string
  email: string | null
  temporary_password: string
}

type OperatorAccessLinkPayload = {
  user_id: string
  email: string
  action_link: string
  redirect_to: string
  verification_type: string
}

type OperatorAccessEmailPayload = {
  user_id: string
  email: string
  provider: 'resend'
  external_id?: string
}

const INITIAL_DELIVERY_FORM: DeliveryProfileFormState = {
  name: '',
  channel_mode: 'hybrid',
  provider_email: 'resend',
  provider_whatsapp: 'twilio',
  from_email: '',
  from_phone: '',
  reply_to_phone: '',
  whatsapp_content_sid: '',
  active: true,
  notes: '',
}

const INITIAL_OPERATOR_FORM: OperatorFormState = {
  email: '',
  password: '',
  full_name: '',
  roles: ['door'],
  active: true,
}

const OPERATOR_ROLE_OPTIONS: Array<{
  value: OperatorProfile['roles'][number]
  label: string
}> = [
  { value: 'admin', label: 'Admin' },
  { value: 'door', label: 'Door' },
  { value: 'security_supervisor', label: 'Supervisor' },
]

function trimOptionalValue(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function HealthBadge({ ready }: { ready: boolean }) {
  return (
    <Badge variant={ready ? 'success' : 'warning'}>
      {ready ? 'Listo' : 'Falta configurar'}
    </Badge>
  )
}

function HealthItem({
  title,
  status,
}: {
  title: string
  status: DeliveryHealthStatus['operatorAccessEmail']
}) {
  return (
    <div className="rounded-[24px] border border-border/70 bg-white/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-foreground">{title}</p>
        <HealthBadge ready={status.ready} />
      </div>
      {status.ready ? (
        <p className="mt-2 text-sm text-muted-foreground">Configuracion completa para operar este canal.</p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Falta: {status.missing.join(', ')}
        </p>
      )}
    </div>
  )
}

function StatusNotice({
  tone,
  children,
}: {
  tone: 'danger' | 'success' | 'warning' | 'info'
  children: React.ReactNode
}) {
  const toneClassNames = {
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  } as const

  return (
    <div className={`rounded-[24px] border p-4 text-sm ${toneClassNames[tone]}`}>
      {children}
    </div>
  )
}

function LoadingBlock() {
  return (
    <div className="flex h-32 items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>
  )
}

export default function SettingsPage() {
  const {
    deliveryHealth,
    loading: loadingDeliveryHealth,
    error: deliveryHealthError,
    fetchDeliveryHealth,
  } = useDeliveryHealth()
  const {
    deliveryProfiles,
    loading,
    error,
    createDeliveryProfile,
  } = useDeliveryProfiles()
  const {
    deliveryLogs,
    loading: loadingDeliveryLogs,
    error: deliveryLogsError,
    fetchDeliveryLogs,
  } = useDeliveryLogs(20)
  const {
    operatorProfiles,
    loading: loadingOperatorProfiles,
    error: operatorProfilesError,
    fetchOperatorProfiles,
    createOperatorProfile,
    updateOperatorProfile,
  } = useOperatorProfiles()

  const [deliveryForm, setDeliveryForm] = useState<DeliveryProfileFormState>(INITIAL_DELIVERY_FORM)
  const [operatorForm, setOperatorForm] = useState<OperatorFormState>(INITIAL_OPERATOR_FORM)
  const [submittingDelivery, setSubmittingDelivery] = useState(false)
  const [submittingOperator, setSubmittingOperator] = useState(false)
  const [updatingOperatorId, setUpdatingOperatorId] = useState<string | null>(null)
  const [deliveryError, setDeliveryError] = useState<string | null>(null)
  const [operatorError, setOperatorError] = useState<string | null>(null)
  const [deliveryNotice, setDeliveryNotice] = useState<string | null>(null)
  const [operatorNotice, setOperatorNotice] = useState<string | null>(null)
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null)
  const [generatingAccessLinkId, setGeneratingAccessLinkId] = useState<string | null>(null)
  const [sendingAccessLinkId, setSendingAccessLinkId] = useState<string | null>(null)
  const [passwordResetPayload, setPasswordResetPayload] = useState<PasswordResetPayload | null>(null)
  const [operatorAccessLinkPayload, setOperatorAccessLinkPayload] = useState<OperatorAccessLinkPayload | null>(null)
  const [operatorAccessEmailPayload, setOperatorAccessEmailPayload] = useState<OperatorAccessEmailPayload | null>(null)

  const handleDeliveryInputChange = (
    eventInput: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = eventInput.target
    const nextValue =
      eventInput.target instanceof HTMLInputElement && eventInput.target.type === 'checkbox'
        ? eventInput.target.checked
        : value

    setDeliveryForm((current) => ({
      ...current,
      [name]: nextValue,
    }))
  }

  const handleOperatorInputChange = (eventInput: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = eventInput.target

    setOperatorForm((current) => {
      if (name === 'roles') {
        const role = value as OperatorProfile['roles'][number]
        const roles = checked
          ? Array.from(new Set([...current.roles, role]))
          : current.roles.filter((existingRole) => existingRole !== role)

        return {
          ...current,
          roles,
        }
      }

      return {
        ...current,
        [name]: type === 'checkbox' ? checked : value,
      }
    })
  }

  const handleDeliverySubmit = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()
    setSubmittingDelivery(true)
    setDeliveryError(null)
    setDeliveryNotice(null)

    const payload: CreateDeliveryProfileForm = {
      name: deliveryForm.name.trim(),
      channel_mode: deliveryForm.channel_mode,
      provider_email: deliveryForm.channel_mode === 'whatsapp' ? undefined : deliveryForm.provider_email || undefined,
      provider_whatsapp: deliveryForm.channel_mode === 'email' ? undefined : deliveryForm.provider_whatsapp || undefined,
      from_email: trimOptionalValue(deliveryForm.from_email),
      from_phone: trimOptionalValue(deliveryForm.from_phone),
      reply_to_phone: trimOptionalValue(deliveryForm.reply_to_phone),
      whatsapp_content_sid: trimOptionalValue(deliveryForm.whatsapp_content_sid),
      active: deliveryForm.active,
      notes: trimOptionalValue(deliveryForm.notes),
    }

    const result = await createDeliveryProfile(payload)

    if (result.error) {
      setDeliveryError(result.error)
    } else {
      setDeliveryForm(INITIAL_DELIVERY_FORM)
      setDeliveryNotice('Canal de envio creado correctamente.')
    }

    setSubmittingDelivery(false)
  }

  const handleOperatorSubmit = async (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault()
    setSubmittingOperator(true)
    setOperatorError(null)
    setOperatorNotice(null)

    const payload: CreateOperatorForm = {
      email: operatorForm.email.trim(),
      password: operatorForm.password,
      full_name: operatorForm.full_name.trim(),
      roles: operatorForm.roles,
      active: operatorForm.active,
    }

    const result = await createOperatorProfile(payload)

    if (result.error) {
      setOperatorError(result.error)
    } else {
      setOperatorForm(INITIAL_OPERATOR_FORM)
      setOperatorNotice('Operador creado correctamente.')
    }

    setSubmittingOperator(false)
  }

  const handleOperatorUpdate = async (
    operatorProfile: OperatorProfile,
    updates: UpdateOperatorForm
  ) => {
    setUpdatingOperatorId(operatorProfile.user_id)
    setOperatorError(null)
    setOperatorNotice(null)

    const result = await updateOperatorProfile(operatorProfile.user_id, updates)

    if (result.error) {
      setOperatorError(result.error)
    } else {
      setOperatorNotice(
        `Operador ${operatorProfile.email || operatorProfile.full_name || operatorProfile.user_id} actualizado.`
      )
    }

    setUpdatingOperatorId(null)
  }

  const handlePasswordReset = async (operatorProfile: OperatorProfile) => {
    setResettingPasswordId(operatorProfile.user_id)
    setOperatorError(null)
    setOperatorNotice(null)
    setOperatorAccessLinkPayload(null)
    setOperatorAccessEmailPayload(null)

    try {
      const response = await fetch(`/api/operators/${operatorProfile.user_id}/password`, {
        method: 'POST',
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: PasswordResetPayload; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo resetear el password.')
      }

      if (!payload?.data) {
        throw new Error('La API no devolvio el password temporal.')
      }

      setPasswordResetPayload(payload.data)
      setOperatorNotice(`Password temporal generado para ${operatorProfile.email || operatorProfile.full_name || operatorProfile.user_id}.`)
    } catch (error) {
      setOperatorError(error instanceof Error ? error.message : 'No se pudo resetear el password.')
    } finally {
      setResettingPasswordId(null)
    }
  }

  const handleAccessLinkGeneration = async (operatorProfile: OperatorProfile) => {
    setGeneratingAccessLinkId(operatorProfile.user_id)
    setOperatorError(null)
    setOperatorNotice(null)
    setPasswordResetPayload(null)
    setOperatorAccessEmailPayload(null)

    try {
      const response = await fetch(`/api/operators/${operatorProfile.user_id}/access-link`, {
        method: 'POST',
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: OperatorAccessLinkPayload; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo generar el link de acceso.')
      }

      if (!payload?.data) {
        throw new Error('La API no devolvio el link de acceso.')
      }

      setOperatorAccessLinkPayload(payload.data)
      setOperatorNotice(`Link de acceso generado para ${operatorProfile.email || operatorProfile.full_name || operatorProfile.user_id}.`)
    } catch (error) {
      setOperatorError(error instanceof Error ? error.message : 'No se pudo generar el link de acceso.')
    } finally {
      setGeneratingAccessLinkId(null)
    }
  }

  const handleAccessLinkSend = async (operatorProfile: OperatorProfile) => {
    setSendingAccessLinkId(operatorProfile.user_id)
    setOperatorError(null)
    setOperatorNotice(null)
    setPasswordResetPayload(null)
    setOperatorAccessLinkPayload(null)

    try {
      const response = await fetch(`/api/operators/${operatorProfile.user_id}/access-link/send`, {
        method: 'POST',
      })

      const payload = (await response.json().catch(() => null)) as
        | { data?: OperatorAccessEmailPayload; error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'No se pudo enviar el link de acceso.')
      }

      if (!payload?.data) {
        throw new Error('La API no devolvio el resultado del envio.')
      }

      setOperatorAccessEmailPayload(payload.data)
      setOperatorNotice(
        `Link de acceso enviado por ${payload.data.provider} a ${operatorProfile.email || operatorProfile.full_name || operatorProfile.user_id}.`
      )
    } catch (error) {
      setOperatorError(error instanceof Error ? error.message : 'No se pudo enviar el link de acceso.')
    } finally {
      setSendingAccessLinkId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <Card className="overflow-hidden bg-admin-panel">
          <CardContent className="p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Configuracion</Badge>
                  <Badge variant="outline">Canales de envio</Badge>
                  <Badge variant="outline">Operadores</Badge>
                  <Badge variant="outline">Auditoria</Badge>
                </div>
                <h1 className="admin-heading mt-5 text-5xl leading-none text-foreground">
                  Canales, permisos y estado del sistema.
                </h1>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Esta pantalla concentra lo que define si la app puede operar de verdad: canales, usuarios, links de acceso y trazabilidad de envíos.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href="/admin">Volver al dashboard</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.95fr)]">
          <section className="space-y-6">
            <Card className="bg-admin-panel">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardDescription>Infraestructura</CardDescription>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="size-4 text-primary" />
                    Salud operativa
                  </CardTitle>
                  <CardDescription>
                    Estado real de variables para envío por email, WhatsApp y alta operativa.
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => fetchDeliveryHealth()}>
                  <RefreshCw className="size-4" />
                  Actualizar
                </Button>
              </CardHeader>
              <CardContent>

              {deliveryHealthError && (
                <StatusNotice tone="danger">Error al cargar estado operativo: {deliveryHealthError}</StatusNotice>
              )}

              {loadingDeliveryHealth ? (
                <LoadingBlock />
              ) : deliveryHealth ? (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-border/70 bg-white/75 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-foreground">Clave de servicio</p>
                        <HealthBadge ready={deliveryHealth.serviceRoleConfigured} />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {deliveryHealth.serviceRoleConfigured
                          ? 'Disponible para gestion de operadores y links de acceso.'
                          : 'Falta SUPABASE_SERVICE_ROLE_KEY en el entorno.'}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-border/70 bg-white/75 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-foreground">Redireccion de acceso</p>
                        <HealthBadge ready={deliveryHealth.recoveryRedirectConfigured} />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {deliveryHealth.recoveryRedirectConfigured
                          ? 'Se usa URL fija para recovery de operadores.'
                          : 'Se resuelve automaticamente segun el origin actual.'}
                      </p>
                    </div>
                  </div>

                  <HealthItem title="Acceso operadores por email" status={deliveryHealth.operatorAccessEmail} />
                  <HealthItem title="Invitaciones email" status={deliveryHealth.guestEmail} />
                  <HealthItem title="Invitaciones WhatsApp" status={deliveryHealth.guestWhatsApp} />
                </div>
              ) : null}
              </CardContent>
            </Card>

            <Card className="bg-admin-panel">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardDescription>Acceso operativo</CardDescription>
                  <CardTitle className="flex items-center gap-2">
                    <Users2 className="size-4 text-primary" />
                    Operadores
                  </CardTitle>
                  <CardDescription>
                    Usuarios de Supabase Auth con roles sobre admin, puerta y totem.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => fetchOperatorProfiles()}>
                    <RefreshCw className="size-4" />
                    Actualizar
                  </Button>
                  <Badge variant="outline">{operatorProfiles.length} operadores</Badge>
                </div>
              </CardHeader>
              <CardContent>

              {operatorProfilesError && (
                <StatusNotice tone="danger">Error al cargar operadores: {operatorProfilesError}</StatusNotice>
              )}

              {operatorError && (
                <StatusNotice tone="danger">{operatorError}</StatusNotice>
              )}

              {operatorNotice && (
                <StatusNotice tone="success">{operatorNotice}</StatusNotice>
              )}

              {passwordResetPayload && (
                <StatusNotice tone="warning">
                  <p className="font-semibold">Password temporal generado</p>
                  <p className="mt-1">
                    {passwordResetPayload.email || passwordResetPayload.user_id}
                  </p>
                  <p className="mt-3 rounded-2xl border border-amber-200 bg-white px-3 py-2 font-mono text-sm text-slate-900">
                    {passwordResetPayload.temporary_password}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(passwordResetPayload.temporary_password)
                      }}
                    >
                      <Copy className="size-4" />
                      Copiar password
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPasswordResetPayload(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </StatusNotice>
              )}

              {operatorAccessLinkPayload && (
                <StatusNotice tone="info">
                  <p className="font-semibold">Link de acceso generado</p>
                  <p className="mt-1">{operatorAccessLinkPayload.email}</p>
                  <p className="mt-3 break-all rounded-2xl border border-sky-200 bg-white px-3 py-2 text-xs text-slate-900">
                    {operatorAccessLinkPayload.action_link}
                  </p>
                  <p className="mt-3 text-xs text-sky-800">
                    Redirect: {operatorAccessLinkPayload.redirect_to}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(operatorAccessLinkPayload.action_link)
                      }}
                    >
                      <Copy className="size-4" />
                      Copiar link
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setOperatorAccessLinkPayload(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </StatusNotice>
              )}

              {operatorAccessEmailPayload && (
                <StatusNotice tone="info">
                  <p className="font-semibold">Link de acceso enviado</p>
                  <p className="mt-1">{operatorAccessEmailPayload.email}</p>
                  <p className="mt-3 text-sm">
                    Proveedor: {operatorAccessEmailPayload.provider}
                  </p>
                  <p className="mt-1 text-xs text-cyan-800">
                    ID externo: {operatorAccessEmailPayload.external_id || 'No informado'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setOperatorAccessEmailPayload(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </StatusNotice>
              )}

              {loadingOperatorProfiles ? (
                <LoadingBlock />
              ) : operatorProfiles.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border bg-secondary/60 p-5 text-sm text-muted-foreground">
                  Todavia no hay operadores registrados.
                </div>
              ) : (
                <div className="space-y-3">
                  {operatorProfiles.map((operatorProfile) => (
                    <div key={operatorProfile.user_id} className="rounded-[26px] border border-border/70 bg-white/80 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-foreground">
                            {operatorProfile.full_name || 'Sin nombre'}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {operatorProfile.email || 'Sin email'}
                          </p>
                        </div>
                        <Badge variant={operatorProfile.active ? 'success' : 'outline'}>
                          {operatorProfile.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {OPERATOR_ROLE_OPTIONS.map((roleOption) => {
                          const checked = operatorProfile.roles.includes(roleOption.value)

                          return (
                            <label
                              key={`${operatorProfile.user_id}-${roleOption.value}`}
                              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/70 px-3 py-2 text-sm text-secondary-foreground"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={updatingOperatorId === operatorProfile.user_id}
                                onChange={(eventInput) => {
                                  const nextRoles = eventInput.target.checked
                                    ? Array.from(new Set([...operatorProfile.roles, roleOption.value]))
                                    : operatorProfile.roles.filter((role) => role !== roleOption.value)

                                  void handleOperatorUpdate(operatorProfile, {
                                    full_name: operatorProfile.full_name || '',
                                    roles: nextRoles,
                                    active: operatorProfile.active,
                                  })
                                }}
                              />
                              {roleOption.label}
                            </label>
                          )
                        })}
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                        <p>
                          Ultimo acceso:{' '}
                          {operatorProfile.last_sign_in_at
                            ? new Date(operatorProfile.last_sign_in_at).toLocaleString('es-AR')
                            : 'Sin login aun'}
                        </p>
                        <p>Creado: {new Date(operatorProfile.created_at).toLocaleString('es-AR')}</p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                          type="button"
                          variant="info"
                          size="sm"
                          disabled={
                            sendingAccessLinkId === operatorProfile.user_id ||
                            !deliveryHealth?.operatorAccessEmail.ready
                          }
                          onClick={() => {
                            void handleAccessLinkSend(operatorProfile)
                          }}
                        >
                          {sendingAccessLinkId === operatorProfile.user_id
                            ? 'Enviando link...'
                            : 'Enviar link por email'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={generatingAccessLinkId === operatorProfile.user_id}
                          onClick={() => {
                            void handleAccessLinkGeneration(operatorProfile)
                          }}
                        >
                          {generatingAccessLinkId === operatorProfile.user_id
                            ? 'Generando link...'
                            : 'Generar link de acceso'}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={updatingOperatorId === operatorProfile.user_id}
                          onClick={() => {
                            void handleOperatorUpdate(operatorProfile, {
                              full_name: operatorProfile.full_name || '',
                              roles: operatorProfile.roles,
                              active: !operatorProfile.active,
                            })
                          }}
                        >
                          {updatingOperatorId === operatorProfile.user_id
                            ? 'Actualizando...'
                            : operatorProfile.active
                            ? 'Desactivar'
                            : 'Reactivar'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={resettingPasswordId === operatorProfile.user_id}
                          onClick={() => {
                            void handlePasswordReset(operatorProfile)
                          }}
                        >
                          {resettingPasswordId === operatorProfile.user_id
                            ? 'Reseteando...'
                            : 'Password temporal'}
                        </Button>
                      </div>

                      {!deliveryHealth?.operatorAccessEmail.ready && (
                        <p className="mt-3 text-xs text-amber-700">
                          El envio automatico esta deshabilitado hasta completar: {deliveryHealth?.operatorAccessEmail.missing.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              </CardContent>
            </Card>

            <Card className="bg-admin-panel">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardDescription>Canales reutilizables</CardDescription>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="size-4 text-primary" />
                    Canales de envio
                  </CardTitle>
                  <CardDescription>Canales disponibles para asignar en eventos.</CardDescription>
                </div>
                <Badge variant="outline">{deliveryProfiles.length} perfiles</Badge>
              </CardHeader>
              <CardContent>

              {error && (
                <StatusNotice tone="danger">Error al cargar perfiles: {error}</StatusNotice>
              )}

              {loading ? (
                <LoadingBlock />
              ) : deliveryProfiles.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border bg-secondary/60 p-5 text-sm text-muted-foreground">
                  Todavia no hay canales de envio. Crea uno para habilitar el selector controlado en los eventos.
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveryProfiles.map((profile) => (
                    <div key={profile.id} className="rounded-[26px] border border-border/70 bg-white/80 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-foreground">{profile.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {profile.notes?.trim() || 'Sin notas operativas.'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-medium">
                          <Badge variant="info">{profile.channel_mode}</Badge>
                          <Badge variant={profile.active ? 'success' : 'outline'}>
                            {profile.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                        <p className="flex items-center gap-2"><Mail className="size-4" /> {profile.from_email || 'No definido'}</p>
                        <p className="flex items-center gap-2"><Smartphone className="size-4" /> {profile.from_phone || 'No definido'}</p>
                        <p>Telefono de respuesta: {profile.reply_to_phone || 'No definido'}</p>
                        <p>Plantilla de WhatsApp: {profile.whatsapp_content_sid || 'No definido'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </CardContent>
            </Card>

            <Card className="bg-admin-panel">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardDescription>Auditoria</CardDescription>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="size-4 text-primary" />
                    Ultimos envios
                  </CardTitle>
                  <CardDescription>
                    Auditoria basica de envios reales por proveedor.
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => fetchDeliveryLogs()}>
                  <RefreshCw className="size-4" />
                  Actualizar
                </Button>
              </CardHeader>
              <CardContent>

              {deliveryLogsError && (
                <StatusNotice tone="danger">Error al cargar logs: {deliveryLogsError}</StatusNotice>
              )}

              {loadingDeliveryLogs ? (
                <LoadingBlock />
              ) : deliveryLogs.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-border bg-secondary/60 p-5 text-sm text-muted-foreground">
                  Todavia no hay envios registrados.
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveryLogs.map((log) => (
                    <div key={log.id} className="rounded-[26px] border border-border/70 bg-white/80 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {log.channel} · {log.recipient}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Event {log.event_id} · Guest {log.guest_id}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-medium">
                          <Badge variant={log.status === 'sent' ? 'success' : 'danger'}>{log.status}</Badge>
                          <Badge variant="outline">{log.provider || 'sin provider'}</Badge>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                        <p>Creado: {new Date(log.created_at).toLocaleString('es-AR')}</p>
                        <p>ID externo: {log.external_id || 'No informado'}</p>
                        <p>Error: {log.error_message || 'Sin error'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </CardContent>
            </Card>
          </section>

          <aside className="space-y-6">
            <Card className="bg-admin-navy text-white">
              <CardHeader>
                <CardDescription className="text-orange-200/80">Alta operativa</CardDescription>
                <CardTitle className="flex items-center gap-2 text-white">
                  <UserPlus className="size-4 text-orange-200" />
                  Crear operador
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Alta de usuario en Supabase Auth y siembra de roles en `operator_profiles`.
                </CardDescription>
              </CardHeader>

              <CardContent>
              <form onSubmit={handleOperatorSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="operator-full-name" className="text-white">Nombre</Label>
                  <Input
                    id="operator-full-name"
                    name="full_name"
                    required
                    value={operatorForm.full_name}
                    onChange={handleOperatorInputChange}
                    className="mt-2 border-white/10 bg-white/[0.06] text-white placeholder:text-slate-400"
                    placeholder="Nombre del operador"
                  />
                </div>

                <div>
                  <Label htmlFor="operator-email" className="text-white">Email</Label>
                  <Input
                    id="operator-email"
                    name="email"
                    type="email"
                    required
                    value={operatorForm.email}
                    onChange={handleOperatorInputChange}
                    className="mt-2 border-white/10 bg-white/[0.06] text-white placeholder:text-slate-400"
                    placeholder="operador@qentra.com"
                  />
                </div>

                <div>
                  <Label htmlFor="operator-password" className="text-white">Password inicial</Label>
                  <Input
                    id="operator-password"
                    name="password"
                    type="password"
                    required
                    value={operatorForm.password}
                    onChange={handleOperatorInputChange}
                    className="mt-2 border-white/10 bg-white/[0.06] text-white placeholder:text-slate-400"
                    placeholder="Password temporal"
                  />
                </div>

                <div>
                  <p className="block text-sm font-semibold text-white">Roles</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {OPERATOR_ROLE_OPTIONS.map((roleOption) => (
                      <label
                        key={`operator-form-${roleOption.value}`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-100"
                      >
                        <input
                          type="checkbox"
                          name="roles"
                          value={roleOption.value}
                          checked={operatorForm.roles.includes(roleOption.value)}
                          onChange={handleOperatorInputChange}
                        />
                        {roleOption.label}
                      </label>
                    ))}
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-slate-100">
                  <input
                    type="checkbox"
                    name="active"
                    checked={operatorForm.active}
                    onChange={handleOperatorInputChange}
                  />
                  Operador activo
                </label>

                <Button
                  type="submit"
                  variant="default"
                  disabled={submittingOperator}
                  className="w-full"
                >
                  {submittingOperator ? 'Creando operador...' : 'Crear operador'}
                </Button>
              </form>
              </CardContent>
            </Card>

            <Card className="bg-admin-panel">
              <CardHeader>
                <CardDescription>Configuracion reusable</CardDescription>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  Crear canal de envio
                </CardTitle>
                <CardDescription>
                  Configuracion reutilizable para envio y recepcion por email y WhatsApp.
                </CardDescription>
              </CardHeader>

              <CardContent>
              <form onSubmit={handleDeliverySubmit} className="space-y-4">
                <div>
                  <Label htmlFor="delivery-profile-name">Nombre</Label>
                  <Input
                    id="delivery-profile-name"
                    name="name"
                    required
                    value={deliveryForm.name}
                    onChange={handleDeliveryInputChange}
                    className="mt-2"
                    placeholder="Canal principal Qentra"
                  />
                </div>

                <div>
                  <Label htmlFor="channel-mode">Canal</Label>
                  <Select
                    id="channel-mode"
                    name="channel_mode"
                    value={deliveryForm.channel_mode}
                    onChange={handleDeliveryInputChange}
                    className="mt-2"
                  >
                    <option value="hybrid">Hibrido</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="provider-email">Proveedor de email</Label>
                    <Select
                      id="provider-email"
                      name="provider_email"
                      value={deliveryForm.provider_email}
                      onChange={handleDeliveryInputChange}
                      disabled={deliveryForm.channel_mode === 'whatsapp'}
                      className="mt-2"
                    >
                      <option value="resend">Resend</option>
                      <option value="manual">Manual</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="provider-whatsapp">Proveedor de WhatsApp</Label>
                    <Select
                      id="provider-whatsapp"
                      name="provider_whatsapp"
                      value={deliveryForm.provider_whatsapp}
                      onChange={handleDeliveryInputChange}
                      disabled={deliveryForm.channel_mode === 'email'}
                      className="mt-2"
                    >
                      <option value="twilio">Twilio</option>
                      <option value="manual">Manual</option>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="from-email">From email</Label>
                    <Input
                      id="from-email"
                      name="from_email"
                      type="email"
                      value={deliveryForm.from_email}
                      onChange={handleDeliveryInputChange}
                      className="mt-2"
                      placeholder="invitaciones@dominio.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="from-phone">From phone</Label>
                    <Input
                      id="from-phone"
                      name="from_phone"
                      value={deliveryForm.from_phone}
                      onChange={handleDeliveryInputChange}
                      className="mt-2"
                      placeholder="+54 9 ..."
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="reply-to-phone">Telefono de respuesta</Label>
                    <Input
                      id="reply-to-phone"
                      name="reply_to_phone"
                      value={deliveryForm.reply_to_phone}
                      onChange={handleDeliveryInputChange}
                      className="mt-2"
                      placeholder="+54 9 ..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp-content-sid">ID de plantilla de WhatsApp</Label>
                    <Input
                      id="whatsapp-content-sid"
                      name="whatsapp_content_sid"
                      value={deliveryForm.whatsapp_content_sid}
                      onChange={handleDeliveryInputChange}
                      className="mt-2"
                      placeholder="HX..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="delivery-notes">Notas</Label>
                  <Textarea
                    id="delivery-notes"
                    name="notes"
                    rows={3}
                    value={deliveryForm.notes}
                    onChange={handleDeliveryInputChange}
                    className="mt-2"
                    placeholder="Uso interno del perfil, restricciones o alcance."
                  />
                </div>

                <label className="flex items-start gap-3 rounded-[24px] border border-border p-4">
                  <input
                    type="checkbox"
                    name="active"
                    checked={deliveryForm.active}
                    onChange={handleDeliveryInputChange}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="block text-sm font-medium text-foreground">Activo</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Disponible para asignar en eventos.
                    </span>
                  </div>
                </label>

                {deliveryError && (
                  <StatusNotice tone="danger">Error al crear canal: {deliveryError}</StatusNotice>
                )}

                {deliveryNotice && (
                  <StatusNotice tone="success">{deliveryNotice}</StatusNotice>
                )}

                <Button
                  type="submit"
                  disabled={submittingDelivery}
                  className="w-full"
                >
                  {submittingDelivery ? 'Guardando canal...' : 'Guardar canal de envio'}
                </Button>
              </form>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </AdminLayout>
  )
}
