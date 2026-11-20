/**
 * Calculadora de discos: dado el peso total que quieres levantar, dice qué discos
 * poner en cada lado de la barra. Trabaja en gramos enteros para evitar errores
 * de coma flotante (1.25 + 2.5 + ...).
 */

/** Discos disponibles en un gimnasio típico (kg), de mayor a menor. */
export const DISCOS_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

/** Barras habituales. */
export const BARRAS = [
  { kg: 20, nombre: "Olímpica 20 kg" },
  { kg: 15, nombre: "Femenina 15 kg" },
  { kg: 10, nombre: "Corta 10 kg" },
] as const;

export interface DiscoPorLado {
  kg: number;
  cantidad: number;
}

export interface ResultadoDiscos {
  /** Discos de UN lado de la barra, de adentro hacia afuera. */
  porLado: DiscoPorLado[];
  barraKg: number;
  /** Peso total realmente cargable con esos discos. */
  totalKg: number;
  /** Lo que falta o sobra respecto al objetivo (≥ 0). 0 si es exacto. */
  diferenciaKg: number;
  exacto: boolean;
  /** El objetivo es menor que la barra sola. */
  menorQueBarra: boolean;
  /** Peso de un solo lado (solo discos). */
  pesoPorLadoKg: number;
}

const g = (kg: number) => Math.round(kg * 1000);

export function calcularDiscos(
  objetivoKg: number,
  barraKg = 20,
  discos: number[] = DISCOS_KG
): ResultadoDiscos {
  const objetivo = Number.isFinite(objetivoKg) ? Math.max(0, objetivoKg) : 0;
  const barra = g(barraKg);
  const total = g(objetivo);

  if (total < barra) {
    return {
      porLado: [],
      barraKg,
      totalKg: barraKg,
      diferenciaKg: Math.round(((barra - total) / 1000) * 100) / 100,
      exacto: false,
      menorQueBarra: true,
      pesoPorLadoKg: 0,
    };
  }

  let restoLado = Math.floor((total - barra) / 2);
  const porLado: DiscoPorLado[] = [];
  let usadoLado = 0;
  for (const kg of [...discos].sort((a, b) => b - a)) {
    const unidad = g(kg);
    const n = Math.floor(restoLado / unidad);
    if (n > 0) {
      porLado.push({ kg, cantidad: n });
      restoLado -= n * unidad;
      usadoLado += n * unidad;
    }
  }

  const totalCargable = barra + usadoLado * 2;
  const diff = total - totalCargable;
  return {
    porLado,
    barraKg,
    totalKg: totalCargable / 1000,
    diferenciaKg: Math.round(diff) / 1000,
    exacto: diff === 0,
    menorQueBarra: false,
    pesoPorLadoKg: usadoLado / 1000,
  };
}

/** Lista plana de discos de un lado (para dibujarlos de adentro hacia afuera). */
export function discosPlanos(r: ResultadoDiscos): number[] {
  return r.porLado.flatMap((d) => Array<number>(d.cantidad).fill(d.kg));
}

/** Peso cargable más cercano por debajo o igual al objetivo (múltiplos de 2.5 kg con barra de 20). */
export function pesoCargableMasCercano(objetivoKg: number, barraKg = 20): number {
  return calcularDiscos(objetivoKg, barraKg).totalKg;
}
