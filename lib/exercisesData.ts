export interface ExerciseItem {
  id: string;
  nombre: string;
  grupoMuscular:
    | "Pecho"
    | "Espalda"
    | "Piernas"
    | "Hombros"
    | "Brazos"
    | "Core"
    | "Glúteos";
  equipo: "Barra" | "Mancuernas" | "Máquina" | "Polea" | "Peso corporal" | "Barra Hex";
  esPrincipal: boolean;
  ultimoPesoKg?: number;
  ultimasReps?: number;
  mejor1RmKg?: number;
}

/**
 * Biblioteca precargada de 64 ejercicios agrupados por músculo.
 * Incluye los 5 básicos principales usados para el cálculo de Fuerza (DOTS) en el TRENO Score.
 */
export const EXERCISES_LIBRARY: ExerciseItem[] = [
  // PECHO (10)
  { id: "ex-bench", nombre: "Press de Banca con Barra", grupoMuscular: "Pecho", equipo: "Barra", esPrincipal: true, ultimoPesoKg: 82.5, ultimasReps: 6, mejor1RmKg: 96.2 },
  { id: "ex-incline-db", nombre: "Press Inclinado con Mancuernas", grupoMuscular: "Pecho", equipo: "Mancuernas", esPrincipal: false, ultimoPesoKg: 32, ultimasReps: 8, mejor1RmKg: 39.7 },
  { id: "ex-incline-bb", nombre: "Press Inclinado con Barra", grupoMuscular: "Pecho", equipo: "Barra", esPrincipal: false, ultimoPesoKg: 70, ultimasReps: 8, mejor1RmKg: 86.9 },
  { id: "ex-dips", nombre: "Fondos en Paralelas Lastrados", grupoMuscular: "Pecho", equipo: "Peso corporal", esPrincipal: false, ultimoPesoKg: 80, ultimasReps: 10, mejor1RmKg: 106.7 },
  { id: "ex-cable-fly", nombre: "Cruces en Polea Alta", grupoMuscular: "Pecho", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 25, ultimasReps: 12, mejor1RmKg: 35.0 },
  { id: "ex-pec-deck", nombre: "Aperturas en Máquina (Pec Deck)", grupoMuscular: "Pecho", equipo: "Máquina", esPrincipal: false, ultimoPesoKg: 65, ultimasReps: 12, mejor1RmKg: 91.0 },
  { id: "ex-chest-press", nombre: "Press Convergente en Máquina", grupoMuscular: "Pecho", equipo: "Máquina", esPrincipal: false, ultimoPesoKg: 75, ultimasReps: 10, mejor1RmKg: 100.0 },
  { id: "ex-db-bench", nombre: "Press Plano con Mancuernas", grupoMuscular: "Pecho", equipo: "Mancuernas", esPrincipal: false, ultimoPesoKg: 36, ultimasReps: 8, mejor1RmKg: 44.7 },
  { id: "ex-low-cable-fly", nombre: "Cruces en Polea Baja", grupoMuscular: "Pecho", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 20, ultimasReps: 12, mejor1RmKg: 28.0 },
  { id: "ex-pushups", nombre: "Flexiones Explosivas / Pliométricas", grupoMuscular: "Pecho", equipo: "Peso corporal", esPrincipal: false, ultimoPesoKg: 65, ultimasReps: 15, mejor1RmKg: 97.5 },

  // ESPALDA (11)
  { id: "ex-deadlift", nombre: "Peso Muerto Convencional", grupoMuscular: "Espalda", equipo: "Barra", esPrincipal: true, ultimoPesoKg: 142.5, ultimasReps: 5, mejor1RmKg: 160.3 },
  { id: "ex-pullups", nombre: "Dominadas Lastradas", grupoMuscular: "Espalda", equipo: "Peso corporal", esPrincipal: true, ultimoPesoKg: 82, ultimasReps: 6, mejor1RmKg: 95.2 },
  { id: "ex-bb-row", nombre: "Remo Pendlay con Barra", grupoMuscular: "Espalda", equipo: "Barra", esPrincipal: true, ultimoPesoKg: 80, ultimasReps: 8, mejor1RmKg: 99.3 },
  { id: "ex-lat-pulldown", nombre: "Jalón al Pecho en Polea", grupoMuscular: "Espalda", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 70, ultimasReps: 10, mejor1RmKg: 93.3 },
  { id: "ex-seated-row", nombre: "Remo Gironda en Polea Baja", grupoMuscular: "Espalda", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 75, ultimasReps: 10, mejor1RmKg: 100.0 },
  { id: "ex-tbar-row", nombre: "Remo en Barra T con Apoyo al Pecho", grupoMuscular: "Espalda", equipo: "Máquina", esPrincipal: false, ultimoPesoKg: 65, ultimasReps: 8, mejor1RmKg: 80.7 },
  { id: "ex-db-row", nombre: "Remo Unilateral con Mancuerna", grupoMuscular: "Espalda", equipo: "Mancuernas", esPrincipal: false, ultimoPesoKg: 38, ultimasReps: 10, mejor1RmKg: 50.7 },
  { id: "ex-pullover", nombre: "Pull-over en Polea Alta con Cuerda", grupoMuscular: "Espalda", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 32, ultimasReps: 12, mejor1RmKg: 44.8 },
  { id: "ex-neutral-pulldown", nombre: "Jalón con Agarre Neutro Estrecho", grupoMuscular: "Espalda", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 72.5, ultimasReps: 8, mejor1RmKg: 90.0 },
  { id: "ex-rack-pull", nombre: "Rack Pull Pesado", grupoMuscular: "Espalda", equipo: "Barra", esPrincipal: false, ultimoPesoKg: 160, ultimasReps: 5, mejor1RmKg: 180.0 },
  { id: "ex-face-pull", nombre: "Face Pull en Polea", grupoMuscular: "Espalda", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 30, ultimasReps: 15, mejor1RmKg: 45.0 },

  // PIERNAS (12)
  { id: "ex-squat", nombre: "Sentadilla Trasera con Barra", grupoMuscular: "Piernas", equipo: "Barra", esPrincipal: true, ultimoPesoKg: 115, ultimasReps: 5, mejor1RmKg: 129.4 },
  { id: "ex-front-squat", nombre: "Sentadilla Frontal Olímpica", grupoMuscular: "Piernas", equipo: "Barra", esPrincipal: false, ultimoPesoKg: 90, ultimasReps: 6, mejor1RmKg: 104.5 },
  { id: "ex-leg-press", nombre: "Prensa Inclinada 45°", grupoMuscular: "Piernas", equipo: "Máquina", esPrincipal: false, ultimoPesoKg: 240, ultimasReps: 10, mejor1RmKg: 320.0 },
  { id: "ex-hack-squat", nombre: "Sentadilla Hack en Máquina", grupoMuscular: "Piernas", equipo: "Máquina", esPrincipal: false, ultimoPesoKg: 130, ultimasReps: 8, mejor1RmKg: 161.4 },
  { id: "ex-rdl", nombre: "Peso Muerto Rumano con Barra", grupoMuscular: "Piernas", equipo: "Barra", esPrincipal: false, ultimoPesoKg: 110, ultimasReps: 8, mejor1RmKg: 136.6 },
  { id: "ex-bulgarian", nombre: "Sentadilla Búlgara con Mancuernas", grupoMuscular: "Piernas", equipo: "Mancuernas", esPrincipal: false, ultimoPesoKg: 26, ultimasReps: 10, mejor1RmKg: 34.7 },
  { id: "ex-leg-ext", nombre: "Extensión de Cuádriceps en Máquina", grupoMuscular: "Piernas", equipo: "Máquina", esPrincipal: false, ultimoPesoKg: 75, ultimasReps: 12, mejor1RmKg: 105.0 },
  { id: "ex-leg-curl", nombre: "Curl Femoral Tumbado", grupoMuscular: "Piernas", equipo: "Máquina", esPrincipal: false, ultimoPesoKg: 55, ultimasReps: 10, mejor1RmKg: 73.3 },
  { id: "ex-seated-curl", nombre: "Curl Femoral Sentado", grupoMuscular: "Piernas", equipo: "Máquina", esPrincipal: false, ultimoPesoKg: 60, ultimasReps: 12, mejor1RmKg: 84.0 },
  { id: "ex-calf-standing", nombre: "Elevación de Talones de Pie", grupoMuscular: "Piernas", equipo: "Máquina", esPrincipal: false, ultimoPesoKg: 110, ultimasReps: 15, mejor1RmKg: 165.0 },
  { id: "ex-calf-seated", nombre: "Elevación de Sóleo Sentado", grupoMuscular: "Piernas", equipo: "Máquina", esPrincipal: false, ultimoPesoKg: 60, ultimasReps: 15, mejor1RmKg: 90.0 },
  { id: "ex-trap-deadlift", nombre: "Peso Muerto con Barra Hexagonal", grupoMuscular: "Piernas", equipo: "Barra Hex", esPrincipal: false, ultimoPesoKg: 150, ultimasReps: 5, mejor1RmKg: 168.8 },

  // GLÚTEOS (6)
  { id: "ex-hip-thrust", nombre: "Hip Thrust con Barra Olímpica", grupoMuscular: "Glúteos", equipo: "Barra", esPrincipal: false, ultimoPesoKg: 140, ultimasReps: 8, mejor1RmKg: 173.8 },
  { id: "ex-cable-kickback", nombre: "Patada de Glúteo en Polea Baja", grupoMuscular: "Glúteos", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 22.5, ultimasReps: 12, mejor1RmKg: 31.5 },
  { id: "ex-abductor", nombre: "Abducción de Cadera en Máquina", grupoMuscular: "Glúteos", equipo: "Máquina", esPrincipal: false, ultimoPesoKg: 70, ultimasReps: 15, mejor1RmKg: 105.0 },
  { id: "ex-step-up", nombre: "Step-Up Alto con Mancuernas", grupoMuscular: "Glúteos", equipo: "Mancuernas", esPrincipal: false, ultimoPesoKg: 22, ultimasReps: 10, mejor1RmKg: 29.3 },
  { id: "ex-sumo-deadlift", nombre: "Peso Muerto Sumo", grupoMuscular: "Glúteos", equipo: "Barra", esPrincipal: false, ultimoPesoKg: 145, ultimasReps: 5, mejor1RmKg: 163.1 },
  { id: "ex-glute-hyper", nombre: "Hiperextensiones 45° Enfoque Glúteo", grupoMuscular: "Glúteos", equipo: "Peso corporal", esPrincipal: false, ultimoPesoKg: 20, ultimasReps: 12, mejor1RmKg: 28.0 },

  // HOMBROS (9)
  { id: "ex-ohp", nombre: "Press Militar de Pie con Barra (OHP)", grupoMuscular: "Hombros", equipo: "Barra", esPrincipal: true, ultimoPesoKg: 55, ultimasReps: 6, mejor1RmKg: 63.9 },
  { id: "ex-db-shoulder", nombre: "Press de Hombros Sentado con Mancuernas", grupoMuscular: "Hombros", equipo: "Mancuernas", esPrincipal: false, ultimoPesoKg: 26, ultimasReps: 8, mejor1RmKg: 32.3 },
  { id: "ex-lat-raise", nombre: "Elevaciones Laterales con Mancuernas", grupoMuscular: "Hombros", equipo: "Mancuernas", esPrincipal: false, ultimoPesoKg: 14, ultimasReps: 14, mejor1RmKg: 20.5 },
  { id: "ex-cable-lat-raise", nombre: "Elevación Lateral en Polea a Una Mano", grupoMuscular: "Hombros", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 12.5, ultimasReps: 12, mejor1RmKg: 17.5 },
  { id: "ex-rear-delt", nombre: "Pájaros en Máquina Posterior", grupoMuscular: "Hombros", equipo: "Máquina", esPrincipal: false, ultimoPesoKg: 50, ultimasReps: 15, mejor1RmKg: 75.0 },
  { id: "ex-arnold-press", nombre: "Press Arnold con Mancuernas", grupoMuscular: "Hombros", equipo: "Mancuernas", esPrincipal: false, ultimoPesoKg: 22, ultimasReps: 10, mejor1RmKg: 29.3 },
  { id: "ex-upright-row", nombre: "Remo al Mentón Agarre Ancho", grupoMuscular: "Hombros", equipo: "Barra", esPrincipal: false, ultimoPesoKg: 42.5, ultimasReps: 10, mejor1RmKg: 56.7 },
  { id: "ex-shrugs", nombre: "Encogimientos de Trapecio con Mancuernas", grupoMuscular: "Hombros", equipo: "Mancuernas", esPrincipal: false, ultimoPesoKg: 40, ultimasReps: 12, mejor1RmKg: 56.0 },
  { id: "ex-machine-shoulder", nombre: "Press de Hombros en Máquina Convergente", grupoMuscular: "Hombros", equipo: "Máquina", esPrincipal: false, ultimoPesoKg: 65, ultimasReps: 10, mejor1RmKg: 86.7 },

  // BRAZOS (10)
  { id: "ex-bb-curl", nombre: "Curl de Bíceps con Barra Z", grupoMuscular: "Brazos", equipo: "Barra", esPrincipal: false, ultimoPesoKg: 40, ultimasReps: 8, mejor1RmKg: 49.7 },
  { id: "ex-incline-curl", nombre: "Curl Inclinado con Mancuernas", grupoMuscular: "Brazos", equipo: "Mancuernas", esPrincipal: false, ultimoPesoKg: 16, ultimasReps: 10, mejor1RmKg: 21.3 },
  { id: "ex-hammer-curl", nombre: "Curl Martillo Alterno", grupoMuscular: "Brazos", equipo: "Mancuernas", esPrincipal: false, ultimoPesoKg: 20, ultimasReps: 10, mejor1RmKg: 26.7 },
  { id: "ex-preacher-curl", nombre: "Curl Predicador en Máquina", grupoMuscular: "Brazos", equipo: "Máquina", esPrincipal: false, ultimoPesoKg: 45, ultimasReps: 10, mejor1RmKg: 60.0 },
  { id: "ex-bayesian-curl", nombre: "Curl Bayesiano en Polea Baja", grupoMuscular: "Brazos", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 17.5, ultimasReps: 12, mejor1RmKg: 24.5 },
  { id: "ex-tricep-pushdown", nombre: "Extensión de Tríceps en Polea con Cuerda", grupoMuscular: "Brazos", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 35, ultimasReps: 12, mejor1RmKg: 49.0 },
  { id: "ex-skullcrusher", nombre: "Press Francés con Barra Z", grupoMuscular: "Brazos", equipo: "Barra", esPrincipal: false, ultimoPesoKg: 37.5, ultimasReps: 10, mejor1RmKg: 50.0 },
  { id: "ex-overhead-tricep", nombre: "Extensión de Tríceps Tras Nuca en Polea", grupoMuscular: "Brazos", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 32.5, ultimasReps: 12, mejor1RmKg: 45.5 },
  { id: "ex-close-grip-bench", nombre: "Press de Banca Agarre Cerrado", grupoMuscular: "Brazos", equipo: "Barra", esPrincipal: false, ultimoPesoKg: 72.5, ultimasReps: 8, mejor1RmKg: 90.0 },
  { id: "ex-wrist-curl", nombre: "Curl de Antebrazo con Barra", grupoMuscular: "Brazos", equipo: "Barra", esPrincipal: false, ultimoPesoKg: 30, ultimasReps: 15, mejor1RmKg: 45.0 },

  // CORE (6)
  { id: "ex-cable-crunch", nombre: "Crunch Abdominal en Polea Alta", grupoMuscular: "Core", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 45, ultimasReps: 15, mejor1RmKg: 67.5 },
  { id: "ex-hanging-leg-raise", nombre: "Elevación de Piernas Colgado", grupoMuscular: "Core", equipo: "Peso corporal", esPrincipal: false, ultimoPesoKg: 10, ultimasReps: 12, mejor1RmKg: 14.0 },
  { id: "ex-ab-wheel", nombre: "Rueda Abdominal (Ab Wheel Rollout)", grupoMuscular: "Core", equipo: "Peso corporal", esPrincipal: false, ultimoPesoKg: 15, ultimasReps: 12, mejor1RmKg: 21.0 },
  { id: "ex-pallof-press", nombre: "Press Pallof Antirrotación en Polea", grupoMuscular: "Core", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 20, ultimasReps: 12, mejor1RmKg: 28.0 },
  { id: "ex-woodchopper", nombre: "Leñador Diagonal en Polea", grupoMuscular: "Core", equipo: "Polea", esPrincipal: false, ultimoPesoKg: 22.5, ultimasReps: 12, mejor1RmKg: 31.5 },
  { id: "ex-plank-weighted", nombre: "Plancha Isométrica con Disco", grupoMuscular: "Core", equipo: "Peso corporal", esPrincipal: false, ultimoPesoKg: 20, ultimasReps: 1, mejor1RmKg: 20.0 },
];
