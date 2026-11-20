import { describe, expect, it } from "vitest";
import {
  calculate1RM,
  calculate7DayMovingAverage,
  calculateBMI,
  calculateBMR,
  calculateDOTS,
  calculateFFMI,
  calculateFullBodyReport,
  calculateIdealWeightReferences,
  calculateUSNavyBodyFat,
  calculateWaistToHeight,
  HEALTH_DISCLAIMER,
} from "../bodyMetrics";

describe("Motor de Cálculo Corporal — lib/bodyMetrics.ts", () => {
  it("calcula el IMC y categoriza según la OMS con advertencia muscular", () => {
    const bmiA = calculateBMI(64, 175); // 64 / 1.75^2 = 20.9
    expect(bmiA.valor).toBeCloseTo(20.9, 1);
    expect(bmiA.categoria).toBe("Normal");
    expect(bmiA.advertencia).toContain("músculo");

    const bmiB = calculateBMI(88, 175); // 88 / 1.75^2 = 28.7
    expect(bmiB.valor).toBeCloseTo(28.7, 1);
    expect(bmiB.categoria).toBe("Sobrepeso");
  });

  it("calcula el % de grasa con la fórmula de la Marina de EE. UU. para hombres y mujeres", () => {
    // Usuario A: Hombre, 175 cm, cintura 78 cm, cuello 37 cm -> ~12.0%
    const bfHombre = calculateUSNavyBodyFat("hombre", 175, 78, 37);
    expect(bfHombre).toBeCloseTo(12.0, 1);
    expect(bfHombre).toBeGreaterThan(10);
    expect(bfHombre).toBeLessThan(16);

    // Mujer: 165 cm, cintura 72 cm, cuello 33 cm, cadera 96 cm
    const bfMujer = calculateUSNavyBodyFat("mujer", 165, 72, 33, 96);
    expect(bfMujer).toBeGreaterThan(20);
    expect(bfMujer).toBeLessThan(28);
  });

  it("da prioridad al % de grasa manual (DEXA/Bioimpedancia) cuando existe", () => {
    const report = calculateFullBodyReport({
      sexo: "hombre",
      edad: 26,
      estaturaCm: 175,
      pesoKg: 64,
      nivelActividad: "moderado",
      objetivo: "volumen",
      cuelloCm: 38,
      cinturaCm: 76,
      grasaPctManual: 11.5,
    });

    expect(report.grasaCorporal.valor).toBe(11.5);
    expect(report.grasaCorporal.fuente).toBe("Manual (DEXA / Bioimpedancia)");
  });

  it("calcula FFMI y FFMI normalizado a 1.80 m", () => {
    const res = calculateFFMI(60, 175, "hombre");
    // 60 / 1.75^2 = 19.6
    expect(res.valor).toBeCloseTo(19.6, 1);
    // Normalizado: 19.6 + 6.1 * (1.8 - 1.75) = 19.9
    expect(res.ffmiNormalizado).toBeCloseTo(19.9, 1);
  });

  it("calcula TMB con Mifflin-St Jeor y Katch-McArdle priorizando Katch-McArdle con LBM", () => {
    const bmr = calculateBMR("hombre", 75, 175, 25, 63);
    // Katch-McArdle: 370 + 21.6 * 63 = 1730.8 -> 1731
    expect(bmr.katchMcArdleKcal).toBe(1731);
    // Mifflin: 10*75 + 6.25*175 - 5*25 + 5 = 750 + 1093.75 - 125 + 5 = 1724
    expect(bmr.mifflinStJeorKcal).toBe(1724);
    expect(bmr.metodoPrincipal).toBe("Katch-McArdle");
    expect(bmr.principalKcal).toBe(1731);
  });

  it("calcula 1RM con Brzycki para <=10 reps y Epley para >10 reps", () => {
    const lowReps = calculate1RM(100, 5);
    expect(lowReps.metodoUsado).toBe("Brzycki");
    // 100 * 36 / (37 - 5) = 112.5
    expect(lowReps.principal1RM).toBe(112.5);

    const highReps = calculate1RM(100, 12);
    expect(highReps.metodoUsado).toBe("Epley");
    // 100 * (1 + 12/30) = 140
    expect(highReps.principal1RM).toBe(140);
  });

  it("compara justamente la fuerza relativa con el coeficiente DOTS entre 64 kg y 88 kg", () => {
    // Usuario A (64 kg) levanta 100 kg en banca vs Usuario B (88 kg) levanta 120 kg en banca
    const dotsA = calculateDOTS(64, 100, "hombre");
    const dotsB = calculateDOTS(88, 120, "hombre");

    // A pesar de que 100 kg < 120 kg en absoluto, el coeficiente DOTS de 64 kg es mayor que el de 88 kg
    expect(dotsA.coeficiente).toBeGreaterThan(dotsB.coeficiente);
    expect(dotsA.puntosDots).toBeGreaterThan(75);
    expect(dotsB.puntosDots).toBeGreaterThan(75);
  });

  it("genera metas opuestas y coherentes para el Caso Semilla (Usuario A: 64 kg Volumen vs Usuario B: 88 kg Definición)", () => {
    const reportA = calculateFullBodyReport({
      sexo: "hombre",
      edad: 25,
      estaturaCm: 175,
      pesoKg: 64,
      nivelActividad: "moderado",
      objetivo: "volumen",
      cuelloCm: 37.5,
      cinturaCm: 75.5,
    });

    const reportB = calculateFullBodyReport({
      sexo: "hombre",
      edad: 26,
      estaturaCm: 175,
      pesoKg: 88,
      nivelActividad: "moderado",
      objetivo: "definicion",
      cuelloCm: 40,
      cinturaCm: 94,
    });

    // Ambos miden 1.75 m pero Usuario A debe SUBIR de peso y Usuario B debe BAJAR de peso
    expect(reportA.meta.pesoMetaKg).toBeGreaterThan(64);
    expect(reportA.meta.ritmoSemanalKg).toBeGreaterThan(0);
    expect(reportA.meta.deltaKcal).toBeGreaterThan(0);

    expect(reportB.meta.pesoMetaKg).toBeLessThan(88);
    expect(reportB.meta.ritmoSemanalKg).toBeLessThan(0);
    expect(reportB.meta.deltaKcal).toBeLessThan(0);
    expect(reportB.meta.cinturaMetaCm).toBeLessThan(175 * 0.5);

    expect(reportA.meta.avisoSalud).toBe(HEALTH_DISCLAIMER);
  });

  it("calcula cintura/estatura, referencias de peso ideal y media móvil de 7 días", () => {
    const whtr = calculateWaistToHeight(80, 175);
    expect(whtr.valor).toBeCloseTo(0.46, 2);
    expect(whtr.esSaludable).toBe(true);

    const ideal = calculateIdealWeightReferences("hombre", 175);
    expect(ideal.rangoImcSaludableKg.min).toBeCloseTo(56.7, 1);
    expect(ideal.rangoImcSaludableKg.max).toBeCloseTo(76.3, 1);

    const avg = calculate7DayMovingAverage([
      { fecha: "2026-11-01", pesoKg: 80.0 },
      { fecha: "2026-11-02", pesoKg: 81.2 },
      { fecha: "2026-11-03", pesoKg: 79.8 },
    ]);
    expect(avg[2].promedioMovil7dKg).toBeCloseTo(80.3, 1);
  });
});
