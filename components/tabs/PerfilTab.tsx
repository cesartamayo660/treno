"use client";

import React, { useEffect, useState } from "react";
import {
  Award,
  Bell,
  Eye,
  Lock,
  MapPin,
  Moon,
  RotateCcw,
  Scale,
  Smartphone,
  Sun,
  Target,
} from "lucide-react";
import { useTreno } from "@/lib/store";
import { BadgesSection } from "@/components/badges";
import { CreatureCard } from "@/components/Creature";
import {
  activarNotificaciones,
  desactivarNotificaciones,
  notificacionesActivas,
  notificacionesSoportadas,
  useInstalacion,
} from "@/lib/pwa";
import { Avatar, Eyebrow, Segmented, Sheet, SheetHeader, Toggle } from "@/components/ui";

export function PerfilTab() {
  const { currentUser: u, themeMode, setThemeMode, toggleShareWeightPrivacy, resetApp } = useTreno();

  const [unit, setUnit] = useState<"kg" | "lb">("kg");
  const [confirmReset, setConfirmReset] = useState(false);

  // Aviso del descanso (notificación del sistema): solo se activa si lo permites
  const [notifs, setNotifs] = useState(false);
  const [notifMsg, setNotifMsg] = useState<string | null>(null);
  const [instalarOpen, setInstalarOpen] = useState(false);
  const inst = useInstalacion();
  useEffect(() => setNotifs(notificacionesActivas()), []);

  const cambiarNotifs = async (v: boolean) => {
    if (!v) {
      desactivarNotificaciones();
      setNotifs(false);
      setNotifMsg(null);
      return;
    }
    const r = await activarNotificaciones();
    setNotifs(r === "ok");
    setNotifMsg(
      r === "ok"
        ? "Listo: te aviso cuando termine tu descanso si estás en otra app."
        : r === "denegado"
        ? "El navegador bloqueó los avisos. Puedes permitirlos en los ajustes del sitio."
        : "Este navegador no permite avisos. Instala la app para probar de nuevo."
    );
  };

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
          <CreatureCard />

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
          <BadgesSection />

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

            {notificacionesSoportadas() && (
              <div className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Bell className="h-5 w-5 shrink-0 text-white/60" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Aviso al terminar el descanso</p>
                      <p className="text-xs leading-snug text-white/45">Una notificación si estás en otra app.</p>
                    </div>
                  </div>
                  <Toggle checked={notifs} onChange={cambiarNotifs} label="Aviso al terminar el descanso" />
                </div>
                {notifMsg && (
                  <p className="mt-2.5 text-xs leading-snug text-white/50" aria-live="polite">
                    {notifMsg}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <Smartphone className="h-5 w-5 shrink-0 text-white/60" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{inst.instalada ? "App instalada" : "Instalar TRENO"}</p>
                  <p className="text-xs leading-snug text-white/45">
                    {inst.instalada
                      ? "La estás usando como app: pantalla completa y sin internet."
                      : "Ícono en tu pantalla, pantalla completa y funciona sin internet."}
                  </p>
                </div>
              </div>
              {!inst.instalada && (
                <button
                  type="button"
                  onClick={() => (inst.puedeInstalar ? void inst.instalar() : setInstalarOpen(true))}
                  className="shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-canvas transition active:scale-95"
                >
                  {inst.puedeInstalar ? "Instalar" : "Cómo"}
                </button>
              )}
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

      <Sheet open={instalarOpen} onClose={() => setInstalarOpen(false)} label="Instalar TRENO">
        <SheetHeader eyebrow="Sin tienda de apps" title="Instala TRENO en tu celular" onClose={() => setInstalarOpen(false)} />
        <p className="mt-3 text-[15px] leading-relaxed text-white/65">
          TRENO se instala desde el navegador: queda con su ícono, abre a pantalla completa y funciona aunque no haya señal.
        </p>
        <ol className="mt-5 space-y-3">
          {(inst.esIos
            ? [
                "Abre TRENO en Safari.",
                "Toca el botón Compartir (el cuadrado con la flecha hacia arriba).",
                "Elige “Añadir a pantalla de inicio” y confirma.",
              ]
            : [
                "Abre TRENO en Chrome (o Edge).",
                "Toca el menú ⋮ del navegador.",
                "Elige “Instalar app” o “Añadir a pantalla de inicio”.",
              ]
          ).map((t, i) => (
            <li key={t} className="flex items-start gap-3">
              <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-canvas">
                {i + 1}
              </span>
              <span className="pt-0.5 text-[15px] leading-snug">{t}</span>
            </li>
          ))}
        </ol>
        {inst.esIos && (
          <p className="mt-4 rounded-2xl bg-white/[0.05] p-3.5 text-xs leading-relaxed text-white/55">
            En iPhone, los avisos del sistema solo funcionan cuando TRENO está instalada en la pantalla de inicio.
          </p>
        )}
      </Sheet>

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
