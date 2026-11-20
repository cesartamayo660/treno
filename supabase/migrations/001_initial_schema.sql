-- ============================================================================
-- TRENO — Migración Inicial (Fase 1 MVP + Seguridad RLS + Función TRENO Score)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  avatar TEXT,
  sexo TEXT NOT NULL CHECK (sexo IN ('hombre', 'mujer')),
  fecha_nacimiento DATE NOT NULL,
  estatura_cm NUMERIC(5,2) NOT NULL CHECK (estatura_cm BETWEEN 120 AND 230),
  nivel_actividad TEXT NOT NULL DEFAULT 'moderado' CHECK (nivel_actividad IN ('sedentario', 'ligero', 'moderado', 'alto', 'muy_alto')),
  objetivo TEXT NOT NULL DEFAULT 'volumen' CHECK (objetivo IN ('volumen', 'definicion', 'recomposicion', 'fuerza')),
  unidad_preferida TEXT NOT NULL DEFAULT 'kg' CHECK (unidad_preferida IN ('kg', 'lb')),
  privacidad JSONB NOT NULL DEFAULT '{"compartir_peso": false, "compartir_medidas": false, "fotos_publicas": false}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BODY MEASUREMENTS
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  peso_kg NUMERIC(5,2) NOT NULL CHECK (peso_kg BETWEEN 30 AND 250),
  cuello NUMERIC(5,2),
  cintura NUMERIC(5,2),
  cadera NUMERIC(5,2),
  pecho NUMERIC(5,2),
  brazo NUMERIC(5,2),
  muslo NUMERIC(5,2),
  pantorrilla NUMERIC(5,2),
  grasa_pct_manual NUMERIC(4,2) CHECK (grasa_pct_manual IS NULL OR (grasa_pct_manual BETWEEN 3 AND 60)),
  foto_frente_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_body_measurements_user_fecha ON public.body_measurements(user_id, fecha DESC);

-- 3. GOALS
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('volumen', 'definicion', 'recomposicion', 'fuerza')),
  peso_meta NUMERIC(5,2) NOT NULL,
  grasa_meta NUMERIC(4,2) NOT NULL,
  ffmi_meta NUMERIC(4,2) NOT NULL,
  cintura_meta NUMERIC(5,2),
  ritmo_semanal NUMERIC(5,3) NOT NULL,
  kcal_objetivo INTEGER NOT NULL,
  proteina_g INTEGER NOT NULL,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_estimada DATE NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. GYMS
CREATE TABLE IF NOT EXISTS public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  cadena TEXT DEFAULT 'Gold''s Performance Club',
  sede TEXT,
  lat NUMERIC(9,6) NOT NULL,
  lng NUMERIC(9,6) NOT NULL,
  radio_m INTEGER NOT NULL DEFAULT 150,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. EXERCISES
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  grupo_muscular TEXT NOT NULL,
  equipo TEXT NOT NULL,
  es_principal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. WORKOUTS
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre_rutina TEXT NOT NULL DEFAULT 'Entrenamiento',
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duracion_min INTEGER NOT NULL DEFAULT 60,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_fecha ON public.workouts(user_id, fecha DESC);

-- 7. WORKOUT SETS
CREATE TABLE IF NOT EXISTS public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  orden INTEGER NOT NULL,
  reps INTEGER NOT NULL CHECK (reps > 0),
  peso_kg NUMERIC(6,2) NOT NULL CHECK (peso_kg >= 0),
  rpe NUMERIC(3,1) CHECK (rpe IS NULL OR (rpe BETWEEN 1 AND 10)),
  es_pr BOOLEAN NOT NULL DEFAULT FALSE,
  validado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sospecha_outlier BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. CHECKINS
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE RESTRICT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lat NUMERIC(9,6) NOT NULL,
  lng NUMERIC(9,6) NOT NULL,
  foto_url TEXT,
  valido BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkins_user_timestamp ON public.checkins(user_id, timestamp DESC);

-- 9. CREWS
CREATE TABLE IF NOT EXISTS public.crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  foto TEXT,
  codigo_invitacion TEXT NOT NULL UNIQUE,
  dias_pactados INTEGER[] NOT NULL DEFAULT ARRAY[1,2,4,5],
  pesos_score JSONB NOT NULL DEFAULT '{"asistencia": 0.30, "fuerza": 0.25, "meta": 0.25, "volumen": 0.10, "registro": 0.10}'::jsonb,
  temporada_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  temporada_fin DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '8 weeks')::date,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CREW MEMBERS
CREATE TABLE IF NOT EXISTS public.crew_members (
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rol TEXT NOT NULL DEFAULT 'miembro' CHECK (rol IN ('admin', 'miembro')),
  comparte_kilos BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (crew_id, user_id)
);

-- 11. WEEKLY SCORES
CREATE TABLE IF NOT EXISTS public.weekly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  semana INTEGER NOT NULL CHECK (semana >= 1),
  asistencia INTEGER NOT NULL DEFAULT 0,
  fuerza INTEGER NOT NULL DEFAULT 0,
  meta INTEGER NOT NULL DEFAULT 0,
  volumen INTEGER NOT NULL DEFAULT 0,
  registro INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0 CHECK (total BETWEEN 0 AND 1000),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (crew_id, user_id, semana)
);

-- 12. CHALLENGES
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('1v1', 'grupal')),
  reglas JSONB NOT NULL,
  apuesta TEXT NOT NULL,
  inicio DATE NOT NULL,
  fin DATE NOT NULL,
  ganador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. FEED EVENTS
CREATE TABLE IF NOT EXISTS public.feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('checkin', 'pr', 'racha', 'logro', 'reto')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_events_crew_created ON public.feed_events(crew_id, created_at DESC);

-- 14. REACTIONS
CREATE TABLE IF NOT EXISTS public.reactions (
  event_id UUID NOT NULL REFERENCES public.feed_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id, emoji)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) ACTIVADO EN LAS 14 TABLAS
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para saber si dos usuarios comparten un Crew
CREATE OR REPLACE FUNCTION public.shares_crew_with(target_user UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.crew_members cm1
    JOIN public.crew_members cm2 ON cm1.crew_id = cm2.crew_id
    WHERE cm1.user_id = auth.uid() AND cm2.user_id = target_user
  );
$$;

-- Políticas de PROFILES
CREATE POLICY "Usuarios ven su propio perfil o compañeros de Crew"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.shares_crew_with(id));

CREATE POLICY "Usuarios actualizan su propio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuarios insertan su propio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas de BODY MEASUREMENTS (Estrictamente privadas por defecto; solo si comparte_kilos = true en Crew)
CREATE POLICY "Medidas privadas o explícitamente compartidas en Crew"
  ON public.body_measurements FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.crew_members cm_owner
      JOIN public.crew_members cm_viewer ON cm_owner.crew_id = cm_viewer.crew_id
      WHERE cm_owner.user_id = public.body_measurements.user_id
        AND cm_viewer.user_id = auth.uid()
        AND cm_owner.comparte_kilos = TRUE
    )
  );

CREATE POLICY "Usuario gestiona sus propias medidas"
  ON public.body_measurements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas de GOALS
CREATE POLICY "Usuario ve y edita sus propias metas"
  ON public.goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas de GYMS y EXERCISES (Catálogos públicos para usuarios autenticados)
CREATE POLICY "Gimnasios visibles para todos" ON public.gyms FOR SELECT USING (TRUE);
CREATE POLICY "Ejercicios visibles para todos" ON public.exercises FOR SELECT USING (TRUE);

-- Políticas de WORKOUTS, WORKOUT_SETS, CHECKINS
CREATE POLICY "Ver entrenamientos propios o de compañeros de Crew"
  ON public.workouts FOR SELECT
  USING (auth.uid() = user_id OR public.shares_crew_with(user_id));

CREATE POLICY "Gestionar entrenamientos propios"
  ON public.workouts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Ver series propias o de compañeros de Crew"
  ON public.workout_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_id AND (w.user_id = auth.uid() OR public.shares_crew_with(w.user_id))
    )
  );

CREATE POLICY "Gestionar series propias"
  ON public.workout_sets FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid())
  );

CREATE POLICY "Ver checkins propios o de Crew"
  ON public.checkins FOR SELECT
  USING (auth.uid() = user_id OR public.shares_crew_with(user_id));

CREATE POLICY "Insertar checkins propios"
  ON public.checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas de CREWS, CREW_MEMBERS, WEEKLY_SCORES, CHALLENGES, FEED_EVENTS, REACTIONS
CREATE POLICY "Miembros ven sus Crews"
  ON public.crews FOR SELECT
  USING (
    owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.crew_members cm WHERE cm.crew_id = id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios crean Crews"
  ON public.crews FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Miembros ven integrantes de su Crew"
  ON public.crew_members FOR SELECT
  USING (
    user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.crew_members cm WHERE cm.crew_id = crew_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Miembros ven weekly_scores de su Crew"
  ON public.weekly_scores FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.crew_members cm WHERE cm.crew_id = crew_id AND cm.user_id = auth.uid())
  );

CREATE POLICY "Miembros ven retos de su Crew"
  ON public.challenges FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.crew_members cm WHERE cm.crew_id = crew_id AND cm.user_id = auth.uid())
  );

CREATE POLICY "Miembros ven y publican en el feed de su Crew"
  ON public.feed_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.crew_members cm WHERE cm.crew_id = crew_id AND cm.user_id = auth.uid())
  );

CREATE POLICY "Miembros insertan eventos en su Crew"
  ON public.feed_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Miembros ven y reaccionan en su Crew"
  ON public.reactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.feed_events fe
      JOIN public.crew_members cm ON fe.crew_id = cm.crew_id
      WHERE fe.id = event_id AND cm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCIÓN SQL DE CÁLCULO EN VIVO Y CIERRE SEMANAL DEL TRENO SCORE (0 a 1000)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_treno_score(
  p_asistencia_ratio NUMERIC,      -- 0.0 a 1.2 (ej. 1.0 = 100% días cumplidos)
  p_racha_semanas INTEGER,         -- semanas perfectas seguidas
  p_fuerza_ratio NUMERIC,          -- 0.0 a 1.0 (progreso relativo DOTS normalizado)
  p_meta_ratio NUMERIC,            -- 0.0 a 1.0 (% del ritmo semanal saludable cumplido)
  p_volumen_ratio NUMERIC,         -- 0.0 a 1.0 (tonelaje vs promedio de 4 semanas)
  p_registro_ratio NUMERIC,        -- 0.0 a 1.0 (3+ pesajes, medidas y entrenos registrados)
  p_pesos JSONB DEFAULT '{"asistencia": 0.30, "fuerza": 0.25, "meta": 0.25, "volumen": 0.10, "registro": 0.10}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_mult NUMERIC := 1.0;
  v_w_asistencia NUMERIC := COALESCE((p_pesos->>'asistencia')::numeric, 0.30);
  v_w_fuerza NUMERIC := COALESCE((p_pesos->>'fuerza')::numeric, 0.25);
  v_w_meta NUMERIC := COALESCE((p_pesos->>'meta')::numeric, 0.25);
  v_w_volumen NUMERIC := COALESCE((p_pesos->>'volumen')::numeric, 0.10);
  v_w_registro NUMERIC := COALESCE((p_pesos->>'registro')::numeric, 0.10);
  v_pts_asistencia INTEGER;
  v_pts_fuerza INTEGER;
  v_pts_meta INTEGER;
  v_pts_volumen INTEGER;
  v_pts_registro INTEGER;
  v_total INTEGER;
BEGIN
  IF p_racha_semanas >= 4 THEN
    v_mult := 1.2;
  ELSIF p_racha_semanas >= 2 THEN
    v_mult := 1.1;
  END IF;

  v_pts_asistencia := LEAST(ROUND(1000 * v_w_asistencia * LEAST(GREATEST(p_asistencia_ratio, 0), 1.05) * v_mult), ROUND(1000 * v_w_asistencia * 1.2));
  v_pts_fuerza     := ROUND(1000 * v_w_fuerza * LEAST(GREATEST(p_fuerza_ratio, 0), 1.0));
  v_pts_meta       := ROUND(1000 * v_w_meta * LEAST(GREATEST(p_meta_ratio, 0), 1.0));
  v_pts_volumen    := ROUND(1000 * v_w_volumen * LEAST(GREATEST(p_volumen_ratio, 0), 1.0));
  v_pts_registro   := ROUND(1000 * v_w_registro * LEAST(GREATEST(p_registro_ratio, 0), 1.0));

  v_total := LEAST(1000, GREATEST(0, v_pts_asistencia + v_pts_fuerza + v_pts_meta + v_pts_volumen + v_pts_registro));

  RETURN jsonb_build_object(
    'asistencia', v_pts_asistencia,
    'fuerza', v_pts_fuerza,
    'meta', v_pts_meta,
    'volumen', v_pts_volumen,
    'registro', v_pts_registro,
    'multiplicador_racha', v_mult,
    'total', v_total
  );
END;
$$;
