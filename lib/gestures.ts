/**
 * Gestos de mano para el check-in con foto.
 * Cada día toca un gesto distinto (determinista por fecha): la foto de tu mano con el
 * gimnasio de fondo demuestra que estás ahí, sin necesidad de selfies ni espejo.
 */
export interface Gesto {
  id: string;
  nombre: string;
  emoji: string;
  instruccion: string;
}

export const GESTOS: Gesto[] = [
  { id: "paz", nombre: "La paz", emoji: "✌️", instruccion: "Levanta el índice y el medio en V, palma hacia la cámara." },
  { id: "letra-c", nombre: "Letra C", emoji: "🫳", instruccion: "Curva la mano formando una C, como si sostuvieras un vaso." },
  { id: "indice-arriba", nombre: "Índice al cielo", emoji: "☝️", instruccion: "Un solo dedo, el índice, apuntando hacia arriba." },
  { id: "indice-abajo", nombre: "Índice al piso", emoji: "👇", instruccion: "El índice apuntando hacia el suelo, resto de dedos cerrados." },
  { id: "puno", nombre: "Puño cerrado", emoji: "✊", instruccion: "Cierra el puño con fuerza y muéstralo de frente." },
  { id: "mano-abierta", nombre: "Mano abierta", emoji: "🖐️", instruccion: "Palma abierta, cinco dedos bien separados." },
  { id: "pulgar-arriba", nombre: "Pulgar arriba", emoji: "👍", instruccion: "Puño cerrado con el pulgar hacia arriba." },
  { id: "pulgar-abajo", nombre: "Pulgar abajo", emoji: "👎", instruccion: "Puño cerrado con el pulgar hacia abajo." },
  { id: "ok", nombre: "OK", emoji: "👌", instruccion: "Une la punta del pulgar y el índice formando un círculo." },
  { id: "rock", nombre: "Rock", emoji: "🤘", instruccion: "Índice y meñique arriba, el resto cerrado." },
  { id: "llamame", nombre: "Llámame", emoji: "🤙", instruccion: "Pulgar y meñique estirados, como un teléfono." },
  { id: "tres", nombre: "Tres dedos", emoji: "🖖", instruccion: "Muestra exactamente tres dedos: índice, medio y anular." },
  { id: "cuatro", nombre: "Cuatro dedos", emoji: "🤚", instruccion: "Cuatro dedos arriba y el pulgar doblado sobre la palma." },
  { id: "dos-juntos", nombre: "Dos dedos juntos", emoji: "🫰", instruccion: "Índice y medio pegados, apuntando hacia arriba." },
  { id: "pistola", nombre: "Pistola de dedos", emoji: "👉", instruccion: "Índice estirado y pulgar arriba, como una pistola." },
  { id: "letra-l", nombre: "Letra L", emoji: "🫵", instruccion: "Índice arriba y pulgar hacia el costado, formando una L." },
  { id: "pellizco", nombre: "Pellizco", emoji: "🤏", instruccion: "Pulgar e índice casi juntos, como midiendo algo pequeño." },
  { id: "garra", nombre: "Garra", emoji: "🫴", instruccion: "Dedos separados y doblados como una garra." },
  { id: "mano-plana", nombre: "Mano plana", emoji: "🫱", instruccion: "Palma plana, horizontal, dedos juntos hacia adelante." },
  { id: "vuelta-v", nombre: "V al revés", emoji: "🫲", instruccion: "Índice y medio hacia abajo, formando una V invertida." },
  { id: "cruzados", nombre: "Dedos cruzados", emoji: "🤞", instruccion: "Cruza el índice y el medio." },
  { id: "cinco-reves", nombre: "Mano de espaldas", emoji: "🤚", instruccion: "Muestra el dorso de la mano, dedos abiertos." },
  { id: "tres-mas", nombre: "Tres con meñique", emoji: "🤟", instruccion: "Pulgar, índice y meñique arriba (te quiero)." },
  { id: "uno-meñique", nombre: "Solo meñique", emoji: "🤙", instruccion: "Solo el meñique estirado, resto de dedos cerrados." },
  { id: "pulgar-indice-l", nombre: "Pulgar al costado", emoji: "👈", instruccion: "Índice apuntando a un lado y pulgar arriba." },
  { id: "puño-arriba", nombre: "Puño al cielo", emoji: "👊", instruccion: "Puño cerrado de frente, brazo levantado." },
  { id: "dos-dedos-abajo", nombre: "Dos dedos abajo", emoji: "👇", instruccion: "Índice y medio apuntando hacia el suelo." },
  { id: "mano-pecho", nombre: "Palma frontal", emoji: "✋", instruccion: "Palma hacia la cámara como un “alto”, dedos juntos." },
  { id: "cuatro-meñique", nombre: "Sin pulgar", emoji: "🖐️", instruccion: "Muestra cuatro dedos estirados y esconde el pulgar." },
  { id: "tijera", nombre: "Tijera", emoji: "✌️", instruccion: "Índice y medio abriendo y cerrando como tijera (foto con dedos abiertos)." },
];

/** Gesto del día: el mismo para todos los usuarios en la misma fecha (YYYY-MM-DD). */
export function gestoDelDia(fechaIso: string): Gesto {
  const n = Number(fechaIso.replace(/-/g, ""));
  // mezcla simple para que días consecutivos no repitan patrón
  const idx = Math.abs((n * 2654435761) % 2 ** 32) % GESTOS.length;
  return GESTOS[idx];
}
