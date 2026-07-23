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
  { top: 3, left: 36, size: 1, duration: 21, delay: -13, opacity: 0.46 },
  { top: 16, left: 63, size: 6, duration: 30, delay: -27, opacity: 0.22 },
  { top: 23, left: 3, size: 2, duration: 16, delay: -6, opacity: 0.56 },
  { top: 38, left: 56, size: 5, duration: 25, delay: -18, opacity: 0.27 },
  { top: 45, left: 96, size: 1, duration: 20, delay: -4, opacity: 0.52 },
  { top: 59, left: 22, size: 6, duration: 31, delay: -23, opacity: 0.2 },
  { top: 67, left: 80, size: 2, duration: 17, delay: -10, opacity: 0.5 },
  { top: 75, left: 33, size: 5, duration: 29, delay: -25, opacity: 0.24 },
  { top: 82, left: 91, size: 1, duration: 22, delay: -9, opacity: 0.58 },
  { top: 97, left: 16, size: 4, duration: 24, delay: -16, opacity: 0.3 },
  { top: 29, left: 69, size: 1, duration: 18, delay: -1, opacity: 0.55 },
  { top: 54, left: 5, size: 5, duration: 28, delay: -22, opacity: 0.23 },
  { top: 89, left: 64, size: 2, duration: 19, delay: -12, opacity: 0.47 },
  { top: 7, left: 55, size: 2, duration: 23, delay: -15, opacity: 0.44 },
  { top: 14, left: 95, size: 4, duration: 27, delay: -8, opacity: 0.3 },
  { top: 21, left: 31, size: 1, duration: 18, delay: -4, opacity: 0.58 },
  { top: 26, left: 57, size: 5, duration: 32, delay: -29, opacity: 0.2 },
  { top: 33, left: 90, size: 3, duration: 20, delay: -11, opacity: 0.43 },
  { top: 39, left: 11, size: 1, duration: 16, delay: -7, opacity: 0.54 },
  { top: 44, left: 72, size: 4, duration: 26, delay: -21, opacity: 0.31 },
  { top: 50, left: 38, size: 2, duration: 22, delay: -14, opacity: 0.49 },
  { top: 57, left: 98, size: 5, duration: 29, delay: -19, opacity: 0.25 },
  { top: 62, left: -4, size: 1, duration: 17, delay: -5, opacity: 0.57 },
  { top: 69, left: 52, size: 3, duration: 24, delay: -17, opacity: 0.37 },
  { top: 73, left: 17, size: 2, duration: 21, delay: -9, opacity: 0.5 },
  { top: 80, left: 48, size: 6, duration: 33, delay: -30, opacity: 0.19 },
  { top: 85, left: 28, size: 1, duration: 19, delay: -13, opacity: 0.56 },
  { top: 91, left: 84, size: 3, duration: 25, delay: -22, opacity: 0.35 },
  { top: 96, left: 39, size: 2, duration: 23, delay: -16, opacity: 0.45 },
  { top: 10, left: 24, size: 5, duration: 28, delay: -26, opacity: 0.24 },
  { top: 18, left: 76, size: 1, duration: 17, delay: -6, opacity: 0.55 },
  { top: 36, left: 42, size: 3, duration: 22, delay: -18, opacity: 0.39 },
  { top: 47, left: 15, size: 2, duration: 20, delay: -10, opacity: 0.51 },
  { top: 53, left: 82, size: 4, duration: 30, delay: -24, opacity: 0.28 },
  { top: 66, left: 66, size: 1, duration: 18, delay: -3, opacity: 0.59 },
  { top: 77, left: 5, size: 3, duration: 26, delay: -20, opacity: 0.33 },
  { top: 88, left: 74, size: 5, duration: 31, delay: -28, opacity: 0.21 },
  { top: 99, left: 30, size: 1, duration: 16, delay: -2, opacity: 0.56 },
  { top: 2, left: 71, size: 3, duration: 24, delay: -12, opacity: 0.41 },
  { top: 24, left: 86, size: 2, duration: 21, delay: -16, opacity: 0.47 },
  { top: 41, left: 34, size: 6, duration: 34, delay: -31, opacity: 0.18 },
  { top: 58, left: 50, size: 1, duration: 19, delay: -8, opacity: 0.53 },
  { top: 70, left: 94, size: 4, duration: 27, delay: -23, opacity: 0.29 },
  { top: 83, left: 58, size: 2, duration: 22, delay: -15, opacity: 0.46 },
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
