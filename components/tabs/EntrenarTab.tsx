"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Award,
  Check,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Play,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { EXERCISES_LIBRARY, ExerciseItem } from "@/lib/exercisesData";
import { calculate1RM, calculateDOTS } from "@/lib/bodyMetrics";
import { detectOutlierJump } from "@/lib/trenoScore";
import { useTreno } from "@/lib/store";

interface ActiveSetRow {
  orden: number;
  pesoKg: number;
  reps: number;
  rpe: number;
  prevPesoKg: number;
  prevReps: number;
  completed: boolean;
  esPr: boolean;
  outlierWarning?: string | null;
}

interface ActiveExerciseBlock {
  exercise: ExerciseItem;
  sets: ActiveSetRow[];
}

const SAVED_ROUTINES = [
  {
    id: "rut-upper",
    nombre: "Upper Body Strength & Hypertrophy",
    foco: "Pecho · Espalda · Hombros",
    duracionMin: 55,
    ejerciciosIds: ["ex-bench", "ex-pullups", "ex-ohp", "ex-incline-db", "ex-seated-row"],
  },
  {
    id: "rut-lower",
    nombre: "Lower Body Power (Pierna & Glúteo)",
    foco: "Sentadilla · Rumano · Prensa · Gemelos",
    duracionMin: 60,
    ejerciciosIds: ["ex-squat", "ex-rdl", "ex-leg-press", "ex-hip-thrust", "ex-calf-standing"],
  },
  {
    id: "rut-pull",
    nombre: "Tracción Pesada + Brazos",
    foco: "Peso Muerto · Remo · Bíceps",
    duracionMin: 50,
    ejerciciosIds: ["ex-deadlift", "ex-bb-row", "ex-lat-pulldown", "ex-bb-curl", "ex-face-pull"],
  },
];

const MUSCLE_GROUPS = [
  "Todos",
  "Pecho",
  "Espalda",
  "Piernas",
  "Glúteos",
  "Hombros",
  "Brazos",
  "Core",
] as const;

export function EntrenarTab() {
  const { currentUser, completeWorkoutSession } = useTreno();

  // Vistas del tab: "home" | "active_workout" | "workout_summary" | "library"
  const [view, setView] = useState<"home" | "active_workout" | "workout_summary" | "library">("home");
  const [selectedRoutine, setSelectedRoutine] = useState(SAVED_ROUTINES[0]);
  const [activeBlocks, setActiveBlocks] = useState<ActiveExerciseBlock[]>([]);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Temporizador de descanso en anillo discreto
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [restTotalSeconds, setRestTotalSeconds] = useState(90);

  // Biblioteca de 64 ejercicios y modal de detalle de ejercicio
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("Todos");
  const [detailExercise, setDetailExercise] = useState<ExerciseItem | null>(null);

  // Resumen al terminar entrenamiento
  const [summaryData, setSummaryData] = useState<{
    nombreRutina: string;
    duracionMin: number;
    tonelajeKg: number;
    prsCount: number;
    mejorPrNombre?: string;
    mejorPr1Rm?: number;
  } | null>(null);

  // Iniciar una rutina en modo entrenamiento activo
  const startRoutine = (routine = SAVED_ROUTINES[0]) => {
    setSelectedRoutine(routine);
    const scaleFactor = 1.0;

    const blocks: ActiveExerciseBlock[] = routine.ejerciciosIds.map((id) => {
      const ex =
        EXERCISES_LIBRARY.find((e) => e.id === id) || EXERCISES_LIBRARY[0];
      const baseWeight = Math.round(((ex.ultimoPesoKg || 60) * scaleFactor) / 2.5) * 2.5;
      const baseReps = ex.ultimasReps || 8;

      return {
        exercise: ex,
        sets: [1, 2, 3].map((orden) => ({
          orden,
          // Autocompletado del último peso usado (+2.5 kg en la serie 3 para provocar PR realista)
          pesoKg: orden === 3 ? baseWeight + 2.5 : baseWeight,
          reps: baseReps,
          rpe: orden === 3 ? 9.0 : 8.0,
          prevPesoKg: baseWeight,
          prevReps: baseReps,
          completed: false,
          esPr: false,
          outlierWarning: null,
        })),
      };
    });

    setActiveBlocks(blocks);
    setCurrentExIndex(0);
    setElapsedSeconds(0);
    setRestSecondsLeft(0);
    setView("active_workout");
  };

  // Cronómetro de la sesión activa y del anillo de descanso
  useEffect(() => {
    if (view !== "active_workout") return;
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
      setRestSecondsLeft((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [view]);

  const toggleSetCompleted = (exIdx: number, setIdx: number) => {
    setActiveBlocks((prev) =>
      prev.map((block, bIdx) => {
        if (bIdx !== exIdx) return block;
        const prevBest1RM =
          block.exercise.mejor1RmKg ||
          calculate1RM(block.sets[0].prevPesoKg, block.sets[0].prevReps)
            .principal1RM;

        const newSets = block.sets.map((s, sIdx) => {
          if (sIdx !== setIdx) return s;
          const nextCompleted = !s.completed;
          const est1RM = calculate1RM(s.pesoKg, s.reps).principal1RM;
          const isNewPr = nextCompleted && est1RM > prevBest1RM;
          const outlier = detectOutlierJump({
            tipo: "carga_1rm",
            valorAnterior: prevBest1RM,
            valorNuevo: est1RM,
          });

          if (nextCompleted) {
            setRestTotalSeconds(90);
            setRestSecondsLeft(90);
          }

          return {
            ...s,
            completed: nextCompleted,
            esPr: isNewPr,
            outlierWarning: outlier.esOutlier ? outlier.motivo : null,
          };
        });

        return { ...block, sets: newSets };
      })
    );
  };

  const updateSetField = (
    exIdx: number,
    setIdx: number,
    field: "pesoKg" | "reps" | "rpe",
    value: number
  ) => {
    setActiveBlocks((prev) =>
      prev.map((block, bIdx) => {
        if (bIdx !== exIdx) return block;
        return {
          ...block,
          sets: block.sets.map((s, sIdx) =>
            sIdx === setIdx ? { ...s, [field]: value } : s
          ),
        };
      })
    );
  };

  const addSetToCurrentExercise = () => {
    setActiveBlocks((prev) =>
      prev.map((block, bIdx) => {
        if (bIdx !== currentExIndex) return block;
        const last = block.sets[block.sets.length - 1];
        return {
          ...block,
          sets: [
            ...block.sets,
            {
              orden: block.sets.length + 1,
              pesoKg: last.pesoKg,
              reps: last.reps,
              rpe: last.rpe,
              prevPesoKg: last.prevPesoKg,
              prevReps: last.prevReps,
              completed: false,
              esPr: false,
            },
          ],
        };
      })
    );
  };

  const finishWorkout = () => {
    let tonelajeTotal = 0;
    let prsCount = 0;
    let mejorPrNombre: string | undefined;
    let mejorPr1Rm: number | undefined;

    for (const block of activeBlocks) {
      for (const s of block.sets) {
        if (s.completed) {
          tonelajeTotal += s.pesoKg * s.reps;
          if (s.esPr) {
            prsCount += 1;
            mejorPrNombre = block.exercise.nombre;
            mejorPr1Rm = calculate1RM(s.pesoKg, s.reps).principal1RM;
          }
        }
      }
    }

    if (tonelajeTotal === 0) {
      // Si el usuario pulsa terminar rápido en la demo, contabiliza las series por defecto
      for (const block of activeBlocks) {
        for (const s of block.sets) {
          tonelajeTotal += s.pesoKg * s.reps;
        }
      }
      prsCount = 1;
      mejorPrNombre = activeBlocks[0]?.exercise.nombre;
      mejorPr1Rm = calculate1RM(
        activeBlocks[0]?.sets[2]?.pesoKg || 85,
        activeBlocks[0]?.sets[2]?.reps || 6
      ).principal1RM;
    }

    const duracionMin = Math.max(48, Math.round(elapsedSeconds / 60));

    completeWorkoutSession({
      nombreRutina: selectedRoutine.nombre,
      duracionMin,
      tonelajeKg: Math.round(tonelajeTotal),
      nuevosPrs: prsCount,
      ejercicioDestacado: mejorPrNombre,
      nuevo1RmKg: mejorPr1Rm,
    });

    setSummaryData({
      nombreRutina: selectedRoutine.nombre,
      duracionMin,
      tonelajeKg: Math.round(tonelajeTotal),
      prsCount,
      mejorPrNombre,
      mejorPr1Rm,
    });

    setView("workout_summary");
  };

  const filteredExercises = useMemo(() => {
    return EXERCISES_LIBRARY.filter((ex) => {
      const matchesMuscle =
        selectedMuscle === "Todos" || ex.grupoMuscular === selectedMuscle;
      const matchesQuery = ex.nombre
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());
      return matchesMuscle && matchesQuery;
    });
  }, [searchQuery, selectedMuscle]);

  // Historial simulado de 8 semanas para el modal de Detalle de Ejercicio
  const exerciseHistoryChart = useMemo(() => {
    if (!detailExercise) return [];
    const base1RM = detailExercise.mejor1RmKg || 80;
    return [1, 2, 3, 4, 5, 6, 7, 8].map((sem) => ({
      semana: `S${sem}`,
      oneRmKg: Math.round((base1RM * (0.88 + sem * 0.015)) * 10) / 10,
    }));
  }, [detailExercise]);

  // VISTA 1: MODO ENTRENAMIENTO ACTIVO (PANTALLA DE ENFOQUE, CASI SIN ELEMENTOS)
  if (view === "active_workout" && activeBlocks.length > 0) {
    const currentBlock = activeBlocks[currentExIndex];
    const restProgress =
      restTotalSeconds > 0 ? restSecondsLeft / restTotalSeconds : 0;

    return (
      <div className="space-y-4">
        {/* Barra superior de enfoque: cronómetro + anillo discreto de descanso + botón Terminar */}
        <div className="flex items-center justify-between rounded-full bg-black/35 border border-white/20 px-4 py-2.5 backdrop-blur-xl gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-4 w-4 text-accent" />
            <span className="font-mono font-bold text-white">
              {String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:
              {String(elapsedSeconds % 60).padStart(2, "0")}
            </span>
          </div>

          {/* Temporizador de descanso como anillo discreto */}
          <button
            type="button"
            onClick={() =>
              setRestSecondsLeft((r) => (r > 0 ? 0 : 90))
            }
            className="flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs"
          >
            <div className="relative h-5 w-5">
              <svg className="h-5 w-5 -rotate-90" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="3"
                  fill="none"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="rgb(var(--c-accent))"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 9}
                  strokeDashoffset={2 * Math.PI * 9 * (1 - restProgress)}
                />
              </svg>
            </div>
            <span className="font-mono font-semibold text-accent">
              {restSecondsLeft > 0 ? `Descanso ${restSecondsLeft}s` : "Descanso 90s"}
            </span>
          </button>

          <button
            type="button"
            onClick={finishWorkout}
            className="rounded-full bg-accent px-3.5 py-1 text-xs font-semibold text-canvas hover:bg-accent transition"
          >
            Terminar
          </button>
        </div>

        {/* Selector rápido de ejercicio de la sesión */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {activeBlocks.map((b, idx) => {
            const allDone = b.sets.every((s) => s.completed);
            return (
              <button
                key={b.exercise.id}
                type="button"
                onClick={() => setCurrentExIndex(idx)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  idx === currentExIndex
                    ? "bg-white text-canvas shadow"
                    : allDone
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-white/10 text-white/75"
                }`}
              >
                {idx + 1}. {b.exercise.nombre.split(" ")[0]}{" "}
                {allDone ? "✓" : ""}
              </button>
            );
          })}
        </div>

        {/* Protagonista: El ejercicio actual en grande y sus series en filas limpias */}
        <div className="rounded-card glass-card p-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-block rounded-full bg-accent/20 border border-accent/30 px-2.5 py-0.5 text-[10px] font-bold uppercase text-accent">
                {currentBlock.exercise.grupoMuscular} · {currentBlock.exercise.equipo}
              </span>
              <h2 className="mt-1.5 font-display text-2xl font-semibold text-white">
                {currentBlock.exercise.nombre}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setDetailExercise(currentBlock.exercise)}
              className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-accent hover:bg-white/20"
            >
              1RM & Historial
            </button>
          </div>

          {/* Cabecera de la tabla de series */}
          <div className="mt-5 grid grid-cols-12 gap-2 text-[11px] font-bold tracking-wide text-white/55 px-2">
            <span className="col-span-1">Set</span>
            <span className="col-span-3">Anterior</span>
            <span className="col-span-3">Peso (kg)</span>
            <span className="col-span-2">Reps</span>
            <span className="col-span-1">RPE</span>
            <span className="col-span-2 text-right">Listo</span>
          </div>

          <div className="mt-2 space-y-2.5">
            {currentBlock.sets.map((s, sIdx) => {
              const est1RM = calculate1RM(s.pesoKg, s.reps).principal1RM;
              return (
                <div key={s.orden} className="space-y-1">
                  <div
                    className={`grid grid-cols-12 items-center gap-2 rounded-2xl border p-2.5 transition ${
                      s.completed
                        ? "bg-accent/20 border-accent/50"
                        : "bg-black/30 border-white/15"
                    }`}
                  >
                    <span className="col-span-1 font-display text-sm font-bold text-white/80 pl-1">
                      #{s.orden}
                    </span>

                    {/* Último peso usado como referencia en gris */}
                    <span className="col-span-3 text-xs text-white/45 font-medium">
                      {s.prevPesoKg}kg × {s.prevReps}
                    </span>

                    <div className="col-span-3">
                      <input
                        type="number"
                        step={0.5}
                        value={s.pesoKg}
                        onChange={(e) =>
                          updateSetField(
                            currentExIndex,
                            sIdx,
                            "pesoKg",
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-full rounded-xl bg-white/10 border border-white/15 px-2 py-1.5 text-center font-display text-base font-semibold text-white focus:border-accent focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        value={s.reps}
                        onChange={(e) =>
                          updateSetField(
                            currentExIndex,
                            sIdx,
                            "reps",
                            Number(e.target.value) || 0
                          )
                        }
                        className="w-full rounded-xl bg-white/10 border border-white/15 px-2 py-1.5 text-center font-display text-base font-semibold text-white focus:border-accent focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1">
                      <input
                        type="number"
                        step={0.5}
                        min={5}
                        max={10}
                        value={s.rpe}
                        onChange={(e) =>
                          updateSetField(
                            currentExIndex,
                            sIdx,
                            "rpe",
                            Number(e.target.value) || 8
                          )
                        }
                        className="w-full rounded-lg bg-transparent text-center text-xs font-bold text-accent focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => toggleSetCompleted(currentExIndex, sIdx)}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold transition ${
                          s.completed
                            ? "bg-accent text-canvas shadow-md scale-105"
                            : "bg-white/15 text-white/70 hover:bg-white/25"
                        }`}
                      >
                        <Check className="h-4 w-4 stroke-[2.8]" />
                      </button>
                    </div>
                  </div>

                  {/* Celebración discreta inmediata si la serie fue PR */}
                  {s.esPr && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between rounded-xl bg-accent/20 border border-accent/40 px-3 py-1.5 text-[11px] text-accent gap-3"
                    >
                      <span className="font-bold flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-accent" />
                        ¡Nuevo Récord Personal (PR)! 1RM estimado: {est1RM} kg
                      </span>
                      <span className="font-semibold text-white/80">
                        {
                          calculateDOTS(
                            currentUser.perfilActual.pesoKg,
                            est1RM,
                            currentUser.perfilActual.sexo
                          ).puntosDots
                        }{" "}
                        DOTS
                      </span>
                    </motion.div>
                  )}

                  {s.outlierWarning && (
                    <div className="rounded-xl bg-danger/20 border border-danger/40 px-3 py-1.5 text-[11px] text-danger">
                      ⚠️ Antitrampas: {s.outlierWarning}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={addSetToCurrentExercise}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Añadir serie</span>
            </button>

            {currentExIndex < activeBlocks.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentExIndex((i) => i + 1)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-xs font-semibold text-canvas"
              >
                <span>Siguiente ejercicio</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={finishWorkout}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-canvas"
              >
                <Trophy className="h-4 w-4" />
                <span>Finalizar y Guardar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2: RESUMEN DE UNA PANTALLA AL TERMINAR CON CELEBRACIÓN DE PR
  if (view === "workout_summary" && summaryData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-card glass-card-cobalt p-7 text-center text-white space-y-5"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 border border-accent/40 text-accent shadow-lg">
          <Trophy className="h-8 w-8" />
        </div>

        <div>
          <span className="rounded-full bg-accent/20 border border-accent/30 px-3 py-1 text-xs font-bold text-accent">
            ENTRENAMIENTO REGISTRADO · +PUNTOS EN TU CREW
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold ">
            ¡Sesión Brutal, {currentUser.nombre.split(" ")[0]}!
          </h2>
          <p className="text-xs text-white/75 mt-1">{summaryData.nombreRutina}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white/10 border border-white/20 p-3.5">
            <p className="text-[11px] text-white/60">Duración</p>
            <p className="font-display text-2xl font-semibold ">
              {summaryData.duracionMin}m
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/20 p-3.5">
            <p className="text-[11px] text-white/60">Tonelaje</p>
            <p className="font-display text-2xl font-semibold  text-accent">
              {summaryData.tonelajeKg.toLocaleString("es-PE")} kg
            </p>
          </div>
          <div className="rounded-2xl bg-accent/20 border border-accent/40 p-3.5">
            <p className="text-[11px] text-accent">Récords (PR)</p>
            <p className="font-display text-2xl font-semibold  text-accent">
              {summaryData.prsCount} 🏆
            </p>
          </div>
        </div>

        {summaryData.mejorPrNombre && (
          <div className="rounded-2xl bg-black/30 border border-accent/30 p-4 text-left text-xs">
            <p className="font-bold text-accent flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>Hito destacado compartido en el Feed del Crew:</span>
            </p>
            <p className="mt-1 text-white/90">
              Nuevo récord en <strong>{summaryData.mejorPrNombre}</strong> con 1RM estimado de{" "}
              <strong>{summaryData.mejorPr1Rm} kg</strong>.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setView("home")}
          className="w-full rounded-full bg-white py-3.5 text-sm font-semibold tracking-wide text-canvas shadow-xl hover:bg-accent transition"
        >
          Volver a Entrenar
        </button>
      </motion.div>
    );
  }

  // VISTA 3: BIBLIOTECA DE 64 EJERCICIOS AGRUPADOS POR MÚSCULO
  if (view === "library") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold">
              Biblioteca de Ejercicios ({EXERCISES_LIBRARY.length})
            </h2>
            <p className="text-xs text-white/70">
              Toca cualquier ejercicio para ver su historial, 1RM Epley/Brzycki y puntos DOTS.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView("home")}
            className="rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold text-white"
          >
            Cerrar
          </button>
        </div>

        <div className="relative">
          <Search className="h-4 w-4 text-white/50 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar entre 64 ejercicios (ej. Banca, Sentadilla, Hip Thrust)..."
            className="w-full rounded-2xl bg-black/30 border border-white/20 pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/45 focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {MUSCLE_GROUPS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMuscle(m)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedMuscle === m
                  ? "bg-white text-canvas"
                  : "bg-white/10 text-white/75 hover:bg-white/20"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
          {filteredExercises.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setDetailExercise(ex)}
              className="w-full rounded-2xl glass-card p-3.5 text-left flex items-center justify-between hover:bg-white/15 transition gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{ex.nombre}</span>
                  {ex.esPrincipal && (
                    <span className="rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[10px] font-bold text-accent">
                      Básico DOTS
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/65 mt-0.5">
                  {ex.grupoMuscular} · {ex.equipo} · Último: {ex.ultimoPesoKg} kg ×{" "}
                  {ex.ultimasReps}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-base font-semibold text-accent">
                  {ex.mejor1RmKg} kg
                </p>
                <p className="text-[10px] text-white/50">1RM est.</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // VISTA PRINCIPAL DEL TAB ENTRENAR (7.2: 1 tarjeta protagonista + lista de rutinas + biblioteca)
  return (
    <div className="space-y-5">
      {/* 1. Protagonista: La rutina sugerida de hoy en una tarjeta (estilo Today's workout Ref 2) */}
      <div className="rounded-card glass-card-frosted p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1 text-[11px] font-bold text-accent">
            <Flame className="h-3.5 w-3.5" />
            RUTINA SUGERIDA DE HOY
          </span>
          <span className="text-xs font-bold text-canvas/70">
            ~{SAVED_ROUTINES[0].duracionMin} min
          </span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-semibold text-canvas leading-tight">
          {SAVED_ROUTINES[0].nombre}
        </h1>
        <p className="mt-1 text-xs font-medium text-canvas/75">
          {SAVED_ROUTINES[0].foco} · 5 ejercicios con autocompletado de tu última carga
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-canvas shadow-sm">
            🏋️ ~16,400 kg tonelaje
          </span>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-canvas shadow-sm">
            ⚡ 2 básicos para tu DOTS Score
          </span>
        </div>

        <button
          type="button"
          onClick={() => startRoutine(SAVED_ROUTINES[0])}
          className="mt-5 w-full rounded-full bg-canvas hover:bg-raised py-3.5 px-6 text-sm font-semibold tracking-wide text-white shadow-lg transition flex items-center justify-center gap-2"
        >
          <Play className="h-4 w-4 fill-accent text-accent" />
          <span>Empezar Entrenamiento Activo</span>
        </button>
      </div>

      {/* 2. Mis rutinas guardadas en una lista simple */}
      <div className="rounded-card glass-card p-5">
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="font-display text-lg font-bold">Mis rutinas guardadas</h2>
          <span className="text-xs text-white/60">3 bloques activos</span>
        </div>

        <div className="space-y-2.5">
          {SAVED_ROUTINES.map((rut) => (
            <div
              key={rut.id}
              className="flex items-center justify-between rounded-2xl bg-black/25 border border-white/15 p-3.5 gap-3"
            >
              <div className="min-w-0 pr-2">
                <p className="font-bold text-sm text-white truncate">{rut.nombre}</p>
                <p className="text-xs text-white/65">
                  {rut.foco} · {rut.duracionMin} min
                </p>
              </div>
              <button
                type="button"
                onClick={() => startRoutine(rut)}
                className="shrink-0 rounded-full bg-white/15 hover:bg-accent hover:text-canvas px-3.5 py-1.5 text-xs font-bold text-white transition"
              >
                Iniciar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Acceso a la Biblioteca de 64 Ejercicios + Básicos DOTS */}
      <div className="rounded-card glass-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold">
              Biblioteca de Ejercicios (64 precargados)
            </h3>
            <p className="text-xs text-white/65">
              Consulta tu 1RM estimado (Epley / Brzycki) y evolución por músculo
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView("library")}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-canvas hover:bg-accent transition"
          >
            Explorar 64 →
          </button>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2">
          {currentUser.levantamientosClave.slice(0, 3).map((lift) => {
            const exObj =
              EXERCISES_LIBRARY.find((e) => e.id === lift.ejercicioId) ||
              EXERCISES_LIBRARY[0];
            return (
              <button
                key={lift.ejercicioId}
                type="button"
                onClick={() => setDetailExercise(exObj)}
                className="rounded-2xl bg-black/25 border border-white/10 p-3 text-left hover:bg-white/10 transition"
              >
                <p className="text-[11px] text-white/60 truncate">
                  {lift.ejercicio.replace(" con Barra", "")}
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-accent">
                  {lift.oneRmActualKg} kg
                </p>
                <p className="text-[10px] text-accent">
                  +{(lift.oneRmActualKg - lift.oneRmInicialKg).toFixed(1)} kg en 8 sem
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal de Detalle de Ejercicio (Historial, 1RM Epley/Brzycki y Gráfica) */}
      <AnimatePresence>
        {detailExercise && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailExercise(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 70, opacity: 0 }}
              className="relative z-10 w-full max-w-md rounded-t-[32px] sm:rounded-card bg-raised border border-white/25 p-6 text-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-accent">
                    {detailExercise.grupoMuscular} · {detailExercise.equipo}
                  </span>
                  <h3 className="mt-1.5 font-display text-xl font-bold">
                    {detailExercise.nombre}
                  </h3>
                </div>
                <button
                  onClick={() => setDetailExercise(null)}
                  className="rounded-full bg-white/10 p-2 text-white/75 hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {(() => {
                const calc = calculate1RM(
                  detailExercise.ultimoPesoKg || 80,
                  detailExercise.ultimasReps || 6
                );
                const dots = calculateDOTS(
                  currentUser.perfilActual.pesoKg,
                  calc.principal1RM,
                  currentUser.perfilActual.sexo
                );
                return (
                  <>
                    <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
                      <div className="rounded-2xl bg-black/30 border border-white/15 p-3">
                        <p className="text-[10px] text-white/60">
                          1RM ({calc.metodoUsado})
                        </p>
                        <p className="font-display text-xl font-semibold text-accent">
                          {calc.principal1RM} kg
                        </p>
                      </div>
                      <div className="rounded-2xl bg-black/30 border border-white/15 p-3">
                        <p className="text-[10px] text-white/60">1RM Epley / Brzycki</p>
                        <p className="font-display text-sm font-bold text-white mt-1">
                          {calc.epley1RM} / {calc.brzycki1RM} kg
                        </p>
                      </div>
                      <div className="rounded-2xl bg-black/30 border border-white/15 p-3">
                        <p className="text-[10px] text-white/60">Fuerza DOTS</p>
                        <p className="font-display text-xl font-semibold text-accent">
                          {dots.puntosDots}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-black/30 border border-white/15 p-3.5">
                      <p className="text-xs font-bold text-white/80 mb-2">
                        Evolución de 1RM Estimado (Últimas 8 semanas)
                      </p>
                      <div className="h-36 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={exerciseHistoryChart}>
                            <XAxis
                              dataKey="semana"
                              stroke="rgba(255,255,255,0.45)"
                              fontSize={10}
                            />
                            <YAxis
                              domain={["dataMin - 2", "dataMax + 2"]}
                              stroke="rgba(255,255,255,0.45)"
                              fontSize={10}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgb(var(--c-raised))",
                                borderRadius: "12px",
                                border: "1px solid rgba(255,255,255,0.2)",
                                fontSize: "11px",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="oneRmKg"
                              stroke="rgb(var(--c-accent))"
                              strokeWidth={3}
                              dot={{ r: 3, fill: "rgb(var(--c-accent))" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="mt-2 text-[11px] text-white/60">
                        {calc.formulaExpresion}
                      </p>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
