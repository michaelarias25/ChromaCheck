import { obtenerLotePorId } from '@/lib/modulos/lotes/servicio';
import { obtenerTarrosDeLote, obtenerMuestraDeLote } from '@/lib/modulos/tarros/servicio';

// Pantalla de monitoreo: detalle en vivo de un lote específico
export default async function PaginaLote({ params }: { params: { id: string } }) {
  const loteId = Number(params.id);
  const lote = await obtenerLotePorId(loteId);
  const muestra = await obtenerMuestraDeLote(loteId);
  const tarros = await obtenerTarrosDeLote(loteId);

  const lecturasRecientes = tarros.filter((t) => !t.es_muestra).slice(-8).reverse();
  const ultimoTarro = lecturasRecientes[0];

  if (!lote) {
    return <main className="p-10 text-on-surface">Lote no encontrado.</main>;
  }

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <header className="h-16 px-8 flex items-center border-b-2 border-surface-container-highest bg-surface-container-lowest">
        <span className="font-headline font-bold uppercase tracking-wider">Chroma Check</span>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="font-headline text-3xl font-bold uppercase">Lote {lote.codigo}</h1>
          <span className="text-on-surface-variant text-sm uppercase">{lote.estado}</span>
        </div>

        {/* Comparativa muestra vs último tarro */}
        <div className="grid grid-cols-2 gap-4 bg-surface-container rounded-lg overflow-hidden">
          <div>
            <div className="bg-surface-container-high px-4 py-2 text-xs uppercase">Muestra Patrón</div>
            <div
              className="h-40"
              style={{ backgroundColor: muestra?.resultado_hex || '#555' }}
            />
          </div>
          <div>
            <div className="bg-surface-container-high px-4 py-2 text-xs uppercase">Último Tarro Leído</div>
            <div
              className="h-40 flex items-end justify-between p-3"
              style={{ backgroundColor: ultimoTarro?.resultado_hex || '#555' }}
            >
              {ultimoTarro && (
                <>
                  <span className="bg-surface-container-lowest/80 px-2 py-1 rounded text-xs">
                    ΔE {ultimoTarro.desviacion_delta_e}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs uppercase font-bold ${
                      ultimoTarro.resultado === 'Aprobado'
                        ? 'bg-secondary-container text-secondary-fixed'
                        : 'bg-primary-container text-on-primary-container'
                    }`}
                  >
                    {ultimoTarro.resultado}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Historial reciente */}
        <div className="bg-surface-container rounded-lg overflow-hidden">
          <div className="bg-surface-container-high px-4 py-3 text-xs uppercase">
            Historial Reciente del Lote
          </div>
          <table className="w-full text-left">
            <thead className="text-xs uppercase text-on-surface-variant">
              <tr>
                <th className="px-5 py-3">ID de Tarro</th>
                <th className="px-5 py-3">ΔE</th>
                <th className="px-5 py-3">Hora</th>
                <th className="px-5 py-3">Dictamen</th>
              </tr>
            </thead>
            <tbody>
              {lecturasRecientes.map((t) => (
                <tr key={t.id_tarro} className="border-t border-surface-container-highest">
                  <td className="px-5 py-3">#TR-{t.id_tarro}</td>
                  <td className="px-5 py-3 font-bold">{t.desviacion_delta_e}</td>
                  <td className="px-5 py-3">
                    {new Date(t.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-3 py-1 rounded text-xs uppercase font-bold ${
                        t.resultado === 'Aprobado'
                          ? 'bg-secondary-container text-secondary-fixed'
                          : 'bg-primary-container text-on-primary-container'
                      }`}
                    >
                      {t.resultado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}