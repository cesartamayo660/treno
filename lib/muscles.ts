/**
 * Mapa muscular: a partir del historial real, cuánto hace que trabajaste cada grupo.
 */

export type Grupo = "Pecho" | "Espalda" | "Hombros" | "Brazos" | "Core" | "Piernas" | "Glúteos";

export const GRUPOS: Grupo[] = ["Pecho", "Espalda", "Hombros", "Brazos", "Core", "Piernas", "Glúteos"];

/** 3 = recién trabajado (≤1 día) · 2 = ≤3 días · 1 = ≤7 días · 0 = sin trabajo reciente. */
export type Nivel = 0 | 1 | 2 | 3;

export interface EstadoMuscular {
  grupo: Grupo;
  /** Días distintos con entrenamiento de este grupo en los últimos 7 días. */
  sesiones7d: number;
  /** null si nunca lo trabajaste. */
  diasDesde: number | null;
  ultimaFecha: string | null;
  nivel: Nivel;
}

const MS_DIA = 86_400_000;
const toUtc = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
};

/** Días entre dos fechas ISO (b - a). */
export function diasEntre(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / MS_DIA);
}

export function nivelPara(diasDesde: number | null): Nivel {
  if (diasDesde === null) return 0;
  if (diasDesde <= 1) return 3;
  if (diasDesde <= 3) return 2;
  if (diasDesde <= 7) return 1;
  return 0;
}

export function estadoMuscular(
  historial: Record<string, { fecha: string }[]>,
  grupoDe: (ejercicioId: string) => Grupo | undefined,
  hoy: string
): EstadoMuscular[] {
  const fechasPorGrupo = new Map<Grupo, Set<string>>();
  for (const [id, entradas] of Object.entries(historial)) {
    const g = grupoDe(id);
    if (!g) continue;
    const set = fechasPorGrupo.get(g) ?? new Set<string>();
    for (const e of entradas) set.add(e.fecha.slice(0, 10));
    fechasPorGrupo.set(g, set);
  }

  return GRUPOS.map((grupo) => {
    const fechas = Array.from(fechasPorGrupo.get(grupo) ?? []).filter((f) => f <= hoy).sort();
    const ultima = fechas.length ? fechas[fechas.length - 1] : null;
    const diasDesde = ultima ? diasEntre(ultima, hoy) : null;
    const sesiones7d = fechas.filter((f) => diasEntre(f, hoy) <= 6).length;
    return { grupo, sesiones7d, diasDesde, ultimaFecha: ultima, nivel: nivelPara(diasDesde) };
  });
}

export function textoDias(d: number | null): string {
  if (d === null) return "Aún no lo trabajas";
  if (d === 0) return "Hoy";
  if (d === 1) return "Ayer";
  return `Hace ${d} días`;
}

/** Aviso accionable: el grupo más descuidado (o ninguno si todo va bien). */
export function grupoMasDescuidado(estados: EstadoMuscular[]): { grupo: Grupo; mensaje: string } | null {
  const hayHistorial = estados.some((e) => e.diasDesde !== null);
  if (!hayHistorial) return null;
  // Primero los que ya trabajabas y abandonaste (más días = más urgente); luego los que nunca has tocado
  const candidatos = estados
    .filter((e) => e.nivel === 0)
    .sort((a, b) => {
      if (a.diasDesde === null && b.diasDesde === null) return 0;
      if (a.diasDesde === null) return 1;
      if (b.diasDesde === null) return -1;
      return b.diasDesde - a.diasDesde;
    });
  const top = candidatos[0];
  if (!top) return null;
  return {
    grupo: top.grupo,
    mensaje:
      top.diasDesde === null
        ? `Aún no has entrenado ${top.grupo.toLowerCase()}. ¿Lo sumamos a tu próxima sesión?`
        : `Llevas ${top.diasDesde} días sin entrenar ${top.grupo.toLowerCase()}. Es buen momento para retomarlo.`,
  };
}
