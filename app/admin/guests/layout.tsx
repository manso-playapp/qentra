import type { ReactNode } from 'react'
import GlobalAdminGuard from '@/components/auth/GlobalAdminGuard'

export default function GlobalGuestsLayout({ children }: { children: ReactNode }) {
  return <GlobalAdminGuard nextPath="/admin/guests" areaLabel="los invitados globales">{children}</GlobalAdminGuard>
}
