"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Check,
  ChevronRight,
  Dumbbell,
  Flame,
  MapPin,
  Target,
  Trophy,
} from "lucide-react";
import { useTreno } from "@/lib/store";
import { isoWeekday, todayIso } from "@/lib/freshUser";
import { gestoDelDia } from "@/lib/gestures";
import { CheckInSheet } from "@/components/CheckInSheet";
import { Confetti, GrowBar } from "@/components/motion";
import { CountUpNumber } from "@/components/CountUpNumber";
import { MainTabId } from "@/components/AppNav";
import { Eyebrow, Sheet, SheetHeader } from "@/components/ui";

interface HoyTabProps {
  onNavigateTab: (tab: MainTabId) => void;
}

const WEEK = [
  { id: 1, l: "L" },
  { id: 2, l: "M" },
  { id: 3, l: "X" },
  { id: 4, l: "J" },
  { id: 5, l: "V" },
  { id: 6, l: "S" },
  { id: 7, l: "D" },
];

export function HoyTab({ onNavigateTab }: HoyTabProps) {
  const { currentUser: u, crewMembers, doCheckInToday } = useTreno();
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const gesto = useMemo(() => gestoDelDia(todayIso()), []);

  const hoy = isoWeekday();
  const pactados = u.diasPactadosSemana.length;
  const cumplidos = u.diasCumplidosEstaSemana.filter((d) => u.diasPactadosSemana.includes(d)).length;
  const ringProgress = Math.min(1, cumplidos / Math.max(1, pactados));
  const tocaHoy = u.diasPactadosSemana.includes(hoy);

  const fecha = useMemo(() => {
    const s = new Date().toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, []);

  // Posición en el Crew
  const ranking = useMemo(
    () => [...crewMembers].sort((a, b) => b.trenoScore - a.trenoScore),
    [crewMembers]
  );
  const miPos = ranking.findIndex((m) => m.codigoDemo === "usuario_a") + 1;
  const siguiente = miPos > 1 ? ranking[miPos - 2] : null;
  const diffPts = siguiente ? siguiente.trenoScore - u.scoreSemanaActual.total : 0;

  // Avance hacia la meta de peso
  const meta = u.reporteActual.meta;
  const inicio = u.perfilInicial.pesoKg;
  const actual = u.perfilActual.pesoKg;
  const totalKg = Math.abs(meta.pesoMetaKg - inicio);
  const hechoKg = Math.abs(actual - inicio);
  const avanceMeta =
    totalKg < 0.05 ? 0 : Math.max(0, Math.min(1, hechoKg / totalKg)) * (Math.sign(meta.pesoMetaKg - inicio) === Math.sign(actual - inicio) || hechoKg === 0 ? 1 : 0);
  const faltanKg = Math.abs(meta.pesoMetaKg - actual);

  const r = 88;
  const C = 2 * Math.PI * r;

  const pilares = [
    { n: "Asistencia", p: u.scoreSemanaActual.pilares.asistencia, w: "30 %" },
    { n: "Fuerza relativa (DOTS)", p: u.scoreSemanaActual.pilares.fuerza, w: "25 %" },
    { n: "Progreso hacia tu meta", p: u.scoreSemanaActual.pilares.meta, w: "25 %" },
    { n: "Volumen de entrenamiento", p: u.scoreSemanaActual.pilares.volumen, w: "10 %" },
    { n: "Constancia de registro", p: u.scoreSemanaActual.pilares.registro, w: "10 %" },
  ];

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <section className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>{fecha}</Eyebrow>
          <h1 className="mt-1.5 truncate font-display text-[2rem] font-semibold leading-none tracking-tight sm:text-4xl">
            Hola, {u.nombre.split(" ")[0]}
          </h1>
        </div>
        <div
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5"
          title="Racha de días de gimnasio"
        >
          <Flame className="h-4 w-4 text-accent" />
          <span className="num text-sm font-semibold">{u.rachaDias}</span>
          <span className="text-xs text-white/50">{u.rachaDias === 1 ? "día" : "días"}</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-start [&>*]:min-w-0">
        {/* Protagonista: anillo semanal + score + acción */}
        <section className="glass-card rounded-card p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                u.checkedInHoy
                  ? "bg-accent/15 text-accent"
                  : tocaHoy
                  ? "bg-white/10 text-white"
                  : "bg-white/[0.06] text-white/55"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  u.checkedInHoy ? "bg-accent" : tocaHoy ? "animate-pulse bg-accent" : "bg-white/40"
                }`}
              />
              {u.checkedInHoy ? "Hoy cumplido" : tocaHoy ? "Hoy toca gimnasio" : "Hoy es día libre"}
            </span>
            <button
              type="button"
              onClick={() => setScoreOpen(true)}
              className="text-xs font-semibold text-white/55 underline-offset-4 transition hover:text-accent hover:underline"
            >
              Ver desglose
            </button>
          </div>

          <button
            type="button"
            onClick={() => setScoreOpen(true)}
            aria-label={`TRENO Score ${u.scoreSemanaActual.total} de 1000. Ver desglose`}
            className="relative mx-auto mt-4 block h-[15.5rem] w-[15.5rem] sm:h-72 sm:w-72"
          >
            <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
              <circle cx="100" cy="100" r={r} fill="none" strokeWidth="11" className="stroke-white/10" />
              <motion.circle
                cx="100"
                cy="100"
                r={r}
                fill="none"
                strokeWidth="11"
                strokeLinecap="round"
                stroke="rgb(var(--c-accent))"
                style={{ filter: "drop-shadow(0 0 8px rgb(var(--c-accent) / 0.55))" }}
                strokeDasharray={C}
                initial={{ strokeDashoffset: C }}
                animate={{ strokeDashoffset: C * (1 - ringProgress) }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <Eyebrow>TRENO Score</Eyebrow>
              <CountUpNumber
                value={u.scoreSemanaActual.total}
                className="num mt-2 text-[4.25rem] font-semibold sm:text-7xl"
              />
              <span className="mt-2 text-sm text-white/55">
                {cumplidos} de {pactados} días esta semana
              </span>
            </span>
          </button>

          {/* Semana */}
          <ol className="mt-5 grid grid-cols-7 gap-1.5" aria-label="Días de la semana">
            {WEEK.map((d) => {
              const pact = u.diasPactadosSemana.includes(d.id);
              const done = u.diasCumplidosEstaSemana.includes(d.id);
              const isToday = d.id === hoy;
              return (
                <li key={d.id} className="flex flex-col items-center gap-1.5">
                  <span
                    className={`flex h-9 w-full max-w-[2.75rem] items-center justify-center rounded-xl text-xs font-semibold transition ${
                      done
                        ? "bg-accent text-canvas"
                        : pact
                        ? "border border-white/25 text-white"
                        : "bg-white/[0.05] text-white/35"
                    } ${isToday ? "ring-2 ring-accent ring-offset-2 ring-offset-canvas" : ""}`}
                  >
                    {done ? <Check className="h-4 w-4 stroke-[3]" /> : d.l}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* Única acción principal */}
          <div className="relative mt-6">
            {celebrate && <Confetti count={34} />}
            {!u.checkedInHoy ? (
              <button
                type="button"
                onClick={() => setCheckInOpen(true)}
                className="pulse-glow flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-6 py-4 text-base font-semibold text-canvas transition active:scale-[0.99]"
              >
                <MapPin className="h-5 w-5 stroke-[2.4]" />
                Hacer check-in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateTab("entrenar")}
                className="flex w-full items-center justify-center gap-2.5 rounded-full bg-white px-6 py-4 text-base font-semibold text-canvas transition active:scale-[0.99]"
              >
                <Dumbbell className="h-5 w-5 stroke-[2.4]" />
                Empezar entrenamiento
              </button>
            )}
            <p className="mt-2.5 text-center text-xs text-white/40">{u.sedeGym}</p>
          </div>
        </section>

        {/* Contexto */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => onNavigateTab("crew")}
            className="glass-card flex w-full items-center gap-4 rounded-card p-4 text-left transition hover:border-white/20"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Trophy className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <Eyebrow>Tu Crew</Eyebrow>
              <span className="mt-1 block truncate text-[15px] font-semibold">
                {miPos === 1
                  ? "Vas 1.º esta semana"
                  : `Vas ${miPos}.º · a ${diffPts} pts de ${siguiente?.nombre.split(" ")[0]}`}
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-white/30" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("cuerpo")}
            className="glass-card block w-full rounded-card p-4 text-left transition hover:border-white/20"
          >
            <span className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <Target className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <Eyebrow className="truncate">Tu meta · {meta.etiquetaObjetivo.split(" (")[0]}</Eyebrow>
                <span className="mt-1 flex items-baseline gap-1.5">
                  <span className="num text-2xl font-semibold">{meta.pesoMetaKg}</span>
                  <span className="text-sm text-white/50">kg</span>
                  <span className="ml-auto text-xs text-white/50">
                    {totalKg < 0.1 ? "Mantén tu peso" : faltanKg < 0.1 ? "¡Meta lograda!" : `faltan ${faltanKg.toFixed(1)} kg`}
                  </span>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-white/30" />
            </span>
            <GrowBar value={avanceMeta} className="mt-3.5" delay={0.4} />
          </button>

          {/* Pilares compactos */}
          <section className="glass-card rounded-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">Tu semana en 5 pilares</h2>
              <span className="num text-sm text-white/45">{u.scoreSemanaActual.total} / 1000</span>
            </div>
            <ul className="mt-4 space-y-3.5">
              {pilares.map((x) => {
                const pct = x.p.maxBase ? Math.min(100, Math.round((x.p.puntos / x.p.maxBase) * 100)) : 0;
                return (
                  <li key={x.n}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-white/75">{x.n}</span>
                      <span className="num font-semibold">
                        {x.p.puntos}
                        <span className="text-white/35"> / {x.p.maxBase}</span>
                      </span>
                    </div>
                    <GrowBar value={pct / 100} className="mt-1.5 !h-1" delay={0.3} />
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>

      {/* Check-in con foto y gesto del día */}
      <CheckInSheet
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        gesto={gesto}
        sede={u.sedeGym}
        racha={u.rachaDias}
        onConfirm={(foto) => {
          doCheckInToday(foto, { id: gesto.id, nombre: gesto.nombre });
          setCheckInOpen(false);
          setCelebrate(true);
          setTimeout(() => setCelebrate(false), 1800);
        }}
      />

      {/* Desglose del score */}
      <Sheet open={scoreOpen} onClose={() => setScoreOpen(false)} label="Desglose del TRENO Score">
        <SheetHeader
          eyebrow="Sistema de puntos justo · 0–1000"
          title={`${u.scoreSemanaActual.total} puntos esta semana`}
          onClose={() => setScoreOpen(false)}
        />
        <ul className="mt-5 space-y-3">
          {pilares.map((x) => (
            <li key={x.n} className="rounded-2xl border border-white/10 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold">
                  {x.n} <span className="font-normal text-white/40">· {x.w}</span>
                </span>
                <span className="num text-sm font-semibold text-accent">
                  {x.p.puntos}
                  <span className="text-white/35"> / {x.p.maxBase}</span>
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-snug text-white/50">{x.p.detalle}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-white/40">
          Cada pilar se mide contra tu propio objetivo: por eso alguien que sube de peso y alguien que baja
          compiten de igual a igual.
        </p>
      </Sheet>
    </div>
  );
}
