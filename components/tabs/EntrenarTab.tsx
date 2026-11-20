"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, Reorder, useDragControls } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Check,
  ChevronRight,
  Clock,
  Flame,
  GripVertical,
  HelpCircle,
  Pencil,
  Play,
  Plus,
  Search,
  Timer,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { EXERCISES_LIBRARY, ExerciseItem } from "@/lib/exercisesData";
import { calculate1RM } from "@/lib/bodyMetrics";
import {
  Block,
  exerciseById,
  Routine,
  SessionSummary,
  STARTER_ROUTINES,
  useNow,
  useTraining,
} from "@/lib/training";
import { useTreno } from "@/lib/store";
import { Eyebrow, Sheet, SheetHeader } from "@/components/ui";
import { Confetti, Item, Stagger } from "@/components/motion";
import { fmt } from "@/components/FloatingTraining";

const MUSCLES = ["Todos", "Pecho", "Espalda", "Piernas", "Glúteos", "Hombros", "Brazos", "Core"] as const;
const REST_OPTIONS = [60, 90, 120, 180];

const nombreEj = (id: string) => exerciseById(id)?.nombre ?? "Ejercicio";

/* ───────────────────────── Selector de ejercicios ───────────────────────── */
function ExercisePicker({
  open,
  onClose,
  onPick,
  title = "Añadir ejercicio",
}: {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
  title?: string;
}) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<(typeof MUSCLES)[number]>("Todos");

  const list = useMemo(
    () =>
      EXERCISES_LIBRARY.filter(
        (e) =>
          (muscle === "Todos" || e.grupoMuscular === muscle) &&
          e.nombre.toLowerCase().includes(q.trim().toLowerCase())
      ),
    [q, muscle]
  );

  return (
    <Sheet open={open} onClose={onClose} label={title}>
      <SheetHeader title={title} onClose={onClose} />
      <label className="relative mt-4 block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar ejercicio"
          className="w-full rounded-full border border-white/12 bg-white/[0.05] py-3 pl-11 pr-4 text-sm placeholder:text-white/30 focus:border-accent/70 focus:outline-none"
        />
      </label>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        {MUSCLES.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMuscle(m)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              muscle === m ? "bg-white text-canvas" : "border border-white/10 text-white/60"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <ul className="mt-3 divide-y divide-white/10">
        {list.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => {
                onPick(e.id);
                onClose();
              }}
              className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:opacity-80"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{e.nombre}</span>
                <span className="block text-xs text-white/45">
                  {e.grupoMuscular} · {e.equipo}
                </span>
              </span>
              <Plus className="h-4 w-4 shrink-0 text-accent" />
            </button>
          </li>
        ))}
        {list.length === 0 && <li className="py-8 text-center text-sm text-white/40">Sin resultados.</li>}
      </ul>
    </Sheet>
  );
}

/* ───────────────────────── ¿Qué es el 1RM? ───────────────────────── */
function OneRmHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} label="¿Qué es el 1RM?">
      <SheetHeader eyebrow="En palabras simples" title="¿Qué es el 1RM estimado?" onClose={onClose} />
      <p className="mt-4 text-[15px] leading-relaxed text-white/75">
        Es el peso máximo que podrías levantar <strong className="text-white">una sola vez</strong> en un ejercicio.
        No hace falta que lo pruebes: la app lo calcula con tus series normales.
      </p>
      <div className="mt-4 rounded-2xl bg-white/[0.06] p-4 text-sm leading-relaxed">
        <p className="font-semibold">Ejemplo</p>
        <p className="mt-1 text-white/70">
          Haces 80 kg × 6 repeticiones → tu 1RM estimado es de ~93 kg. Si la próxima vez haces 85 kg × 6, tu 1RM sube a
          ~99 kg: <span className="text-accent">¡récord personal!</span>
        </p>
      </div>
      <h3 className="mt-5 font-display text-base font-semibold">¿Y la alerta de “salto”?</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-white/75">
        Si tu 1RM estimado sube <strong className="text-white">más de 18 %</strong> de golpe frente a tu mejor marca,
        te lo avisamos: puede ser real (¡felicidades!) o un error al escribir el peso. Tu Crew puede validarlo con un toque.
      </p>
      <p className="mt-4 text-xs text-white/40">Fórmulas: Brzycki hasta 10 repeticiones y Epley desde 11.</p>
    </Sheet>
  );
}

/* ───────────────────────── Fila arrastrable ───────────────────────── */
function DragRow({
  value,
  children,
}: {
  value: unknown;
  children: (controls: ReturnType<typeof useDragControls>) => React.ReactNode;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={value}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.02, boxShadow: "0 18px 40px -12px rgba(0,0,0,0.6)", zIndex: 5 }}
      className="relative list-none"
    >
      {children(controls)}
    </Reorder.Item>
  );
}

function Handle({ controls }: { controls: ReturnType<typeof useDragControls> }) {
  return (
    <button
      type="button"
      aria-label="Arrastrar para reordenar"
      onPointerDown={(e) => controls.start(e)}
      className="flex h-10 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-white/35 active:cursor-grabbing"
    >
      <GripVertical className="h-5 w-5" />
    </button>
  );
}

/* ───────────────────────── Constructor de rutina ───────────────────────── */
function Builder({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: { id?: string; nombre: string; ejercicios: string[] } | null;
}) {
  const { saveRoutine, startSession } = useTraining();
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [ids, setIds] = useState<string[]>(initial?.ejercicios ?? []);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Reinicia el formulario cada vez que se abre con otros datos
  const key = `${open}-${initial?.id ?? "nuevo"}-${initial?.nombre ?? ""}`;
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setNombre(initial?.nombre ?? "");
    setIds(initial?.ejercicios ?? []);
  }

  const canGo = ids.length > 0;

  return (
    <>
      <Sheet open={open} onClose={onClose} label="Armar entrenamiento">
        <SheetHeader
          eyebrow={initial?.id ? "Editar rutina" : "Nuevo"}
          title="Arma tu entrenamiento"
          onClose={onClose}
        />
        <label className="mt-5 block">
          <span className="text-sm font-medium text-white/60">Nombre</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={40}
            placeholder="Ej. Pecho y tríceps"
            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3.5 text-base font-semibold placeholder:text-white/25 focus:border-accent/70 focus:outline-none"
          />
        </label>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm font-medium text-white/60">Ejercicios · arrastra para ordenar</p>
          <span className="num text-xs text-white/40">{ids.length}</span>
        </div>

        <Reorder.Group axis="y" values={ids} onReorder={setIds} className="mt-2 space-y-2">
          {ids.map((id) => (
            <DragRow key={id} value={id}>
              {(c) => (
                <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-raised py-1 pl-1 pr-2">
                  <Handle controls={c} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{nombreEj(id)}</span>
                  <button
                    type="button"
                    aria-label="Quitar ejercicio"
                    onClick={() => setIds((p) => p.filter((x) => x !== id))}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </DragRow>
          ))}
        </Reorder.Group>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-3.5 text-sm font-semibold text-white/70 transition hover:bg-white/5"
        >
          <Plus className="h-4 w-4" />
          Añadir ejercicio
        </button>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!canGo}
            onClick={() => {
              saveRoutine({ id: initial?.id, nombre: nombre.trim() || "Mi rutina", ejercicios: ids });
              onClose();
            }}
            className="rounded-full border border-white/15 py-3.5 text-sm font-semibold transition hover:bg-white/5 disabled:opacity-40"
          >
            Guardar rutina
          </button>
          <button
            type="button"
            disabled={!canGo}
            onClick={() => {
              startSession(nombre.trim() || "Entrenamiento", ids);
              onClose();
            }}
            className="rounded-full bg-accent py-3.5 text-sm font-semibold text-canvas shadow-glow transition disabled:opacity-40 disabled:shadow-none"
          >
            Empezar ahora
          </button>
        </div>
      </Sheet>
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(id) => setIds((p) => (p.includes(id) ? p : [...p, id]))}
      />
    </>
  );
}

/* ───────────────────────── Sesión activa ───────────────────────── */
function ActiveSession({ onFinished }: { onFinished: (s: SessionSummary) => void }) {
  const {
    session,
    setBlocks,
    setCurrentBlock,
    addExercise,
    removeBlock,
    addSet,
    updateSet,
    toggleSet,
    lastOf,
    rest,
    restPref,
    setRestPref,
    startRest,
    finishSession,
    discardSession,
  } = useTraining();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const now = useNow(1000, true);

  if (!session) return null;
  const current = session.blocks.find((b) => b.id === session.currentBlockId) ?? session.blocks[0];
  const ex = exerciseById(current.exerciseId);
  const last = lastOf(current.exerciseId);
  const elapsed = Math.floor((now - session.startedAt) / 1000);

  const totalSets = session.blocks.reduce((t, b) => t + b.sets.length, 0);
  const doneSets = session.blocks.reduce((t, b) => t + b.sets.filter((s) => s.completed).length, 0);
  const restRunning = !!rest.endsAt;

  const done = (b: Block) => b.sets.filter((s) => s.completed).length;

  const onToggle = (setId: string) => {
    toggleSet(current.id, setId);
    try {
      navigator.vibrate?.(15);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="space-y-5">
      {/* Barra superior */}
      <div className="glass-card flex items-center justify-between gap-3 rounded-full py-2 pl-5 pr-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <Clock className="h-4 w-4 text-accent" />
            <span className="num">{fmt(elapsed)}</span>
          </span>
          <span className="truncate text-xs text-white/45">
            {doneSets}/{totalSets} series
          </span>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-canvas transition active:scale-95"
        >
          Terminar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr] lg:items-start [&>*]:min-w-0">
        {/* Ejercicio actual */}
        <section className="glass-card rounded-card p-5 sm:p-6">
          <Eyebrow>Ejercicio actual</Eyebrow>
          <h2 className="mt-1.5 font-display text-2xl font-semibold leading-tight tracking-tight">
            {ex?.nombre ?? "Ejercicio"}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-white/50">
            <span>{ex?.grupoMuscular} · {ex?.equipo}</span>
            {last && (
              <span className="text-white/40">
                · Última vez: <span className="num text-white/70">{last.pesoKg} kg × {last.reps}</span>
              </span>
            )}
          </p>

          <div className="mt-5 grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-x-2.5 gap-y-2.5 text-center">
            <span className="text-[11px] font-medium text-white/40">Serie</span>
            <span className="text-[11px] font-medium text-white/40">Peso (kg)</span>
            <span className="text-[11px] font-medium text-white/40">Reps</span>
            <span />
            {current.sets.map((s, i) => (
              <React.Fragment key={s.id}>
                <span className="num text-sm font-semibold text-white/50">{i + 1}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={0.5}
                  value={s.pesoKg || ""}
                  placeholder={last ? String(last.pesoKg) : "0"}
                  onChange={(e) => updateSet(current.id, s.id, "pesoKg", Number(e.target.value) || 0)}
                  className={`num w-full rounded-xl border bg-white/[0.05] py-3 text-center text-lg font-semibold placeholder:text-white/20 focus:border-accent/70 focus:outline-none ${
                    s.completed ? "border-accent/40 text-white/70" : "border-white/10"
                  }`}
                  aria-label={`Peso serie ${i + 1}`}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={s.reps || ""}
                  placeholder={last ? String(last.reps) : "8"}
                  onChange={(e) => updateSet(current.id, s.id, "reps", Number(e.target.value) || 0)}
                  className={`num w-full rounded-xl border bg-white/[0.05] py-3 text-center text-lg font-semibold placeholder:text-white/20 focus:border-accent/70 focus:outline-none ${
                    s.completed ? "border-accent/40 text-white/70" : "border-white/10"
                  }`}
                  aria-label={`Repeticiones serie ${i + 1}`}
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onClick={() => onToggle(s.id)}
                  aria-pressed={s.completed}
                  aria-label={`Marcar serie ${i + 1}`}
                  className={`flex h-12 w-full items-center justify-center rounded-xl transition ${
                    s.completed ? "bg-accent text-canvas" : "border border-white/15 text-white/40 hover:bg-white/5"
                  }`}
                >
                  <Check className="h-5 w-5 stroke-[3]" />
                </motion.button>

                {(s.esPr || s.aviso) && (
                  <div className="col-span-4 -mt-0.5 text-left">
                    {s.esPr && (
                      <motion.p
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="flex items-center gap-1.5 rounded-xl bg-accent/15 px-3 py-2 text-[13px] font-semibold text-accent"
                      >
                        <Trophy className="h-4 w-4" />
                        ¡Récord personal! 1RM estimado {calculate1RM(s.pesoKg, s.reps).principal1RM} kg
                      </motion.p>
                    )}
                    {s.aviso && (
                      <p className="mt-1.5 rounded-xl bg-warn/10 px-3 py-2 text-[13px] leading-snug text-warn">
                        ⚠️ {s.aviso}{" "}
                        <button type="button" onClick={() => setHelpOpen(true)} className="font-semibold underline underline-offset-2">
                          ¿Qué significa?
                        </button>
                      </p>
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => addSet(current.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/5"
            >
              <Plus className="h-4 w-4" />
              Serie
            </button>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white/45 transition hover:text-white"
            >
              <HelpCircle className="h-4 w-4" />
              ¿Qué es el 1RM?
            </button>
          </div>

          {/* Descanso con un botón */}
          <div className="mt-5 rounded-2xl bg-white/[0.05] p-3">
            <button
              type="button"
              onClick={() => startRest()}
              className={`flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-base font-semibold transition active:scale-[0.99] ${
                restRunning ? "bg-white/10 text-white" : "bg-accent text-canvas shadow-glow"
              }`}
            >
              <Timer className="h-5 w-5" />
              {restRunning ? "Reiniciar descanso" : `Descansar ${fmt(restPref)}`}
            </button>
            <div className="mt-2.5 flex items-center justify-center gap-1.5">
              {REST_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRestPref(s)}
                  aria-pressed={restPref === s}
                  className={`num rounded-full px-3 py-1 text-xs font-semibold transition ${
                    restPref === s ? "bg-white text-canvas" : "text-white/50 hover:text-white"
                  }`}
                >
                  {fmt(s)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Cola de ejercicios */}
        <section className="glass-card rounded-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Tu orden de hoy</h2>
            <span className="text-xs text-white/40">Arrastra si una máquina está ocupada</span>
          </div>
          <Reorder.Group axis="y" values={session.blocks} onReorder={setBlocks} className="mt-3 space-y-2">
            {session.blocks.map((b) => {
              const active = b.id === current.id;
              const complete = done(b) === b.sets.length && b.sets.length > 0;
              return (
                <DragRow key={b.id} value={b}>
                  {(c) => (
                    <div
                      className={`flex items-center gap-1 rounded-2xl border py-1 pl-1 pr-2 transition ${
                        active ? "border-accent bg-accent/10" : "border-white/10 bg-raised"
                      }`}
                    >
                      <Handle controls={c} />
                      <button type="button" onClick={() => setCurrentBlock(b.id)} className="min-w-0 flex-1 py-2 text-left">
                        <span className={`block truncate text-sm font-semibold ${complete ? "text-white/45 line-through" : ""}`}>
                          {nombreEj(b.exerciseId)}
                        </span>
                        <span className="num block text-xs text-white/40">
                          {done(b)}/{b.sets.length} series
                        </span>
                      </button>
                      {complete ? (
                        <Check className="mr-1 h-4 w-4 text-accent" />
                      ) : (
                        <button
                          type="button"
                          aria-label="Quitar ejercicio"
                          onClick={() => removeBlock(b.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition hover:bg-white/10 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </DragRow>
              );
            })}
          </Reorder.Group>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/5"
          >
            <Plus className="h-4 w-4" />
            Añadir ejercicio
          </button>
        </section>
      </div>

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={addExercise} />
      <OneRmHelp open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Confirmación de terminar */}
      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} label="Terminar entrenamiento">
        <div className="text-center">
          <p className="text-5xl">{doneSets === 0 ? "🤨" : doneSets < totalSets / 2 ? "🧐" : "🔥"}</p>
          <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">
            {doneSets === 0 ? "¿Seguro, máquina?" : doneSets < totalSets / 2 ? "¿Ya te vas, máquina?" : "¿Cerramos la sesión, máquina?"}
          </h3>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-white/60">
            {doneSets === 0
              ? "Aún no marcaste ninguna serie. Entrar al gimnasio ya es la mitad del trabajo."
              : `Llevas ${doneSets} de ${totalSets} series en ${fmt(elapsed)}. ${
                  doneSets === totalSets ? "Completaste todo lo de hoy." : "Aún queda trabajo por hacer."
                }`}
          </p>
        </div>
        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => {
              setConfirmOpen(false);
              const s = finishSession();
              if (s) onFinished(s);
            }}
            className="rounded-full bg-accent py-4 text-base font-semibold text-canvas shadow-glow transition active:scale-[0.99]"
          >
            Sí, entrené como una máquina 💪
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmOpen(false);
              discardSession();
            }}
            className="rounded-full border border-white/15 py-3.5 text-sm font-semibold text-white/70 transition hover:bg-white/5"
          >
            No, me cansé y me voy 🍼 (no se guarda)
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="py-2 text-sm font-medium text-white/50 underline underline-offset-4 transition hover:text-white"
          >
            Seguir entrenando
          </button>
        </div>
      </Sheet>
    </div>
  );
}

/* ───────────────────────── Resumen ───────────────────────── */
function Summary({ s, onClose }: { s: SessionSummary; onClose: () => void }) {
  const { currentUser: u } = useTreno();
  const frases = ["Eso fue una sesión brutal.", "Así se construye la constancia.", "Tu yo de hace un mes estaría orgulloso."];
  const frase = s.prs.length ? "¡Rompiste un récord personal!" : frases[s.duracionMin % frases.length];

  const items = [
    { v: `${s.duracionMin}`, u: "min", l: "Duración" },
    { v: `${s.seriesHechas}`, u: "", l: "Series" },
    { v: `${s.ejercicios}`, u: "", l: "Ejercicios" },
    { v: `${u.rachaDias}`, u: u.rachaDias === 1 ? "día" : "días", l: "Racha" },
  ];

  return (
    <div className="relative mx-auto max-w-md space-y-5 pt-6 text-center">
      <Confetti count={s.prs.length ? 44 : 26} />
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 12, stiffness: 180 }} className="text-6xl">
        {s.prs.length ? "🏆" : "💪"}
      </motion.div>
      <div>
        <Eyebrow>Sesión terminada</Eyebrow>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight">{frase}</h1>
        <p className="mt-2 text-white/50">{s.nombre}</p>
      </div>

      <Stagger className="grid grid-cols-2 gap-3">
        {items.map((i) => (
          <Item key={i.l}>
            <div className="glass-card rounded-2xl p-4">
              <p className="num text-4xl font-semibold text-accent">
                {i.v}
                <span className="ml-1 text-base text-white/45">{i.u}</span>
              </p>
              <p className="mt-1.5 text-xs text-white/45">{i.l}</p>
            </div>
          </Item>
        ))}
      </Stagger>

      {s.prs.length > 0 && (
        <div className="glass-card rounded-card p-4 text-left">
          <Eyebrow>Récords de hoy</Eyebrow>
          <ul className="mt-3 space-y-2.5">
            {s.prs.map((p) => (
              <li key={p.ejercicio} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Trophy className="h-4 w-4 shrink-0 text-accent" />
                  <span className="truncate font-semibold">{p.ejercicio}</span>
                </span>
                <span className="num text-white/60">1RM {p.oneRm} kg</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-full bg-accent py-4 text-base font-semibold text-canvas shadow-glow transition active:scale-[0.99]"
      >
        Listo
      </button>
    </div>
  );
}

/* ───────────────────────── Detalle de ejercicio (historial real) ───────────────────────── */
function ExerciseDetail({ ex, onClose }: { ex: ExerciseItem | null; onClose: () => void }) {
  const { history } = useTraining();
  const [helpOpen, setHelpOpen] = useState(false);
  const last = React.useRef<ExerciseItem | null>(null);
  if (ex) last.current = ex;
  const e = ex ?? last.current;
  const h = e ? history[e.id] ?? [] : [];
  const best = h.reduce((m, x) => Math.max(m, x.oneRm), 0);

  return (
    <>
      <Sheet open={!!ex} onClose={onClose} label="Detalle de ejercicio">
        {e && (
          <>
            <SheetHeader eyebrow={`${e.grupoMuscular} · ${e.equipo}`} title={e.nombre} onClose={onClose} />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[0.06] p-4">
                <p className="text-xs text-white/45">Mejor 1RM estimado</p>
                <p className="num mt-1.5 text-3xl font-semibold text-accent">
                  {best ? best : "—"}
                  {best ? <span className="ml-1 text-base text-white/45">kg</span> : null}
                </p>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-4">
                <p className="text-xs text-white/45">Sesiones</p>
                <p className="num mt-1.5 text-3xl font-semibold">{h.length}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition hover:text-white"
            >
              <HelpCircle className="h-4 w-4" />
              ¿Qué es el 1RM estimado?
            </button>

            <h3 className="mt-5 font-display text-base font-semibold">Tu historial</h3>
            {h.length === 0 ? (
              <p className="mt-2 rounded-2xl border border-dashed border-white/15 p-5 text-center text-sm text-white/45">
                Aún no has hecho este ejercicio. Después de tu primera sesión verás aquí tu progreso.
              </p>
            ) : (
              <>
                {h.length > 1 && (
                  <div className="mt-3 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={h} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="exFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgb(var(--c-accent))" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="rgb(var(--c-accent))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="fecha" tickFormatter={(v) => String(v).slice(5)} stroke="rgb(var(--c-ink) / 0.4)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis domain={["dataMin - 5", "dataMax + 5"]} stroke="rgb(var(--c-ink) / 0.4)" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "rgb(var(--c-raised))", borderRadius: "14px", border: "1px solid rgb(var(--c-ink) / 0.15)", fontSize: "12px", color: "rgb(var(--c-ink))" }}
                          formatter={(v: number) => [`${v} kg`, "1RM est."]}
                        />
                        <Area type="monotone" dataKey="oneRm" stroke="rgb(var(--c-accent))" strokeWidth={2.5} fill="url(#exFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10 px-4">
                  {[...h].reverse().slice(0, 8).map((x, i) => (
                    <li key={x.fecha + i} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-white/50">{x.fecha}</span>
                      <span className="num font-semibold">
                        {x.pesoKg} kg × {x.reps}
                        <span className="ml-2 font-normal text-white/40">1RM {x.oneRm}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </Sheet>
      <OneRmHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}

/* ───────────────────────── Pestaña ───────────────────────── */
export function EntrenarTab() {
  const { routines, saveRoutine, deleteRoutine, session, startSession } = useTraining();

  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [builder, setBuilder] = useState<{ open: boolean; initial: { id?: string; nombre: string; ejercicios: string[] } | null }>({
    open: false,
    initial: null,
  });
  const [libOpen, setLibOpen] = useState(false);
  const [detail, setDetail] = useState<ExerciseItem | null>(null);
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<(typeof MUSCLES)[number]>("Todos");

  const libList = useMemo(
    () =>
      EXERCISES_LIBRARY.filter(
        (e) => (muscle === "Todos" || e.grupoMuscular === muscle) && e.nombre.toLowerCase().includes(q.trim().toLowerCase())
      ),
    [q, muscle]
  );

  if (summary) return <Summary s={summary} onClose={() => setSummary(null)} />;
  if (session) return <ActiveSession onFinished={setSummary} />;

  const openNew = () => setBuilder({ open: true, initial: null });
  const edit = (r: Routine) => setBuilder({ open: true, initial: r });

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Entrenar</h1>

      {/* Protagonista */}
      <section className="rounded-card bg-white p-6 text-canvas sm:p-8">
        <Eyebrow className="!text-canvas/55">Hoy</Eyebrow>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          ¿Qué vas a entrenar?
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-canvas/65">
          Elige tus ejercicios, ordénalos como quieras y empieza. Si una máquina está ocupada, cambias el orden al vuelo.
        </p>
        <button
          type="button"
          onClick={openNew}
          className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-canvas py-4 text-base font-semibold text-white transition active:scale-[0.99] sm:w-auto sm:px-9"
        >
          <Plus className="h-5 w-5" />
          Armar mi entrenamiento
        </button>
      </section>

      <Stagger className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start [&>*]:min-w-0">
        {/* Mis rutinas */}
        <Item>
          <section className="glass-card rounded-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Mis rutinas</h2>
              <button type="button" onClick={openNew} className="text-xs font-semibold text-accent">
                + Nueva
              </button>
            </div>
            {routines.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-white/15 p-5 text-center text-sm text-white/45">
                Aún no tienes rutinas guardadas. Arma una y toca <strong className="text-white/70">Guardar rutina</strong>, o parte de una plantilla.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-white/10">
                {routines.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{r.nombre}</span>
                      <span className="block truncate text-xs text-white/45">
                        {r.ejercicios.length} ejercicios · {r.ejercicios.slice(0, 2).map(nombreEj).join(", ")}
                      </span>
                    </span>
                    <button type="button" aria-label="Editar" onClick={() => edit(r)} className="flex h-9 w-9 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label="Eliminar" onClick={() => deleteRoutine(r.id)} className="flex h-9 w-9 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startSession(r.nombre, r.ejercicios)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-canvas"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Iniciar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Item>

        {/* Plantillas */}
        <Item>
          <section className="glass-card rounded-card p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">Plantillas para empezar</h2>
            <p className="mt-1 text-xs text-white/45">Cópialas a tus rutinas y modifícalas a tu gusto.</p>
            <ul className="mt-4 divide-y divide-white/10">
              {STARTER_ROUTINES.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{t.nombre}</span>
                    <span className="block truncate text-xs text-white/45">{t.ejercicios.map(nombreEj).slice(0, 3).join(" · ")}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => saveRoutine({ nombre: t.nombre, ejercicios: t.ejercicios })}
                    className="rounded-full border border-white/15 px-3.5 py-2 text-xs font-semibold transition hover:bg-white/5"
                  >
                    Copiar
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </Item>

        {/* Biblioteca */}
        <Item className="lg:col-span-2">
          <section className="glass-card rounded-card p-5 sm:p-6">
            <button type="button" onClick={() => setLibOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={libOpen}>
              <span>
                <span className="block font-display text-lg font-semibold">Biblioteca de ejercicios</span>
                <span className="block text-xs text-white/45">{EXERCISES_LIBRARY.length} ejercicios · toca uno para ver tu 1RM e historial</span>
              </span>
              <ChevronRight className={`h-5 w-5 shrink-0 text-white/40 transition-transform ${libOpen ? "rotate-90" : ""}`} />
            </button>

            <AnimatePresence initial={false}>
              {libOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <label className="relative mt-4 block">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ejercicio" className="w-full rounded-full border border-white/12 bg-white/[0.05] py-3 pl-11 pr-4 text-sm placeholder:text-white/30 focus:border-accent/70 focus:outline-none" />
                  </label>
                  <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
                    {MUSCLES.map((m) => (
                      <button key={m} type="button" onClick={() => setMuscle(m)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${muscle === m ? "bg-white text-canvas" : "border border-white/10 text-white/60"}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                  <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
                    {libList.map((e) => (
                      <li key={e.id} className="border-b border-white/10">
                        <button type="button" onClick={() => setDetail(e)} className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:opacity-80">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{e.nombre}</span>
                            <span className="block text-xs text-white/45">{e.grupoMuscular} · {e.equipo}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            {e.esPrincipal && <Flame className="h-3.5 w-3.5 text-accent" aria-label="Ejercicio básico" />}
                            <ChevronRight className="h-4 w-4 text-white/30" />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </Item>
      </Stagger>

      <Builder open={builder.open} onClose={() => setBuilder((b) => ({ ...b, open: false }))} initial={builder.initial} />
      <ExerciseDetail ex={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
