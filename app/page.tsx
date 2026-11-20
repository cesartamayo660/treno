"use client";

import React, { useState } from "react";
import { Dumbbell } from "lucide-react";
import { AppNav, MainTabId } from "@/components/AppNav";
import { Onboarding } from "@/components/Onboarding";
import { Splash } from "@/components/Splash";
import { Avatar } from "@/components/ui";
import { HoyTab } from "@/components/tabs/HoyTab";
import { EntrenarTab } from "@/components/tabs/EntrenarTab";
import { CuerpoTab } from "@/components/tabs/CuerpoTab";
import { CrewTab } from "@/components/tabs/CrewTab";
import { PerfilTab } from "@/components/tabs/PerfilTab";
import { useTreno } from "@/lib/store";
import { FloatingTraining } from "@/components/FloatingTraining";
import { PrCelebration } from "@/components/PrCelebration";
import { BadgeToast } from "@/components/badges";
import { EvolutionWatcher } from "@/components/Creature";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<MainTabId>("hoy");
  const { hydrated, onboarded, currentUser } = useTreno();

  const go = (tab: MainTabId) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const app = (
    <div className="treno-bg min-h-dvh">
      <AppNav activeTab={activeTab} onSelectTab={go} />
      <FloatingTraining activeTab={activeTab} onGo={go} />
      <PrCelebration />
      <BadgeToast onVer={() => go("perfil")} />
      <EvolutionWatcher />

      <div className="lg:pl-64">
        {/* Barra superior móvil */}
        <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 pb-1 pt-[max(env(safe-area-inset-top),1.25rem)] lg:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-canvas">
              <Dumbbell className="h-4 w-4 stroke-[2.6]" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">TRENO</span>
          </div>
          <button type="button" onClick={() => go("perfil")} aria-label="Ir a mi perfil">
            <Avatar nombre={currentUser.nombre} src={currentUser.avatar} className="h-9 w-9 text-xs" />
          </button>
        </header>

        <main className="mx-auto w-full max-w-md px-5 pb-32 pt-4 lg:max-w-5xl lg:px-10 lg:pb-16 lg:pt-10">
          <div key={activeTab} className="tab-enter">
            {activeTab === "hoy" && <HoyTab onNavigateTab={go} />}
            {activeTab === "entrenar" && <EntrenarTab />}
            {activeTab === "cuerpo" && <CuerpoTab />}
            {activeTab === "crew" && <CrewTab />}
            {activeTab === "perfil" && <PerfilTab />}
          </div>
        </main>
      </div>
    </div>
  );

  // La pantalla de inicio (Splash) ocupa siempre el mismo lugar del árbol: así su animación no
  // se reinicia cuando termina de leerse el almacenamiento local, y tapa lo que haya debajo.
  return (
    <>
      <Splash listo={hydrated} />
      {hydrated ? (onboarded ? app : <Onboarding />) : null}
    </>
  );
}
