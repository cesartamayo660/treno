# TRENO — guía del proyecto

App de seguimiento de gimnasio, personal y social: registras entrenamientos, mides tu progreso hacia una meta calculada con fórmulas públicas y compites con amigos (Crew) en un ranking justo, según el objetivo de cada uno. Idioma de la interfaz: **español**, tono cercano y motivador.

- Repo: https://github.com/cesartamayo660/treno (rama `main`). Vercel despliega solo al hacer push.
- El usuario (César) prefiere respuestas directas, en español, y que se le explique en palabras simples. Le importa mucho el diseño visual y la prioridad es **móvil primero**, con buena adaptación a escritorio.

## Estado actual (fase 1, solo frontend)

La app es una **versión final de usuario único**, sin zona de demostración. Se eliminaron: conmutador Usuario A/B, panel B2B/CEO, landing de ventas, login falso.

- Flujo: `app/page.tsx` → splash → **Onboarding** (si no hay usuario) → app con 5 pestañas (Hoy · Entrenar · Cuerpo · Crew · Perfil).
- **Todo se guarda en `localStorage`** (no hay backend aún). Claves: `treno:v2` (usuario, Crew, feed, tema), `treno:training:v1` (rutinas, historial, sesión activa), `treno:photos` (fotos de progreso), `treno:crews` (Crews creados), `treno:badges:v1` (fecha de cada insignia), `treno:creature:v1` (última etapa vista de la criatura), `treno:notif` (aviso del descanso). "Borrar mis datos" limpia todas y recarga la página.
- El usuario arranca **desde cero** (sin historial inventado). El Crew trae amigos de ejemplo (Mateo, Valentina, Lucas, Camila, Sebastián) para que rankings y feed no estén vacíos; sus datos son semilla en `lib/demoData.ts`.
- Supabase **no se usa todavía** (`lib/supabase.ts` y `supabase/migrations/001_initial_schema.sql` quedan para la fase backend). `.env.local` está en `.gitignore`.

## Stack

Next.js 14 (App Router, export estático) · TypeScript · Tailwind 3 · framer-motion · recharts · lucide-react · vitest. Fuentes: Inter (texto) y Space Grotesk (números/títulos, clase `.num`).

## Comandos

```
npm run dev        # desarrollo en http://localhost:3000
npm run build      # next build + scripts/publicar-index.mjs → index.html en la raíz
npm run servir     # sirve la raíz en http://localhost:3300 (probar el index.html)
npm test           # vitest (bodyMetrics, trenoScore y nuevasFunciones: discos, sobrecarga, mapa muscular, proyección, insignias, criatura)
node scripts/generar-iconos.mjs   # regenera los PNG de la app instalable en /public
```

`output: "export"` genera `out/`; el script `publicar-index.mjs` vuelve relativas las rutas `/_next/…` y copia `index.html`, `_next/`, `manifest.json`, `sw.js` e iconos (`icon.svg`, `icon-192/512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`) a la raíz para que abra con doble clic y funcione en cualquier hosting. `next/font` no admite `assetPrefix` relativo: por eso se corrige en el script y no en `next.config.mjs`. Tras `npm run build` limpiar `out/`, `.next/` y `tsconfig.tsbuildinfo` (están en `.gitignore`; `index.html` y `_next/` de la raíz sí se versionan).

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
  GymMode.tsx         modo gimnasio a pantalla completa (un ejercicio, botones enormes, descanso automático, Wake Lock)
  PlateCalculator.tsx calculadora de discos con barra dibujada · PrCelebration.tsx celebración de PR (z-90)
  ShareSheet.tsx      vista previa + compartir tarjeta (WhatsApp) · FeedActions.tsx reacciones y comentarios del Crew
  MuscleMap.tsx       silueta frente/espalda con el historial · GoalProjection.tsx "¿cuándo llegas a tu meta?"
  badges.tsx          insignias (tiles, detalle, aviso) · Creature.tsx criatura Treno (5 etapas SVG), tarjeta y aviso de evolución
  PwaRegister.tsx     registra el service worker
  tabs/               HoyTab · EntrenarTab · CuerpoTab · CrewTab · PerfilTab
lib/
  bodyMetrics.ts      motor científico (IMC, % grasa Marina EE.UU., FFMI, TMB/TDEE, DOTS, 1RM, meta)
  trenoScore.ts       TRENO Score 0–1000 (5 pilares) y detección de saltos
  freshUser.ts        crea el usuario real desde el onboarding y recalcula el score
  store.tsx           TrenoProvider: usuario, Crew, feed, tema, check-in, peso, persistencia
  training.tsx        TrainingProvider: rutinas, sesión activa, descanso, historial REAL
  gestures.ts         30 gestos de mano y gesto del día (determinista por fecha)
  exercisesData.ts    biblioteca de 65 ejercicios · demoData.ts amigos semilla
  plates.ts           discos por lado (gramos enteros) · overload.ts sobrecarga progresiva (doble progresión)
  muscles.ts          estado muscular por recencia · projection.ts proyección de meta (recta de tendencia + rango)
  badges.ts           catálogo de 26 insignias y evaluación · badgesProvider.tsx persistencia y avisos
  creature.ts         XP de por vida y 5 etapas · shareCard.ts tarjeta 1080×1920 en <canvas> + Web Share
  pwa.ts              service worker, instalación y notificaciones · wakeLock.ts pantalla encendida
scripts/        publicar-index.mjs · servir.mjs · generar-iconos.mjs
public/         manifest.json · sw.js (offline) · iconos PNG/SVG
```

Providers en `layout.tsx`: `TrenoProvider` > `TrainingProvider` > `BadgesProvider` (el entrenamiento vive por encima de las pestañas para que la sesión y el descanso sigan mientras navegas). En `page.tsx` se montan, sobre cualquier pestaña, `PrCelebration`, `BadgeToast` y `EvolutionWatcher`. `Sheet` acepta `z` para abrirse encima del modo gimnasio (z-70).

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
- **Sobrecarga progresiva**: sugiere la carga de hoy con doble progresión (rangos 4–6, 8–12, 12–15 reps; +2,5 kg barra/polea, +1–2 kg mancuernas, +5 kg máquinas pesadas). Sin historial no sugiere nada. Aparece en la sesión, en el modo gimnasio y en el detalle del ejercicio.
- **PR en vivo**: `toggleSet` calcula fuera de setState y emite `prEvent` (una sola vez por marca; no repite si otra serie del día ya igualó el 1RM). Celebración con confeti y vibración, y tarjeta compartible.
- **Modo gimnasio**: descanso automático tras cada serie (salvo la última), deslizar entre ejercicios, Wake Lock (se vuelve a pedir al volver a la app), botón "Discos" en ejercicios de barra.
- **Proyección de meta**: exige ≥ 3 pesajes en ≥ 6 días (últimos 28), usa recta de mínimos cuadrados y da un RANGO de fechas; estados: sin datos, mantener, lograda, contrario, estancado (> 2 años), ok; avisa si baja/sube > 1 % del peso por semana. Usa `pesajesHistoricos` (hasta 90) del usuario.
- **Mapa muscular**: niveles por días desde el último entrenamiento del grupo (≤ 1, ≤ 3, ≤ 7, más); avisa del grupo abandonado (primero los que ya trabajabas).
- **Insignias**: 26, con rareza (común → legendaria) y progreso; un solo acento (más rara = más llena y con destello). Quien ya tenía datos recibe las ya cumplidas en silencio.
- **Criatura Treno**: evoluciona con XP de toda la vida (nunca retrocede). Cachorro 0 · Atleta 120 · Bestia 350 · Titán 800 · Leyenda 1600.
- **Compartir**: tarjeta vertical 1080×1920 dibujada en canvas, compartida como imagen con el menú nativo (WhatsApp); en escritorio guarda la imagen y abre `wa.me` con el texto.
- **Crew (prototipo)**: reacciones con selector, comentarios cortos y respuestas simuladas de los amigos de ejemplo a tus check-ins y PR (marcadas `simulado`); con el backend serán reales.
- **App instalable (PWA)**: manifest con PNG, service worker (red primero en páginas, caché para estáticos; solo en https/http, no en `file://` ni en desarrollo), botón instalar en Perfil, aviso de fin de descanso solo si la app está en segundo plano y el usuario lo permitió. En iPhone los avisos requieren instalarla.
- Privacidad: peso y medidas privados por defecto; el Crew solo ve % y puntos salvo que el usuario lo active.

## Pendiente / ideas acordadas

- Más cambios que César va a pedir a continuación.
- Sin verificar en dispositivo real: Web Share con archivos, Wake Lock en iPhone, notificaciones con la app en segundo plano. El Crew real (reacciones, validación) depende del backend.
- Backend con Supabase (Auth, base de datos, Storage privado para fotos con RLS, Realtime para feed y rankings); el esquema se define después de afinar el frontend.
- Revisar los puntos del Crew (Subida de carga, Meta, Rachas; vista semanal/mensual; hoy son valores semilla para los amigos).
- Animaciones de los ejercicios (pospuesto), verificación automática del gesto (reconocimiento de manos), notificaciones, retos con apuesta, recap semanal en video (Remotion), calculadora de discos, calentamiento sugerido.
- `lib/exercisesData.ts` aún trae `ultimoPesoKg`/`mejor1RmKg` de ejemplo; ya no se usan en Entrenar pero conviene limpiarlos.

## Convenciones

- Textos de interfaz y mensajes de commit en español; commits terminan con la línea de coautoría indicada por el entorno.
- Al cambiar `tailwind.config.ts` hay que **reiniciar** el servidor de desarrollo.
- El panel de vista previa oculto pausa las animaciones; para verificar visualmente conviene mostrar el panel y esperar unos segundos.
- Verificar siempre: `npx tsc --noEmit`, `npm test` y, antes de subir, `npm run build`.
