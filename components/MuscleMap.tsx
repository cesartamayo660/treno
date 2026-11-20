"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { estadoMuscular, Grupo, GRUPOS, grupoMasDescuidado, Nivel, textoDias } from "@/lib/muscles";
import { exerciseById, useTraining } from "@/lib/training";
import { todayIso } from "@/lib/freshUser";
import { Eyebrow, Segmented } from "@/components/ui";

type Vista = "frente" | "espalda";
type Forma =
  | { t: "r"; x: number; y: number; w: number; h: number; r: number }
  | { t: "e"; cx: number; cy: number; rx: number; ry: number };

const r = (x: number, y: number, w: number, h: number, rad: number): Forma => ({ t: "r", x, y, w, h, r: rad });
const e = (cx: number, cy: number, rx: number, ry: number): Forma => ({ t: "e", cx, cy, rx, ry });

const BRAZOS: Forma[] = [r(37, 108, 17, 46, 8), r(146, 108, 17, 46, 8), r(32, 158, 14, 50, 7), r(154, 158, 14, 50, 7)];
const HOMBROS: Forma[] = [e(56, 90, 15, 19), e(144, 90, 15, 19)];
const PANTORRILLAS: Forma[] = [r(72, 298, 24, 70, 11), r(104, 298, 24, 70, 11)];

const FORMAS: Record<Vista, { grupo: Grupo; formas: Forma[] }[]> = {
  frente: [
    { grupo: "Hombros", formas: HOMBROS },
    { grupo: "Pecho", formas: [r(68, 82, 31, 34, 12), r(101, 82, 31, 34, 12)] },
    { grupo: "Brazos", formas: BRAZOS },
    { grupo: "Core", formas: [r(78, 120, 44, 64, 12)] },
    { grupo: "Piernas", formas: [r(70, 192, 29, 100, 13), r(101, 192, 29, 100, 13), ...PANTORRILLAS] },
  ],
  espalda: [
    { grupo: "Hombros", formas: HOMBROS },
    { grupo: "Espalda", formas: [r(66, 80, 68, 86, 18), r(80, 168, 40, 26, 10)] },
    { grupo: "Brazos", formas: BRAZOS },
    { grupo: "Glúteos", formas: [e(86, 212, 20, 19), e(114, 212, 20, 19)] },
    { grupo: "Piernas", formas: [r(70, 234, 29, 58, 13), r(101, 234, 29, 58, 13), ...PANTORRILLAS] },
  ],
};

const VISTA_DE: Record<Grupo, Vista[]> = {
  Pecho: ["frente"],
  Core: ["frente"],
  Espalda: ["espalda"],
  Glúteos: ["espalda"],
  Hombros: ["frente", "espalda"],
  Brazos: ["frente", "espalda"],
  Piernas: ["frente", "espalda"],
};

const OPACIDAD: Record<Nivel, number> = { 0: 0.1, 1: 0.38, 2: 0.68, 3: 1 };
const ETIQUETA_NIVEL: Record<Nivel, string> = {
  0: "Sin trabajo reciente",
  1: "Trabajado esta semana",
  2: "Trabajado hace pocos días",
  3: "Recién trabajado",
};

function Pieza({ f, ...props }: { f: Forma } & React.SVGProps<SVGRectElement & SVGEllipseElement>) {
  return f.t === "r" ? (
    <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={f.r} {...(props as React.SVGProps<SVGRectElement>)} />
  ) : (
    <ellipse cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry} {...(props as React.SVGProps<SVGEllipseElement>)} />
  );
}

/** Silueta que se ilumina según los músculos que trabajaste (datos reales de tu historial). */
export function MuscleMap() {
  const { history } = useTraining();
  const [vista, setVista] = useState<Vista>("frente");
  const [sel, setSel] = useState<Grupo | null>(null);

  const estados = useMemo(
    () => estadoMuscular(history, (id) => exerciseById(id)?.grupoMuscular, todayIso()),
    [history]
  );
  const por = useMemo(() => Object.fromEntries(estados.map((x) => [x.grupo, x])) as Record<Grupo, (typeof estados)[number]>, [estados]);
  const hayHistorial = estados.some((x) => x.diasDesde !== null);
  const aviso = useMemo(() => grupoMasDescuidado(estados), [estados]);
  const activo = sel ? por[sel] : null;

  const elegir = (g: Grupo) => {
    setSel(g);
    if (!VISTA_DE[g].includes(vista)) setVista(VISTA_DE[g][0]);
  };

  return (
    <section className="glass-card rounded-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Mapa muscular</h2>
          <p className="text-xs text-white/45">Lo que trabajaste, según tu historial</p>
        </div>
        <Segmented
          label="Vista del cuerpo"
          value={vista}
          onChange={setVista}
          options={[
            { id: "frente", label: "Frente" },
            { id: "espalda", label: "Espalda" },
          ]}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 items-center gap-5 sm:grid-cols-[13rem_1fr] [&>*]:min-w-0">
        <div className="relative mx-auto w-full max-w-[12rem]">
          <svg viewBox="0 0 200 380" className="h-auto w-full" role="img" aria-label={`Cuerpo humano, vista ${vista}`}>
            {/* cuerpo base */}
            <g fill="rgb(var(--c-ink) / 0.06)" stroke="rgb(var(--c-ink) / 0.12)" strokeWidth="1">
              <circle cx="100" cy="34" r="21" />
              <rect x="92" y="52" width="16" height="16" rx="5" />
              <rect x="64" y="76" width="72" height="122" rx="24" />
              <rect x="68" y="186" width="64" height="48" rx="18" />
              <rect x="31" y="104" width="22" height="108" rx="11" />
              <rect x="147" y="104" width="22" height="108" rx="11" />
            </g>
            {FORMAS[vista].map(({ grupo, formas }) => {
              const est = por[grupo];
              const elegido = sel === grupo;
              return (
                <motion.g
                  key={`${vista}-${grupo}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${grupo}: ${textoDias(est.diasDesde)}`}
                  onClick={() => elegir(grupo)}
                  onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && elegir(grupo)}
                  className="cursor-pointer outline-none"
                  style={est.nivel === 3 ? { filter: "drop-shadow(0 0 7px rgb(var(--c-accent) / 0.6))" } : undefined}
                >
                  {formas.map((f, i) => (
                    <Pieza
                      key={i}
                      f={f}
                      fill="rgb(var(--c-accent))"
                      fillOpacity={OPACIDAD[est.nivel]}
                      stroke={elegido ? "rgb(var(--c-ink))" : "rgb(var(--c-accent) / 0.5)"}
                      strokeWidth={elegido ? 2.5 : 1}
                    />
                  ))}
                </motion.g>
              );
            })}
            {/* líneas del abdomen (solo decorativas) */}
            {vista === "frente" && (
              <g stroke="rgb(var(--c-base) / 0.55)" strokeWidth="1.5" strokeLinecap="round" pointerEvents="none">
                <line x1="100" y1="124" x2="100" y2="180" />
                <line x1="82" y1="140" x2="118" y2="140" />
                <line x1="82" y1="158" x2="118" y2="158" />
              </g>
            )}
          </svg>
        </div>

        <div>
          <ul className="grid grid-cols-2 gap-2">
            {GRUPOS.map((g) => {
              const est = por[g];
              const on = sel === g;
              return (
                <li key={g}>
                  <button
                    type="button"
                    onClick={() => elegir(g)}
                    aria-pressed={on}
                    className={`flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition ${
                      on ? "border-accent bg-accent/10" : "border-white/10 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full bg-accent ring-1 ring-accent/40"
                      style={{ opacity: Math.max(0.18, OPACIDAD[est.nivel]) }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold">{g}</span>
                      <span className="block truncate text-[11px] text-white/45">{textoDias(est.diasDesde)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 min-h-[3.25rem] rounded-2xl bg-white/[0.05] p-3.5 text-[13px] leading-snug" aria-live="polite">
            {!hayHistorial ? (
              <span className="text-white/55">
                Termina tu primer entrenamiento y aquí verás qué músculos trabajaste y cuáles te faltan.
              </span>
            ) : activo ? (
              <>
                <Eyebrow className="!text-accent">{activo.grupo}</Eyebrow>
                <p className="mt-1 text-white/75">
                  {ETIQUETA_NIVEL[activo.nivel]} · {textoDias(activo.diasDesde).toLowerCase()} ·{" "}
                  <span className="num">{activo.sesiones7d}</span> {activo.sesiones7d === 1 ? "sesión" : "sesiones"} en 7 días
                </p>
              </>
            ) : aviso ? (
              <span className="text-white/75">💡 {aviso.mensaje}</span>
            ) : (
              <span className="text-white/75">Muy bien: no tienes ningún grupo abandonado esta semana. 💪</span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-white/45">
            {([3, 2, 1, 0] as Nivel[]).map((n) => (
              <span key={n} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" style={{ opacity: Math.max(0.18, OPACIDAD[n]) }} />
                {n === 3 ? "Hoy/ayer" : n === 2 ? "≤ 3 días" : n === 1 ? "≤ 7 días" : "Más tiempo"}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
