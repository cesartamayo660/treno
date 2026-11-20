"use client";

import React, { useMemo } from "react";
import { motion, Variants } from "framer-motion";

/** Contenedor que entra con sus hijos escalonados. Usa <Item> para cada hijo. */
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 26, stiffness: 260 } },
};

export function Stagger({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={container} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

export function Item({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={item}>
      {children}
    </motion.div>
  );
}

/** Ráfaga de confeti con la paleta de la app. Se monta y desaparece sola. */
export function Confetti({ count = 26 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
        const dist = 90 + Math.random() * 130;
        return {
          i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 40,
          r: Math.random() * 540 - 270,
          w: 6 + Math.random() * 6,
          h: 8 + Math.random() * 10,
          d: Math.random() * 0.12,
          accent: i % 3 !== 0,
        };
      }),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-visible" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.i}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: p.x, y: p.y + 70, opacity: 0, rotate: p.r, scale: 1 }}
          transition={{ duration: 1.15, delay: p.d, ease: [0.16, 0.8, 0.3, 1] }}
          className={`absolute rounded-[2px] ${p.accent ? "bg-accent" : "bg-white"}`}
          style={{ width: p.w, height: p.h }}
        />
      ))}
    </div>
  );
}

/** Barra de progreso que se llena con animación. */
export function GrowBar({
  value,
  className = "",
  delay = 0,
}: {
  value: number; // 0..1
  className?: string;
  delay?: number;
}) {
  return (
    <span className={`block h-1.5 overflow-hidden rounded-full bg-white/10 ${className}`}>
      <motion.span
        className="block h-full rounded-full bg-accent"
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        transition={{ duration: 0.9, delay, ease: "easeOut" }}
      />
    </span>
  );
}
