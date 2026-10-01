// A short synthesized bell, available offline without another dependency.
// Construct during the Start gesture to satisfy mobile audio activation rules.
export function createFinishSound() {
  let context: AudioContext | undefined;
  try {
    context = new AudioContext();
    void context.resume().catch(() => {});
  } catch { /* Speech and the results dialog still work without Web Audio. */ }
  return {
    play() {
      if (!context || context.state !== 'running') return;
      const now = context.currentTime;
      [880, 1760, 2640].forEach((frequency, index) => {
        const oscillator = context!.createOscillator();
        const gain = context!.createGain();
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18 / (index + 1), now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        oscillator.connect(gain);
        gain.connect(context!.destination);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now);
        oscillator.stop(now + 0.65);
      });
    },
    dispose() { void context?.close().catch(() => {}); },
  };
}
