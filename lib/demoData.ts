import {
  BodyProfileInput,
  calculateFullBodyReport,
  FullBodyReport,
} from "./bodyMetrics";
import { calculateTrenoScore, TrenoScoreBreakdown } from "./trenoScore";

export interface DemoUser {
  id: string;
  codigoDemo: "usuario_a" | "usuario_b" | "amigo_1" | "amigo_2" | "amigo_3" | "amigo_4";
  nombre: string;
  handle: string;
  avatar: string;
  ubicacion: string;
  sedeGym: string;
  rolCrew: "admin" | "miembro";
  comparteKilos: boolean;
  rachaDias: number;
  rachaSemanasPerfectas: number;
  diasPactadosSemana: number[]; // 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb, 7=Dom
  diasCumplidosEstaSemana: number[];
  checkedInHoy: boolean;
  perfilInicial: BodyProfileInput;
  perfilActual: BodyProfileInput;
  pesajesUltimos14Dias: { fecha: string; pesoKg: number; cinturaCm?: number }[];
  /** Historial de pesajes más largo (hasta 90) para proyectar la meta. */
  pesajesHistoricos?: { fecha: string; pesoKg: number }[];
  evolucion8Semanas: {
    semana: number;
    etiqueta: string;
    pesoRealKg: number;
    pesoPlanKg: number;
    grasaPct: number;
    ffmi: number;
    cinturaCm: number;
    trenoScore: number;
    dotsPromedio: number;
    banca1RmKg: number;
    sentadilla1RmKg: number;
    pesoMuerto1RmKg: number;
    tonelajeKg: number;
  }[];
  levantamientosClave: {
    ejercicioId: string;
    ejercicio: string;
    oneRmInicialKg: number;
    oneRmAnteriorKg: number;
    oneRmActualKg: number;
    ultimoPesoKg: number;
    ultimasReps: number;
  }[];
  scoreSemanaActual: TrenoScoreBreakdown;
  reporteInicial: FullBodyReport;
  reporteActual: FullBodyReport;
  /** Tonelaje acumulado en la semana en curso (kg). */
  tonelajeSemanaKg?: number;
  /** Entrenamientos registrados en la semana en curso. */
  entrenamientosSemana?: number;
  estadisticasVitalicias: {
    entrenamientos: number;
    tonelajeTotalKg: number;
    diasGym: number;
    prsLogrados: number;
  };
}

const PERFIL_INICIAL_A: BodyProfileInput = {
  sexo: "hombre",
  edad: 25,
  estaturaCm: 175,
  pesoKg: 64.0,
  nivelActividad: "moderado",
  objetivo: "volumen",
  cuelloCm: 37.0,
  cinturaCm: 76.5,
  pechoCm: 95.0,
  brazoCm: 34.0,
  musloCm: 54.0,
  pantorrillaCm: 36.5,
};

const PERFIL_ACTUAL_A: BodyProfileInput = {
  ...PERFIL_INICIAL_A,
  pesoKg: 65.8,
  cuelloCm: 37.6,
  cinturaCm: 77.0,
  pechoCm: 98.2,
  brazoCm: 35.4,
  musloCm: 55.8,
  pantorrillaCm: 37.1,
};

const PERFIL_INICIAL_B: BodyProfileInput = {
  sexo: "hombre",
  edad: 26,
  estaturaCm: 175,
  pesoKg: 88.0,
  nivelActividad: "moderado",
  objetivo: "definicion",
  cuelloCm: 40.0,
  cinturaCm: 94.5,
  pechoCm: 105.0,
  brazoCm: 38.5,
  musloCm: 61.0,
  pantorrillaCm: 39.5,
};

const PERFIL_ACTUAL_B: BodyProfileInput = {
  ...PERFIL_INICIAL_B,
  pesoKg: 83.2,
  cuelloCm: 39.8,
  cinturaCm: 88.4,
  pechoCm: 104.2,
  brazoCm: 38.3,
  musloCm: 59.8,
  pantorrillaCm: 39.2,
};

const SCORE_A = calculateTrenoScore({
  asistencia: {
    diasPactados: 4,
    diasCumplidosPactados: 4,
    diasExtra: 0,
    semanasRachaPerfecta: 4,
  },
  fuerza: {
    sexo: "hombre",
    pesoCorporalAnteriorKg: 65.5,
    pesoCorporalActualKg: 65.8,
    levantamientosPrincipales: [
      { ejercicio: "Press de Banca con Barra", oneRmAnteriorKg: 83.5, oneRmActualKg: 85.0 },
      { ejercicio: "Sentadilla Trasera con Barra", oneRmAnteriorKg: 114.0, oneRmActualKg: 116.5 },
      { ejercicio: "Peso Muerto Convencional", oneRmAnteriorKg: 140.0, oneRmActualKg: 143.0 },
    ],
  },
  meta: {
    objetivo: "volumen",
    pesoAnteriorKg: 65.56,
    pesoActualKg: 65.8,
    ritmoSemanalPlaneadoKg: 0.24,
  },
  volumen: {
    tonelajeSemanaActualKg: 16420,
    promedioTonelajeUltimas4SemanasKg: 15800,
  },
  registro: {
    pesajesEnLaSemana: 5,
    registroMedidasSemanales: true,
    entrenamientosRegistrados: 4,
    entrenamientosRealizados: 4,
  },
});

const SCORE_B = calculateTrenoScore({
  asistencia: {
    diasPactados: 4,
    diasCumplidosPactados: 4,
    diasExtra: 0,
    semanasRachaPerfecta: 4,
  },
  fuerza: {
    sexo: "hombre",
    pesoCorporalAnteriorKg: 83.85,
    pesoCorporalActualKg: 83.2,
    levantamientosPrincipales: [
      { ejercicio: "Press de Banca con Barra", oneRmAnteriorKg: 101.0, oneRmActualKg: 102.0 },
      { ejercicio: "Sentadilla Trasera con Barra", oneRmAnteriorKg: 138.0, oneRmActualKg: 139.5 },
      { ejercicio: "Peso Muerto Convencional", oneRmAnteriorKg: 168.0, oneRmActualKg: 170.0 },
    ],
  },
  meta: {
    objetivo: "definicion",
    pesoAnteriorKg: 83.85,
    pesoActualKg: 83.2,
    ritmoSemanalPlaneadoKg: -0.65,
    cinturaAnteriorCm: 89.2,
    cinturaActualCm: 88.4,
  },
  volumen: {
    tonelajeSemanaActualKg: 19240,
    promedioTonelajeUltimas4SemanasKg: 18600,
  },
  registro: {
    pesajesEnLaSemana: 5,
    registroMedidasSemanales: true,
    entrenamientosRegistrados: 4,
    entrenamientosRealizados: 4,
  },
});

export const DEMO_USERS: Record<"usuario_a" | "usuario_b", DemoUser> = {
  usuario_a: {
    id: "usr-diego-a",
    codigoDemo: "usuario_a",
    nombre: "Diego Mendoza",
    handle: "@diego.lifts",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80",
    ubicacion: "Miraflores, Lima",
    sedeGym: "Gold's Performance — Sede Miraflores",
    rolCrew: "admin",
    comparteKilos: false,
    rachaDias: 14,
    rachaSemanasPerfectas: 4,
    diasPactadosSemana: [1, 2, 4, 6],
    diasCumplidosEstaSemana: [1, 2, 4],
    checkedInHoy: false,
    perfilInicial: PERFIL_INICIAL_A,
    perfilActual: PERFIL_ACTUAL_A,
    pesajesUltimos14Dias: [
      { fecha: "2026-10-30", pesoKg: 65.3 },
      { fecha: "2026-10-31", pesoKg: 65.5 },
      { fecha: "2026-11-01", pesoKg: 65.2 },
      { fecha: "2026-11-02", pesoKg: 65.6 },
      { fecha: "2026-11-03", pesoKg: 65.5 },
      { fecha: "2026-11-04", pesoKg: 65.7 },
      { fecha: "2026-11-05", pesoKg: 65.4, cinturaCm: 76.9 },
      { fecha: "2026-11-06", pesoKg: 65.6 },
      { fecha: "2026-11-07", pesoKg: 65.9 },
      { fecha: "2026-11-08", pesoKg: 65.5 },
      { fecha: "2026-11-09", pesoKg: 65.8 },
      { fecha: "2026-11-10", pesoKg: 66.0 },
      { fecha: "2026-11-11", pesoKg: 65.7 },
      { fecha: "2026-11-12", pesoKg: 65.9, cinturaCm: 77.0 },
    ],
    evolucion8Semanas: [
      { semana: 1, etiqueta: "Sem 1", pesoRealKg: 64.0, pesoPlanKg: 64.0, grasaPct: 11.4, ffmi: 18.5, cinturaCm: 76.5, trenoScore: 845, dotsPromedio: 79.2, banca1RmKg: 76.0, sentadilla1RmKg: 102.0, pesoMuerto1RmKg: 128.0, tonelajeKg: 13800 },
      { semana: 2, etiqueta: "Sem 2", pesoRealKg: 64.3, pesoPlanKg: 64.24, grasaPct: 11.5, ffmi: 18.6, cinturaCm: 76.5, trenoScore: 880, dotsPromedio: 80.5, banca1RmKg: 77.5, sentadilla1RmKg: 104.5, pesoMuerto1RmKg: 130.0, tonelajeKg: 14150 },
      { semana: 3, etiqueta: "Sem 3", pesoRealKg: 64.5, pesoPlanKg: 64.48, grasaPct: 11.5, ffmi: 18.7, cinturaCm: 76.6, trenoScore: 910, dotsPromedio: 81.8, banca1RmKg: 78.5, sentadilla1RmKg: 106.0, pesoMuerto1RmKg: 132.5, tonelajeKg: 14600 },
      { semana: 4, etiqueta: "Sem 4", pesoRealKg: 64.8, pesoPlanKg: 64.72, grasaPct: 11.6, ffmi: 18.8, cinturaCm: 76.7, trenoScore: 925, dotsPromedio: 83.0, banca1RmKg: 80.0, sentadilla1RmKg: 108.5, pesoMuerto1RmKg: 135.0, tonelajeKg: 15000 },
      { semana: 5, etiqueta: "Sem 5", pesoRealKg: 65.0, pesoPlanKg: 64.96, grasaPct: 11.7, ffmi: 18.9, cinturaCm: 76.8, trenoScore: 940, dotsPromedio: 84.4, banca1RmKg: 81.0, sentadilla1RmKg: 110.5, pesoMuerto1RmKg: 137.0, tonelajeKg: 15450 },
      { semana: 6, etiqueta: "Sem 6", pesoRealKg: 65.3, pesoPlanKg: 65.2, grasaPct: 11.7, ffmi: 19.0, cinturaCm: 76.8, trenoScore: 955, dotsPromedio: 85.6, banca1RmKg: 82.5, sentadilla1RmKg: 112.5, pesoMuerto1RmKg: 138.5, tonelajeKg: 15700 },
      { semana: 7, etiqueta: "Sem 7", pesoRealKg: 65.56, pesoPlanKg: 65.44, grasaPct: 11.8, ffmi: 19.1, cinturaCm: 76.9, trenoScore: 968, dotsPromedio: 86.8, banca1RmKg: 83.5, sentadilla1RmKg: 114.0, pesoMuerto1RmKg: 140.0, tonelajeKg: 16050 },
      { semana: 8, etiqueta: "Sem 8", pesoRealKg: 65.8, pesoPlanKg: 65.68, grasaPct: 11.8, ffmi: 19.2, cinturaCm: 77.0, trenoScore: SCORE_A.total, dotsPromedio: 88.3, banca1RmKg: 85.0, sentadilla1RmKg: 116.5, pesoMuerto1RmKg: 143.0, tonelajeKg: 16420 },
    ],
    levantamientosClave: [
      { ejercicioId: "ex-bench", ejercicio: "Press de Banca con Barra", oneRmInicialKg: 76.0, oneRmAnteriorKg: 83.5, oneRmActualKg: 85.0, ultimoPesoKg: 75.0, ultimasReps: 5 },
      { ejercicioId: "ex-squat", ejercicio: "Sentadilla Trasera con Barra", oneRmInicialKg: 102.0, oneRmAnteriorKg: 114.0, oneRmActualKg: 116.5, ultimoPesoKg: 102.5, ultimasReps: 5 },
      { ejercicioId: "ex-deadlift", ejercicio: "Peso Muerto Convencional", oneRmInicialKg: 128.0, oneRmAnteriorKg: 140.0, oneRmActualKg: 143.0, ultimoPesoKg: 127.5, ultimasReps: 5 },
      { ejercicioId: "ex-ohp", ejercicio: "Press Militar de Pie con Barra (OHP)", oneRmInicialKg: 48.0, oneRmAnteriorKg: 53.5, oneRmActualKg: 55.0, ultimoPesoKg: 47.5, ultimasReps: 6 },
      { ejercicioId: "ex-pullups", ejercicio: "Dominadas Lastradas", oneRmInicialKg: 78.0, oneRmAnteriorKg: 85.0, oneRmActualKg: 87.5, ultimoPesoKg: 77.5, ultimasReps: 5 },
    ],
    scoreSemanaActual: SCORE_A,
    reporteInicial: calculateFullBodyReport(PERFIL_INICIAL_A, "2026-09-17"),
    reporteActual: calculateFullBodyReport(PERFIL_ACTUAL_A, "2026-09-17"),
    estadisticasVitalicias: {
      entrenamientos: 142,
      tonelajeTotalKg: 1945000,
      diasGym: 168,
      prsLogrados: 29,
    },
  },
  usuario_b: {
    id: "usr-mateo-b",
    codigoDemo: "usuario_b",
    nombre: "Mateo Vargas",
    handle: "@mateo.cut",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80",
    ubicacion: "San Isidro, Lima",
    sedeGym: "Gold's Performance — Sede San Isidro",
    rolCrew: "miembro",
    comparteKilos: false,
    rachaDias: 14,
    rachaSemanasPerfectas: 4,
    diasPactadosSemana: [1, 2, 4, 6],
    diasCumplidosEstaSemana: [1, 2, 4],
    checkedInHoy: false,
    perfilInicial: PERFIL_INICIAL_B,
    perfilActual: PERFIL_ACTUAL_B,
    pesajesUltimos14Dias: [
      { fecha: "2026-10-30", pesoKg: 84.3 },
      { fecha: "2026-10-31", pesoKg: 84.1 },
      { fecha: "2026-11-01", pesoKg: 84.4 },
      { fecha: "2026-11-02", pesoKg: 83.9 },
      { fecha: "2026-11-03", pesoKg: 83.8 },
      { fecha: "2026-11-04", pesoKg: 83.7 },
      { fecha: "2026-11-05", pesoKg: 83.9, cinturaCm: 89.2 },
      { fecha: "2026-11-06", pesoKg: 83.6 },
      { fecha: "2026-11-07", pesoKg: 83.4 },
      { fecha: "2026-11-08", pesoKg: 83.5 },
      { fecha: "2026-11-09", pesoKg: 83.2 },
      { fecha: "2026-11-10", pesoKg: 83.0 },
      { fecha: "2026-11-11", pesoKg: 83.3 },
      { fecha: "2026-11-12", pesoKg: 83.0, cinturaCm: 88.4 },
    ],
    evolucion8Semanas: [
      { semana: 1, etiqueta: "Sem 1", pesoRealKg: 88.0, pesoPlanKg: 88.0, grasaPct: 24.4, ffmi: 21.7, cinturaCm: 94.5, trenoScore: 840, dotsPromedio: 81.4, banca1RmKg: 96.0, sentadilla1RmKg: 130.0, pesoMuerto1RmKg: 158.0, tonelajeKg: 17100 },
      { semana: 2, etiqueta: "Sem 2", pesoRealKg: 87.3, pesoPlanKg: 87.35, grasaPct: 23.8, ffmi: 21.7, cinturaCm: 93.6, trenoScore: 875, dotsPromedio: 82.6, banca1RmKg: 97.0, sentadilla1RmKg: 131.5, pesoMuerto1RmKg: 160.0, tonelajeKg: 17400 },
      { semana: 3, etiqueta: "Sem 3", pesoRealKg: 86.6, pesoPlanKg: 86.7, grasaPct: 23.1, ffmi: 21.7, cinturaCm: 92.8, trenoScore: 905, dotsPromedio: 83.8, banca1RmKg: 98.0, sentadilla1RmKg: 133.0, pesoMuerto1RmKg: 161.5, tonelajeKg: 17850 },
      { semana: 4, etiqueta: "Sem 4", pesoRealKg: 85.9, pesoPlanKg: 86.05, grasaPct: 22.4, ffmi: 21.8, cinturaCm: 91.9, trenoScore: 928, dotsPromedio: 85.0, banca1RmKg: 98.5, sentadilla1RmKg: 134.5, pesoMuerto1RmKg: 163.5, tonelajeKg: 18100 },
      { semana: 5, etiqueta: "Sem 5", pesoRealKg: 85.2, pesoPlanKg: 85.4, grasaPct: 21.7, ffmi: 21.8, cinturaCm: 91.0, trenoScore: 942, dotsPromedio: 86.1, banca1RmKg: 99.5, sentadilla1RmKg: 136.0, pesoMuerto1RmKg: 165.0, tonelajeKg: 18400 },
      { semana: 6, etiqueta: "Sem 6", pesoRealKg: 84.5, pesoPlanKg: 84.75, grasaPct: 21.0, ffmi: 21.8, cinturaCm: 90.1, trenoScore: 958, dotsPromedio: 87.3, banca1RmKg: 100.5, sentadilla1RmKg: 137.0, pesoMuerto1RmKg: 166.5, tonelajeKg: 18750 },
      { semana: 7, etiqueta: "Sem 7", pesoRealKg: 83.85, pesoPlanKg: 84.1, grasaPct: 20.3, ffmi: 21.8, cinturaCm: 89.2, trenoScore: 966, dotsPromedio: 88.2, banca1RmKg: 101.0, sentadilla1RmKg: 138.0, pesoMuerto1RmKg: 168.0, tonelajeKg: 18950 },
      { semana: 8, etiqueta: "Sem 8", pesoRealKg: 83.2, pesoPlanKg: 83.45, grasaPct: 19.6, ffmi: 21.8, cinturaCm: 88.4, trenoScore: SCORE_B.total, dotsPromedio: 89.5, banca1RmKg: 102.0, sentadilla1RmKg: 139.5, pesoMuerto1RmKg: 170.0, tonelajeKg: 19240 },
    ],
    levantamientosClave: [
      { ejercicioId: "ex-bench", ejercicio: "Press de Banca con Barra", oneRmInicialKg: 96.0, oneRmAnteriorKg: 101.0, oneRmActualKg: 102.0, ultimoPesoKg: 90.0, ultimasReps: 5 },
      { ejercicioId: "ex-squat", ejercicio: "Sentadilla Trasera con Barra", oneRmInicialKg: 130.0, oneRmAnteriorKg: 138.0, oneRmActualKg: 139.5, ultimoPesoKg: 122.5, ultimasReps: 5 },
      { ejercicioId: "ex-deadlift", ejercicio: "Peso Muerto Convencional", oneRmInicialKg: 158.0, oneRmAnteriorKg: 168.0, oneRmActualKg: 170.0, ultimoPesoKg: 150.0, ultimasReps: 5 },
      { ejercicioId: "ex-ohp", ejercicio: "Press Militar de Pie con Barra (OHP)", oneRmInicialKg: 60.0, oneRmAnteriorKg: 64.0, oneRmActualKg: 65.0, ultimoPesoKg: 57.5, ultimasReps: 5 },
      { ejercicioId: "ex-pullups", ejercicio: "Dominadas Lastradas", oneRmInicialKg: 90.0, oneRmAnteriorKg: 94.0, oneRmActualKg: 95.5, ultimoPesoKg: 85.0, ultimasReps: 5 },
    ],
    scoreSemanaActual: SCORE_B,
    reporteInicial: calculateFullBodyReport(PERFIL_INICIAL_B, "2026-09-17"),
    reporteActual: calculateFullBodyReport(PERFIL_ACTUAL_B, "2026-09-17"),
    estadisticasVitalicias: {
      entrenamientos: 176,
      tonelajeTotalKg: 2630000,
      diasGym: 194,
      prsLogrados: 34,
    },
  },
};

export interface CrewMemberRankingRow {
  userId: string;
  codigoDemo: string;
  nombre: string;
  handle: string;
  avatar: string;
  objetivo: "volumen" | "definicion" | "recomposicion" | "fuerza";
  etiquetaObjetivo: string;
  estaturaCm: number;
  pesoKg: number;
  comparteKilos: boolean;
  trenoScore: number;
  asistenciaPts: number;
  asistenciaPct: number;
  fuerzaPts: number;
  dotsTotalTresBasicos: number;
  subidaCargaSemanalPct: number;
  metaPts: number;
  progresoMetaTemporadaPct: number;
  volumenPts: number;
  registroPts: number;
  rachaDias: number;
  rachaSemanas: number;
  historialSemanalScores: number[];
}

export const CREW_MEMBERS_SEED: CrewMemberRankingRow[] = [
  {
    userId: "usr-diego-a",
    codigoDemo: "usuario_a",
    nombre: "Atleta",
    handle: "@diego.lifts",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80",
    objetivo: "volumen",
    etiquetaObjetivo: "Volumen (+Masa)",
    estaturaCm: 175,
    pesoKg: 65.8,
    comparteKilos: false,
    trenoScore: SCORE_A.total,
    asistenciaPts: SCORE_A.pilares.asistencia.puntos,
    asistenciaPct: 100,
    fuerzaPts: SCORE_A.pilares.fuerza.puntos,
    dotsTotalTresBasicos: 268.4,
    subidaCargaSemanalPct: 2.1,
    metaPts: SCORE_A.pilares.meta.puntos,
    progresoMetaTemporadaPct: 96,
    volumenPts: SCORE_A.pilares.volumen.puntos,
    registroPts: SCORE_A.pilares.registro.puntos,
    rachaDias: 14,
    rachaSemanas: 4,
    historialSemanalScores: [845, 880, 910, 925, 940, 955, 968, SCORE_A.total],
  },
  {
    userId: "usr-mateo-b",
    codigoDemo: "usuario_b",
    nombre: "Mateo Vargas",
    handle: "@mateo.cut",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80",
    objetivo: "definicion",
    etiquetaObjetivo: "Definición (−Grasa)",
    estaturaCm: 175,
    pesoKg: 83.2,
    comparteKilos: false,
    trenoScore: SCORE_B.total,
    asistenciaPts: SCORE_B.pilares.asistencia.puntos,
    asistenciaPct: 100,
    fuerzaPts: SCORE_B.pilares.fuerza.puntos,
    dotsTotalTresBasicos: 274.1,
    subidaCargaSemanalPct: 1.9,
    metaPts: SCORE_B.pilares.meta.puntos,
    progresoMetaTemporadaPct: 96,
    volumenPts: SCORE_B.pilares.volumen.puntos,
    registroPts: SCORE_B.pilares.registro.puntos,
    rachaDias: 14,
    rachaSemanas: 4,
    historialSemanalScores: [840, 875, 905, 928, 942, 958, 966, SCORE_B.total],
  },
  {
    userId: "usr-valentina",
    codigoDemo: "amigo_1",
    nombre: "Valentina Ríos",
    handle: "@val.rios",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&auto=format&fit=crop&q=80",
    objetivo: "recomposicion",
    etiquetaObjetivo: "Recomposición",
    estaturaCm: 166,
    pesoKg: 60.5,
    comparteKilos: false,
    trenoScore: 948,
    asistenciaPts: 330,
    asistenciaPct: 100,
    fuerzaPts: 232,
    dotsTotalTresBasicos: 281.5,
    subidaCargaSemanalPct: 2.4,
    metaPts: 206,
    progresoMetaTemporadaPct: 89,
    volumenPts: 95,
    registroPts: 85,
    rachaDias: 19,
    rachaSemanas: 5,
    historialSemanalScores: [860, 870, 895, 910, 920, 935, 942, 948],
  },
  {
    userId: "usr-lucas",
    codigoDemo: "amigo_2",
    nombre: "Lucas Salazar",
    handle: "@lucas.power",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80",
    objetivo: "fuerza",
    etiquetaObjetivo: "Fuerza DOTS",
    estaturaCm: 178,
    pesoKg: 81.0,
    comparteKilos: true,
    trenoScore: 912,
    asistenciaPts: 300,
    asistenciaPct: 100,
    fuerzaPts: 248,
    dotsTotalTresBasicos: 312.8,
    subidaCargaSemanalPct: 2.8,
    metaPts: 194,
    progresoMetaTemporadaPct: 84,
    volumenPts: 90,
    registroPts: 80,
    rachaDias: 9,
    rachaSemanas: 2,
    historialSemanalScores: [810, 830, 845, 860, 875, 890, 901, 912],
  },
  {
    userId: "usr-camila",
    codigoDemo: "amigo_3",
    nombre: "Camila Torres",
    handle: "@cami.fit",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=240&auto=format&fit=crop&q=80",
    objetivo: "volumen",
    etiquetaObjetivo: "Volumen (+Glúteo/Pierna)",
    estaturaCm: 163,
    pesoKg: 56.2,
    comparteKilos: false,
    trenoScore: 874,
    asistenciaPts: 275,
    asistenciaPct: 75,
    fuerzaPts: 215,
    dotsTotalTresBasicos: 249.0,
    subidaCargaSemanalPct: 1.5,
    metaPts: 214,
    progresoMetaTemporadaPct: 86,
    volumenPts: 85,
    registroPts: 85,
    rachaDias: 6,
    rachaSemanas: 1,
    historialSemanalScores: [790, 815, 830, 825, 850, 860, 865, 874],
  },
  {
    userId: "usr-sebastian",
    codigoDemo: "amigo_4",
    nombre: "Sebastián Paz",
    handle: "@sebas.gym",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=240&auto=format&fit=crop&q=80",
    objetivo: "definicion",
    etiquetaObjetivo: "Definición (−Grasa)",
    estaturaCm: 180,
    pesoKg: 91.4,
    comparteKilos: false,
    trenoScore: 815,
    asistenciaPts: 225,
    asistenciaPct: 75,
    fuerzaPts: 205,
    dotsTotalTresBasicos: 256.2,
    subidaCargaSemanalPct: 1.1,
    metaPts: 215,
    progresoMetaTemporadaPct: 81,
    volumenPts: 85,
    registroPts: 85,
    rachaDias: 4,
    rachaSemanas: 0,
    historialSemanalScores: [740, 760, 790, 785, 800, 805, 810, 815],
  },
];
