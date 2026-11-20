"use client";

import React, { useState } from "react";
import {
  Award,
  Bell,
  Dumbbell,
  Eye,
  Flame,
  Lock,
  MapPin,
  Moon,
  RotateCcw,
  Scale,
  Sun,
  Target,
  Trophy,
} from "lucide-react";
import { useTreno } from "@/lib/store";
import { Avatar, Eyebrow, Segmented, Sheet, SheetHeader, Toggle } from "@/components/ui";

export function PerfilTab() {
  const { currentUser: u, themeMode, setThemeMode, toggleShareWeightPrivacy, resetApp } = useTreno();

  const [unit, setUnit] = useState<"kg" | "lb">("kg");
  const [notifs, setNotifs] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);

  const w = u.perfilActual.pesoKg;
  const peso = unit === "kg" ? `${w}` : `${(w * 2.20462).toFixed(1)}`;
  const estatura =
    unit === "kg"
      ? `${u.perfilActual.estaturaCm}`
      : `${(u.perfilActual.estaturaCm / 2.54).toFixed(1)}`;

  const st = u.estadisticasVitalicias;
  const tonelaje =
    st.tonelajeTotalKg >= 1000
      ? `${(st.tonelajeTotalKg / 1000).toFixed(1)} t`
      : `${Math.round(st.tonelajeTotalKg)} kg`;

  const logros = [
    { icon: Dumbbell, t: "Primer entrenamiento", d: "Registra una sesión completa", ok: st.entrenamientos >= 1 },
    { icon: MapPin, t: "Primer check-in", d: "Asiste a tu gimnasio", ok: st.diasGym >= 1 },
    { icon: Trophy, t: "Récord personal", d: "Rompe tu primer PR", ok: st.prsLogrados >= 1 },
    { icon: Flame, t: "Racha de 7 días", d: "Siete días seguidos", ok: u.rachaDias >= 7 },
  ];
  const desbloqueados = logros.filter((l) => l.ok).length;

  const stats = [
    { v: st.entrenamientos, l: "Entrenamientos" },
    { v: tonelaje, l: "Tonelaje movido" },
    { v: st.diasGym, l: "Días de gimnasio" },
    { v: st.prsLogrados, l: "Récords (PR)" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Perfil</h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start [&>*]:min-w-0">
        <div className="space-y-5">
          {/* Identidad */}
          <section className="glass-card rounded-card p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <Avatar nombre={u.nombre} src={u.avatar} className="h-16 w-16 text-xl" />
              <div className="min-w-0">
                <h2 className="truncate font-display text-2xl font-semibold tracking-tight">{u.nombre}</h2>
                <p className="truncate text-sm text-white/50">{u.handle}</p>
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                  <Target className="h-3 w-3" />
                  {u.reporteActual.meta.etiquetaObjetivo}
                </span>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-3 divide-x divide-white/10 rounded-2xl bg-white/[0.04] py-3.5 text-center">
              <div>
                <dt className="text-[11px] text-white/45">Edad</dt>
                <dd className="num mt-1.5 text-xl font-semibold">
                  {u.perfilActual.edad}
                  <span className="ml-1 text-xs text-white/40">años</span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-white/45">Estatura</dt>
                <dd className="num mt-1.5 text-xl font-semibold">
                  {estatura}
                  <span className="ml-1 text-xs text-white/40">{unit === "kg" ? "cm" : "in"}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-white/45">Peso</dt>
                <dd className="num mt-1.5 text-xl font-semibold text-accent">
                  {peso}
                  <span className="ml-1 text-xs text-white/40">{unit}</span>
                </dd>
              </div>
            </dl>

            <p className="mt-4 flex items-center gap-2 text-xs text-white/45">
              <MapPin className="h-3.5 w-3.5" />
              {u.sedeGym}
            </p>
          </section>

          {/* Estadísticas */}
          <section className="glass-card rounded-card p-5 sm:p-6">
            <Eyebrow>Estadísticas de por vida</Eyebrow>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {stats.map((s) => (
                <div key={s.l} className="rounded-2xl bg-white/[0.04] p-4">
                  <dd className="num text-3xl font-semibold">{s.v}</dd>
                  <dt className="mt-1.5 text-xs text-white/45">{s.l}</dt>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <div className="space-y-5">
          {/* Logros */}
          <section className="glass-card rounded-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <Eyebrow>Logros</Eyebrow>
              <span className="text-xs font-semibold text-accent">
                {desbloqueados} de {logros.length}
              </span>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {logros.map((l) => {
                const Icon = l.icon;
                return (
                  <li
                    key={l.t}
                    className={`rounded-2xl border p-3.5 transition ${
                      l.ok ? "border-accent/40 bg-accent/10" : "border-white/10 opacity-55"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        l.ok ? "bg-accent text-canvas" : "bg-white/10"
                      }`}
                    >
                      {l.ok ? <Icon className="h-[18px] w-[18px]" /> : <Lock className="h-4 w-4" />}
                    </span>
                    <p className="mt-2.5 text-[13px] font-semibold leading-tight">{l.t}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-white/45">{l.d}</p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Ajustes */}
          <section className="glass-card divide-y divide-white/10 rounded-card px-5 sm:px-6">
            <div className="flex items-center justify-between gap-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                {u.comparteKilos ? (
                  <Eye className="h-5 w-5 shrink-0 text-accent" />
                ) : (
                  <Lock className="h-5 w-5 shrink-0 text-white/60" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Mostrar mis kilos en el Crew</p>
                  <p className="text-xs leading-snug text-white/45">
                    {u.comparteKilos
                      ? "Tu Crew ve tus kg además de tu progreso."
                      : "Privado: el Crew solo ve % y puntos."}
                  </p>
                </div>
              </div>
              <Toggle
                checked={u.comparteKilos}
                onChange={toggleShareWeightPrivacy}
                label="Mostrar mis kilos en el Crew"
              />
            </div>

            <div className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-white/60" />
                <p className="text-sm font-semibold">Unidades</p>
              </div>
              <Segmented
                label="Unidades"
                value={unit}
                onChange={setUnit}
                options={[
                  { id: "kg", label: "kg · cm" },
                  { id: "lb", label: "lb · in" },
                ]}
              />
            </div>

            <div className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                {themeMode === "light" ? (
                  <Sun className="h-5 w-5 text-white/60" />
                ) : (
                  <Moon className="h-5 w-5 text-white/60" />
                )}
                <p className="text-sm font-semibold">Tema</p>
              </div>
              <Segmented
                label="Tema"
                value={themeMode}
                onChange={setThemeMode}
                options={[
                  { id: "dark", label: "Oscuro" },
                  { id: "light", label: "Claro" },
                ]}
              />
            </div>

            <div className="flex items-center justify-between gap-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <Bell className="h-5 w-5 shrink-0 text-white/60" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Recordatorios</p>
                  <p className="text-xs leading-snug text-white/45">Días pactados y cierre semanal.</p>
                </div>
              </div>
              <Toggle checked={notifs} onChange={setNotifs} label="Recordatorios" />
            </div>

            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex w-full items-center gap-3 py-4 text-left text-sm font-semibold text-danger transition hover:opacity-80"
            >
              <RotateCcw className="h-5 w-5" />
              Borrar mis datos y empezar de nuevo
            </button>
          </section>
        </div>
      </div>

      <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-xs text-white/30">
        <Award className="h-3.5 w-3.5" />
        TRENO · tus datos se guardan solo en este dispositivo
      </p>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} label="Borrar datos">
        <SheetHeader title="¿Borrar todos tus datos?" onClose={() => setConfirmReset(false)} />
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          Se eliminarán tu perfil, tus medidas, tus entrenamientos y tu progreso. Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setConfirmReset(false)}
            className="rounded-full bg-white/10 py-3.5 text-sm font-semibold transition hover:bg-white/15"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmReset(false);
              resetApp();
            }}
            className="rounded-full bg-danger py-3.5 text-sm font-semibold text-canvas transition hover:opacity-90"
          >
            Sí, borrar todo
          </button>
        </div>
      </Sheet>
    </div>
  );
}
