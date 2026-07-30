import { ImageResponse } from 'next/og'

export const alt = 'Alista - Gestion de invitados, pagos y accesos para eventos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          color: '#ffffff',
          background: 'linear-gradient(135deg, #101b4d 0%, #203a7a 54%, #16a8b6 100%)',
        }}
      >
        <div style={{ display: 'flex', fontSize: 44, fontWeight: 700, letterSpacing: '-1px' }}>
          Alista
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '970px' }}>
          <div style={{ display: 'flex', fontSize: 76, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-4px' }}>
            {'Invitaci\u00f3n, pago y acceso.'}
          </div>
          <div style={{ display: 'flex', marginTop: '28px', fontSize: 31, lineHeight: 1.3, color: '#d4f7f7' }}>
            {'Gesti\u00f3n de invitados y cupo para eventos privados.'}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#b8e8ef' }}>alista.com.ar</div>
      </div>
    ),
    size,
  )
}
