import { createCompletedExercise, pickCone } from "../lib/cones";
import { startExerciseClock } from "../lib/exerciseClock";
import ExerciseResults from "./ExerciseResults";
import { createFinishSound } from "../lib/finishSound";
import { speak, stopSpeech } from "../lib/native";
import { useState, useEffect, useRef } from "react";
import type { ExerciseSettings, CompletedExercise, CalledColor, ConeColor } from "../types";
import styles from "./Exercise.module.css";

interface ExerciseScreenProps {
  settings: ExerciseSettings;
  onComplete: (exercise: CompletedExercise) => void;
  onCancel: () => void;
}

export default function ExerciseScreen({
  settings,
  onComplete,
  onCancel,
}: ExerciseScreenProps) {
  const [timeLeft, setTimeLeft] = useState(settings.duration);
  const [currentColor, setCurrentColor] = useState<ConeColor | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [colorSequence, setColorSequence] = useState<CalledColor[]>([]);
  const [nextCallCountdown, setNextCallCountdown] = useState(settings.interval);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [speechError, setSpeechError] = useState(false);
  const [completed, setCompleted] = useState<CompletedExercise | null>(null);
  const finishSound = useRef<ReturnType<typeof createFinishSound> | null>(null);
  const finishTimer = useRef<number | undefined>(undefined);
  const cancelClock = useRef<(() => void) | null>(null);

  useEffect(() => () => {
    cancelClock.current?.();
    stopSpeech();
    window.clearTimeout(finishTimer.current);
    finishSound.current?.dispose();
  }, []);

  const handleStart = () => {
    if (cancelClock.current) return;
    setSpeechError(false);
    // Unlock audio during the Start tap so the final bell can play on mobile.
    finishSound.current = createFinishSound();
    let cancelled = false;
    const sequence: CalledColor[] = [];
    const announce = (text: string) => {
      void speak(text).catch(() => {
        if (!cancelled) setSpeechError(true);
      });
    };
    const cancel = startExerciseClock({
      duration: settings.duration,
      interval: settings.interval,
      onCountdown: (value) => {
        setCountdown(value);
        announce(value.toString());
      },
      onCall: () => {
        const color = pickCone(settings);
        // The first color is the start cue: no competing "Go" utterance.
        announce(color.name);
        sequence.push({ name: color.name, color: color.color });
        setCountdown(null);
        setIsActive(true);
        setCurrentColor(color);
        setColorSequence([...sequence]);
      },
      onUpdate: (remaining, nextCall) => {
        setTimeLeft(remaining);
        setNextCallCountdown(nextCall);
      },
      onComplete: () => {
        cancelled = true;
        stopSpeech();
        setIsActive(false);
        setTimeLeft(0);
        const result = createCompletedExercise(settings, sequence);
        onComplete(result);
        finishSound.current?.play();
        finishTimer.current = window.setTimeout(() => {
          void speak("Exercise ended").catch(() => setSpeechError(true));
          setCompleted(result);
        }, 650);
      },
    });
    cancelClock.current = () => {
      cancelled = true;
      cancel();
    };
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={styles.container}>
      {completed && <ExerciseResults exercise={completed} onDismiss={onCancel} />}
      {speechError && <p role="alert">Voice calls are unavailable. Check that an English text-to-speech voice is installed in Android settings.</p>}
      {countdown !== null && (
        <div className={styles.countdownOverlay}>
          <div className={styles.countdownDisplay}>
            {countdown > 0 ? (
              <h1 className={styles.countdownNumber}>{countdown}</h1>
            ) : (
              <h1 className={styles.countdownGo}>GO!</h1>
            )}
          </div>
        </div>
      )}

      <div className={styles.timerSection}>
        <h1 className={styles.timer}>
          {minutes.toString().padStart(2, "0")}:
          {seconds.toString().padStart(2, "0")}
        </h1>
        <p className={styles.conesCalledCount}>
          Cones called: {colorSequence.length}
        </p>
      </div>

      {isActive && currentColor && (
        <div
          className={styles.currentColorDisplay}
          style={{ backgroundColor: currentColor.color }}
        >
          <p className={styles.colorText}>{currentColor.name}</p>
        </div>
      )}

      {isActive && (
        <p className={styles.nextCallInfo}>
          Next call in: {nextCallCountdown}s
        </p>
      )}

      <div className={styles.controls}>
        {!isActive && timeLeft === settings.duration && countdown === null ? (
          <button onClick={handleStart} className={styles.startBtn}>
            Start
          </button>
        ) : (
          <button onClick={onCancel} className={styles.cancelBtn}>
            Back
          </button>
        )}
      </div>

      {colorSequence.length > 0 && (
        <div className={styles.colorHistory}>
          <h3 className={styles.historyTitle}>Colors Called</h3>

          <div className={styles.colorHistoryList}>
            {colorSequence.map((color, index) => (
              <div key={index} className={styles.historyItem}>
                <div
                  className={styles.historyDot}
                  style={{ backgroundColor: color.color }}
                />
                <span>{color.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}