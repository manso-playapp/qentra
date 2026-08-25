// La página de test es un client component; el título se define aquí.
export const metadata = {
  robots: { index: false, follow: false },
  title: 'Estado de la base de datos',
};

export default function TestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
