"use client";

/**
 * Tarjetas para compartir (WhatsApp, historias, etc.): se dibujan en un <canvas>
 * de 1080 × 1920 (formato vertical) y se comparten como imagen con el menú nativo
 * del celular. Sin servidor, sin librerías.
 */

export type TipoTarjeta = "pr" | "sesion" | "racha" | "insignia";

export interface DatosTarjeta {
  tipo: TipoTarjeta;
  /** Línea pequeña en mayúsculas sobre el título. */
  etiqueta: string;
  titulo: string;
  /** Cifra protagonista, ya formateada ("100", "12"). */
  grande: string;
  unidad?: string;
  subtitulo?: string;
  /** Hasta 3 datos extra en una fila. */
  datos?: { valor: string; nombre: string }[];
  /** Emoji decorativo grande. */
  emoji?: string;
  nombre: string;
  fecha: string;
}

const W = 1080;
const H = 1920;
const LIMA = "#cdff40";
const FONDO = "#0a0c0b";
const TINTA = "#f1f5f0";

function familiaDisplay(): string {
  try {
    const el = document.createElement("span");
    el.className = "num";
    el.style.cssText = "position:absolute;visibility:hidden";
    document.body.appendChild(el);
    const f = getComputedStyle(el).fontFamily;
    el.remove();
    return f || "system-ui, sans-serif";
  } catch {
    return "system-ui, sans-serif";
  }
}

function rectRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function lineas(ctx: CanvasRenderingContext2D, texto: string, ancho: number, max = 3): string[] {
  const palabras = texto.split(/\s+/);
  const out: string[] = [];
  let actual = "";
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width > ancho && actual) {
      out.push(actual);
      actual = p;
    } else actual = prueba;
  }
  if (actual) out.push(actual);
  if (out.length > max) {
    const recorte = out.slice(0, max);
    recorte[max - 1] = recorte[max - 1].replace(/\s*\S*$/, "…");
    return recorte;
  }
  return out;
}

/** Piezas de confeti deterministas (siempre salen iguales para los mismos datos). */
function semilla(texto: string) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export async function dibujarTarjeta(d: DatosTarjeta): Promise<Blob> {
  const display = familiaDisplay();
  try {
    await Promise.all([document.fonts.load(`700 120px ${display}`), document.fonts.load("600 40px Inter")]);
  } catch {
    /* sigue con la fuente de respaldo */
  }

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  // Fondo con halos de acento
  ctx.fillStyle = FONDO;
  ctx.fillRect(0, 0, W, H);
  let g = ctx.createRadialGradient(140, 120, 0, 140, 120, 900);
  g.addColorStop(0, "rgba(205,255,64,0.20)");
  g.addColorStop(1, "rgba(205,255,64,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  g = ctx.createRadialGradient(W, H, 0, W, H, 900);
  g.addColorStop(0, "rgba(205,255,64,0.14)");
  g.addColorStop(1, "rgba(205,255,64,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Confeti
  const rnd = semilla(d.titulo + d.grande + d.tipo);
  for (let i = 0; i < 46; i++) {
    const x = rnd() * W;
    const y = 520 + rnd() * 900;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rnd() * Math.PI);
    ctx.globalAlpha = 0.12 + rnd() * 0.28;
    ctx.fillStyle = rnd() > 0.35 ? LIMA : TINTA;
    ctx.fillRect(-7, -14, 14 + rnd() * 8, 26 + rnd() * 14);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  const pad = 92;

  // Marca
  rectRedondeado(ctx, pad, 96, 104, 104, 26);
  ctx.fillStyle = LIMA;
  ctx.fill();
  ctx.fillStyle = FONDO;
  ctx.beginPath();
  const k = 104 / 64; // la "T" del icono, a la escala del cuadro
  [[14, 22], [50, 22], [50, 30], [36, 30], [36, 52], [28, 52], [28, 30], [14, 30]].forEach(([px, py], i) => {
    const x = pad + px * k;
    const y = 96 + py * k;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = TINTA;
  ctx.font = `700 64px ${display}`;
  ctx.textBaseline = "middle";
  ctx.fillText("TRENO", pad + 134, 150);

  // Etiqueta y título
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = LIMA;
  ctx.font = `700 42px ${display}`;
  ctx.fillText(d.etiqueta.toUpperCase(), pad, 330);

  ctx.fillStyle = TINTA;
  ctx.font = `700 92px ${display}`;
  const tit = lineas(ctx, d.titulo, W - pad * 2, 2);
  tit.forEach((l, i) => ctx.fillText(l, pad, 440 + i * 106));
  const yTrasTitulo = 440 + tit.length * 106;

  // Cifra protagonista dentro de un anillo
  const R = 300;
  const cx = W / 2;
  const cy = Math.max(yTrasTitulo + 340, 880);
  ctx.lineWidth = 22;
  ctx.strokeStyle = "rgba(241,245,240,0.10)";
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = LIMA;
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(205,255,64,0.55)";
  ctx.shadowBlur = 36;
  ctx.beginPath();
  ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.55);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.textAlign = "center";
  if (d.emoji) {
    ctx.fillStyle = TINTA;
    ctx.font = "104px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji'";
    ctx.fillText(d.emoji, cx, cy - 175);
  }
  ctx.fillStyle = LIMA;
  const tam = d.grande.length > 5 ? 150 : d.grande.length > 4 ? 190 : d.grande.length > 3 ? 230 : 270;
  ctx.font = `700 ${tam}px ${display}`;
  const base = cy + tam * 0.36; // línea base de las cifras
  ctx.fillText(d.grande, cx, base);
  if (d.unidad) {
    ctx.fillStyle = "rgba(241,245,240,0.6)";
    ctx.font = `600 50px ${display}`;
    ctx.fillText(d.unidad, cx, base + 78);
  }

  // Subtítulo
  let y = cy + R + 90;
  if (d.subtitulo) {
    ctx.fillStyle = TINTA;
    ctx.font = `600 50px ${display}`;
    const sub = lineas(ctx, d.subtitulo, W - pad * 2, d.datos?.length ? 1 : 2);
    sub.forEach((l, i) => ctx.fillText(l, cx, y + i * 62));
    y += sub.length * 62 + 26;
  }

  // Datos en fila
  if (d.datos?.length) {
    const n = Math.min(3, d.datos.length);
    const ancho = (W - pad * 2 - (n - 1) * 24) / n;
    d.datos.slice(0, n).forEach((x, i) => {
      const px = pad + i * (ancho + 24);
      rectRedondeado(ctx, px, y, ancho, 170, 36);
      ctx.fillStyle = "rgba(241,245,240,0.07)";
      ctx.fill();
      ctx.fillStyle = TINTA;
      ctx.font = `700 68px ${display}`;
      ctx.fillText(x.valor, px + ancho / 2, y + 82);
      ctx.fillStyle = "rgba(241,245,240,0.5)";
      ctx.font = `500 30px Inter, system-ui, sans-serif`;
      ctx.fillText(x.nombre, px + ancho / 2, y + 132);
    });
  }

  // Pie
  ctx.textAlign = "left";
  ctx.fillStyle = TINTA;
  ctx.font = `700 54px ${display}`;
  ctx.fillText(d.nombre, pad, H - 170);
  ctx.fillStyle = "rgba(241,245,240,0.5)";
  ctx.font = `500 34px Inter, system-ui, sans-serif`;
  ctx.fillText(d.fecha, pad, H - 118);
  ctx.textAlign = "right";
  ctx.fillStyle = LIMA;
  ctx.font = `700 34px ${display}`;
  ctx.fillText("Progreso justo en el gym", W - pad, H - 118);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/png")
  );
}

/** Texto que acompaña a la imagen en WhatsApp. */
export function textoParaCompartir(d: DatosTarjeta): string {
  let url = "";
  try {
    if (/^https:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname)) url = `\n${location.origin}`;
  } catch {
    /* sin ubicación */
  }
  const base: Record<TipoTarjeta, string> = {
    pr: `🏆 ¡Nuevo récord! ${d.titulo}: ${d.grande}${d.unidad ? ` ${d.unidad}` : ""}`,
    sesion: `💪 Sesión terminada: ${d.titulo}`,
    racha: `🔥 ${d.grande} ${d.unidad ?? "días"} de racha entrenando`,
    insignia: `🏅 Insignia desbloqueada: ${d.titulo}`,
  };
  return `${base[d.tipo]}\nEntrenando con TRENO${url}`;
}

export type ResultadoCompartir = "compartido" | "cancelado" | "whatsapp";

/** Abre el menú nativo para compartir la imagen (elige WhatsApp ahí). Si no se puede, abre WhatsApp con el texto. */
export async function compartirImagen(blob: Blob, texto: string): Promise<ResultadoCompartir> {
  const archivo = new File([blob], "treno.png", { type: "image/png" });
  try {
    if (navigator.canShare?.({ files: [archivo] })) {
      await navigator.share({ files: [archivo], text: texto });
      return "compartido";
    }
  } catch (e) {
    if ((e as DOMException)?.name === "AbortError") return "cancelado";
  }
  // Respaldo (escritorio): se guarda la imagen y se abre WhatsApp con el mensaje
  descargarImagen(blob);
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  return "whatsapp";
}

export function descargarImagen(blob: Blob, nombre = "treno.png") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
