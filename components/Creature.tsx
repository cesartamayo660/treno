"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Share2, Sparkles } from "lucide-react";
import { calcularXp, EntradaXp, estadoCriatura, ETAPAS } from "@/lib/creature";
import { useBadges } from "@/lib/badgesProvider";
import { useTreno } from "@/lib/store";
import { useTraining } from "@/lib/training";
import { Confetti } from "@/components/motion";
import { Eyebrow, Sheet, SheetHeader } from "@/components/ui";
import { ShareSheet } from "@/components/ShareSheet";
import { fechaLarga } from "@/components/PrCelebration";
import type { DatosTarjeta } from "@/lib/shareCard";

const BASE = "rgb(var(--c-base))";
const ACENTO = "rgb(var(--c-accent))";

/** Escala del cuerpo por nivel: crece al evolucionar. */
const ESCALA = [0.8, 0.88, 0.95, 1.0, 1.04];

/**
 * Treno, tu criatura. Cinco etapas dibujadas en SVG que usan los colores del tema.
 * `silueta` la pinta como sombra (etapas aún no alcanzadas).
 */
export function Creature({
  nivel,
  feliz = true,
  silueta = false,
  className = "h-40 w-40",
  respira = true,
}: {
  nivel: 1 | 2 | 3 | 4 | 5;
  feliz?: boolean;
  silueta?: boolean;
  className?: string;
  respira?: boolean;
}) {
  const s = ESCALA[nivel - 1];
  const cuerpo = silueta ? "rgb(var(--c-ink) / 0.14)" : ACENTO;
  const detalle = silueta ? "rgb(var(--c-ink) / 0.2)" : BASE;
  const id = `cr-${nivel}-${silueta ? "s" : "c"}`;
  const flex = nivel >= 3;

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={`Treno, nivel ${nivel}: ${ETAPAS[nivel - 1].nombre}`}>
      <defs>
        <radialGradient id={`${id}-aura`} cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor={ACENTO} stopOpacity={nivel === 5 ? 0.4 : 0.28} />
          <stop offset="100%" stopColor={ACENTO} stopOpacity="0" />
        </radialGradient>
      </defs>

      {nivel >= 4 && !silueta && <circle cx="100" cy="112" r="98" fill={`url(#${id}-aura)`} />}

      <g className={respira && !silueta ? "creature-breathe" : undefined}>
        <ellipse cx="100" cy="192" rx={44 * s} ry="6" fill="rgb(var(--c-ink) / 0.14)" />

        <g transform={`translate(100 190) scale(${s}) translate(-100 -190)`}>
          {/* capa */}
          {nivel >= 4 && (
            <path d="M60 104 Q100 76 140 104 L156 180 Q100 198 44 180 Z" fill={silueta ? "rgb(var(--c-ink) / 0.1)" : "rgb(var(--c-ink) / 0.2)"} />
          )}

          {/* brazos */}
          {flex ? (
            <g stroke={cuerpo} strokeWidth="19" strokeLinecap="round" fill="none">
              <path d="M58 138 Q32 130 34 104 Q36 88 48 84" />
              <path d="M142 138 Q168 130 166 104 Q164 88 152 84" />
            </g>
          ) : (
            <g stroke={cuerpo} strokeWidth={nivel === 1 ? 12 : 15} strokeLinecap="round" fill="none">
              <path d="M56 136 Q44 150 46 164" />
              <path d="M144 136 Q156 150 154 164" />
            </g>
          )}
          {flex && (
            <g fill={cuerpo}>
              <circle cx="38" cy="108" r="15" />
              <circle cx="162" cy="108" r="15" />
            </g>
          )}

          {/* pies */}
          <ellipse cx="76" cy="184" rx="16" ry="8.5" fill={cuerpo} />
          <ellipse cx="124" cy="184" rx="16" ry="8.5" fill={cuerpo} />

          {/* cuerpo */}
          <ellipse cx="100" cy="134" rx="49" ry="51" fill={cuerpo} />
          <ellipse cx="100" cy="150" rx="29" ry="29" fill="white" opacity={silueta ? 0 : 0.17} />

          {/* hoja (cachorro) */}
          {nivel === 1 && <path d="M100 86 Q92 66 108 60 Q108 76 100 86 Z" fill={cuerpo} />}

          {/* cinta (atleta en adelante) */}
          {nivel >= 2 && (
            <g fill={detalle}>
              <path d="M52 108 Q100 94 148 108 L148 119 Q100 105 52 119 Z" />
              <path d="M146 110 L166 100 L162 114 Z" />
              <path d="M146 114 L164 124 L158 112 Z" />
            </g>
          )}

          {/* abdominales */}
          {nivel >= 3 && (
            <g stroke={detalle} strokeWidth="2.4" strokeLinecap="round" opacity="0.4">
              <line x1="100" y1="146" x2="100" y2="176" />
              <line x1="88" y1="156" x2="112" y2="156" />
              <line x1="88" y1="168" x2="112" y2="168" />
            </g>
          )}

          {/* hombreras y emblema */}
          {nivel >= 4 && (
            <g>
              <ellipse cx="62" cy="116" rx="14" ry="9" fill={detalle} opacity="0.85" />
              <ellipse cx="138" cy="116" rx="14" ry="9" fill={detalle} opacity="0.85" />
              <path d="M92 136 H108 V142 H103 V158 H97 V142 H92 Z" fill={detalle} opacity="0.5" />
            </g>
          )}

          {/* cara */}
          <g>
            <circle cx="82" cy="124" r="11" fill="#fff" />
            <circle cx="118" cy="124" r="11" fill="#fff" />
            <circle cx="84" cy="126" r="5.4" fill="#0a0c0b" />
            <circle cx="120" cy="126" r="5.4" fill="#0a0c0b" />
            <circle cx="86" cy="123.5" r="1.8" fill="#fff" />
            <circle cx="122" cy="123.5" r="1.8" fill="#fff" />
            {nivel >= 3 && (
              <g stroke={detalle} strokeWidth="4.5" strokeLinecap="round">
                <line x1="70" y1="106" x2="90" y2="112" />
                <line x1="130" y1="106" x2="110" y2="112" />
              </g>
            )}
            {feliz ? (
              <path d="M86 144 Q100 160 114 144 Q100 150 86 144 Z" fill={detalle} stroke={detalle} strokeWidth="3" strokeLinejoin="round" />
            ) : (
              <path d="M91 150 H109" stroke={detalle} strokeWidth="4" strokeLinecap="round" fill="none" />
            )}
          </g>

          {/* corona y barra (leyenda) */}
          {nivel === 5 && (
            <g>
              <path d="M70 90 L78 64 L90 80 L100 56 L110 80 L122 64 L130 90 Z" fill={cuerpo} stroke={detalle} strokeWidth="3" strokeLinejoin="round" />
              <g fill={detalle}>
                <rect x="16" y="46" width="168" height="6" rx="3" opacity="0.85" />
                <rect x="14" y="30" width="9" height="38" rx="3" />
                <rect x="26" y="35" width="7" height="28" rx="3" />
                <rect x="177" y="30" width="9" height="38" rx="3" />
                <rect x="167" y="35" width="7" height="28" rx="3" />
              </g>
            </g>
          )}
        </g>
      </g>

      {nivel === 5 && !silueta && (
        <g fill={ACENTO}>
          <path d="M28 96 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" />
          <path d="M172 150 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z" />
          <path d="M160 84 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" opacity="0.8" />
        </g>
      )}
    </svg>
  );
}

function useEntradaXp(): { xp: EntradaXp; feliz: boolean } {
  const { estadisticas: e } = useBadges();
  const { currentUser: u } = useTreno();
  return {
    xp: {
      entrenamientos: e.entrenamientos,
      diasGym: e.diasGym,
      prs: e.prs,
      tonelajeKg: e.tonelajeKg,
      rachaDias: e.racha,
      semanasPerfectas: e.semanasPerfectas,
    },
    feliz: u.checkedInHoy,
  };
}

/** Tarjeta del Perfil: tu criatura, su etapa, el XP que falta y el camino de evolución. */
export function CreatureCard() {
  const { xp: entrada, feliz } = useEntradaXp();
  const { currentUser: u } = useTreno();
  const { logradas } = useBadges();
  const estado = useMemo(() => estadoCriatura(calcularXp(entrada)), [entrada]);
  const [camino, setCamino] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const datos: DatosTarjeta = {
    tipo: "racha",
    etiqueta: `Treno · nivel ${estado.etapa.nivel} · ${estado.etapa.nombre}`,
    titulo: "Mi racha en el gimnasio",
    grande: String(u.rachaDias),
    unidad: u.rachaDias === 1 ? "día de racha" : "días de racha",
    subtitulo: estado.etapa.lema,
    emoji: "🔥",
    datos: [
      { valor: String(entrada.entrenamientos), nombre: "entrenos" },
      { valor: String(entrada.prs), nombre: "récords" },
      { valor: String(logradas), nombre: "insignias" },
    ],
    nombre: u.nombre,
    fecha: fechaLarga(),
  };

  return (
    <section className="glass-card relative overflow-hidden rounded-card p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setCamino(true)}
          aria-label="Ver la evolución de Treno"
          className="relative shrink-0 rounded-3xl bg-white/[0.04] p-1 transition active:scale-95"
        >
          <Creature nivel={estado.etapa.nivel} feliz={feliz} className="h-32 w-32 sm:h-36 sm:w-36" />
        </button>
        <div className="min-w-0 flex-1">
          <Eyebrow>Tu criatura · nivel {estado.etapa.nivel}</Eyebrow>
          <h2 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight">Treno, el {estado.etapa.nombre}</h2>
          <p className="mt-1 text-[13px] leading-snug text-white/50">{estado.etapa.lema}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="num font-semibold">{estado.xp} XP</span>
          <span className="text-white/45">
            {estado.siguiente ? `${estado.xpFalta} XP para ser ${estado.siguiente.nombre}` : "¡Nivel máximo!"}
          </span>
        </div>
        <span className="mt-2 block h-2 overflow-hidden rounded-full bg-white/10">
          <motion.span
            className="block h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(estado.avance * 100)}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </span>
        <p className="mt-2.5 text-xs leading-snug text-white/45">
          {feliz ? "Hoy ya fuiste al gimnasio: Treno está feliz. 😄" : "Haz tu check-in de hoy y Treno se pondrá contento."}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setCamino(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/15 py-3 text-sm font-semibold transition hover:bg-white/5"
        >
          <Sparkles className="h-4 w-4 text-accent" />
          Evolución
        </button>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-accent/15 py-3 text-sm font-semibold text-accent transition active:scale-95"
        >
          <Share2 className="h-4 w-4" />
          Compartir racha
        </button>
      </div>

      <Sheet open={camino} onClose={() => setCamino(false)} label="Evolución de Treno" maxWidth="max-w-lg">
        <SheetHeader eyebrow="Se gana con tu constancia de siempre" title="La evolución de Treno" onClose={() => setCamino(false)} />
        <ol className="mt-5 grid grid-cols-5 gap-1.5">
          {ETAPAS.map((e) => {
            const alcanzada = estado.xp >= e.desde;
            const actual = e.nivel === estado.etapa.nivel;
            return (
              <li
                key={e.nivel}
                className={`flex flex-col items-center rounded-2xl border px-1 py-2 text-center ${
                  actual ? "border-accent bg-accent/10" : "border-white/10"
                }`}
              >
                <Creature nivel={e.nivel} silueta={!alcanzada} respira={false} className="h-14 w-14 sm:h-16 sm:w-16" />
                <span className="mt-1 block text-[10px] font-semibold leading-tight sm:text-[11px]">{e.nombre}</span>
                <span className="num mt-0.5 flex items-center gap-0.5 text-[10px] text-white/40">
                  {!alcanzada && <Lock className="h-2.5 w-2.5" />}
                  {e.desde}
                </span>
              </li>
            );
          })}
        </ol>
        <h3 className="mt-6 font-display text-base font-semibold">¿Cómo gana XP Treno?</h3>
        <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10 px-4 text-sm">
          {[
            ["Terminar un entrenamiento", "+12"],
            ["Ir al gimnasio (check-in)", "+6"],
            ["Romper un récord personal", "+30"],
            ["Semana perfecta", "+25"],
            ["Cada día de racha (hasta 30)", "+2"],
            ["Cada 500 kg movidos", "+1"],
          ].map(([t, x]) => (
            <li key={t} className="flex items-center justify-between py-2.5">
              <span className="text-white/70">{t}</span>
              <span className="num font-semibold text-accent">{x}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-white/45">
          Treno nunca retrocede: el XP es de toda tu vida en TRENO, no de la semana. Así una mala semana no le quita lo ganado.
        </p>
      </Sheet>

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} datos={datos} />
    </section>
  );
}

const KEY = "treno:creature:v1";

/** Cuando Treno sube de etapa, lo celebra sobre cualquier pantalla. */
export function EvolutionWatcher() {
  const { xp: entrada, feliz } = useEntradaXp();
  const { hydrated: storeListo } = useTreno();
  const { hydrated: entrenoListo } = useTraining();
  const estado = useMemo(() => estadoCriatura(calcularXp(entrada)), [entrada]);
  const [nuevo, setNuevo] = useState<number | null>(null);
  const [visto, setVisto] = useState<number | null>(null);

  useEffect(() => {
    if (!storeListo || !entrenoListo) return;
    const nivel = estado.etapa.nivel;
    if (visto === null) {
      let guardado: number | null = null;
      try {
        const raw = localStorage.getItem(KEY);
        guardado = raw ? Number(raw) : null;
      } catch {
        /* sin almacenamiento */
      }
      // Sin registro previo se toma el nivel actual en silencio (nadie recibe un aviso retroactivo)
      const base = guardado ?? nivel;
      setVisto(base);
      if (guardado === null) {
        try {
          localStorage.setItem(KEY, String(nivel));
        } catch {
          /* noop */
        }
      }
      return;
    }
    if (nivel > visto) {
      setVisto(nivel);
      setNuevo(nivel);
      try {
        localStorage.setItem(KEY, String(nivel));
      } catch {
        /* noop */
      }
    }
  }, [estado.etapa.nivel, storeListo, entrenoListo, visto]);

  const etapa = nuevo ? ETAPAS[nuevo - 1] : null;

  return (
    <AnimatePresence>
      {etapa && (
        <motion.div
          key="evo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[88] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Treno evolucionó"
        >
          <motion.div
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 16, stiffness: 220 }}
            className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-accent/50 bg-raised p-7 text-center shadow-glow"
          >
            <Confetti count={48} />
            <Eyebrow className="!text-accent">¡Evolución!</Eyebrow>
            <div className="mt-2 flex justify-center">
              <Creature nivel={etapa.nivel} feliz={feliz} className="h-48 w-48" />
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">Treno ahora es {etapa.nombre}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-white/60">{etapa.lema}</p>
            <button
              type="button"
              onClick={() => setNuevo(null)}
              className="mt-6 w-full rounded-full bg-accent py-4 text-base font-semibold text-canvas shadow-glow transition active:scale-[0.99]"
            >
              ¡Genial!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
