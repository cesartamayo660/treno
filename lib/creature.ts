/**
 * Tu criatura TRENO: evoluciona con tu constancia de TODA la vida (no con el score
 * semanal, que sube y baja). Así nunca "retrocede" por una mala semana.
 */

export interface EntradaXp {
  entrenamientos: number;
  diasGym: number;
  prs: number;
  tonelajeKg: number;
  rachaDias: number;
  semanasPerfectas: number;
}

export interface Etapa {
  nivel: 1 | 2 | 3 | 4 | 5;
  nombre: string;
  /** XP mínima para estar en esta etapa. */
  desde: number;
  lema: string;
}

export const ETAPAS: Etapa[] = [
  { nivel: 1, nombre: "Cachorro", desde: 0, lema: "Todo gigante empezó pequeño." },
  { nivel: 2, nombre: "Atleta", desde: 120, lema: "Ya se le nota el trabajo." },
  { nivel: 3, nombre: "Bestia", desde: 350, lema: "El hierro ya le tiene respeto." },
  { nivel: 4, nombre: "Titán", desde: 800, lema: "Nadie le discute la barra." },
  { nivel: 5, nombre: "Leyenda", desde: 1600, lema: "Se habla de él en todos los gimnasios." },
];

export function calcularXp(e: EntradaXp): number {
  const xp =
    e.entrenamientos * 12 +
    e.diasGym * 6 +
    e.prs * 30 +
    Math.floor(e.tonelajeKg / 500) +
    e.semanasPerfectas * 25 +
    Math.min(e.rachaDias, 30) * 2;
  return Math.max(0, Math.floor(xp));
}

export interface EstadoCriatura {
  xp: number;
  etapa: Etapa;
  siguiente: Etapa | null;
  /** 0..1 dentro de la etapa actual. */
  avance: number;
  xpFalta: number;
}

export function estadoCriatura(xp: number): EstadoCriatura {
  let idx = 0;
  ETAPAS.forEach((e, i) => {
    if (xp >= e.desde) idx = i;
  });
  const etapa = ETAPAS[idx];
  const siguiente = ETAPAS[idx + 1] ?? null;
  const avance = siguiente ? (xp - etapa.desde) / (siguiente.desde - etapa.desde) : 1;
  return {
    xp,
    etapa,
    siguiente,
    avance: Math.max(0, Math.min(1, avance)),
    xpFalta: siguiente ? Math.max(0, siguiente.desde - xp) : 0,
  };
}
