"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { BARRAS, calcularDiscos, discosPlanos } from "@/lib/plates";
import { Segmented, Sheet, SheetHeader } from "@/components/ui";

/** Altura de cada disco en el dibujo (proporcional al tamaño real). */
const ALTO: Record<number, number> = { 25: 112, 20: 102, 15: 90, 10: 76, 5: 62, 2.5: 50, 1.25: 40 };
const ANCHO: Record<number, number> = { 25: 24, 20: 22, 15: 20, 10: 17, 5: 14, 2.5: 12, 1.25: 10 };
/** Opacidad de la tinta por disco: los pesados se ven más fuertes. */
const TONO: Record<number, number> = { 25: 0.95, 20: 0.8, 15: 0.68, 10: 0.56, 5: 0.44, 2.5: 0.34, 1.25: 0.26 };

function Barra({ discos }: { discos: number[] }) {
  const visibles = discos.slice(0, 9);
  let x = 128;
  return (
    <svg viewBox="0 0 330 130" className="w-full" role="img" aria-label="Barra con los discos de un lado">
      {/* barra */}
      <rect x="6" y="61" width="318" height="8" rx="4" fill="rgb(var(--c-ink) / 0.28)" />
      {/* agarre */}
      <rect x="6" y="59" width="100" height="12" rx="3" fill="rgb(var(--c-ink) / 0.16)" />
      {/* tope (collar) */}
      <rect x="112" y="50" width="12" height="30" rx="3" fill="rgb(var(--c-ink) / 0.55)" />
      {visibles.map((kg, i) => {
        const w = ANCHO[kg] ?? 10;
        const h = ALTO[kg] ?? 50;
        const px = x;
        x += w + 3;
        return (
          <motion.g
            key={`${i}-${kg}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, type: "spring", damping: 20, stiffness: 300 }}
          >
            <rect x={px} y={65 - h / 2} width={w} height={h} rx="3" fill="rgb(var(--c-ink))" opacity={TONO[kg] ?? 0.4} />
            {h >= 50 && (
              <text
                x={px + w / 2}
                y={65}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(-90 ${px + w / 2} 65)`}
                fontSize={w >= 17 ? 11 : 8.5}
                fontWeight={700}
                fill="rgb(var(--c-base))"
              >
                {kg}
              </text>
            )}
          </motion.g>
        );
      })}
      {discos.length > visibles.length && (
        <text x={x + 6} y={69} fontSize="11" fill="rgb(var(--c-ink) / 0.6)">
          +{discos.length - visibles.length}
        </text>
      )}
    </svg>
  );
}

/** Hoja con la calculadora de discos: escribe el peso y te dice cómo cargar la barra. */
export function PlateCalculator({
  open,
  onClose,
  initialKg = 60,
  onUse,
  z,
}: {
  open: boolean;
  z?: string;
  onClose: () => void;
  initialKg?: number;
  /** Si se pasa, aparece el botón "Usar este peso". */
  onUse?: (kg: number) => void;
}) {
  const [texto, setTexto] = useState(String(initialKg || 60));
  const [barra, setBarra] = useState<"20" | "15" | "10">("20");

  // Cada vez que se abre, parte del peso que traes en la serie
  useEffect(() => {
    if (open) setTexto(String(initialKg > 0 ? initialKg : 60));
  }, [open, initialKg]);

  const objetivo = Number(texto.replace(",", ".")) || 0;
  const barraKg = Number(barra);
  const r = useMemo(() => calcularDiscos(objetivo, barraKg), [objetivo, barraKg]);
  const planos = useMemo(() => discosPlanos(r), [r]);

  const mover = (d: number) => setTexto(String(Math.max(0, Math.round((objetivo + d) * 100) / 100)));

  return (
    <Sheet open={open} onClose={onClose} label="Calculadora de discos" z={z}>
      <SheetHeader eyebrow="Calculadora" title="¿Qué discos pongo?" onClose={onClose} />

      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => mover(-2.5)}
          aria-label="Restar 2,5 kilos"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 transition active:scale-90"
        >
          <Minus className="h-5 w-5" />
        </button>
        <label className="flex items-baseline gap-1.5">
          <input
            type="number"
            inputMode="decimal"
            step={0.5}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            aria-label="Peso total en kilos"
            className="num w-32 bg-transparent text-center text-6xl font-semibold text-accent focus:outline-none"
          />
          <span className="text-lg text-white/45">kg</span>
        </label>
        <button
          type="button"
          onClick={() => mover(2.5)}
          aria-label="Sumar 2,5 kilos"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 transition active:scale-90"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 flex justify-center">
        <Segmented
          label="Tipo de barra"
          value={barra}
          onChange={setBarra}
          options={BARRAS.map((b) => ({ id: String(b.kg) as "20" | "15" | "10", label: `Barra ${b.kg} kg` }))}
        />
      </div>

      <div className="mt-5 rounded-2xl bg-white/[0.05] px-3 py-4">
        <Barra discos={planos} />
        <p className="mt-1 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
          Discos de cada lado
        </p>
      </div>

      {r.menorQueBarra ? (
        <p className="mt-4 rounded-2xl bg-warn/10 p-3.5 text-[13px] leading-snug text-warn">
          Ese peso es menor que la barra sola ({barraKg} kg). Prueba con una barra más corta o mancuernas.
        </p>
      ) : (
        <>
          {r.porLado.length > 0 ? (
            <ul className="mt-4 grid grid-cols-2 gap-2.5">
              {r.porLado.map((d) => (
                <li key={d.kg} className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
                  <span className="num text-2xl font-semibold">{d.cantidad}×</span>
                  <span className="num text-lg font-semibold text-white/70">{d.kg} kg</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-center text-sm text-white/55">Solo la barra, sin discos.</p>
          )}
          <p className="mt-3 text-center text-sm text-white/55">
            {r.exacto ? (
              <>
                Total: <strong className="num text-white">{r.totalKg} kg</strong> ({barraKg} de barra + {r.pesoPorLadoKg * 2} en discos)
              </>
            ) : (
              <>
                Con los discos habituales se carga <strong className="num text-white">{r.totalKg} kg</strong> (faltan{" "}
                {r.diferenciaKg} kg: no hay disco tan pequeño).
              </>
            )}
          </p>
        </>
      )}

      {onUse && !r.menorQueBarra && (
        <button
          type="button"
          onClick={() => {
            onUse(r.totalKg);
            onClose();
          }}
          className="mt-5 w-full rounded-full bg-accent py-4 text-base font-semibold text-canvas shadow-glow transition active:scale-[0.99]"
        >
          Usar {r.totalKg} kg en mi serie
        </button>
      )}
    </Sheet>
  );
}
