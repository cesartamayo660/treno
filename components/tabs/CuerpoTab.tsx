"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Camera,
  ChevronRight,
  Lock,
  Plus,
  Ruler,
  Trash2,
} from "lucide-react";
import { calculate7DayMovingAverage } from "@/lib/bodyMetrics";
import { detectOutlierJump } from "@/lib/trenoScore";
import { todayIso } from "@/lib/freshUser";
import { useTreno } from "@/lib/store";
import { FormulaDetailData, FormulaModal } from "@/components/FormulaModal";
import { Eyebrow, Segmented, Sheet, SheetHeader } from "@/components/ui";
import { GoalProjection } from "@/components/GoalProjection";
import { MuscleMap } from "@/components/MuscleMap";

const TICK = "rgb(var(--c-ink) / 0.4)";
const TOOLTIP = {
  backgroundColor: "rgb(var(--c-raised))",
  borderRadius: "14px",
  border: "1px solid rgb(var(--c-ink) / 0.15)",
  fontSize: "12px",
  color: "rgb(var(--c-ink))",
};

interface Photo {
  fecha: string;
  src: string;
}
const PHOTOS_KEY = "treno:photos";

/** Reduce la foto a ~640 px para que quepa en el almacenamiento local. */
function shrinkImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 640;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => reject(new Error("img"));
    img.src = url;
  });
}

export function CuerpoTab() {
  const { currentUser: u, registerNewWeight } = useTreno();

  const [formula, setFormula] = useState<FormulaDetailData | null>(null);
  const [weightOpen, setWeightOpen] = useState(false);
  const [measuresOpen, setMeasuresOpen] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [chartView, setChartView] = useState<"plan" | "media">("plan");

  const [wIn, setWIn] = useState("");
  const [cIn, setCIn] = useState("");

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [reveal, setReveal] = useState(50);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PHOTOS_KEY);
      if (raw) setPhotos(JSON.parse(raw));
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  const savePhotos = (next: Photo[]) => {
    setPhotos(next);
    try {
      localStorage.setItem(PHOTOS_KEY, JSON.stringify(next));
    } catch {
      /* lleno o bloqueado */
    }
  };

  const addPhoto = async (f: File | undefined) => {
    if (!f) return;
    try {
      const src = await shrinkImage(f);
      savePhotos([...photos, { fecha: todayIso(), src }].slice(-12));
    } catch {
      /* archivo no válido */
    }
  };

  const rep = u.reporteActual;
  const perfil = u.perfilActual;

  const series = useMemo(() => calculate7DayMovingAverage(u.pesajesUltimos14Dias), [u.pesajesUltimos14Dias]);
  const tendencia = series[series.length - 1]?.promedioMovil7dKg ?? perfil.pesoKg;
  const haceUnaSemana = series[Math.max(0, series.length - 8)]?.promedioMovil7dKg ?? u.perfilInicial.pesoKg;
  const variacion = Math.round((tendencia - haceUnaSemana) * 100) / 100;
  const sinHistorial = u.pesajesUltimos14Dias.length < 2;

  // Trayectoria: plan completo + peso real en la semana actual
  const semanaActual = useMemo(() => {
    const ini = new Date(rep.meta.fechaInicio || todayIso());
    const dias = Math.floor((Date.now() - ini.getTime()) / 86400000);
    return Math.max(0, Math.floor(dias / 7));
  }, [rep.meta.fechaInicio]);

  const trayectoria = useMemo(() => {
    const base = rep.meta.trayectoria.slice(0, 13);
    return base.map((p) => ({
      ...p,
      pesoRealKg:
        p.semana === 0
          ? u.perfilInicial.pesoKg
          : p.semana === Math.min(semanaActual, base.length - 1)
          ? perfil.pesoKg
          : undefined,
    }));
  }, [rep.meta.trayectoria, semanaActual, u.perfilInicial.pesoKg, perfil.pesoKg]);

  const totalKg = Math.abs(rep.meta.pesoMetaKg - u.perfilInicial.pesoKg);
  const hechoKg =
    Math.sign(rep.meta.pesoMetaKg - u.perfilInicial.pesoKg) === Math.sign(perfil.pesoKg - u.perfilInicial.pesoKg)
      ? Math.abs(perfil.pesoKg - u.perfilInicial.pesoKg)
      : 0;
  const avance = totalKg < 0.05 ? 0 : Math.min(1, hechoKg / totalKg);

  const outlier = detectOutlierJump({
    tipo: "peso_corporal",
    valorAnterior: perfil.pesoKg,
    valorNuevo: Number(wIn) || perfil.pesoKg,
  });

  const openWeight = () => {
    setWIn(String(perfil.pesoKg));
    setCIn(String(perfil.cinturaCm));
    setWeightOpen(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(wIn);
    const c = Number(cIn);
    if (w >= 35 && w <= 220) {
      registerNewWeight(w, c >= 45 ? c : undefined);
      setWeightOpen(false);
    }
  };

  const indicadores: {
    k: string;
    v: string;
    sub: string;
    detail: FormulaDetailData;
  }[] = [
    {
      k: "% grasa",
      v: `${rep.grasaCorporal.valor}%`,
      sub: `Meta ${rep.meta.grasaMetaPct}%`,
      detail: {
        titulo: "% de grasa corporal",
        valorMostrado: `${rep.grasaCorporal.valor}%`,
        categoria: rep.grasaCorporal.categoria,
        explicacionSimple: rep.grasaCorporal.explicacionSimple,
        formulaNombre: rep.grasaCorporal.formulaNombre,
        formulaExpresion: rep.grasaCorporal.formulaExpresion,
        comparativaExtra: [
          { etiqueta: "Masa magra", valor: `${rep.masaMagraKg} kg` },
          { etiqueta: "Masa grasa", valor: `${rep.masaGrasaKg} kg` },
          { etiqueta: "Meta de tu plan", valor: `${rep.meta.grasaMetaPct}%` },
        ],
      },
    },
    {
      k: "FFMI",
      v: `${rep.ffmi.ffmiNormalizado}`,
      sub: rep.ffmi.categoria ?? "",
      detail: {
        titulo: "FFMI (masa libre de grasa)",
        valorMostrado: `${rep.ffmi.valor} kg/m² (normalizado ${rep.ffmi.ffmiNormalizado})`,
        categoria: rep.ffmi.categoria,
        explicacionSimple: rep.ffmi.explicacionSimple,
        formulaNombre: rep.ffmi.formulaNombre,
        formulaExpresion: rep.ffmi.formulaExpresion,
        comparativaExtra: [
          { etiqueta: "18–20", valor: "Promedio" },
          { etiqueta: "20–22", valor: "Atlético" },
          { etiqueta: "22–25", valor: "Muy musculado" },
        ],
      },
    },
    {
      k: "Cintura / est.",
      v: `${rep.indiceCinturaEstatura.valor}`,
      sub: rep.indiceCinturaEstatura.esSaludable ? "Saludable" : "Meta < 0.50",
      detail: {
        titulo: "Índice cintura / estatura",
        valorMostrado: `${rep.indiceCinturaEstatura.valor}`,
        categoria: rep.indiceCinturaEstatura.categoria,
        explicacionSimple: rep.indiceCinturaEstatura.explicacionSimple,
        formulaNombre: rep.indiceCinturaEstatura.formulaNombre,
        formulaExpresion: rep.indiceCinturaEstatura.formulaExpresion,
        comparativaExtra: [
          { etiqueta: "Cintura actual", valor: `${perfil.cinturaCm} cm` },
          { etiqueta: "Máximo saludable (< 0.5)", valor: `${(perfil.estaturaCm * 0.5).toFixed(1)} cm` },
        ],
      },
    },
  ];

  const medidas = [
    { z: "Cintura (ombligo)", i: u.perfilInicial.cinturaCm, a: perfil.cinturaCm },
    { z: "Cuello", i: u.perfilInicial.cuelloCm, a: perfil.cuelloCm },
    { z: "Pecho", i: u.perfilInicial.pechoCm, a: perfil.pechoCm },
    { z: "Brazo contraído", i: u.perfilInicial.brazoCm, a: perfil.brazoCm },
    { z: "Muslo", i: u.perfilInicial.musloCm, a: perfil.musloCm },
    { z: "Pantorrilla", i: u.perfilInicial.pantorrillaCm, a: perfil.pantorrillaCm },
  ].filter((m) => m.a !== undefined);

  const primera = photos[0];
  const ultima = photos[photos.length - 1];

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Cuerpo</h1>

      {/* Protagonista: peso de tendencia */}
      <section className="glass-card rounded-card p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Eyebrow>Peso de tendencia · media de 7 días</Eyebrow>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <span className="num text-6xl font-semibold sm:text-7xl">
                {tendencia.toFixed(1)}
                <span className="ml-1.5 text-xl font-normal text-white/45">kg</span>
              </span>
              {!sinHistorial && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                  {variacion >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {variacion >= 0 ? "+" : ""}
                  {variacion.toFixed(2)} kg / sem
                </span>
              )}
            </div>
            <p className="mt-3 text-sm text-white/50">
              Meta: <strong className="text-white">{rep.meta.pesoMetaKg} kg</strong> · {rep.meta.etiquetaObjetivo}
            </p>
          </div>
          <button
            type="button"
            onClick={openWeight}
            aria-label="Registrar peso de hoy"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-canvas shadow-glow transition active:scale-95"
          >
            <Plus className="h-6 w-6 stroke-[2.6]" />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start [&>*]:min-w-0">
        {/* Trayectoria */}
        <section className="glass-card rounded-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Tu trayectoria</h2>
              <p className="text-xs text-white/45">
                Semana {Math.min(semanaActual, rep.meta.semanasEstimadas)} de {rep.meta.semanasEstimadas} · llegada {rep.meta.fechaEstimada}
              </p>
            </div>
            <Segmented
              label="Vista del gráfico"
              value={chartView}
              onChange={setChartView}
              options={[
                { id: "plan", label: "Plan" },
                { id: "media", label: "14 días" },
              ]}
            />
          </div>

          <div className="mt-4 h-52 w-full">
            {chartView === "media" && sinHistorial ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/15 px-6 text-center text-sm text-white/45">
                Registra tu peso varios días para ver tu tendencia.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartView === "plan" ? (
                  <ComposedChart data={trayectoria} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cuerpoFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(var(--c-accent))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="rgb(var(--c-accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="semana" tickFormatter={(v) => `S${v}`} stroke={TICK} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} stroke={TICK} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP} labelFormatter={(l) => `Semana ${l}`} formatter={(v: number, n) => [`${v} kg`, n]} />
                    <Area type="monotone" dataKey="pesoPlanKg" name="Plan" stroke="rgb(var(--c-accent))" strokeWidth={2} strokeDasharray="5 4" fill="url(#cuerpoFill)" />
                    <Line type="monotone" dataKey="pesoRealKg" name="Real" stroke="rgb(var(--c-ink))" strokeWidth={2} dot={{ r: 4, fill: "rgb(var(--c-ink))" }} connectNulls />
                    <ReferenceDot x={Math.min(semanaActual, trayectoria.length - 1)} y={perfil.pesoKg} r={6} fill="rgb(var(--c-accent))" stroke="rgb(var(--c-base))" strokeWidth={2} />
                  </ComposedChart>
                ) : (
                  <ComposedChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <XAxis dataKey="fecha" tickFormatter={(v) => String(v).slice(8, 10)} stroke={TICK} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={["dataMin - 0.6", "dataMax + 0.6"]} stroke={TICK} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP} formatter={(v: number, n) => [`${v} kg`, n]} />
                    <Line type="monotone" dataKey="pesoDiarioKg" name="Báscula" stroke="rgb(var(--c-ink) / 0.4)" strokeWidth={1.5} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="promedioMovil7dKg" name="Media 7 días" stroke="rgb(var(--c-accent))" strokeWidth={3} dot={false} />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${Math.round(avance * 100)}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-white/50">
              <span>Inicio {u.perfilInicial.pesoKg} kg</span>
              <span className="font-semibold text-white">Hoy {perfil.pesoKg} kg</span>
              <span>Meta {rep.meta.pesoMetaKg} kg</span>
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <GoalProjection onRegister={openWeight} />

          {/* Indicadores */}
          <div className="grid grid-cols-3 gap-2.5">
            {indicadores.map((i) => (
              <button
                key={i.k}
                type="button"
                onClick={() => setFormula(i.detail)}
                className="glass-card rounded-2xl p-3.5 text-left transition hover:border-white/20"
              >
                <span className="flex items-center justify-between text-[11px] font-medium text-white/50">
                  {i.k}
                  <Calculator className="h-3 w-3" />
                </span>
                <span className="num mt-2 block text-2xl font-semibold">{i.v}</span>
                <span className="mt-1 block truncate text-[11px] text-white/45">{i.sub}</span>
              </button>
            ))}
          </div>

          {/* Accesos */}
          <div className="glass-card divide-y divide-white/10 rounded-card px-5">
            <button type="button" onClick={() => setMeasuresOpen(true)} className="flex w-full items-center gap-4 py-4 text-left">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Ruler className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">Medidas con cinta</span>
                <span className="block text-xs text-white/45">Cintura {perfil.cinturaCm} cm</span>
              </span>
              <ChevronRight className="h-5 w-5 text-white/30" />
            </button>
            <button type="button" onClick={() => setPhotosOpen(true)} className="flex w-full items-center gap-4 py-4 text-left">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Camera className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">Fotos de progreso</span>
                <span className="flex items-center gap-1 text-xs text-white/45">
                  <Lock className="h-3 w-3" /> Privadas · {photos.length} {photos.length === 1 ? "foto" : "fotos"}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 text-white/30" />
            </button>
          </div>
        </div>
      </div>

      <MuscleMap />

      {/* Registrar peso */}
      <Sheet open={weightOpen} onClose={() => setWeightOpen(false)} label="Registrar peso">
        <form onSubmit={save}>
          <SheetHeader eyebrow="Hoy" title="Registrar peso y cintura" onClose={() => setWeightOpen(false)} />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="block rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 focus-within:border-accent/60">
              <span className="text-xs text-white/50">Peso (kg)</span>
              <input
                type="number"
                inputMode="decimal"
                step={0.1}
                value={wIn}
                onChange={(e) => setWIn(e.target.value)}
                className="num mt-1.5 block w-full bg-transparent text-3xl font-semibold text-accent focus:outline-none"
              />
            </label>
            <label className="block rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 focus-within:border-accent/60">
              <span className="text-xs text-white/50">Cintura (cm)</span>
              <input
                type="number"
                inputMode="decimal"
                step={0.1}
                value={cIn}
                onChange={(e) => setCIn(e.target.value)}
                className="num mt-1.5 block w-full bg-transparent text-3xl font-semibold focus:outline-none"
              />
            </label>
          </div>
          {outlier.esOutlier && (
            <p className="mt-3 rounded-2xl bg-warn/10 p-3 text-[13px] leading-snug text-warn">⚠️ {outlier.motivo}</p>
          )}
          <p className="mt-3 text-xs text-white/45">
            Tu peso es privado: el Crew solo ve tu progreso en %, salvo que lo actives en tu perfil.
          </p>
          <button type="submit" className="mt-5 w-full rounded-full bg-accent py-4 text-base font-semibold text-canvas shadow-glow transition active:scale-[0.99]">
            Guardar
          </button>
        </form>
      </Sheet>

      {/* Medidas */}
      <Sheet open={measuresOpen} onClose={() => setMeasuresOpen(false)} label="Medidas">
        <SheetHeader eyebrow="Perímetros" title="Evolución de medidas" onClose={() => setMeasuresOpen(false)} />
        <ul className="mt-5 divide-y divide-white/10 rounded-2xl border border-white/10 px-4">
          {medidas.map((m) => {
            const d = (m.a ?? 0) - (m.i ?? 0);
            return (
              <li key={m.z} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="text-white/70">{m.z}</span>
                <span className="flex items-center gap-2.5">
                  <span className="num text-white/40">{m.i}</span>
                  <span className="text-white/30">→</span>
                  <span className="num font-semibold">{m.a} cm</span>
                  <span className={`num w-14 text-right text-xs font-semibold ${d === 0 ? "text-white/35" : "text-accent"}`}>
                    {d > 0 ? "+" : ""}
                    {d.toFixed(1)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </Sheet>

      {/* Fotos */}
      <Sheet open={photosOpen} onClose={() => setPhotosOpen(false)} label="Fotos de progreso">
        <SheetHeader eyebrow="Solo en tu dispositivo" title="Fotos de progreso" onClose={() => setPhotosOpen(false)} />

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { addPhoto(e.target.files?.[0]); e.target.value = ""; }} />

        {photos.length >= 2 && primera && ultima && (
          <div className="mt-5">
            <div className="relative aspect-[3/4] w-full select-none overflow-hidden rounded-2xl bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ultima.src} alt="Foto más reciente" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-accent" style={{ width: `${reveal}%` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={primera.src} alt="Primera foto" className="h-full max-w-none object-cover" style={{ width: `${10000 / Math.max(reveal, 1)}%` }} />
              </div>
              <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">{primera.fecha}</span>
              <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white">{ultima.fecha}</span>
            </div>
            <input type="range" min={5} max={95} value={reveal} onChange={(e) => setReveal(Number(e.target.value))} aria-label="Comparar antes y después" className="mt-3 w-full accent-[rgb(var(--c-accent))]" />
          </div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {photos.map((p, i) => (
            <div key={p.fecha + i} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={`Foto del ${p.fecha}`} className="h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-[10px] font-medium text-white">{p.fecha}</span>
              <button
                type="button"
                aria-label="Eliminar foto"
                onClick={() => savePhotos(photos.filter((_, j) => j !== i))}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 text-white/55 transition hover:bg-white/5"
          >
            <Camera className="h-5 w-5" />
            <span className="text-xs font-medium">Añadir</span>
          </button>
        </div>
        {photos.length < 2 && (
          <p className="mt-4 text-xs text-white/45">Con dos o más fotos podrás comparar tu antes y después.</p>
        )}
      </Sheet>

      <FormulaModal detail={formula} onClose={() => setFormula(null)} />
    </div>
  );
}
