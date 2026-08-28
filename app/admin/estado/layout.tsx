import type { ReactNode } from 'react'
import GlobalAdminGuard from '@/components/auth/GlobalAdminGuard'

export default function StatusLayout({ children }: { children: ReactNode }) {
  return <GlobalAdminGuard nextPath="/admin/estado" areaLabel="el estado global">{children}</GlobalAdminGuard>
}
