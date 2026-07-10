import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = {
  title: 'Invitados',
}

// Ruta sin entrada en el nav: la vista global todavia no existe. Los invitados
// se gestionan dentro de cada evento. Cuando se construya el modelo
// transversal, esta pagina pasa a ser la vista maestra.
export default function GuestsPage() {
  return (
    <AdminLayout>
      <div className="px-4 py-6 sm:px-0">
        <Card className="bg-admin-panel">
          <CardContent className="px-6 py-16 text-center">
            <h2 className="admin-heading text-4xl text-foreground">
              La vista global de invitados no existe todavía
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              Por ahora los invitados se cargan, se editan y se acreditan dentro de cada evento. Buscar
              entre eventos y detectar repetidos queda para cuando construyamos el modelo transversal.
            </p>
            <Button asChild className="mt-6">
              <Link href="/admin/events">Ir a eventos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
