"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Download, MessageCircle } from "lucide-react";
import { Sheet, SheetHeader } from "@/components/ui";
import {
  compartirImagen,
  DatosTarjeta,
  descargarImagen,
  dibujarTarjeta,
  textoParaCompartir,
} from "@/lib/shareCard";

/**
 * Hoja para compartir un logro como imagen vertical lista para WhatsApp.
 * Genera la tarjeta al abrir y la comparte con el menú nativo del celular.
 */
export function ShareSheet({ open, onClose, datos }: { open: boolean; onClose: () => void; datos: DatosTarjeta | null }) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const ultimo = useRef<DatosTarjeta | null>(null);
  if (datos) ultimo.current = datos;
  const d = datos ?? ultimo.current;

  useEffect(() => {
    if (!open || !datos) return;
    let vivo = true;
    let objUrl: string | null = null;
    setBlob(null);
    setUrl(null);
    setError(false);
    setAviso(null);
    dibujarTarjeta(datos)
      .then((b) => {
        if (!vivo) return;
        objUrl = URL.createObjectURL(b);
        setBlob(b);
        setUrl(objUrl);
      })
      .catch(() => vivo && setError(true));
    return () => {
      vivo = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [open, datos]);

  const compartir = async () => {
    if (!blob || !d) return;
    const r = await compartirImagen(blob, textoParaCompartir(d));
    if (r === "whatsapp") setAviso("Guardé la imagen y abrí WhatsApp: adjúntala en el chat.");
    else if (r === "compartido") setAviso("¡Compartido!");
  };

  return (
    <Sheet open={open} onClose={onClose} label="Compartir" maxWidth="max-w-sm" z="z-[95]">
      <SheetHeader eyebrow="Lista para WhatsApp" title="Comparte tu logro" onClose={onClose} />

      <div className="mx-auto mt-5 aspect-[9/16] w-full max-w-[15rem] overflow-hidden rounded-3xl bg-white/[0.05] shadow-card">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Vista previa de tu tarjeta" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/45">
            {error ? "No pude crear la imagen. Inténtalo otra vez." : <span className="animate-pulse">Preparando tu tarjeta…</span>}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={compartir}
        disabled={!blob}
        className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-full bg-accent py-4 text-base font-semibold text-canvas shadow-glow transition active:scale-[0.99] disabled:opacity-40 disabled:shadow-none"
      >
        <MessageCircle className="h-5 w-5" />
        Compartir por WhatsApp
      </button>
      <button
        type="button"
        onClick={() => blob && descargarImagen(blob)}
        disabled={!blob}
        className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 py-3.5 text-sm font-semibold transition hover:bg-white/5 disabled:opacity-40"
      >
        <Download className="h-4 w-4" />
        Guardar imagen
      </button>
      <p className="mt-3 min-h-[1.25rem] text-center text-xs text-white/45" aria-live="polite">
        {aviso ? (
          <span className="inline-flex items-center gap-1 text-accent">
            <Check className="h-3.5 w-3.5" /> {aviso}
          </span>
        ) : (
          "En el menú que se abre, elige WhatsApp (o Instagram, Estados…)."
        )}
      </p>
    </Sheet>
  );
}
