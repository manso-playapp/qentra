// El alta de evento es un client component; el título se define aquí.
export const metadata = {
  title: 'Nuevo evento',
};

export default function NewEventLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Sin guard de rol: crear un evento esta abierto a cualquier persona
  // autenticada, que queda como duena. El layout de /admin ya exige sesion.
  return children
}

