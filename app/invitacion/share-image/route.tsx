import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

const markGradientId = 'alista-mark-gradient'

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
        <svg width="360" height="310" viewBox="0 0 449 387" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={markGradientId} x1="75" y1="193" x2="374" y2="193" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#009cdd" />
              <stop offset="0.5" stopColor="#4171b1" />
              <stop offset="1" stopColor="#213480" />
            </linearGradient>
          </defs>
          <path
            d="M75 311.5 223.5 75 374 311.5"
            fill="none"
            stroke={`url(#${markGradientId})`}
            strokeWidth="142"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
