"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BodyProfileInput,
  calculateFullBodyReport,
  FullBodyReport,
} from "./bodyMetrics";
import { CREW_MEMBERS_SEED, CrewMemberRankingRow, DemoUser } from "./demoData";
import {
  buildFreshUser,
  DEFAULT_PROFILE,
  GYMS_LIST,
  isoWeekday,
  recomputeScore,
  todayIso,
} from "./freshUser";

export type ThemeMode = "dark" | "light";

export interface ComentarioFeed {
  id: string;
  autor: string;
  avatar?: string;
  texto: string;
  esMio?: boolean;
  /** true cuando lo escribe un amigo de ejemplo (el Crew real llega con el backend). */
  simulado?: boolean;
}

export interface FeedItem {
  id: string;
  userId: string;
  autor: string;
  avatar: string;
  tipo: "checkin" | "pr" | "racha" | "logro" | "reto";
  titulo: string;
  subtitulo: string;
  haceTiempo: string;
  validadoPor?: string;
  sospechaOutlier?: boolean;
  /** Foto del check-in (JPEG reducido) y gesto del día mostrado. */
  foto?: string;
  gesto?: string;
  /** Validaciones del Crew sobre el gesto de la foto. */
  validaciones?: number;
  validoPorMi?: boolean;
  reacciones: { emoji: string; count: number; reactedByMe: boolean }[];
  comentarios?: ComentarioFeed[];
}

/** Reacciones disponibles en el selector del Crew. */
export const EMOJIS_CREW = ["🔥", "💪", "👏", "🦍", "⚡", "👑"];

const RESPUESTAS_AMIGOS: Record<"checkin" | "pr", string[]> = {
  checkin: ["¡Esa es la actitud! 💪", "Gesto validado, a darle 🔥", "Presente como siempre 👏", "Así se hace, máquina"],
  pr: ["¡BESTIAL! 🦍", "Eso es un PR de verdad 🏆", "Qué máquina 🔥", "¡A romperla! ⚡", "Se viene el club de los 100 👀"],
};

const hashTexto = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

interface TrenoContextValue {
  /** true cuando ya se leyó el almacenamiento local (evita parpadeos). */
  hydrated: boolean;
  /** true cuando el usuario terminó el onboarding. */
  onboarded: boolean;
  currentUser: DemoUser;
  customProfile: BodyProfileInput;
  customReport: FullBodyReport;
  updateCustomProfile: (partial: Partial<BodyProfileInput>) => void;
  completeOnboarding: (params: {
    nombre: string;
    diasPactados: number[];
    sedeGym: string;
  }) => void;
  resetApp: () => void;
  doCheckInToday: (foto: string, gesto: { id: string; nombre: string }) => void;
  validateCheckIn: (eventId: string) => void;
  registerNewWeight: (pesoKg: number, cinturaCm?: number) => void;
  completeWorkoutSession: (params: {
    nombreRutina: string;
    duracionMin: number;
    tonelajeKg: number;
    nuevosPrs: number;
    ejercicioDestacado?: string;
    nuevo1RmKg?: number;
  }) => void;
  crewMembers: CrewMemberRankingRow[];
  feed: FeedItem[];
  toggleReaction: (eventId: string, emoji: string) => void;
  addComment: (eventId: string, texto: string) => void;
  validateMatePr: (eventId: string) => void;
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  toggleShareWeightPrivacy: () => void;
}

const INITIAL_FEED: FeedItem[] = [
  {
    id: "ev-1",
    userId: "usr-mateo-b",
    autor: "Mateo Vargas",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80",
    tipo: "pr",
    titulo: "Nuevo PR en Peso Muerto Convencional",
    subtitulo: "150 kg × 5 reps (1RM est. 170.0 kg · +12.5 DOTS en definición)",
    haceTiempo: "Hace 28 min",
    validadoPor: "Valentina Ríos",
    reacciones: [
      { emoji: "🔥", count: 5, reactedByMe: false },
      { emoji: "🦍", count: 4, reactedByMe: false },
      { emoji: "⚡", count: 3, reactedByMe: false },
    ],
  },
  {
    id: "ev-2",
    userId: "usr-valentina",
    autor: "Valentina Ríos",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80",
    tipo: "racha",
    titulo: "5 semanas perfectas seguidas (Multiplicador ×1.2)",
    subtitulo: "Cumplió 4/4 días pactados en Gold's Sede Miraflores",
    haceTiempo: "Hace 2 h",
    reacciones: [
      { emoji: "🔥", count: 6, reactedByMe: false },
      { emoji: "👑", count: 4, reactedByMe: false },
    ],
  },
  {
    id: "ev-4",
    userId: "usr-lucas",
    autor: "Lucas Salazar",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80",
    tipo: "pr",
    titulo: "Récord en Sentadilla Trasera: 165 kg × 3 reps",
    subtitulo:
      "Salto de +19% respecto al mes anterior — Pendiente validación de compañero",
    haceTiempo: "Ayer",
    sospechaOutlier: true,
    reacciones: [
      { emoji: "👀", count: 3, reactedByMe: false },
      { emoji: "🔥", count: 2, reactedByMe: false },
    ],
  },
];

const STORAGE_KEY = "treno:v2";

const TrenoContext = createContext<TrenoContextValue | null>(null);

function placeholderUser(): DemoUser {
  return buildFreshUser(DEFAULT_PROFILE, {
    nombre: "Atleta",
    diasPactados: [1, 3, 5],
    sedeGym: GYMS_LIST[0],
  });
}

/** Fila del usuario dentro del ranking del Crew, a partir de su estado real. */
function myRow(u: DemoUser, base: CrewMemberRankingRow): CrewMemberRankingRow {
  const s = u.scoreSemanaActual;
  return {
    ...base,
    userId: u.id,
    nombre: u.nombre,
    handle: u.handle,
    avatar: "",
    objetivo: u.perfilActual.objetivo,
    etiquetaObjetivo: u.reporteActual.meta.etiquetaObjetivo,
    estaturaCm: u.perfilActual.estaturaCm,
    pesoKg: u.perfilActual.pesoKg,
    comparteKilos: u.comparteKilos,
    trenoScore: s.total,
    asistenciaPts: s.pilares.asistencia.puntos,
    asistenciaPct: s.pilares.asistencia.porcentajeCumplido,
    fuerzaPts: s.pilares.fuerza.puntos,
    dotsTotalTresBasicos: 0,
    subidaCargaSemanalPct: 0,
    metaPts: s.pilares.meta.puntos,
    progresoMetaTemporadaPct: 0,
    volumenPts: s.pilares.volumen.puntos,
    registroPts: s.pilares.registro.puntos,
    rachaDias: u.rachaDias,
    rachaSemanas: u.rachaSemanasPerfectas,
    historialSemanalScores: [s.total],
  };
}

function crewSeedFor(u: DemoUser): CrewMemberRankingRow[] {
  return CREW_MEMBERS_SEED.map((m) =>
    m.codigoDemo === "usuario_a" ? myRow(u, m) : m
  );
}

interface Persisted {
  onboarded: boolean;
  user: DemoUser;
  customProfile: BodyProfileInput;
  crewMembers: CrewMemberRankingRow[];
  feed: FeedItem[];
  themeMode: ThemeMode;
  fechaCheckIn?: string;
}

export function TrenoProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [user, setUser] = useState<DemoUser>(placeholderUser);
  const [customProfile, setCustomProfile] =
    useState<BodyProfileInput>(DEFAULT_PROFILE);
  const [crewMembers, setCrewMembers] = useState<CrewMemberRankingRow[]>(() =>
    crewSeedFor(placeholderUser())
  );
  const [feed, setFeed] = useState<FeedItem[]>(INITIAL_FEED);
  const [themeMode, setThemeModeState] = useState<ThemeMode>("dark");

  // Hidratación desde localStorage (una sola vez, en el cliente)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Persisted;
        if (p.user) {
          const hoy = todayIso();
          // Si cambió el día, el check-in de hoy vuelve a estar disponible
          const u =
            p.fechaCheckIn === hoy ? p.user : { ...p.user, checkedInHoy: false };
          setUser(u);
          setOnboarded(!!p.onboarded);
          if (p.customProfile) setCustomProfile(p.customProfile);
          if (p.crewMembers) setCrewMembers(p.crewMembers);
          if (p.feed) setFeed(p.feed);
          if (p.themeMode) setThemeModeState(p.themeMode);
        }
      } else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
        setThemeModeState("light");
      }
    } catch {
      /* almacenamiento no disponible: se trabaja en memoria */
    }
    setHydrated(true);
  }, []);

  // Tema aplicado al documento
  useEffect(() => {
    if (!hydrated) return; // el script de arranque ya puso el tema correcto
    document.documentElement.setAttribute("data-theme", themeMode);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta)
      meta.setAttribute("content", themeMode === "light" ? "#f4f5f0" : "#0a0c0b");
  }, [themeMode, hydrated]);

  // Persistencia
  useEffect(() => {
    if (!hydrated) return;
    try {
      const data: Persisted = {
        onboarded,
        user,
        customProfile,
        crewMembers,
        feed,
        themeMode,
        fechaCheckIn: user.checkedInHoy ? todayIso() : undefined,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* sin espacio o bloqueado */
    }
  }, [hydrated, onboarded, user, customProfile, crewMembers, feed, themeMode]);

  const customReport = useMemo(
    () => calculateFullBodyReport(customProfile, todayIso()),
    [customProfile]
  );

  const setThemeMode = useCallback((m: ThemeMode) => setThemeModeState(m), []);

  const updateCustomProfile = (partial: Partial<BodyProfileInput>) => {
    setCustomProfile((prev) => ({ ...prev, ...partial }));
  };

  const completeOnboarding = (params: {
    nombre: string;
    diasPactados: number[];
    sedeGym: string;
  }) => {
    const fresh = buildFreshUser(customProfile, params);
    setUser(fresh);
    setCrewMembers(crewSeedFor(fresh));
    setFeed(INITIAL_FEED);
    setOnboarded(true);
  };

  const resetApp = () => {
    // Borra TODO lo que guarda la app (perfil, entrenamientos, fotos, Crews e insignias)
    try {
      [STORAGE_KEY, "treno:training:v1", "treno:photos", "treno:crews", "treno:badges:v1", "treno:notif"].forEach((k) =>
        window.localStorage.removeItem(k)
      );
    } catch {
      /* noop */
    }
    const p = placeholderUser();
    setUser(p);
    setCustomProfile(DEFAULT_PROFILE);
    setCrewMembers(crewSeedFor(p));
    setFeed(INITIAL_FEED);
    setOnboarded(false);
    // Recarga para que el entrenamiento y las insignias en memoria también arranquen de cero
    setTimeout(() => window.location.reload(), 50);
  };

  const doCheckInToday = (foto: string, gesto: { id: string; nombre: string }) => {
    if (user.checkedInHoy) return;
    const hoy = isoWeekday();
    const cumplidos = user.diasCumplidosEstaSemana.includes(hoy)
      ? user.diasCumplidosEstaSemana
      : [...user.diasCumplidosEstaSemana, hoy];
    const next: DemoUser = {
      ...user,
      checkedInHoy: true,
      rachaDias: user.rachaDias + 1,
      diasCumplidosEstaSemana: cumplidos,
      estadisticasVitalicias: {
        ...user.estadisticasVitalicias,
        diasGym: user.estadisticasVitalicias.diasGym + 1,
      },
    };
    next.scoreSemanaActual = recomputeScore(next);
    setUser(next);

    const dias = next.rachaDias === 1 ? "día" : "días";
    const eventId = `ev-checkin-${Date.now()}`;
    simulateCrew(eventId, "checkin");
    setFeed((prev) => [
      {
        id: eventId,
        userId: user.id,
        autor: user.nombre,
        avatar: user.avatar,
        tipo: "checkin",
        titulo: `Check-in en ${user.sedeGym}`,
        subtitulo: `Racha de ${next.rachaDias} ${dias} · Gesto del día: ${gesto.nombre}`,
        haceTiempo: "Ahora mismo",
        foto,
        gesto: gesto.nombre,
        validaciones: 0,
        reacciones: [{ emoji: "🔥", count: 1, reactedByMe: true }],
      },
      // Para no llenar el almacenamiento, solo las 3 fotos más recientes se conservan
      ...prev.map((ev, i) => (ev.foto && i >= 2 ? { ...ev, foto: undefined } : ev)),
    ]);
  };

  const registerNewWeight = (pesoKg: number, cinturaCm?: number) => {
    const perfil: BodyProfileInput = {
      ...user.perfilActual,
      pesoKg,
      cinturaCm: cinturaCm ?? user.perfilActual.cinturaCm,
    };
    const hoy = todayIso();
    const sinHoy = user.pesajesUltimos14Dias.filter((p) => p.fecha !== hoy);
    const historicoPrevio =
      user.pesajesHistoricos ?? user.pesajesUltimos14Dias.map((p) => ({ fecha: p.fecha, pesoKg: p.pesoKg }));
    const next: DemoUser = {
      ...user,
      pesajesHistoricos: [...historicoPrevio.filter((p) => p.fecha !== hoy), { fecha: hoy, pesoKg }].slice(-90),
      perfilActual: perfil,
      reporteActual: calculateFullBodyReport(
        perfil,
        user.reporteInicial.meta.fechaInicio || hoy
      ),
      pesajesUltimos14Dias: [
        ...sinHoy,
        { fecha: hoy, pesoKg, cinturaCm: perfil.cinturaCm },
      ].slice(-14),
    };
    next.scoreSemanaActual = recomputeScore(next);
    setUser(next);
  };

  const completeWorkoutSession = (params: {
    nombreRutina: string;
    duracionMin: number;
    tonelajeKg: number;
    nuevosPrs: number;
    ejercicioDestacado?: string;
    nuevo1RmKg?: number;
  }) => {
    const next: DemoUser = {
      ...user,
      tonelajeSemanaKg: (user.tonelajeSemanaKg ?? 0) + params.tonelajeKg,
      entrenamientosSemana: (user.entrenamientosSemana ?? 0) + 1,
      estadisticasVitalicias: {
        entrenamientos: user.estadisticasVitalicias.entrenamientos + 1,
        tonelajeTotalKg:
          user.estadisticasVitalicias.tonelajeTotalKg + params.tonelajeKg,
        diasGym: user.estadisticasVitalicias.diasGym,
        prsLogrados: user.estadisticasVitalicias.prsLogrados + params.nuevosPrs,
      },
    };
    next.scoreSemanaActual = recomputeScore(next);
    setUser(next);

    if (params.nuevosPrs > 0) {
      const eventId = `ev-pr-${Date.now()}`;
      simulateCrew(eventId, "pr");
      setFeed((prev) => [
        {
          id: eventId,
          userId: user.id,
          autor: user.nombre,
          avatar: user.avatar,
          tipo: "pr",
          titulo: `¡Nuevo PR en ${params.ejercicioDestacado || params.nombreRutina}!`,
          subtitulo: `${params.tonelajeKg.toLocaleString("es-PE")} kg de tonelaje en ${params.duracionMin} min`,
          haceTiempo: "Ahora mismo",
          reacciones: [{ emoji: "🏆", count: 1, reactedByMe: true }],
        },
        ...prev,
      ]);
    }
  };

  const toggleReaction = (eventId: string, emoji: string) => {
    setFeed((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const exists = ev.reacciones.find((r) => r.emoji === emoji);
        if (exists) {
          return {
            ...ev,
            reacciones: ev.reacciones.map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    count: r.reactedByMe ? Math.max(0, r.count - 1) : r.count + 1,
                    reactedByMe: !r.reactedByMe,
                  }
                : r
            ),
          };
        }
        return {
          ...ev,
          reacciones: [...ev.reacciones, { emoji, count: 1, reactedByMe: true }],
        };
      })
    );
  };

  const addComment = (eventId: string, texto: string) => {
    const limpio = texto.trim().slice(0, 140);
    if (!limpio) return;
    setFeed((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              comentarios: [
                ...(ev.comentarios ?? []),
                { id: `c-${Date.now()}`, autor: user.nombre, avatar: user.avatar, texto: limpio, esMio: true },
              ],
            }
          : ev
      )
    );
  };

  /**
   * Prototipo: los amigos de ejemplo responden a tus check-ins y récords (reacción,
   * validación del gesto y comentario) para que el feed se sienta vivo.
   * Con el backend real esto lo hacen tus amigos de verdad.
   */
  const simulateCrew = (eventId: string, tipo: "checkin" | "pr") => {
    const amigos = crewMembers.filter((m) => m.codigoDemo !== "usuario_a");
    if (!amigos.length) return;
    const h = hashTexto(eventId);
    const cuantos = Math.min(amigos.length, 2 + (h % 2));
    const elegidos = Array.from({ length: cuantos }, (_, i) => amigos[(h + i * 2) % amigos.length]).filter(
      (m, i, arr) => arr.findIndex((x) => x.userId === m.userId) === i
    );
    const frases = RESPUESTAS_AMIGOS[tipo];
    const emojis = tipo === "pr" ? ["🏆", "🦍", "🔥"] : ["🔥", "💪", "👏"];

    elegidos.forEach((amigo, i) => {
      setTimeout(() => {
        setFeed((prev) =>
          prev.map((ev) => {
            if (ev.id !== eventId) return ev;
            const emoji = emojis[(h + i) % emojis.length];
            const existe = ev.reacciones.find((r) => r.emoji === emoji);
            const reacciones = existe
              ? ev.reacciones.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r))
              : [...ev.reacciones, { emoji, count: 1, reactedByMe: false }];
            const comentarios =
              i === 0 || i === 1
                ? [
                    ...(ev.comentarios ?? []),
                    {
                      id: `c-${eventId}-${i}`,
                      autor: amigo.nombre,
                      avatar: amigo.avatar,
                      texto: frases[(h + i) % frases.length],
                      simulado: true,
                    },
                  ]
                : ev.comentarios;
            return {
              ...ev,
              reacciones,
              comentarios,
              validaciones: tipo === "checkin" ? (ev.validaciones ?? 0) + 1 : ev.validaciones,
            };
          })
        );
      }, 3500 + i * 3200);
    });
  };

  const validateCheckIn = (eventId: string) => {
    setFeed((prev) =>
      prev.map((ev) =>
        ev.id === eventId && !ev.validoPorMi
          ? { ...ev, validoPorMi: true, validaciones: (ev.validaciones ?? 0) + 1 }
          : ev
      )
    );
  };

  const validateMatePr = (eventId: string) => {
    setFeed((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              sospechaOutlier: false,
              validadoPor: user.nombre,
              subtitulo: `${ev.subtitulo.split(" — ")[0]} · Validado por ${user.nombre}`,
            }
          : ev
      )
    );
  };

  const toggleShareWeightPrivacy = () => {
    const newVal = !user.comparteKilos;
    setUser((u) => ({ ...u, comparteKilos: newVal }));
  };

  // Mantiene la fila del usuario en el ranking del Crew sincronizada con su estado real
  useEffect(() => {
    setCrewMembers((prev) =>
      prev.map((m) => (m.codigoDemo === "usuario_a" ? myRow(user, m) : m))
    );
  }, [user]);

  return (
    <TrenoContext.Provider
      value={{
        hydrated,
        onboarded,
        currentUser: user,
        customProfile,
        customReport,
        updateCustomProfile,
        completeOnboarding,
        resetApp,
        doCheckInToday,
        validateCheckIn,
        registerNewWeight,
        completeWorkoutSession,
        crewMembers,
        feed,
        toggleReaction,
        addComment,
        validateMatePr,
        themeMode,
        setThemeMode,
        toggleShareWeightPrivacy,
      }}
    >
      {children}
    </TrenoContext.Provider>
  );
}

export function useTreno() {
  const ctx = useContext(TrenoContext);
  if (!ctx) throw new Error("useTreno debe usarse dentro de TrenoProvider");
  return ctx;
}
