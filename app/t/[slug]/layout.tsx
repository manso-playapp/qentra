import type { ReactNode } from 'react'
import RoleAccessDeniedNotice from '@/components/auth/RoleAccessDeniedNotice'
import { requireAuthorizedPageAccess } from '@/lib/operator-auth'

type ShortTotemProtectedLayoutProps = {
  children: ReactNode
  params: Promise<{ slug: string }>
}

export default async function ShortTotemProtectedLayout({
  children,
  params,
}: ShortTotemProtectedLayoutProps) {
  const { slug } = await params
  const access = await requireAuthorizedPageAccess(`/t/${slug}`, ['admin', 'door', 'security_supervisor'])

  if (!access.ok) {
    return <RoleAccessDeniedNotice areaLabel="totem" reason={access.reason} />
  }

  return children
}
