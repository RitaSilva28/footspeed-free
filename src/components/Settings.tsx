import { useState } from 'react';
import { loadSettings, saveLocal, SETTINGS_KEY } from '../lib/storage';
import type { ConeColor, ExerciseSettings } from '../types';
import styles from './Settings.module.css';

interface SettingsScreenProps {
  onStartExercise: (settings: ExerciseSettings) => void;
}

const DEFAULT_COLORS: ConeColor[] = [
  { id: '1', name: 'Red', color: '#FF0000' },
  { id: '2', name: 'Blue', color: '#0040FF' },
  { id: '3', name: 'Yellow', color: '#FFFF00' },
  { id: '4', name: 'Green', color: '#00FF00' },
  { id: '5', name: 'Purple', color: '#FF00FF' },
  { id: '6', name: 'Orange', color: '#FF7700' },
];

const PRESET_TIMES = [60, 90, 120, 150, 180];

export default function SettingsScreen({ onStartExercise }: SettingsScreenProps) {
  const [savedSettings] = useState(loadSettings);
  const [duration, setDuration] = useState(savedSettings?.duration ?? 60);
  const [interval, setInterval] = useState(savedSettings?.interval ?? 3);
  const [cones, setCones] = useState<ConeColor[]>(savedSettings?.cones ?? DEFAULT_COLORS);
  const [editingCone, setEditingCone] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');

  const handleStartEdit = (cone: ConeColor) => {
    setEditingCone(cone.id);
    setEditingName(cone.name);
    setEditingColor(cone.color);
  };

  const handleSaveEdit = (id: string) => {
    setCones(
      cones.map((cone) =>
        cone.id === id
          ? { ...cone, name: editingName, color: editingColor }
          : cone
      )
    );
    setEditingCone(null);
  };

  const handleStartExercise = () => {
    const settings: ExerciseSettings = {
      duration,
      interval,
      cones,
    };
    if (!saveLocal(SETTINGS_KEY, settings)) {
      window.alert('Settings could not be saved to your browser. You can still start this exercise.');
    }
    onStartExercise(settings);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Exercise Settings</h1>

      <div className={styles.settingsGroup}>
        <div className={styles.labelSection}>
          <span className={styles.labelText}>Duration</span>
          <div className={styles.presetTimes}>
            {PRESET_TIMES.map((time) => (
              <button
                key={time}
                className={`${styles.presetBtn} ${duration === time ? styles.active : ''}`}
                onClick={() => setDuration(time)}
              >
                {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.customTimeSection}>
          <span className={styles.customLabelText}>Custom Duration</span>
          <div className={styles.counterControl}>
            <button
              onClick={() => setDuration(Math.max(10, duration - 10))}
              className={styles.counterBtn}
            >
              −
            </button>
            <span className={styles.counterValue}>
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </span>
            <button
              onClick={() => setDuration(Math.min(300, duration + 10))}
              className={styles.counterBtn}
            >
              +
            </button>
          </div>
        </div>

        <div className={styles.intervalSection}>
          <span className={styles.intervalLabelText}>Interval between calls</span>
          <div className={styles.intervalControl}>
            <button
              onClick={() => setInterval(Math.max(1, interval - 1))}
              className={styles.intervalBtn}
            >
              −
            </button>
            <span className={styles.intervalValue}>
              {interval}s
            </span>
            <button
              onClick={() => setInterval(Math.min(10, interval + 1))}
              className={styles.intervalBtn}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className={styles.conesSection}>
        <h2 className={styles.subtitle}>Cone Colors</h2>
        {editingCone ? (
          <div className={styles.editConeForm}>
            <div className={styles.editFormRow}>
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Color name"
                className={styles.editConeInput}
              />
              <input
                type="color"
                value={editingColor}
                onChange={(e) => setEditingColor(e.target.value)}
                className={styles.editConeColorPicker}
              />
              <button
                onClick={() => handleSaveEdit(editingCone)}
                className={styles.editConeSaveBtn}
              >
                ✓
              </button>
              <button
                onClick={() => setEditingCone(null)}
                className={styles.editConeCancelBtn}
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.conesGrid}>
            {cones.map((cone) => (
              <div key={cone.id} className={styles.coneCard}>
                <div
                  className={styles.colorBox}
                  style={{ backgroundColor: cone.color }}
                />
                <p className={styles.coneName}>{cone.name}</p>
                <button
                  onClick={() => handleStartEdit(cone)}
                  className={styles.editBtn}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleStartExercise}
        className={styles.startBtn}
        disabled={!cones.length || duration < 10 || interval < 1}
      >
        Go to Exercise
      </button>
    </div>
  );
}
