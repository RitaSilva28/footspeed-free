import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { sourceLoader } from './load-source.mjs';

const loader = sourceLoader();
after(loader.cleanup);
const { createPreferences, setConeCount, updateCone, createExerciseSettings, pickCone, createCompletedExercise } = await loader.load('src/lib/cones.ts');
const { loadSettings, saveLocal, loadHistory, SETTINGS_KEY, HISTORY_KEY } = await loader.load('src/lib/storage.ts');
const { default: Settings } = await loader.load('src/components/Settings.tsx');
const { default: ConeEditor } = await loader.load('src/components/ConeEditor.tsx');
const { startExerciseClock } = await loader.load('src/lib/exerciseClock.ts');
const data = new Map();
globalThis.localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };

test('new users get six defaults; old saved custom settings migrate intact', () => {
  assert.equal(createPreferences(null).coneCount, 6);
  const legacy = { duration: 90, interval: 2, cones: createPreferences(null).cones };
  legacy.cones[5] = { id: '6', name: 'Finish line', color: '#123456' };
  saveLocal(SETTINGS_KEY, legacy);
  const restored = loadSettings();
  assert.equal(restored.coneCount, 6);
  assert.deepEqual(restored.cones, legacy.cones);
  assert.equal(restored.duration, 90);
  assert.equal(restored.interval, 2);
});

test('counts 2–6 render exactly that many editable cards and select the saved radio', () => {
  for (let count = 2; count <= 6; count++) {
    const prefs = setConeCount(createPreferences(null), count);
    saveLocal(SETTINGS_KEY, prefs);
    const markup = renderToStaticMarkup(createElement(Settings, { onStartExercise() {} }));
    assert.equal((markup.match(/class="coneCard"/g) ?? []).length, count);
    assert.equal((markup.match(/aria-label="Edit cone /g) ?? []).length, count);
    assert.match(markup, new RegExp(`checked=""[^>]*value="${count}"|value="${count}"[^>]*checked=""`));
    assert.equal(createExerciseSettings(prefs).cones.length, count);
  }
});

test('count changes and restart preserve hidden custom names and hex values', () => {
  let prefs = updateCone(createPreferences(null), '6', 'Finish line', '#ABC123');
  prefs = updateCone(prefs, '1', 'Left marker', '#112233');
  prefs = setConeCount(prefs, 2);
  assert.equal(saveLocal(SETTINGS_KEY, prefs), true);
  prefs = loadSettings();
  assert.equal(prefs.coneCount, 2);
  assert.equal(prefs.cones.length, 6);
  prefs = setConeCount(prefs, 6);
  assert.deepEqual(prefs.cones[5], { id: '6', name: 'Finish line', color: '#ABC123' });
  assert.equal(prefs.cones[0].name, 'Left marker');
});

test('random callouts select only active cones, preserve duplicate labels and swatches', () => {
  let prefs = updateCone(createPreferences(null), '1', 'Marker', '#123456');
  prefs = updateCone(prefs, '2', 'Marker', '#654321');
  for (let count = 2; count <= 6; count++) {
    const settings = createExerciseSettings(setConeCount(prefs, count));
    for (let i = 0; i < count; i++) {
      assert.deepEqual(pickCone(settings, () => (i + 0.5) / count), prefs.cones[i]);
    }
    assert.equal(pickCone(settings, () => 0).color, '#123456');
    assert.equal(pickCone(settings, () => 1.5 / count).color, '#654321');
    assert.equal(pickCone(settings, () => 0.99999).id, String(count));
  }
});

test('completed sessions store physical cone count and independent configuration/call snapshots', () => {
  const prefs = setConeCount(createPreferences(null), 2);
  const settings = createExerciseSettings(prefs);
  const sequence = Array.from({ length: 10 }, () => ({ name: 'Red', color: '#FF0000' }));
  const session = createCompletedExercise(settings, sequence);
  prefs.cones[0].name = 'Changed setting';
  settings.cones[0].name = 'Changed live session';
  sequence[0].name = 'Changed sequence';
  assert.equal(session.conesCount, 2);
  assert.equal(session.configuredCones.length, 2);
  assert.equal(session.configuredCones[0].name, 'Red');
  assert.equal(session.colorSequence[0].name, 'Red');
  saveLocal(HISTORY_KEY, [session]);
  assert.deepEqual(loadHistory().exercises[0], session);
});

test('old history is preserved without requiring new snapshot fields', () => {
  const legacy = { id: 'old', date: new Date(), duration: 60, interval: 3, conesCount: 20, colorSequence: [] };
  saveLocal(HISTORY_KEY, [legacy]);
  assert.deepEqual(loadHistory().exercises[0], legacy);
});

test('editor exposes a labelled dialog, name/TTS help, color picker, hex entry and cancel', () => {
  const markup = renderToStaticMarkup(createElement(ConeEditor, {
    cone: createPreferences(null).cones[0], number: 1, onSave() {}, onDismiss() {},
  }));
  assert.match(markup, /aria-labelledby="cone-editor-title"/);
  assert.match(markup, /for="cone-name"/);
  assert.match(markup, /announced during training/);
  assert.match(markup, /type="color"/);
  assert.match(markup, /id="cone-hex"/);
  assert.match(markup, />Cancel</);
});

test('exercise clock integration calls only configured labels and preserves timing/count snapshot', () => {
  for (let count = 2; count <= 6; count++) {
    const prefs = updateCone(setConeCount(createPreferences(null), count), '1', 'Custom cue', '#123456');
    const settings = createExerciseSettings({ ...prefs, duration: 10, interval: 1 });
    const spoken = [], sequence = [];
    let now = 0, pending, session;
    startExerciseClock({
      duration: settings.duration, interval: settings.interval,
      onCountdown: value => spoken.push([now, String(value)]),
      onCall: () => {
        const cone = pickCone(settings, () => (sequence.length % count + 0.5) / count);
        spoken.push([now, cone.name]);
        sequence.push({ name: cone.name, color: cone.color });
      },
      onUpdate() {}, onComplete: () => { session = createCompletedExercise(settings, sequence); },
    }, { now: () => now, schedule: (callback, delay) => { pending = { callback, due: now + delay }; return 1; }, cancel() {} });
    while (pending) { const task = pending; pending = null; now = task.due; task.callback(); }
    assert.equal(now, 13000);
    assert.deepEqual(spoken[3], [3000, 'Custom cue']);
    assert.equal(session.conesCount, count);
    assert.equal(session.colorSequence.length, 10);
    assert.ok(session.colorSequence.every(color => settings.cones.some(cone => cone.name === color.name && cone.color === color.color)));
  }
});

test('corrupt preferences safely fall back and invalid counts are not applied', () => {
  data.set(SETTINGS_KEY, '{broken');
  assert.equal(loadSettings(), null);
  const prefs = createPreferences(null);
  assert.equal(setConeCount(prefs, 7), prefs);
  assert.equal(setConeCount(prefs, 1), prefs);
});
