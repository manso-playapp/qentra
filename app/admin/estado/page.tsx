import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
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

function FeatureCard({ feature }: { feature: MvpFeature }) {
  const meta = STATUS_META[feature.status]
  const Icon = meta.icon

  return (
    <article className={`rounded-[24px] border p-5 ${meta.accent}`}>
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-base font-semibold leading-6 text-foreground">{feature.title}</h4>
        <Icon className="mt-0.5 size-4 flex-none opacity-60" />
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.detail}</p>

      {feature.gap && (
        <p className="mt-3 border-l-2 border-amber-300 pl-3 text-sm leading-6 text-amber-900">
          <span className="font-semibold">Falta: </span>
          {feature.gap}
        </p>
      )}

      {feature.evidence && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {feature.evidence.map((path) => (
            <li
              key={path}
              className="rounded-full border border-border/60 bg-white/70 px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
            >
              {path}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export default function MvpStatusPage() {
  const summary = summarize(MVP_FEATURES)
  const modules = summarizeByModule(MVP_FEATURES)

  const columns: FeatureStatus[] = ['done', 'partial', 'todo']

  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        {/* Cabecera: el numero que responde "donde estamos parados". */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          <Card className="overflow-hidden bg-admin-panel">
            <CardContent className="p-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="default">Estado del MVP</Badge>
                <Badge variant="outline">{summary.total} features</Badge>
                <Badge variant="outline">Playbook seccion 16.1</Badge>
              </div>

              <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <h2 className="admin-heading text-5xl leading-none text-foreground">
                    El MVP esta al {summary.percent}%.
                  </h2>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    {summary.done} features funcionando, {summary.partial} a medias y {summary.todo} sin
                    empezar. El alcance del MVP está cerrado: branding, foto del invitado y tótem
                    quedaron listos. Lo que queda es probarlo end-to-end y pulir los dos partials.
                  </p>
                </div>
              </div>

              {/* Barra segmentada: verde cerrado, ambar a medias, gris pendiente. */}
              <div className="mt-8">
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-200">
                  {columns.map((status) => {
                    const count = featuresByStatus(MVP_FEATURES, status).length
                    if (count === 0) return null

                    return (
                      <div
                        key={status}
                        className={STATUS_META[status].bar}
                        style={{ width: `${(count / summary.total) * 100}%` }}
                      />
                    )
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  {columns.map((status) => {
                    const meta = STATUS_META[status]
                    const count = featuresByStatus(MVP_FEATURES, status).length

                    return (
                      <div key={status} className="flex items-center gap-2">
                        <span className={`size-2.5 rounded-full ${meta.bar}`} />
                        <span className="text-sm text-muted-foreground">
                          {meta.label} · <span className="font-semibold text-foreground">{count}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lo minimo para declarar el MVP cerrado. */}
          <Card className="bg-admin-navy text-white">
            <CardHeader>
              <CardDescription className="text-sky-200/70">Para cerrar el MVP</CardDescription>
              <CardTitle className="text-white">Los proximos 3 pasos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {NEXT_STEPS.map((step) => (
                <div key={step.featureId} className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 flex-none items-center justify-center rounded-full bg-orange-300/20 text-xs font-semibold text-orange-100">
                      {step.order}
                    </span>
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-300">{step.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Avance por modulo. */}
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

        {/* Tablero: que funciona, que debo, que falta. */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {columns.map((status) => {
            const meta = STATUS_META[status]
            const features = featuresByStatus(MVP_FEATURES, status)
            const Icon = meta.icon

            return (
              <Card key={status} className="bg-admin-panel">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardDescription className="flex items-center gap-2">
                      <Icon className="size-4" />
                      {meta.column}
                    </CardDescription>
                    <Badge variant={meta.badge}>{features.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {features.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-border bg-white/70 p-6">
                      <p className="text-sm leading-6 text-muted-foreground">Nada en esta columna.</p>
                    </div>
                  ) : (
                    features.map((feature) => <FeatureCard key={feature.id} feature={feature} />)
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Contexto: lo construido de mas, y lo que hay que pagar. */}
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Card className="bg-admin-panel">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Sparkles className="size-4" />
                Fuera del alcance del MVP
              </CardDescription>
              <CardTitle className="admin-heading text-3xl">Ya construido de mas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {BEYOND_MVP.map((item) => (
                  <div key={item.title} className="rounded-[24px] border border-border/70 bg-white/80 p-5">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-admin-panel">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="size-4" />
                No bloquea el MVP, pero esta ahi
              </CardDescription>
              <CardTitle className="admin-heading text-3xl">Deuda tecnica</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-admin-navy text-white">
          <CardContent className="flex flex-col gap-4 p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="rounded-2xl bg-white/10 p-3">
                <Target className="size-5 text-orange-200" />
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
