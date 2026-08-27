import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#171714',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 360,
            height: 310,
            color: '#009cdd',
            fontSize: 360,
            fontWeight: 800,
            lineHeight: 1,
            fontFamily: 'sans-serif',
          }}
        >
          A
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
