// Deja un index.html funcional en la raíz del proyecto después de `next build`.
// 1) Toma la exportación estática de /out.
// 2) Convierte las rutas absolutas (/_next/...) en relativas, para que el index.html
//    abra con doble clic (file://) y también funcione en cualquier hosting/subcarpeta.
// 3) Copia el resultado a la raíz del proyecto (index.html + _next/ + manifest + icono).
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = "out";
if (!existsSync(join(out, "index.html"))) {
  console.error("No se encontró out/index.html. Ejecuta primero `next build`.");
  process.exit(1);
}

function walk(dir, fn) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    statSync(p).isDirectory() ? walk(p, fn) : fn(p);
  }
}

// Rutas relativas: HTML en la raíz, CSS en _next/static/css/, JS resuelve contra el documento.
walk(out, (p) => {
  const rel = p.split("\\").join("/");
  if (rel.endsWith(".html")) {
    const depth = rel.split("/").length - 2; // out/index.html -> 0
    const prefix = depth === 0 ? "./" : "../".repeat(depth);
    let s = readFileSync(p, "utf8");
    s = s.replace(/(["'(])\/(_next\/|manifest\.json|icon\.svg|icon-192\.png|apple-touch-icon\.png|favicon\.ico)/g, `$1${prefix}$2`);
    writeFileSync(p, s);
  } else if (rel.endsWith(".css")) {
    let s = readFileSync(p, "utf8");
    s = s.replace(/url\(\/_next\/static\//g, "url(../");
    writeFileSync(p, s);
  } else if (rel.endsWith(".js") && rel.includes("/_next/static/")) {
    let s = readFileSync(p, "utf8");
    s = s.replace(/(["'`])\/_next\//g, "$1./_next/");
    writeFileSync(p, s);
  }
});

rmSync("_next", { recursive: true, force: true });
for (const item of [
  "index.html",
  "404.html",
  "_next",
  "manifest.json",
  "icon.svg",
  "favicon.ico",
  "sw.js",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "apple-touch-icon.png",
]) {
  if (existsSync(join(out, item))) cpSync(join(out, item), item, { recursive: true });
}
console.log("✔ index.html listo en la raíz del proyecto.");
