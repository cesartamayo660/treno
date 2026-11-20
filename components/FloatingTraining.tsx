"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dumbbell, Plus, X } from "lucide-react";
import { useNow, useTraining } from "@/lib/training";
import { MainTabId } from "@/components/AppNav";

export function fmt(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Widgets flotantes: temporizador de descanso (esquina, no tapa la pantalla)
 * y acceso rápido a tu entrenamiento en curso desde cualquier pestaña.
 */
export function FloatingTraining({
  activeTab,
  onGo,
}: {
  activeTab: MainTabId;
  onGo: (t: MainTabId) => void;
}) {
  const { session, rest, addRest, stopRest } = useTraining();
  const running = !!rest.endsAt;
  const now = useNow(250, running || !!session);

  const left = rest.endsAt ? (rest.endsAt - now) / 1000 : 0;
  const progress = rest.total > 0 ? Math.max(0, Math.min(1, left / rest.total)) : 0;

  // El aviso "¡A darle!" se muestra unos segundos al terminar el descanso
  const [showDone, setShowDone] = useState(false);
  useEffect(() => {
    if (!rest.doneAt) return setShowDone(false);
    setShowDone(true);
    const t = setTimeout(() => setShowDone(false), 5000);
    return () => clearTimeout(t);
  }, [rest.doneAt]);

  const elapsed = session ? Math.floor((now - session.startedAt) / 1000) : 0;
  const r = 15;
  const C = 2 * Math.PI * r;

  return (
    <div className="pointer-events-none fixed bottom-[5.75rem] right-4 z-50 flex flex-col items-end gap-2 lg:bottom-6 lg:right-6">
      <AnimatePresence>
        {session && activeTab !== "entrenar" && (
          <motion.button
            key="session"
            type="button"
            onClick={() => onGo("entrenar")}
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-raised/95 py-2 pl-3 pr-4 text-sm font-semibold shadow-card backdrop-blur-xl"
          >
            <Dumbbell className="h-4 w-4 text-accent" />
            <span>Entrenando</span>
            <span className="num text-white/60">{fmt(elapsed)}</span>
          </motion.button>
        )}

        {(running || showDone) && (
          <motion.div
            key="rest"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-2 shadow-card backdrop-blur-xl ${
              showDone && !running ? "border-accent bg-accent text-canvas" : "border-white/10 bg-raised/95"
            }`}
            role="timer"
            aria-label="Descanso"
          >
            {running ? (
              <>
                <span className="relative flex h-10 w-10 items-center justify-center">
                  <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
                    <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3" className="stroke-white/10" />
                    <circle
                      cx="18"
                      cy="18"
                      r={r}
                      fill="none"
                      strokeWidth="3"
                      strokeLinecap="round"
                      stroke="rgb(var(--c-accent))"
                      strokeDasharray={C}
                      strokeDashoffset={C * (1 - progress)}
                    />
                  </svg>
                </span>
                <span className="num min-w-[3.1rem] text-lg font-semibold">{fmt(left)}</span>
                <button
                  type="button"
                  onClick={() => addRest(15)}
                  aria-label="Sumar 15 segundos"
                  className="flex h-8 items-center gap-0.5 rounded-full bg-white/10 px-2.5 text-xs font-semibold transition hover:bg-white/20"
                >
                  <Plus className="h-3 w-3" />
                  15s
                </button>
                <button
                  type="button"
                  onClick={stopRest}
                  aria-label="Cancelar descanso"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <span className="px-4 py-2 text-sm font-semibold">¡A darle! Siguiente serie 💪</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
