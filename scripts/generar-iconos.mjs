// Genera los iconos PNG de la app instalable (PWA) a partir del mismo dibujo de icon.svg:
// una "T" lima sobre fondo oscuro. Sin dependencias: dibuja con supermuestreo y codifica PNG a mano.
// Uso: node scripts/generar-iconos.mjs   (deja los archivos en /public)
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

// "T" del icon.svg en un lienzo de 64 × 64
const T = [
  [14, 22], [50, 22], [50, 30], [36, 30], [36, 52], [28, 52], [28, 30], [14, 30],
];
const FONDO = [10, 12, 11];
const LIMA = [205, 255, 64];

function dentro(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function dentroRedondeado(x, y, w, r) {
  // cuadrado redondeado que ocupa todo el lienzo
  const cx = Math.min(Math.max(x, r), w - r);
  const cy = Math.min(Math.max(y, r), w - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

function crc32(buf) {
  let c;
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(tipo, datos) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([len, cuerpo, crc]);
}

function png(size, { maskable }) {
  const SS = 4; // supermuestreo 4×4
  const raw = Buffer.alloc((size * 4 + 1) * size);
  // En el icono "maskable" el fondo llena todo y el dibujo se reduce a la zona segura (≈ 66 %)
  const escala = maskable ? 0.62 : 0.9;
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) / SS;
          const y = py + (sy + 0.5) / SS;
          const enFondo = maskable || dentroRedondeado(x, y, size, size * 0.25);
          if (!enFondo) continue;
          // coordenadas del dibujo (64×64) centradas y escaladas
          const u = ((x / size - 0.5) / escala) * 64 + 32;
          const v = ((y / size - 0.5) / escala) * 64 + 32;
          const col = dentro(T, u, v) ? LIMA : FONDO;
          r += col[0]; g += col[1]; b += col[2]; a += 255;
        }
      }
      const n = SS * SS;
      const o = py * (size * 4 + 1) + 1 + px * 4;
      const cubierto = a / 255;
      raw[o] = cubierto ? Math.round(r / cubierto) : 0;
      raw[o + 1] = cubierto ? Math.round(g / cubierto) : 0;
      raw[o + 2] = cubierto ? Math.round(b / cubierto) : 0;
      raw[o + 3] = Math.round(a / n);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8 bits
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const salidas = [
  ["public/icon-192.png", 192, false],
  ["public/icon-512.png", 512, false],
  ["public/icon-maskable-512.png", 512, true],
  ["public/apple-touch-icon.png", 180, true],
];
for (const [ruta, tam, maskable] of salidas) {
  writeFileSync(ruta, png(tam, { maskable }));
  console.log("✔", ruta);
}
