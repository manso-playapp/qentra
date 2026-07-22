'use client'

import QRCode from 'qrcode'
import { ExternalLink, QrCode } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function DoorScannerLink({ eventId }: { eventId: string }) {
  const [qrImage, setQrImage] = useState('')
  const doorPath = `/puerta/${eventId}`

  useEffect(() => {
    void QRCode.toDataURL(`${window.location.origin}${doorPath}`, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 360,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(setQrImage)
  }, [doorPath])

  return (
    <section className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex size-28 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
          {qrImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrImage} alt="QR para abrir modo puerta" className="size-full" />
          ) : (
            <QrCode className="size-10 text-sky-700" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">Dispositivo de puerta</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">Abrí el escáner desde otro celular</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Escaneá este código con el celular de control. La pantalla pide una sesión de operador antes de habilitar la cámara.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4 border-sky-300 bg-white text-sky-800 hover:bg-sky-100">
            <a href={doorPath} target="_blank" rel="noreferrer">
              Abrir modo puerta
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
