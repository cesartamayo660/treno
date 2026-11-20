"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share2, Trophy } from "lucide-react";
import { useTraining } from "@/lib/training";
import { useTreno } from "@/lib/store";
import { Confetti } from "@/components/motion";
import { ShareSheet } from "@/components/ShareSheet";
import type { DatosTarjeta } from "@/lib/shareCard";

export const fechaLarga = () =>
  new Date().toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });

/**
 * Celebración de récord personal: aparece sobre cualquier pantalla (también el modo
 * gimnasio) con confeti, vibración y la opción de compartirlo.
 */
export function PrCelebration() {
  const { prEvent, clearPrEvent } = useTraining();
  const { currentUser: u } = useTreno();
  const [shareOpen, setShareOpen] = useState(false);

  // Se cierra sola a los 6 s, salvo que estés compartiendo
  useEffect(() => {
    if (!prEvent || shareOpen) return;
    const t = setTimeout(clearPrEvent, 6000);
    return () => clearTimeout(t);
  }, [prEvent, shareOpen, clearPrEvent]);

  const mejora = prEvent ? Math.round((prEvent.oneRm - prEvent.previo) * 10) / 10 : 0;
  const pct = prEvent && prEvent.previo > 0 ? Math.round(((prEvent.oneRm - prEvent.previo) / prEvent.previo) * 1000) / 10 : 0;

  const datos = useMemo<DatosTarjeta | null>(
    () =>
      prEvent
        ? {
            tipo: "pr",
            etiqueta: "Nuevo récord personal",
            titulo: prEvent.ejercicio,
            grande: String(prEvent.oneRm),
            unidad: "kg de 1RM estimado",
            subtitulo: `${prEvent.pesoKg} kg × ${prEvent.reps} repeticiones`,
            emoji: "🏆",
            datos: [
              { valor: `${prEvent.pesoKg}×${prEvent.reps}`, nombre: "Serie" },
              { valor: `+${mejora}`, nombre: "kg vs. antes" },
              { valor: `${pct}%`, nombre: "de mejora" },
            ],
            nombre: u.nombre,
            fecha: fechaLarga(),
          }
        : null,
    [prEvent, u.nombre, mejora, pct]
  );

  return (
    <>
      <AnimatePresence>
        {prEvent && (
          <motion.div
            key={prEvent.id}
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            className="fixed inset-x-4 top-[max(env(safe-area-inset-top),1rem)] z-[90] mx-auto max-w-sm"
            role="status"
            aria-live="assertive"
          >
            <div className="relative overflow-hidden rounded-[28px] border border-accent/50 bg-raised p-5 shadow-glow">
              <Confetti count={40} />
              <div className="relative flex items-center gap-4">
                <motion.span
                  initial={{ rotate: -20, scale: 0.4 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", damping: 8, stiffness: 220, delay: 0.1 }}
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-canvas"
                >
                  <Trophy className="h-8 w-8" />
                </motion.span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">¡Nuevo récord!</p>
                  <p className="mt-0.5 truncate font-display text-lg font-semibold leading-tight">{prEvent.ejercicio}</p>
                  <p className="num mt-1.5 text-sm text-white/70">
                    {prEvent.pesoKg} kg × {prEvent.reps} · 1RM <span className="text-accent">{prEvent.oneRm}</span> kg
                    {mejora > 0 && <span className="ml-1.5 text-accent">+{mejora}</span>}
                  </p>
                </div>
              </div>
              <div className="relative mt-4 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-canvas transition active:scale-95"
                >
                  <Share2 className="h-4 w-4" />
                  Compartir
                </button>
                <button
                  type="button"
                  onClick={clearPrEvent}
                  className="rounded-full bg-white/10 py-3 text-sm font-semibold transition hover:bg-white/15 active:scale-95"
                >
                  Seguir
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareSheet
        open={shareOpen}
        onClose={() => {
          setShareOpen(false);
          clearPrEvent();
        }}
        datos={datos}
      />
    </>
  );
}
