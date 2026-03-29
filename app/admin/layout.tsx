import type { ReactNode } from 'react'
import RoleAccessDeniedNotice from '@/components/auth/RoleAccessDeniedNotice'
import { requireAuthorizedPageAccess } from '@/lib/operator-auth'

type AdminProtectedLayoutProps = {
  children: ReactNode
}

export default async function AdminProtectedLayout({
  children,
}: AdminProtectedLayoutProps) {
  const access = await requireAuthorizedPageAccess('/admin', ['admin'])

  if (!access.ok) {
    return <RoleAccessDeniedNotice areaLabel="admin" reason={access.reason} />
  }

  return children
}
