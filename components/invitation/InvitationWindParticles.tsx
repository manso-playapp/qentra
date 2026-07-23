type Particle = {
  top: number
  left: number
  size: number
  duration: number
  delay: number
  opacity: number
}

const PARTICLES: Particle[] = [
  { top: 5, left: -12, size: 3, duration: 18, delay: -5, opacity: 0.42 },
  { top: 12, left: 14, size: 2, duration: 24, delay: -17, opacity: 0.5 },
  { top: 19, left: 47, size: 4, duration: 21, delay: -9, opacity: 0.34 },
  { top: 27, left: 74, size: 2, duration: 26, delay: -14, opacity: 0.55 },
  { top: 35, left: -8, size: 3, duration: 23, delay: -19, opacity: 0.38 },
  { top: 42, left: 29, size: 2, duration: 19, delay: -3, opacity: 0.48 },
  { top: 48, left: 60, size: 4, duration: 28, delay: -24, opacity: 0.28 },
  { top: 56, left: 88, size: 2, duration: 20, delay: -8, opacity: 0.5 },
  { top: 64, left: 8, size: 3, duration: 25, delay: -16, opacity: 0.36 },
  { top: 71, left: 40, size: 2, duration: 18, delay: -12, opacity: 0.54 },
  { top: 78, left: 70, size: 4, duration: 27, delay: -21, opacity: 0.3 },
  { top: 86, left: -5, size: 2, duration: 22, delay: -7, opacity: 0.48 },
  { top: 8, left: 82, size: 2, duration: 29, delay: -11, opacity: 0.4 },
  { top: 31, left: 18, size: 4, duration: 24, delay: -20, opacity: 0.26 },
  { top: 52, left: 45, size: 2, duration: 17, delay: -2, opacity: 0.55 },
  { top: 93, left: 52, size: 3, duration: 26, delay: -15, opacity: 0.36 },
]

export default function InvitationWindParticles() {
  return (
    <div className="invitation-wind-particles" aria-hidden="true">
      {PARTICLES.map((particle, index) => (
        <span
          key={index}
          className="invitation-wind-particle"
          style={{
            top: `${particle.top}%`,
            left: `${particle.left}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
