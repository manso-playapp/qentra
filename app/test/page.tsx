'use client'

import { useEffect, useState } from 'react'
import { getErrorMessage } from '@/lib/errors'
import { supabase } from '@/lib/supabase'

interface TableStatus {
  name: string
  exists: boolean
  count?: number
  error?: string
}

const REQUIRED_TABLES = [
  'events',
  'event_branding',
  'guest_types',
  'guests',
  'invitation_tokens',
  'guest_qr_codes',
  'checkins',
  'totem_sessions',
]

export default function TestSupabase() {
  const [status, setStatus] = useState<string>('Verificando...')
  const [tables, setTables] = useState<TableStatus[]>([])
  const [error, setError] = useState<string | null>(null)
  const [connectionOk, setConnectionOk] = useState<boolean>(false)

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus('Verificando conexión...')

        // Test basic connection
        const { error: authError } = await supabase.auth.getSession()

        if (authError) {
          throw authError
        }

        setConnectionOk(true)
        setStatus('Conexión OK. Verificando tablas...')

        // Check each table
        const tableStatuses: TableStatus[] = []

        for (const tableName of REQUIRED_TABLES) {
          try {
            const { error, count } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true })

            if (error) {
              tableStatuses.push({
                name: tableName,
                exists: false,
                error: error.message
              })
            } else {
              tableStatuses.push({
                name: tableName,
                exists: true,
                count: count || 0
              })
            }
          } catch (error) {
            tableStatuses.push({
              name: tableName,
              exists: false,
              error: getErrorMessage(error)
            })
          }
        }

        setTables(tableStatuses)
        setStatus('Verificación completa')
        setError(null)

      } catch (error) {
        setError(getErrorMessage(error))
        setStatus('✗ Error de conexión')
        setConnectionOk(false)
      }
    }

    testConnection()
  }, [])

  const allTablesExist = tables.length > 0 && tables.every(t => t.exists)
  const totalRecords = tables.reduce((sum, t) => sum + (t.count || 0), 0)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="rounded-lg border border-gray-200 p-8 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-6">Estado Qentra Database</h2>

        {/* Connection Status */}
        <div className={`mb-6 p-4 rounded-lg ${connectionOk ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center">
            <span className={`text-lg mr-2 ${connectionOk ? 'text-green-600' : 'text-red-600'}`}>
              {connectionOk ? '✓' : '✗'}
            </span>
            <p className="font-medium">{status}</p>
          </div>
        </div>

        {/* Tables Status */}
        {tables.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Tablas ({tables.filter(t => t.exists).length}/{REQUIRED_TABLES.length})</h3>
            <div className="space-y-2">
              {tables.map((table) => (
                <div key={table.name} className={`p-3 rounded border ${table.exists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">{table.name}</span>
                    <div className="flex items-center">
                      {table.exists ? (
                        <>
                          <span className="text-green-600 mr-2">✓</span>
                          <span className="text-sm text-gray-600">({table.count} registros)</span>
                        </>
                      ) : (
                        <span className="text-red-600">✗ {table.error}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {allTablesExist && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">✅ Base de datos lista</h4>
            <p className="text-sm text-blue-700">
              Todas las tablas existen. Total de registros: {totalRecords}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">Error</h4>
            <p className="text-sm text-red-700 font-mono">{error}</p>
          </div>
        )}

        {/* Next Steps */}
        <div className="border-t pt-6">
          <h4 className="font-semibold mb-3">Próximos pasos:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            {!allTablesExist && <li>Crear tablas faltantes en Supabase</li>}
            <li>Ejecutar políticas RLS (ver supabase-schema.sql)</li>
            <li>Crear primer módulo: Qentra Admin</li>
            <li>Implementar autenticación de usuarios</li>
          </ol>
        </div>

        {/* Credentials */}
        <div className="mt-6 pt-6 border-t text-xs text-gray-600">
          <p className="font-bold mb-2">Credenciales:</p>
          <code className="block mb-1">URL: {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 35)}...</code>
          <code className="block">KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 35)}...</code>
        </div>
      </div>
    </div>
  )
}
