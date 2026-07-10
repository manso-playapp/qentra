// El listado de eventos es un client component, por eso el título vive en este
// layout (los client components no pueden exportar `metadata`).
export const metadata = {
  title: 'Eventos',
}

export default function EventsListLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
