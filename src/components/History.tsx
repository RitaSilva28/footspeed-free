import { Trash as DeleteIcon } from "lucide-react";
import type { CompletedExercise } from "../types";
import styles from "./History.module.css";

interface HistoryScreenProps {
  exercises: CompletedExercise[];
  onBack: () => void;
  onClearHistory: () => void;
}

export default function HistoryScreen({
  exercises,
  onBack,
  onClearHistory,
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

        <button onClick={onBack} className={styles.backBtn}>
          ← Back
        </button>
      </div>

      <p>Exercises are saved only in this browser. Clearing browser data removes them.</p>

      {exercises.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No exercises yet. Start training!</p>
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
    </div>
  );
}