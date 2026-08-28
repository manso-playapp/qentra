import type { ReactNode } from 'react'
import RoleAccessDeniedNotice from '@/components/auth/RoleAccessDeniedNotice'
import { requireAuthorizedPageAccess } from '@/lib/operator-auth'

export default async function GlobalAdminGuard({
  children,
  nextPath,
  areaLabel,
}: {
  children: ReactNode
  nextPath: string
  areaLabel: string
}) {
  const access = await requireAuthorizedPageAccess(nextPath, ['admin'])
  if (!access.ok) return <RoleAccessDeniedNotice areaLabel={areaLabel} reason={access.reason} />
  return children
}
