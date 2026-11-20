"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Crown,
  Dumbbell,
  Flame,
  Layers,
  Lock,
  MapPin,
  Medal,
  Mountain,
  Scale,
  Share2,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { IconoInsignia, Rareza, RAREZA_INFO } from "@/lib/badges";
import { InsigniaConFecha, useBadges } from "@/lib/badgesProvider";
import { useTreno } from "@/lib/store";
import { Confetti } from "@/components/motion";
import { Eyebrow, Segmented, Sheet, SheetHeader } from "@/components/ui";
import { ShareSheet } from "@/components/ShareSheet";
import { fechaLarga } from "@/components/PrCelebration";
import type { DatosTarjeta } from "@/lib/shareCard";

const ICONOS: Record<IconoInsignia, React.ComponentType<{ className?: string }>> = {
  dumbbell: Dumbbell,
  flame: Flame,
  trophy: Trophy,
  pin: MapPin,
  scale: Scale,
  crown: Crown,
  zap: Zap,
  target: Target,
  layers: Layers,
  calendar: Calendar,
  medal: Medal,
  star: Star,
  mountain: Mountain,
};

/** Estilo por rareza, con un solo acento: cuanto más rara, más llena y brillante. */
const ESTILO: Record<Rareza, { borde: string; icono: string; extra: string }> = {
  comun: { borde: "border-white/20", icono: "bg-white/15 text-white", extra: "" },
  rara: { borde: "border-accent/50", icono: "bg-accent/20 text-accent", extra: "" },
  epica: { borde: "border-accent", icono: "bg-accent text-canvas", extra: "" },
  legendaria: { borde: "border-accent", icono: "bg-accent text-canvas", extra: "shadow-glow badge-shimmer" },
};

export function Estrellas({ rareza }: { rareza: Rareza }) {
  return (
    <span className="inline-flex gap-0.5 text-accent" aria-label={RAREZA_INFO[rareza].nombre}>
      {Array.from({ length: RAREZA_INFO[rareza].estrellas }, (_, i) => (
        <Star key={i} className="h-3 w-3 fill-current" />
      ))}
    </span>
  );
}

function IconoCaja({ i, grande = false }: { i: InsigniaConFecha; grande?: boolean }) {
  const Icon = ICONOS[i.def.icono];
  const est = ESTILO[i.def.rareza];
  const tam = grande ? "h-20 w-20 rounded-3xl" : "h-11 w-11 rounded-2xl";
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${tam} ${
        i.logrado ? `${est.icono} ${est.extra}` : "bg-white/10 text-white/45"
      }`}
    >
      {i.logrado ? <Icon className={grande ? "h-10 w-10" : "h-5 w-5"} /> : <Lock className={grande ? "h-8 w-8" : "h-4 w-4"} />}
    </span>
  );
}

function Tile({ i, onClick }: { i: InsigniaConFecha; onClick: () => void }) {
  const est = ESTILO[i.def.rareza];
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex h-full w-full flex-col rounded-2xl border p-3 text-left transition active:scale-[0.98] ${
          i.logrado ? `${est.borde} bg-white/[0.04]` : "border-white/10 opacity-70"
        }`}
      >
        <IconoCaja i={i} />
        <span className="mt-2.5 block text-[13px] font-semibold leading-tight">{i.def.titulo}</span>
        <span className="mt-1 block">
          {i.logrado ? (
            <Estrellas rareza={i.def.rareza} />
          ) : (
            <span className="num block text-[11px] text-white/45">
              {Math.min(Math.round(i.actual), i.meta).toLocaleString("es-PE")} / {i.meta.toLocaleString("es-PE")}
            </span>
          )}
        </span>
        {!i.logrado && (
          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/10">
            <span className="block h-full rounded-full bg-accent/70" style={{ width: `${Math.round(i.avance * 100)}%` }} />
          </span>
        )}
      </button>
    </li>
  );
}

function Detalle({ i, onClose }: { i: InsigniaConFecha | null; onClose: () => void }) {
  const { currentUser: u } = useTreno();
  const [share, setShare] = useState(false);
  const ultimo = React.useRef<InsigniaConFecha | null>(null);
  if (i) ultimo.current = i;
  const b = i ?? ultimo.current;

  const datos: DatosTarjeta | null = b
    ? {
        tipo: "insignia",
        etiqueta: `Insignia ${RAREZA_INFO[b.def.rareza].nombre.toLowerCase()}`,
        titulo: b.def.titulo,
        grande: "★".repeat(RAREZA_INFO[b.def.rareza].estrellas),
        subtitulo: b.def.descripcion,
        emoji: "🏅",
        nombre: u.nombre,
        fecha: fechaLarga(),
      }
    : null;

  return (
    <>
      <Sheet open={!!i} onClose={onClose} label="Detalle de insignia">
        {b && (
          <>
            <SheetHeader eyebrow={`Insignia ${RAREZA_INFO[b.def.rareza].nombre.toLowerCase()}`} title={b.def.titulo} onClose={onClose} />
            <div className="mt-6 flex flex-col items-center text-center">
              <IconoCaja i={b} grande />
              <div className="mt-3">
                <Estrellas rareza={b.def.rareza} />
              </div>
              <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-white/70">{b.def.descripcion}</p>
            </div>
            <div className="mt-5 rounded-2xl bg-white/[0.05] p-4">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-white/55">Progreso</span>
                <span className="num font-semibold">
                  {Math.min(Math.round(b.actual), b.meta).toLocaleString("es-PE")}
                  <span className="text-white/40"> / {b.meta.toLocaleString("es-PE")}</span>
                </span>
              </div>
              <span className="mt-2.5 block h-2 overflow-hidden rounded-full bg-white/10">
                <motion.span
                  className="block h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(b.avance * 100)}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </span>
              <p className="mt-2 text-xs text-white/45">
                {b.logrado
                  ? b.fecha
                    ? `Desbloqueada el ${b.fecha.split("-").reverse().join("/")}`
                    : "¡Desbloqueada!"
                  : `Te faltan ${Math.max(0, Math.ceil(b.meta - b.actual)).toLocaleString("es-PE")} ${b.def.unidad}`}
              </p>
            </div>
            {b.logrado && (
              <button
                type="button"
                onClick={() => setShare(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 text-sm font-semibold text-canvas shadow-glow transition active:scale-[0.99]"
              >
                <Share2 className="h-4 w-4" />
                Compartir esta insignia
              </button>
            )}
          </>
        )}
      </Sheet>
      <ShareSheet open={share} onClose={() => setShare(false)} datos={datos} />
    </>
  );
}

/** Sección de insignias para el Perfil: las mejores a la vista y el catálogo completo en una hoja. */
export function BadgesSection() {
  const { insignias, logradas } = useBadges();
  const [todas, setTodas] = useState(false);
  const [filtro, setFiltro] = useState<"todas" | "logradas" | "pendientes">("todas");
  const [det, setDet] = useState<InsigniaConFecha | null>(null);

  const orden = useMemo(() => {
    const peso: Record<Rareza, number> = { comun: 0, rara: 1, epica: 2, legendaria: 3 };
    const ganadas = insignias
      .filter((i) => i.logrado)
      .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? "") || peso[b.def.rareza] - peso[a.def.rareza]);
    const pendientes = insignias.filter((i) => !i.logrado).sort((a, b) => b.avance - a.avance);
    return { ganadas, pendientes };
  }, [insignias]);

  // Muestra las últimas ganadas y las más cercanas a lograrse
  const destacadas = [...orden.ganadas.slice(0, 3), ...orden.pendientes.slice(0, 6 - Math.min(3, orden.ganadas.length))].slice(0, 6);

  const lista = useMemo(
    () =>
      filtro === "logradas"
        ? orden.ganadas
        : filtro === "pendientes"
        ? orden.pendientes
        : [...orden.ganadas, ...orden.pendientes],
    [filtro, orden]
  );

  // El detalle se mantiene actualizado
  const detActual = det ? insignias.find((x) => x.def.id === det.def.id) ?? det : null;

  return (
    <section className="glass-card rounded-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <Eyebrow>Insignias</Eyebrow>
        <span className="text-xs font-semibold text-accent">
          {logradas} de {insignias.length}
        </span>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {destacadas.map((i) => (
          <Tile key={i.def.id} i={i} onClick={() => setDet(i)} />
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setTodas(true)}
        className="mt-4 w-full rounded-full border border-white/15 py-3 text-sm font-semibold transition hover:bg-white/5"
      >
        Ver las {insignias.length} insignias
      </button>

      <Sheet open={todas} onClose={() => setTodas(false)} label="Todas las insignias" maxWidth="max-w-lg">
        <SheetHeader eyebrow={`${logradas} de ${insignias.length} desbloqueadas`} title="Tus insignias" onClose={() => setTodas(false)} />
        <div className="mt-4">
          <Segmented
            label="Filtrar insignias"
            value={filtro}
            onChange={setFiltro}
            options={[
              { id: "todas", label: "Todas" },
              { id: "logradas", label: "Logradas" },
              { id: "pendientes", label: "Pendientes" },
            ]}
          />
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {lista.map((i) => (
            <Tile key={i.def.id} i={i} onClick={() => setDet(i)} />
          ))}
        </ul>
        {lista.length === 0 && <p className="mt-6 text-center text-sm text-white/45">Aquí aparecerán tus insignias.</p>}
      </Sheet>

      <Detalle i={detActual} onClose={() => setDet(null)} />
    </section>
  );
}

/** Aviso de insignia recién desbloqueada (una a la vez, sobre cualquier pantalla). */
export function BadgeToast({ onVer }: { onVer: () => void }) {
  const { anuncio, cerrarAnuncio } = useBadges();

  useEffect(() => {
    if (!anuncio) return;
    try {
      navigator.vibrate?.([30, 50, 30]);
    } catch {
      /* noop */
    }
    const t = setTimeout(cerrarAnuncio, 5500);
    return () => clearTimeout(t);
  }, [anuncio, cerrarAnuncio]);

  return (
    <AnimatePresence>
      {anuncio && (
        <motion.button
          key={anuncio.def.id}
          type="button"
          onClick={() => {
            cerrarAnuncio();
            onVer();
          }}
          initial={{ opacity: 0, y: -30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 280 }}
          className="fixed inset-x-4 top-[max(env(safe-area-inset-top),1rem)] z-[85] mx-auto flex max-w-sm items-center gap-3.5 overflow-hidden rounded-[26px] border border-accent/50 bg-raised p-3.5 pr-5 text-left shadow-glow"
          role="status"
          aria-live="polite"
        >
          {anuncio.def.rareza !== "comun" && <Confetti count={anuncio.def.rareza === "legendaria" ? 36 : 22} />}
          <span className="relative">
            <IconoCaja i={anuncio} />
          </span>
          <span className="relative min-w-0">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              Insignia {RAREZA_INFO[anuncio.def.rareza].nombre.toLowerCase()}
              <Estrellas rareza={anuncio.def.rareza} />
            </span>
            <span className="mt-0.5 block truncate font-display text-base font-semibold">{anuncio.def.titulo}</span>
            <span className="block truncate text-xs text-white/55">{anuncio.def.descripcion}</span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
