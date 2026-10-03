import { obtenerLotesConResumen } from '@/lib/modulos/lotes/servicio';

// Pantalla principal: muestra todos los lotes en producción
export default async function PaginaPrincipal() {
  const lotes = await obtenerLotesConResumen();

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <header className="h-16 px-8 flex items-center border-b-2 border-surface-container-highest bg-surface-container-lowest">
        <span className="font-headline font-bold uppercase tracking-wider">Chroma Check</span>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="font-headline text-3xl font-bold uppercase mb-8">
          Lotes en Producción Actual
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lotes.map((lote) => (
            <TarjetaLote key={lote.id} lote={lote} />
          ))}
        </div>
      </section>
    </main>
  );
}

// Una tarjeta individual de lote
function TarjetaLote({ lote }: { lote: any }) {
  const colorMuestra = lote.muestra_hex || '#555555';
  const desviacion = lote.desviacion_promedio ?? '—';

  return (
    <article className="bg-surface-container rounded-lg overflow-hidden shadow-md">
      <div className="p-5 flex items-center justify-between bg-surface-container-high">
        <div>
          <span className="text-xs uppercase text-on-surface-variant block">ID Lote</span>
          <span className="font-headline text-lg font-bold">{lote.codigo}</span>
        </div>
        <span className="px-3 py-1 bg-secondary-container text-secondary-fixed text-xs uppercase rounded">
          {lote.estado}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div
          className="w-full h-36 rounded-md flex items-end justify-between p-3"
          style={{ backgroundColor: colorMuestra }}
        >
          <span className="bg-surface-container-lowest/80 px-2 py-0.5 rounded text-xs uppercase">
            Muestra Real
          </span>
          <span className="bg-surface-container-lowest/80 px-2 py-0.5 rounded text-xs">
            Ref. {colorMuestra}
          </span>
        </div>

        <div className="bg-surface-container-low p-4 rounded flex items-center justify-between">
          <div>
            <span className="text-xs uppercase text-on-surface-variant block">Desviación Promedio</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-bold">{desviacion}</span>
              <span className="text-sm text-on-surface-variant">ΔE</span>
            </div>
          </div>
        </div>

        <a
          href={`/lotes/${lote.id}`}
          className="w-full h-14 bg-primary-container text-on-primary-container flex items-center justify-center rounded font-headline uppercase tracking-wider"
        >
          Ver Monitoreo de Lote
        </a>
      </div>
    </article>
  );
}