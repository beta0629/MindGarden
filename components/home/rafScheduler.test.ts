import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetRafSchedulerForTests,
  getDebugPumpCount,
  markDirty,
  setContinuous,
  subscribe,
  unsubscribe,
} from './rafScheduler';

type RafCb = (now: number) => void;

describe('rafScheduler', () => {
  let scheduleCount = 0;
  let nextId = 1;
  const pending = new Map<number, RafCb>();

  beforeEach(() => {
    scheduleCount = 0;
    nextId = 1;
    pending.clear();

    vi.stubGlobal(
      'requestAnimationFrame',
      (cb: RafCb): number => {
        const id = nextId++;
        scheduleCount += 1;
        pending.set(id, cb);
        return id;
      },
    );
    vi.stubGlobal('cancelAnimationFrame', (id: number): void => {
      pending.delete(id);
    });

    __resetRafSchedulerForTests();
  });

  afterEach(() => {
    __resetRafSchedulerForTests();
    vi.unstubAllGlobals();
  });

  function flushOneFrame(now = 16): void {
    const first = pending.entries().next().value as
      | [number, RafCb]
      | undefined;
    if (!first) {
      throw new Error('expected a scheduled rAF');
    }
    const [id, cb] = first;
    pending.delete(id);
    cb(now);
  }

  it('schedules exactly one rAF per frame when callback calls setContinuous', () => {
    subscribe(
      'gate',
      () => {
        setContinuous('gate', true);
      },
      { continuous: true },
    );

    expect(scheduleCount).toBe(1);

    for (let frame = 0; frame < 12; frame += 1) {
      const before = scheduleCount;
      flushOneFrame(frame * 16);
      expect(scheduleCount - before).toBe(1);
    }

    expect(scheduleCount).toBe(13);
    expect(getDebugPumpCount()).toBe(12);
    unsubscribe('gate');
  });

  it('schedules exactly one rAF per frame when callback calls markDirty', () => {
    subscribe('hero', () => {
      markDirty('hero');
    });

    expect(scheduleCount).toBe(1);

    for (let frame = 0; frame < 8; frame += 1) {
      const before = scheduleCount;
      flushOneFrame(frame * 16);
      expect(scheduleCount - before).toBe(1);
    }

    expect(scheduleCount).toBe(9);
    expect(getDebugPumpCount()).toBe(8);
    unsubscribe('hero');
  });

  it('shares state via globalThis singleton across duplicate module handles', () => {
    const g = globalThis as typeof globalThis & {
      __mgRafScheduler?: { entries: Map<string, unknown> };
    };
    expect(g.__mgRafScheduler).toBeDefined();

    subscribe('shared', () => {
      markDirty('shared');
    });
    expect(g.__mgRafScheduler?.entries.has('shared')).toBe(true);
    expect(scheduleCount).toBe(1);

    unsubscribe('shared');
    expect(g.__mgRafScheduler?.entries.has('shared')).toBe(false);
  });
});
