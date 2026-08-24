import { DharmaCaseStudy } from '@/components/marketing/DharmaCaseStudy'
import { ClosingCta, PageHero } from '@/components/marketing/sections'
import { createMarketingMetadata } from '@/lib/marketing-seo'

export const metadata = createMarketingMetadata({
  title: 'Caso Dharma: Alista en una fiesta de 15',
  description:
    'Recorré el caso real de Dharma: invitación, preparación y validación de acceso con Alista.',
  path: '/casos',
})

export default function CasosPage() {
  return (
    <>
      <PageHero
        eyebrow="Caso real · Dharma"
        title="Una experiencia que empezó"
        highlight="mucho antes de la fiesta."
        description="Este caso reúne material real del evento y del producto para mostrar cómo la invitación, la preparación y la llegada pueden formar parte de una misma historia."
        primaryCta={{ href: '/demo', label: 'Quiero verlo para mis 15' }}
        secondaryCta={{ href: '/profesionales', label: 'Lo quiero en mi servicio' }}
      />
      <DharmaCaseStudy />
      <ClosingCta
        title="La próxima historia puede empezar ahora."
        description="Primero te mostramos cómo se vería Alista en tu fiesta. Sin iniciar un pago ni crear un evento."
      />
    </>
  )
}
