import Link from 'next/link';
import { connection } from 'next/server';
import { formatearDeltaE } from '@/lib/formato';
import type { ModoCaptura } from '@/lib/modulos/lotes/reglas';
import { obtenerLotesConResumen } from '@/lib/modulos/lotes/servicio';
import { obtenerClasesBoton } from './componentes/Boton';
import CuadroColor from './componentes/CuadroColor';
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
  Muestra: 'Esperando muestra patrón',
  Recoleccion: 'Revisando tarros',
};

// Pantalla principal: muestra todos los lotes en producción
export default async function PaginaPrincipal() {
  // Espera la petición para que los lotes se consulten en cada visita y no al compilar
  await connection();
  const lotes = await obtenerLotesConResumen();

  return (
    <main className="flex-1 bg-fondo text-texto">
      <section className="mx-auto max-w-300 space-y-6 px-4 py-10 sm:px-8">
        <h1 className="text-3xl font-bold">Lotes en producción</h1>
        {/* Acción principal de la pantalla, debajo del título */}
        <FormularioAgregarLote />

        {lotes.length === 0 ? (
          <p className="text-lg text-texto-secundario">Todavía no hay lotes</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {lotes.map((lote: LoteConResumen) => (
              <TarjetaLote key={lote.id} lote={lote} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// Una tarjeta de lote: lo más visible es el código, el color de la muestra patrón y "Abrir lote"
function TarjetaLote({ lote }: { lote: LoteConResumen }) {
  const estaPausado = lote.estado === 'Pausado';
  const textoCaptura = TEXTOS_MODO_CAPTURA[lote.modo_captura];

  return (
    <article className="space-y-4 rounded-lg border-2 border-borde bg-superficie p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-bold break-all">{lote.codigo}</h2>
        {estaPausado ? (
          <span className="text-lg font-bold text-peligro">
            <span aria-hidden="true">⚠ </span>Pausado
          </span>
        ) : (
          <span className="text-base text-texto-secundario">{lote.estado}</span>
        )}
      </div>

      <CuadroColor hex={lote.muestra_hex} textoSinColor="Sin muestra patrón" />

      <div className="space-y-1 text-base text-texto-secundario">
        <p className="tabular-nums">
          Diferencia de color promedio: {formatearDeltaE(lote.desviacion_promedio)} ΔE
        </p>
        {textoCaptura && (
          <p>
            <span aria-hidden="true">● </span>
            {textoCaptura}
          </p>
        )}
      </div>

      <Link
        href={`/lotes/${lote.id}`}
        className={`${obtenerClasesBoton({ variante: 'secundario' })} w-full`}
      >
        Abrir lote
      </Link>
    </article>
  );
}
