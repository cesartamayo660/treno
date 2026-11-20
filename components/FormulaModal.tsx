"use client";

import React from "react";
import { Info, ShieldCheck } from "lucide-react";
import { HEALTH_DISCLAIMER } from "@/lib/bodyMetrics";
import { Sheet, SheetHeader } from "@/components/ui";

export interface FormulaDetailData {
  titulo: string;
  valorMostrado: string;
  categoria?: string;
  explicacionSimple: string;
  formulaNombre: string;
  formulaExpresion: string;
  advertencia?: string;
  comparativaExtra?: { etiqueta: string; valor: string }[];
}

interface FormulaModalProps {
  detail: FormulaDetailData | null;
  onClose: () => void;
}

/** Hoja "¿Cómo se calcula?": resultado, explicación simple y fórmula usada. */
export function FormulaModal({ detail, onClose }: FormulaModalProps) {
  // Se conserva el último contenido mientras la hoja se cierra con animación
  const last = React.useRef<FormulaDetailData | null>(null);
  if (detail) last.current = detail;
  const d = detail ?? last.current;

  return (
    <Sheet open={!!detail} onClose={onClose} label="¿Cómo se calcula?">
      {d && (
        <div>
          <SheetHeader eyebrow="¿Cómo se calcula?" title={d.titulo} onClose={onClose} />

          <div className="mt-5 flex items-end justify-between gap-3 rounded-2xl bg-white/[0.06] px-4 py-4">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">Resultado actual</p>
              <p className="num mt-1.5 break-words text-3xl font-semibold text-accent">
                {d.valorMostrado}
              </p>
            </div>
            {d.categoria && (
              <span className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                {d.categoria}
              </span>
            )}
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-white/80">{d.explicacionSimple}</p>

          <div className="mt-4 rounded-2xl border border-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
              {d.formulaNombre}
            </p>
            <code className="mt-2 block break-words font-mono text-[13px] leading-relaxed text-white/85">
              {d.formulaExpresion}
            </code>
          </div>

          {d.comparativaExtra && d.comparativaExtra.length > 0 && (
            <dl className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10 px-4">
              {d.comparativaExtra.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <dt className="text-white/55">{item.etiqueta}</dt>
                  <dd className="num text-right font-semibold">{item.valor}</dd>
                </div>
              ))}
            </dl>
          )}

          {d.advertencia && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-warn/10 p-3.5 text-[13px] leading-snug text-warn">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{d.advertencia}</span>
            </div>
          )}

          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-white/40">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {HEALTH_DISCLAIMER}
          </p>
        </div>
      )}
    </Sheet>
  );
}
