'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { OperatorProfile } from '@/lib/operator-auth'

/** Quién está usando el panel. Con clientes y equipo conviviendo, tiene que ser visible. */
export type AdminIdentity = {
  email: string | null
  name: string | null
  isStaff: boolean
}

type AdminAccessValue = {
  /** `null` = clienta: entra por ser dueña de su evento, no por un rol. */
  profile: OperatorProfile | null
  identity: AdminIdentity
}

const AdminAccessContext = createContext<AdminAccessValue | null>(null)

export function AdminAccessProvider({
  profile,
  identity,
  children,
}: {
  profile: OperatorProfile | null
  identity: AdminIdentity
  children: ReactNode
}) {
  return (
    <AdminAccessContext.Provider value={{ profile, identity }}>
      {children}
    </AdminAccessContext.Provider>
  )
}

export function useAdminAccess() {
  const value = useContext(AdminAccessContext)
  if (!value) throw new Error('useAdminAccess debe usarse dentro de AdminAccessProvider.')
  return {
    profile: value.profile,
    identity: value.identity,
    isGlobalAdmin: value.identity.isStaff,
  }
}
