"use client";

/**
 * Insignias: calcula tu progreso con datos reales, recuerda cuándo desbloqueaste
 * cada una y avisa (una a la vez) cuando consigues una nueva.
 * Si ya tenías datos antes de existir las insignias, las ya cumplidas se registran
 * en silencio para no llenarte de avisos de golpe.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { EstadisticasInsignias, evaluarInsignias, InsigniaEstado, nuevasInsignias } from "./badges";
import { exerciseById, useTraining } from "./training";
import { useTreno } from "./store";
import { todayIso } from "./freshUser";

const KEY = "treno:badges:v1";

export interface InsigniaConFecha extends InsigniaEstado {
  /** Día en que se desbloqueó (ISO), si ya está lograda. */
  fecha?: string;
}

interface BadgesContextValue {
  insignias: InsigniaConFecha[];
  estadisticas: EstadisticasInsignias;
  logradas: number;
  /** Insignia recién desbloqueada que se está anunciando. */
  anuncio: InsigniaConFecha | null;
  cerrarAnuncio: () => void;
}

const BadgesContext = createContext<BadgesContextValue | null>(null);

export function BadgesProvider({ children }: { children: React.ReactNode }) {
  const { currentUser: u, hydrated: storeListo } = useTreno();
  const { history, hydrated: entrenoListo } = useTraining();

  const [desbloqueadas, setDesbloqueadas] = useState<Record<string, string> | null>(null);
  const [cola, setCola] = useState<string[]>([]);

  const estadisticas = useMemo<EstadisticasInsignias>(() => {
    const st = u.estadisticasVitalicias;
    const mejor1Rm: Record<string, number> = {};
    const grupos = new Set<string>();
    let distintos = 0;
    for (const [id, h] of Object.entries(history)) {
      if (!h.length) continue;
      distintos += 1;
      mejor1Rm[id] = h.reduce((m, e) => Math.max(m, e.oneRm), 0);
      const g = exerciseById(id)?.grupoMuscular;
      if (g) grupos.add(g);
    }
    return {
      entrenamientos: st.entrenamientos,
      tonelajeKg: st.tonelajeTotalKg,
      diasGym: st.diasGym,
      prs: st.prsLogrados,
      racha: u.rachaDias,
      semanasPerfectas: u.rachaSemanasPerfectas,
      mejor1Rm,
      ejerciciosDistintos: distintos,
      gruposTrabajados: grupos.size,
      pesajes: (u.pesajesHistoricos ?? u.pesajesUltimos14Dias).length,
    };
  }, [u, history]);

  const estados = useMemo(() => evaluarInsignias(estadisticas), [estadisticas]);

  // 1) Carga inicial (cuando ya se leyó todo el almacenamiento)
  useEffect(() => {
    if (!storeListo || !entrenoListo || desbloqueadas !== null) return;
    let guardado: Record<string, string> | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) guardado = JSON.parse(raw);
    } catch {
      /* sin almacenamiento */
    }
    if (guardado) {
      setDesbloqueadas(guardado);
      return;
    }
    // Primera vez: lo ya cumplido se registra en silencio
    const hoy = todayIso();
    const base: Record<string, string> = {};
    estados.filter((e) => e.logrado).forEach((e) => (base[e.def.id] = hoy));
    setDesbloqueadas(base);
    try {
      localStorage.setItem(KEY, JSON.stringify(base));
    } catch {
      /* noop */
    }
  }, [storeListo, entrenoListo, desbloqueadas, estados]);

  // 2) Detecta nuevas insignias y las anuncia
  useEffect(() => {
    if (desbloqueadas === null) return;
    const nuevas = nuevasInsignias(estados, desbloqueadas);
    if (!nuevas.length) return;
    const hoy = todayIso();
    const siguiente = { ...desbloqueadas };
    nuevas.forEach((id) => (siguiente[id] = hoy));
    setDesbloqueadas(siguiente);
    setCola((c) => [...c, ...nuevas]);
    try {
      localStorage.setItem(KEY, JSON.stringify(siguiente));
    } catch {
      /* noop */
    }
  }, [estados, desbloqueadas]);

  const insignias = useMemo<InsigniaConFecha[]>(
    () => estados.map((e) => ({ ...e, fecha: desbloqueadas?.[e.def.id] })),
    [estados, desbloqueadas]
  );

  const anuncio = useMemo(() => insignias.find((i) => i.def.id === cola[0]) ?? null, [insignias, cola]);

  const value = useMemo<BadgesContextValue>(
    () => ({
      insignias,
      estadisticas,
      logradas: insignias.filter((i) => i.logrado).length,
      anuncio,
      cerrarAnuncio: () => setCola((c) => c.slice(1)),
    }),
    [insignias, estadisticas, anuncio]
  );

  return <BadgesContext.Provider value={value}>{children}</BadgesContext.Provider>;
}

export function useBadges() {
  const ctx = useContext(BadgesContext);
  if (!ctx) throw new Error("useBadges debe usarse dentro de BadgesProvider");
  return ctx;
}
