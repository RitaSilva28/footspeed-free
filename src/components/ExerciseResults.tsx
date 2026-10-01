import { useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react';
import type { CompletedExercise } from '../types';
import styles from './Exercise.module.css';

export default function ExerciseResults({ exercise, onDismiss }: {
  exercise: CompletedExercise;
  onDismiss: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    const back = (event: Event) => { event.preventDefault(); onDismiss(); };
    window.addEventListener('footspeed:back', back);
    return () => {
      element.close();
      window.removeEventListener('footspeed:back', back);
    };
  }, [onDismiss]);

  return (
    <dialog ref={dialog} className={styles.resultsDialog} aria-labelledby="results-title"
      onCancel={event => { event.preventDefault(); onDismiss(); }}>
      <CheckCircle size={36} className={styles.resultsIcon} aria-hidden="true" />
      <h2 id="results-title">Exercise ended</h2>
      <p className={styles.resultsIntro}>Here’s your training summary.</p>
      <dl className={styles.resultsStats}>
        <div><dt>Duration</dt><dd>{Math.floor(exercise.duration / 60)}:{String(exercise.duration % 60).padStart(2, '0')}</dd></div>
        <div><dt>Call interval</dt><dd>{exercise.interval}s</dd></div>
        <div><dt>Cones used</dt><dd>{exercise.conesCount}</dd></div>
        <div><dt>Total callouts</dt><dd>{exercise.colorSequence.length}</dd></div>
      </dl>
      <button className={styles.resultsDone} onClick={onDismiss} autoFocus>Back to Training</button>
    </dialog>
  );
}
