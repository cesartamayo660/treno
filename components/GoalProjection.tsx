"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ChevronDown, Flag, PartyPopper, Scale } from "lucide-react";
import { useTreno } from "@/lib/store";
import { todayIso } from "@/lib/freshUser";
import { fechaCorta, proyectarMeta } from "@/lib/projection";
import { Eyebrow } from "@/components/ui";

const CONF_TEXTO = { baja: "Confianza baja", media: "Confianza media", alta: "Confianza alta" } as const;
const CONF_BARRAS = { baja: 1, media: 2, alta: 3 } as const;

/** "¿Cuándo llego a mi meta?": un rango de fechas honesto, no una fecha exacta. */
export function GoalProjection({ onRegister }: { onRegister: () => void }) {
  const { currentUser: u } = useTreno();
  const [how, setHow] = useState(false);
  const hoy = todayIso();

  const p = useMemo(
    () =>
      proyectarMeta(
        u.pesajesHistoricos ?? u.pesajesUltimos14Dias.map((x) => ({ fecha: x.fecha, pesoKg: x.pesoKg })),
        u.reporteActual.meta.pesoMetaKg,
        u.perfilInicial.pesoKg,
        hoy
      ),
    [u, hoy]
  );

  const meta = u.reporteActual.meta.pesoMetaKg;
  const signo = p.ritmoKgSem > 0 ? "+" : p.ritmoKgSem < 0 ? "−" : "";
  const ritmo = `${signo}${Math.abs(p.ritmoKgSem).toFixed(2)} kg/sem`;

  // Línea de tiempo: hoy → fin del rango (con margen)
  const linea = useMemo(() => {
    if (p.estado !== "ok" || !p.fechaMin || !p.fechaMax || p.semanasCentral === undefined) return null;
    const dias = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86_400_000;
    const total = Math.max(1, dias(hoy, p.fechaMax) * 1.12);
    const pos = (f: string) => Math.max(0, Math.min(100, (dias(hoy, f) / total) * 100));
    return { ini: pos(p.fechaMin), fin: pos(p.fechaMax), centro: pos(p.fechaCentral!) };
  }, [p, hoy]);

  return (
    <section className="glass-card rounded-card p-5 sm:p-6" aria-label="Proyección de tu meta">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">¿Cuándo llegas a tu meta?</h2>
          <p className="text-xs text-white/45">
            Meta: {meta} kg · tendencia {p.pesoTendenciaKg ? `${p.pesoTendenciaKg} kg` : "—"}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <Flag className="h-5 w-5" />
        </span>
      </div>

      {p.estado === "sin-datos" && (
        <div className="mt-4">
          <div className="flex items-center gap-2" aria-label={`${Math.min(p.pesajes, 3)} de 3 pesajes`}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`flex h-10 flex-1 items-center justify-center rounded-xl text-sm font-semibold ${
                  i < p.pesajes ? "bg-accent text-canvas" : "border border-dashed border-white/20 text-white/35"
                }`}
              >
                {i < p.pesajes ? <Scale className="h-4 w-4" /> : i + 1}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-white/65">{p.mensaje}</p>
          <button
            type="button"
            onClick={onRegister}
            className="mt-4 w-full rounded-full bg-accent py-3.5 text-sm font-semibold text-canvas shadow-glow transition active:scale-[0.99]"
          >
            Registrar mi peso de hoy
          </button>
        </div>
      )}

      {p.estado === "ok" && p.rango && (
        <div className="mt-4">
          <Eyebrow>Llegarías a {meta} kg entre</Eyebrow>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="num mt-2 text-[2.1rem] font-semibold leading-none text-accent sm:text-4xl"
          >
            {p.rango}
          </motion.p>
          <p className="mt-2 text-sm text-white/55">
            Fecha más probable: <strong className="text-white">{fechaCorta(p.fechaCentral!, true)}</strong> · {Math.round(p.semanasCentral ?? 0)} semanas
          </p>

          {linea && (
            <div className="mt-5" aria-hidden>
              <div className="relative h-2.5 rounded-full bg-white/10">
                <motion.span
                  className="absolute inset-y-0 rounded-full bg-accent/35"
                  initial={{ width: 0 }}
                  animate={{ width: `${linea.fin - linea.ini}%` }}
                  style={{ left: `${linea.ini}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                <span className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-4 ring-canvas" style={{ left: `${linea.centro}%` }} />
                <span className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white ring-4 ring-canvas" />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-white/40">
                <span>Hoy</span>
                <span>Meta</span>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="num rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">{ritmo}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-white/70">
              <span className="flex items-end gap-0.5" aria-hidden>
                {[1, 2, 3].map((n) => (
                  <span
                    key={n}
                    className={`w-1 rounded-sm ${n <= CONF_BARRAS[p.confianza] ? "bg-accent" : "bg-white/20"}`}
                    style={{ height: 4 + n * 3 }}
                  />
                ))}
              </span>
              {CONF_TEXTO[p.confianza]}
            </span>
          </div>
          <p className="mt-3 text-[13px] leading-snug text-white/50">{p.mensaje}</p>
          {p.advertencia && (
            <p className="mt-3 flex items-start gap-2 rounded-2xl bg-warn/10 p-3 text-[13px] leading-snug text-warn">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {p.advertencia}
            </p>
          )}
        </div>
      )}

      {p.estado === "lograda" && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-accent/15 p-4">
          <PartyPopper className="h-8 w-8 shrink-0 text-accent" />
          <p className="text-[15px] font-semibold leading-snug">{p.mensaje}</p>
        </div>
      )}

      {(p.estado === "contrario" || p.estado === "estancado" || p.estado === "mantener") && (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <span className="num rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">{ritmo}</span>
            <span className="text-xs text-white/45">
              {p.pesajes} pesajes en {p.diasCubiertos} días
            </span>
          </div>
          <p
            className={`mt-3 rounded-2xl p-3.5 text-[14px] leading-snug ${
              p.estado === "contrario" ? "bg-warn/10 text-warn" : "bg-white/[0.05] text-white/70"
            }`}
          >
            {p.mensaje}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setHow((v) => !v)}
        aria-expanded={how}
        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-white/45 transition hover:text-white"
      >
        ¿Cómo se calcula?
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${how ? "rotate-180" : ""}`} />
      </button>
      {how && (
        <p className="mt-2 text-[13px] leading-relaxed text-white/55">
          Trazo una recta con tus pesajes de los últimos 28 días (así un día con el peso alto o bajo no la mueve).
          Su pendiente es tu ritmo por semana y, con lo que te falta, saco la fecha. El rango sale del margen de error
          de esa recta: con pocos pesajes es más ancho y se afina al registrar más. Necesito al menos 3 pesajes en
          una semana para dar una fecha.
        </p>
      )}
    </section>
  );
}
