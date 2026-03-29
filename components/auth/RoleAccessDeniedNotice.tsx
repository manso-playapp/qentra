type RoleAccessDeniedNoticeProps = {
  areaLabel: string
  reason: 'missing_profile' | 'inactive_profile' | 'missing_role'
}

function getReasonCopy(reason: RoleAccessDeniedNoticeProps['reason']) {
  switch (reason) {
    case 'missing_profile':
      return 'Tu usuario existe en Auth, pero todavia no tiene un perfil operativo asignado en operator_profiles.'
    case 'inactive_profile':
      return 'Tu perfil operativo existe, pero figura inactivo.'
    case 'missing_role':
      return 'Tu sesion es valida, pero no tiene el rol necesario para abrir esta superficie.'
    default:
      return 'No tienes acceso a esta superficie.'
  }
}

export default function RoleAccessDeniedNotice({
  areaLabel,
  reason,
}: RoleAccessDeniedNoticeProps) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-red-500/20 bg-slate-900/85 p-8 shadow-2xl shadow-black/30">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-300">
          Acceso denegado
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-white">
          No puedes abrir {areaLabel}
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          {getReasonCopy(reason)}
        </p>
      </div>
    </main>
  )
}
