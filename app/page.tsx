import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Qentra</h1>
        <p className="text-lg text-gray-600 mb-8">
          Platform de eventos
        </p>

        <div className="space-y-4">
          <Link
            href="/admin"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Ir al Admin
          </Link>

          <div className="text-sm text-gray-500">
            <Link href="/test" className="underline hover:text-gray-700">
              Ver estado de la base de datos
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
