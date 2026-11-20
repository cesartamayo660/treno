/**
 * Usuario real de TRENO: se construye desde el onboarding y arranca desde cero
 * (sin historial inventado). Aquí también vive el recálculo del TRENO Score
 * a partir del estado real de la semana.
 */
import { BodyProfileInput, calculateFullBodyReport } from "./bodyMetrics";
import { calculateTrenoScore, TrenoScoreBreakdown } from "./trenoScore";
import type { DemoUser } from "./demoData";

/** Fecha local en formato ISO (YYYY-MM-DD). */
export function todayIso(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Día de la semana con 1 = Lunes … 7 = Domingo. */
export function isoWeekday(d = new Date()): number {
  const js = d.getDay(); // 0 = domingo
  return js === 0 ? 7 : js;
}

export const MAIN_LIFTS = [
  { ejercicioId: "ex-bench", ejercicio: "Press de Banca con Barra" },
  { ejercicioId: "ex-squat", ejercicio: "Sentadilla Trasera con Barra" },
  { ejercicioId: "ex-deadlift", ejercicio: "Peso Muerto Convencional" },
  { ejercicioId: "ex-ohp", ejercicio: "Press Militar de Pie con Barra (OHP)" },
  { ejercicioId: "ex-pullups", ejercicio: "Dominadas Lastradas" },
];

/** Perfil de partida del onboarding (valores neutros, el usuario los edita). */
export const DEFAULT_PROFILE: BodyProfileInput = {
  sexo: "hombre",
  edad: 25,
  estaturaCm: 175,
  pesoKg: 70,
  nivelActividad: "moderado",
  objetivo: "recomposicion",
  cuelloCm: 38,
  cinturaCm: 82,
  caderaCm: 96,
  pechoCm: 98,
  brazoCm: 33,
  musloCm: 56,
  pantorrillaCm: 37,
  grasaPctManual: null,
};

export const GYMS_LIST = [
  "Gold's Performance — Sede Miraflores",
  "Gold's Performance — Sede San Isidro",
  "Gold's Performance — Sede Surco",
  "Gold's Performance — Sede La Molina",
];

/** Recalcula el TRENO Score semanal con el estado real del usuario. */
export function recomputeScore(u: DemoUser): TrenoScoreBreakdown {
  const pactados = Math.max(1, u.diasPactadosSemana.length);
  const cumplidosPactados = u.diasCumplidosEstaSemana.filter((d) =>
    u.diasPactadosSemana.includes(d)
  ).length;
  const extra = Math.max(0, u.diasCumplidosEstaSemana.length - cumplidosPactados);

  const tonelaje = u.tonelajeSemanaKg ?? 0;
  const pesajes = u.pesajesUltimos14Dias.length;
  const entrenos = u.entrenamientosSemana ?? 0;
  const pesoPrevio =
    u.pesajesUltimos14Dias.length > 1
      ? u.pesajesUltimos14Dias[0].pesoKg
      : u.perfilActual.pesoKg;

  const sinProgreso = u.pesajesUltimos14Dias.length < 2;
  const score = calculateTrenoScore({
    asistencia: {
      diasPactados: pactados,
      diasCumplidosPactados: cumplidosPactados,
      diasExtra: extra,
      semanasRachaPerfecta: u.rachaSemanasPerfectas,
    },
    fuerza: {
      sexo: u.perfilActual.sexo,
      pesoCorporalAnteriorKg: pesoPrevio,
      pesoCorporalActualKg: u.perfilActual.pesoKg,
      levantamientosPrincipales: u.levantamientosClave
        .filter((l) => l.oneRmActualKg > 0)
        .map((l) => ({
          ejercicio: l.ejercicio,
          oneRmAnteriorKg: l.oneRmAnteriorKg || l.oneRmActualKg,
          oneRmActualKg: l.oneRmActualKg,
        })),
    },
    meta: {
      objetivo: u.perfilActual.objetivo,
      pesoAnteriorKg: pesoPrevio,
      pesoActualKg: u.perfilActual.pesoKg,
      ritmoSemanalPlaneadoKg: u.reporteActual.meta.ritmoSemanalKg,
      cinturaAnteriorCm: u.perfilInicial.cinturaCm,
      cinturaActualCm: u.perfilActual.cinturaCm,
    },
    volumen: {
      tonelajeSemanaActualKg: tonelaje,
      promedioTonelajeUltimas4SemanasKg: Math.max(1, tonelaje),
    },
    registro: {
      pesajesEnLaSemana: pesajes,
      registroMedidasSemanales: !sinProgreso,
      entrenamientosRegistrados: entrenos,
      entrenamientosRealizados: Math.max(entrenos, u.diasCumplidosEstaSemana.length),
    },
  });

  // Sin un segundo pesaje no hay avance que medir: el pilar de meta empieza en 0
  if (sinProgreso) {
    const quitado = score.pilares.meta.puntos;
    score.pilares.meta = {
      ...score.pilares.meta,
      puntos: 0,
      detalle: "Registra tu peso de nuevo para medir tu avance hacia la meta",
    };
    score.total = Math.max(0, score.total - quitado);
  }
  return score;
}

function slug(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

export interface FreshUserParams {
  nombre: string;
  diasPactados: number[];
  sedeGym: string;
}

export function buildFreshUser(
  profile: BodyProfileInput,
  { nombre, diasPactados, sedeGym }: FreshUserParams
): DemoUser {
  const hoy = todayIso();
  const reporte = calculateFullBodyReport(profile, hoy);
  const limpio = nombre.trim() || "Atleta";

  const base: DemoUser = {
    id: "usr-me",
    codigoDemo: "usuario_a",
    nombre: limpio,
    handle: `@${slug(limpio) || "atleta"}`,
    avatar: "",
    ubicacion: "",
    sedeGym,
    rolCrew: "admin",
    comparteKilos: false,
    rachaDias: 0,
    rachaSemanasPerfectas: 0,
    diasPactadosSemana: diasPactados.length ? [...diasPactados].sort() : [1, 3, 5],
    diasCumplidosEstaSemana: [],
    checkedInHoy: false,
    perfilInicial: profile,
    perfilActual: profile,
    pesajesUltimos14Dias: [
      { fecha: hoy, pesoKg: profile.pesoKg, cinturaCm: profile.cinturaCm },
    ],
    evolucion8Semanas: [
      {
        semana: 1,
        etiqueta: "Hoy",
        pesoRealKg: profile.pesoKg,
        pesoPlanKg: profile.pesoKg,
        grasaPct: reporte.grasaCorporal.valor,
        ffmi: reporte.ffmi.valor,
        cinturaCm: profile.cinturaCm,
        trenoScore: 0,
        dotsPromedio: 0,
        banca1RmKg: 0,
        sentadilla1RmKg: 0,
        pesoMuerto1RmKg: 0,
        tonelajeKg: 0,
      },
    ],
    levantamientosClave: MAIN_LIFTS.map((l) => ({
      ...l,
      oneRmInicialKg: 0,
      oneRmAnteriorKg: 0,
      oneRmActualKg: 0,
      ultimoPesoKg: 0,
      ultimasReps: 0,
    })),
    scoreSemanaActual: undefined as unknown as TrenoScoreBreakdown,
    reporteInicial: reporte,
    reporteActual: reporte,
    estadisticasVitalicias: {
      entrenamientos: 0,
      tonelajeTotalKg: 0,
      diasGym: 0,
      prsLogrados: 0,
    },
    tonelajeSemanaKg: 0,
    entrenamientosSemana: 0,
  };

  base.scoreSemanaActual = recomputeScore(base);
  return base;
}
