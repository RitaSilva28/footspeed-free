import type { CalledColor, CompletedExercise, ConeColor, ExerciseSettings, TrainingPreferences } from '../types';

export const DEFAULT_CONES: ConeColor[] = [
  { id: '1', name: 'Red', color: '#FF0000' },
  { id: '2', name: 'Blue', color: '#0040FF' },
  { id: '3', name: 'Yellow', color: '#FFFF00' },
  { id: '4', name: 'Green', color: '#00FF00' },
  { id: '5', name: 'Purple', color: '#FF00FF' },
  { id: '6', name: 'Orange', color: '#FF7700' },
];
export const CONE_COUNTS = [2, 3, 4, 5, 6] as const;

export function createPreferences(saved: (ExerciseSettings & { coneCount?: number }) | null): TrainingPreferences {
  const requested = saved?.coneCount ?? saved?.cones.length ?? 6;
  return {
    duration: saved?.duration ?? 60,
    interval: saved?.interval ?? 3,
    coneCount: CONE_COUNTS.includes(requested as typeof CONE_COUNTS[number]) ? requested : 6,
    // Retain the full palette even when only its first two cones are active.
    cones: DEFAULT_CONES.map((fallback, index) => ({ ...(saved?.cones[index] ?? fallback) })),
  };
}

export function setConeCount(preferences: TrainingPreferences, count: number): TrainingPreferences {
  if (!CONE_COUNTS.includes(count as typeof CONE_COUNTS[number])) return preferences;
  return { ...preferences, coneCount: count };
}

export function updateCone(preferences: TrainingPreferences, id: string, name: string, color: string): TrainingPreferences {
  return { ...preferences, cones: preferences.cones.map(cone => cone.id === id ? { ...cone, name, color } : cone) };
}

export function createExerciseSettings(preferences: TrainingPreferences): ExerciseSettings {
  return {
    duration: preferences.duration,
    interval: preferences.interval,
    cones: preferences.cones.slice(0, preferences.coneCount).map(cone => ({ ...cone })),
  };
}

export function pickCone(settings: ExerciseSettings, random = Math.random): ConeColor {
  return settings.cones[Math.floor(random() * settings.cones.length)];
}

export function createCompletedExercise(settings: ExerciseSettings, sequence: CalledColor[]): CompletedExercise {
  return {
    id: Date.now().toString(),
    date: new Date(),
    duration: settings.duration,
    interval: settings.interval,
    conesCount: settings.cones.length,
    configuredCones: settings.cones.map(cone => ({ ...cone })),
    colorSequence: sequence.map(color => ({ ...color })),
  };
}
