'use client';

import { useState } from 'react';
import { guardarTema } from '@/app/acciones/tema';
import type { Tema } from '@/lib/tema';
import { CLASES_BASE_ENCABEZADO, CLASES_ELEMENTO_ENCABEZADO } from './Navegacion';

interface PropiedadesSelectorTema {
  // Tema que el servidor leyó de la cookie al generar la página
  temaInicial: Tema;
}

const OPCIONES: { tema: Tema; texto: string }[] = [
  { tema: 'claro', texto: 'Claro' },
  { tema: 'oscuro', texto: 'Oscuro' },
];

// Control "Fondo:" con los botones "Claro" y "Oscuro" (F7). Se ve en todas las pantallas, también en /login
export default function SelectorTema({ temaInicial }: PropiedadesSelectorTema) {
  const [temaElegido, setTemaElegido] = useState<Tema>(temaInicial);

  function elegirTema(tema: Tema) {
    setTemaElegido(tema);
    // Cambia los tokens y el logo en ese momento, sin recargar la página
    document.documentElement.setAttribute('data-tema', tema);
    // La cookie la escribe el servidor; en la próxima carga la página llega ya con este tema
    guardarTema(tema);
  }

  return (
    <div role="group" aria-labelledby="etiqueta-fondo" className="flex items-center gap-2">
      <span id="etiqueta-fondo" className="text-lg font-bold">
        Fondo:
      </span>
      {OPCIONES.map(({ tema, texto }) => {
        const estaElegido = tema === temaElegido;
        return (
          <button
            key={tema}
            type="button"
            aria-pressed={estaElegido}
            onClick={() => elegirTema(tema)}
            className={
              estaElegido
                ? `${CLASES_BASE_ENCABEZADO} border-accion bg-accion font-bold text-texto-sobre-accion`
                : CLASES_ELEMENTO_ENCABEZADO
            }
          >
            {estaElegido && <span aria-hidden="true">✓&nbsp;</span>}
            {texto}
          </button>
        );
      })}
    </div>
  );
}
