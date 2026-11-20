# PROMPT MAESTRO — TRENO (Fase 1 en Google Antigravity)

> Copia todo lo que está debajo de la línea y pégalo en Antigravity, junto con las imágenes de referencia de diseño.

---

Actúa como un equipo de producto de primer nivel (product manager, diseñador UX/UI, ingeniero full-stack y especialista en ciencias del deporte). Vas a construir la primera versión funcional de **TRENO**, una app de seguimiento del gimnasio, personal y social, que se presentará al CEO de una cadena global de gimnasios (del nivel de Gold's Gym) como producto insignia. Tiene que verse y sentirse como un producto de 18 millones de dólares: pulido, rápido, con datos que se sientan reales y con una propuesta de valor clara desde la primera pantalla.

## 1. Visión del producto

**Frase de una línea:** "TRENO convierte tu progreso en el gimnasio en un juego justo que juegas con tus amigos."

TRENO tiene dos modos que conviven:

1. **Modo Personal:** registras tus entrenamientos, tu asistencia, tus medidas corporales y tu progreso hacia una meta física calculada con fórmulas científicas públicas.
2. **Modo Comunidad (Crews):** creas o te unes a un grupo con tus amigos, pactan qué días van a ir al gimnasio y compiten en un ranking **justo**: cada persona es evaluada según **su propio objetivo** (ganar peso, perder grasa, recomposición o fuerza), no con la misma vara para todos.

**El problema que resuelve:** la mayoría de la gente abandona el gimnasio entre el mes 2 y el mes 4. La accountability social y la gamificación justa son lo que retiene. Para una cadena de gimnasios, TRENO es una herramienta de **retención de socios**.

## 2. Usuarios y caso de uso semilla

- Usuario principal: persona de 18 a 40 años que entrena con pesas de 3 a 6 veces por semana.
- Caso de demo obligatorio (datos semilla): **dos amigos de estatura similar** con objetivos opuestos.
  - Usuario A quiere **subir de peso / ganar masa muscular** (volumen).
  - Usuario B quiere **bajar de peso / perder grasa** (definición).
  - La app les calcula a cada uno su peso objetivo, % de grasa objetivo y masa muscular objetivo, y demuestra que a pesar de medir lo mismo sus metas son distintas y aun así compiten de igual a igual en el ranking.
  - Deja estos datos como editables en el onboarding (estatura, peso, edad, sexo, medidas). Si no hay datos reales, usa valores realistas de demo (ej. ambos 1.75 m; A: 64 kg, B: 88 kg).

## 3. Motor de cálculo corporal (fórmulas públicas)

Implementa un módulo aislado y testeable (`lib/bodyMetrics.ts`) con estas fórmulas. Cada resultado se muestra con una explicación corta en lenguaje simple y la fórmula usada (tooltip o "¿cómo se calcula?").

### 3.1 Entradas del perfil
Sexo biológico (para las fórmulas), edad, estatura (cm), peso (kg), nivel de actividad, y medidas con cinta métrica: cuello, cintura (a la altura del ombligo), cadera (obligatoria en mujeres), pecho, brazo, muslo, pantorrilla. Opcional: % de grasa de bioimpedancia o DEXA si el usuario lo tiene (si existe, tiene prioridad sobre la estimación).

### 3.2 Fórmulas
- **IMC (Índice de Masa Corporal):** `peso / estatura_m²`. Categorías OMS: <18.5 bajo peso, 18.5–24.9 normal, 25–29.9 sobrepeso, ≥30 obesidad. Advierte que el IMC no distingue músculo de grasa (por eso se complementa con lo siguiente).
- **% de grasa corporal — Fórmula de la Marina de EE. UU. (en cm):**
  - Hombre: `495 / (1.0324 − 0.19077·log10(cintura − cuello) + 0.15456·log10(estatura)) − 450`
  - Mujer: `495 / (1.29579 − 0.35004·log10(cintura + cadera − cuello) + 0.22100·log10(estatura)) − 450`
- **Masa magra (LBM):** `peso × (1 − %grasa/100)`. **Masa grasa:** `peso − LBM`.
- **FFMI (índice de masa libre de grasa, indicador de masa muscular):** `LBM / estatura_m²`, y FFMI normalizado: `FFMI + 6.1 × (1.8 − estatura_m)`. Referencia: ~18–20 promedio, 20–22 atlético, 22–25 muy musculado (hombres; restar ~3–4 puntos para mujeres).
- **Metabolismo basal (TMB/BMR):**
  - Mifflin-St Jeor: hombre `10·peso + 6.25·estatura − 5·edad + 5`; mujer `... − 161`.
  - Katch-McArdle (si hay % de grasa): `370 + 21.6 × LBM`. Mostrar ambas y usar Katch-McArdle como principal cuando exista el dato de grasa.
- **Gasto energético diario total (TDEE):** `TMB × factor de actividad` (1.2 sedentario, 1.375 ligero, 1.55 moderado, 1.725 alto, 1.9 muy alto).
- **Índice cintura/estatura:** `cintura / estatura`. Saludable < 0.5.
- **Peso ideal (rango):** mostrar el rango de peso saludable según IMC 18.5–24.9 para su estatura y, como referencia, las fórmulas de Devine, Robinson y Miller.
- **Fuerza — 1RM estimado:** Epley `peso × (1 + reps/30)` y Brzycki `peso × 36 / (37 − reps)` (usar Epley por defecto, Brzycki para reps ≤ 10).
- **Fuerza relativa entre personas de distinto peso:** coeficiente **DOTS** (estándar del powerlifting) para que alguien de 64 kg y alguien de 88 kg compitan de forma justa en fuerza.

### 3.3 Generador de meta objetivo
A partir de lo anterior, la app propone una **meta** por usuario (editable, con rangos seguros):

| Objetivo | % grasa meta (hombre / mujer) | Ritmo saludable | Calorías | Proteína |
|---|---|---|---|---|
| Ganar masa (volumen) | 10–15% / 18–24% | +0.25 a +0.5% del peso corporal por semana | TDEE + 250 a 500 kcal | 1.6–2.2 g/kg |
| Perder grasa (definición) | 12–15% / 20–24% | −0.5 a −1% del peso corporal por semana | TDEE − 300 a 500 kcal | 2.0–2.4 g/kg |
| Recomposición | bajar 2–4 puntos de grasa manteniendo peso | ±0 | ≈ TDEE | 1.8–2.2 g/kg |
| Fuerza | mantener grasa | según bloque | TDEE + 0–250 | 1.6–2.0 g/kg |

- **Peso meta** = `LBM_meta / (1 − %grasa_meta)`, donde LBM_meta es la masa magra actual (+ la ganancia muscular esperada en volumen, ~0.5–1 kg de músculo/mes para principiantes, menos para avanzados).
- La meta incluye **fecha estimada** según el ritmo, **medidas objetivo** (cintura objetivo para que el índice cintura/estatura < 0.5, etc.) y **FFMI objetivo**.
- Muestra la meta como una "línea de trayectoria": dónde estás, dónde deberías estar hoy según el plan y dónde termina.
- Incluye un aviso visible: "Estimaciones con fórmulas públicas; no sustituyen la evaluación de un profesional de la salud."

## 4. Sistema de puntos justo: el TRENO Score

Es el corazón del producto. Cada semana cada miembro de un Crew suma un **TRENO Score de 0 a 1000**, formado por 5 pilares. Los pesos son configurables por el admin del Crew (estos son los de por defecto):

1. **Asistencia (30%)**: % de días pactados cumplidos. Check-in en el gimnasio con geolocalización (radio del gimnasio registrado) + opción de foto. Ir un día extra da un bonus pequeño; faltar a un día pactado resta. Las rachas multiplican (×1.1 a las 2 semanas perfectas, ×1.2 a las 4).
2. **Progreso de fuerza (25%)**: mejora % del 1RM estimado en los ejercicios principales (sentadilla, press banca, peso muerto, press militar, dominadas/remo) frente a la semana o el mes anterior, normalizada con DOTS. Así gana quien **progresa más respecto a sí mismo**, no solo quien carga más en absoluto.
3. **Progreso hacia la meta corporal (25%)**: se mide **según el objetivo de cada uno**:
   - Quien hace volumen suma por kg ganado **dentro del ritmo saludable** (si sube demasiado rápido, que suele ser grasa, los puntos se aplanan).
   - Quien hace definición suma por kg y cm de cintura perdidos **dentro del ritmo saludable** (bajar demasiado rápido no da más puntos y muestra una alerta de salud).
   - Recomposición: puntos por bajar el % de grasa sin perder fuerza.
   - Se calcula como "% del camino recorrido esta semana frente a lo planeado", así los objetivos opuestos son comparables.
4. **Volumen de entrenamiento (10%)**: tonelaje total (series × reps × peso) frente al promedio de las últimas 4 semanas del propio usuario.
5. **Consistencia de registro (10%)**: registró sus medidas semanales, su peso (mínimo 3 veces por semana para usar un promedio móvil de 7 días que filtre fluctuaciones de agua) y sus entrenamientos.

**Rankings disponibles en el Crew** (pestañas): General (TRENO Score), Asistencia, Más fuerte (fuerza absoluta y relativa DOTS), Mayor subida de carga de la semana/mes, Progreso hacia la meta, Rachas. Filtros: semana, mes, temporada (8 semanas), todo el tiempo.

**Antitrampas:** check-in con geocerca, detección de saltos de peso o de carga irreales (outliers que se marcan para revisión), "validación por compañero" opcional en los récords personales, e historial auditable.

## 5. Funcionalidades (alcance de la Fase 1, MVP)

### Personal
- Onboarding en 4 pasos: datos básicos → medidas → objetivo → días de gimnasio. Al terminar: pantalla "Tu meta" con el resultado del motor de cálculo (momento wow).
- Dashboard "Hoy": anillo de progreso semanal, ¿hoy toca gimnasio?, botón grande de **Check-in**, racha actual, TRENO Score de la semana, siguiente hito.
- Registro de entrenamiento: rutinas guardadas, ejercicios con series/reps/peso/RPE, temporizador de descanso, autocompletado del último peso usado, detección automática de **PR (récord personal)** con una celebración.
- Biblioteca de ejercicios (al menos 60 precargados, agrupados por músculo).
- Cuerpo: peso diario (promedio móvil de 7 días), medidas semanales, % de grasa estimado, FFMI, gráficas de evolución, fotos de progreso privadas (comparador antes/después).
- Metas: trayectoria plan vs. real, proyección de fecha de llegada.

### Comunidad (Crews)
- Crear un Crew (nombre, foto, gimnasio(s), días pactados, duración de temporada, pesos del score) e invitar por link o código.
- Feed del Crew: check-ins, PRs, rachas, logros (con reacciones). Solo actividad, nada de información corporal sensible salvo que el usuario la comparta.
- Rankings (sección 4) con podio animado y tu posición destacada.
- **Retos 1 vs 1 o grupales** (ej. "quien más días vaya en noviembre", "primero en llegar a 100 kg en banca") con apuesta simbólica escrita (ej. "el que pierde invita los batidos").
- **Recap semanal** cada domingo: resumen tipo "Wrapped" del Crew (MVP de la semana, mayor mejora, racha más larga), listo para compartir en historias.

### Privacidad
- Por defecto, el peso y las medidas son **privados**; el ranking del Crew solo muestra % de progreso y puntos, no kilos ni medidas, salvo que el usuario lo active.

## 6. Visión B2B (para el pitch al CEO, no se construye completa en la Fase 1)
Incluye una sección "Para gimnasios" en la landing y un **panel de administración de demostración (datos simulados)** que muestre lo que obtendría la cadena:
- Panel por sede: socios activos, asistencia, riesgo de abandono (socios cuya asistencia cae), retención a 30/60/90 días.
- Ligas entre sedes ("Sede Miraflores vs. Sede San Isidro").
- Cuentas de entrenadores que siguen a sus clientes.
- Marca blanca (white-label) con el branding de la cadena y check-in por QR en la recepción.
- Modelo de negocio: freemium para usuarios + licencia SaaS por sede para cadenas + retos patrocinados por marcas (suplementos, ropa deportiva).

## 7. Pantallas y secciones

Barra inferior móvil con 5 tabs: **Hoy · Entrenar · Cuerpo · Crew · Perfil**.

**Regla de oro de cada pantalla:** una idea principal por pantalla, máximo 3 o 4 bloques visibles sin hacer scroll. Lo secundario va más abajo, en un detalle o en una hoja deslizable (bottom sheet). Si un bloque no ayuda a decidir o a motivar *hoy*, no va en la vista principal.

### 7.1 Hoy (inicio)
Lo único que importa: ¿me toca ir hoy y cómo voy esta semana?
1. Saludo corto + fecha + racha (🔥 12 días), en una sola línea.
2. **Elemento protagonista:** anillo grande de la semana (días cumplidos / días pactados) con el TRENO Score al centro.
3. Botón principal de **Check-in** (o "Empezar entrenamiento" si ya hizo el check-in). Es el único botón destacado de la pantalla.
4. Una tarjeta pequeña de contexto que va rotando: tu posición en el Crew ("Vas 2.º, a 40 pts de Diego") o el próximo hito.

### 7.2 Entrenar
1. Arriba: la rutina sugerida de hoy en una tarjeta (nombre, ejercicios, duración estimada) + "Empezar".
2. Debajo: mis rutinas en una lista simple y un acceso a la biblioteca de ejercicios.
3. **Modo entrenamiento activo** (pantalla de enfoque, casi sin elementos): el ejercicio actual en grande, las series en filas limpias (peso · reps · ✓), el temporizador de descanso como un anillo discreto y el último peso usado como referencia en gris.
4. Al terminar: un resumen de una pantalla (duración, tonelaje, PRs) con una celebración sutil si hubo récord.

### 7.3 Cuerpo
1. Arriba: tu peso de tendencia (promedio de 7 días) en número grande + flecha de variación semanal.
2. **Tarjeta "Tu meta":** la línea de trayectoria (plan vs. real) con el punto "estás aquí" y la fecha estimada de llegada.
3. Fila de 3 indicadores compactos: % de grasa · FFMI · cintura/estatura. Al tocar uno se abre su detalle con la fórmula explicada.
4. Accesos secundarios: medidas, fotos de progreso (privadas), "Registrar peso" (botón flotante pequeño).

### 7.4 Crew
1. Encabezado: nombre y foto del Crew + semana actual de la temporada (ej. "Semana 3 de 8").
2. **Podio del top 3** (elemento protagonista) + tu posición destacada si no estás en el podio.
3. Selector de ranking en chips horizontales: General · Asistencia · Fuerza · Subida de carga · Meta · Rachas.
4. Debajo: el feed de actividad (check-ins, PRs, retos) con reacciones, y el reto activo en una tarjeta.
5. Si el usuario tiene varios Crews, se cambia entre ellos desde el encabezado.

### 7.5 Perfil
Avatar, objetivo actual, logros/insignias en una cuadrícula pequeña, estadísticas de por vida (entrenamientos, kg levantados, días de gimnasio) y acceso a Ajustes (unidades, privacidad, notificaciones, gimnasio, tema claro/oscuro).

### 7.6 Pantallas fuera de los tabs
- **Landing pública:** hero con la frase de una línea, 3 beneficios, captura de la app y CTA. Sección "Para gimnasios".
- **Login / Registro.**
- **Onboarding (4 pasos):** una pregunta por pantalla, con barra de progreso arriba. Termina en la pantalla **"Tu meta"**, que es el primer momento wow: números que cuentan hacia arriba y la trayectoria dibujándose.
- **Detalle de ejercicio:** historial, 1RM estimado y gráfica de progreso.
- **Crear / Unirse a un Crew:** flujo de 3 pasos (nombre → días pactados → invitar).
- **Reto:** reglas, participantes, marcador en vivo y apuesta.
- **Recap semanal:** formato de historias (pantallas verticales que se deslizan), listo para compartir.
- **Panel B2B (demo):** vista de escritorio para la cadena de gimnasios.

## 8. Diseño visual (UX/UI)

- **Sigue estrictamente las imágenes de referencia que te adjunto en este chat**: paleta, tipografía, espaciados, estilo de tarjetas, iconografía y nivel de detalle. Las referencias mandan sobre cualquier suposición tuya.
- Dirección general: **minimalista y futurista**, pero sobria. Mucho espacio en blanco (o en negro), jerarquía tipográfica fuerte, los datos como protagonistas, microinteracciones y animaciones sutiles (anillos que se llenan, números que cuentan hacia arriba, celebración discreta en PRs).
- Mobile-first, que también se vea excelente en escritorio. Modo oscuro y claro.
- Las gráficas deben ser limpias y legibles (sin adornos innecesarios).
- No inventes un estilo propio si choca con las referencias; si algo no está cubierto por las imágenes, extrapola de forma coherente con ellas.

### Principios de composición (indicaciones ligeras; la estética concreta sale de las referencias)
- **Minimalista, pero no plano.** Evita tanto la pantalla saturada como la pantalla vacía y sin vida. Da profundidad con recursos sutiles: capas y tarjetas con una elevación leve, desenfoque de fondo (glass) donde las referencias lo permitan, degradados suaves en los elementos protagonistas, brillo tenue en los anillos de progreso y una textura o un fondo con algo de matiz en lugar de un color totalmente liso.
- **Un protagonista por pantalla** (el anillo, el podio, la trayectoria o el número grande). Todo lo demás, más pequeño y con menos contraste.
- **Un solo color de acento**, reservado para la acción principal y el progreso. El resto, en neutros.
- **Los números son el diseño:** cifras grandes con una tipografía de buen peso y unidades pequeñas al lado (ej. **82.4** kg).
- **Aire:** márgenes generosos y espaciado consistente. Es preferible hacer scroll a apretar los elementos.
- **Divulgación progresiva:** el detalle (fórmulas, historial, ajustes) se abre al tocar, no se muestra todo de golpe.
- **Movimiento con propósito:** transiciones suaves entre pantallas, números que cuentan hacia arriba, anillos que se llenan y retroalimentación háptica/visual en el check-in y en los PRs. Nada de animaciones decorativas que distraigan.
- **Estados vacíos cuidados:** cuando no hay datos, una ilustración o un mensaje breve y una única acción ("Registra tu primer entrenamiento").

## 9. Stack técnico

- **Next.js (App Router) + TypeScript + Tailwind CSS**, instalable como **PWA** (funciona como app en el celular).
- **Supabase**: Auth (email + Google), base de datos Postgres, Storage (fotos de progreso privadas), Realtime (feed y rankings en vivo).
- **Row Level Security ACTIVADO** en todas las tablas: cada usuario solo ve sus datos privados; los miembros de un Crew solo ven los datos compartidos de ese Crew.
- Gráficas con Recharts. Animaciones con Framer Motion.
- Deploy en Vercel; código en GitHub.
- Credenciales en `.env.local` (nunca en el código):
  - `NEXT_PUBLIC_SUPABASE_URL=[PEGAR AQUÍ]`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=[PEGAR AQUÍ]`

### Modelo de datos (crea las migraciones SQL)
- `profiles` (id = auth.uid, nombre, avatar, sexo, fecha_nacimiento, estatura_cm, nivel_actividad, objetivo, unidad_preferida, privacidad)
- `body_measurements` (id, user_id, fecha, peso_kg, cuello, cintura, cadera, pecho, brazo, muslo, pantorrilla, grasa_pct_manual)
- `goals` (id, user_id, tipo, peso_meta, grasa_meta, ffmi_meta, ritmo_semanal, kcal_objetivo, proteina_g, fecha_inicio, fecha_estimada, activa)
- `gyms` (id, nombre, lat, lng, radio_m)
- `exercises` (id, nombre, grupo_muscular, equipo, es_principal)
- `workouts` (id, user_id, fecha, duracion_min, notas)
- `workout_sets` (id, workout_id, exercise_id, orden, reps, peso_kg, rpe, es_pr)
- `checkins` (id, user_id, gym_id, timestamp, lat, lng, foto_url, valido)
- `crews` (id, nombre, foto, codigo_invitacion, dias_pactados[], pesos_score jsonb, temporada_inicio, temporada_fin, owner_id)
- `crew_members` (crew_id, user_id, rol, comparte_kilos bool)
- `weekly_scores` (id, crew_id, user_id, semana, asistencia, fuerza, meta, volumen, registro, total)
- `challenges` (id, crew_id, tipo, reglas jsonb, apuesta, inicio, fin, ganador_id)
- `feed_events` (id, crew_id, user_id, tipo, payload jsonb, created_at)
- `reactions` (event_id, user_id, emoji)

El cálculo del TRENO Score va en una función (edge function o función SQL) que se ejecuta al cerrar cada semana y también al vuelo para la vista "en vivo".

## 10. Forma de trabajar

1. Antes de programar, muéstrame un **plan breve**: la arquitectura, el mapa de pantallas y las tablas. Espera mi OK.
2. Construye por etapas y muéstrame cada una funcionando: (a) auth + onboarding + motor de cálculo + pantalla "Tu meta"; (b) registro de entrenamientos y check-in; (c) Cuerpo y gráficas; (d) Crews, rankings y TRENO Score; (e) retos, recap y landing + panel B2B de demostración.
3. Escribe **tests unitarios** del motor de cálculo (`bodyMetrics`) y del TRENO Score con casos conocidos (por ejemplo, verifica que el Usuario A y el Usuario B de la demo obtienen puntajes comparables cuando ambos cumplen su plan al 100%).
4. Incluye **datos semilla** realistas: los 2 usuarios de la demo + 4 amigos más en un Crew con 8 semanas de historial, para que los rankings y gráficas se vean vivos en la presentación.
5. Textos de la interfaz en **español**, tono cercano, motivador y directo, sin exagerar.
6. Si algo de este documento es ambiguo, toma la decisión que haría un producto de clase mundial y anótala en un archivo `DECISIONES.md`.
