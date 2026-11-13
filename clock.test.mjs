import assert from 'node:assert/strict';
import { test } from 'node:test';
import activate, { deactivate } from './clock.mjs';

function mockSettings(t, format = 'locale') {
  return {
    get: t.mock.fn(async () => format),
    onDidChange: t.mock.fn(() => ({ dispose: t.mock.fn() })),
  };
}

test('shows local hours and minutes immediately, advances, and stops on deactivation', async t => {
  const now = new Date(2026, 10, 13, 23, 59, 59);
  t.mock.timers.enable({ apis: ['Date', 'setInterval'], now: now.getTime() });
  t.after(deactivate);
  const call = t.mock.fn(() => Promise.resolve({ ok: true }));
  const settings = mockSettings(t);
  const api = { host: { call }, log: t.mock.fn(), settings };
  const expected = () => ['statusBar.update', {
    id: 'clock',
    text: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
  }];

  await activate(api);
  assert.equal(call.mock.callCount(), 1);
  assert.deepEqual(call.mock.calls[0].arguments, expected());
  const firstText = call.mock.calls[0].arguments[1].text;

  t.mock.timers.tick(1000);
  await Promise.resolve();
  assert.equal(call.mock.callCount(), 2);
  assert.deepEqual(call.mock.calls[1].arguments, expected());
  assert.notEqual(call.mock.calls[1].arguments[1].text, firstText);

  deactivate();
  assert.equal(settings.onDidChange.mock.calls[0].result.dispose.mock.callCount(), 1);
  t.mock.timers.tick(60_000);
  await Promise.resolve();
  assert.equal(call.mock.callCount(), 2);

  await activate(api);
  assert.equal(call.mock.callCount(), 3);
  t.mock.timers.tick(1000);
  await Promise.resolve();
  assert.equal(call.mock.callCount(), 4);
});

test('logs a refused update and continues refreshing', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  t.after(deactivate);
  const call = t.mock.fn(() => Promise.resolve({ ok: true }));
  call.mock.mockImplementationOnce(() => Promise.reject(new Error('unavailable')));
  const log = t.mock.fn();

  await activate({ host: { call }, log, settings: mockSettings(t) });
  assert.match(log.mock.calls[0].arguments[0], /Clock update failed: Error: unavailable/);
  t.mock.timers.tick(1000);
  await Promise.resolve();
  assert.equal(call.mock.callCount(), 2);
  assert.equal(log.mock.callCount(), 1);
});

test('applies each hour format at startup and immediately when settings change', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setInterval'], now: new Date(2026, 10, 13, 0, 5).getTime() });
  t.after(deactivate);
  const settings = mockSettings(t, '24-hour');
  const call = t.mock.fn(async () => ({ ok: true }));
  await activate({ host: { call }, log: t.mock.fn(), settings });
  assert.equal(settings.get.mock.calls[0].arguments[0], 'hourFormat');
  const changed = settings.onDidChange.mock.calls[0].arguments[0];
  const expected = hour12 => new Date().toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', hour12,
  });
  assert.equal(call.mock.calls.at(-1).arguments[1].text, expected(false));
  for (const [format, hour12] of [['12-hour', true], ['locale', undefined]]) {
    settings.get.mock.mockImplementation(async () => format);
    const count = call.mock.callCount();
    await changed({ key: 'hourFormat' });
    assert.equal(call.mock.callCount(), count + 1);
    assert.equal(call.mock.calls.at(-1).arguments[1].text, expected(hour12));
  }
});
