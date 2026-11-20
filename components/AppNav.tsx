"use client";

import React from "react";
import { Activity, Dumbbell, Flame, User, Users } from "lucide-react";
import { Avatar } from "@/components/ui";
import { useTreno } from "@/lib/store";

export type MainTabId = "hoy" | "entrenar" | "cuerpo" | "crew" | "perfil";

export const TABS: {
  id: MainTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "hoy", label: "Hoy", icon: Flame },
  { id: "entrenar", label: "Entrenar", icon: Dumbbell },
  { id: "cuerpo", label: "Cuerpo", icon: Activity },
  { id: "crew", label: "Crew", icon: Users },
  { id: "perfil", label: "Perfil", icon: User },
];

interface AppNavProps {
  activeTab: MainTabId;
  onSelectTab: (tab: MainTabId) => void;
}

/**
 * Navegación principal.
 * - Móvil: barra inferior de 5 pestañas con icono + etiqueta (siempre visibles, zona del pulgar).
 * - Escritorio (lg+): menú lateral fijo con la marca y el perfil.
 */
export function AppNav({ activeTab, onSelectTab }: AppNavProps) {
  const { currentUser } = useTreno();

  return (
    <>
      {/* Móvil / tablet */}
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-canvas/85 backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-safe pt-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <li key={tab.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={active ? "page" : undefined}
                  className="group relative flex w-full flex-col items-center gap-1 rounded-2xl py-2 transition"
                >
                  <span
                    className={`flex h-8 w-14 items-center justify-center rounded-full transition-all ${
                      active ? "bg-accent text-canvas" : "text-white/55 group-active:bg-white/10"
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] ${active ? "stroke-[2.4]" : "stroke-[1.9]"}`} />
                  </span>
                  <span
                    className={`text-[11px] font-medium leading-none ${
                      active ? "text-white" : "text-white/50"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Escritorio */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-canvas/60 px-4 py-6 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-2.5 px-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-canvas">
            <Dumbbell className="h-[18px] w-[18px] stroke-[2.6]" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">TRENO</span>
        </div>

        <ul className="mt-9 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/55 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${active ? "text-accent" : ""}`} />
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => onSelectTab("perfil")}
          className="mt-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:bg-white/[0.08]"
        >
          <Avatar nombre={currentUser.nombre} src={currentUser.avatar} className="h-10 w-10 text-sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{currentUser.nombre}</span>
            <span className="block truncate text-xs text-white/50">
              {currentUser.reporteActual.meta.etiquetaObjetivo}
            </span>
          </span>
        </button>
      </aside>
    </>
  );
}
