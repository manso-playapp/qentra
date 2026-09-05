import { DharmaCaseStudy } from '@/components/marketing/DharmaCaseStudy'
import { ClosingCta, PageHero } from '@/components/marketing/sections'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Caso Dharma: Alista en una fiesta de 15',
  description:
    'Conocé la primera fiesta de 15 realizada con Alista: diseño, configuración acompañada y aprendizajes de la recepción.',
  path: '/casos',
})

export default function CasosPage() {
  return (
    <>
      <PageHero
        eyebrow="Caso real · Dharma"
        title="Una primera fiesta."
        highlight="Aprendizajes que acompañan a la próxima."
        description="Dharma fue nuestra primera experiencia real y funcionó muy bien. Compartimos el diseño, la preparación y lo aprendido en recepción para mostrar de dónde nace nuestro acompañamiento."
        primaryCta={{ href: '/demo', label: 'Consultar para mi fecha' }}
        secondaryCta={{ href: '/como-funciona', label: 'Conocer el acompañamiento' }}
      />
      <DharmaCaseStudy />
      <ClosingCta
        title="Contanos cómo imaginan sus 15."
        description="Revisamos la fecha y lo que necesitan delegar. Recibís una propuesta de diseño y acompañamiento con entregas, tiempos y precio total."
      />
    </>
  )
}
