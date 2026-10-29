/**
 * @file src/components/client/PatreonBanner.tsx
 * @description Banner promocional para el "Club VIP de Patreon de Consularvisa" con beneficios exclusivos.
 */

import React from 'react';
import { Crown, Sparkles, Check, ArrowRight, ShieldCheck } from 'lucide-react';

export const PatreonBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white border border-amber-500/40 shadow-lg p-6 sm:p-7">
      
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-10 w-36 h-36 rounded-full bg-amber-600/10 blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Contenido Principal */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Membresía Exclusiva para Clientes</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
            Únete al <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400">Club VIP de Patreon</span> de Consularvisa
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Accede a sesiones mensuales en vivo de preguntas y respuestas con el Lic. Ronny Peña | ConsularVisa, revisión prioritaria de tus dudas de visado y nuestra biblioteca de cartas modelo de patrocinio.
          </p>

          {/* Lista de Beneficios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <span className="p-0.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span>Webinar mensual con el Lic. Ronny Peña | ConsularVisa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="p-0.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span>Simuladores de preguntas consulares en video</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="p-0.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span>Plantillas descargables para carta de invitación</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="p-0.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                <Check className="w-3.5 h-3.5" />
              </span>
              <span>Canal privado de Telegram con alertas USCIS</span>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="shrink-0 flex flex-col items-start lg:items-end justify-center gap-2">
          <a
            href="https://www.patreon.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold text-xs sm:text-sm shadow-md hover:shadow-amber-500/20 transition-all hover:scale-102 active:scale-98"
          >
            <span>Unirme al Club VIP</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </a>
          <span className="text-[11px] text-amber-300/80 font-medium">
            Beneficio opcional para la comunidad Consularvisa
          </span>
        </div>

      </div>

    </div>
  );
};
