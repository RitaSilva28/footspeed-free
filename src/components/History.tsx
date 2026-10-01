import { History as HistoryIcon, Info, Trash as DeleteIcon } from "lucide-react";
import { isAndroid } from "../lib/native";
import type { CompletedExercise } from "../types";
import styles from "./History.module.css";

interface HistoryScreenProps {
  exercises: CompletedExercise[];
  onClearHistory: () => void;
  onStartTraining: () => void;
}

export default function HistoryScreen({
  exercises,
  onClearHistory,
  onStartTraining,
}: HistoryScreenProps) {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear all history?")) {
      onClearHistory();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Exercise History</h1>
      </div>

      {exercises.length === 0 ? (
        <div className={styles.empty}>
          <HistoryIcon size={32} className={styles.emptyIcon} aria-hidden="true" />
          <h2 className={styles.emptyTitle}>No exercises yet</h2>
          <p className={styles.emptyText}>Your completed training sessions will appear here.</p>
          <button type="button" className={styles.emptyAction} onClick={onStartTraining}>
            Start your first training session
          </button>
        </div>
      ) : (
        <>
          <div className={styles.exercisesList}>
            {exercises.map((exercise) => (
              <div key={exercise.id} className={styles.exerciseCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTime}>
                    {formatTime(exercise.date)}
                  </h3>

                  <span className={styles.badge}>
                    {exercise.conesCount} cones
                  </span>
                </div>

                <div className={styles.cardDetails}>
                  <p className={styles.detail}>
                    <span className={styles.label}>Duration:</span>
                    <span className={styles.value}>{exercise.duration}s</span>
                  </p>

                  <p className={styles.detail}>
                    <span className={styles.label}>Interval:</span>
                    <span className={styles.value}>{exercise.interval}s</span>
                  </p>
                </div>

                <div className={styles.colorSequence}>
                  <p className={styles.sequenceLabel}>Colors Called:</p>

                  <div className={styles.colorTags}>
                    {exercise.colorSequence.length > 0 ? (
                      exercise.colorSequence.map((color, idx) => (
                        <span key={idx} className={styles.colorTag}>
                          <span
                            className={styles.colorDot}
                            style={{ backgroundColor: color.color }}
                          />
                          {color.name}
                        </span>
                      ))
                    ) : (
                      <span className={styles.noColors}>-</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={clearHistory} className={styles.clearBtn}>
            <DeleteIcon size={18} />
            Clear History
          </button>
        </>
      )}

      {!isAndroid && (
        <p className={styles.storageNote}>
          <Info size={16} aria-hidden="true" />
          <span>Saved in this browser only. Clearing browser data removes your history.</span>
        </p>
      )}
    </div>
  );
}
