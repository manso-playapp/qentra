/**
 * Decoracion de marca, puramente visual (aria-hidden): confeti sutil que aporta
 * el tono festivo juvenil, sobre glows suaves que sostienen el tono serio de
 * gestion. Pensado para vivir detras del contenido de un hero.
 *
 * El confeti se agrupa hacia la derecha y los bordes para no competir con el
 * texto, que va alineado a la izquierda. Posiciones fijas a proposito: sin
 * aleatoriedad, para que el render sea estable.
 */
type FestiveBackdropProps = {
  tone?: 'light' | 'navy'
}

type Confetti = {
  left: string
  top: string
  size: number
  rotate: number
  round?: boolean
  color: number
}

const CONFETTI: Confetti[] = [
  { left: '62%', top: '12%', size: 10, rotate: 18, color: 0 },
  { left: '78%', top: '6%', size: 8, rotate: -12, round: true, color: 1 },
  { left: '88%', top: '22%', size: 12, rotate: 32, color: 2 },
  { left: '70%', top: '34%', size: 7, rotate: -24, color: 3 },
  { left: '94%', top: '44%', size: 9, rotate: 12, round: true, color: 0 },
  { left: '83%', top: '58%', size: 11, rotate: -18, color: 1 },
  { left: '66%', top: '70%', size: 8, rotate: 26, round: true, color: 2 },
  { left: '90%', top: '78%', size: 10, rotate: -8, color: 3 },
  { left: '10%', top: '80%', size: 9, rotate: 20, color: 1 },
  { left: '24%', top: '90%', size: 7, rotate: -16, round: true, color: 0 },
  { left: '4%', top: '30%', size: 8, rotate: 14, color: 3 },
  { left: '16%', top: '14%', size: 6, rotate: -28, round: true, color: 2 },
]

export function FestiveBackdrop({ tone = 'light' }: FestiveBackdropProps) {
  const palette =
    tone === 'navy'
      ? ['#7dd3fc', '#38bdf8', '#a5b4fc', '#fbcfe8']
      : ['#009cdd', '#16215a', '#f59e0b', '#ec4899']

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Glows: la capa "seria", suave y difusa. */}
      <div className="absolute -left-24 -top-28 size-72 rounded-full bg-brand-cyan/10 blur-3xl" />
      <div className="absolute -right-20 top-16 size-80 rounded-full bg-primary/10 blur-3xl" />

      {/* Confeti: la capa "festiva". */}
      {CONFETTI.map((bit, index) => (
        <span
          key={index}
          className={tone === 'navy' ? 'absolute opacity-50' : 'absolute opacity-60'}
          style={{
            left: bit.left,
            top: bit.top,
            width: `${bit.size}px`,
            height: `${bit.size}px`,
            backgroundColor: palette[bit.color],
            borderRadius: bit.round ? '9999px' : '2px',
            transform: `rotate(${bit.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}
