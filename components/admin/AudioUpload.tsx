'use client'

import { Loader2, Music2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getErrorMessage } from '@/lib/errors'

type AudioUploadProps = {
  label: string
  hint?: string
  value: string
  onChange: (url: string) => void
  uploadUrl?: string
  fields?: Record<string, string>
}

export default function AudioUpload({ label, hint, value, onChange, uploadUrl = '/api/uploads', fields = {} }: AudioUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      for (const [key, fieldValue] of Object.entries(fields)) body.append(key, fieldValue)

      const response = await fetch(uploadUrl, { method: 'POST', body })
      const payload = (await response.json().catch(() => null)) as { data?: { url: string }; error?: string } | null
      if (!response.ok || !payload?.data?.url) throw new Error(payload?.error || 'No se pudo subir el audio.')
      onChange(payload.data.url)
    } catch (uploadError) {
      setError(getErrorMessage(uploadError))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3">
        <div className="flex items-center gap-3">
          <Music2 className="size-5 shrink-0 text-gray-500" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800">{value ? 'Audio cargado' : 'Sin audio cargado'}</p>
            {value && <audio controls preload="metadata" src={value} className="mt-2 h-8 w-full" />}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? 'Subiendo…' : value ? 'Reemplazar audio' : 'Subir audio'}
          </Button>
          {value && !uploading && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
              <X className="size-4" />
              Quitar
            </Button>
          )}
        </div>
        {hint && <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p>}
        {error && <p className="mt-2 text-xs leading-5 text-rose-600">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm,audio/aac"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />
    </div>
  )
}
