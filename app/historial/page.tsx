import { obtenerHistorialTarros } from '@/lib/modulos/tarros/servicio';

// Pantalla de historial: tabla con todos los tarros registrados
export default async function PaginaHistorial() {
  const tarros = await obtenerHistorialTarros();

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="font-headline text-3xl font-bold uppercase mb-8">
          Historial de Calidad de Tarros
        </h1>

        <div className="bg-surface-container rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-surface-container-high text-xs uppercase text-on-surface-variant">
              <tr>
                <th className="px-5 py-4">ID de Tarro</th>
                <th className="px-5 py-4">Lote</th>
                <th className="px-5 py-4">Color Medido</th>
                <th className="px-5 py-4">ΔE</th>
                <th className="px-5 py-4">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {tarros.map((tarro) => (
                <FilaTarro key={tarro.id_tarro} tarro={tarro} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

// Una fila individual del historial
function FilaTarro({ tarro }: { tarro: any }) {
  const esAprobado = tarro.resultado === 'Aprobado';

  return (
    <tr className="border-t border-surface-container-highest">
      <td className="px-5 py-4">#TR-{tarro.id_tarro}</td>
      <td className="px-5 py-4">{tarro.lote_codigo}</td>
      <td className="px-5 py-4 flex items-center gap-2">
        <span
          className="w-6 h-6 rounded"
          style={{ backgroundColor: tarro.resultado_hex }}
        />
        {tarro.resultado_hex}
      </td>
      <td className="px-5 py-4 text-xl font-bold">{tarro.desviacion_delta_e}</td>
      <td className="px-5 py-4">
        <span
          className={`px-3 py-1 rounded text-xs uppercase font-bold ${
            esAprobado
              ? 'bg-secondary-container text-secondary-fixed'
              : 'bg-primary-container text-on-primary-container'
          }`}
        >
          {tarro.resultado}
        </span>
      </td>
    </tr>
  );
}