"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Plus, Send, SmilePlus } from "lucide-react";
import { Avatar } from "@/components/ui";
import { EMOJIS_CREW, FeedItem, useTreno } from "@/lib/store";

const RAPIDAS = ["¡Bestial! 🔥", "Eso, máquina 💪", "¡A romperla! ⚡"];

/** Reacciones (con selector de emojis) y comentarios cortos de una publicación del Crew. */
export function FeedActions({ ev }: { ev: FeedItem }) {
  const { toggleReaction, addComment } = useTreno();
  const [picker, setPicker] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");

  const comentarios = ev.comentarios ?? [];
  const faltantes = EMOJIS_CREW.filter((e) => !ev.reacciones.some((r) => r.emoji === e));

  const enviar = (t: string) => {
    const limpio = t.trim();
    if (!limpio) return;
    addComment(ev.id, limpio);
    setTexto("");
  };

  return (
    <div className="mt-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {ev.reacciones.map((r) => (
          <motion.button
            key={r.emoji}
            type="button"
            whileTap={{ scale: 0.88 }}
            aria-pressed={r.reactedByMe}
            onClick={() => toggleReaction(ev.id, r.emoji)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
              r.reactedByMe ? "bg-accent/20 text-accent" : "bg-white/[0.07] text-white/70 hover:bg-white/10"
            }`}
          >
            <span>{r.emoji}</span>
            <span className="num">{r.count}</span>
          </motion.button>
        ))}

        {faltantes.length > 0 && (
          <button
            type="button"
            onClick={() => setPicker((v) => !v)}
            aria-expanded={picker}
            aria-label="Añadir reacción"
            className="inline-flex h-7 w-8 items-center justify-center rounded-full bg-white/[0.07] text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <SmilePlus className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
            abierto ? "bg-white/15 text-white" : "bg-white/[0.07] text-white/65 hover:bg-white/10"
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {comentarios.length > 0 ? <span className="num">{comentarios.length}</span> : "Comentar"}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {picker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 flex flex-wrap gap-1.5 rounded-2xl bg-white/[0.05] p-2">
              {faltantes.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    toggleReaction(ev.id, e);
                    setPicker(false);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition hover:bg-white/10 active:scale-90"
                  aria-label={`Reaccionar con ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {abierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="mt-3 space-y-2.5">
              {comentarios.map((c) => (
                <motion.li key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                  <Avatar nombre={c.autor} src={c.avatar} className="h-7 w-7 text-[10px]" />
                  <p className="min-w-0 rounded-2xl rounded-tl-md bg-white/[0.06] px-3 py-2 text-[13px] leading-snug">
                    <span className="font-semibold">{c.esMio ? "Tú" : c.autor.split(" ")[0]}</span>{" "}
                    <span className="text-white/75">{c.texto}</span>
                  </p>
                </motion.li>
              ))}
              {comentarios.length === 0 && <li className="text-xs text-white/40">Sé el primero en comentar.</li>}
            </ul>

            <div className="mt-2.5 flex gap-1.5 overflow-x-auto no-scrollbar">
              {RAPIDAS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => enviar(q)}
                  className="shrink-0 rounded-full border border-white/12 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/5 active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              className="mt-2 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                enviar(texto);
              }}
            >
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={140}
                placeholder="Escribe un comentario corto"
                aria-label="Comentario"
                className="min-w-0 flex-1 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm placeholder:text-white/30 focus:border-accent/70 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!texto.trim()}
                aria-label="Enviar comentario"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-canvas transition active:scale-90 disabled:opacity-35"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
