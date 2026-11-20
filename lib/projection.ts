/**
 * Proyección de meta: "¿cuándo llego a mi peso objetivo?".
 *
 * Para que no salte de forma absurda con pocos datos:
 *  - exige al menos 3 pesajes repartidos en ~1 semana,
 *  - usa una recta de tendencia (mínimos cuadrados) en vez del último pesaje,
 *  - devuelve un RANGO de fechas (según el error de la tendencia), no un día exacto,
 *  - avisa si vas en sentido contrario, estancado o demasiado rápido.
 */

export interface Pesaje {
  fecha: string; // ISO YYYY-MM-DD
  pesoKg: number;
}

export type EstadoProyeccion =
  | "sin-datos"
  | "mantener"
  | "lograda"
  | "contrario"
  | "estancado"
  | "ok";

export type Confianza = "baja" | "media" | "alta";

export interface Proyeccion {
  estado: EstadoProyeccion;
  /** Kg por semana (negativo = bajando). 0 si no se pudo calcular. */
  ritmoKgSem: number;
  /** Peso de tendencia suavizado hoy. */
  pesoTendenciaKg: number | null;
  faltanKg: number;
  semanasCentral?: number;
  fechaCentral?: string;
  fechaMin?: string;
  fechaMax?: string;
  /** Texto listo para mostrar: "14 feb – 4 mar". */
  rango?: string;
  confianza: Confianza;
  pesajes: number;
  diasCubiertos: number;
  mensaje: string;
  advertencia?: string;
}

const MS_DIA = 86_400_000;
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MAX_SEMANAS = 104;

const toUtc = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
};
const dias = (a: string, b: string) => Math.round((toUtc(b) - toUtc(a)) / MS_DIA);

export function sumarDias(iso: string, n: number): string {
  const d = new Date(toUtc(iso) + Math.round(n) * MS_DIA);
  return d.toISOString().slice(0, 10);
}

export function fechaCorta(iso: string, conAnio = false): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${MESES[(m || 1) - 1]}${conAnio ? ` ${y}` : ""}`;
}

function rangoTexto(min: string, max: string, hoy: string): string {
  const anioHoy = hoy.slice(0, 4);
  const conAnio = min.slice(0, 4) !== anioHoy || max.slice(0, 4) !== anioHoy;
  return `${fechaCorta(min, conAnio && min.slice(0, 4) !== max.slice(0, 4))} – ${fechaCorta(max, conAnio)}`;
}

const redondear = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export function proyectarMeta(
  pesajesEntrada: Pesaje[],
  metaKg: number,
  inicioKg: number,
  hoy: string
): Proyeccion {
  // Últimos 28 días, un pesaje por día (el último gana), ordenados
  const porDia = new Map<string, number>();
  for (const p of [...pesajesEntrada].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    if (dias(p.fecha, hoy) <= 28 && dias(p.fecha, hoy) >= 0 && p.pesoKg > 0) {
      porDia.set(p.fecha.slice(0, 10), p.pesoKg);
    }
  }
  const pts = Array.from(porDia.entries()).map(([fecha, pesoKg]) => ({ fecha, pesoKg }));
  const n = pts.length;
  const cubiertos = n > 1 ? dias(pts[0].fecha, pts[n - 1].fecha) : 0;

  const base = {
    ritmoKgSem: 0,
    pesoTendenciaKg: null as number | null,
    faltanKg: 0,
    pesajes: n,
    diasCubiertos: cubiertos,
  };

  if (n < 3 || cubiertos < 6) {
    const faltan = Math.max(0, 3 - n);
    return {
      ...base,
      estado: "sin-datos",
      confianza: "baja",
      mensaje:
        n === 0
          ? "Registra tu peso para empezar a proyectar tu meta."
          : faltan > 0
          ? `Necesito ${faltan} ${faltan === 1 ? "pesaje más" : "pesajes más"} repartidos en una semana para proyectar bien.`
          : "Ya tienes 3 pesajes. Con algunos días más de datos, la proyección será fiable.",
    };
  }

  // Recta de mínimos cuadrados: peso = a + b·día
  const x0 = pts[0].fecha;
  const xs = pts.map((p) => dias(x0, p.fecha));
  const ys = pts.map((p) => p.pesoKg);
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  const sxx = xs.reduce((s, v) => s + (v - mx) ** 2, 0);
  const sxy = xs.reduce((s, v, i) => s + (v - mx) * (ys[i] - my), 0);
  const b = sxx === 0 ? 0 : sxy / sxx; // kg por día
  const a = my - b * mx;
  const sse = xs.reduce((s, v, i) => s + (ys[i] - (a + b * v)) ** 2, 0);
  const se = n > 2 && sxx > 0 ? Math.sqrt(sse / (n - 2) / sxx) : 0; // error de la pendiente

  const xHoy = dias(x0, hoy);
  const tendencia = redondear(a + b * xHoy, 1);
  const ritmoSem = redondear(b * 7, 2);
  const faltan = redondear(metaKg - tendencia, 1);

  const confianza: Confianza = n >= 6 && cubiertos >= 12 ? "alta" : n >= 4 && cubiertos >= 9 ? "media" : "baja";
  const comun = { ...base, ritmoKgSem: ritmoSem, pesoTendenciaKg: tendencia, faltanKg: Math.abs(faltan), confianza };

  // Meta de mantenimiento: no hay fecha, hay estabilidad
  if (Math.abs(metaKg - inicioKg) < 0.1) {
    const estable = Math.abs(ritmoSem) <= 0.25;
    return {
      ...comun,
      estado: "mantener",
      mensaje: estable
        ? "Tu peso está estable: justo lo que busca tu meta de mantenimiento."
        : `Tu peso se mueve ${Math.abs(ritmoSem).toFixed(2)} kg por semana. Para mantener, intenta estabilizarlo.`,
    };
  }

  // Meta lograda: llegaste o te pasaste en la dirección de tu objetivo
  const direccion = Math.sign(metaKg - inicioKg);
  if ((tendencia - metaKg) * direccion >= -0.2) {
    return { ...comun, estado: "lograda", faltanKg: 0, mensaje: "¡Llegaste a tu meta! Ahora toca sostenerla." };
  }

  const haciaMeta = Math.sign(b) === Math.sign(faltan);
  if (!haciaMeta && Math.abs(ritmoSem) >= 0.1) {
    return {
      ...comun,
      estado: "contrario",
      mensaje: `Tu tendencia va en sentido contrario a tu meta (${ritmoSem > 0 ? "+" : ""}${ritmoSem.toFixed(2)} kg/sem). Revisa tu plan y vuelve a medir en unos días.`,
    };
  }
  if (!haciaMeta || Math.abs(ritmoSem) < 0.05) {
    return {
      ...comun,
      estado: "estancado",
      mensaje: "Tu peso casi no cambia por ahora, así que no puedo estimar una fecha. Mantén el plan unos días más.",
    };
  }

  const rapidoSem = Math.abs(b);
  const semanas = Math.abs(faltan) / (rapidoSem * 7);
  if (semanas > MAX_SEMANAS) {
    return {
      ...comun,
      estado: "estancado",
      mensaje: "A este ritmo tardarías más de 2 años. Un ajuste pequeño en tu plan puede acortarlo mucho.",
    };
  }

  // Rango: pendiente ± error estándar, con un mínimo de ±15 % (±30 % si hay pocos datos)
  const margenMin = confianza === "baja" ? 0.3 : 0.15;
  const rapida = rapidoSem + se;
  const lenta = Math.max(rapidoSem - se, 0);
  let semMin = Math.abs(faltan) / (rapida * 7);
  let semMax = lenta > 0.0001 ? Math.abs(faltan) / (lenta * 7) : MAX_SEMANAS;
  semMin = Math.min(semMin, semanas * (1 - margenMin));
  semMax = Math.max(semMax, semanas * (1 + margenMin));
  semMax = Math.min(semMax, MAX_SEMANAS);

  const fechaCentral = sumarDias(hoy, semanas * 7);
  const fechaMin = sumarDias(hoy, semMin * 7);
  const fechaMax = sumarDias(hoy, semMax * 7);

  const pctSem = (rapidoSem * 7) / tendencia;
  const advertencia =
    pctSem > 0.01
      ? "Vas a un ritmo muy rápido (más de 1 % de tu peso por semana). Puede ser difícil de sostener."
      : undefined;

  return {
    ...comun,
    estado: "ok",
    semanasCentral: redondear(semanas, 1),
    fechaCentral,
    fechaMin,
    fechaMax,
    rango: rangoTexto(fechaMin, fechaMax, hoy),
    mensaje:
      confianza === "baja"
        ? "Estimación inicial: se afinará con más pesajes."
        : "Si sigues a este ritmo, llegarías en ese rango de fechas.",
    advertencia,
  };
}
