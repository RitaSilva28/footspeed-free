import { createPreferences } from './cones';
import type { CompletedExercise, ExerciseSettings, TrainingPreferences } from '../types';

export const HISTORY_KEY = 'exerciseHistory';
export const SETTINGS_KEY = 'exerciseSettings';

function read(key: string): unknown {
  const value = localStorage.getItem(key);
  return value === null ? null : JSON.parse(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isColor(value: unknown) {
  return isRecord(value) && typeof value.name === 'string' && typeof value.color === 'string';
}

function isPositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function loadHistory(): { exercises: CompletedExercise[]; error: string | null } {
  try {
    const saved = read(HISTORY_KEY);
    if (saved === null) return { exercises: [], error: null };
    if (!Array.isArray(saved)) throw new Error('Invalid history');
    const exercises = saved.map((item) => {
      if (!isRecord(item) || typeof item.id !== 'string' || typeof item.date !== 'string' ||
        !Number.isFinite(Date.parse(item.date)) || !isPositive(item.duration) ||
        !isPositive(item.interval) || typeof item.conesCount !== 'number' ||
        !Number.isInteger(item.conesCount) || item.conesCount < 0 ||
        !Array.isArray(item.colorSequence) || !item.colorSequence.every(isColor)) {
        throw new Error('Invalid exercise');
      }
      return { ...item, date: new Date(item.date) } as CompletedExercise;
    });
    return { exercises: exercises.sort((a, b) => b.date.getTime() - a.date.getTime()), error: null };
  } catch {
    return { exercises: [], error: 'Saved history could not be read. You can still train in this session.' };
  }
}

export function saveLocal(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadSettings(): TrainingPreferences | null {
  try {
    const saved = read(SETTINGS_KEY);
    if (!isRecord(saved) || !isPositive(saved.duration) || saved.duration < 10 || saved.duration > 300 ||
      !isPositive(saved.interval) || saved.interval > 10 || !Array.isArray(saved.cones) ||
      saved.cones.length === 0 || !saved.cones.every((cone) => isColor(cone) && isRecord(cone) && typeof cone.id === 'string')) {
      return null;
    }
    return createPreferences(saved as unknown as ExerciseSettings & { coneCount?: number });
  } catch {
    return null;
  }
}
