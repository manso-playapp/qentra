import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  CircleDot,
  Sparkles,
  Target,
} from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BEYOND_MVP,
  MVP_FEATURES,
  NEXT_STEPS,
  TECH_DEBT,
  featuresByStatus,
  summarize,
  summarizeByModule,
  type FeatureStatus,
  type MvpFeature,
} from '@/lib/mvp-status'

export const metadata = {
  title: 'Estado del MVP',
}

const STATUS_META: Record<
  FeatureStatus,
  {
    label: string
    column: string
    icon: typeof CheckCircle2
    badge: 'success' | 'warning' | 'outline'
    accent: string
    bar: string
  }
> = {
  done: {
    label: 'Funcionando',
    column: 'Ya funciona',
    icon: CheckCircle2,
    badge: 'success',
    accent: 'border-emerald-200/80 bg-emerald-50/60',
    bar: 'bg-emerald-500',
  },
  partial: {
    label: 'A medias',
    column: 'A medias',
    icon: CircleDot,
    badge: 'warning',
    accent: 'border-amber-200/80 bg-amber-50/60',
    bar: 'bg-amber-400',
  },
  todo: {
    label: 'Pendiente',
    column: 'Pendiente',
    icon: CircleDashed,
    badge: 'outline',
    accent: 'border-border/70 bg-white/70',
    bar: 'bg-slate-300',
  },
}

const DEBT_BADGE: Record<'alta' | 'media' | 'baja', 'danger' | 'warning' | 'outline'> = {
  alta: 'danger',
  media: 'warning',
  baja: 'outline',
}

/** Tarjeta de lo pendiente: enfocada en que falta, sin rutas ni detalle tecnico. */
function PendingCard({ feature }: { feature: MvpFeature }) {
  const meta = STATUS_META[feature.status]
  const Icon = meta.icon

  return (
    <article className={`rounded-[24px] border p-5 ${meta.accent}`}>
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-base font-semibold leading-6 text-foreground">{feature.title}</h4>
        <Badge variant={meta.badge} className="flex-none gap-1">
          <Icon className="size-3.5" />
          {meta.label}
        </Badge>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.detail}</p>

      {feature.gap && (
        <p className="mt-3 border-l-2 border-amber-300 pl-3 text-sm leading-6 text-amber-900">
          <span className="font-semibold">Falta: </span>
          {feature.gap}
        </p>
      )}
    </article>
  )
}

export default function MvpStatusPage() {
  const summary = summarize(MVP_FEATURES)
  const modules = summarizeByModule(MVP_FEATURES).filter((module) => module.total > 0)

  const columns: FeatureStatus[] = ['done', 'partial', 'todo']

  const todo = featuresByStatus(MVP_FEATURES, 'todo')
  const partial = featuresByStatus(MVP_FEATURES, 'partial')
  const pending = [...todo, ...partial]
  const done = featuresByStatus(MVP_FEATURES, 'done')

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        {/* Cabecera compacta: sin el numero grande, solo el titulo y el pulso. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Estado del MVP</Badge>
            <Badge variant="outline">{summary.total} features</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              {summary.done} funcionando
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-amber-400" />
              {summary.partial} a medias
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-slate-300" />
              {summary.todo} pendientes
            </span>
          </div>
        </div>

        {/* Lo primero: proximos pasos y deudas. */}
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Card className="bg-admin-navy text-white">
            <CardHeader>
              <CardDescription className="text-sky-200/70">Lo que sigue</CardDescription>
              <CardTitle className="text-white">Proximos pasos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {NEXT_STEPS.map((step) => (
                <div key={step.order} className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 flex-none items-center justify-center rounded-full bg-sky-400/20 text-xs font-semibold text-sky-200">
                      {step.order}
                    </span>
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-300">{step.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-admin-panel">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="size-4" />
                No bloquea el MVP, pero esta ahi
              </CardDescription>
              <CardTitle className="admin-heading text-3xl">Deudas</CardTitle>
            </CardHeader>
            <CardContent>
              {TECH_DEBT.length === 0 ? (
                <div className="flex items-center gap-3 rounded-[24px] border border-emerald-200/80 bg-emerald-50/60 p-5">
                  <CheckCircle2 className="size-5 flex-none text-emerald-600" />
                  <p className="text-sm leading-6 text-foreground">
                    Sin deudas técnicas. Lo que queda son features por hacer, no arreglos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {TECH_DEBT.map((item) => (
                    <div key={item.title} className="rounded-[24px] border border-border/70 bg-white/80 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold leading-6 text-foreground">{item.title}</p>
                        <Badge variant={DEBT_BADGE[item.severity]} className="flex-none">
                          {item.severity}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lo que falta: pendientes y a medias, con foco en el gap. */}
        <Card className="mt-6 bg-admin-panel">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardDescription>Lo que falta</CardDescription>
                <CardTitle className="admin-heading text-3xl">Pendiente y a medias</CardTitle>
              </div>
              <Badge variant="outline">{pending.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {pending.map((feature) => (
                <PendingCard key={feature.id} feature={feature} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Avance por modulo: el porcentaje que si queda. */}
        <Card className="mt-6 bg-admin-panel">
          <CardHeader>
            <CardDescription>Avance por modulo</CardDescription>
            <CardTitle className="admin-heading text-3xl">Donde esta concentrado el trabajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {modules.map((module) => (
                <div key={module.key}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-3">
                      <p className="text-sm font-semibold text-foreground">{module.label}</p>
                      <p className="text-xs text-muted-foreground">{module.description}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{module.percent}%</span>
                      {' · '}
                      {module.done}/{module.total} cerradas
                    </p>
                  </div>

                  <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-200">
                    {columns.map((status) => {
                      const count = featuresByStatus(
                        MVP_FEATURES.filter((feature) => feature.module === module.key),
                        status
                      ).length
                      if (count === 0) return null

                      return (
                        <div
                          key={status}
                          className={STATUS_META[status].bar}
                          style={{ width: `${(count / module.total) * 100}%` }}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lo ya hecho: listado desplegable, sin detalle tecnico. */}
        <Card className="mt-6 bg-admin-panel">
          <CardContent className="p-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6 [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-emerald-500" />
                  <div>
                    <p className="admin-heading text-2xl leading-tight text-foreground">Ya funcionando</p>
                    <p className="text-sm text-muted-foreground">{done.length} features cerradas</p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>

              <div className="border-t border-border/60 p-6 pt-5">
                <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {done.map((feature) => (
                    <li key={feature.id} className="flex items-center gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="size-4 flex-none text-emerald-500" />
                      {feature.title}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </CardContent>
        </Card>

        {/* Contexto: lo construido de mas, tambien plegado. */}
        <Card className="mt-6 bg-admin-panel">
          <CardContent className="p-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6 [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  <Sparkles className="size-5 text-sky-500" />
                  <div>
                    <p className="admin-heading text-2xl leading-tight text-foreground">Construido de mas</p>
                    <p className="text-sm text-muted-foreground">
                      {BEYOND_MVP.length} cosas fuera del alcance del MVP
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>

              <div className="border-t border-border/60 p-6 pt-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {BEYOND_MVP.map((item) => (
                    <div key={item.title} className="rounded-[24px] border border-border/70 bg-white/80 p-5">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-admin-navy text-white">
          <CardContent className="flex flex-col gap-4 p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="rounded-2xl bg-white/10 p-3">
                <Target className="size-5 text-sky-300" />
              </span>
              <div className="max-w-2xl">
                <p className="admin-heading text-2xl leading-tight text-white">
                  El hito de cierre del primer sprint ya esta superado.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Next levanta, Supabase devuelve datos, el listado y el detalle de eventos existen. El
                  proyecto esta en fase 3 y 4 del playbook, no en fase 1.
                </p>
              </div>
            </div>

            <Button asChild variant="outline" className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white">
              <Link href="/admin/events">
                Ir a la agenda
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
