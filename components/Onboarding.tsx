"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Check,
  ChevronDown,
  Dumbbell,
  ShieldCheck,
} from "lucide-react";
import {
  ACTIVITY_FACTORS,
  ActivityLevel,
  GoalType,
  HEALTH_DISCLAIMER,
} from "@/lib/bodyMetrics";
import { GYMS_LIST } from "@/lib/freshUser";
import { useTreno } from "@/lib/store";
import { CountUpNumber } from "@/components/CountUpNumber";
import { FormulaDetailData, FormulaModal } from "@/components/FormulaModal";

const DAYS_OF_WEEK = [
  { id: 1, short: "L", name: "Lun" },
  { id: 2, short: "M", name: "Mar" },
  { id: 3, short: "X", name: "Mié" },
  { id: 4, short: "J", name: "Jue" },
  { id: 5, short: "V", name: "Vie" },
  { id: 6, short: "S", name: "Sáb" },
  { id: 7, short: "D", name: "Dom" },
];

const GOALS: { id: GoalType; title: string; desc: string }[] = [
  { id: "volumen", title: "Ganar masa", desc: "Subir de peso de forma limpia, priorizando músculo." },
  { id: "definicion", title: "Perder grasa", desc: "Bajar peso cuidando tu masa muscular." },
  { id: "recomposicion", title: "Recomposición", desc: "Menos grasa y más músculo con el mismo peso." },
  { id: "fuerza", title: "Ganar fuerza", desc: "Levantar más en los básicos, manteniendo tu composición." },
];

const STEP_TITLES = ["Tus datos", "Tus medidas", "Tu objetivo", "Tu compromiso"];

/** Campo numérico grande. Permite borrar y reescribir sin saltos. */
function NumField({
  label,
  unit,
  value,
  onChange,
  step = 1,
  min,
  max,
  required,
  accent,
}: {
  label: string;
  unit: string;
  value: number | undefined;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  max?: number;
  required?: boolean;
  accent?: boolean;
}) {
  const [draft, setDraft] = useState(value === undefined ? "" : String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setDraft(value === undefined ? "" : String(value));
  }, [value]);

  return (
    <label className="block rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 transition focus-within:border-accent/60 focus-within:bg-white/[0.07]">
      <span className="flex items-center justify-between text-xs font-medium text-white/55">
        <span>{label}</span>
        {required && <span className="text-accent">Obligatorio</span>}
      </span>
      <span className="mt-1.5 flex items-baseline gap-2">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={draft}
          onFocus={() => (focused.current = true)}
          onBlur={() => {
            focused.current = false;
            setDraft(value === undefined ? "" : String(value));
          }}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = Number(e.target.value);
            if (e.target.value !== "" && Number.isFinite(n) && n > 0) onChange(n);
          }}
          className={`num w-full min-w-0 bg-transparent text-3xl font-semibold focus:outline-none ${
            accent ? "text-accent" : "text-white"
          }`}
        />
        <span className="shrink-0 text-sm text-white/45">{unit}</span>
      </span>
    </label>
  );
}

function Choice({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-left transition ${
        active
          ? "border-accent bg-accent/10"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
      }`}
    >
      <span>
        <span className="block font-display text-base font-semibold">{title}</span>
        {desc && <span className="mt-0.5 block text-[13px] leading-snug text-white/55">{desc}</span>}
      </span>
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          active ? "border-accent bg-accent text-canvas" : "border-white/25"
        }`}
      >
        {active && <Check className="h-3 w-3 stroke-[3]" />}
      </span>
    </button>
  );
}

export function Onboarding() {
  const { customProfile, customReport, updateCustomProfile, completeOnboarding } = useTreno();

  // 0 = bienvenida · 1..4 = preguntas · 5 = "Tu meta"
  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState("");
  const [dias, setDias] = useState<number[]>([1, 3, 5]);
  const [sede, setSede] = useState(GYMS_LIST[0]);
  const [moreMeasures, setMoreMeasures] = useState(false);
  const [formula, setFormula] = useState<FormulaDetailData | null>(null);

  const p = customProfile;
  const r = customReport;

  const toggleDay = (id: number) =>
    setDias((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id].sort()));

  const canContinue =
    (step === 0 && nombre.trim().length > 0) || (step === 4 ? dias.length > 0 : step > 0);

  const next = () => setStep((s) => Math.min(5, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => completeOnboarding({ nombre, diasPactados: dias, sedeGym: sede });

  const showProgress = step >= 1 && step <= 4;

  return (
    <div className="treno-bg min-h-dvh">
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 pb-8 pt-[max(env(safe-area-inset-top),1.25rem)] sm:px-8">
        {/* Cabecera */}
        <header className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-canvas">
              <Dumbbell className="h-4 w-4 stroke-[2.6]" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">TRENO</span>
          </div>
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </button>
          )}
        </header>

        {showProgress && (
          <div className="mt-2" aria-label={`Paso ${step} de 4`}>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= step ? "bg-accent" : "bg-white/12"
                  }`}
                />
              ))}
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-white/45">
              Paso {step} de 4 · {STEP_TITLES[step - 1]}
            </p>
          </div>
        )}

        <div className="flex flex-1 flex-col py-6">
          <AnimatePresence mode="wait">
            {/* BIENVENIDA */}
            {step === 0 && (
              <motion.section
                key="s0"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-1 flex-col justify-center"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  Bienvenido
                </p>
                <h1 className="mt-3 font-display text-[2.6rem] font-semibold leading-[1.02] tracking-tight sm:text-5xl">
                  Tu progreso en el gimnasio,{" "}
                  <span className="text-accent">como un juego justo.</span>
                </h1>
                <p className="mt-4 max-w-md text-base leading-relaxed text-white/60">
                  Registra tus entrenamientos, mide tu avance hacia tu meta y compite con tus amigos.
                  Cada persona se evalúa según su propio objetivo.
                </p>

                <label className="mt-9 block">
                  <span className="text-sm font-medium text-white/70">¿Cómo te llamas?</span>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && nombre.trim() && next()}
                    placeholder="Tu nombre"
                    autoComplete="given-name"
                    maxLength={40}
                    className="mt-2 w-full rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-4 font-display text-2xl font-semibold text-white placeholder:text-white/25 focus:border-accent/70 focus:outline-none"
                  />
                </label>
              </motion.section>
            )}

            {/* PASO 1 · DATOS */}
            {step === 1 && (
              <motion.section
                key="s1"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
                  Hola, {nombre.trim().split(" ")[0]}. Empecemos por lo básico.
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-white/55">
                  Calibramos tu metabolismo y tu masa libre de grasa con estos datos.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {(["hombre", "mujer"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={p.sexo === s}
                      onClick={() =>
                        updateCustomProfile(
                          s === "mujer"
                            ? { sexo: s, caderaCm: p.caderaCm || 96 }
                            : { sexo: s }
                        )
                      }
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        p.sexo === s
                          ? "border-accent bg-accent/10"
                          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                      }`}
                    >
                      <span className="block text-xs text-white/50">Sexo biológico</span>
                      <span className="mt-0.5 block font-display text-lg font-semibold capitalize">
                        {s}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <NumField
                    label="Estatura"
                    unit="cm"
                    value={p.estaturaCm}
                    onChange={(n) => updateCustomProfile({ estaturaCm: n })}
                    min={130}
                    max={220}
                    step={0.5}
                  />
                  <NumField
                    label="Peso actual"
                    unit="kg"
                    value={p.pesoKg}
                    onChange={(n) => updateCustomProfile({ pesoKg: n })}
                    min={35}
                    max={220}
                    step={0.1}
                    accent
                  />
                  <NumField
                    label="Edad"
                    unit="años"
                    value={p.edad}
                    onChange={(n) => updateCustomProfile({ edad: n })}
                    min={14}
                    max={90}
                  />
                </div>

                <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      IMC {r.imc.valor} · {r.imc.categoria}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-snug text-white/50">{r.imc.advertencia}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormula({
                        titulo: "Índice de Masa Corporal (IMC)",
                        valorMostrado: `${r.imc.valor} kg/m²`,
                        categoria: r.imc.categoria,
                        explicacionSimple: r.imc.explicacionSimple,
                        formulaNombre: r.imc.formulaNombre,
                        formulaExpresion: r.imc.formulaExpresion,
                        advertencia: r.imc.advertencia,
                      })
                    }
                    className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-white/20"
                  >
                    ¿Cómo se calcula?
                  </button>
                </div>
              </motion.section>
            )}

            {/* PASO 2 · MEDIDAS */}
            {step === 2 && (
              <motion.section
                key="s2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
                  Medidas con cinta métrica
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-white/55">
                  Con cuello y cintura estimamos tu % de grasa (fórmula de la Marina de EE. UU.), sin máquinas.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <NumField
                    label="Cintura (ombligo)"
                    unit="cm"
                    value={p.cinturaCm}
                    onChange={(n) => updateCustomProfile({ cinturaCm: n })}
                    step={0.5}
                    required
                  />
                  <NumField
                    label="Cuello"
                    unit="cm"
                    value={p.cuelloCm}
                    onChange={(n) => updateCustomProfile({ cuelloCm: n })}
                    step={0.5}
                    required
                  />
                  {p.sexo === "mujer" && (
                    <NumField
                      label="Cadera"
                      unit="cm"
                      value={p.caderaCm}
                      onChange={(n) => updateCustomProfile({ caderaCm: n })}
                      step={0.5}
                      required
                    />
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                    <p className="text-[11px] text-white/50">% de grasa</p>
                    <p className="num mt-1.5 text-2xl font-semibold text-accent">
                      {r.grasaCorporal.valor}
                      <span className="text-sm text-white/45">%</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                    <p className="text-[11px] text-white/50">Masa magra</p>
                    <p className="num mt-1.5 text-2xl font-semibold">
                      {r.masaMagraKg}
                      <span className="text-sm text-white/45"> kg</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                    <p className="text-[11px] text-white/50">FFMI</p>
                    <p className="num mt-1.5 text-2xl font-semibold">{r.ffmi.ffmiNormalizado}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMoreMeasures((v) => !v)}
                  aria-expanded={moreMeasures}
                  className="mt-5 flex w-full items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.05]"
                >
                  <span>Más medidas y % de grasa medido (opcional)</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${moreMeasures ? "rotate-180" : ""}`}
                  />
                </button>

                {moreMeasures && (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <NumField
                        label="Pecho"
                        unit="cm"
                        value={p.pechoCm}
                        onChange={(n) => updateCustomProfile({ pechoCm: n })}
                        step={0.5}
                      />
                      <NumField
                        label="Brazo contraído"
                        unit="cm"
                        value={p.brazoCm}
                        onChange={(n) => updateCustomProfile({ brazoCm: n })}
                        step={0.5}
                      />
                      <NumField
                        label="Muslo"
                        unit="cm"
                        value={p.musloCm}
                        onChange={(n) => updateCustomProfile({ musloCm: n })}
                        step={0.5}
                      />
                      <NumField
                        label="Pantorrilla"
                        unit="cm"
                        value={p.pantorrillaCm}
                        onChange={(n) => updateCustomProfile({ pantorrillaCm: n })}
                        step={0.5}
                      />
                    </div>
                    <NumField
                      label="% de grasa por DEXA o bioimpedancia"
                      unit="%"
                      value={p.grasaPctManual ?? undefined}
                      onChange={(n) => updateCustomProfile({ grasaPctManual: n })}
                      step={0.1}
                    />
                    <p className="px-1 text-xs text-white/45">
                      Si lo ingresas, tiene prioridad sobre la estimación con cinta.
                    </p>
                  </div>
                )}
              </motion.section>
            )}

            {/* PASO 3 · OBJETIVO */}
            {step === 3 && (
              <motion.section
                key="s3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
                  ¿Cuál es tu meta principal?
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-white/55">
                  Tu puntaje semanal mide qué tan bien cumples <em>tu</em> objetivo, no el de otros.
                </p>

                <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {GOALS.map((g) => (
                    <Choice
                      key={g.id}
                      active={p.objetivo === g.id}
                      onClick={() => updateCustomProfile({ objetivo: g.id })}
                      title={g.title}
                      desc={g.desc}
                    />
                  ))}
                </div>

                <p className="mb-2 mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                  Nivel de actividad diaria
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["ligero", "moderado", "alto"] as ActivityLevel[]).map((act) => {
                    const info = ACTIVITY_FACTORS[act];
                    const on = p.nivelActividad === act;
                    return (
                      <button
                        key={act}
                        type="button"
                        aria-pressed={on}
                        onClick={() => updateCustomProfile({ nivelActividad: act })}
                        className={`rounded-2xl border px-3 py-3 text-left transition ${
                          on
                            ? "border-accent bg-accent/10"
                            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                        }`}
                      >
                        <span className="block text-sm font-semibold capitalize">{info.label}</span>
                        <span className="mt-0.5 block text-xs text-white/45">×{info.factor}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* PASO 4 · COMPROMISO */}
            {step === 4 && (
              <motion.section
                key="s4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
                  ¿Qué días vas al gimnasio?
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-white/55">
                  La asistencia vale el 30 % de tu puntaje. Cumplir semanas perfectas activa rachas que multiplican.
                </p>

                <div className="mt-6 grid grid-cols-7 gap-1.5 sm:gap-2">
                  {DAYS_OF_WEEK.map((d) => {
                    const on = dias.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        aria-pressed={on}
                        aria-label={d.name}
                        onClick={() => toggleDay(d.id)}
                        className={`flex flex-col items-center rounded-2xl border py-3.5 transition ${
                          on
                            ? "border-accent bg-accent text-canvas"
                            : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]"
                        }`}
                      >
                        <span className="font-display text-lg font-semibold">{d.short}</span>
                        <span className="mt-0.5 text-[10px] opacity-70">{d.name}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-sm text-white/50">
                  {dias.length === 0
                    ? "Elige al menos un día."
                    : `${dias.length} ${dias.length === 1 ? "día" : "días"} por semana.`}
                </p>

                <p className="mb-2 mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                  Tu gimnasio
                </p>
                <div className="grid gap-2.5">
                  {GYMS_LIST.map((g) => (
                    <Choice key={g} active={sede === g} onClick={() => setSede(g)} title={g} />
                  ))}
                </div>
              </motion.section>
            )}

            {/* PASO 5 · TU META */}
            {step === 5 && (
              <motion.section
                key="s5"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                  Tu plan, {nombre.trim().split(" ")[0]}
                </p>
                <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight">
                  {r.meta.etiquetaObjetivo}
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-white/55">{r.meta.explicacionMeta}</p>

                <button
                  type="button"
                  onClick={() =>
                    setFormula({
                      titulo: "Peso meta",
                      valorMostrado: `${r.meta.pesoMetaKg} kg`,
                      categoria: `${r.meta.ritmoSemanalKg >= 0 ? "+" : ""}${r.meta.ritmoSemanalKg} kg/semana`,
                      explicacionSimple:
                        "Se obtiene dividiendo tu masa magra objetivo entre la fracción libre de grasa deseada. Así la meta respeta tu composición, no solo la báscula.",
                      formulaNombre: "Peso meta por composición corporal",
                      formulaExpresion: `Peso_meta = LBM_meta (${r.meta.lbmMetaKg} kg) / (1 − ${r.meta.grasaMetaPct}% / 100)`,
                      comparativaExtra: [
                        {
                          etiqueta: "Rango saludable OMS (IMC 18.5–24.9)",
                          valor: `${r.pesoIdeal.rangoImcSaludableKg.min} – ${r.pesoIdeal.rangoImcSaludableKg.max} kg`,
                        },
                        {
                          etiqueta: "Devine / Robinson / Miller",
                          valor: `${r.pesoIdeal.devineKg} / ${r.pesoIdeal.robinsonKg} / ${r.pesoIdeal.millerKg} kg`,
                        },
                      ],
                    })
                  }
                  className="glass-card mt-6 block w-full rounded-card p-6 text-left transition hover:border-white/20"
                >
                  <span className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.14em] text-white/50">
                    Peso objetivo
                    <Calculator className="h-3.5 w-3.5" />
                  </span>
                  <CountUpNumber
                    value={r.meta.pesoMetaKg}
                    decimals={1}
                    className="num mt-3 block text-7xl font-semibold text-accent"
                  />
                  <span className="mt-3 block text-sm text-white/55">
                    Hoy {r.meta.pesoActualKg} kg · {r.meta.ritmoSemanalKg >= 0 ? "+" : ""}
                    {r.meta.ritmoSemanalKg} kg por semana · llegada en {r.meta.semanasEstimadas} semanas
                  </span>
                </button>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormula({
                        titulo: "% de grasa corporal",
                        valorMostrado: `${r.meta.grasaActualPct}% → ${r.meta.grasaMetaPct}%`,
                        categoria: r.grasaCorporal.categoria,
                        explicacionSimple: r.grasaCorporal.explicacionSimple,
                        formulaNombre: r.grasaCorporal.formulaNombre,
                        formulaExpresion: r.grasaCorporal.formulaExpresion,
                      })
                    }
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08]"
                  >
                    <span className="text-xs text-white/50">% grasa meta</span>
                    <span className="num mt-2 block text-3xl font-semibold">
                      {r.meta.grasaMetaPct}
                      <span className="text-base text-white/45">%</span>
                    </span>
                    <span className="mt-1 block text-xs text-white/45">Hoy {r.meta.grasaActualPct}%</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormula({
                        titulo: "Masa magra y FFMI",
                        valorMostrado: `${r.meta.lbmMetaKg} kg (FFMI ${r.meta.ffmiMeta})`,
                        categoria: r.ffmi.categoria,
                        explicacionSimple: r.ffmi.explicacionSimple,
                        formulaNombre: r.ffmi.formulaNombre,
                        formulaExpresion: r.ffmi.formulaExpresion,
                      })
                    }
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08]"
                  >
                    <span className="text-xs text-white/50">Masa magra meta</span>
                    <span className="num mt-2 block text-3xl font-semibold">
                      {r.meta.lbmMetaKg}
                      <span className="text-base text-white/45"> kg</span>
                    </span>
                    <span className="mt-1 block text-xs text-white/45">FFMI {r.meta.ffmiActual} → {r.meta.ffmiMeta}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormula({
                        titulo: "Calorías diarias",
                        valorMostrado: `${r.meta.kcalObjetivo} kcal/día`,
                        categoria: `TDEE ${r.tdee.valor} kcal (${r.meta.deltaKcal >= 0 ? "+" : ""}${r.meta.deltaKcal})`,
                        explicacionSimple: r.tmb.explicacionSimple,
                        formulaNombre: `Principal: ${r.tmb.metodoPrincipal}`,
                        formulaExpresion: r.tmb.formulaExpresion,
                        comparativaExtra: [
                          { etiqueta: "TMB Katch-McArdle", valor: `${r.tmb.katchMcArdleKcal} kcal` },
                          { etiqueta: "TMB Mifflin-St Jeor", valor: `${r.tmb.mifflinStJeorKcal} kcal` },
                          { etiqueta: `TDEE (×${r.tdee.factorActividad})`, valor: `${r.tdee.valor} kcal` },
                        ],
                      })
                    }
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08]"
                  >
                    <span className="text-xs text-white/50">Calorías</span>
                    <span className="num mt-2 block text-3xl font-semibold">
                      {r.meta.kcalObjetivo}
                      <span className="text-base text-white/45"> kcal</span>
                    </span>
                    <span className="mt-1 block text-xs text-white/45">Proteína {r.meta.proteinaGramosDia} g/día</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormula({
                        titulo: "Índice cintura / estatura",
                        valorMostrado: `${r.indiceCinturaEstatura.valor} (meta: ${r.meta.cinturaMetaCm} cm)`,
                        categoria: r.indiceCinturaEstatura.categoria,
                        explicacionSimple: r.indiceCinturaEstatura.explicacionSimple,
                        formulaNombre: r.indiceCinturaEstatura.formulaNombre,
                        formulaExpresion: r.indiceCinturaEstatura.formulaExpresion,
                      })
                    }
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08]"
                  >
                    <span className="text-xs text-white/50">Cintura meta</span>
                    <span className="num mt-2 block text-3xl font-semibold">
                      {r.meta.cinturaMetaCm}
                      <span className="text-base text-white/45"> cm</span>
                    </span>
                    <span className="mt-1 block text-xs text-white/45">Hoy {r.meta.cinturaActualCm} cm</span>
                  </button>
                </div>

                <div className="mt-3 rounded-card border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-sm font-semibold">Trayectoria hacia tu meta</p>
                  <p className="text-xs text-white/45">Peso semana a semana, dentro de un ritmo saludable</p>
                  <div className="mt-3 h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={r.meta.trayectoria} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="onbGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgb(var(--c-accent))" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="rgb(var(--c-accent))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="semana"
                          tickFormatter={(v) => `S${v}`}
                          stroke="rgb(var(--c-ink) / 0.35)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          domain={["dataMin - 1.5", "dataMax + 1.5"]}
                          stroke="rgb(var(--c-ink) / 0.35)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgb(var(--c-raised))",
                            borderRadius: "14px",
                            border: "1px solid rgb(var(--c-ink) / 0.15)",
                            fontSize: "12px",
                            color: "rgb(var(--c-ink))",
                          }}
                          formatter={(val: number) => [`${val} kg`, "Plan"]}
                          labelFormatter={(l) => `Semana ${l}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="pesoPlanKg"
                          stroke="rgb(var(--c-accent))"
                          strokeWidth={2.5}
                          fill="url(#onbGrad)"
                        />
                        <ReferenceDot
                          x={0}
                          y={r.meta.pesoActualKg}
                          r={5}
                          fill="rgb(var(--c-ink))"
                          stroke="rgb(var(--c-accent))"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-white/45">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  {HEALTH_DISCLAIMER}
                </p>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Acción principal fija al pie */}
        <div className="sticky bottom-0 -mx-5 mt-auto bg-gradient-to-t from-canvas via-canvas/95 to-transparent px-5 pb-safe pt-6 sm:-mx-8 sm:px-8">
          {step < 5 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canContinue}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-semibold text-canvas shadow-glow transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {step === 0 ? "Empezar" : step === 4 ? "Calcular mi meta" : "Continuar"}
              <ArrowRight className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-semibold text-canvas shadow-glow transition active:scale-[0.99]"
            >
              <Check className="h-5 w-5 stroke-[2.8]" />
              Activar mi plan
            </button>
          )}
        </div>
      </div>

      <FormulaModal detail={formula} onClose={() => setFormula(null)} />
    </div>
  );
}
