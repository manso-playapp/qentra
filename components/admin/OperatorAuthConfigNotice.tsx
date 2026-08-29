type OperatorAuthConfigNoticeProps = {
  areaLabel: string
}

export default function OperatorAuthConfigNotice({
  areaLabel,
}: OperatorAuthConfigNoticeProps) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-amber-500/30 bg-slate-900/80 p-8 shadow-2xl shadow-black/30">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
          Acceso protegido
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-white">
          Esta sección todavía no está disponible
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          La vista de {areaLabel} está protegida y necesita una configuración adicional antes
          de poder usarse.
        </p>
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
          Contactá al equipo de Alista para completar la configuración y habilitar este acceso.
        </div>
      </div>
    </main>
  )
}
