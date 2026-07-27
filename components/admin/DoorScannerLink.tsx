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
    <section className="rounded-[24px] border border-sky-300/60 bg-slate-950 p-4 text-white shadow-[0_18px_40px_rgba(2,8,23,0.32)]">
      <div className="flex items-center gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-sm">
          {qrImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrImage} alt="QR para abrir modo puerta" className="size-full" />
          ) : (
            <QrCode className="size-8 text-sky-700" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200">Escaner movil</p>
          <h2 className="mt-1 text-base font-semibold text-white">Abrí el escáner desde otro celular</h2>
          <p className="mt-1 text-xs leading-5 text-sky-100/80">
            Escaneá este código con el celular de control. La pantalla pide una sesión de operador antes de habilitar la cámara.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3 border-white bg-white text-slate-950 hover:bg-sky-100 hover:text-slate-950">
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
