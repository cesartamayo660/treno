# DECISIONES DE PRODUCTO, CIENCIA DEL DEPORTE Y ARQUITECTURA — TRENO

Este documento registra las decisiones de diseño, ingeniería y ciencias del deporte tomadas para resolver ambigüedades y garantizar que **TRENO** opere como un producto de clase mundial ($18M Pitch Grade).

---

## 1. Ciencia del Deporte y Fórmulas (`lib/bodyMetrics.ts`)

1. **Prioridad de % de Grasa Corporal (DEXA/BIA vs. Marina de EE. UU.)**:
   - Cuando el usuario ingresa un `% de grasa manual` (medido por DEXA o bioimpedancia), éste tiene prioridad absoluta sobre la estimación antropométrica. Aun así, calculamos y conservamos el valor de la Marina de EE. UU. como referencia secundaria para que el usuario pueda comparar ambos métodos.
   - Se acota el resultado de la fórmula de la Marina de EE. UU. a un rango fisiológico seguro (`3.5% – 55%`) para evitar valores negativos o distorsiones si el usuario digita medidas extremas durante la edición en vivo.
2. **Selección de TMB (Katch-McArdle vs. Mifflin-St Jeor)**:
   - Siempre se calculan y muestran ambas fórmulas en los modales de transparencia científica (`¿Cómo se calcula?`).
   - Como el sistema estima el `% de grasa` mediante la Marina de EE. UU. (o usa el DEXA/BIA), **Katch-McArdle (`370 + 21.6 × LBM`)** se utiliza como TMB principal para derivar el **TDEE**, ya que es significativamente más precisa en personas que entrenan con pesas (distingue masa magra metabólicamente activa).
3. **Coeficiente DOTS Oficial (IPF Powerlifting)**:
   - Se implementa el polinomio oficial de 4.º grado de DOTS (diferenciado por sexo biológico):
     $$\text{DOTS} = \frac{\text{Carga Total o 1RM}}{A \cdot w^4 + B \cdot w^3 + C \cdot w^2 + D \cdot w + E} \times 500$$
   - Esto permite que el **Usuario A (Diego, 64 kg)** y el **Usuario B (Mateo, 88 kg)** compitan en igualdad matemática tanto en el ranking de *"Más fuerte (DOTS)"* como en el pilar de progreso de fuerza del **TRENO Score**.
4. **Fórmula de 1RM Híbrida (Brzycki + Epley)**:
   - Para series de `1 a 10 repeticiones` se utiliza **Brzycki** ($\text{peso} \times \frac{36}{37 - \text{reps}}$) por su mayor exactitud en rangos de fuerza/hipertrofia pesada; para `> 10 repeticiones` se utiliza **Epley** ($\text{peso} \times (1 + \frac{\text{reps}}{30})$), evitando la asíntota de Brzycki en altas repeticiones. Ambas se muestran en el desglose del ejercicio.
5. **Generador de Meta Objetivo y Trayectoria**:
   - **Caso Semilla Obligatorio**:
     - **Usuario A (Diego — 1.75 m, 64.0 kg, cintura 75 cm, cuello 37 cm → ~13.9% grasa, LBM 55.1 kg)**: Objetivo **Volumen**. Se proyecta ganar `+4.0 kg` de masa magra (`LBM_meta = 59.1 kg`) con un `% grasa meta = 14.0%`, resultando en un **Peso Meta de `68.7 kg`** a un ritmo saludable de `+0.24 kg/sem` (+0.375%/sem), **TDEE + 350 kcal** y **2.0 g/kg de proteína**.
     - **Usuario B (Mateo — 1.75 m, 88.0 kg, cintura 94 cm, cuello 40 cm → ~24.2% grasa, LBM 66.7 kg)**: Objetivo **Definición**. Se proyecta preservar el 100% de su masa magra (`LBM_meta = 66.7 kg`) reduciendo a un `% grasa meta = 14.0%`, resultando en un **Peso Meta de `77.6 kg`** a un ritmo saludable de `-0.65 kg/sem` (-0.74%/sem), **TDEE − 450 kcal** y **2.2 g/kg de proteína**.

---

## 2. Justicia Algorítmica del TRENO Score (`lib/trenoScore.ts`)

1. **Equidad entre Objetivos Opuestos (0 a 1000 puntos)**:
   - El pilar de **Progreso hacia la Meta Corporal (25% = 250 pts)** evalúa el `% de avance semanal logrado frente al ritmo semanal planeado` (`realWeeklyDelta / targetWeeklyDelta`).
   - **Protección de Salud (Anti-Crash Diet / Anti-Dirty Bulk)**:
     - En **Volumen**, si el usuario sube más rápido del límite superior saludable (`> 0.5%` del peso corporal/semana), la curva de puntos se aplana en el tope (100% del pilar) y muestra un aviso de posible ganancia excesiva de tejido adiposo.
     - En **Definición**, si el usuario pierde más de `1.0%` de su peso corporal por semana, no recibe puntos extra y se activa una **Alerta de Salud** visible recomendando moderar el déficit para proteger masa muscular y sistema endocrino.
2. **Multiplicador de Racha sobre el Pilar de Asistencia**:
   - Cumplir el 100% de los días pactados durante 2 semanas consecutivas aplica `×1.1` al pilar de asistencia; a las 4+ semanas perfectas aplica `×1.2`. Un día extra de entrenamiento otorga un bonus de `+15 pts` de asistencia. El puntaje final del TRENO Score se normaliza con tope en `1000 pts`.

---

## 3. Diseño visual (versión final)

1. **Un solo acento, dos temas**: neutros cálidos + lima eléctrico (oscuro) / verde bosque (claro). Los colores son variables CSS (`app/globals.css`) y Tailwind los usa como `white` (tinta), `black` (sombra), `canvas` (fondo) y `accent`.
2. **Móvil primero**: barra inferior con 5 pestañas (icono + etiqueta); en escritorio (lg+) pasa a menú lateral y las pantallas usan dos columnas.
3. **Un protagonista por pantalla** (anillo, podio, peso de tendencia), cifras grandes con tipografía Space Grotesk y detalle bajo demanda en hojas deslizables.
4. **Sin zona de demostración**: se eliminaron el conmutador de usuarios, el panel B2B/CEO y la landing de ventas. La app arranca en el onboarding y guarda al usuario real en el dispositivo (localStorage).

## 4. Publicación

`npm run build` exporta la app estática y deja `index.html` (+ `_next/`) en la raíz de la carpeta. Abre con doble clic o súbela a cualquier hosting estático. `npm run dev` para desarrollo.
