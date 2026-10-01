import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { sourceLoader } from './load-source.mjs';
const loader = sourceLoader();
after(() => loader.cleanup());

test('results use the completed snapshot and actual callout count', async () => {
  const { default: Results } = await loader.load('src/components/ExerciseResults.tsx');
  const html = renderToStaticMarkup(React.createElement(Results, {
    exercise: { duration: 75, interval: 3, conesCount: 4, colorSequence: Array(25).fill({ name: 'Red', color: '#ff0000' }) },
    onDismiss() {},
  }));
  for (const value of ['Exercise ended', '1:15', '3s', '<dd>4</dd>', '<dd>25</dd>', 'Back to Training', 'aria-labelledby="results-title"']) assert.ok(html.includes(value), value);
});

test('unsupported audio does not prevent completion', async () => {
  const { createFinishSound } = await loader.load('src/lib/finishSound.ts');
  const sound = createFinishSound();
  assert.doesNotThrow(() => { sound.play(); sound.dispose(); });
});
