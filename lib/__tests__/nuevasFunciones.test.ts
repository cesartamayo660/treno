import { describe, expect, it } from "vitest";
import { calcularDiscos, discosPlanos } from "../plates";
import { incrementoPara, rangoDeReps, sugerirSiguiente } from "../overload";
import { diasEntre, estadoMuscular, grupoMasDescuidado, Grupo, nivelPara } from "../muscles";
import { proyectarMeta, sumarDias } from "../projection";
import { evaluarInsignias, nuevasInsignias, EstadisticasInsignias } from "../badges";
import { calcularXp, estadoCriatura } from "../creature";

describe("calcularDiscos", () => {
  it("100 kg con barra de 20 → 40 kg por lado: 25 + 15", () => {
    const r = calcularDiscos(100);
    expect(r.exacto).toBe(true);
    expect(r.totalKg).toBe(100);
    expect(r.porLado).toEqual([
      { kg: 25, cantidad: 1 },
      { kg: 15, cantidad: 1 },
    ]);
  });

  it("82.5 kg → 31.25 por lado: 25 + 5 + 1.25", () => {
    const r = calcularDiscos(82.5);
    expect(r.exacto).toBe(true);
    expect(discosPlanos(r)).toEqual([25, 5, 1.25]);
  });

  it("solo la barra", () => {
    const r = calcularDiscos(20);
    expect(r.porLado).toEqual([]);
    expect(r.exacto).toBe(true);
    expect(r.menorQueBarra).toBe(false);
  });

  it("menos que la barra", () => {
    const r = calcularDiscos(15);
    expect(r.menorQueBarra).toBe(true);
    expect(r.totalKg).toBe(20);
  });

  it("peso imposible: carga lo más cercano por debajo", () => {
    const r = calcularDiscos(101); // sobra 0.5 kg por lado: no hay disco
    expect(r.exacto).toBe(false);
    expect(r.totalKg).toBe(100);
    expect(r.diferenciaKg).toBe(1);
  });

  it("barra de 15 y entradas raras no rompen", () => {
    expect(calcularDiscos(60, 15).totalKg).toBe(60);
    expect(calcularDiscos(NaN).totalKg).toBe(20);
    expect(calcularDiscos(-5).menorQueBarra).toBe(true);
  });
});

describe("sugerirSiguiente (sobrecarga progresiva)", () => {
  const h = (pesoKg: number, reps: number) => [{ fecha: "2026-01-01", pesoKg, reps, oneRm: pesoKg }];

  it("sin historial no inventa nada", () => {
    expect(sugerirSiguiente([], "Barra")).toBeNull();
  });

  it("sube una repetición dentro del rango", () => {
    const s = sugerirSiguiente(h(60, 8), "Barra")!;
    expect(s).toMatchObject({ pesoKg: 60, reps: 9, tipo: "subir-reps" });
  });

  it("al tope del rango sube el peso y vuelve a la parte baja", () => {
    const s = sugerirSiguiente(h(60, 12), "Barra")!;
    expect(s).toMatchObject({ pesoKg: 62.5, reps: 8, tipo: "subir-peso" });
  });

  it("rango de fuerza: 6 reps → sube peso", () => {
    const s = sugerirSiguiente(h(100, 6), "Barra")!;
    expect(s).toMatchObject({ pesoKg: 102.5, reps: 4, tipo: "subir-peso" });
  });

  it("7 reps se considera zona media y pide 8", () => {
    expect(sugerirSiguiente(h(50, 7), "Mancuernas")).toMatchObject({ pesoKg: 50, reps: 8 });
  });

  it("incrementos por equipo", () => {
    expect(incrementoPara("Mancuernas", 8)).toBe(1);
    expect(incrementoPara("Mancuernas", 20)).toBe(2);
    expect(incrementoPara("Máquina", 120)).toBe(5);
    expect(incrementoPara("Barra", 60)).toBe(2.5);
    expect(rangoDeReps(15)).toEqual([12, 15]);
  });
});

describe("mapa muscular", () => {
  const grupoDe = (id: string): Grupo | undefined =>
    ({ "ex-bench": "Pecho", "ex-squat": "Piernas", "ex-curl": "Brazos" } as Record<string, Grupo>)[id];

  it("días entre fechas", () => {
    expect(diasEntre("2026-03-01", "2026-03-04")).toBe(3);
    expect(diasEntre("2026-02-28", "2026-03-01")).toBe(1);
  });

  it("niveles por recencia", () => {
    expect(nivelPara(null)).toBe(0);
    expect(nivelPara(0)).toBe(3);
    expect(nivelPara(2)).toBe(2);
    expect(nivelPara(6)).toBe(1);
    expect(nivelPara(9)).toBe(0);
  });

  it("calcula sesiones y días desde la última vez", () => {
    const e = estadoMuscular(
      {
        "ex-bench": [{ fecha: "2026-03-01" }, { fecha: "2026-03-08" }],
        "ex-squat": [{ fecha: "2026-02-20" }],
      },
      grupoDe,
      "2026-03-10"
    );
    const pecho = e.find((x) => x.grupo === "Pecho")!;
    expect(pecho.diasDesde).toBe(2);
    expect(pecho.sesiones7d).toBe(1);
    expect(pecho.nivel).toBe(2);
    expect(e.find((x) => x.grupo === "Piernas")!.nivel).toBe(0);
    expect(e.find((x) => x.grupo === "Core")!.diasDesde).toBeNull();
  });

  it("sin historial no da avisos; con historial señala el más abandonado", () => {
    expect(grupoMasDescuidado(estadoMuscular({}, grupoDe, "2026-03-10"))).toBeNull();
    const r = grupoMasDescuidado(
      estadoMuscular({ "ex-bench": [{ fecha: "2026-03-09" }], "ex-squat": [{ fecha: "2026-02-20" }] }, grupoDe, "2026-03-10")
    )!;
    expect(r.grupo).toBe("Piernas");
    expect(r.mensaje).toContain("18 días");
  });
});

describe("proyectarMeta", () => {
  const hoy = "2026-03-15";
  const serie = (pesos: number[], paso = 2) =>
    pesos.map((p, i) => ({ fecha: sumarDias("2026-03-01", i * paso), pesoKg: p }));

  it("pide más datos con menos de 3 pesajes o menos de una semana", () => {
    expect(proyectarMeta([], 70, 80, hoy).estado).toBe("sin-datos");
    expect(proyectarMeta(serie([80, 79.8]), 70, 80, hoy).estado).toBe("sin-datos");
    // 3 pesajes pero en 2 días
    const corto = [
      { fecha: "2026-03-13", pesoKg: 80 },
      { fecha: "2026-03-14", pesoKg: 79.9 },
      { fecha: "2026-03-15", pesoKg: 79.8 },
    ];
    expect(proyectarMeta(corto, 70, 80, hoy).estado).toBe("sin-datos");
  });

  it("bajando de peso: da un rango coherente y ordenado", () => {
    // -0.4 kg cada 2 días ≈ -1.4 kg/sem
    const p = proyectarMeta(serie([80, 79.6, 79.3, 78.9, 78.5, 78.1, 77.8, 77.4]), 72, 80, hoy);
    expect(p.estado).toBe("ok");
    expect(p.ritmoKgSem).toBeLessThan(-1);
    expect(p.fechaMin! <= p.fechaCentral!).toBe(true);
    expect(p.fechaCentral! <= p.fechaMax!).toBe(true);
    expect(p.fechaMin! > hoy).toBe(true);
    expect(p.rango).toBeTruthy();
    expect(p.advertencia).toBeDefined(); // 1.4 kg/sem sobre 77 kg ≈ 1.8 %
  });

  it("ritmo sano (≈0.5 kg/sem): sin advertencia", () => {
    const p = proyectarMeta(serie([80, 79.9, 79.8, 79.65, 79.55, 79.45, 79.3, 79.2]), 75, 80, hoy);
    expect(p.estado).toBe("ok");
    expect(p.advertencia).toBeUndefined();
    expect(p.confianza).toBe("alta");
  });

  it("avisa si el ritmo es demasiado rápido", () => {
    const p = proyectarMeta(serie([90, 89, 88, 87, 86, 85, 84, 83]), 75, 90, hoy);
    expect(p.estado).toBe("ok");
    expect(p.advertencia).toBeDefined();
  });

  it("subiendo de peso hacia una meta mayor", () => {
    const p = proyectarMeta(serie([60, 60.2, 60.5, 60.7, 61, 61.2, 61.5, 61.7]), 66, 60, hoy);
    expect(p.estado).toBe("ok");
    expect(p.ritmoKgSem).toBeGreaterThan(0);
  });

  it("sentido contrario", () => {
    const p = proyectarMeta(serie([80, 80.5, 81, 81.5, 82, 82.5, 83, 83.5]), 72, 80, hoy);
    expect(p.estado).toBe("contrario");
    expect(p.rango).toBeUndefined();
  });

  it("estancado", () => {
    const p = proyectarMeta(serie([80, 80, 80.1, 80, 79.9, 80, 80.1, 80]), 72, 80, hoy);
    expect(p.estado).toBe("estancado");
  });

  it("meta de mantenimiento", () => {
    const p = proyectarMeta(serie([80, 80.1, 79.9, 80, 80.1, 80, 79.9, 80]), 80, 80, hoy);
    expect(p.estado).toBe("mantener");
  });

  it("meta lograda", () => {
    const p = proyectarMeta(serie([73, 72.8, 72.6, 72.4, 72.2, 72, 71.9, 71.8]), 72, 80, hoy);
    expect(p.estado).toBe("lograda");
  });

  it("ritmo minúsculo no da fechas absurdas", () => {
    const p = proyectarMeta(serie([80, 79.98, 79.96, 79.94, 79.9, 79.88, 79.86, 79.84]), 60, 80, hoy);
    expect(p.estado).toBe("estancado");
  });

  it("pesajes viejos (más de 28 días) se ignoran", () => {
    const viejos = [
      { fecha: "2025-12-01", pesoKg: 90 },
      { fecha: "2025-12-05", pesoKg: 89 },
      { fecha: "2025-12-09", pesoKg: 88 },
    ];
    expect(proyectarMeta(viejos, 70, 90, hoy).estado).toBe("sin-datos");
  });
});

describe("insignias", () => {
  const cero: EstadisticasInsignias = {
    entrenamientos: 0,
    tonelajeKg: 0,
    diasGym: 0,
    prs: 0,
    racha: 0,
    semanasPerfectas: 0,
    mejor1Rm: {},
    ejerciciosDistintos: 0,
    gruposTrabajados: 0,
    pesajes: 0,
  };

  it("usuario nuevo: nada logrado", () => {
    expect(evaluarInsignias(cero).some((e) => e.logrado)).toBe(false);
  });

  it("progreso parcial y logros", () => {
    const e = evaluarInsignias({ ...cero, entrenamientos: 12, racha: 7, mejor1Rm: { "ex-bench": 104 } });
    const por = (id: string) => e.find((x) => x.def.id === id)!;
    expect(por("primer-entreno").logrado).toBe(true);
    expect(por("entrenos-10").logrado).toBe(true);
    expect(por("entrenos-25").logrado).toBe(false);
    expect(por("entrenos-25").avance).toBeCloseTo(12 / 25);
    expect(por("racha-7").logrado).toBe(true);
    expect(por("banca-100").logrado).toBe(true);
    expect(por("tres-grandes").actual).toBe(1);
  });

  it("detecta solo las nuevas", () => {
    const e = evaluarInsignias({ ...cero, entrenamientos: 1, diasGym: 1 });
    const nuevas = nuevasInsignias(e, { "primer-entreno": "2026-03-01" });
    expect(nuevas).toEqual(["primer-checkin"]);
  });

  it("los ids son únicos", () => {
    const ids = evaluarInsignias(cero).map((e) => e.def.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("criatura", () => {
  it("empieza como Cachorro con 0 XP", () => {
    const c = estadoCriatura(0);
    expect(c.etapa.nombre).toBe("Cachorro");
    expect(c.siguiente?.nombre).toBe("Atleta");
    expect(c.avance).toBe(0);
  });

  it("evoluciona por umbrales y el último nivel queda completo", () => {
    expect(estadoCriatura(120).etapa.nombre).toBe("Atleta");
    expect(estadoCriatura(799).etapa.nombre).toBe("Bestia");
    const max = estadoCriatura(5000);
    expect(max.etapa.nombre).toBe("Leyenda");
    expect(max.siguiente).toBeNull();
    expect(max.avance).toBe(1);
  });

  it("calcula XP sin valores negativos", () => {
    const xp = calcularXp({ entrenamientos: 10, diasGym: 10, prs: 2, tonelajeKg: 5000, rachaDias: 3, semanasPerfectas: 0 });
    expect(xp).toBe(120 + 60 + 60 + 10 + 0 + 6);
    expect(calcularXp({ entrenamientos: 0, diasGym: 0, prs: 0, tonelajeKg: 0, rachaDias: 0, semanasPerfectas: 0 })).toBe(0);
  });
});
