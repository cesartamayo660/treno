"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, PanInfo } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Disc3, Minus, Monitor, Plus, SkipForward, Trophy, X } from "lucide-react";
import { exerciseById, useNow, useTraining } from "@/lib/training";
import { incrementoPara, sugerirSiguiente } from "@/lib/overload";
import { useWakeLock } from "@/lib/wakeLock";
import { fmt } from "@/components/FloatingTraining";
import { PlateCalculator } from "@/components/PlateCalculator";
import { Confetti } from "@/components/motion";

const vibrar = (ms: number | number[]) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* sin vibración */
  }
};

/**
 * Modo gimnasio: pantalla completa, un ejercicio a la vez, botones enormes,
 * descanso automático y la pantalla siempre encendida.
 */
export function GymMode({ onExit, onFinish }: { onExit: () => void; onFinish: () => void }) {
  const {
    session,
    history,
    lastOf,
    updateSet,
    toggleSet,
    addSet,
    applyLoad,
    setCurrentBlock,
    rest,
    restPref,
    startRest,
    addRest,
    stopRest,
  } = useTraining();

  const [selId, setSelId] = useState<string | null>(null);
  const [platesOpen, setPlatesOpen] = useState(false);
  const [dir, setDir] = useState(0);
  const now = useNow(250, true);
  const pantallaEncendida = useWakeLock(true);

  // Bloquea el scroll de la página de fondo
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const blocks = session?.blocks ?? [];
  const idx = Math.max(0, blocks.findIndex((b) => b.id === session?.currentBlockId));
  const block = blocks[idx];
  const ex = block ? exerciseById(block.exerciseId) : undefined;
  const last = block ? lastOf(block.exerciseId) : undefined;

  const sugerencia = useMemo(
    () => (block && ex ? sugerirSiguiente(history[block.exerciseId] ?? [], ex.equipo) : null),
    [block, ex, history]
  );

  if (!session || !block) return null;

  const pendientes = block.sets.filter((s) => !s.completed);
  const sel = block.sets.find((s) => s.id === selId) ?? pendientes[0] ?? block.sets[block.sets.length - 1];
  const selIdx = block.sets.findIndex((s) => s.id === sel.id);

  const totalSeries = blocks.reduce((t, b) => t + b.sets.length, 0);
  const hechas = blocks.reduce((t, b) => t + b.sets.filter((s) => s.completed).length, 0);
  const todoHecho = hechas === totalSeries && totalSeries > 0;
  const bloqueCompleto = pendientes.length === 0;
  const elapsed = Math.floor((now - session.startedAt) / 1000);

  const descansando = !!rest.endsAt;
  const left = rest.endsAt ? Math.max(0, (rest.endsAt - now) / 1000) : 0;
  const progresoDescanso = rest.total > 0 ? Math.max(0, Math.min(1, left / rest.total)) : 0;
  const recienTerminado = !!rest.doneAt && now - rest.doneAt < 4000 && !descansando;

  const stepPeso = ex ? incrementoPara(ex.equipo, sel.pesoKg || last?.pesoKg || 0) : 2.5;
  const mostrarPeso = sel.pesoKg || last?.pesoKg || 0;
  const esBarra = ex?.equipo === "Barra" || ex?.equipo === "Barra Hex";

  const irA = (i: number) => {
    const b = blocks[i];
    if (!b) return;
    setDir(i > idx ? 1 : -1);
    setSelId(null);
    setCurrentBlock(b.id);
  };

  const siguienteConTrabajo = () => {
    for (let k = 1; k <= blocks.length; k++) {
      const j = (idx + k) % blocks.length;
      if (blocks[j].sets.some((s) => !s.completed)) return j;
    }
    return -1;
  };

  const hecha = () => {
    if (sel.completed) {
      toggleSet(block.id, sel.id); // deshacer
      return;
    }
    toggleSet(block.id, sel.id);
    vibrar(25);
    setSelId(null);
    const quedan = totalSeries - hechas - 1;
    if (quedan > 0) startRest();
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -70) irA(Math.min(blocks.length - 1, idx + 1));
    else if (info.offset.x > 70) irA(Math.max(0, idx - 1));
  };

  const proxima = pendientes[0];
  const proximoTexto = proxima
    ? `Serie ${block.sets.findIndex((s) => s.id === proxima.id) + 1} de ${block.sets.length} · ${ex?.nombre}`
    : (() => {
        const j = siguienteConTrabajo();
        return j >= 0 ? `Siguiente ejercicio: ${exerciseById(blocks[j].exerciseId)?.nombre}` : "¡Último descanso!";
      })();

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-canvas text-white" role="dialog" aria-modal="true" aria-label="Modo gimnasio">
      {/* Cabecera */}
      <header className="mx-auto flex w-full max-w-md items-center gap-3 px-4 pb-2 pt-[max(env(safe-area-inset-top),0.9rem)]">
        <button
          type="button"
          onClick={onExit}
          aria-label="Salir del modo gimnasio"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 transition active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex gap-1" aria-label={`Ejercicio ${idx + 1} de ${blocks.length}`}>
            {blocks.map((b, i) => {
              const done = b.sets.every((s) => s.completed);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => irA(i)}
                  aria-label={`Ir al ejercicio ${i + 1}`}
                  className="group flex h-6 flex-1 items-center"
                >
                  <span
                    className={`h-1.5 w-full rounded-full transition ${
                      i === idx ? "bg-accent" : done ? "bg-accent/45" : "bg-white/15"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <p className="mt-0.5 flex items-center gap-2 text-[11px] text-white/45">
            <span className="num">{fmt(elapsed)}</span>
            <span>·</span>
            <span>
              {hechas}/{totalSeries} series
            </span>
            {pantallaEncendida && (
              <span className="ml-auto inline-flex items-center gap-1 text-accent/80">
                <Monitor className="h-3 w-3" /> Pantalla encendida
              </span>
            )}
          </p>
        </div>
      </header>

      {/* Cuerpo */}
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto overflow-x-hidden px-5 pb-4">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={block.id}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.18 }}
            className="flex flex-1 flex-col"
          >
            {/* Zona de deslizar entre ejercicios */}
            <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.25} onDragEnd={onDragEnd} className="touch-pan-y pt-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => irA(idx - 1)}
                  disabled={idx === 0}
                  aria-label="Ejercicio anterior"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/50 transition disabled:opacity-20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                  Ejercicio {idx + 1} de {blocks.length}
                </p>
                <button
                  type="button"
                  onClick={() => irA(idx + 1)}
                  disabled={idx === blocks.length - 1}
                  aria-label="Ejercicio siguiente"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/50 transition disabled:opacity-20"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
              <h2 className="mt-1 text-center font-display text-[1.9rem] font-semibold leading-[1.1] tracking-tight">
                {ex?.nombre ?? "Ejercicio"}
              </h2>
              <p className="mt-1.5 text-center text-sm text-white/45">
                {ex?.grupoMuscular} · {ex?.equipo}
                {last && (
                  <>
                    {" "}
                    · Anterior <span className="num text-white/75">{last.pesoKg} kg × {last.reps}</span>
                  </>
                )}
              </p>
            </motion.div>

            {/* Series */}
            <div className="mt-5 flex items-center justify-center gap-2.5" role="tablist" aria-label="Series">
              {block.sets.map((s, i) => {
                const activa = s.id === sel.id && !bloqueCompleto;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={activa}
                    aria-label={`Serie ${i + 1}${s.completed ? " hecha" : ""}`}
                    onClick={() => setSelId(s.id)}
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition ${
                      s.completed
                        ? "bg-accent text-canvas"
                        : activa
                        ? "bg-white/10 text-white ring-2 ring-accent"
                        : "border border-white/15 text-white/50"
                    }`}
                  >
                    {s.completed ? <Check className="h-5 w-5 stroke-[3]" /> : <span className="num">{i + 1}</span>}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => addSet(block.id)}
                aria-label="Añadir una serie"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-white/20 text-white/45 transition active:scale-90"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Sugerencia de sobrecarga */}
            {sugerencia && !bloqueCompleto && (
              <button
                type="button"
                onClick={() => {
                  applyLoad(block.id, sugerencia.pesoKg, sugerencia.reps);
                  vibrar(12);
                }}
                className="mx-auto mt-4 flex max-w-full items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-left text-[13px] transition active:scale-[0.98]"
              >
                <span className="text-accent">↗</span>
                <span className="min-w-0 truncate">
                  Hoy prueba{" "}
                  <strong className="num">
                    {sugerencia.pesoKg} kg × {sugerencia.reps}
                  </strong>
                </span>
                <span className="shrink-0 font-semibold text-accent">Aplicar</span>
              </button>
            )}

            {bloqueCompleto ? (
              <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                <motion.span
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-canvas shadow-glow"
                >
                  <Check className="h-10 w-10 stroke-[3]" />
                </motion.span>
                <h3 className="mt-5 font-display text-2xl font-semibold">
                  {todoHecho ? "¡Rutina completa!" : "Ejercicio terminado"}
                </h3>
                <p className="mt-1.5 max-w-xs text-sm text-white/55">
                  {todoHecho ? "Hiciste todas las series de hoy. Cierra la sesión cuando quieras." : "Buen trabajo. Pasa al siguiente cuando estés listo."}
                </p>
              </div>
            ) : (
              <div className="mt-5 grid flex-1 grid-cols-1 content-center gap-3 [&>*]:min-w-0">
                {/* Peso */}
                <div className="rounded-3xl bg-white/[0.06] p-3">
                  <div className="flex items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    <span>Peso (kg)</span>
                    {esBarra && (
                      <button
                        type="button"
                        onClick={() => setPlatesOpen(true)}
                        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] normal-case tracking-normal text-white/80 transition active:scale-95"
                      >
                        <Disc3 className="h-3.5 w-3.5" /> Discos
                      </button>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <Stepper label="Restar peso" onClick={() => updateSet(block.id, sel.id, "pesoKg", Math.max(0, Math.round((mostrarPeso - stepPeso) * 100) / 100))}>
                      <Minus className="h-7 w-7" />
                    </Stepper>
                    <input
                      type="number"
                      inputMode="decimal"
                      step={0.5}
                      value={sel.pesoKg || ""}
                      placeholder={last ? String(last.pesoKg) : "0"}
                      onChange={(e) => updateSet(block.id, sel.id, "pesoKg", Number(e.target.value) || 0)}
                      aria-label="Peso de la serie"
                      className="num w-0 min-w-0 flex-1 bg-transparent text-center text-[4rem] font-semibold leading-none placeholder:text-white/15 focus:outline-none"
                    />
                    <Stepper label="Sumar peso" onClick={() => updateSet(block.id, sel.id, "pesoKg", Math.round((mostrarPeso + stepPeso) * 100) / 100)}>
                      <Plus className="h-7 w-7" />
                    </Stepper>
                  </div>
                </div>

                {/* Repeticiones */}
                <div className="rounded-3xl bg-white/[0.06] p-3">
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Repeticiones</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <Stepper label="Restar repetición" onClick={() => updateSet(block.id, sel.id, "reps", Math.max(0, sel.reps - 1))}>
                      <Minus className="h-7 w-7" />
                    </Stepper>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={sel.reps || ""}
                      placeholder={last ? String(last.reps) : "8"}
                      onChange={(e) => updateSet(block.id, sel.id, "reps", Number(e.target.value) || 0)}
                      aria-label="Repeticiones de la serie"
                      className="num w-0 min-w-0 flex-1 bg-transparent text-center text-[4rem] font-semibold leading-none placeholder:text-white/15 focus:outline-none"
                    />
                    <Stepper label="Sumar repetición" onClick={() => updateSet(block.id, sel.id, "reps", sel.reps + 1)}>
                      <Plus className="h-7 w-7" />
                    </Stepper>
                  </div>
                </div>

                {sel.esPr && (
                  <p className="flex items-center justify-center gap-1.5 rounded-2xl bg-accent/15 px-3 py-2 text-sm font-semibold text-accent">
                    <Trophy className="h-4 w-4" /> ¡Récord personal en esta serie!
                  </p>
                )}
                {sel.aviso && <p className="rounded-2xl bg-warn/10 px-3 py-2 text-[13px] leading-snug text-warn">⚠️ {sel.aviso}</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Acción principal */}
      <footer className="mx-auto w-full max-w-md px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2">
        {todoHecho ? (
          <button
            type="button"
            onClick={onFinish}
            className="pulse-glow h-[4.5rem] w-full rounded-full bg-accent text-xl font-semibold text-canvas transition active:scale-[0.98]"
          >
            Terminar entrenamiento
          </button>
        ) : bloqueCompleto ? (
          <button
            type="button"
            onClick={() => {
              const j = siguienteConTrabajo();
              if (j >= 0) irA(j);
            }}
            className="flex h-[4.5rem] w-full items-center justify-center gap-2 rounded-full bg-white text-xl font-semibold text-canvas transition active:scale-[0.98]"
          >
            Siguiente ejercicio <SkipForward className="h-6 w-6" />
          </button>
        ) : (
          <button
            type="button"
            onClick={hecha}
            className={`flex h-[4.5rem] w-full items-center justify-center gap-2.5 rounded-full text-xl font-semibold transition active:scale-[0.98] ${
              sel.completed ? "bg-white/10 text-white" : "bg-accent text-canvas shadow-glow"
            }`}
          >
            {sel.completed ? (
              "Hecha · toca para deshacer"
            ) : recienTerminado ? (
              "¡A darle! Serie hecha"
            ) : (
              <>
                <Check className="h-7 w-7 stroke-[3]" />
                Serie {selIdx + 1} hecha
              </>
            )}
          </button>
        )}
        {!todoHecho && (
          <button
            type="button"
            onClick={onFinish}
            className="mx-auto mt-2 block py-1.5 text-xs font-medium text-white/40 underline underline-offset-4 transition hover:text-white"
          >
            Terminar entrenamiento
          </button>
        )}
      </footer>

      {/* Descanso a pantalla completa */}
      <AnimatePresence>
        {descansando && (
          <motion.div
            key="rest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-canvas px-6"
            role="timer"
            aria-label="Descanso"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Descanso</p>
            <div className="relative mt-5 h-[17rem] w-[17rem]">
              <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
                <circle cx="110" cy="110" r="98" fill="none" strokeWidth="10" className="stroke-white/10" />
                <circle
                  cx="110"
                  cy="110"
                  r="98"
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  stroke="rgb(var(--c-accent))"
                  strokeDasharray={2 * Math.PI * 98}
                  strokeDashoffset={2 * Math.PI * 98 * (1 - progresoDescanso)}
                  style={{ filter: "drop-shadow(0 0 10px rgb(var(--c-accent) / 0.5))", transition: "stroke-dashoffset 0.25s linear" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="num text-[5.5rem] font-semibold">{fmt(left)}</span>
              </span>
            </div>
            <p className="mt-6 max-w-xs text-center text-sm leading-snug text-white/55">
              A continuación
              <span className="mt-1 block font-semibold text-white">{proximoTexto}</span>
            </p>
            <div className="mt-7 grid w-full max-w-xs grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => addRest(15)}
                className="h-14 rounded-full bg-white/10 text-base font-semibold transition active:scale-95"
              >
                +15 s
              </button>
              <button
                type="button"
                onClick={stopRest}
                className="h-14 rounded-full bg-white text-base font-semibold text-canvas transition active:scale-95"
              >
                Saltar
              </button>
            </div>
            <p className="mt-4 text-xs text-white/35">Descanso habitual: {fmt(restPref)}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {recienTerminado && (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-10 flex justify-center">
          <Confetti count={14} />
        </div>
      )}

      <PlateCalculator
        z="z-[80]"
        open={platesOpen}
        onClose={() => setPlatesOpen(false)}
        initialKg={sel.pesoKg || last?.pesoKg || sugerencia?.pesoKg || 60}
        onUse={(kg) => updateSet(block.id, sel.id, "pesoKg", kg)}
      />
    </div>
  );
}

function Stepper({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={() => {
        vibrar(8);
        onClick();
      }}
      aria-label={label}
      className="flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-2xl bg-white/10 transition hover:bg-white/15"
    >
      {children}
    </motion.button>
  );
}
