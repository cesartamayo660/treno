/**
 * Insignias: catálogo y evaluación (lógica pura, sin React).
 * Cada insignia tiene una meta numérica y una función de progreso, así la
 * interfaz puede mostrar "te faltan X" y no solo bloqueado/desbloqueado.
 */

export type Rareza = "comun" | "rara" | "epica" | "legendaria";

export type IconoInsignia =
  | "dumbbell"
  | "flame"
  | "trophy"
  | "pin"
  | "scale"
  | "crown"
  | "zap"
  | "target"
  | "layers"
  | "calendar"
  | "medal"
  | "star"
  | "mountain";

export interface EstadisticasInsignias {
  entrenamientos: number;
  tonelajeKg: number;
  diasGym: number;
  prs: number;
  racha: number;
  semanasPerfectas: number;
  /** Mejor 1RM estimado por ejercicio (id → kg). */
  mejor1Rm: Record<string, number>;
  ejerciciosDistintos: number;
  gruposTrabajados: number;
  pesajes: number;
}

export interface InsigniaDef {
  id: string;
  titulo: string;
  descripcion: string;
  rareza: Rareza;
  icono: IconoInsignia;
  meta: number;
  /** Valor actual hacia la meta (puede superarla). */
  progreso: (s: EstadisticasInsignias) => number;
  /** Cómo mostrar el progreso: "5 / 10 entrenamientos". */
  unidad: string;
}

export const RAREZA_INFO: Record<Rareza, { nombre: string; estrellas: number }> = {
  comun: { nombre: "Común", estrellas: 1 },
  rara: { nombre: "Rara", estrellas: 2 },
  epica: { nombre: "Épica", estrellas: 3 },
  legendaria: { nombre: "Legendaria", estrellas: 4 },
};

const lift = (id: string) => (s: EstadisticasInsignias) => s.mejor1Rm[id] ?? 0;

export const INSIGNIAS: InsigniaDef[] = [
  // Entrenamientos
  { id: "primer-entreno", titulo: "Primer paso", descripcion: "Completa tu primer entrenamiento.", rareza: "comun", icono: "dumbbell", meta: 1, unidad: "entrenamientos", progreso: (s) => s.entrenamientos },
  { id: "entrenos-10", titulo: "Le tomaste el gusto", descripcion: "Completa 10 entrenamientos.", rareza: "comun", icono: "dumbbell", meta: 10, unidad: "entrenamientos", progreso: (s) => s.entrenamientos },
  { id: "entrenos-25", titulo: "Hábito en marcha", descripcion: "Completa 25 entrenamientos.", rareza: "rara", icono: "dumbbell", meta: 25, unidad: "entrenamientos", progreso: (s) => s.entrenamientos },
  { id: "entrenos-50", titulo: "Veterano", descripcion: "Completa 50 entrenamientos.", rareza: "epica", icono: "medal", meta: 50, unidad: "entrenamientos", progreso: (s) => s.entrenamientos },
  { id: "entrenos-100", titulo: "Centenario", descripcion: "Completa 100 entrenamientos.", rareza: "legendaria", icono: "crown", meta: 100, unidad: "entrenamientos", progreso: (s) => s.entrenamientos },

  // Asistencia y rachas
  { id: "primer-checkin", titulo: "Presente", descripcion: "Haz tu primer check-in en el gimnasio.", rareza: "comun", icono: "pin", meta: 1, unidad: "check-ins", progreso: (s) => s.diasGym },
  { id: "asistencia-20", titulo: "De casa en el gym", descripcion: "Asiste 20 días al gimnasio.", rareza: "rara", icono: "calendar", meta: 20, unidad: "días", progreso: (s) => s.diasGym },
  { id: "asistencia-60", titulo: "Inamovible", descripcion: "Asiste 60 días al gimnasio.", rareza: "epica", icono: "calendar", meta: 60, unidad: "días", progreso: (s) => s.diasGym },
  { id: "racha-3", titulo: "Calentando motores", descripcion: "Racha de 3 días seguidos.", rareza: "comun", icono: "flame", meta: 3, unidad: "días de racha", progreso: (s) => s.racha },
  { id: "racha-7", titulo: "Semana de fuego", descripcion: "Racha de 7 días seguidos.", rareza: "rara", icono: "flame", meta: 7, unidad: "días de racha", progreso: (s) => s.racha },
  { id: "racha-14", titulo: "Imparable", descripcion: "Racha de 14 días seguidos.", rareza: "epica", icono: "flame", meta: 14, unidad: "días de racha", progreso: (s) => s.racha },
  { id: "racha-30", titulo: "Mes de hierro", descripcion: "Racha de 30 días seguidos.", rareza: "legendaria", icono: "flame", meta: 30, unidad: "días de racha", progreso: (s) => s.racha },
  { id: "semanas-4", titulo: "Mes perfecto", descripcion: "4 semanas seguidas cumpliendo todos tus días pactados.", rareza: "epica", icono: "target", meta: 4, unidad: "semanas perfectas", progreso: (s) => s.semanasPerfectas },

  // Récords y fuerza
  { id: "primer-pr", titulo: "Rompe-marcas", descripcion: "Logra tu primer récord personal.", rareza: "comun", icono: "trophy", meta: 1, unidad: "récords", progreso: (s) => s.prs },
  { id: "pr-5", titulo: "Cazador de récords", descripcion: "Logra 5 récords personales.", rareza: "rara", icono: "trophy", meta: 5, unidad: "récords", progreso: (s) => s.prs },
  { id: "pr-25", titulo: "Máquina de PRs", descripcion: "Logra 25 récords personales.", rareza: "epica", icono: "trophy", meta: 25, unidad: "récords", progreso: (s) => s.prs },
  { id: "banca-100", titulo: "Club de los 100", descripcion: "1RM estimado de 100 kg en Press de banca.", rareza: "epica", icono: "zap", meta: 100, unidad: "kg de 1RM en banca", progreso: lift("ex-bench") },
  { id: "sentadilla-140", titulo: "Piernas de roble", descripcion: "1RM estimado de 140 kg en Sentadilla.", rareza: "epica", icono: "mountain", meta: 140, unidad: "kg de 1RM en sentadilla", progreso: lift("ex-squat") },
  { id: "muerto-180", titulo: "Levanta montañas", descripcion: "1RM estimado de 180 kg en Peso muerto.", rareza: "epica", icono: "mountain", meta: 180, unidad: "kg de 1RM en peso muerto", progreso: lift("ex-deadlift") },
  {
    id: "tres-grandes",
    titulo: "Los tres grandes",
    descripcion: "Banca 100 kg, sentadilla 140 kg y peso muerto 180 kg (1RM estimado).",
    rareza: "legendaria",
    icono: "crown",
    meta: 3,
    unidad: "de 3 marcas",
    progreso: (s) =>
      (lift("ex-bench")(s) >= 100 ? 1 : 0) + (lift("ex-squat")(s) >= 140 ? 1 : 0) + (lift("ex-deadlift")(s) >= 180 ? 1 : 0),
  },

  // Volumen y variedad
  { id: "tonelada-1", titulo: "Primera tonelada", descripcion: "Mueve 1 tonelada en total.", rareza: "comun", icono: "layers", meta: 1000, unidad: "kg movidos", progreso: (s) => s.tonelajeKg },
  { id: "tonelada-10", titulo: "Camión cargado", descripcion: "Mueve 10 toneladas en total.", rareza: "rara", icono: "layers", meta: 10_000, unidad: "kg movidos", progreso: (s) => s.tonelajeKg },
  { id: "tonelada-100", titulo: "Mueve-barcos", descripcion: "Mueve 100 toneladas en total.", rareza: "legendaria", icono: "layers", meta: 100_000, unidad: "kg movidos", progreso: (s) => s.tonelajeKg },
  { id: "explorador", titulo: "Explorador", descripcion: "Entrena 10 ejercicios distintos.", rareza: "rara", icono: "star", meta: 10, unidad: "ejercicios", progreso: (s) => s.ejerciciosDistintos },
  { id: "cuerpo-completo", titulo: "Cuerpo completo", descripcion: "Entrena los 7 grupos musculares.", rareza: "epica", icono: "star", meta: 7, unidad: "grupos", progreso: (s) => s.gruposTrabajados },
  { id: "bascula", titulo: "Amigo de la báscula", descripcion: "Registra tu peso 3 veces.", rareza: "comun", icono: "scale", meta: 3, unidad: "pesajes", progreso: (s) => s.pesajes },
];

export interface InsigniaEstado {
  def: InsigniaDef;
  actual: number;
  meta: number;
  /** 0..1 */
  avance: number;
  logrado: boolean;
}

export function evaluarInsignias(s: EstadisticasInsignias): InsigniaEstado[] {
  return INSIGNIAS.map((def) => {
    const actual = Math.max(0, def.progreso(s));
    return {
      def,
      actual,
      meta: def.meta,
      avance: Math.min(1, actual / def.meta),
      logrado: actual >= def.meta,
    };
  });
}

/** Ids de insignias nuevas: logradas ahora y que aún no estaban registradas. */
export function nuevasInsignias(estados: InsigniaEstado[], yaDesbloqueadas: Record<string, string>): string[] {
  return estados.filter((e) => e.logrado && !yaDesbloqueadas[e.def.id]).map((e) => e.def.id);
}
