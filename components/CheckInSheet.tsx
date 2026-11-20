"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Check, ImageIcon, RotateCcw } from "lucide-react";
import { Sheet, SheetHeader } from "@/components/ui";
import { Gesto } from "@/lib/gestures";

interface Props {
  open: boolean;
  onClose: () => void;
  gesto: Gesto;
  sede: string;
  racha: number;
  onConfirm: (foto: string) => void;
}

/** Reduce a ~720 px y comprime a JPEG para que ocupe poco. */
function toJpeg(source: CanvasImageSource, w: number, h: number): string {
  const max = 720;
  const k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  c.getContext("2d")!.drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.72);
}

/**
 * Check-in con foto obligatoria: tu mano haciendo el gesto del día,
 * con el gimnasio de fondo. Sin selfies ni espejo.
 */
export function CheckInSheet({ open, onClose, gesto, sede, racha, onConfirm }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [camState, setCamState] = useState<"idle" | "loading" | "live" | "error">("idle");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState("error");
      return;
    }
    setCamState("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCamState("live");
    } catch {
      setCamState("error");
    }
  }, []);

  // Abre la cámara al mostrar la hoja; la apaga al cerrar
  useEffect(() => {
    if (open) {
      setFoto(null);
      start();
    } else {
      stop();
      setCamState("idle");
    }
    return stop;
  }, [open, start, stop]);

  // Conecta el stream al <video> cuando ya está en pantalla
  useEffect(() => {
    if (camState === "live" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => undefined);
    }
  }, [camState, foto]);

  const snap = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    setFoto(toJpeg(v, v.videoWidth, v.videoHeight));
    try {
      navigator.vibrate?.(20);
    } catch {
      /* noop */
    }
  };

  const fromFile = (f: File | undefined) => {
    if (!f) return;
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      setFoto(toJpeg(img, img.width, img.height));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <Sheet open={open} onClose={onClose} label="Check-in con foto">
      <SheetHeader eyebrow={sede} title="Check-in del día" onClose={onClose} />

      {/* Gesto del día */}
      <div className="mt-4 flex items-center gap-4 rounded-2xl bg-accent/10 p-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-4xl" aria-hidden>
          {gesto.emoji}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">Gesto de hoy</p>
          <p className="font-display text-xl font-semibold leading-tight">{gesto.nombre}</p>
          <p className="mt-0.5 text-[13px] leading-snug text-white/60">{gesto.instruccion}</p>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-snug text-white/50">
        Toma una foto de <strong className="text-white/80">tu mano</strong> haciendo el gesto, con el gimnasio de fondo.
        Sin selfie, sin espejo.
      </p>

      {/* Cámara / foto */}
      <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black/50">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="Tu foto del check-in" className="h-full w-full object-cover" />
        ) : camState === "live" ? (
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        ) : camState === "loading" ? (
          <div className="flex h-full items-center justify-center text-sm text-white/50">Abriendo cámara…</div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <Camera className="h-8 w-8 text-white/40" />
            <p className="text-sm text-white/55">
              No pudimos abrir la cámara. Permite el acceso o toma la foto con la cámara de tu teléfono.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={start} className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold">
                Reintentar
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold">
                <ImageIcon className="mr-1.5 inline h-3.5 w-3.5" />
                Usar cámara del teléfono
              </button>
            </div>
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          fromFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="mt-4">
        {foto ? (
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <button
              type="button"
              onClick={() => {
                setFoto(null);
                if (camState !== "live") start();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-4 text-sm font-semibold transition hover:bg-white/5"
            >
              <RotateCcw className="h-4 w-4" />
              Repetir
            </button>
            <button
              type="button"
              onClick={() => onConfirm(foto)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent py-4 text-base font-semibold text-canvas shadow-glow transition active:scale-[0.99]"
            >
              <Check className="h-5 w-5 stroke-[3]" />
              Registrar asistencia
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={snap}
            disabled={camState !== "live"}
            className="flex w-full items-center justify-center gap-2.5 rounded-full bg-accent py-4 text-base font-semibold text-canvas shadow-glow transition active:scale-[0.99] disabled:opacity-40 disabled:shadow-none"
          >
            <Camera className="h-5 w-5" />
            Tomar foto
          </button>
        )}
        <p className="mt-3 text-center text-xs text-white/40">
          La foto es obligatoria · tu Crew puede validar el gesto · racha actual: {racha} {racha === 1 ? "día" : "días"}
        </p>
      </div>
    </Sheet>
  );
}
