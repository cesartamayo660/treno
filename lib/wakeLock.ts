"use client";

import { useEffect, useState } from "react";

/**
 * Mantiene la pantalla encendida mientras `active` sea true (útil entre series).
 * Si el navegador no lo soporta, no pasa nada: la app sigue funcionando.
 * El sistema suelta el bloqueo al cambiar de app, así que se vuelve a pedir al regresar.
 */
export function useWakeLock(active: boolean) {
  const [encendida, setEncendida] = useState(false);

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelado = false;

    const pedir = async () => {
      try {
        sentinel = await navigator.wakeLock.request("screen");
        if (cancelado) {
          void sentinel.release();
          return;
        }
        setEncendida(true);
        sentinel.addEventListener("release", () => setEncendida(false));
      } catch {
        setEncendida(false);
      }
    };

    const alVolver = () => {
      if (document.visibilityState === "visible" && !cancelado) void pedir();
    };

    void pedir();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", alVolver);
      void sentinel?.release().catch(() => undefined);
      setEncendida(false);
    };
  }, [active]);

  return encendida;
}
