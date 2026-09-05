import { ImageResponse } from 'next/og'

export const alt = 'Alista - Sus 15. Su estilo. Vos, presente.'
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
          background: '#171714',
        }}
      >
        <div style={{ display: 'flex', fontSize: 44, fontWeight: 700, letterSpacing: '-1px' }}>
          Alista
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '970px' }}>
          <div style={{ display: 'flex', fontSize: 82, lineHeight: 0.95, fontWeight: 800, letterSpacing: '-5px' }}>
            {'Sus 15. Su estilo. Vos, presente.'}
          </div>
          <div style={{ display: 'flex', marginTop: '28px', fontSize: 31, lineHeight: 1.3, color: '#ff8b70' }}>
            {'Personalización y acompañamiento.'}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#d9ee73' }}>alista.com.ar</div>
      </div>
    ),
    size,
  )
}
