export interface ConeColor {
  id: string;
  name: string;
  color: string;
}

export interface ExerciseSettings {
  duration: number;
  interval: number;
  cones: ConeColor[];
}

// Stored palette includes hidden cones; ExerciseSettings contains only active cones.
export interface TrainingPreferences extends ExerciseSettings {
  coneCount: number;
}

export interface CalledColor {
  name: string;
  color: string;
}

export interface CompletedExercise {
  id: string;
  date: Date;
  duration: number;
  interval: number;
  conesCount: number;
  colorSequence: CalledColor[];
  configuredCones?: ConeColor[];
}

export type Screen = "settings" | "exercise" | "history";