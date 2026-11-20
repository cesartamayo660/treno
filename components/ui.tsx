"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/** Iniciales para avatares sin foto. */
export function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

interface AvatarProps {
  nombre: string;
  src?: string;
  className?: string;
}

/** Avatar con foto y respaldo a iniciales (si no hay foto o no carga). */
export function Avatar({ nombre, src, className = "h-10 w-10" }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={nombre}
        onError={() => setFailed(true)}
        className={`${className} shrink-0 rounded-full object-cover ring-1 ring-white/15`}
      />
    );
  }
  return (
    <span
      aria-label={nombre}
      className={`${className} num inline-flex shrink-0 items-center justify-center rounded-full bg-accent/15 text-[0.8em] font-semibold text-accent ring-1 ring-accent/30`}
    >
      {initials(nombre)}
    </span>
  );
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Ancho máximo en escritorio. */
  maxWidth?: string;
  label?: string;
  /** Clase de z-index (para abrir una hoja encima del modo gimnasio). */
  z?: string;
}

/** Hoja inferior en móvil, diálogo centrado en escritorio. Cierra con Esc o tocando fuera. */
export function Sheet({ open, onClose, children, maxWidth = "max-w-md", label, z = "z-[60]" }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className={`fixed inset-0 ${z} flex items-end justify-center sm:items-center sm:p-6`}
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            className={`relative z-10 flex max-h-[92dvh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-raised text-white shadow-2xl sm:rounded-[28px]`}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/20 sm:hidden" />
            <div className="overflow-y-auto overscroll-contain p-5 pb-safe sm:p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function SheetHeader({
  eyebrow,
  title,
  onClose,
}: {
  eyebrow?: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
        )}
        <h3 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight">{title}</h3>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Interruptor accesible. */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? "bg-accent" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full shadow transition-all ${
          checked ? "left-[22px] bg-canvas" : "left-0.5 bg-white"
        }`}
      />
    </button>
  );
}

/** Selector segmentado de 2–4 opciones. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-white/[0.07] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            value === o.id ? "bg-white text-canvas" : "text-white/60 hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Rótulo pequeño en mayúsculas para encabezar bloques. */
export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50 ${className}`}>
      {children}
    </p>
  );
}
