/**
 * TRENO — Motor de Puntaje Justo: TRENO Score (lib/trenoScore.ts)
 * Evalúa de 0 a 1000 puntos semanales combinando 5 pilares configurables.
 * Garantiza que el Usuario A (Volumen, 64 kg) y el Usuario B (Definición, 88 kg)
 * compitan en perfecta igualdad de condiciones al cumplir su propio plan.
 */

import { BiologicalSex, calculateDOTS, GoalType } from "./bodyMetrics";

export interface TrenoScoreWeights {
  asistencia: number; // default 0.30
  fuerza: number;     // default 0.25
  meta: number;       // default 0.25
  volumen: number;    // default 0.10
  registro: number;   // default 0.10
}

export const DEFAULT_SCORE_WEIGHTS: TrenoScoreWeights = {
  asistencia: 0.30,
  fuerza: 0.25,
  meta: 0.25,
  volumen: 0.10,
  registro: 0.10,
};

export interface WeeklyAttendanceInput {
  diasPactados: number;           // ej. 4 días/semana
  diasCumplidosPactados: number;  // ej. 4 de 4
  diasExtra: number;              // ej. 1 día extra opcional
  semanasRachaPerfecta: number;   // 2 sem -> x1.1, 4+ sem -> x1.2
}

export interface LiftComparison {
  ejercicio: string;
  oneRmAnteriorKg: number;
  oneRmActualKg: number;
}

export interface WeeklyStrengthInput {
  sexo: BiologicalSex;
  pesoCorporalAnteriorKg: number;
  pesoCorporalActualKg: number;
  levantamientosPrincipales: LiftComparison[];
  metaMejoraSemanalPct?: number; // default 1.25% semanal (~5% mensual) = 100% del pilar
}

export interface WeeklyBodyGoalInput {
  objetivo: GoalType;
  pesoAnteriorKg: number;
  pesoActualKg: number; // promedio móvil de 7 días
  ritmoSemanalPlaneadoKg: number; // ej. +0.24 kg en volumen o -0.65 kg en definición
  cinturaAnteriorCm?: number;
  cinturaActualCm?: number;
  grasaAnteriorPct?: number;
  grasaActualPct?: number;
  mantuvoOSubioFuerza?: boolean;
}

export interface WeeklyVolumeInput {
  tonelajeSemanaActualKg: number;
  promedioTonelajeUltimas4SemanasKg: number;
}

export interface WeeklyLoggingConsistencyInput {
  pesajesEnLaSemana: number;        // mínimo 3 para promedio móvil de 7 días
  registroMedidasSemanales: boolean;
  entrenamientosRegistrados: number;
  entrenamientosRealizados: number;
}

export interface TrenoScoreInput {
  asistencia: WeeklyAttendanceInput;
  fuerza: WeeklyStrengthInput;
  meta: WeeklyBodyGoalInput;
  volumen: WeeklyVolumeInput;
  registro: WeeklyLoggingConsistencyInput;
  pesos?: TrenoScoreWeights;
}

export interface TrenoScoreBreakdown {
  total: number; // 0 a 1000
  pilares: {
    asistencia: {
      puntos: number;
      maxBase: number;
      porcentajeCumplido: number;
      multiplicadorRacha: number;
      detalle: string;
    };
    fuerza: {
      puntos: number;
      maxBase: number;
      mejoraRelativaDotsPct: number;
      dotsActualPromedio: number;
      detalle: string;
    };
    meta: {
      puntos: number;
      maxBase: number;
      porcentajeCaminoSemanal: number;
      alertaSalud: string | null;
      puntosAplanadosPorExceso: boolean;
      detalle: string;
    };
    volumen: {
      puntos: number;
      maxBase: number;
      ratioVsPromedio4Sem: number;
      detalle: string;
    };
    registro: {
      puntos: number;
      maxBase: number;
      porcentajeConsistencia: number;
      detalle: string;
    };
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

/**
 * 1. Pilar de Asistencia (30% por defecto = 300 pts base)
 * - Cumplir días pactados da el % proporcional.
 * - Faltar a un día pactado penaliza (-5% adicional por falta).
 * - Ir un día extra suma un bonus pequeño (+5% sobre el pilar).
 * - Multiplicador de racha: x1.1 a las 2 semanas perfectas, x1.2 a las 4+ semanas.
 */
export function scoreAttendancePillar(
  input: WeeklyAttendanceInput,
  maxBase = 300
): TrenoScoreBreakdown["pilares"]["asistencia"] {
  const pactados = Math.max(1, input.diasPactados);
  const cumplidos = clamp(input.diasCumplidosPactados, 0, pactados);
  const faltas = Math.max(0, pactados - cumplidos);

  const ratioBase = cumplidos / pactados;
  const penalizacionFaltas = faltas * 0.04;
  const bonusExtra = Math.min(2, Math.max(0, input.diasExtra)) * 0.05;

  const ratioNeto = clamp(ratioBase - penalizacionFaltas + bonusExtra, 0, 1.05);

  let multiplicadorRacha = 1.0;
  if (cumplidos === pactados) {
    if (input.semanasRachaPerfecta >= 4) multiplicadorRacha = 1.2;
    else if (input.semanasRachaPerfecta >= 2) multiplicadorRacha = 1.1;
  }

  const puntos = Math.min(
    Math.round(maxBase * 1.2),
    Math.round(maxBase * ratioNeto * multiplicadorRacha)
  );

  return {
    puntos,
    maxBase,
    porcentajeCumplido: Math.round((cumplidos / pactados) * 100),
    multiplicadorRacha,
    detalle: `${cumplidos}/${pactados} días pactados cumplidos${
      input.diasExtra > 0 ? ` (+${input.diasExtra} extra)` : ""
    }${multiplicadorRacha > 1 ? ` · Racha ×${multiplicadorRacha}` : ""}`,
  };
}

/**
 * 2. Pilar de Progreso de Fuerza (25% por defecto = 250 pts base)
 * Compara el 1RM estimado normalizado con DOTS frente a la referencia previa.
 * Mantener el 100% de la fuerza otorga una base justa (70% del pilar) y superar el 1RM
 * en ~1.25% semanal (~5% mensual) en DOTS otorga el 100% de los 250 puntos.
 */
export function scoreStrengthPillar(
  input: WeeklyStrengthInput,
  maxBase = 250
): TrenoScoreBreakdown["pilares"]["fuerza"] {
  if (!input.levantamientosPrincipales.length) {
    return {
      puntos: 0,
      maxBase,
      mejoraRelativaDotsPct: 0,
      dotsActualPromedio: 0,
      detalle: "Sin levantamientos principales registrados esta semana",
    };
  }

  let sumPrevDots = 0;
  let sumCurrDots = 0;

  for (const lift of input.levantamientosPrincipales) {
    const prevDots = calculateDOTS(
      input.pesoCorporalAnteriorKg,
      lift.oneRmAnteriorKg,
      input.sexo
    ).puntosDots;
    const currDots = calculateDOTS(
      input.pesoCorporalActualKg,
      lift.oneRmActualKg,
      input.sexo
    ).puntosDots;
    sumPrevDots += prevDots;
    sumCurrDots += currDots;
  }

  const avgPrevDots = sumPrevDots / input.levantamientosPrincipales.length;
  const avgCurrDots = sumCurrDots / input.levantamientosPrincipales.length;

  const mejoraPct =
    avgPrevDots > 0 ? ((avgCurrDots - avgPrevDots) / avgPrevDots) * 100 : 0;

  const targetWeeklyPct = input.metaMejoraSemanalPct ?? 1.25;

  // Si mantiene su fuerza relativa (0% cambio) tiene 70% del pilar; si progresa >= targetWeeklyPct llega al 100%
  let ratio = 0;
  if (mejoraPct >= 0) {
    ratio = 0.7 + 0.3 * Math.min(1, mejoraPct / targetWeeklyPct);
  } else {
    // Si pierde fuerza relativa, baja proporcionalmente desde 0.7
    ratio = Math.max(0, 0.7 + (mejoraPct / 5) * 0.7);
  }

  const puntos = Math.round(maxBase * clamp(ratio, 0, 1));

  return {
    puntos,
    maxBase,
    mejoraRelativaDotsPct: Math.round(mejoraPct * 100) / 100,
    dotsActualPromedio: Math.round(avgCurrDots * 10) / 10,
    detalle: `Fuerza relativa DOTS ${
      mejoraPct >= 0 ? `+${mejoraPct.toFixed(2)}%` : `${mejoraPct.toFixed(2)}%`
    } (${avgCurrDots.toFixed(1)} pts DOTS)`,
  };
}

/**
 * 3. Pilar de Progreso hacia la Meta Corporal (25% por defecto = 250 pts base)
 * Evalúa "% del camino recorrido esta semana frente a lo planeado".
 * - Volumen: suma por kg ganado dentro del ritmo saludable (+0.25% a +0.5%/sem). Si sube demasiado rápido (>0.65%/sem), aplana puntos y avisa.
 * - Definición: suma por kg y cm de cintura perdidos dentro del ritmo saludable (-0.5% a -1.0%/sem). Si baja demasiado rápido (<-1.15%/sem), no da puntos extra y activa alerta de salud.
 * - Recomposición: puntos por bajar % de grasa manteniendo peso y fuerza.
 */
export function scoreBodyGoalPillar(
  input: WeeklyBodyGoalInput,
  maxBase = 250
): TrenoScoreBreakdown["pilares"]["meta"] {
  const deltaKg = input.pesoActualKg - input.pesoAnteriorKg;
  const deltaPctBodyweight = (deltaKg / Math.max(40, input.pesoAnteriorKg)) * 100;

  let ratio = 0;
  let alertaSalud: string | null = null;
  let puntosAplanadosPorExceso = false;
  let detalle = "";

  if (input.objetivo === "volumen") {
    const planKg = Math.max(0.1, input.ritmoSemanalPlaneadoKg);
    const maxHealthyPct = 0.55; // >0.55% del peso por semana suele ser ganancia excesiva de grasa

    if (deltaPctBodyweight > maxHealthyPct) {
      ratio = 0.88; // Se aplana por subir demasiado rápido
      puntosAplanadosPorExceso = true;
      alertaSalud =
        "Ritmo de subida superior al rango magro (+0.5%/sem). Puntos aplanados para premiar volumen limpio.";
      detalle = `+${deltaKg.toFixed(2)} kg esta semana (ritmo acelerado; puntos estabilizados)`;
    } else if (deltaKg <= 0) {
      ratio = Math.max(0.15, 0.5 + deltaKg / planKg);
      detalle = `${deltaKg.toFixed(2)} kg frente a tu meta de +${planKg.toFixed(2)} kg/sem`;
    } else {
      ratio = clamp(deltaKg / planKg, 0, 1.0);
      detalle = `+${deltaKg.toFixed(2)} kg ganados (meta semanal: +${planKg.toFixed(2)} kg en volumen limpio)`;
    }
  } else if (input.objetivo === "definicion") {
    const planLossKg = Math.max(0.15, Math.abs(input.ritmoSemanalPlaneadoKg));
    const actualLossKg = -deltaKg; // positivo si perdió peso
    const lossPctBodyweight = -deltaPctBodyweight;

    const cinturaDelta =
      typeof input.cinturaAnteriorCm === "number" &&
      typeof input.cinturaActualCm === "number"
        ? input.cinturaAnteriorCm - input.cinturaActualCm
        : 0;
    const bonusCintura = cinturaDelta > 0 ? Math.min(0.12, cinturaDelta * 0.08) : 0;

    if (lossPctBodyweight > 1.1) {
      // Bajar más de 1% del peso corporal por semana activa alerta de salud y no da puntos extra
      ratio = 0.85;
      puntosAplanadosPorExceso = true;
      alertaSalud =
        "Alerta de salud: pérdida mayor al 1% de tu peso corporal esta semana. Modera el déficit para proteger tu masa muscular.";
      detalle = `−${actualLossKg.toFixed(2)} kg esta semana (excede ritmo seguro de −1%/sem)`;
    } else if (actualLossKg <= 0) {
      ratio = clamp(0.25 + bonusCintura, 0, 0.5);
      detalle = `+${ deltaKg.toFixed(2)} kg esta semana (meta: −${planLossKg.toFixed(2)} kg/sem)`;
    } else {
      ratio = clamp(actualLossKg / planLossKg + bonusCintura, 0, 1.0);
      detalle = `−${actualLossKg.toFixed(2)} kg${
        cinturaDelta > 0 ? ` y −${cinturaDelta.toFixed(1)} cm de cintura` : ""
      } (meta: −${planLossKg.toFixed(2)} kg/sem)`;
    }
  } else if (input.objetivo === "recomposicion") {
    const bfDrop =
      typeof input.grasaAnteriorPct === "number" &&
      typeof input.grasaActualPct === "number"
        ? input.grasaAnteriorPct - input.grasaActualPct
        : 0.15;
    const pesoEstable = Math.abs(deltaPctBodyweight) <= 0.4;
    const fuerzaOk = input.mantuvoOSubioFuerza ?? true;

    ratio = clamp(
      (bfDrop >= 0.15 ? 0.65 : 0.35) + (pesoEstable ? 0.2 : 0) + (fuerzaOk ? 0.15 : 0),
      0,
      1.0
    );
    detalle = `Recomposición: ${bfDrop >= 0 ? `−${bfDrop.toFixed(1)}% grasa` : "ajustando"} con peso estable`;
  } else {
    // Fuerza
    const fuerzaOk = input.mantuvoOSubioFuerza ?? true;
    const dentroRango = deltaPctBodyweight >= -0.2 && deltaPctBodyweight <= 0.4;
    ratio = clamp((fuerzaOk ? 0.7 : 0.3) + (dentroRango ? 0.3 : 0.1), 0, 1.0);
    detalle = "Peso corporal óptimo para bloque de fuerza";
  }

  return {
    puntos: Math.round(maxBase * clamp(ratio, 0, 1)),
    maxBase,
    porcentajeCaminoSemanal: Math.round(clamp(ratio, 0, 1) * 100),
    alertaSalud,
    puntosAplanadosPorExceso,
    detalle,
  };
}

/**
 * 4. Pilar de Volumen de Entrenamiento (10% por defecto = 100 pts base)
 */
export function scoreVolumePillar(
  input: WeeklyVolumeInput,
  maxBase = 100
): TrenoScoreBreakdown["pilares"]["volumen"] {
  const prev = Math.max(1, input.promedioTonelajeUltimas4SemanasKg);
  const ratioRaw = input.tonelajeSemanaActualKg / prev;
  // Cumplir o superar ligeramente (1.02x) su promedio de 4 semanas otorga el 100% del pilar
  const normalized = clamp(ratioRaw / 1.02, 0, 1.0);

  return {
    puntos: Math.round(maxBase * normalized),
    maxBase,
    ratioVsPromedio4Sem: Math.round(ratioRaw * 100) / 100,
    detalle: `${input.tonelajeSemanaActualKg.toLocaleString("es-PE")} kg movidos (${Math.round(
      ratioRaw * 100
    )}% de tu promedio 4 sem)`,
  };
}

/**
 * 5. Pilar de Consistencia de Registro (10% por defecto = 100 pts base)
 * - Pesarse mínimo 3 veces en la semana (40% del pilar)
 * - Registrar medidas semanales con cinta (30% del pilar)
 * - Registrar entrenamientos realizados (30% del pilar)
 */
export function scoreLoggingPillar(
  input: WeeklyLoggingConsistencyInput,
  maxBase = 100
): TrenoScoreBreakdown["pilares"]["registro"] {
  const scorePesajes = Math.min(1, input.pesajesEnLaSemana / 3) * 0.4;
  const scoreMedidas = (input.registroMedidasSemanales ? 1 : 0) * 0.3;
  const realizados = Math.max(1, input.entrenamientosRealizados);
  const scoreEntrenos =
    Math.min(1, input.entrenamientosRegistrados / realizados) * 0.3;

  const totalRatio = clamp(scorePesajes + scoreMedidas + scoreEntrenos, 0, 1);

  return {
    puntos: Math.round(maxBase * totalRatio),
    maxBase,
    porcentajeConsistencia: Math.round(totalRatio * 100),
    detalle: `${input.pesajesEnLaSemana} pesajes (media 7d) · ${
      input.registroMedidasSemanales ? "Medidas al día" : "Medidas pendientes"
    }`,
  };
}

/**
 * Cálculo Integral del TRENO Score (0 a 1000 puntos)
 */
export function calculateTrenoScore(input: TrenoScoreInput): TrenoScoreBreakdown {
  const weights = input.pesos ?? DEFAULT_SCORE_WEIGHTS;

  const maxAsistencia = Math.round(1000 * weights.asistencia);
  const maxFuerza = Math.round(1000 * weights.fuerza);
  const maxMeta = Math.round(1000 * weights.meta);
  const maxVolumen = Math.round(1000 * weights.volumen);
  const maxRegistro = Math.round(1000 * weights.registro);

  const asistencia = scoreAttendancePillar(input.asistencia, maxAsistencia);
  const fuerza = scoreStrengthPillar(input.fuerza, maxFuerza);
  const meta = scoreBodyGoalPillar(input.meta, maxMeta);
  const volumen = scoreVolumePillar(input.volumen, maxVolumen);
  const registro = scoreLoggingPillar(input.registro, maxRegistro);

  const rawSum =
    asistencia.puntos +
    fuerza.puntos +
    meta.puntos +
    volumen.puntos +
    registro.puntos;

  return {
    total: clamp(rawSum, 0, 1000),
    pilares: {
      asistencia,
      fuerza,
      meta,
      volumen,
      registro,
    },
  };
}

/**
 * Sistema Antitrampas:
 * 1. Verificación de Geocerca Haversine (distancia al gimnasio en metros)
 * 2. Detección de saltos irreales de peso o de carga (Outliers para revisión)
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function detectOutlierJump(params: {
  tipo: "carga_1rm" | "peso_corporal";
  valorAnterior: number;
  valorNuevo: number;
}): { esOutlier: boolean; motivo: string | null } {
  if (params.valorAnterior <= 0) return { esOutlier: false, motivo: null };
  const pctJump =
    Math.abs(params.valorNuevo - params.valorAnterior) / params.valorAnterior;

  if (params.tipo === "carga_1rm" && pctJump > 0.18) {
    return {
      esOutlier: true,
      motivo: `Salto de +${Math.round(
        pctJump * 100
      )}% en 1RM respecto a tu récord previo. Requiere validación de un compañero del Crew.`,
    };
  }

  if (params.tipo === "peso_corporal" && pctJump > 0.04) {
    return {
      esOutlier: true,
      motivo: `Variación de ${Math.round(
        pctJump * 100
      )}% en peso corporal en pocos días. Marcado para revisión de promedio móvil.`,
    };
  }

  return { esOutlier: false, motivo: null };
}
