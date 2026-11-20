# TRENO — guía del proyecto

App de seguimiento de gimnasio, personal y social: registras entrenamientos, mides tu progreso hacia una meta calculada con fórmulas públicas y compites con amigos (Crew) en un ranking justo, según el objetivo de cada uno. Idioma de la interfaz: **español**, tono cercano y motivador.

- Repo: https://github.com/cesartamayo660/treno (rama `main`). Vercel despliega solo al hacer push.
- El usuario (César) prefiere respuestas directas, en español, y que se le explique en palabras simples. Le importa mucho el diseño visual y la prioridad es **móvil primero**, con buena adaptación a escritorio.

## Estado actual (fase 1, solo frontend)

La app es una **versión final de usuario único**, sin zona de demostración. Se eliminaron: conmutador Usuario A/B, panel B2B/CEO, landing de ventas, login falso.

- Flujo: `app/page.tsx` → splash → **Onboarding** (si no hay usuario) → app con 5 pestañas (Hoy · Entrenar · Cuerpo · Crew · Perfil).
- **Todo se guarda en `localStorage`** (no hay backend aún). Claves: `treno:v2` (usuario, Crew, feed, tema), `treno:training:v1` (rutinas, historial, sesión activa), `treno:photos` (fotos de progreso), `treno:crews` (Crews creados).
- El usuario arranca **desde cero** (sin historial inventado). El Crew trae amigos de ejemplo (Mateo, Valentina, Lucas, Camila, Sebastián) para que rankings y feed no estén vacíos; sus datos son semilla en `lib/demoData.ts`.
- Supabase **no se usa todavía** (`lib/supabase.ts` y `supabase/migrations/001_initial_schema.sql` quedan para la fase backend). `.env.local` está en `.gitignore`.

## Stack

Next.js 14 (App Router, export estático) · TypeScript · Tailwind 3 · framer-motion · recharts · lucide-react · vitest. Fuentes: Inter (texto) y Space Grotesk (números/títulos, clase `.num`).

## Comandos

```
npm run dev        # desarrollo en http://localhost:3000
npm run build      # next build + scripts/publicar-index.mjs → index.html en la raíz
npm run servir     # sirve la raíz en http://localhost:3300 (probar el index.html)
npm test           # vitest (bodyMetrics y trenoScore)
```

`output: "export"` genera `out/`; el script `publicar-index.mjs` vuelve relativas las rutas `/_next/…` y copia `index.html`, `_next/`, `manifest.json` e `icon.svg` a la raíz para que abra con doble clic y funcione en cualquier hosting. `next/font` no admite `assetPrefix` relativo: por eso se corrige en el script y no en `next.config.mjs`. Tras `npm run build` limpiar `out/`, `.next/` y `tsconfig.tsbuildinfo` (están en `.gitignore`; `index.html` y `_next/` de la raíz sí se versionan).

## Estructura

```
app/            layout.tsx (fuentes, script de tema, providers) · page.tsx (shell) · globals.css (tokens y animaciones) · icon.svg
components/
  AppNav.tsx          barra inferior (móvil) / menú lateral (lg+), píldora animada con layoutId
  Onboarding.tsx      bienvenida + 4 pasos + "Tu meta"
  CheckInSheet.tsx    check-in con cámara y gesto del día
  FloatingTraining.tsx  temporizador de descanso flotante + acceso a la sesión en curso
  FormulaModal.tsx    hoja "¿Cómo se calcula?"
  CountUpNumber.tsx · motion.tsx (Stagger/Item/Confetti/GrowBar) · ui.tsx (Avatar, Sheet, Toggle, Segmented…)
  tabs/               HoyTab · EntrenarTab · CuerpoTab · CrewTab · PerfilTab
lib/
  bodyMetrics.ts      motor científico (IMC, % grasa Marina EE.UU., FFMI, TMB/TDEE, DOTS, 1RM, meta)
  trenoScore.ts       TRENO Score 0–1000 (5 pilares) y detección de saltos
  freshUser.ts        crea el usuario real desde el onboarding y recalcula el score
  store.tsx           TrenoProvider: usuario, Crew, feed, tema, check-in, peso, persistencia
  training.tsx        TrainingProvider: rutinas, sesión activa, descanso, historial REAL
  gestures.ts         30 gestos de mano y gesto del día (determinista por fecha)
  exercisesData.ts    biblioteca de 65 ejercicios · demoData.ts amigos semilla
scripts/        publicar-index.mjs · servir.mjs
```

Providers en `layout.tsx`: `TrenoProvider` > `TrainingProvider` (el entrenamiento vive por encima de las pestañas para que la sesión y el descanso sigan mientras navegas).

## Diseño (no romper)

- **Un solo acento** (lima eléctrico en oscuro, verde bosque en claro) sobre neutros cálidos. Tema oscuro/claro por variables CSS en `app/globals.css` (`--c-ink`, `--c-base`, `--c-raised`, `--c-sink`, `--c-accent`, `--c-warn`, `--c-danger`).
- Tailwind remapea colores semánticos: **`white` = tinta** (se invierte en tema claro), **`black` = sombra**, **`canvas` = fondo** (texto sobre botones de acento/tinta), `raised`, `accent`, `warn`, `danger`. Así `bg-white/10`, `text-white/60` funcionan en ambos temas. Nunca usar `text-base` para el color de fondo (choca con el tamaño de fuente): se llama `canvas`.
- Colores en SVG/Recharts: `rgb(var(--c-accent))`, `rgb(var(--c-ink) / 0.4)`, etc.
- Un protagonista por pantalla, cifras grandes, detalle bajo demanda en hojas deslizables (`Sheet`). Tarjetas con `.glass-card` y `rounded-card`.
- Móvil: `max-w-md`; escritorio: menú lateral y grillas de 2 columnas. Los hijos de grids llevan `[&>*]:min-w-0` para evitar desbordes horizontales.
- Animaciones: entrada escalonada por pestaña (`.tab-enter` en CSS, `fill-mode: backwards` para no dejar `transform`), framer-motion para sheets/podio/anillos/confeti. Remotion **no** se usa en la app (renderiza video); se contempla solo para el recap compartible.

## Reglas de producto implementadas

- **TRENO Score** (0–1000): asistencia 30 %, fuerza relativa DOTS 25 %, meta corporal 25 %, volumen 10 %, constancia de registro 10 %. Un usuario nuevo empieza casi en 0 (el pilar de meta vale 0 hasta tener un segundo pesaje).
- **Check-in con foto obligatoria**: gesto de mano del día, cámara en vivo (`getUserMedia`, respaldo con `<input capture>`), sin galería. El gesto **no se verifica automáticamente**; el Crew lo valida con un toque (en el prototipo los amigos son de ejemplo). Terminar un entrenamiento **no** cuenta como check-in.
- **Entrenar**: rutinas propias (crear/editar/borrar, plantillas), reordenar ejercicios arrastrando (`Reorder` de framer-motion), descanso con un botón (preferencia 60/90/120/180 s, por defecto 1:30, widget flotante), confirmación al terminar con mensaje motivador, resumen sin tonelaje.
- **Antitrampas / 1RM**: 1RM estimado con Brzycki (≤10 reps) y Epley (>10). Hay récord (PR) solo si ya existe historial real. La alerta de "salto" solo aparece al **subir** más de 18 % sobre tu mejor marca real (bug previo con valor absoluto corregido). El "Anterior" sale del historial del usuario, no de datos de ejemplo.
- Privacidad: peso y medidas privados por defecto; el Crew solo ve % y puntos salvo que el usuario lo active.

## Pendiente / ideas acordadas

- Más cambios que César va a pedir a continuación.
- Backend con Supabase (Auth, base de datos, Storage privado para fotos con RLS, Realtime para feed y rankings); el esquema se define después de afinar el frontend.
- Revisar los puntos del Crew (Subida de carga, Meta, Rachas; vista semanal/mensual; hoy son valores semilla para los amigos).
- Animaciones de los ejercicios (pospuesto), verificación automática del gesto (reconocimiento de manos), notificaciones, retos con apuesta, recap semanal en video (Remotion), calculadora de discos, calentamiento sugerido.
- `lib/exercisesData.ts` aún trae `ultimoPesoKg`/`mejor1RmKg` de ejemplo; ya no se usan en Entrenar pero conviene limpiarlos.

## Convenciones

- Textos de interfaz y mensajes de commit en español; commits terminan con la línea de coautoría indicada por el entorno.
- Al cambiar `tailwind.config.ts` hay que **reiniciar** el servidor de desarrollo.
- El panel de vista previa oculto pausa las animaciones; para verificar visualmente conviene mostrar el panel y esperar unos segundos.
- Verificar siempre: `npx tsc --noEmit`, `npm test` y, antes de subir, `npm run build`.
