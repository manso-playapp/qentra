import type { ReactNode } from 'react'
import GlobalAdminGuard from '@/components/auth/GlobalAdminGuard'

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <GlobalAdminGuard nextPath="/admin/settings" areaLabel="la configuracion global">{children}</GlobalAdminGuard>
}
