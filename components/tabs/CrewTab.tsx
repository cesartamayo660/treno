"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Flame,
  Plus,
  ShieldCheck,
  Sparkles,
  Swords,
  UserPlus,
} from "lucide-react";
import { CrewMemberRankingRow } from "@/lib/demoData";
import { useTreno } from "@/lib/store";
import { Avatar, Eyebrow, Sheet, SheetHeader } from "@/components/ui";

type Ranking = "general" | "asistencia" | "fuerza" | "subida" | "meta" | "rachas";

const CHIPS: { id: Ranking; label: string }[] = [
  { id: "general", label: "General" },
  { id: "asistencia", label: "Asistencia" },
  { id: "fuerza", label: "Fuerza" },
  { id: "subida", label: "Subida de carga" },
  { id: "meta", label: "Meta" },
  { id: "rachas", label: "Rachas" },
];

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

interface CrewInfo {
  id: string;
  nombre: string;
  temporada: string;
  codigo: string;
  /** El Crew de ejemplo trae amigos; los creados por el usuario empiezan solo con él. */
  conAmigos: boolean;
}

const BASE_CREW: CrewInfo = {
  id: "crew-base",
  nombre: "Iron Pack Miraflores",
  temporada: "Temporada de 8 semanas",
  codigo: "TRENO-IRON8",
  conAmigos: true,
};

const CREWS_KEY = "treno:crews";

function randomCode() {
  return "TRENO-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function metricOf(m: CrewMemberRankingRow, r: Ranking) {
  switch (r) {
    case "asistencia":
      return { v: m.asistenciaPct, label: `${m.asistenciaPct}%`, sub: `${m.asistenciaPts} pts de asistencia` };
    case "fuerza":
      return {
        v: m.dotsTotalTresBasicos,
        label: `${m.dotsTotalTresBasicos} DOTS`,
        sub: m.comparteKilos ? `${m.pesoKg} kg` : "Fuerza relativa · peso privado",
      };
    case "subida":
      return { v: m.subidaCargaSemanalPct, label: `+${m.subidaCargaSemanalPct}%`, sub: `${m.fuerzaPts} pts de fuerza` };
    case "meta":
      return { v: m.progresoMetaTemporadaPct, label: `${m.progresoMetaTemporadaPct}%`, sub: `${m.etiquetaObjetivo}` };
    case "rachas":
      return {
        v: m.rachaDias,
        label: `${m.rachaDias} ${m.rachaDias === 1 ? "día" : "días"}`,
        sub: `${m.rachaSemanas} semanas perfectas`,
      };
    default:
      return {
        v: m.trenoScore,
        label: `${m.trenoScore}`,
        sub: `${m.etiquetaObjetivo}${m.comparteKilos ? ` · ${m.pesoKg} kg` : ""}`,
      };
  }
}

export function CrewTab() {
  const { currentUser: u, crewMembers, feed, toggleReaction, validateMatePr } = useTreno();

  const [crews, setCrews] = useState<CrewInfo[]>([BASE_CREW]);
  const [crewId, setCrewId] = useState(BASE_CREW.id);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [ranking, setRanking] = useState<Ranking>("general");

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDays, setNewDays] = useState<number[]>([1, 3, 5]);
  const [copied, setCopied] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CREWS_KEY);
      if (raw) setCrews([BASE_CREW, ...(JSON.parse(raw) as CrewInfo[])]);
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  const crew = crews.find((c) => c.id === crewId) ?? BASE_CREW;

  const members = useMemo(
    () => (crew.conAmigos ? crewMembers : crewMembers.filter((m) => m.codigoDemo === "usuario_a")),
    [crew.conAmigos, crewMembers]
  );

  const sorted = useMemo(
    () =>
      members
        .map((m) => ({ ...m, ...metricOf(m, ranking) }))
        .sort((a, b) => b.v - a.v),
    [members, ranking]
  );

  const solo = sorted.length <= 1;
  const top3 = sorted.slice(0, 3);
  const miPos = sorted.findIndex((m) => m.codigoDemo === "usuario_a") + 1;

  // Reto: tú contra el rival más cercano en puntos
  const porScore = useMemo(() => [...members].sort((a, b) => b.trenoScore - a.trenoScore), [members]);
  const yo = porScore.find((m) => m.codigoDemo === "usuario_a");
  const rival = porScore.find((m) => m.codigoDemo !== "usuario_a" && (porScore.indexOf(m) === (porScore.indexOf(yo!) === 0 ? 1 : porScore.indexOf(yo!) - 1)));

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* portapapeles no disponible */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const createCrew = () => {
    const c: CrewInfo = {
      id: `crew-${Date.now()}`,
      nombre: newName.trim() || "Mi Crew",
      temporada: `Temporada de 8 semanas · ${newDays.length} días pactados`,
      codigo: randomCode(),
      conAmigos: false,
    };
    const extra = crews.filter((x) => x.id !== BASE_CREW.id).concat(c);
    setCrews([BASE_CREW, ...extra]);
    try {
      localStorage.setItem(CREWS_KEY, JSON.stringify(extra));
    } catch {
      /* noop */
    }
    setCrewId(c.id);
    setCreateOpen(false);
    setNewName("");
    setInviteOpen(true);
  };

  const mvp = porScore[0];
  const mejorRacha = [...members].sort((a, b) => b.rachaDias - a.rachaDias)[0];
  const slides = [
    { k: "MVP de la semana", big: mvp?.nombre.split(" ")[0] ?? "—", small: `${mvp?.trenoScore ?? 0} puntos` },
    { k: "Racha más larga", big: `${mejorRacha?.rachaDias ?? 0}`, small: `días · ${mejorRacha?.nombre.split(" ")[0] ?? ""}` },
    { k: "Tu semana", big: `${yo?.trenoScore ?? 0}`, small: `puntos · vas ${miPos}.º` },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <section className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Eyebrow>{crew.temporada}</Eyebrow>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-1.5 flex max-w-full items-center gap-1.5 text-left"
            aria-label="Cambiar de Crew"
          >
            <h1 className="truncate font-display text-[2rem] font-semibold leading-none tracking-tight sm:text-4xl">
              {crew.nombre}
            </h1>
            <ChevronDown className="h-5 w-5 shrink-0 text-white/50" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition hover:bg-white/10"
          aria-label="Invitar amigos"
        >
          <UserPlus className="h-[18px] w-[18px]" />
        </button>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_1fr] lg:items-start [&>*]:min-w-0">
        <div className="space-y-5">
          {/* Podio */}
          {!solo && (
            <section className="glass-card rounded-card px-4 pb-5 pt-6 sm:px-6">
              <div className="grid grid-cols-3 items-end gap-2.5">
                {[top3[1], top3[0], top3[2]].map((m, i) => {
                  if (!m) return <div key={i} />;
                  const place = i === 1 ? 1 : i === 0 ? 2 : 3;
                  const me = m.codigoDemo === "usuario_a";
                  return (
                    <div key={m.userId} className="flex flex-col items-center text-center">
                      <Avatar nombre={m.nombre} src={m.avatar} className={place === 1 ? "h-16 w-16 text-lg" : "h-12 w-12 text-sm"} />
                      <p className="mt-2 w-full truncate text-xs font-semibold">
                        {me ? "Tú" : m.nombre.split(" ")[0]}
                      </p>
                      <p className="num mt-0.5 text-sm font-semibold text-accent">{m.label}</p>
                      <div
                        className={`mt-2.5 flex w-full items-start justify-center rounded-t-2xl pt-2 ${
                          place === 1 ? "h-24 bg-accent text-canvas" : place === 2 ? "h-16 bg-white/15" : "h-12 bg-white/10"
                        }`}
                      >
                        <span className="num text-xl font-semibold">{place}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Ranking */}
          <section>
            <div role="tablist" aria-label="Tipo de ranking" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0">
              {CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={ranking === c.id}
                  onClick={() => setRanking(c.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                    ranking === c.id ? "bg-white text-canvas" : "border border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {solo ? (
              <div className="glass-card mt-3 rounded-card p-6 text-center">
                <p className="font-display text-lg font-semibold">Este Crew es solo tuyo, por ahora</p>
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-white/50">
                  Invita a tus amigos con el código para empezar a competir de forma justa.
                </p>
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="mt-4 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-canvas shadow-glow"
                >
                  Invitar amigos
                </button>
              </div>
            ) : (
              <ol className="glass-card mt-3 divide-y divide-white/10 rounded-card px-4 sm:px-5">
                {sorted.map((m, i) => {
                  const me = m.codigoDemo === "usuario_a";
                  return (
                    <li key={m.userId} className={`flex items-center gap-3.5 py-3.5 ${me ? "-mx-4 rounded-2xl bg-accent/10 px-4 sm:-mx-5 sm:px-5" : ""}`}>
                      <span className={`num w-5 text-center text-sm font-semibold ${i === 0 ? "text-accent" : "text-white/40"}`}>{i + 1}</span>
                      <Avatar nombre={m.nombre} src={m.avatar} className="h-10 w-10 text-sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {me ? `${m.nombre.split(" ")[0]} (tú)` : m.nombre}
                        </span>
                        <span className="block truncate text-xs text-white/45">{m.sub}</span>
                      </span>
                      <span className="num text-base font-semibold">{m.label}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <div className="space-y-5">
          {/* Reto */}
          {rival && yo && !solo && (
            <section className="rounded-card bg-white p-5 text-canvas">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1 text-[11px] font-semibold text-white">
                  <Swords className="h-3.5 w-3.5 text-accent" />
                  Reto 1 vs 1
                </span>
                <span className="text-xs font-medium text-canvas/60">Esta semana</span>
              </div>
              <h2 className="mt-3 font-display text-lg font-semibold leading-snug">
                Tú vs. {rival.nombre.split(" ")[0]}: ¿quién cierra la semana con más puntos?
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-2.5 text-center">
                {[
                  { n: "Tú", s: yo.trenoScore, lead: yo.trenoScore >= rival.trenoScore },
                  { n: rival.nombre.split(" ")[0], s: rival.trenoScore, lead: rival.trenoScore > yo.trenoScore },
                ].map((p) => (
                  <div key={p.n} className={`rounded-2xl p-3.5 ${p.lead ? "bg-canvas text-white" : "bg-canvas/10"}`}>
                    <p className="text-xs opacity-70">{p.n}</p>
                    <p className={`num mt-1 text-2xl font-semibold ${p.lead ? "text-accent" : ""}`}>{p.s}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3.5 text-xs font-medium text-canvas/65">
                🥤 Apuesta: el que pierda invita los batidos de proteína.
              </p>
            </section>
          )}

          {/* Feed */}
          <section className="glass-card rounded-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Actividad</h2>
              <button
                type="button"
                onClick={() => {
                  setSlide(0);
                  setRecapOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/15"
              >
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Recap semanal
              </button>
            </div>
            <ul className="mt-4 divide-y divide-white/10">
              {feed
                .filter((f) => crew.conAmigos || f.userId === u.id)
                .slice(0, 8)
                .map((ev) => (
                  <li key={ev.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                    <Avatar nombre={ev.autor} src={ev.avatar} className="h-10 w-10 text-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-white/45">
                        <span className="font-semibold text-white">{ev.userId === u.id ? "Tú" : ev.autor}</span> · {ev.haceTiempo}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold leading-snug">{ev.titulo}</p>
                      <p className="mt-0.5 text-[13px] leading-snug text-white/50">{ev.subtitulo}</p>

                      {ev.sospechaOutlier && (
                        <button
                          type="button"
                          onClick={() => validateMatePr(ev.id)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-warn/15 px-3 py-1 text-xs font-semibold text-warn"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Validar este récord
                        </button>
                      )}
                      {ev.validadoPor && !ev.sospechaOutlier && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-accent">
                          <Check className="h-3 w-3" /> Validado por {ev.validadoPor.split(" ")[0]}
                        </p>
                      )}

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {ev.reacciones.map((r) => (
                          <button
                            key={r.emoji}
                            type="button"
                            aria-pressed={r.reactedByMe}
                            onClick={() => toggleReaction(ev.id, r.emoji)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                              r.reactedByMe ? "bg-accent/20 text-accent" : "bg-white/[0.07] text-white/70 hover:bg-white/10"
                            }`}
                          >
                            <span>{r.emoji}</span>
                            <span className="num">{r.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Cambiar / crear Crew */}
      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} label="Mis Crews">
        <SheetHeader title="Mis Crews" onClose={() => setPickerOpen(false)} />
        <ul className="mt-5 space-y-2.5">
          {crews.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  setCrewId(c.id);
                  setPickerOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition ${
                  c.id === crewId ? "border-accent bg-accent/10" : "border-white/10 hover:bg-white/[0.05]"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{c.nombre}</span>
                  <span className="block truncate text-xs text-white/45">{c.temporada}</span>
                </span>
                {c.id === crewId && <Check className="h-4 w-4 shrink-0 text-accent" />}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            setPickerOpen(false);
            setCreateOpen(true);
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-white/20 py-3.5 text-sm font-semibold text-white/70 transition hover:bg-white/5"
        >
          <Plus className="h-4 w-4" />
          Crear un Crew
        </button>
      </Sheet>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} label="Crear Crew">
        <SheetHeader eyebrow="Nuevo Crew" title="Arma tu grupo" onClose={() => setCreateOpen(false)} />
        <label className="mt-5 block">
          <span className="text-sm font-medium text-white/60">Nombre</span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={40}
            placeholder="Ej. Titanes del Surco"
            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3.5 text-base font-semibold placeholder:text-white/25 focus:border-accent/70 focus:outline-none"
          />
        </label>
        <p className="mb-2 mt-5 text-sm font-medium text-white/60">Días pactados</p>
        <div className="grid grid-cols-7 gap-1.5">
          {DIAS.map((d, i) => {
            const on = newDays.includes(i + 1);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => setNewDays((p) => (p.includes(i + 1) ? p.filter((x) => x !== i + 1) : [...p, i + 1].sort()))}
                className={`rounded-xl border py-3 text-sm font-semibold transition ${on ? "border-accent bg-accent text-canvas" : "border-white/10 text-white/60"}`}
              >
                {d}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={createCrew}
          disabled={newDays.length === 0}
          className="mt-6 w-full rounded-full bg-accent py-4 text-base font-semibold text-canvas shadow-glow disabled:opacity-40"
        >
          Crear Crew
        </button>
      </Sheet>

      {/* Invitar */}
      <Sheet open={inviteOpen} onClose={() => setInviteOpen(false)} label="Invitar">
        <SheetHeader eyebrow={crew.nombre} title="Invita a tus amigos" onClose={() => setInviteOpen(false)} />
        <p className="mt-3 text-[15px] leading-relaxed text-white/60">
          Comparte este código. Cada persona compite según su propio objetivo, así que todos pueden ganar.
        </p>
        <button
          type="button"
          onClick={() => copy(crew.codigo)}
          className="mt-5 flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 transition hover:bg-white/[0.08]"
        >
          <span className="num text-2xl font-semibold tracking-wider text-accent">{crew.codigo}</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
            {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </span>
        </button>
      </Sheet>

      {/* Recap */}
      <Sheet open={recapOpen} onClose={() => setRecapOpen(false)} label="Recap semanal" maxWidth="max-w-sm">
        <SheetHeader eyebrow="Recap semanal" title={crew.nombre} onClose={() => setRecapOpen(false)} />
        <button
          type="button"
          onClick={() => (slide < slides.length - 1 ? setSlide(slide + 1) : setRecapOpen(false))}
          className="mt-5 flex aspect-[4/5] w-full flex-col justify-between rounded-3xl bg-accent p-6 text-left text-canvas"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{slides[slide].k}</span>
          <span>
            <span className="num block break-words text-6xl font-semibold">{slides[slide].big}</span>
            <span className="mt-2 flex items-center gap-1.5 text-base font-medium">
              {slide === 1 && <Flame className="h-4 w-4" />}
              {slides[slide].small}
            </span>
          </span>
          <span className="text-xs font-medium opacity-60">Toca para continuar · {slide + 1}/{slides.length}</span>
        </button>
      </Sheet>
    </div>
  );
}
