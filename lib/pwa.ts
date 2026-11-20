"use client";

/**
 * App instalable (PWA): service worker, botón "Instalar" y avisos del descanso.
 * Todo es opcional: si el navegador no lo soporta, la app funciona igual.
 */
import { useEffect, useState } from "react";

const NOTIF_KEY = "treno:notif";

/* ───────────────────────── Service worker ───────────────────────── */
export function registrarServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (!/^https?:$/.test(window.location.protocol)) return; // con doble clic (file://) no aplica
  if (process.env.NODE_ENV !== "production") return; // en desarrollo evita cachés confusos
  const registrar = () => navigator.serviceWorker.register("./sw.js").catch(() => undefined);
  if (document.readyState === "complete") registrar();
  else window.addEventListener("load", registrar, { once: true });
}

/* ───────────────────────── Notificaciones ───────────────────────── */
export function notificacionesSoportadas() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificacionesActivas(): boolean {
  try {
    return notificacionesSoportadas() && Notification.permission === "granted" && localStorage.getItem(NOTIF_KEY) === "1";
  } catch {
    return false;
  }
}

export function desactivarNotificaciones() {
  try {
    localStorage.setItem(NOTIF_KEY, "0");
  } catch {
    /* noop */
  }
}

export async function activarNotificaciones(): Promise<"ok" | "denegado" | "no-soportado"> {
  if (!notificacionesSoportadas()) return "no-soportado";
  let permiso = Notification.permission;
  if (permiso === "default") permiso = await Notification.requestPermission();
  try {
    localStorage.setItem(NOTIF_KEY, permiso === "granted" ? "1" : "0");
  } catch {
    /* noop */
  }
  return permiso === "granted" ? "ok" : "denegado";
}

async function mostrar(titulo: string, cuerpo: string, tag: string) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(titulo, {
        body: cuerpo,
        tag,
        icon: "./icon-192.png",
        badge: "./icon-192.png",
      } as NotificationOptions);
      return;
    }
    new Notification(titulo, { body: cuerpo, tag });
  } catch {
    /* sin permiso o sin soporte */
  }
}

/** Solo avisa si la app está en segundo plano (si la estás mirando, ya ves el temporizador). */
export function avisarDescansoTerminado() {
  if (typeof document === "undefined" || !document.hidden) return;
  if (!notificacionesActivas()) return;
  void mostrar("¡A darle! 💪", "Terminó tu descanso. Toca la siguiente serie.", "descanso");
}

/* ───────────────────────── Instalación ───────────────────────── */
interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let diferido: EventoInstalacion | null = null;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    diferido = e as EventoInstalacion;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    diferido = null;
    avisar();
  });
}

export function useInstalacion() {
  const [, forzar] = useState(0);
  const [entorno, setEntorno] = useState({ instalada: false, ios: false });

  useEffect(() => {
    const f = () => forzar((n) => n + 1);
    oyentes.add(f);
    const instalada =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setEntorno({ instalada, ios: /iphone|ipad|ipod/i.test(navigator.userAgent) });
    return () => {
      oyentes.delete(f);
    };
  }, []);

  return {
    instalada: entorno.instalada,
    esIos: entorno.ios,
    puedeInstalar: !!diferido,
    instalar: async () => {
      if (!diferido) return false;
      await diferido.prompt();
      const { outcome } = await diferido.userChoice;
      diferido = null;
      avisar();
      return outcome === "accepted";
    },
  };
}
