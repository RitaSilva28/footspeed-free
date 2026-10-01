import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const code = ts.transpileModule(readFileSync(new URL('../src/lib/exerciseClock.ts', import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { startExerciseClock } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

function harness(duration = 10, interval = 1) {
  let now = 0;
  let id = 0;
  const tasks = new Map();
  const countdown = [], calls = [], updates = [], completions = [];
  const cancel = startExerciseClock({
    duration, interval,
    onCountdown: value => countdown.push([now, value]),
    onCall: () => calls.push(now),
    onUpdate: (remaining, nextCall) => updates.push([now, remaining, nextCall]),
    onComplete: () => completions.push(now),
  }, {
    now: () => now,
    schedule: (callback, delay) => { tasks.set(++id, { callback, due: now + delay }); return id; },
    cancel: id => tasks.delete(id),
  });
  function advance(target, lag = 0) {
    while (tasks.size) {
      const [id, task] = [...tasks].sort((a, b) => a[1].due - b[1].due)[0];
      const delivery = Math.max(now, task.due + lag);
      if (delivery > target) break;
      tasks.delete(id);
      now = delivery;
      task.callback();
    }
    now = target;
  }
  return { countdown, calls, updates, completions, cancel, advance,
    stall: target => { now = target; advance(target); } };
}

test('3, 2, 1 then first color at exercise start; no end-boundary color', () => {
  const h = harness();
  h.advance(14000);
  assert.deepEqual(h.countdown, [[0,3],[1000,2],[2000,1]]);
  assert.deepEqual(h.calls, Array.from({length:10}, (_, i) => 3000 + i * 1000));
  assert.deepEqual(h.completions, [13000]);
  assert.deepEqual(h.updates[0], [3000,10,1]);
});

test('callback latency does not accumulate over a five-minute exercise', () => {
  const h = harness(300, 3);
  h.advance(304000, 17);
  assert.equal(h.calls.length, 100);
  h.calls.forEach((time, i) => assert.ok(time >= 3000 + i * 3000 && time - (3000 + i * 3000) < 70));
  assert.equal(h.completions.length, 1);
  assert.ok(h.completions[0] >= 303000 && h.completions[0] < 303070);
});

test('stalled callbacks skip missed calls and retain original finish time', () => {
  const h = harness();
  h.advance(3100);
  h.stall(7600);
  assert.deepEqual(h.calls, [3000,7600]);
  assert.deepEqual(h.updates.at(-1), [7600,6,1]);
  h.advance(14000);
  assert.deepEqual(h.completions, [13000]);
});

test('resuming after the deadline completes once without another voice call', () => {
  const h = harness();
  h.advance(3100);
  h.stall(20000);
  h.advance(25000);
  assert.deepEqual(h.calls, [3000]);
  assert.deepEqual(h.completions, [20000]);
});

test('cancellation during countdown or exercise prevents further callbacks', () => {
  for (const when of [500, 3500]) {
    const h = harness();
    h.advance(when);
    h.cancel();
    const before = JSON.stringify([h.countdown,h.calls,h.updates]);
    h.advance(20000);
    assert.equal(JSON.stringify([h.countdown,h.calls,h.updates]), before);
    assert.deepEqual(h.completions, []);
  }
});

test('duration not divisible by interval still finishes at the exact duration', () => {
  const h = harness(10,3);
  h.advance(20000);
  assert.deepEqual(h.calls, [3000,6000,9000,12000]);
  assert.deepEqual(h.completions, [13000]);
});
