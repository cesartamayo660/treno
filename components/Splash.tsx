"use client";

import React, { useEffect, useState } from "react";
import { Creature } from "@/components/Creature";

/** Tiempo mínimo que se ve la animación completa (ms desde que abrió la página). */
const DURACION = 3600;
const SESION = "treno:splash";

function Chispa({ className, delay }: { className: string; delay: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`sp-spark absolute h-5 w-5 ${className}`} style={{ animationDelay: delay }} aria-hidden>
      <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="rgb(var(--c-accent))" />
    </svg>
  );
}

/**
 * Pantalla de inicio: Treno (cachorro) hace sentadillas con la barra y evoluciona a Bestia.
 * Todo es CSS (ver globals.css) para que arranque desde el primer pintado, antes de que cargue
 * el JavaScript: así no hay pantalla en blanco. Toca para saltarla cuando la app ya esté lista.
 */
export function Splash({ listo }: { listo: boolean }) {
  const [fase, setFase] = useState<"visible" | "saliendo" | "fuera">("visible");

  useEffect(() => {
    if (!listo || fase !== "visible") return;
    let corta = false;
    try {
      corta =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches || sessionStorage.getItem(SESION) === "1";
      sessionStorage.setItem(SESION, "1");
    } catch {
      /* sin almacenamiento */
    }
    // La animación empezó al abrir la página: se espera solo lo que falte
    const transcurrido = typeof performance !== "undefined" ? performance.now() : 0;
    const espera = Math.max(0, (corta ? 700 : DURACION) - transcurrido);
    const t = setTimeout(() => setFase("saliendo"), espera);
    return () => clearTimeout(t);
  }, [listo, fase]);

  useEffect(() => {
    if (fase !== "saliendo") return;
    const t = setTimeout(() => setFase("fuera"), 450);
    return () => clearTimeout(t);
  }, [fase]);

  if (fase === "fuera") return null;

  return (
    <div
      className={`treno-bg fixed inset-0 z-[100] flex flex-col items-center justify-center px-6 transition-opacity duration-[450ms] ${
        fase === "saliendo" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      onClick={() => listo && setFase("saliendo")}
      role="status"
      aria-label="Cargando TRENO"
    >
      <div className="relative h-72 w-72 sm:h-80 sm:w-80">
        <div
          className="sp-glow absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle, rgb(var(--c-accent) / 0.38), transparent 66%)" }}
        />

        {/* Fase 1: el cachorro hace sentadillas con la barra */}
        <div className="sp-a absolute inset-0">
          <Creature nivel={1} sinBrazos respira={false} className="h-full w-full" />
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden>
            <g stroke="rgb(var(--c-accent))" strokeWidth="11" strokeLinecap="round" fill="none">
              <path d="M62 140 Q40 134 38 104" />
              <path d="M138 140 Q160 134 162 104" />
            </g>
            <g fill="rgb(var(--c-ink))">
              <rect x="12" y="97" width="176" height="6" rx="3" opacity="0.8" />
              <rect x="10" y="72" width="11" height="56" rx="3" />
              <rect x="23" y="80" width="8" height="40" rx="3" opacity="0.85" />
              <rect x="179" y="72" width="11" height="56" rx="3" />
              <rect x="169" y="80" width="8" height="40" rx="3" opacity="0.85" />
            </g>
          </svg>
        </div>

        {/* Fase 2: se pone fuerte */}
        <div className="sp-b absolute inset-0">
          <Creature nivel={3} className="h-full w-full" />
        </div>

        <Chispa className="left-1 top-10" delay="2.35s" />
        <Chispa className="right-0 top-4" delay="2.5s" />
        <Chispa className="bottom-16 right-1" delay="2.65s" />
      </div>

      <p className="sp-txt mt-2 font-display text-5xl font-bold tracking-tight sm:text-6xl">TRENO</p>
      <p className="sp-txt mt-2 text-sm text-white/55" style={{ animationDelay: "2.4s" }}>
        Tu progreso, en un juego justo
      </p>
    </div>
  );
}
