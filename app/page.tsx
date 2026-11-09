import Link from 'next/link';
import { connection } from 'next/server';
import type { ModoCaptura } from '@/lib/modulos/lotes/reglas';
import { obtenerLotesConResumen } from '@/lib/modulos/lotes/servicio';
import FormularioAgregarLote from './componentes/FormularioAgregarLote';

interface LoteConResumen {
  id: number;
  codigo: string;
  estado: string;
  modo_captura: ModoCaptura;
  muestra_hex: string | null;
  desviacion_promedio: string | number | null;
}

// Texto del indicador de la tarjeta cuando el lote está usando el sensor; sin indicador si está Inactivo
const TEXTOS_MODO_CAPTURA: Record<ModoCaptura, string | null> = {
  Inactivo: null,
  Muestra: 'Esperando muestra',
  Recoleccion: 'Recolectando lecturas',
};

// Pantalla principal: muestra todos los lotes en producción
export default async function PaginaPrincipal() {
  // Espera la petición para que los lotes se consulten en cada visita y no al compilar
  await connection();
  const lotes = await obtenerLotesConResumen();

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <h1 className="font-headline text-3xl font-bold uppercase">Lotes en Producción Actual</h1>
          <FormularioAgregarLote />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lotes.map((lote: LoteConResumen) => (
            <TarjetaLote key={lote.id} lote={lote} />
          ))}
        </div>
      </section>
    </main>
  );
}

// Una tarjeta individual de lote
function TarjetaLote({ lote }: { lote: LoteConResumen }) {
  const colorMuestra = lote.muestra_hex || '#555555';
  const desviacion = lote.desviacion_promedio ?? '—';
  const estaPausado = lote.estado === 'Pausado';
  const textoCaptura = TEXTOS_MODO_CAPTURA[lote.modo_captura];

  return (
    <article className="bg-surface-container rounded-lg overflow-hidden shadow-md">
      <div className="p-5 flex items-center justify-between bg-surface-container-high">
        <div>
          <span className="text-xs uppercase text-on-surface-variant block">ID Lote</span>
          <span className="font-headline text-lg font-bold">{lote.codigo}</span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`px-3 py-1 text-xs uppercase rounded ${
              estaPausado
                ? 'bg-primary-container text-on-primary-container'
                : 'bg-secondary-container text-secondary-fixed'
            }`}
          >
            {lote.estado}
          </span>
          {textoCaptura && (
            <span className="px-3 py-1 text-xs uppercase rounded font-bold bg-tertiary-container text-on-tertiary-container">
              <span aria-hidden="true">● </span>
              {textoCaptura}
            </span>
          )}
        </div>
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
            <span className="text-xs uppercase text-on-surface-variant block">
              Desviación Promedio
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-bold">{desviacion}</span>
              <span className="text-sm text-on-surface-variant">ΔE</span>
            </div>
          </div>
        </div>

        <Link
          href={`/lotes/${lote.id}`}
          className="w-full h-14 bg-primary-container text-on-primary-container flex items-center justify-center rounded font-headline uppercase tracking-wider"
        >
          Ver Monitoreo de Lote
        </Link>
      </div>
    </article>
  );
}
