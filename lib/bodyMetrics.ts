/**
 * TRENO — Motor Científico de Cálculo Corporal y Fuerza (lib/bodyMetrics.ts)
 * Implementa las fórmulas antropométricas, metabólicas y de fuerza relativa públicas,
 * acompañadas de explicaciones simples y metadatos de fórmula para los tooltips "¿Cómo se calcula?".
 */

export type BiologicalSex = "hombre" | "mujer";
export type ActivityLevel = "sedentario" | "ligero" | "moderado" | "alto" | "muy_alto";
export type GoalType = "volumen" | "definicion" | "recomposicion" | "fuerza";

export interface BodyProfileInput {
  sexo: BiologicalSex;
  edad: number;
  estaturaCm: number;
  pesoKg: number;
  nivelActividad: ActivityLevel;
  objetivo: GoalType;
  cuelloCm: number;
  cinturaCm: number; // a la altura del ombligo
  caderaCm?: number; // obligatoria en mujeres
  pechoCm?: number;
  brazoCm?: number;
  musloCm?: number;
  pantorrillaCm?: number;
  grasaPctManual?: number | null; // DEXA o bioimpedancia (prioridad si existe)
}

export interface MetricWithExplanation<T = number> {
  valor: T;
  unidad: string;
  categoria?: string;
  explicacionSimple: string;
  formulaNombre: string;
  formulaExpresion: string;
  advertencia?: string;
}

export interface IdealWeightReferences {
  rangoImcSaludableKg: { min: number; max: number };
  devineKg: number;
  robinsonKg: number;
  millerKg: number;
  explicacionSimple: string;
  formulaExpresion: string;
}

export interface BmrResult {
  principalKcal: number;
  metodoPrincipal: "Katch-McArdle" | "Mifflin-St Jeor";
  katchMcArdleKcal: number;
  mifflinStJeorKcal: number;
  explicacionSimple: string;
  formulaExpresion: string;
}

export interface TrajectoryPoint {
  semana: number;
  fecha: string;
  pesoPlanKg: number;
  pesoRealKg?: number;
  grasaPlanPct: number;
}

export interface GeneratedGoalPlan {
  objetivo: GoalType;
  etiquetaObjetivo: string;
  pesoActualKg: number;
  pesoMetaKg: number;
  grasaActualPct: number;
  grasaMetaPct: number;
  rangoGrasaSeguroPct: { min: number; max: number };
  lbmActualKg: number;
  lbmMetaKg: number;
  ffmiActual: number;
  ffmiMeta: number;
  cinturaActualCm: number;
  cinturaMetaCm: number;
  ritmoSemanalKg: number;
  ritmoSemanalPct: number;
  rangoRitmoPct: { min: number; max: number };
  kcalObjetivo: number;
  deltaKcal: number;
  proteinaGKg: number;
  proteinaGramosDia: number;
  semanasEstimadas: number;
  fechaInicio: string;
  fechaEstimada: string;
  trayectoria: TrajectoryPoint[];
  avisoSalud: string;
  explicacionMeta: string;
}

export interface FullBodyReport {
  imc: MetricWithExplanation<number>;
  grasaCorporal: MetricWithExplanation<number> & {
    estimacionMarinaPct: number;
    fuente: "Manual (DEXA / Bioimpedancia)" | "Marina de EE. UU.";
  };
  masaMagraKg: number;
  masaGrasaKg: number;
  ffmi: MetricWithExplanation<number> & {
    ffmiNormalizado: number;
  };
  tmb: BmrResult;
  tdee: MetricWithExplanation<number> & {
    factorActividad: number;
  };
  indiceCinturaEstatura: MetricWithExplanation<number> & {
    esSaludable: boolean;
  };
  pesoIdeal: IdealWeightReferences;
  meta: GeneratedGoalPlan;
}

export const ACTIVITY_FACTORS: Record<ActivityLevel, { factor: number; label: string; desc: string }> = {
  sedentario: {
    factor: 1.2,
    label: "Sedentario",
    desc: "Trabajo de escritorio, poco movimiento fuera del gimnasio",
  },
  ligero: {
    factor: 1.375,
    label: "Ligero (1–2 días/sem)",
    desc: "Entrenamiento ligero de 1 a 2 veces por semana",
  },
  moderado: {
    factor: 1.55,
    label: "Moderado (3–5 días/sem)",
    desc: "Entrenamiento de fuerza de 3 a 5 veces por semana",
  },
  alto: {
    factor: 1.725,
    label: "Alto (6–7 días/sem)",
    desc: "Entrenamiento intenso 6 veces por semana o trabajo activo",
  },
  muy_alto: {
    factor: 1.9,
    label: "Atleta / Doble turno",
    desc: "Entrenamiento muy intenso diario + alta actividad física laboral",
  },
};

export const HEALTH_DISCLAIMER =
  "Estimaciones con fórmulas públicas; no sustituyen la evaluación de un profesional de la salud.";

function round(val: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

/**
 * 1. IMC (Índice de Masa Corporal) — peso / estatura_m²
 */
export function calculateBMI(pesoKg: number, estaturaCm: number): MetricWithExplanation<number> {
  const estaturaM = estaturaCm / 100;
  const imc = round(pesoKg / (estaturaM * estaturaM), 1);

  let categoria = "Normal";
  if (imc < 18.5) categoria = "Bajo peso";
  else if (imc < 25.0) categoria = "Normal";
  else if (imc < 30.0) categoria = "Sobrepeso";
  else categoria = "Obesidad";

  return {
    valor: imc,
    unidad: "kg/m²",
    categoria,
    explicacionSimple:
      "Relaciona tu peso total con tu estatura al cuadrado. Es un punto de partida general, pero no diferencia cuánto de tu peso es músculo y cuánto es grasa.",
    formulaNombre: "Fórmula OMS (Quetelet)",
    formulaExpresion: "IMC = peso_kg / (estatura_m)²",
    advertencia:
      "El IMC no distingue músculo de grasa; un atleta musculado puede figurar con 'sobrepeso' teniendo poca grasa. Por eso TRENO lo complementa con % de grasa y FFMI.",
  };
}

/**
 * 2. % de Grasa Corporal — Fórmula de la Marina de EE. UU. (en cm)
 * Hombre: 495 / (1.0324 − 0.19077·log10(cintura − cuello) + 0.15456·log10(estatura)) − 450
 * Mujer:  495 / (1.29579 − 0.35004·log10(cintura + cadera − cuello) + 0.22100·log10(estatura)) − 450
 */
export function calculateUSNavyBodyFat(
  sexo: BiologicalSex,
  estaturaCm: number,
  cinturaCm: number,
  cuelloCm: number,
  caderaCm?: number
): number {
  const safeHeight = Math.max(120, estaturaCm);

  if (sexo === "hombre") {
    const diff = Math.max(12, cinturaCm - cuelloCm);
    const denominator =
      1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(safeHeight);
    const bf = 495 / denominator - 450;
    return round(Math.min(55, Math.max(3.5, bf)), 1);
  } else {
    const hip = caderaCm && caderaCm > 40 ? caderaCm : cinturaCm * 1.18;
    const sumDiff = Math.max(25, cinturaCm + hip - cuelloCm);
    const denominator =
      1.29579 - 0.35004 * Math.log10(sumDiff) + 0.22100 * Math.log10(safeHeight);
    const bf = 495 / denominator - 450;
    return round(Math.min(58, Math.max(8.0, bf)), 1);
  }
}

export function getBodyFatCategory(sexo: BiologicalSex, bfPct: number): string {
  if (sexo === "hombre") {
    if (bfPct < 6) return "Grasa esencial";
    if (bfPct < 14) return "Atlético";
    if (bfPct < 18) return "Fitness";
    if (bfPct < 25) return "Promedio";
    return "Elevado";
  } else {
    if (bfPct < 14) return "Grasa esencial";
    if (bfPct < 21) return "Atlética";
    if (bfPct < 25) return "Fitness";
    if (bfPct < 32) return "Promedio";
    return "Elevado";
  }
}

/**
 * 3. Masa Magra (LBM) y Masa Grasa
 */
export function calculateLeanAndFatMass(pesoKg: number, grasaPct: number): {
  lbmKg: number;
  fatMassKg: number;
} {
  const lbmKg = round(pesoKg * (1 - grasaPct / 100), 1);
  const fatMassKg = round(pesoKg - lbmKg, 1);
  return { lbmKg, fatMassKg };
}

/**
 * 4. FFMI (Índice de Masa Libre de Grasa) y FFMI Normalizado a 1.80 m
 * FFMI = LBM / estatura_m²
 * FFMI_norm = FFMI + 6.1 × (1.8 − estatura_m)
 */
export function calculateFFMI(
  lbmKg: number,
  estaturaCm: number,
  sexo: BiologicalSex
): MetricWithExplanation<number> & { ffmiNormalizado: number } {
  const estaturaM = estaturaCm / 100;
  const ffmi = round(lbmKg / (estaturaM * estaturaM), 1);
  const ffmiNormalizado = round(ffmi + 6.1 * (1.8 - estaturaM), 1);

  const offset = sexo === "mujer" ? 3.5 : 0;
  let categoria = "Promedio";
  if (ffmiNormalizado < 18 - offset) categoria = "En desarrollo muscular";
  else if (ffmiNormalizado < 20 - offset) categoria = "Promedio";
  else if (ffmiNormalizado < 22 - offset) categoria = "Atlético";
  else if (ffmiNormalizado <= 25 - offset) categoria = "Muy musculado";
  else categoria = "Nivel élite";

  return {
    valor: ffmi,
    ffmiNormalizado,
    unidad: "kg/m²",
    categoria,
    explicacionSimple:
      "Mide cuánta masa libre de grasa (músculo, hueso y agua) tienes en relación con tu estatura. Es el verdadero termómetro de tu desarrollo muscular.",
    formulaNombre: "Kouri et al. (FFMI & FFMI Normalizado a 1.80 m)",
    formulaExpresion:
      "FFMI = LBM / (estatura_m)²  |  FFMI_norm = FFMI + 6.1 × (1.8 − estatura_m)",
  };
}

/**
 * 5. Metabolismo Basal (TMB / BMR): Mifflin-St Jeor y Katch-McArdle
 */
export function calculateBMR(
  sexo: BiologicalSex,
  pesoKg: number,
  estaturaCm: number,
  edad: number,
  lbmKg?: number
): BmrResult {
  const baseMifflin = 10 * pesoKg + 6.25 * estaturaCm - 5 * edad;
  const mifflinStJeorKcal = Math.round(sexo === "hombre" ? baseMifflin + 5 : baseMifflin - 161);

  const effectiveLbm = lbmKg ?? pesoKg * 0.8;
  const katchMcArdleKcal = Math.round(370 + 21.6 * effectiveLbm);

  const hasBodyFat = typeof lbmKg === "number" && lbmKg > 0;

  return {
    principalKcal: hasBodyFat ? katchMcArdleKcal : mifflinStJeorKcal,
    metodoPrincipal: hasBodyFat ? "Katch-McArdle" : "Mifflin-St Jeor",
    katchMcArdleKcal,
    mifflinStJeorKcal,
    explicacionSimple:
      "Las calorías que tu cuerpo quema en reposo total durante 24 horas. Como conocemos tu masa magra (LBM), priorizamos Katch-McArdle porque el músculo activo determina tu gasto real.",
    formulaExpresion:
      "Katch-McArdle: 370 + 21.6 × LBM  |  Mifflin-St Jeor: 10·peso + 6.25·estatura − 5·edad + (5 hombre / −161 mujer)",
  };
}

/**
 * 6. Gasto Energético Diario Total (TDEE)
 */
export function calculateTDEE(
  bmrKcal: number,
  nivelActividad: ActivityLevel
): MetricWithExplanation<number> & { factorActividad: number } {
  const { factor, label } = ACTIVITY_FACTORS[nivelActividad];
  const tdee = Math.round(bmrKcal * factor);

  return {
    valor: tdee,
    factorActividad: factor,
    unidad: "kcal/día",
    categoria: label,
    explicacionSimple:
      "Es la energía total que quemas al día sumando tu metabolismo basal y tu actividad física. Si comes por encima subes de peso; por debajo, pierdes grasa.",
    formulaNombre: "TDEE (Total Daily Energy Expenditure)",
    formulaExpresion: `TDEE = TMB (${bmrKcal} kcal) × ${factor} (${label})`,
  };
}

/**
 * 7. Índice Cintura / Estatura (WHtR)
 */
export function calculateWaistToHeight(
  cinturaCm: number,
  estaturaCm: number
): MetricWithExplanation<number> & { esSaludable: boolean } {
  const ratio = round(cinturaCm / estaturaCm, 2);
  const esSaludable = ratio < 0.5;

  let categoria = "Saludable (< 0.50)";
  if (ratio >= 0.6) categoria = "Riesgo cardiometabólico alto";
  else if (ratio >= 0.5) categoria = "Por encima del óptimo (≥ 0.50)";
  else if (ratio < 0.43) categoria = "Definición atlética";

  return {
    valor: ratio,
    esSaludable,
    unidad: "ratio",
    categoria,
    explicacionSimple:
      "Mantener tu cintura en menos de la mitad de tu estatura (< 0.50) es uno de los indicadores más fiables de baja grasa visceral y salud cardiovascular.",
    formulaNombre: "Índice Cintura-Estatura (ICA / WHtR)",
    formulaExpresion: "ICA = cintura_cm / estatura_cm (Óptimo < 0.50)",
  };
}

/**
 * 8. Peso Ideal (Rango OMS IMC 18.5–24.9 + Devine, Robinson y Miller)
 */
export function calculateIdealWeightReferences(
  sexo: BiologicalSex,
  estaturaCm: number
): IdealWeightReferences {
  const estaturaM = estaturaCm / 100;
  const minImc = round(18.5 * estaturaM * estaturaM, 1);
  const maxImc = round(24.9 * estaturaM * estaturaM, 1);

  const inchesOver5Ft = Math.max(0, (estaturaCm - 152.4) / 2.54);

  const devineKg = round(
    (sexo === "hombre" ? 50.0 : 45.5) + 2.3 * inchesOver5Ft,
    1
  );
  const robinsonKg = round(
    (sexo === "hombre" ? 52.0 : 49.0) + (sexo === "hombre" ? 1.9 : 1.7) * inchesOver5Ft,
    1
  );
  const millerKg = round(
    (sexo === "hombre" ? 56.2 : 53.1) + (sexo === "hombre" ? 1.41 : 1.36) * inchesOver5Ft,
    1
  );

  return {
    rangoImcSaludableKg: { min: minImc, max: maxImc },
    devineKg,
    robinsonKg,
    millerKg,
    explicacionSimple:
      "Referencias clásicas de peso para tu estatura en población general. En personas que entrenan fuerza, el peso óptimo real lo dicta tu masa magra (LBM) y tu % de grasa objetivo.",
    formulaExpresion:
      "OMS: 18.5–24.9 × estatura_m² | Devine (1974), Robinson (1983), Miller (1983)",
  };
}

/**
 * 9. Fuerza — 1RM Estimado (Epley y Brzycki)
 * Usa Brzycki para reps <= 10 y Epley por defecto para reps > 10.
 */
export function calculate1RM(pesoKg: number, reps: number): {
  principal1RM: number;
  metodoUsado: "Brzycki" | "Epley" | "Directo (1 rep)";
  epley1RM: number;
  brzycki1RM: number;
  explicacionSimple: string;
  formulaExpresion: string;
} {
  if (reps <= 0 || pesoKg <= 0) {
    return {
      principal1RM: 0,
      metodoUsado: "Epley",
      epley1RM: 0,
      brzycki1RM: 0,
      explicacionSimple: "Ingresa peso y repeticiones mayores a cero.",
      formulaExpresion: "Epley: peso × (1 + reps/30) | Brzycki: peso × 36 / (37 − reps)",
    };
  }

  if (reps === 1) {
    return {
      principal1RM: round(pesoKg, 1),
      metodoUsado: "Directo (1 rep)",
      epley1RM: round(pesoKg, 1),
      brzycki1RM: round(pesoKg, 1),
      explicacionSimple: "Levantamiento máximo directo a 1 repetición.",
      formulaExpresion: "1RM = peso levantado en 1 repetición",
    };
  }

  const epley1RM = round(pesoKg * (1 + reps / 30), 1);
  const safeRepsForBrzycki = Math.min(36, reps);
  const brzycki1RM = round((pesoKg * 36) / (37 - safeRepsForBrzycki), 1);

  const useBrzycki = reps <= 10;

  return {
    principal1RM: useBrzycki ? brzycki1RM : epley1RM,
    metodoUsado: useBrzycki ? "Brzycki" : "Epley",
    epley1RM,
    brzycki1RM,
    explicacionSimple:
      "Estima cuánto peso podrías mover en 1 sola repetición máxima sin exponerte al riesgo de lesión de probar tu límite todos los días.",
    formulaExpresion:
      "Brzycki (≤10 reps): peso × 36 / (37 − reps)  |  Epley (>10 reps): peso × (1 + reps / 30)",
  };
}

/**
 * 10. Fuerza Relativa — Coeficiente DOTS (Estándar oficial de Powerlifting)
 * Permite comparar con justicia a un levantador de 64 kg con uno de 88 kg.
 */
export function calculateDOTS(
  pesoCorporalKg: number,
  cargaLevantadaKg: number,
  sexo: BiologicalSex = "hombre"
): {
  puntosDots: number;
  coeficiente: number;
  explicacionSimple: string;
  formulaExpresion: string;
} {
  const bw = Math.min(210, Math.max(40, pesoCorporalKg));

  // Coeficientes polinomiales oficiales de DOTS
  const coeffs =
    sexo === "hombre"
      ? {
          A: -0.000001093,
          B: 0.0007391293,
          C: -0.1918759221,
          D: 24.0900756,
          E: -307.75076,
        }
      : {
          A: -0.0000010706,
          B: 0.0005158568,
          C: -0.1126655495,
          D: 13.6175032,
          E: -57.96288,
        };

  const denominator =
    coeffs.A * Math.pow(bw, 4) +
    coeffs.B * Math.pow(bw, 3) +
    coeffs.C * Math.pow(bw, 2) +
    coeffs.D * bw +
    coeffs.E;

  const coeficiente = denominator > 0 ? 500 / denominator : 1;
  const puntosDots = round(cargaLevantadaKg * coeficiente, 1);

  return {
    puntosDots,
    coeficiente: round(coeficiente, 4),
    explicacionSimple:
      "El estándar mundial del powerlifting para comparar la fuerza entre personas de distinto peso corporal. Así alguien de 64 kg y alguien de 88 kg compiten en igualdad de condiciones.",
    formulaExpresion: "DOTS = Carga_kg × [ 500 / (A·w⁴ + B·w³ + C·w² + D·w + E) ]",
  };
}

/**
 * 11. Promedio Móvil de 7 Días para filtrar fluctuaciones de agua y glucógeno
 */
export function calculate7DayMovingAverage(
  entries: { fecha: string; pesoKg: number }[]
): {
  fecha: string;
  pesoDiarioKg: number;
  promedioMovil7dKg: number;
}[] {
  const sorted = [...entries].sort((a, b) => a.fecha.localeCompare(b.fecha));
  return sorted.map((item, idx) => {
    const windowSlice = sorted.slice(Math.max(0, idx - 6), idx + 1);
    const avg =
      windowSlice.reduce((acc, cur) => acc + cur.pesoKg, 0) / windowSlice.length;
    return {
      fecha: item.fecha,
      pesoDiarioKg: round(item.pesoKg, 1),
      promedioMovil7dKg: round(avg, 1),
    };
  });
}

/**
 * 12. Generador de Meta Objetivo (3.3)
 * Peso meta = LBM_meta / (1 − %grasa_meta)
 */
export function generateGoalPlan(
  input: BodyProfileInput,
  grasaActualPct: number,
  lbmActualKg: number,
  tdeeKcal: number,
  startDateIso = "2026-11-12"
): GeneratedGoalPlan {
  const estaturaM = input.estaturaCm / 100;
  const esHombre = input.sexo === "hombre";

  let etiquetaObjetivo = "";
  let rangoGrasaSeguroPct = { min: 10, max: 15 };
  let grasaMetaPct = grasaActualPct;
  let lbmMetaKg = lbmActualKg;
  let rangoRitmoPct = { min: 0.25, max: 0.5 };
  let ritmoSemanalPct = 0.375;
  let deltaKcal = 350;
  let proteinaGKg = 2.0;
  let explicacionMeta = "";

  if (input.objetivo === "volumen") {
    etiquetaObjetivo = "Ganar masa muscular (Volumen limpio)";
    rangoGrasaSeguroPct = esHombre ? { min: 10, max: 15 } : { min: 18, max: 24 };
    // Si ya está dentro del rango saludable de volumen, mantiene un % atlético (ej. 14% H / 21% M) y gana masa magra
    grasaMetaPct = esHombre
      ? round(Math.min(15, Math.max(12, grasaActualPct)), 1)
      : round(Math.min(23, Math.max(19, grasaActualPct)), 1);
    const gananciaMuscularEsperadaKg = esHombre ? 4.0 : 2.8;
    lbmMetaKg = round(lbmActualKg + gananciaMuscularEsperadaKg, 1);
    rangoRitmoPct = { min: 0.25, max: 0.5 };
    ritmoSemanalPct = 0.375; // +0.375% del peso por semana (centro del rango saludable)
    deltaKcal = 350; // TDEE + 250 a 500 kcal
    proteinaGKg = 2.0; // 1.6–2.2 g/kg
    explicacionMeta =
      "Superávit calórico controlado (+350 kcal) para construir masa magra minimizando la ganancia de grasa.";
  } else if (input.objetivo === "definicion") {
    etiquetaObjetivo = "Perder grasa (Definición preservando músculo)";
    rangoGrasaSeguroPct = esHombre ? { min: 12, max: 15 } : { min: 20, max: 24 };
    const targetDefault = esHombre ? 14.0 : 22.0;
    grasaMetaPct = round(
      Math.max(rangoGrasaSeguroPct.min, Math.min(targetDefault, grasaActualPct - 3)),
      1
    );
    // En definición bien programada con pesas y alta proteína se preserva el 100% de la LBM
    lbmMetaKg = round(lbmActualKg, 1);
    rangoRitmoPct = { min: -1.0, max: -0.5 };
    ritmoSemanalPct = -0.74; // ~ -0.74% del peso por semana (dentro de -0.5% a -1.0%)
    deltaKcal = -450; // TDEE - 300 a 500 kcal
    proteinaGKg = 2.2; // 2.0–2.4 g/kg
    explicacionMeta =
      "Déficit inteligente (−450 kcal) y proteína elevada (2.2 g/kg) para oxidar grasa protegiendo tu masa muscular.";
  } else if (input.objetivo === "recomposicion") {
    etiquetaObjetivo = "Recomposición corporal (Menos grasa, igual peso)";
    rangoGrasaSeguroPct = esHombre ? { min: 11, max: 16 } : { min: 19, max: 24 };
    grasaMetaPct = round(Math.max(rangoGrasaSeguroPct.min, grasaActualPct - 3.0), 1);
    // Peso se mantiene igual, por lo que la LBM sube exactamente lo que baja la grasa
    lbmMetaKg = round(input.pesoKg * (1 - grasaMetaPct / 100), 1);
    rangoRitmoPct = { min: -0.1, max: 0.1 };
    ritmoSemanalPct = 0;
    deltaKcal = 0; // ≈ TDEE
    proteinaGKg = 2.0; // 1.8–2.2 g/kg
    explicacionMeta =
      "Calorías de mantenimiento con sobrecarga progresiva para reemplazar de 2 a 4 puntos de grasa por músculo.";
  } else {
    // Fuerza
    etiquetaObjetivo = "Fuerza máxima (Bloque de rendimiento)";
    rangoGrasaSeguroPct = esHombre ? { min: 12, max: 18 } : { min: 20, max: 26 };
    grasaMetaPct = round(grasaActualPct, 1);
    lbmMetaKg = round(lbmActualKg + (esHombre ? 1.8 : 1.2), 1);
    rangoRitmoPct = { min: 0.1, max: 0.25 };
    ritmoSemanalPct = 0.18;
    deltaKcal = 200; // TDEE + 0–250 kcal
    proteinaGKg = 1.8; // 1.6–2.0 g/kg
    explicacionMeta =
      "Ligero soporte energético (+200 kcal) enfocado en maximizar tu 1RM y coeficiente DOTS en los levantamientos básicos.";
  }

  // Fórmula exacta de la especificación: Peso meta = LBM_meta / (1 − %grasa_meta)
  const pesoMetaKg =
    input.objetivo === "recomposicion"
      ? round(input.pesoKg, 1)
      : round(lbmMetaKg / (1 - grasaMetaPct / 100), 1);

  const ritmoSemanalKg =
    input.objetivo === "recomposicion"
      ? 0
      : round((input.pesoKg * ritmoSemanalPct) / 100, 2);

  const diffPesoKg = Math.abs(pesoMetaKg - input.pesoKg);
  const semanasEstimadas =
    Math.abs(ritmoSemanalKg) > 0.05
      ? Math.max(6, Math.min(36, Math.round(diffPesoKg / Math.abs(ritmoSemanalKg))))
      : 12;

  const ffmiActual = round(lbmActualKg / (estaturaM * estaturaM), 1);
  const ffmiMeta = round(lbmMetaKg / (estaturaM * estaturaM), 1);

  // Cintura objetivo: garantiza que cintura / estatura < 0.50 (o mejora proporcional)
  const maxHealthyWaist = round(input.estaturaCm * 0.47, 1);
  const cinturaMetaCm =
    input.objetivo === "definicion" || input.cinturaCm >= input.estaturaCm * 0.5
      ? Math.min(maxHealthyWaist, round(input.cinturaCm - diffPesoKg * 0.85, 1))
      : input.objetivo === "volumen"
      ? round(Math.min(input.estaturaCm * 0.485, input.cinturaCm + 1.5), 1)
      : round(Math.min(maxHealthyWaist, input.cinturaCm - 2.0), 1);

  const kcalObjetivo = Math.round(tdeeKcal + deltaKcal);
  const proteinaGramosDia = Math.round(input.pesoKg * proteinaGKg);

  const baseDate = new Date(`${startDateIso}T12:00:00Z`);
  const endDate = new Date(baseDate.getTime() + semanasEstimadas * 7 * 24 * 60 * 60 * 1000);
  const fechaEstimada = endDate.toISOString().slice(0, 10);

  // Generar puntos de la línea de trayectoria semana a semana
  const trayectoria: TrajectoryPoint[] = [];
  for (let s = 0; s <= semanasEstimadas; s++) {
    const progress = s / semanasEstimadas;
    const pointDate = new Date(baseDate.getTime() + s * 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    trayectoria.push({
      semana: s,
      fecha: pointDate,
      pesoPlanKg: round(input.pesoKg + (pesoMetaKg - input.pesoKg) * progress, 1),
      grasaPlanPct: round(
        grasaActualPct + (grasaMetaPct - grasaActualPct) * progress,
        1
      ),
    });
  }

  return {
    objetivo: input.objetivo,
    etiquetaObjetivo,
    pesoActualKg: round(input.pesoKg, 1),
    pesoMetaKg,
    grasaActualPct,
    grasaMetaPct,
    rangoGrasaSeguroPct,
    lbmActualKg,
    lbmMetaKg,
    ffmiActual,
    ffmiMeta,
    cinturaActualCm: input.cinturaCm,
    cinturaMetaCm,
    ritmoSemanalKg,
    ritmoSemanalPct,
    rangoRitmoPct,
    kcalObjetivo,
    deltaKcal,
    proteinaGKg,
    proteinaGramosDia,
    semanasEstimadas,
    fechaInicio: startDateIso,
    fechaEstimada,
    trayectoria,
    avisoSalud: HEALTH_DISCLAIMER,
    explicacionMeta,
  };
}

/**
 * 13. Reporte Corporal Integral (Combina todas las métricas y genera la meta)
 */
export function calculateFullBodyReport(
  input: BodyProfileInput,
  startDateIso = "2026-11-12"
): FullBodyReport {
  const imc = calculateBMI(input.pesoKg, input.estaturaCm);

  const estimacionMarinaPct = calculateUSNavyBodyFat(
    input.sexo,
    input.estaturaCm,
    input.cinturaCm,
    input.cuelloCm,
    input.caderaCm
  );

  const usaManual =
    typeof input.grasaPctManual === "number" &&
    !Number.isNaN(input.grasaPctManual) &&
    input.grasaPctManual >= 3 &&
    input.grasaPctManual <= 60;

  const grasaPctFinal = usaManual ? round(input.grasaPctManual!, 1) : estimacionMarinaPct;

  const grasaCorporal: FullBodyReport["grasaCorporal"] = {
    valor: grasaPctFinal,
    estimacionMarinaPct,
    fuente: usaManual ? "Manual (DEXA / Bioimpedancia)" : "Marina de EE. UU.",
    unidad: "%",
    categoria: getBodyFatCategory(input.sexo, grasaPctFinal),
    explicacionSimple: usaManual
      ? "Se prioriza tu medición directa (DEXA/Bioimpedancia) sobre la estimación con cinta métrica."
      : "Estima tu proporción de tejido adiposo comparando el perímetro de tu cintura y cuello frente a tu estatura.",
    formulaNombre: "Fórmula de la Marina de EE. UU. (Hodgdon & Beckett)",
    formulaExpresion:
      input.sexo === "hombre"
        ? "495 / (1.0324 − 0.19077·log10(cintura − cuello) + 0.15456·log10(estatura)) − 450"
        : "495 / (1.29579 − 0.35004·log10(cintura + cadera − cuello) + 0.22100·log10(estatura)) − 450",
  };

  const { lbmKg, fatMassKg } = calculateLeanAndFatMass(input.pesoKg, grasaPctFinal);
  const ffmi = calculateFFMI(lbmKg, input.estaturaCm, input.sexo);
  const tmb = calculateBMR(input.sexo, input.pesoKg, input.estaturaCm, input.edad, lbmKg);
  const tdee = calculateTDEE(tmb.principalKcal, input.nivelActividad);
  const indiceCinturaEstatura = calculateWaistToHeight(input.cinturaCm, input.estaturaCm);
  const pesoIdeal = calculateIdealWeightReferences(input.sexo, input.estaturaCm);
  const meta = generateGoalPlan(input, grasaPctFinal, lbmKg, tdee.valor, startDateIso);

  return {
    imc,
    grasaCorporal,
    masaMagraKg: lbmKg,
    masaGrasaKg: fatMassKg,
    ffmi,
    tmb,
    tdee,
    indiceCinturaEstatura,
    pesoIdeal,
    meta,
  };
}
