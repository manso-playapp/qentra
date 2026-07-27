'use client'

import { useState } from 'react'

type InvitationQrDownloadButtonProps = {
  qrCodeUrl: string
  fileName: string
  color: string
}

export default function InvitationQrDownloadButton({
  qrCodeUrl,
  fileName,
  color,
}: InvitationQrDownloadButtonProps) {
  const [message, setMessage] = useState('')

  async function saveQr() {
    setMessage('')

    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      const file = new File([blob], fileName, { type: 'image/png' })

      // En iPhone y en varios navegadores móviles, el atributo `download` no
      // funciona con data URLs. Compartir un archivo sí permite guardarlo en
      // Fotos o Archivos sin salir de la invitación.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'QR de acceso',
          text: 'Guardá este QR para presentarlo en la entrada.',
        })
        setMessage('QR listo para guardar en tu teléfono.')
        return
      }

      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000)
      setMessage('La descarga del QR comenzó.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setMessage('No se guardó el QR. Podés intentarlo de nuevo cuando quieras.')
        return
      }

      // Si el navegador bloquea tanto la descarga como compartir archivos,
      // mostramos la imagen para que pueda guardarse con una pulsación larga.
      window.open(qrCodeUrl, '_blank', 'noopener,noreferrer')
      setMessage('Abrimos el QR: mantenelo presionado para guardarlo.')
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => void saveQr()}
        className="inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-[0.97]"
        style={{ backgroundColor: color }}
      >
        Guardar QR en mi teléfono
      </button>
      {message && (
        <p className="mt-2 text-xs leading-5 text-slate-600" role="status">
          {message}
        </p>
      )}
    </div>
  )
}
