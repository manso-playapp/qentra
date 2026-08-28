import type { ReactNode } from 'react'
import RoleAccessDeniedNotice from '@/components/auth/RoleAccessDeniedNotice'
import { AdminAccessProvider } from '@/components/admin/AdminAccessContext'
import { requireAuthenticatedPageAccess } from '@/lib/operator-auth'
import { isAlistaStaff } from '@/lib/event-access'

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Panel',
}

type AdminProtectedLayoutProps = {
  children: ReactNode
}

export default async function AdminProtectedLayout({
  children,
}: AdminProtectedLayoutProps) {
  // El panel esta abierto a cualquier persona autenticada: una clienta entra por
  // ser duena de su evento, no por tener un rol. Lo que ve adentro lo decide su
  // acceso a cada evento, y las secciones internas siguen con su propio guard.
  const access = await requireAuthenticatedPageAccess('/admin')

  if (!access.ok) {
    return <RoleAccessDeniedNotice areaLabel="admin" reason={access.reason} />
  }

  const { user, operatorProfile } = access.account
  const metadata = user.user_metadata as { full_name?: string; name?: string } | undefined

  return (
    <AdminAccessProvider
      profile={operatorProfile}
      identity={{
        email: user.email ?? null,
        name: operatorProfile?.full_name || metadata?.full_name || metadata?.name || null,
        isStaff: isAlistaStaff(access.account.access),
      }}
    >
      {children}
    </AdminAccessProvider>
  )
}
