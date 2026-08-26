'use client'

import { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'

type RaysOrigin = 'top-center' | 'top-left' | 'top-right'

type InvitationLightRaysProps = {
  raysOrigin?: RaysOrigin
  raysColor?: string
  raysSpeed?: number
  lightSpread?: number
  rayLength?: number
  pulsating?: boolean
  fadeDistance?: number
  saturation?: number
  distortion?: number
}

type Vec2 = [number, number]

function hexToRgb(hex: string): [number, number, number] {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return match ? [parseInt(match[1], 16) / 255, parseInt(match[2], 16) / 255, parseInt(match[3], 16) / 255] : [1, 1, 1]
}

function getAnchorAndDirection(origin: RaysOrigin, width: number, height: number): { anchor: Vec2; direction: Vec2 } {
  const outside = 0.2
  if (origin === 'top-left') return { anchor: [0, -outside * height], direction: [0, 1] }
  if (origin === 'top-right') return { anchor: [width, -outside * height], direction: [0, 1] }
  return { anchor: [0.5 * width, -outside * height], direction: [0, 1] }
}

export default function InvitationLightRays({
  raysOrigin = 'top-center',
  raysColor = '#f3a6b8',
  raysSpeed = 0.16,
  lightSpread = 1.35,
  rayLength = 4,
  pulsating = true,
  fadeDistance = 1.7,
  saturation = 0.82,
  distortion = 0.12,
}: InvitationLightRaysProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let renderer: Renderer | null = null
    let frameId = 0
    let disposed = false

    try {
      renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true })
      const gl = renderer.gl
      gl.canvas.style.width = '100%'
      gl.canvas.style.height = '100%'
      gl.canvas.style.mixBlendMode = 'screen'
      container.replaceChildren(gl.canvas)

      const vertex = `
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
          vUv = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }`
      const fragment = `
        precision highp float;
        uniform float iTime;
        uniform vec2 iResolution;
        uniform vec2 rayPos;
        uniform vec2 rayDir;
        uniform vec3 raysColor;
        uniform float raysSpeed;
        uniform float lightSpread;
        uniform float rayLength;
        uniform float pulsating;
        uniform float fadeDistance;
        uniform float saturation;
        uniform float distortion;
        varying vec2 vUv;

        float noise(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        float rayStrength(vec2 source, vec2 direction, vec2 coord, float seedA, float seedB, float speed) {
          vec2 sourceToCoord = coord - source;
          vec2 dirNorm = normalize(sourceToCoord);
          float cosAngle = dot(dirNorm, direction);
          float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
          float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
          float distance = length(sourceToCoord);
          float maxDistance = iResolution.x * rayLength;
          float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
          float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
          float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;
          float strength = clamp((0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) + (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)), 0.0, 1.0);
          return strength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
        }
        void main() {
          vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
          vec4 rays = vec4(1.0) * rayStrength(rayPos, rayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed) * 0.5;
          rays += vec4(1.0) * rayStrength(rayPos, rayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed) * 0.4;
          float n = noise(coord * 0.01 + iTime * 0.1);
          rays.rgb *= 0.96 + 0.04 * n;
          float brightness = 1.0 - coord.y / iResolution.y;
          rays.r *= 0.1 + brightness * 0.8;
          rays.g *= 0.3 + brightness * 0.6;
          rays.b *= 0.5 + brightness * 0.5;
          float gray = dot(rays.rgb, vec3(0.299, 0.587, 0.114));
          rays.rgb = mix(vec3(gray), rays.rgb, saturation) * raysColor;
          gl_FragColor = rays;
        }`

      const uniforms = {
        iTime: { value: 0 },
        iResolution: { value: [1, 1] as Vec2 },
        rayPos: { value: [0, 0] as Vec2 },
        rayDir: { value: [0, 1] as Vec2 },
        raysColor: { value: hexToRgb(raysColor) },
        raysSpeed: { value: raysSpeed },
        lightSpread: { value: lightSpread },
        rayLength: { value: rayLength },
        pulsating: { value: pulsating ? 1 : 0 },
        fadeDistance: { value: fadeDistance },
        saturation: { value: saturation },
        distortion: { value: distortion },
      }
      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program: new Program(gl, { vertex, fragment, uniforms }) })

      const resize = () => {
        if (!renderer || disposed) return
        renderer.dpr = Math.min(window.devicePixelRatio, 2)
        renderer.setSize(container.clientWidth, container.clientHeight)
        const width = container.clientWidth * renderer.dpr
        const height = container.clientHeight * renderer.dpr
        uniforms.iResolution.value = [width, height]
        const placement = getAnchorAndDirection(raysOrigin, width, height)
        uniforms.rayPos.value = placement.anchor
        uniforms.rayDir.value = placement.direction
      }

      const render = (time: number) => {
        if (!renderer || disposed) return
        uniforms.iTime.value = time * 0.001
        renderer.render({ scene: mesh })
        frameId = requestAnimationFrame(render)
      }

      resize()
      frameId = requestAnimationFrame(render)
      window.addEventListener('resize', resize)
      return () => {
        disposed = true
        cancelAnimationFrame(frameId)
        window.removeEventListener('resize', resize)
        const loseContext = renderer?.gl.getExtension('WEBGL_lose_context')
        loseContext?.loseContext()
        renderer = null
      }
    } catch {
      // WebGL no es imprescindible para leer la invitación; el resplandor CSS
      // queda como fallback en dispositivos que no soporten el contexto.
      return () => {
        disposed = true
        cancelAnimationFrame(frameId)
      }
    }
  }, [distortion, fadeDistance, lightSpread, pulsating, rayLength, raysColor, raysOrigin, raysSpeed, saturation])

  return <div ref={containerRef} className="invitation-light-rays" aria-hidden="true" />
}
