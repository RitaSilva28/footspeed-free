interface Clock {
  now: () => number;
  schedule: (callback: () => void, delay: number) => number;
  cancel: (id: number) => void;
}

interface ExerciseClockOptions {
  duration: number;
  interval: number;
  onCountdown: (value: number) => void;
  onCall: () => void;
  onUpdate: (remaining: number, nextCall: number) => void;
  onComplete: () => void;
}

// All deadlines refer to one monotonic start time, not render/timer callbacks.
export function startExerciseClock(options: ExerciseClockOptions, clock: Clock = {
  now: () => performance.now(),
  schedule: (callback, delay) => window.setTimeout(callback, delay),
  cancel: (id) => window.clearTimeout(id),
}): () => void {
  const start = clock.now();
  const intervalMs = options.interval * 1000;
  const durationMs = options.duration * 1000;
  let timer: number | undefined;
  let stopped = false;
  let lastCountdown = 0;
  let lastSlot = -1;

  const tick = () => {
    if (stopped) return;
    const elapsed = clock.now() - start;
    if (elapsed < 3000) {
      const count = 3 - Math.floor(elapsed / 1000);
      if (count !== lastCountdown) {
        lastCountdown = count;
        options.onCountdown(count);
      }
    } else {
      const exerciseElapsed = elapsed - 3000;
      if (exerciseElapsed >= durationMs) {
        stopped = true;
        options.onComplete();
        return;
      }
      const slot = Math.floor(exerciseElapsed / intervalMs);
      if (slot !== lastSlot) {
        // After a stalled/backgrounded frame, skip stale calls instead of
        // speaking a burst of queued colors. Never extend the exercise.
        lastSlot = slot;
        options.onCall();
      }
      options.onUpdate(
        Math.ceil((durationMs - exerciseElapsed) / 1000),
        Math.ceil(((slot + 1) * intervalMs - exerciseElapsed) / 1000),
      );
    }
    if (!stopped) {
      // Recalculate the next display boundary from the original clock.
      const untilSecond = 1000 - ((clock.now() - start) % 1000);
      timer = clock.schedule(tick, Math.min(50, untilSecond));
    }
  };
  tick();
  return () => {
    stopped = true;
    if (timer !== undefined) clock.cancel(timer);
  };
}
