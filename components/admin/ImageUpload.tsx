'use client'

import { useRef, useState } from 'react'
import { ImageUp, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getErrorMessage } from '@/lib/errors'

type ImageUploadProps = {
  label: string
  hint?: string
  value: string
  onChange: (url: string) => void
  bucket: 'event-assets' | 'guest-photos'
  folder: string
  /** Identifica el archivo dentro de la carpeta (ej. 'logo', 'cover'). */
  fileLabel: string
}

export default function ImageUpload({
  label,
  hint,
  value,
  onChange,
  bucket,
  folder,
  fileLabel,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('bucket', bucket)
      body.append('folder', folder)
      body.append('label', fileLabel)

      const response = await fetch('/api/uploads', { method: 'POST', body })
      const payload = (await response.json().catch(() => null)) as
        | { data?: { url: string }; error?: string }
        | null

      if (!response.ok || !payload?.data?.url) {
        throw new Error(payload?.error || 'No se pudo subir la imagen.')
      }

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

      <div className="mt-2 flex items-center gap-4">
        <div className="flex size-20 flex-none items-center justify-center overflow-hidden rounded-2xl border border-border bg-white/70">
          {value ? (
            // Las URLs vienen de Storage (publicas o firmadas), fuera del config de next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="size-full object-contain" />
          ) : (
            <ImageUp className="size-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
              {uploading ? 'Subiendo…' : value ? 'Reemplazar' : 'Subir imagen'}
            </Button>

            {value && !uploading && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
                <X className="size-4" />
                Quitar
              </Button>
            )}
          </div>

          {hint && <p className="text-xs leading-5 text-muted-foreground">{hint}</p>}
          {error && <p className="text-xs leading-5 text-rose-600">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />
    </div>
  )
}
