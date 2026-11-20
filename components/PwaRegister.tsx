"use client";

import { useEffect } from "react";
import { registrarServiceWorker } from "@/lib/pwa";

/** Registra el service worker (modo sin conexión) al abrir la app. No dibuja nada. */
export function PwaRegister() {
  useEffect(() => {
    registrarServiceWorker();
  }, []);
  return null;
}
