import { describe, expect, it } from "vitest";
import {
  calculateTrenoScore,
  detectOutlierJump,
  scoreBodyGoalPillar,
} from "../trenoScore";

describe("Motor de Puntaje Justo — lib/trenoScore.ts", () => {
  it("otorga puntajes idénticos y comparables al Usuario A (64 kg, Volumen) y Usuario B (88 kg, Definición) cuando ambos cumplen su plan al 100%", () => {
    // Usuario A: 1.75m, 64 kg, Volumen (+0.24 kg/sem planeado, logra +0.24 kg), cumple 4/4 días, mejora +1.3% en DOTS
    const scoreUsuarioA = calculateTrenoScore({
      asistencia: {
        diasPactados: 4,
        diasCumplidosPactados: 4,
        diasExtra: 0,
        semanasRachaPerfecta: 3, // x1.1
      },
      fuerza: {
        sexo: "hombre",
        pesoCorporalAnteriorKg: 64.0,
        pesoCorporalActualKg: 64.24,
        levantamientosPrincipales: [
          { ejercicio: "Press Banca", oneRmAnteriorKg: 80, oneRmActualKg: 81.5 },
          { ejercicio: "Sentadilla", oneRmAnteriorKg: 110, oneRmActualKg: 112.0 },
        ],
      },
      meta: {
        objetivo: "volumen",
        pesoAnteriorKg: 64.0,
        pesoActualKg: 64.24,
        ritmoSemanalPlaneadoKg: 0.24,
      },
      volumen: {
        tonelajeSemanaActualKg: 14500,
        promedioTonelajeUltimas4SemanasKg: 14000,
      },
      registro: {
        pesajesEnLaSemana: 4,
        registroMedidasSemanales: true,
        entrenamientosRegistrados: 4,
        entrenamientosRealizados: 4,
      },
    });

    // Usuario B: 1.75m, 88 kg, Definición (-0.65 kg/sem planeado, logra -0.65 kg), cumple 4/4 días, mejora +1.3% en DOTS
    const scoreUsuarioB = calculateTrenoScore({
      asistencia: {
        diasPactados: 4,
        diasCumplidosPactados: 4,
        diasExtra: 0,
        semanasRachaPerfecta: 3, // x1.1
      },
      fuerza: {
        sexo: "hombre",
        pesoCorporalAnteriorKg: 88.0,
        pesoCorporalActualKg: 87.35,
        levantamientosPrincipales: [
          { ejercicio: "Press Banca", oneRmAnteriorKg: 100, oneRmActualKg: 101.2 },
          { ejercicio: "Sentadilla", oneRmAnteriorKg: 140, oneRmActualKg: 141.8 },
        ],
      },
      meta: {
        objetivo: "definicion",
        pesoAnteriorKg: 88.0,
        pesoActualKg: 87.35,
        ritmoSemanalPlaneadoKg: -0.65,
        cinturaAnteriorCm: 92.0,
        cinturaActualCm: 91.3,
      },
      volumen: {
        tonelajeSemanaActualKg: 18500,
        promedioTonelajeUltimas4SemanasKg: 17800,
      },
      registro: {
        pesajesEnLaSemana: 4,
        registroMedidasSemanales: true,
        entrenamientosRegistrados: 4,
        entrenamientosRealizados: 4,
      },
    });

    // Ambos cumplen su plan al 100% y obtienen el mismo puntaje en cada pilar y en el total
    expect(scoreUsuarioA.pilares.meta.puntos).toBe(250);
    expect(scoreUsuarioB.pilares.meta.puntos).toBe(250);
    expect(scoreUsuarioA.total).toBe(scoreUsuarioB.total);
    expect(scoreUsuarioA.total).toBeGreaterThanOrEqual(950);
  });

  it("aplana los puntos y emite alerta cuando alguien sube demasiado rápido en volumen o baja demasiado rápido en definición", () => {
    // Subida excesiva en volumen (+0.9 kg en una semana para alguien de 64 kg = +1.4% corporal)
    const dirtyBulk = scoreBodyGoalPillar({
      objetivo: "volumen",
      pesoAnteriorKg: 64.0,
      pesoActualKg: 64.9,
      ritmoSemanalPlaneadoKg: 0.24,
    });
    expect(dirtyBulk.puntosAplanadosPorExceso).toBe(true);
    expect(dirtyBulk.puntos).toBeLessThan(250);
    expect(dirtyBulk.alertaSalud).toBeTruthy();

    // Pérdida excesiva en definición (-1.4 kg en una semana para alguien de 85 kg = -1.65% corporal)
    const crashDiet = scoreBodyGoalPillar({
      objetivo: "definicion",
      pesoAnteriorKg: 85.0,
      pesoActualKg: 83.6,
      ritmoSemanalPlaneadoKg: -0.6,
    });
    expect(crashDiet.puntosAplanadosPorExceso).toBe(true);
    expect(crashDiet.puntos).toBeLessThan(250);
    expect(crashDiet.alertaSalud).toContain("Alerta de salud");
  });

  it("detecta saltos irreales de carga o peso corporal en el módulo antitrampas", () => {
    const saltoIrreal = detectOutlierJump({
      tipo: "carga_1rm",
      valorAnterior: 100,
      valorNuevo: 130, // +30% de golpe
    });
    expect(saltoIrreal.esOutlier).toBe(true);
    expect(saltoIrreal.motivo).toContain("validación de un compañero");
  });
});
