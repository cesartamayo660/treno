"use client";

/**
 * Entrenamiento: rutinas propias, sesión activa, descanso e historial REAL.
 * Vive por encima de las pestañas para que el entrenamiento y el temporizador
 * sigan corriendo mientras revisas Hoy, Crew o Cuerpo.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { calculate1RM } from "./bodyMetrics";
import { EXERCISES_LIBRARY, ExerciseItem } from "./exercisesData";
import { useTreno } from "./store";
import { todayIso } from "./freshUser";

export interface SetRow {
  id: string;
  pesoKg: number;
  reps: number;
  completed: boolean;
  esPr: boolean;
  /** Aviso de antitrampas en lenguaje claro. */
  aviso: string | null;
}

export interface Block {
  id: string;
  exerciseId: string;
  sets: SetRow[];
}

export interface Session {
  nombre: string;
  startedAt: number;
  blocks: Block[];
  currentBlockId: string;
}

export interface Routine {
  id: string;
  nombre: string;
  ejercicios: string[];
}

export interface HistoryEntry {
  fecha: string;
  pesoKg: number;
  reps: number;
  oneRm: number;
}

export interface SessionSummary {
  nombre: string;
  duracionMin: number;
  seriesHechas: number;
  ejercicios: number;
  prs: { ejercicio: string; oneRm: number }[];
}

interface RestState {
  endsAt: number | null;
  total: number;
  /** Momento en que terminó el último descanso (para el aviso "¡A darle!"). */
  doneAt: number | null;
}

interface TrainingContextValue {
  routines: Routine[];
  saveRoutine: (r: { id?: string; nombre: string; ejercicios: string[] }) => void;
  deleteRoutine: (id: string) => void;

  history: Record<string, HistoryEntry[]>;
  lastOf: (exerciseId: string) => HistoryEntry | undefined;
  best1RmOf: (exerciseId: string) => number;

  session: Session | null;
  startSession: (nombre: string, ejercicios: string[]) => void;
  discardSession: () => void;
  finishSession: () => SessionSummary | null;
  setBlocks: (blocks: Block[]) => void;
  setCurrentBlock: (id: string) => void;
  addExercise: (exerciseId: string) => void;
  removeBlock: (id: string) => void;
  addSet: (blockId: string) => void;
  updateSet: (blockId: string, setId: string, field: "pesoKg" | "reps", value: number) => void;
  toggleSet: (blockId: string, setId: string) => void;

  rest: RestState;
  restPref: number;
  setRestPref: (s: number) => void;
  startRest: (seconds?: number) => void;
  addRest: (seconds: number) => void;
  stopRest: () => void;
}

const KEY = "treno:training:v1";
const uid = () => Math.random().toString(36).slice(2, 9);

export const STARTER_ROUTINES: Routine[] = [
  {
    id: "tpl-upper",
    nombre: "Tren superior",
    ejercicios: ["ex-bench", "ex-pullups", "ex-ohp", "ex-incline-db", "ex-seated-row"],
  },
  {
    id: "tpl-lower",
    nombre: "Tren inferior",
    ejercicios: ["ex-squat", "ex-rdl", "ex-leg-press", "ex-hip-thrust", "ex-calf-standing"],
  },
  {
    id: "tpl-pull",
    nombre: "Tracción y brazos",
    ejercicios: ["ex-deadlift", "ex-bb-row", "ex-lat-pulldown", "ex-bb-curl", "ex-face-pull"],
  },
];

export function exerciseById(id: string): ExerciseItem | undefined {
  return EXERCISES_LIBRARY.find((e) => e.id === id);
}

const newBlock = (exerciseId: string, prev?: HistoryEntry): Block => ({
  id: uid(),
  exerciseId,
  sets: [1, 2, 3].map(() => ({
    id: uid(),
    pesoKg: prev?.pesoKg ?? 0,
    reps: prev?.reps ?? 8,
    completed: false,
    esPr: false,
    aviso: null,
  })),
});

interface Persisted {
  routines: Routine[];
  history: Record<string, HistoryEntry[]>;
  session: Session | null;
  restPref: number;
}

const TrainingContext = createContext<TrainingContextValue | null>(null);

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const { completeWorkoutSession } = useTreno();

  const [hydrated, setHydrated] = useState(false);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [session, setSession] = useState<Session | null>(null);
  const [restPref, setRestPrefState] = useState(90);
  const [rest, setRest] = useState<RestState>({ endsAt: null, total: 90, doneAt: null });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        setRoutines(p.routines ?? []);
        setHistory(p.history ?? {});
        setSession(p.session ?? null);
        setRestPrefState(p.restPref ?? 90);
      }
    } catch {
      /* sin almacenamiento */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const p: Persisted = { routines, history, session, restPref };
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      /* lleno o bloqueado */
    }
  }, [hydrated, routines, history, session, restPref]);

  // Fin del descanso: vibra (si el dispositivo lo permite) y marca "terminado"
  useEffect(() => {
    if (!rest.endsAt) return;
    const ms = rest.endsAt - Date.now();
    const t = setTimeout(() => {
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch {
        /* sin vibración */
      }
      setRest((r) => ({ ...r, endsAt: null, doneAt: Date.now() }));
    }, Math.max(0, ms));
    return () => clearTimeout(t);
  }, [rest.endsAt]);

  const lastOf = useCallback(
    (id: string) => {
      const h = history[id];
      return h && h.length ? h[h.length - 1] : undefined;
    },
    [history]
  );

  const best1RmOf = useCallback(
    (id: string) => (history[id] ?? []).reduce((m, e) => Math.max(m, e.oneRm), 0),
    [history]
  );

  const saveRoutine: TrainingContextValue["saveRoutine"] = (r) => {
    setRoutines((prev) => {
      if (r.id && prev.some((x) => x.id === r.id)) {
        return prev.map((x) => (x.id === r.id ? { ...x, nombre: r.nombre, ejercicios: r.ejercicios } : x));
      }
      return [...prev, { id: uid(), nombre: r.nombre, ejercicios: r.ejercicios }];
    });
  };

  const deleteRoutine = (id: string) => setRoutines((p) => p.filter((r) => r.id !== id));

  const startSession: TrainingContextValue["startSession"] = (nombre, ejercicios) => {
    if (!ejercicios.length) return;
    const blocks = ejercicios.map((id) => newBlock(id, lastOf(id)));
    setSession({ nombre: nombre || "Entrenamiento", startedAt: Date.now(), blocks, currentBlockId: blocks[0].id });
    setRest({ endsAt: null, total: restPref, doneAt: null });
  };

  const discardSession = () => {
    setSession(null);
    setRest({ endsAt: null, total: restPref, doneAt: null });
  };

  const setBlocks = (blocks: Block[]) => setSession((s) => (s ? { ...s, blocks } : s));
  const setCurrentBlock = (id: string) => setSession((s) => (s ? { ...s, currentBlockId: id } : s));

  const addExercise = (exerciseId: string) =>
    setSession((s) => {
      if (!s) return s;
      const b = newBlock(exerciseId, lastOf(exerciseId));
      return { ...s, blocks: [...s.blocks, b] };
    });

  const removeBlock = (id: string) =>
    setSession((s) => {
      if (!s || s.blocks.length <= 1) return s;
      const blocks = s.blocks.filter((b) => b.id !== id);
      return { ...s, blocks, currentBlockId: s.currentBlockId === id ? blocks[0].id : s.currentBlockId };
    });

  const addSet = (blockId: string) =>
    setSession((s) => {
      if (!s) return s;
      return {
        ...s,
        blocks: s.blocks.map((b) => {
          if (b.id !== blockId) return b;
          const last = b.sets[b.sets.length - 1];
          return {
            ...b,
            sets: [...b.sets, { id: uid(), pesoKg: last?.pesoKg ?? 0, reps: last?.reps ?? 8, completed: false, esPr: false, aviso: null }],
          };
        }),
      };
    });

  const updateSet: TrainingContextValue["updateSet"] = (blockId, setId, field, value) =>
    setSession((s) =>
      s
        ? {
            ...s,
            blocks: s.blocks.map((b) =>
              b.id !== blockId
                ? b
                : { ...b, sets: b.sets.map((x) => (x.id === setId ? { ...x, [field]: value, completed: false, esPr: false, aviso: null } : x)) }
            ),
          }
        : s
    );

  const toggleSet: TrainingContextValue["toggleSet"] = (blockId, setId) =>
    setSession((s) => {
      if (!s) return s;
      return {
        ...s,
        blocks: s.blocks.map((b) => {
          if (b.id !== blockId) return b;
          const prevBest = best1RmOf(b.exerciseId);
          return {
            ...b,
            sets: b.sets.map((x) => {
              if (x.id !== setId) return x;
              const done = !x.completed;
              if (!done) return { ...x, completed: false, esPr: false, aviso: null };
              const est = x.pesoKg > 0 && x.reps > 0 ? calculate1RM(x.pesoKg, x.reps).principal1RM : 0;
              // Solo hay récord si ya existe un historial contra el cual comparar
              const esPr = prevBest > 0 && est > prevBest;
              // Antitrampas: solo si SUBES de golpe más del 18 % sobre tu mejor marca
              const salto = prevBest > 0 ? (est - prevBest) / prevBest : 0;
              const aviso =
                salto > 0.18
                  ? `Subiste ${Math.round(salto * 100)} % de golpe sobre tu mejor marca. Es posible, pero tu Crew podrá validarlo.`
                  : null;
              return { ...x, completed: true, esPr, aviso };
            }),
          };
        }),
      };
    });

  const finishSession = (): SessionSummary | null => {
    if (!session) return null;
    const hoy = todayIso();
    const nuevoHist: Record<string, HistoryEntry[]> = { ...history };
    const prs: SessionSummary["prs"] = [];
    let seriesHechas = 0;
    let ejercicios = 0;

    for (const b of session.blocks) {
      const hechas = b.sets.filter((s) => s.completed && s.pesoKg > 0 && s.reps > 0);
      seriesHechas += b.sets.filter((s) => s.completed).length;
      if (!hechas.length) continue;
      ejercicios += 1;
      // La mejor serie del ejercicio (por 1RM estimado) pasa al historial
      const mejor = hechas
        .map((s) => ({ s, oneRm: calculate1RM(s.pesoKg, s.reps).principal1RM }))
        .sort((a, c) => c.oneRm - a.oneRm)[0];
      const nombre = exerciseById(b.exerciseId)?.nombre ?? "Ejercicio";
      if (hechas.some((s) => s.esPr)) prs.push({ ejercicio: nombre, oneRm: mejor.oneRm });
      nuevoHist[b.exerciseId] = [
        ...(nuevoHist[b.exerciseId] ?? []),
        { fecha: hoy, pesoKg: mejor.s.pesoKg, reps: mejor.s.reps, oneRm: mejor.oneRm },
      ].slice(-60);
    }

    const duracionMin = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000));
    const tonelaje = session.blocks.reduce(
      (t, b) => t + b.sets.filter((s) => s.completed).reduce((a, s) => a + s.pesoKg * s.reps, 0),
      0
    );

    setHistory(nuevoHist);
    completeWorkoutSession({
      nombreRutina: session.nombre,
      duracionMin,
      tonelajeKg: Math.round(tonelaje),
      nuevosPrs: prs.length,
      ejercicioDestacado: prs[0]?.ejercicio,
      nuevo1RmKg: prs[0]?.oneRm,
    });

    const summary: SessionSummary = { nombre: session.nombre, duracionMin, seriesHechas, ejercicios, prs };
    setSession(null);
    setRest({ endsAt: null, total: restPref, doneAt: null });
    return summary;
  };

  const setRestPref = (s: number) => setRestPrefState(s);
  const startRest = (seconds?: number) => {
    const total = seconds ?? restPref;
    setRest({ endsAt: Date.now() + total * 1000, total, doneAt: null });
  };
  const addRest = (seconds: number) =>
    setRest((r) => (r.endsAt ? { ...r, endsAt: r.endsAt + seconds * 1000, total: r.total + seconds } : r));
  const stopRest = () => setRest((r) => ({ ...r, endsAt: null, doneAt: null }));

  const value = useMemo(
    () => ({
      routines,
      saveRoutine,
      deleteRoutine,
      history,
      lastOf,
      best1RmOf,
      session,
      startSession,
      discardSession,
      finishSession,
      setBlocks,
      setCurrentBlock,
      addExercise,
      removeBlock,
      addSet,
      updateSet,
      toggleSet,
      rest,
      restPref,
      setRestPref,
      startRest,
      addRest,
      stopRest,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routines, history, session, rest, restPref, lastOf, best1RmOf]
  );

  return <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>;
}

export function useTraining() {
  const ctx = useContext(TrainingContext);
  if (!ctx) throw new Error("useTraining debe usarse dentro de TrainingProvider");
  return ctx;
}

/** Hora actual refrescada cada `ms` (para cronómetros). */
export function useNow(ms = 1000, active = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms, active]);
  return now;
}
