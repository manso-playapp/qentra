import type { ReactNode } from 'react'
import RoleAccessDeniedNotice from '@/components/auth/RoleAccessDeniedNotice'
import { requireAuthorizedPageAccess } from '@/lib/operator-auth'

type DoorProtectedLayoutProps = {
  children: ReactNode
  params: Promise<{ id: string }>
}

export default async function DoorProtectedLayout({
  children,
  params,
}: DoorProtectedLayoutProps) {
  const { id } = await params
  const access = await requireAuthorizedPageAccess(`/puerta/${id}`, ['admin', 'door', 'security_supervisor'])

  if (!access.ok) {
    return <RoleAccessDeniedNotice areaLabel="puerta" reason={access.reason} />
  }

  return children
}
