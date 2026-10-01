import { useState } from 'react';
import { Pencil } from 'lucide-react';
import ConeEditor from './ConeEditor';
import { CONE_COUNTS, createPreferences, createExerciseSettings, setConeCount, updateCone } from '../lib/cones';
import { loadSettings, saveLocal, SETTINGS_KEY } from '../lib/storage';
import type { ExerciseSettings, TrainingPreferences } from '../types';
import styles from './Settings.module.css';

interface SettingsScreenProps {
  onStartExercise: (settings: ExerciseSettings) => void;
}

const PRESET_TIMES = [60, 90, 120, 150, 180];

export default function SettingsScreen({ onStartExercise }: SettingsScreenProps) {
  const [preferences, setPreferences] = useState(() => loadSettings() ?? createPreferences(null));
  const { duration, interval, cones, coneCount } = preferences;
  const [editingCone, setEditingCone] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const activeCones = cones.slice(0, coneCount);
  const editedCone = activeCones.find(cone => cone.id === editingCone);

  const commitPreferences = (next: TrainingPreferences) => {
    setPreferences(next);
    setStorageError(!saveLocal(SETTINGS_KEY, next));
  };
  const setDuration = (value: number) => commitPreferences({ ...preferences, duration: value });
  const setInterval = (value: number) => commitPreferences({ ...preferences, interval: value });

  const handleStartExercise = () => {
    const saved = saveLocal(SETTINGS_KEY, preferences);
    if (!saved) {
      window.alert('Settings could not be saved on this device. You can still start this exercise.');
    }
    onStartExercise(createExerciseSettings(preferences));
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
        <fieldset className={styles.coneCountSelector}>
          <legend>Number of cones</legend>
          <div className={styles.coneCountOptions}>
            {CONE_COUNTS.map(count => (
              <label key={count} className={styles.coneCountOption}>
                <input type="radio" name="cone-count" value={count} checked={coneCount === count}
                  onChange={() => commitPreferences(setConeCount(preferences, count))} />
                <span>{count}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className={styles.conesGrid} data-count={coneCount}>
          {activeCones.map((cone, index) => (
            <div key={cone.id} className={styles.coneCard}>
              <div className={styles.colorBox} style={{ backgroundColor: cone.color }} />
              <p className={styles.coneName}>{cone.name}</p>
              <button type="button" onClick={() => setEditingCone(cone.id)} className={styles.editBtn}
                aria-label={`Edit cone ${index + 1}: ${cone.name}`}>
                <Pencil size={18} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        {editedCone && (
          <ConeEditor key={editedCone.id} cone={editedCone}
            number={activeCones.indexOf(editedCone) + 1}
            onDismiss={() => setEditingCone(null)}
            onSave={(name, color) => {
              commitPreferences(updateCone(preferences, editedCone.id, name, color));
              setEditingCone(null);
            }} />
        )}
        {storageError && <p role="alert" className={styles.editHelp}>Your settings could not be saved on this device. Changes are available for this session.</p>}
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
