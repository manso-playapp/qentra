'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { House, Users, Send, Ellipsis, ChevronRight, ArrowLeft, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatEventSchedule } from '@/lib/event-schedule'
import { isInvitationExpired } from '@/lib/invitation-expiry'
import { mobileGuestState } from '@/lib/mobile-guest-state'
import { GUEST_PAYMENT_LABELS } from '@/lib/guest-status-display'
import { toE164 } from '@/lib/phone'
import type { ApiResponse, Event, Guest, GuestType, GuestWithType, InvitationDeliveryTracking, InvitationSenderGroup, InvitationToken, UpdateGuestForm } from '@/types'

type Tab = 'today' | 'guests' | 'invitations' | 'more'
type Filter = 'all' | 'reply' | 'payment' | 'unmarked'
type Context = { tab: Tab; filter: Filter; sender: string; query: string; selected: string | null; scroll: number }
type Props = {
  event: Pick<Event, 'id' | 'name' | 'event_date' | 'start_time'>
  guestTypes: GuestType[]
  guests: GuestWithType[]
  tokens: Map<string, InvitationToken>
  tracking: Map<string, InvitationDeliveryTracking>
  groups: InvitationSenderGroup[]
  deliveryReady: boolean
  loading: boolean
  error?: string | null
  onRefresh: () => Promise<unknown>
  onMark: (guest: GuestWithType, token: InvitationToken) => Promise<boolean>
  onSave: (id: string, updates: UpdateGuestForm) => Promise<ApiResponse<Guest>>
  shareMessage: (guest: GuestWithType, token: InvitationToken) => { invitationUrl: string; whatsappText: string }
  onAdvanced: (section: string) => void
}
const INITIAL: Context = { tab: 'today', filter: 'all', sender: 'all', query: '', selected: null, scroll: 0 }
const action = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 disabled:opacity-50'
const primary = cn(action, 'w-full border-transparent bg-slate-900 text-white')
const card = 'rounded-2xl border border-slate-200 bg-white p-4'
const field = 'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white p-3 text-base text-slate-900'

export default function MobileEventCompanion(props: Props) {
  const { event, guests, tokens, tracking, groups } = props
  const [context, setContext] = useState<Context>(INITIAL)
  const [composing, setComposing] = useState(false)
  const [message, setMessage] = useState('')
  const [awaitingMark, setAwaitingMark] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ first_name: '', last_name: '', phone: '', table_assignment: '' })
  const restored = useRef(false)
  const storageKey = `alista:mobile:${event.id}`

  // Sólo contexto de navegación en esta pestaña. No persistimos teléfonos,
  // mensajes, tokens ni estados de pago en el almacenamiento del navegador.
  useEffect(() => {
    let cancelled = false
    restored.current = false
    queueMicrotask(() => {
      if (cancelled) return
      let next = INITIAL
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null') as Context | null
        if (saved && ['today', 'guests', 'invitations', 'more'].includes(saved.tab) && ['all', 'reply', 'payment', 'unmarked'].includes(saved.filter)) {
          next = { ...INITIAL, tab: saved.tab, filter: saved.filter, sender: typeof saved.sender === 'string' ? saved.sender : 'all', selected: typeof saved.selected === 'string' ? saved.selected : null, scroll: typeof saved.scroll === 'number' ? Math.max(0, saved.scroll) : 0 }
        }
      } catch { /* Almacenamiento privado o no disponible: la navegación sigue. */ }
      setContext({ ...next })
      restored.current = true
    })
    return () => { cancelled = true }
  }, [storageKey])
  useEffect(() => {
    if (!restored.current) return
    try { sessionStorage.setItem(storageKey, JSON.stringify({ ...context, query: '' })) } catch { /* Opcional. */ }
  }, [context, storageKey])

  const stateOf = (g: GuestWithType) => { const t = tokens.get(g.id); return mobileGuestState(g, t, t ? tracking.get(t.id) : undefined) }
  const active = guests.filter(g => !stateOf(g).inactive)
  const pendingReplies = active.filter(g => stateOf(g).needsReply)
  const pendingPayments = active.filter(g => stateOf(g).needsPayment)
  const unmarked = active.filter(g => stateOf(g).unmarked)
  const confirmedPeople = active.filter(g => stateOf(g).responded).reduce((sum, g) => sum + 1 + Math.max(0, g.plus_ones_confirmed ?? 0), 0)
  const selected = guests.find(g => g.id === context.selected)
  const token = selected ? tokens.get(selected.id) : undefined
  const shareable = Boolean(selected && token && !stateOf(selected).inactive && token.is_active !== false && !isInvitationExpired(token.expires_at))
  const filtered = guests.filter(g => {
    const state = stateOf(g)
    return (context.tab !== 'invitations' || !state.inactive)
      && `${g.first_name} ${g.last_name} ${(g.companion_names ?? []).join(' ')}`.toLocaleLowerCase().includes(context.query.toLocaleLowerCase())
      && (context.sender === 'all' || (context.sender === 'unassigned' ? !g.invitation_sender_group_id : g.invitation_sender_group_id === context.sender))
      && (context.filter === 'all' || context.filter === 'reply' && state.needsReply || context.filter === 'payment' && state.needsPayment || context.filter === 'unmarked' && state.unmarked)
  })
  const clearDetail = () => { setComposing(false); setEditing(false); setAwaitingMark(false); setNotice(null); setError(null) }
  const navigate = (tab: Tab, filter: Filter = 'all') => {
    clearDetail(); setContext({ ...INITIAL, tab, filter }); window.scrollTo({ top: 0 })
  }
  const openGuest = (g: GuestWithType) => {
    clearDetail(); setContext(c => ({ ...c, selected: g.id, scroll: window.scrollY })); window.scrollTo({ top: 0 })
  }
  const openInvitation = (g: GuestWithType) => {
    const invitation = tokens.get(g.id)
    openGuest(g)
    if (!invitation || invitation.is_active === false || isInvitationExpired(invitation.expires_at) || stateOf(g).inactive) return
    try {
      setMessage(props.shareMessage(g, invitation).whatsappText)
      setComposing(true)
    } catch { setError('No se pudo preparar el mensaje. Revisá el contacto.') }
  }
  const back = () => {
    clearDetail(); setContext(c => ({ ...c, selected: null }))
    requestAnimationFrame(() => window.scrollTo({ top: context.scroll }))
  }
  const prepare = () => {
    if (!selected || !token || !shareable) return
    setError(null); setAwaitingMark(false)
    try { setMessage(props.shareMessage(selected, token).whatsappText); setComposing(true) } catch { setError('No se pudo preparar el mensaje. Revisá el contacto.') }
  }
  const mark = async () => {
    if (!selected || !token || !props.deliveryReady || busy) return
    setBusy(true); setError(null)
    try {
      if (!await props.onMark(selected, token)) throw new Error('No se pudo guardar el envío. Podés reintentar; la invitación se conserva.')
      setAwaitingMark(false); setNotice('Marcada como enviada.'); setComposing(false)
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar el envío.') } finally { setBusy(false) }
  }
  const refresh = async () => {
    setBusy(true); setError(null)
    try { await props.onRefresh() } catch { setError('No se pudo actualizar. Reintentá cuando tengas conexión.') } finally { setBusy(false) }
  }
  let whatsappHref = ''
  let invitationUrl = ''
  if (composing && selected && token) {
    invitationUrl = props.shareMessage(selected, token).invitationUrl
    try {
      const number = selected.phone?.trim() ? toE164(selected.phone).replace(/\D/g, '') : ''
      const text = message.includes(invitationUrl) ? message : `${message}\n\n${invitationUrl}`
      whatsappHref = `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    } catch { /* Se ofrece corregir el contacto desde la ficha. */ }
  }
  const sectionTitle = { today: 'Qué sigue', guests: 'Invitados', invitations: 'Invitaciones', more: 'Tu fiesta' }[context.tab]

  return (
    <div className="mx-auto max-w-xl px-1 pb-28 md:hidden" data-testid="mobile-event-companion">
      <header className="mb-5 border-b border-slate-200 pb-4 pt-2">
        <Link href={`/admin/events/${event.id}`} className="text-sm font-medium text-sky-800">← Tu evento</Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0"><h1 className="text-2xl font-semibold text-slate-900 break-words">{event.name}</h1><p className="mt-1 text-sm text-slate-600">{formatEventSchedule(event, props.guestTypes)}</p></div>
          <button type="button" className={action} disabled={busy || props.loading} onClick={() => void refresh()} aria-label="Actualizar seguimiento"><RefreshCw className="size-4" /></button>
        </div>
      </header>
      {(props.loading || busy) && <p role="status" className="mb-3 text-sm text-slate-600">Actualizando…</p>}
      {(error || props.error) && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error || props.error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {selected ? (
        <section className="space-y-4">
          <button type="button" className={action} disabled={busy} onClick={back}><ArrowLeft className="size-4" />Volver al listado</button>
          <div><h2 className="text-2xl font-semibold text-slate-900 break-words">{selected.first_name} {selected.last_name}</h2><p className="mt-1 text-sm text-slate-600">{selected.guest_types?.name || 'Sin tipo'} · Titular + {selected.plus_ones_confirmed ?? 0} acompañantes confirmados</p></div>
          {editing ? (
            <form className={`${card} space-y-4`} onSubmit={async e => {
              e.preventDefault(); setBusy(true); setError(null)
              try {
                const result = await props.onSave(selected.id, { first_name: draft.first_name.trim(), last_name: draft.last_name.trim(), phone: draft.phone.trim(), table_assignment: draft.table_assignment.trim() || null })
                if (result.error) throw new Error(result.error)
                setEditing(false); setNotice('Datos guardados.')
              } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar.') } finally { setBusy(false) }
            }}>
              {([['first_name', 'Nombre'], ['last_name', 'Apellido'], ['phone', 'Teléfono'], ['table_assignment', 'Mesa o ubicación']] as const).map(([key, label]) => <label key={key} className="block text-sm font-medium text-slate-700">{label}<input className={field} required={key === 'first_name' || key === 'last_name'} type={key === 'phone' ? 'tel' : 'text'} maxLength={key === 'phone' ? 40 : 150} value={draft[key]} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))} /></label>)}
              <button className={primary} disabled={busy}>Guardar cambios</button><button type="button" className={`${action} w-full`} disabled={busy} onClick={() => setEditing(false)}>Cancelar edición</button>
            </form>
          ) : composing ? (
            <div className={`${card} space-y-4`}>
              <label className="block text-sm font-medium text-slate-700">Mensaje personal<textarea rows={6} className={field} value={message} onChange={e => setMessage(e.target.value)} /></label>
              <a href={invitationUrl} target="_blank" rel="noreferrer" className={`${action} w-full`}>Ver invitación</a>
              {whatsappHref ? <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={primary} onClick={() => { setAwaitingMark(true); setNotice(null) }}>Abrir WhatsApp</a> : <p className="text-sm text-rose-800">Revisá el teléfono en la ficha antes de compartir.</p>}
              {!selected.phone && <p className="text-sm text-slate-600">Elegí el contacto dentro de WhatsApp; no hace falta agendarlo en Alista.</p>}
              {awaitingMark && props.deliveryReady && <div className="space-y-3 rounded-xl bg-sky-50 p-3"><p className="font-medium text-slate-900">Al volver: ¿la enviaste?</p><button type="button" className={primary} disabled={busy} onClick={() => void mark()}>Sí, marcar como enviada</button><button type="button" className={`${action} w-full`} onClick={() => setAwaitingMark(false)}>Todavía no</button></div>}
              {!props.deliveryReady && <p className="text-sm text-amber-800">El seguimiento no está disponible. Podés compartir, pero no marcar el envío todavía.</p>}
              <button type="button" className={`${action} w-full`} onClick={() => { setComposing(false); setAwaitingMark(false) }}>Volver a la ficha</button>
            </div>
          ) : (
            <>
              <dl className={`${card} grid grid-cols-2 gap-4 text-sm`}>
                <div><dt className="text-slate-500">Respuesta</dt><dd className="mt-1 font-medium">{stateOf(selected).response}</dd></div>
                <div><dt className="text-slate-500">Pago</dt><dd className={`mt-1 font-medium ${selected.payment_status === 'pending' ? 'text-amber-800' : ''}`}>{GUEST_PAYMENT_LABELS[selected.payment_status ?? 'not_required']}</dd></div>
                <div><dt className="text-slate-500">Envío personal</dt><dd className="mt-1">{stateOf(selected).delivery}</dd></div>
                <div><dt className="text-slate-500">A cargo de</dt><dd className="mt-1">{groups.find(g => g.id === selected.invitation_sender_group_id)?.label || 'Sin asignar'}</dd></div>
                <div className="col-span-2"><dt className="text-slate-500">Mesa o ubicación</dt><dd className="mt-1 break-words">{selected.table_assignment || 'Sin asignar'}</dd></div>
                {(selected.companion_names?.length ?? 0) > 0 && <div className="col-span-2"><dt className="text-slate-500">Acompañantes</dt><dd className="mt-1 break-words">{selected.companion_names?.join(' · ')}</dd></div>}
              </dl>
              {shareable ? <button type="button" className={primary} onClick={prepare}>Preparar mensaje de invitación</button> : <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{props.loading ? 'Consultando invitación…' : token ? 'La invitación requiere revisión antes de compartir.' : 'Todavía no hay una invitación generada.'} <button type="button" className="min-h-11 font-semibold underline" onClick={() => props.onAdvanced('mobile-guest-list')}>Revisar en gestión completa</button></p>}
              {token && props.deliveryReady && stateOf(selected).unmarked && <button type="button" className={`${action} w-full`} disabled={busy} onClick={() => void mark()}>Ya la compartí: marcar como enviada</button>}
              <button type="button" className={`${action} w-full`} onClick={() => { setDraft({ first_name: selected.first_name, last_name: selected.last_name, phone: selected.phone ?? '', table_assignment: selected.table_assignment ?? '' }); setEditing(true); setNotice(null) }}>Editar datos y mesa</button>
              {context.tab === 'invitations' && <button type="button" className={`${action} w-full`} disabled={filtered.findIndex(g => g.id === selected.id) >= filtered.length - 1} onClick={() => { const next = filtered[filtered.findIndex(g => g.id === selected.id) + 1]; if (next) { clearDetail(); setContext(c => ({ ...c, selected: next.id })) } }}>Siguiente invitación<ChevronRight className="size-4" /></button>}
            </>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">{sectionTitle}</h2>
          {context.tab === 'today' && <>
            <div className={`${card} space-y-3`}><p className="text-sm text-slate-600">Seguimiento de la fiesta</p><button type="button" className={`${action} w-full justify-between`} onClick={() => navigate('guests', 'reply')}>Sin respuesta <span>{pendingReplies.length} →</span></button>{pendingPayments.length > 0 && <button type="button" className={`${action} w-full justify-between`} onClick={() => navigate('guests', 'payment')}>Grupos con pago pendiente <span>{pendingPayments.length} →</span></button>}<p className="text-sm text-slate-600">{confirmedPeople} personas confirmadas, incluidos acompañantes.</p></div>
            <div className={`${card} space-y-3`}><h3 className="font-semibold">Invitaciones personales</h3><p className="text-sm text-slate-600">{!props.deliveryReady ? 'Consultá tus invitaciones. El seguimiento de envíos todavía no está disponible.' : unmarked.length ? `${unmarked.length} sin registro de envío. Si ya las compartieron, pueden marcarlas sin reenviar.` : 'No hay invitaciones generadas sin registro de envío o respuesta.'}</p><button type="button" className={primary} onClick={() => navigate('invitations')}>Revisar invitaciones</button></div>
            {guests.length === 0 && !props.loading && <button type="button" className={primary} onClick={() => props.onAdvanced('mobile-guest-list')}>Cargar invitados</button>}
          </>}
          {(context.tab === 'guests' || context.tab === 'invitations') && <>
            <label className="block text-sm text-slate-600">Buscar titular o acompañante<input className={field} value={context.query} placeholder="Nombre" onChange={e => setContext(c => ({ ...c, query: e.target.value }))} /></label>
            <div className="flex flex-wrap gap-2">{([['all', 'Todos'], ['reply', 'Sin respuesta'], ...(context.tab === 'guests' ? [['payment', 'Pago pendiente']] : props.deliveryReady ? [['unmarked', 'Sin marcar']] : [])] as [Filter, string][]).map(([value, label]) => <button key={value} type="button" className={`${action} ${context.filter === value ? 'border-sky-700 bg-sky-50 text-sky-900' : ''}`} aria-pressed={context.filter === value} onClick={() => setContext(c => ({ ...c, filter: value }))}>{label}</button>)}</div>
            {groups.length > 0 && <label className="block text-sm text-slate-600">Responsable de envío<select className={field} value={context.sender} onChange={e => setContext(c => ({ ...c, sender: e.target.value }))}><option value="all">Todos los contactos</option>{groups.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}<option value="unassigned">Sin asignar</option></select></label>}
            <p className="text-sm text-slate-600">{filtered.length} invitaciones / grupos</p>
            {filtered.map(g => <article key={g.id} className={`${card} space-y-3`}><button type="button" className="w-full text-left" onClick={() => openGuest(g)}><span className="block text-lg font-semibold text-slate-900 break-words">{g.first_name} {g.last_name}</span><span className="mt-1 block text-sm text-slate-600">{g.guest_types?.name || 'Sin tipo'} · {1 + Math.max(0, g.plus_ones_confirmed ?? 0)} {stateOf(g).responded ? 'personas confirmadas' : 'personas declaradas'}</span><span className="mt-2 flex flex-wrap gap-2"><span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700">{stateOf(g).response}</span>{g.payment_status === 'pending' && <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-900">Pago pendiente</span>}</span></button>{context.tab === 'invitations' && <p className="text-xs text-slate-600">{stateOf(g).delivery} · {groups.find(group => group.id === g.invitation_sender_group_id)?.label || 'Sin asignar'}</p>}<button type="button" className={`${action} w-full justify-between`} onClick={() => context.tab === 'invitations' ? openInvitation(g) : openGuest(g)}>{context.tab === 'invitations' ? 'Preparar mensaje' : 'Ver grupo'}<ChevronRight className="size-4" /></button></article>)}
            {!filtered.length && !props.loading && <p className={card}>No hay invitados con este filtro.</p>}
          </>}
          {context.tab === 'more' && <>
            <div className={`${card} space-y-3`}><h3 className="font-semibold">Recepción</h3><p className="text-sm text-slate-600">Usá el lector de QR para autorizar cada ingreso.</p><Link className={primary} href={`/puerta/${event.id}`}>Abrir modo puerta</Link></div>
            {([['mobile-guest-new', 'Agregar invitado'], ['mobile-guest-tables', 'Mesas y ubicaciones'], ['mobile-guest-senders', 'Organizar quién invita'], ['mobile-guest-types', 'Tipos de acceso'], ['mobile-guest-list', 'Importación y gestión completa']] as const).map(([id, label]) => <button key={id} type="button" className={`${action} w-full justify-between`} onClick={() => props.onAdvanced(id)}>{label}<ChevronRight className="size-4" /></button>)}
            <Link className={`${action} w-full`} href={`/admin/events/${event.id}`}>Configuración y equipo del evento</Link>
            <Link className={`${action} w-full`} href="/contacto">Ayuda de Alista</Link>
          </>}
        </section>
      )}
      <nav aria-label="Gestión móvil del evento" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(15,23,42,0.06)]">
        {([{ id: 'today', label: 'Hoy', icon: House }, { id: 'guests', label: 'Invitados', icon: Users }, { id: 'invitations', label: 'Invitaciones', icon: Send }, { id: 'more', label: 'Más', icon: Ellipsis }] as const).map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={context.tab === id ? 'page' : undefined} disabled={busy} onClick={() => navigate(id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium ${context.tab === id ? 'bg-sky-50 text-sky-900' : 'text-slate-600'}`}><Icon className="size-5" />{label}</button>)}
      </nav>
    </div>
  )
}
