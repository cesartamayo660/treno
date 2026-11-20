/**
 * Sobrecarga progresiva: a partir de tu última sesión en un ejercicio, sugiere
 * qué probar hoy. Usa "doble progresión": primero subes repeticiones dentro de un
 * rango y, al llegar al tope, subes el peso y vuelves a la parte baja del rango.
 */

export type Equipo = "Barra" | "Mancuernas" | "Máquina" | "Polea" | "Peso corporal" | "Barra Hex";

export interface EntradaHistorial {
  fecha: string;
  pesoKg: number;
  reps: number;
  oneRm: number;
}

export type TipoSugerencia = "subir-peso" | "subir-reps";

export interface Sugerencia {
  pesoKg: number;
  reps: number;
  tipo: TipoSugerencia;
  /** Explicación corta en lenguaje simple. */
  motivo: string;
  /** Rango de repeticiones objetivo. */
  rango: [number, number];
}

/** Rango de repeticiones según la zona en la que entrenaste la última vez. */
export function rangoDeReps(reps: number): [number, number] {
  if (reps <= 6) return [4, 6]; // fuerza
  if (reps <= 12) return [8, 12]; // hipertrofia
  return [12, 15]; // resistencia
}

/** Salto de peso razonable según el equipo (kg). */
export function incrementoPara(equipo: Equipo, pesoKg: number): number {
  switch (equipo) {
    case "Mancuernas":
      return pesoKg < 12 ? 1 : 2;
    case "Máquina":
      return pesoKg >= 100 ? 5 : 2.5;
    default:
      return 2.5;
  }
}

const redondear = (n: number) => Math.round(n * 2) / 2;

/** Devuelve null si no hay historial (no se inventa nada). */
export function sugerirSiguiente(historial: EntradaHistorial[], equipo: Equipo): Sugerencia | null {
  if (!historial.length) return null;
  const ultima = historial[historial.length - 1];
  if (!(ultima.pesoKg > 0) || !(ultima.reps > 0)) return null;

  const rango = rangoDeReps(ultima.reps);
  const inc = incrementoPara(equipo, ultima.pesoKg);

  if (ultima.reps >= rango[1]) {
    const nuevo = redondear(ultima.pesoKg + inc);
    return {
      pesoKg: nuevo,
      reps: rango[0],
      tipo: "subir-peso",
      rango,
      motivo: `Llegaste a ${ultima.reps} repeticiones con ${ultima.pesoKg} kg. Toca subir ${inc} kg y volver a ${rango[0]}.`,
    };
  }

  const reps = Math.max(ultima.reps + 1, rango[0]);
  return {
    pesoKg: ultima.pesoKg,
    reps,
    tipo: "subir-reps",
    rango,
    motivo: `Mismo peso, una repetición más. Cuando llegues a ${rango[1]} subimos de peso.`,
  };
}
