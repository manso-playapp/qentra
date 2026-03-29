import type { ReactNode } from 'react'
import RoleAccessDeniedNotice from '@/components/auth/RoleAccessDeniedNotice'
import { requireAuthorizedPageAccess } from '@/lib/operator-auth'

type TotemProtectedLayoutProps = {
  children: ReactNode
  params: Promise<{ id: string }>
}

export default async function TotemProtectedLayout({
  children,
  params,
}: TotemProtectedLayoutProps) {
  const { id } = await params
  const access = await requireAuthorizedPageAccess(`/totem/${id}`, ['admin', 'door', 'security_supervisor'])

  if (!access.ok) {
    return <RoleAccessDeniedNotice areaLabel="totem" reason={access.reason} />
  }

  return children
}
